import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Load chunk metadata to find which chunk contains which game IDs
let chunksCache = new Map();
let blobStore = null;

const CHUNK_SIZE = 4000;

function getBlobStore() {
  if (!blobStore) {
    const siteID = process.env.SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (siteID && token) {
      blobStore = getStore({
        name: "master-games",
        siteID,
        token,
      });
    } else {
      blobStore = getStore("master-games");
    }
  }
  return blobStore;
}

async function loadChunk(chunkId) {
  if (!chunksCache.has(chunkId)) {
    const store = getBlobStore();
    const data = await store.get(`indexes/chunk-${chunkId}.json`);
    const chunk = JSON.parse(data);
    chunksCache.set(chunkId, chunk);
  }
  return chunksCache.get(chunkId);
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
    // Calculate which chunk contains this game ID using formula
    const chunkId = Math.floor(gameId / CHUNK_SIZE);

    // Load the chunk and find the game
    const chunk = await loadChunk(chunkId);
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
