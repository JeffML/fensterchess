import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Load chunk metadata to find which chunk contains which game IDs
let chunkMetadata = null;

function loadChunkMetadata() {
  if (chunkMetadata) return chunkMetadata;

  const dataDir = "data/indexes";
  const files = fs.readdirSync(dataDir).filter((f) => f.startsWith("chunk-"));

  chunkMetadata = {};
  files.forEach((file) => {
    const chunkPath = `${dataDir}/${file}`;
    const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf8"));
    chunk.games.forEach((game) => {
      chunkMetadata[game.idx] = { file, chunkPath };
    });
  });

  return chunkMetadata;
}

export const handler = async (event) => {
  // Auth check
  const isAuthenticated = authenticateRequest(event);
  if (!isAuthenticated) {
    return authFailureResponse();
  }

  const gameId = parseInt(event.queryStringParameters?.gameId);

  if (!gameId || isNaN(gameId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid gameId parameter" }),
    };
  }

  try {
    const metadata = loadChunkMetadata();
    const chunkInfo = metadata[gameId];

    if (!chunkInfo) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Game not found" }),
      };
    }

    // Load the chunk and find the game
    const chunk = JSON.parse(fs.readFileSync(chunkInfo.chunkPath, "utf8"));
    const game = chunk.games.find((g) => g.idx === gameId);

    if (!game || !game.moves) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Game moves not found" }),
      };
    }

    // Append result token to moves if not already present
    let movesWithResult = game.moves;
    if (game.result && !movesWithResult.includes(game.result)) {
      movesWithResult = `${game.moves} ${game.result}`;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        gameId: game.idx,
        moves: movesWithResult,
        white: game.white,
        black: game.black,
        whiteElo: game.whiteElo,
        blackElo: game.blackElo,
        whiteTitle: game.whiteTitle,
        blackTitle: game.blackTitle,
        event: game.event,
        date: game.date,
        result: game.result,
      }),
    };
  } catch (error) {
    console.error("Error loading game moves:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
