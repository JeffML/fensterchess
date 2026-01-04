// Download PGN files from multiple sources
// Phase 1 - POC with pgnmentor.com (5 masters) + Lichess Elite

import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { shouldImportGame } from "./filterGame.js";
import { hashGame } from "./hashGame.js";
import { indexPgnGames, ChessPGN } from "@chess-pgn/chess-pgn";
import type {
  GameMetadata,
  DeduplicationIndex,
  SourceTracking,
} from "./types.js";

const DOWNLOAD_DIR = "./data/pgn-downloads";
const THROTTLE_MS = 10000; // 10 seconds between downloads
const USER_AGENT =
  "Fenster Chess Opening Explorer (https://fensterchess.com) - Educational research project";

// Source 1: pgnmentor.com - 5 masters
// Temporarily disabled - using existing processed-games.json
const MASTERS: { name: string; filename: string }[] = [
  // { name: "Carlsen", filename: "Carlsen.zip" },
  // { name: "Kasparov", filename: "Kasparov.zip" },
  // { name: "Nakamura", filename: "Nakamura.zip" },
  // { name: "Anand", filename: "Anand.zip" },
  // { name: "Fischer", filename: "Fischer.zip" },
];

// Source 2: Lichess Elite Database (2400+ rated games)
// https://database.nikonoel.fr/
// Note: Files are distributed as .zip (not .zst as originally documented)
const LICHESS_ELITE = [
  // Start with 1 month POC - December 2024
  {
    name: "Lichess Elite Dec 2024",
    filename: "lichess_elite_2024-12.zip",
    url: "https://database.nikonoel.fr/lichess_elite_2024-12.zip",
  },
];

interface ProcessedGames {
  games: GameMetadata[];
  deduplicationIndex: DeduplicationIndex;
  sourceTracking: SourceTracking;
  stats: {
    total: number;
    accepted: number;
    rejected: number;
    duplicates: number;
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(url: string, outputPath: string): Promise<boolean> {
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
  gameIndex: number,
  filterOptions?: { requireTitles?: boolean }
): Promise<{
  games: GameMetadata[];
  nextIndex: number;
  stats: {
    total: number;
    accepted: number;
    rejected: number;
    duplicates: number;
  };
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
    workerBatchSize: 100,
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
        
        if (!headers) {
          stats.rejected++;
          continue;
        }

        // Apply filtering (pass options for site-specific rules)
        if (!shouldImportGame(game, filterOptions)) {
          stats.rejected++;
          continue;
        }

        // Check for duplicates (hash based on headers only, no moves needed)
        const hash = hashGame(headers);
        if (deduplicationIndex[hash] !== undefined) {
          stats.duplicates++;
          continue;
        }

        // Game is accepted - extract just the moves section (not headers)
        const pgnChunk = pgnContent.slice(game.startOffset, game.endOffset);

        // Strip headers - find where moves start (after last header line and blank line)
        const movesSectionMatch = pgnChunk.match(/\n\n(.+)/s);
        const movesOnly = movesSectionMatch
          ? movesSectionMatch[1].trim()
          : pgnChunk;

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
          variation: headers.Variation,
          subVariation: headers.SubVariation,
          moves: movesOnly, // Store only moves section (no headers)
          ply: 0, // Will be calculated in buildIndexes
          source: "pgnmentor",
          sourceFile,
          hash,
        };

        games.push(metadata);
        deduplicationIndex[hash] = gameIndex;
        gameIndex++;
        stats.accepted++;
      } catch (error) {
        // Error processing this game
        stats.rejected++;
      }
    }
  } finally {
    process.stdout.write(`\r  Processing: ${stats.total} games complete!\n`);
  }

  return { games, nextIndex: gameIndex, stats };
}

