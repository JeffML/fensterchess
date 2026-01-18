// Build game-to-players.json index from existing chunk files
// This is a lightweight index that maps gameId → [white, black]
// Used for fast player aggregation when selecting openings

import fs from "fs";
import path from "path";

const INDEXES_DIR = "./data/indexes";
const OUTPUT_FILE = path.join(INDEXES_DIR, "game-to-players.json");

interface GameInChunk {
  idx: number;
  white: string;
  black: string;
}

interface ChunkFile {
  games: GameInChunk[];
}

function buildGameToPlayers(): void {
  console.log("🎮 Building game-to-players.json index\n");

  // Find all chunk files
  const chunkFiles = fs
    .readdirSync(INDEXES_DIR)
    .filter((f) => f.startsWith("chunk-") && f.endsWith(".json"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/chunk-(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/chunk-(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  console.log(`📦 Found ${chunkFiles.length} chunk files`);

  // Build array indexed by gameId
  const gamePlayers: [string, string][] = [];

  for (const chunkFile of chunkFiles) {
    const chunkPath = path.join(INDEXES_DIR, chunkFile);
    console.log(`  Reading ${chunkFile}...`);

    const chunk: ChunkFile = JSON.parse(fs.readFileSync(chunkPath, "utf-8"));

    for (const game of chunk.games) {
      // Ensure array is large enough (games should be sequential but be safe)
      while (gamePlayers.length < game.idx) {
        gamePlayers.push(["", ""]); // Placeholder for missing indices
      }
      gamePlayers[game.idx] = [game.white, game.black];
    }
  }

  console.log(`\n✅ Indexed ${gamePlayers.length} games`);

  // Save index
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gamePlayers));

  const size = fs.statSync(OUTPUT_FILE).size;
  console.log(`💾 Saved: ${OUTPUT_FILE} (${(size / 1024).toFixed(2)} KB)`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildGameToPlayers();
}

export { buildGameToPlayers };
