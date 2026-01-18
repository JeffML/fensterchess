// Build search indexes from processed games
// Phase 1 - POC with 5 masters

import fs from "fs";
import path from "path";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import {
  openingBook,
  lookupByMoves,
  getPositionBook,
} from "@chess-openings/eco.json";
import type {
  GameMetadata,
  MasterIndex,
  GameIndexChunk,
  OpeningByFenIndex,
  OpeningByNameIndex,
  OpeningByEcoIndex,
  PlayerIndex,
  EventIndex,
  DateIndex,
  DeduplicationIndex,
  SourceTracking,
} from "./types.js";

// Netlify Blobs limit: 5 MB per blob
// ~1 KB per game → 4000 games = ~4 MB (with headroom for metadata)
const CHUNK_SIZE = 4000; // Games per chunk (keeps under 5 MB for Netlify Blobs)
const INPUT_FILE = "./data/pgn-downloads/processed-games.json";
const OUTPUT_DIR = "./data/indexes";

interface ProcessedData {
  games: GameMetadata[];
  deduplicationIndex: DeduplicationIndex;
  sourceTracking: SourceTracking;
}

function buildGameChunks(games: GameMetadata[]): {
  chunks: GameIndexChunk[];
  masterIndex: MasterIndex;
} {
  console.log("\n📦 Building game chunks...");

  const totalChunks = Math.ceil(games.length / CHUNK_SIZE);
  const chunks: GameIndexChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const startIdx = i * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, games.length);
    const chunkGames = games.slice(startIdx, endIdx);

    const chunk: GameIndexChunk = {
      version: "1.0",
      chunkId: i,
      totalChunks,
      startIdx,
      endIdx,
      games: chunkGames,
    };

    chunks.push(chunk);
    console.log(
      `  Chunk ${i}: ${chunkGames.length} games (idx ${startIdx}-${endIdx - 1})`
    );
  }

  const masterIndex: MasterIndex = {
    version: "1.0",
    totalGames: games.length,
    totalChunks,
    chunks: chunks.map((chunk) => ({
      id: chunk.chunkId,
      blobKey: `master-games/chunks/chunk-${chunk.chunkId}.json`,
      startIdx: chunk.startIdx,
      endIdx: chunk.endIdx,
    })),
  };

  console.log(`  ✅ Created ${chunks.length} chunks`);
  return { chunks, masterIndex };
}

async function enrichGamesWithEcoJson(
  games: GameMetadata[],
  openings: any,
  positionBook: any
): Promise<void> {
  console.log("\n🎯 Enriching games with eco.json opening matches...");

  let matched = 0;
  let unmatched = 0;
  const progressInterval = 1000;

  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    if ((i + 1) % progressInterval === 0) {
      process.stdout.write(`\r  Processing: ${i + 1}/${games.length} games...`);
    }

    try {
      // OPTIMIZATION: Parse moves manually instead of using loadPgn()
      // game.moves should contain just moves, but handle legacy data with headers too

      let movesText = game.moves;

      // Strip headers if present (legacy data compatibility)
      if (movesText.includes("[")) {
        movesText = movesText.replace(/^\[.*?\]\s*/gm, "").trim();
      }

      // Extract clean SAN moves
      const cleanMoves = movesText
        .replace(/\d+\.\s*/g, "") // Remove move numbers: "1." "2." etc.
        .replace(/1-0|0-1|1\/2-1\/2|\*/g, "") // Remove result tokens
        .replace(/\{[^}]*\}/g, "") // Remove comments
        .replace(/\([^)]*\)/g, "") // Remove variations
        .trim()
        .split(/\s+/)
        .filter((m) => m.length > 0 && m !== "");

      if (cleanMoves.length === 0) {
        unmatched++;
        continue;
      }

      // Execute moves to build game state for lookupByMoves
      const chess = new ChessPGN();
      for (const move of cleanMoves) {
        const result = chess.move(move);
        if (!result) {
          throw new Error(`Invalid move: ${move}`);
        }
      }

      // Store ply count and clean SAN moves
      game.ply = cleanMoves.length;
      game.moves = cleanMoves.join(" ");

      const result = lookupByMoves(chess, openings, { positionBook });

      if (result.opening) {
        // lookupByMoves restores the chess position after search,
        // so we need to find the FEN key in openingBook that corresponds to this opening
        let openingFen: string | undefined;
        for (const [fen, opening] of Object.entries(openings)) {
          if (opening === result.opening) {
            openingFen = fen;
            break;
          }
        }

        // Store eco.json match info with opening position FEN
        game.ecoJsonFen = openingFen || chess.fen(); // Fallback to current FEN if not found
        game.ecoJsonOpening = result.opening.name;
        game.ecoJsonEco = result.opening.eco;
        game.movesBack = result.movesBack;
        matched++;
      } else {
        unmatched++;
      }
    } catch (error) {
      unmatched++;
    }
  }

  process.stdout.write(
    `\r  Processing: ${games.length}/${games.length} games complete!\n`
  );
  console.log(
    `  ✅ Matched: ${matched} games (${((matched / games.length) * 100).toFixed(
      1
    )}%)`
  );
  console.log(`  ⚠️  Unmatched: ${unmatched} games`);
}

