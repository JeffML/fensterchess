// Get games for a specific master and selected openings
// Returns full game metadata for display in Games tab

import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes on cold start
let openingByNameIndex = null;
let gameToPlayersIndex = null;
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

async function loadOpeningByNameIndex() {
  if (!openingByNameIndex) {
    const store = getBlobStore();
    const data = await store.get("indexes/opening-by-name.json");
    openingByNameIndex = JSON.parse(data);
  }
  return openingByNameIndex;
}

async function loadGameToPlayersIndex() {
  if (!gameToPlayersIndex) {
    const store = getBlobStore();
    const data = await store.get("indexes/game-to-players.json");
    gameToPlayersIndex = JSON.parse(data);
  }
  return gameToPlayersIndex;
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

async function getGameFromChunk(gameId) {
  const chunkId = Math.floor(gameId / CHUNK_SIZE);
  const chunk = await loadChunk(chunkId);
  return chunk.games.find((g) => g.idx === gameId);
}

export const handler = async (event) => {
  // Authenticate request
  if (!authenticateRequest(event)) {
    return authFailureResponse;
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const {
      player, // Player name
      openings, // Comma-separated opening names
    } = event.queryStringParameters || {};

    if (!player) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameter: player" }),
      };
    }

    if (!openings) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameter: openings" }),
      };
    }

    const openingNames = openings.split(",").map((s) => s.trim());

    // Load indexes
    const openingIndex = await loadOpeningByNameIndex();
    const gameToPlayers = await loadGameToPlayersIndex();

    // Collect all game IDs for selected openings
    const allGameIds = new Set();
    for (const name of openingNames) {
      const openingData = openingIndex[name];
      if (openingData) {
        for (const gameId of openingData.gameIds) {
          allGameIds.add(gameId);
        }
      }
    }

    // Filter to games where player participated
    const playerGameIds = [];
    for (const gameId of allGameIds) {
      const players = gameToPlayers[gameId];
      if (players) {
        const [white, black] = players;
        if (white === player || black === player) {
          playerGameIds.push(gameId);
        }
      }
    }

    // Load full game metadata from chunks
    // First, determine which chunks we need and load them in parallel
    const uniqueChunkIds = new Set(
      playerGameIds.map((gameId) => Math.floor(gameId / CHUNK_SIZE)),
    );
    await Promise.all(
      Array.from(uniqueChunkIds).map((chunkId) => loadChunk(chunkId)),
    );

    // Now extract games from cached chunks
    const games = [];
    for (const gameId of playerGameIds) {
      const chunkId = Math.floor(gameId / CHUNK_SIZE);
      const chunk = chunksCache.get(chunkId);
      const game = chunk.games.find((g) => g.idx === gameId);
      if (game) {
        // Return metadata without moves (moves fetched separately via getMasterGameMoves)
        games.push({
          idx: game.idx,
          white: game.white,
          black: game.black,
          whiteElo: game.whiteElo,
          blackElo: game.blackElo,
          result: game.result,
          date: game.date,
          event: game.event,
          eco: game.eco,
          opening: game.ecoJsonOpening || game.opening,
        });
      }
    }

    // Sort by player name (White then Black alphabetically)
    games.sort((a, b) => {
      const aPlayer = a.white === player ? a.black : a.white;
      const bPlayer = b.white === player ? b.black : b.white;
      return aPlayer.localeCompare(bPlayer);
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        games,
        total: games.length,
        player,
        openings: openingNames,
      }),
    };
  } catch (error) {
    console.error("Error getting games by master and opening:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
