// Build search indexes from processed games
// Phase 1 - POC with 5 masters

import fs from "fs";
import path from "path";
import { ChessPGN } from "@chess-pgn/chess-pgn";
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

const CHUNK_SIZE = 200000; // 200K games per chunk
const INPUT_FILE = "./data/pgn-downloads/processed-games.json";
const OUTPUT_DIR = "./data/indexes";

interface ProcessedData {
  games: GameMetadata[];
  deduplicationIndex: DeduplicationIndex;
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

function buildOpeningByFenIndex(games: GameMetadata[]): OpeningByFenIndex {
  console.log("\n🎯 Building Opening by FEN index...");

  const index: OpeningByFenIndex = {};

  for (const game of games) {
    // Get FEN after each move
    const chess = new ChessPGN();
    const moves = game.moves.split(/\d+\./).filter((m) => m.trim());

    for (const move of moves) {
      const trimmed = move.trim();
      if (trimmed) {
        try {
          chess.move(trimmed);
          const fen = chess.fen();

          if (!index[fen]) {
            index[fen] = [];
          }
          if (!index[fen].includes(game.idx)) {
            index[fen].push(game.idx);
          }
        } catch (error) {
          // Skip invalid moves
        }
      }
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique positions`);
  return index;
}

function buildOpeningByNameIndex(games: GameMetadata[]): OpeningByNameIndex {
  console.log("\n📖 Building Opening by Name index...");

  const index: OpeningByNameIndex = {};

  for (const game of games) {
    if (game.opening) {
      const normalized = game.opening.toLowerCase().trim();

      if (!index[normalized]) {
        index[normalized] = [];
      }
      index[normalized].push(game.idx);
    }
  }

  console.log(`  ✅ Indexed ${Object.keys(index).length} unique opening names`);
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

function buildSourceTracking(): SourceTracking {
  console.log("\n📋 Building Source tracking...");

  // For Phase 1, we only track pgnmentor sources
  const tracking: SourceTracking = {
    sources: {},
  };

  const MASTERS = ["Carlsen", "Kasparov", "Nakamura", "Anand", "Fischer"];

  for (const master of MASTERS) {
    const filename = `${master}.zip`;
    tracking.sources[filename] = {
      url: `https://www.pgnmentor.com/players/${filename}`,
      lastChecked: new Date().toISOString(),
      gameCount: 0, // Will be filled during processing
    };
  }

  console.log(`  ✅ Tracked ${Object.keys(tracking.sources).length} sources`);
  return tracking;
}

async function buildIndexes(): Promise<void> {
  console.log("🔨 Phase 1: Building search indexes\n");

  // Read processed games
  console.log(`📖 Reading: ${INPUT_FILE}`);
  const data: ProcessedData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  console.log(`  Found ${data.games.length} games\n`);

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
  const sourceTracking = buildSourceTracking();

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

  console.log(`  ${"Total indexes:".padEnd(30)} ${(totalSize / 1024).toFixed(2).padStart(10)} KB`);
  console.log(`  ${"Total chunks:".padEnd(30)} ${(chunkSize / 1024).toFixed(2).padStart(10)} KB`);
  console.log(`  ${"Grand total:".padEnd(30)} ${((totalSize + chunkSize) / 1024).toFixed(2).padStart(10)} KB`);

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
