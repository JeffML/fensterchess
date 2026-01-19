// Get games for a specific master and selected openings
// Returns full game metadata for display in Games tab

import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes on cold start
let openingByNameIndex = null;
let gameToPlayersIndex = null;
let chunksCache = new Map();

const CHUNK_SIZE = 4000;

function loadOpeningByNameIndex() {
  if (!openingByNameIndex) {
    const indexPath = "data/indexes/opening-by-name.json";
    openingByNameIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return openingByNameIndex;
}

function loadGameToPlayersIndex() {
  if (!gameToPlayersIndex) {
    const indexPath = "data/indexes/game-to-players.json";
    gameToPlayersIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return gameToPlayersIndex;
}

function loadChunk(chunkId) {
  if (!chunksCache.has(chunkId)) {
    const chunkPath = `data/indexes/chunk-${chunkId}.json`;
    const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf-8"));
    chunksCache.set(chunkId, chunk);
  }
  return chunksCache.get(chunkId);
}

function getGameFromChunk(gameId) {
  const chunkId = Math.floor(gameId / CHUNK_SIZE);
  const chunk = loadChunk(chunkId);
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
    const openingIndex = loadOpeningByNameIndex();
    const gameToPlayers = loadGameToPlayersIndex();

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
    const games = [];
    for (const gameId of playerGameIds) {
      const game = getGameFromChunk(gameId);
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
