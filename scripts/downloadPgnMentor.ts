// Download PGN files from pgnmentor.com
// Phase 1 - POC with 5 masters

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { shouldImportGame } from "./filterGame.js";
import { hashGame } from "./hashGame.js";
import { indexPgnGames } from "@chess-pgn/chess-pgn";
import type { GameMetadata, DeduplicationIndex } from "./types.js";

const DOWNLOAD_DIR = "./data/pgn-downloads";
const THROTTLE_MS = 10000; // 10 seconds between downloads
const USER_AGENT =
  "Fenster Chess Opening Explorer (https://fensterchess.com) - Educational research project";

// Phase 1: POC with 5 masters
const MASTERS = [
  { name: "Carlsen", filename: "Carlsen.zip" },
  { name: "Kasparov", filename: "Kasparov.zip" },
  { name: "Nakamura", filename: "Nakamura.zip" },
  { name: "Anand", filename: "Anand.zip" },
  { name: "Fischer", filename: "Fischer.zip" },
];

interface ProcessedGames {
  games: GameMetadata[];
  deduplicationIndex: DeduplicationIndex;
  stats: {
    total: number;
    accepted: number;
    rejected: number;
    duplicates: number;
  };
}

/**
 * Parse PGN headers from text
 */
function parseHeaders(pgnText: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgnText)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

/**
 * Extract moves from PGN text (after headers, before result)
 */
function extractMoves(pgnText: string): string {
  // Remove headers
  let movesSection = pgnText.replace(/\[[\s\S]*?\]\s*/g, "");
  // Remove comments and variations
  movesSection = movesSection.replace(/\{[^}]*\}/g, "");
  movesSection = movesSection.replace(/\([^)]*\)/g, "");
  // Remove NAGs
  movesSection = movesSection.replace(/\$\d+/g, "");
  // Remove result marker
  movesSection = movesSection.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, "");
  // Clean up whitespace
  return movesSection.replace(/\s+/g, " ").trim();
}

/**
 * Count moves (ply)
 */
