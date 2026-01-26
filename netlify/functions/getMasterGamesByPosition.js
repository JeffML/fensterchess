/**
 * Query master games by FEN position with ANCESTOR-TO-DESCENDANTS fallback
 *
 * Purpose: Find all openings and games that pass through a given position.
 * Use when: You have a root/intermediate position (e.g., 1.e4) and want to see
 * all named openings that branch from it (French, Sicilian, Caro-Kann, etc.).
 *
 * Fallback chain:
 * 1. Exact FEN match in opening-by-fen index
 * 2. Position-only match (ignores turn/castling/en-passant)
 * 3. Ancestor-to-descendants lookup - finds all descendant positions with games
 *
 * TODO: Add "look UP the tree" fallback for positions that are continuations of
 * named openings but not named themselves. Example: 1.b3 d6 has no named opening,
 * but should inherit games from 1.b3 (Nimzo-Larsen Attack). Would require:
 * - Receiving move history or chess instance to walk back
 * - Or building a descendant-to-ancestors index
 *
 * Example: 1.e4 position → returns Sicilian, French, Caro-Kann, etc. openings
 *
 * For exact terminal position matching only, use queryMasterGamesByFen instead.
 *
 * Returns: { openings, masters, totalGames, usedAncestorFallback }
 */

import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes on cold start
let openingByFenIndex = null;
let openingByNameIndex = null;
let ancestorToDescendantsIndex = null;
let gameToPlayersIndex = null;

function loadOpeningByFenIndex() {
  if (!openingByFenIndex) {
    const indexPath = "data/indexes/opening-by-fen.json";
    openingByFenIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return openingByFenIndex;
}

function loadOpeningByNameIndex() {
  if (!openingByNameIndex) {
    const indexPath = "data/indexes/opening-by-name.json";
    openingByNameIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return openingByNameIndex;
}

function loadAncestorToDescendantsIndex() {
  if (!ancestorToDescendantsIndex) {
    const indexPath = "data/indexes/ancestor-to-descendants.json";
    ancestorToDescendantsIndex = JSON.parse(
      fs.readFileSync(indexPath, "utf-8"),
    );
  }
  return ancestorToDescendantsIndex;
}

function loadGameToPlayersIndex() {
  if (!gameToPlayersIndex) {
    const indexPath = "data/indexes/game-to-players.json";
    gameToPlayersIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return gameToPlayersIndex;
}

function getPositionFen(fen) {
  // Extract position-only (first field) for matching
  return fen.split(" ")[0];
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
      fen,
      fallbackFen,
      page = "0",
      pageSize = "25",
      sortBy = "name", // "name" or "gameCount"
      sortOrder = "asc", // "asc" or "desc"
    } = event.queryStringParameters || {};

    if (!fen) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameter: fen" }),
      };
    }

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const positionFen = getPositionFen(fen);

    // Load indexes
    const fenIndex = loadOpeningByFenIndex();
    const nameIndex = loadOpeningByNameIndex();
    const ancestorIndex = loadAncestorToDescendantsIndex();
    const gameToPlayers = loadGameToPlayersIndex();

    // Collect matching FENs and game IDs
    const matchingFens = [];
    let allGameIds = new Set();
    let usedAncestorFallback = false;

    // Try direct FEN match first
    if (fenIndex[fen]) {
      matchingFens.push(fen);
      for (const gameId of fenIndex[fen]) {
        allGameIds.add(gameId);
      }
    }

    // Try position-only match
    if (matchingFens.length === 0) {
      for (const [indexedFen, gameIds] of Object.entries(fenIndex)) {
        if (getPositionFen(indexedFen) === positionFen) {
          matchingFens.push(indexedFen);
          for (const gameId of gameIds) {
            allGameIds.add(gameId);
          }
        }
      }
    }

    // If still no matches, try ancestor fallback
    if (matchingFens.length === 0 && ancestorIndex[positionFen]) {
      usedAncestorFallback = true;
      const descendantFens = ancestorIndex[positionFen];
      for (const descendantFen of descendantFens) {
        if (fenIndex[descendantFen]) {
          matchingFens.push(descendantFen);
          for (const gameId of fenIndex[descendantFen]) {
            allGameIds.add(gameId);
          }
        }
      }
    }

    // If still no matches and we have a fallback FEN (nearest known opening), use that
    let usedFallbackFen = false;
    if (matchingFens.length === 0 && fallbackFen) {
      const fallbackPositionFen = getPositionFen(fallbackFen);
      // Try exact match on fallback FEN
      if (fenIndex[fallbackFen]) {
        usedFallbackFen = true;
        matchingFens.push(fallbackFen);
        for (const gameId of fenIndex[fallbackFen]) {
          allGameIds.add(gameId);
        }
      } else {
        // Try position-only match on fallback
        for (const [indexedFen, gameIds] of Object.entries(fenIndex)) {
          if (getPositionFen(indexedFen) === fallbackPositionFen) {
            usedFallbackFen = true;
            matchingFens.push(indexedFen);
            for (const gameId of gameIds) {
              allGameIds.add(gameId);
            }
          }
        }
      }
    }

    // Build openings list from matching FENs
    const openingsMap = new Map();
    for (const [name, data] of Object.entries(nameIndex)) {
      if (matchingFens.includes(data.fen)) {
        openingsMap.set(name, {
          name,
          fen: data.fen,
          eco: data.eco,
          gameCount: data.gameIds.length,
        });
      }
    }
    const openings = Array.from(openingsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

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
      }),
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

    // Paginate masters
    const totalMasters = masters.length;
    const start = pageNum * pageSizeNum;
    const paginatedMasters = masters.slice(start, start + pageSizeNum);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        openings,
        masters: paginatedMasters,
        totalMasters,
        totalGames: allGameIds.size,
        page: pageNum,
        pageSize: pageSizeNum,
        usedAncestorFallback,
        usedFallbackFen,
        matchedPositions: matchingFens.length,
      }),
    };
  } catch (error) {
    console.error("Error getting master games by position:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