async function downloadAndProcessMasters(): Promise<ProcessedGames> {
  console.log("🎯 Processing master games database\n");
  console.log(`Throttle: ${THROTTLE_MS / 1000} seconds between downloads`);
  console.log(`User-Agent: ${USER_AGENT}\n`);

  // Create download directory
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Load existing processed-games.json if it exists (preserves pgnmentor data)
  let allGames: GameMetadata[] = [];
  let deduplicationIndex: DeduplicationIndex = {};
  let sourceTracking: SourceTracking = { sources: {} };
  let gameIndex = 0;

  const processedGamesPath = path.join(DOWNLOAD_DIR, "processed-games.json");
  if (fs.existsSync(processedGamesPath)) {
    console.log("📂 Loading existing processed-games.json...");
    const existing: ProcessedGames = JSON.parse(
      fs.readFileSync(processedGamesPath, "utf-8")
    );
    allGames = existing.games;
    deduplicationIndex = existing.deduplicationIndex;
    sourceTracking = existing.sourceTracking;
    gameIndex = allGames.length;
    console.log(`  ✅ Loaded ${allGames.length} existing games\n`);
  }

  const totalStats = {
    total: 0,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
  };

  const downloadDate = new Date().toISOString();

  // Process pgnmentor masters (ZIP files)
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

    // Track source metadata
    const zipSize = fs.statSync(zipPath).size;

    // Extract
    const pgnContent = extractZip(zipPath);
    if (!pgnContent) {
      console.log(`  Skipping ${master.name} due to extraction failure`);
      continue;
    }

    // Process games (pgnmentor: no title requirement)
    console.log(`  Processing games...`);
    const { games, nextIndex, stats } = await processGames(
      pgnContent,
      master.filename,
      deduplicationIndex,
      gameIndex,
      { requireTitles: false }
    );

    allGames.push(...games);
    gameIndex = nextIndex;

    // Update total stats
    totalStats.total += stats.total;
    totalStats.accepted += stats.accepted;
    totalStats.rejected += stats.rejected;
    totalStats.duplicates += stats.duplicates;

    // Record source tracking
    sourceTracking.sources[master.filename] = {
      url,
      lastChecked: downloadDate,
      size: zipSize,
      gameCount: stats.accepted,
    };

    console.log(`  ✅ Accepted: ${stats.accepted}`);
    console.log(`  ❌ Rejected: ${stats.rejected}`);
    console.log(`  🔁 Duplicates: ${stats.duplicates}`);

    // Throttle (except after last download)
    if (i < MASTERS.length - 1) {
      console.log(`  ⏱️  Waiting ${THROTTLE_MS / 1000} seconds...`);
      await sleep(THROTTLE_MS);
    }
  }

  // Process Lichess Elite database (ZIP files, same as pgnmentor)
  for (let i = 0; i < LICHESS_ELITE.length; i++) {
    const source = LICHESS_ELITE[i];
    console.log(
      `\n[${i + 1}/${LICHESS_ELITE.length}] Processing: ${source.name}`
    );

    const zipPath = path.join(DOWNLOAD_DIR, source.filename);

    // Download
    const downloaded = await downloadFile(source.url, zipPath);
    if (!downloaded) {
      console.log(`  Skipping ${source.name} due to download failure`);
      continue;
    }

    // Track source metadata
    const zipSize = fs.statSync(zipPath).size;

    // Extract
    const pgnContent = extractZip(zipPath);
    if (!pgnContent) {
      console.log(`  Skipping ${source.name} due to extraction failure`);
      continue;
    }

    // Process games (Lichess: require titled players)
    console.log(`  Processing games...`);
    const { games, nextIndex, stats } = await processGames(
      pgnContent,
      source.filename,
      deduplicationIndex,
      gameIndex,
      { requireTitles: true }
    );

    allGames.push(...games);
    gameIndex = nextIndex;

    // Update total stats
    totalStats.total += stats.total;
    totalStats.accepted += stats.accepted;
    totalStats.rejected += stats.rejected;
    totalStats.duplicates += stats.duplicates;

    // Record source tracking
    sourceTracking.sources[source.filename] = {
      url: source.url,
      lastChecked: downloadDate,
      size: zipSize,
      gameCount: stats.accepted,
    };

    console.log(`  ✅ Accepted: ${stats.accepted}`);
    console.log(`  ❌ Rejected: ${stats.rejected}`);
    console.log(`  🔁 Duplicates: ${stats.duplicates}`);

    // Throttle (except after last source)
    if (i < LICHESS_ELITE.length - 1) {
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
  console.log(
    `Rejected: ${totalStats.rejected} (${(
      (totalStats.rejected / totalStats.total) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`Duplicates: ${totalStats.duplicates}`);
  console.log(`Unique games indexed: ${allGames.length}`);
  console.log("=".repeat(50) + "\n");

  return {
    games: allGames,
    deduplicationIndex,
    sourceTracking,
    stats: totalStats,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAndProcessMasters()
    .then((result) => {
      console.log("✅ Download and processing complete!");
      console.log(
        `Processed data ready for indexing: ${result.games.length} games`
      );

      // Save to temporary file for buildIndexes script
      const outputPath = path.join(DOWNLOAD_DIR, "processed-games.json");
      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          {
            games: result.games,
            deduplicationIndex: result.deduplicationIndex,
            sourceTracking: result.sourceTracking,
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