function countPly(moves: string): number {
  // Count SAN moves (ignoring move numbers)
  const sanMoves = moves.match(/[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[+#]?|O-O(-O)?/g);
  return sanMoves ? sanMoves.length : 0;
}

/**
 * Generate hash for deduplication (white|black|date|moves)
 */
function generateHash(headers: Record<string, string>, moves: string): string {
  const white = (headers.White || "").toLowerCase().trim();
  const black = (headers.Black || "").toLowerCase().trim();
  const date = (headers.Date || "").trim();
  const normalized = `${white}|${black}|${date}|${moves}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(
  url: string,
  outputPath: string
): Promise<boolean> {
  try {
    console.log(`  Downloading: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error(`  ❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    console.log(`  ✅ Downloaded: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
    return true;
  } catch (error) {
    console.error(`  ❌ Download failed:`, error);
    return false;
  }
}

function extractZip(zipPath: string): string | null {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find PGN file
    const pgnEntry = entries.find((entry) => entry.entryName.endsWith(".pgn"));

    if (!pgnEntry) {
      console.error("  ❌ No PGN file found in ZIP");
      return null;
    }

    console.log(`  📦 Extracting: ${pgnEntry.entryName}`);
    return zip.readAsText(pgnEntry);
  } catch (error) {
    console.error(`  ❌ Extraction failed:`, error);
    return null;
  }
}

async function processGames(
  pgnContent: string,
  sourceFile: string,
  deduplicationIndex: DeduplicationIndex,
  gameIndex: number
): Promise<{
  games: GameMetadata[];
  nextIndex: number;
  stats: { total: number; accepted: number; rejected: number; duplicates: number };
}> {
  const games: GameMetadata[] = [];
  const stats = {
    total: 0,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
  };

  console.log(`  Parsing games with workers...`);
  
  // Use indexPgnGames with workers for fast parallel processing
  const cursor = indexPgnGames(pgnContent, { 
    workers: 4,
    workerBatchSize: 100 
  });

  let processed = 0;
  const progressInterval = 100;

  try {
    for await (const game of cursor) {
      stats.total++;
      processed++;

      if (processed % progressInterval === 0) {
        process.stdout.write(`\r  Processing: ${processed} games...`);
      }

      try {
        const headers = game.headers;
        
        // Apply filtering
        if (!shouldImportGame(game)) {
          stats.rejected++;
          continue;
        }

        // Check for duplicates (hash based on headers only, no moves needed)
        const hash = hashGame(headers);
        if (deduplicationIndex[hash] !== undefined) {
          stats.duplicates++;
          continue;
        }

        // Game is accepted - now extract moves from PGN text
        const pgnChunk = pgnContent.slice(game.startOffset, game.endOffset);
        const movesMatch = pgnChunk.match(/\n\n(.+?)(?:\s+(?:1-0|0-1|1\/2-1\/2|\*))?$/s);
        const movesText = movesMatch ? movesMatch[1].trim() : "";
        
        // Count moves (rough estimate based on move numbers)
        const plyCount = (movesText.match(/\d+\./g) || []).length * 2;

        const metadata: GameMetadata = {
          idx: gameIndex,
          white: headers.White || "Unknown",
          black: headers.Black || "Unknown",
          whiteElo: parseInt(headers.WhiteElo || "0"),
          blackElo: parseInt(headers.BlackElo || "0"),
          result: headers.Result || "*",
          date: headers.Date || "????.??.??",
          event: headers.Event || "Unknown",
          site: headers.Site || "?",
          eco: headers.ECO,
          opening: headers.Opening,
          moves: movesText,
          ply: plyCount,
          source: "pgnmentor",
          sourceFile,
          hash,
        };

        games.push(metadata);
        deduplicationIndex[hash] = gameIndex;
        gameIndex++;
        stats.accepted++;
      } catch (error) {
        stats.rejected++;
      }
    }
  } finally {
    process.stdout.write(`\r  Processing: ${stats.total} games complete!\n`);
  }

  return { games, nextIndex: gameIndex, stats };
}

async function downloadAndProcessMasters(): Promise<ProcessedGames> {
  console.log("🎯 Phase 1: Downloading and processing 5 masters\n");
  console.log(`Throttle: ${THROTTLE_MS / 1000} seconds between downloads`);
  console.log(`User-Agent: ${USER_AGENT}\n`);

  // Create download directory
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const allGames: GameMetadata[] = [];
  const deduplicationIndex: DeduplicationIndex = {};
  let gameIndex = 0;

  const totalStats = {
    total: 0,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
  };

  for (let i = 0; i < MASTERS.length; i++) {
    const master = MASTERS[i];
    console.log(`\n[${i + 1}/${MASTERS.length}] Processing: ${master.name}`);

    const zipPath = path.join(DOWNLOAD_DIR, master.filename);
    const url = `https://www.pgnmentor.com/players/${master.filename}`;

    // Download
    const downloaded = await downloadFile(url, zipPath);
    if (!downloaded) {
      console.log(`  Skipping ${master.name} due to download failure`);
      continue;
    }

    // Extract
    const pgnContent = extractZip(zipPath);
    if (!pgnContent) {
      console.log(`  Skipping ${master.name} due to extraction failure`);
      continue;
    }

    // Process games
    console.log(`  Processing games...`);
    const { games, nextIndex, stats } = await processGames(
      pgnContent,
      master.filename,
      deduplicationIndex,
      gameIndex
    );

    allGames.push(...games);
    gameIndex = nextIndex;

    // Update total stats
    totalStats.total += stats.total;
    totalStats.accepted += stats.accepted;
    totalStats.rejected += stats.rejected;
    totalStats.duplicates += stats.duplicates;

    console.log(`  ✅ Accepted: ${stats.accepted}`);
    console.log(`  ❌ Rejected: ${stats.rejected}`);
    console.log(`  🔁 Duplicates: ${stats.duplicates}`);

    // Throttle (except after last download)
    if (i < MASTERS.length - 1) {
      console.log(`  ⏱️  Waiting ${THROTTLE_MS / 1000} seconds...`);
      await sleep(THROTTLE_MS);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Final Statistics");
  console.log("=".repeat(50));
  console.log(`Total games found: ${totalStats.total}`);
  console.log(`Accepted: ${totalStats.accepted}`);
  console.log(`Rejected: ${totalStats.rejected} (${((totalStats.rejected / totalStats.total) * 100).toFixed(1)}%)`);
  console.log(`Duplicates: ${totalStats.duplicates}`);
  console.log(`Unique games indexed: ${allGames.length}`);
  console.log("=".repeat(50) + "\n");

  return {
    games: allGames,
    deduplicationIndex,
    stats: totalStats,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAndProcessMasters()
    .then((result) => {
      console.log("✅ Download and processing complete!");
      console.log(`Processed data ready for indexing: ${result.games.length} games`);

      // Save to temporary file for buildIndexes script
      const outputPath = path.join(DOWNLOAD_DIR, "processed-games.json");
      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          {
            games: result.games,
            deduplicationIndex: result.deduplicationIndex,
          },
          null,
          2
        )
      );
      console.log(`\n💾 Saved to: ${outputPath}`);
      console.log("\nNext step: Run buildIndexes.ts to create search indexes");
    })
    .catch((error) => {
      console.error("❌ Failed:", error);
      process.exit(1);
    });
}

export { downloadAndProcessMasters };