function buildOpeningByFenIndex(games: GameMetadata[]): OpeningByFenIndex {
  console.log("\n📖 Building Opening by FEN index (eco.json positions)...");

  const index: OpeningByFenIndex = {};

  for (const game of games) {
    if (game.ecoJsonFen) {
      if (!index[game.ecoJsonFen]) {
        index[game.ecoJsonFen] = [];
      }
      index[game.ecoJsonFen].push(game.idx);
    }
  }

  console.log(
    `  ✅ Indexed ${Object.keys(index).length} unique eco.json positions`
  );
  return index;
}

function buildOpeningByNameIndex(games: GameMetadata[]): OpeningByNameIndex {
  console.log("\n📖 Building Opening by Name index (eco.json names)...");

  const index: OpeningByNameIndex = {};

  for (const game of games) {
    // Use eco.json enriched opening name, FEN, and ECO
    const openingName = game.ecoJsonOpening;
    const fen = game.ecoJsonFen;
    const eco = game.ecoJsonEco;

    if (openingName && fen && eco) {
      if (!index[openingName]) {
        index[openingName] = {
          fen,
          eco,
          gameIds: [],
        };
      }
      index[openingName].gameIds.push(game.idx);
    }
  }

  console.log(
    `  ✅ Indexed ${Object.keys(index).length} unique eco.json opening names`
  );
  return index;
}

