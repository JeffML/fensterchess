// Get masters who played selected openings with game counts
// Returns paginated list of players with aggregated game counts

import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes on cold start
let openingByNameIndex = null;
let gameToPlayersIndex = null;

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
      openings, // Comma-separated opening names
      page = "0",
      pageSize = "25",
      sortBy = "name", // "name" or "gameCount"
      sortOrder = "asc", // "asc" or "desc"
    } = event.queryStringParameters || {};

    if (!openings) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required parameter: openings",
        }),
      };
    }

    const openingNames = openings.split(",").map((s) => s.trim());
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

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

    // Aggregate game counts per player
    const playerCounts = new Map();
    for (const gameId of allGameIds) {
      const players = gameToPlayers[gameId];
      if (players) {
        const [white, black] = players;
        if (white) {
          playerCounts.set(white, (playerCounts.get(white) || 0) + 1);
        }
        if (black) {
          playerCounts.set(black, (playerCounts.get(black) || 0) + 1);
        }
      }
    }

    // Convert to array and sort
    let masters = Array.from(playerCounts.entries()).map(
      ([playerName, gameCount]) => ({
        playerName,
        gameCount,
      })
    );

    // Sort based on parameters
    if (sortBy === "gameCount") {
      masters.sort((a, b) => {
        const diff = a.gameCount - b.gameCount;
        return sortOrder === "desc" ? -diff : diff;
      });
    } else {
      // Default: sort by name
      masters.sort((a, b) => {
        const diff = a.playerName.localeCompare(b.playerName);
        return sortOrder === "desc" ? -diff : diff;
      });
    }

    // Paginate
    const total = masters.length;
    const start = pageNum * pageSizeNum;
    const paginatedMasters = masters.slice(start, start + pageSizeNum);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        masters: paginatedMasters,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalGames: allGameIds.size,
      }),
    };
  } catch (error) {
    console.error("Error getting masters by openings:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