function buildOpeningByEcoIndex(games: GameMetadata[]): OpeningByEcoIndex {
  console.log("\n🔖 Building Opening by ECO index...");

  const index: OpeningByEcoIndex = {};

  for (const game of games) {
    if (game.eco) {
      if (!index[game.eco]) {
        index[game.eco] = [];
      }
      index[game.eco].push(game.idx);
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique ECO codes`);
  return index;
}

function buildPlayerIndex(games: GameMetadata[]): PlayerIndex {
  console.log("\n👤 Building Player index...");

  const index: PlayerIndex = {};

  for (const game of games) {
    // Index white player
    if (game.white) {
      const whiteName = game.white.toLowerCase().trim();
      if (!index[whiteName]) {
        index[whiteName] = { asWhite: [], asBlack: [], totalGames: 0 };
      }
      index[whiteName].asWhite.push(game.idx);
      index[whiteName].totalGames++;
    }

    // Index black player
    if (game.black) {
      const blackName = game.black.toLowerCase().trim();
      if (!index[blackName]) {
        index[blackName] = { asWhite: [], asBlack: [], totalGames: 0 };
      }
      index[blackName].asBlack.push(game.idx);
      index[blackName].totalGames++;
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique players`);
  return index;
}

function buildEventIndex(games: GameMetadata[]): EventIndex {
  console.log("\n🏆 Building Event index...");

  const index: EventIndex = {};

  for (const game of games) {
    if (game.event) {
      const normalized = game.event.toLowerCase().trim();

      if (!index[normalized]) {
        index[normalized] = [];
      }
      index[normalized].push(game.idx);
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique events`);
  return index;
}

function buildDateIndex(games: GameMetadata[]): DateIndex {
  console.log("\n📅 Building Date index...");

  const index: DateIndex = {};

  for (const game of games) {
    if (game.date) {
      const year = game.date.split(".")[0];
      if (year && year !== "????") {
        if (!index[year]) {
          index[year] = [];
        }
        index[year].push(game.idx);
      }
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique years`);
  return index;
}

async function buildIndexes(): Promise<void> {
  console.log("🔨 Phase 1: Building search indexes\n");

  // Read processed games
  console.log(`📖 Reading: ${INPUT_FILE}`);
  const data: ProcessedData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`  Found ${data.games.length} games\n`);

  // Load eco.json opening book
  console.log("📚 Loading eco.json opening book...");
  const openings = await openingBook();
  const positionBook = getPositionBook(openings);
  console.log(`  ✅ Loaded ${Object.keys(openings).length} openings\n`);

  // Enrich games with eco.json opening matches
  await enrichGamesWithEcoJson(data.games, openings, positionBook);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Build all indexes
  const { chunks, masterIndex } = buildGameChunks(data.games);
  const openingByFen = buildOpeningByFenIndex(data.games);
  const openingByName = buildOpeningByNameIndex(data.games);
  const openingByEco = buildOpeningByEcoIndex(data.games);
  const playerIndex = buildPlayerIndex(data.games);
  const eventIndex = buildEventIndex(data.games);
  const dateIndex = buildDateIndex(data.games);
  const sourceTracking = data.sourceTracking; // Read from processed data

  // Save indexes
  console.log("\n💾 Saving indexes...");

  // Game chunks
  for (const chunk of chunks) {
    const chunkPath = path.join(OUTPUT_DIR, `chunk-${chunk.chunkId}.json`);
    fs.writeFileSync(chunkPath, JSON.stringify(chunk, null, 2));
    console.log(`  ✅ ${chunkPath}`);
  }

  // Master index
  const masterPath = path.join(OUTPUT_DIR, "master-index.json");
  fs.writeFileSync(masterPath, JSON.stringify(masterIndex, null, 2));
  console.log(`  ✅ ${masterPath}`);

  // Search indexes
  const indexes = [
    { name: "opening-by-fen.json", data: openingByFen },
    { name: "opening-by-name.json", data: openingByName },
    { name: "opening-by-eco.json", data: openingByEco },
    { name: "player-index.json", data: playerIndex },
    { name: "event-index.json", data: eventIndex },
    { name: "date-index.json", data: dateIndex },
    { name: "deduplication-index.json", data: data.deduplicationIndex },
    { name: "source-tracking.json", data: sourceTracking },
  ];

  for (const index of indexes) {
    const indexPath = path.join(OUTPUT_DIR, index.name);
    fs.writeFileSync(indexPath, JSON.stringify(index.data, null, 2));
    console.log(`  ✅ ${indexPath}`);
  }

  // Calculate sizes
  console.log("\n📊 Index sizes:");
  const totalSize = indexes.reduce((sum, index) => {
    const indexPath = path.join(OUTPUT_DIR, index.name);
    const size = fs.statSync(indexPath).size;
    console.log(
      `  ${index.name.padEnd(30)} ${(size / 1024).toFixed(2).padStart(10)} KB`
    );
    return sum + size;
  }, 0);

  const chunkSize = chunks.reduce((sum, chunk) => {
    const chunkPath = path.join(OUTPUT_DIR, `chunk-${chunk.chunkId}.json`);
    return sum + fs.statSync(chunkPath).size;
  }, 0);

  console.log(
    `  ${"Total indexes:".padEnd(30)} ${(totalSize / 1024)
      .toFixed(2)
      .padStart(10)} KB`
  );
  console.log(
    `  ${"Total chunks:".padEnd(30)} ${(chunkSize / 1024)
      .toFixed(2)
      .padStart(10)} KB`
  );
  console.log(
    `  ${"Grand total:".padEnd(30)} ${((totalSize + chunkSize) / 1024)
      .toFixed(2)
      .padStart(10)} KB`
  );

  console.log("\n✅ Index building complete!");
  console.log("\nNext step: Upload to Netlify Blobs (requires netlify dev)");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildIndexes().catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
}

export { buildIndexes };
