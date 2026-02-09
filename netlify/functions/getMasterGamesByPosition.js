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

import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";
import fs from "fs";

// Cache indexes and blob store on cold start
let openingByFenIndex = null;
let openingByNameIndex = null;
let ancestorToDescendantsIndex = null;
let gameToPlayersIndex = null;
let blobStore = null;

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

async function loadOpeningByFenIndex() {
  // Build FEN→gameIds index from opening-by-name (eliminates 539 KB redundancy)
  if (!openingByFenIndex) {
    const nameIndex = await loadOpeningByNameIndex();
    openingByFenIndex = {};
    Object.values(nameIndex).forEach((opening) => {
      openingByFenIndex[opening.fen] = opening.gameIds;
    });
  }
  return openingByFenIndex;
}

async function loadAncestorToDescendantsIndex() {
  if (!ancestorToDescendantsIndex) {
    const store = getBlobStore();
    const data = await store.get("indexes/ancestor-to-descendants.json");
    ancestorToDescendantsIndex = JSON.parse(data);
  }
  return ancestorToDescendantsIndex;
}

async function loadGameToPlayersIndex() {
  if (!gameToPlayersIndex) {
    const store = getBlobStore();
    const data = await store.get("indexes/game-to-players.json");
    gameToPlayersIndex = JSON.parse(data);
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

    // Load indexes from blobs
    const fenIndex = await loadOpeningByFenIndex();
    const nameIndex = await loadOpeningByNameIndex();
    const gameToPlayers = await loadGameToPlayersIndex();

    // Load fromToPositionIndexed for finding continuations
    const fromToIndexed = JSON.parse(
      fs.readFileSync("data/fromToPositionIndexed.json", "utf-8"),
    );

    // Separate direct matches from continuations
    const directFens = [];
    const continuationFens = [];
    let directGameIds = new Set();
    let continuationGameIds = new Set();

    // Try direct FEN match first
    if (fenIndex[fen]) {
      directFens.push(fen);
      for (const gameId of fenIndex[fen]) {
        directGameIds.add(gameId);
      }
    }

    // Try position-only match (when exact FEN doesn't match but position does)
    if (directFens.length === 0) {
      for (const [indexedFen, gameIds] of Object.entries(fenIndex)) {
        if (getPositionFen(indexedFen) === positionFen) {
          directFens.push(indexedFen);
          for (const gameId of gameIds) {
            directGameIds.add(gameId);
          }
        }
      }
    }

    // Check for continuations using fromTo index (eco.json transitions)
    let hasDescendants = false;
    const continuationPositions = fromToIndexed.to[positionFen] || [];
    if (continuationPositions.length > 0) {
      hasDescendants = true;
      // For each continuation position, find master games
      for (const continuationFen of continuationPositions) {
        if (fenIndex[continuationFen]) {
          continuationFens.push(continuationFen);
          for (const gameId of fenIndex[continuationFen]) {
            continuationGameIds.add(gameId);
          }
        }
      }
    }

    // If no direct matches and no continuations, try fallback FEN
    let usedFallbackFen = false;
    if (
      directFens.length === 0 &&
      continuationFens.length === 0 &&
      fallbackFen
    ) {
      const fallbackPositionFen = getPositionFen(fallbackFen);
      // Try exact match on fallback FEN
      if (fenIndex[fallbackFen]) {
        usedFallbackFen = true;
        directFens.push(fallbackFen);
        for (const gameId of fenIndex[fallbackFen]) {
          directGameIds.add(gameId);
        }
      } else {
        // Try position-only match on fallback
        for (const [indexedFen, gameIds] of Object.entries(fenIndex)) {
          if (getPositionFen(indexedFen) === fallbackPositionFen) {
            usedFallbackFen = true;
            directFens.push(indexedFen);
            for (const gameId of gameIds) {
              directGameIds.add(gameId);
            }
          }
        }
      }
    }

    // Combine all game IDs for player aggregation
    const allGameIds = new Set([...directGameIds, ...continuationGameIds]);

    // Build reverse lookup: FEN → opening data
    const fenToOpening = new Map();
    for (const [name, data] of Object.entries(nameIndex)) {
      fenToOpening.set(data.fen, {
        name,
        eco: data.eco,
        gameIds: data.gameIds,
      });
    }

    // Build direct openings list
    const directOpeningsMap = new Map();
    for (const fen of directFens) {
      const opening = fenToOpening.get(fen);
      if (opening) {
        const gameCount = fenIndex[fen]?.length || 0;
        const uniqueKey = `${opening.name}|${opening.eco}|${fen}`;
        directOpeningsMap.set(uniqueKey, {
          name: opening.name,
          fen: fen,
          eco: opening.eco,
          gameCount: gameCount,
        });
      }
    }

    // Build continuation openings list
    const continuationOpeningsMap = new Map();
    for (const fen of continuationFens) {
      const opening = fenToOpening.get(fen);
      if (opening) {
        const gameCount = fenIndex[fen]?.length || 0;
        const uniqueKey = `${opening.name}|${opening.eco}|${fen}`;
        continuationOpeningsMap.set(uniqueKey, {
          name: opening.name,
          fen: fen,
          eco: opening.eco,
          gameCount: gameCount,
        });
      }
    }

    const openings = Array.from(directOpeningsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const continuations = Array.from(continuationOpeningsMap.values()).sort(
      (a, b) => a.name.localeCompare(b.name),
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
        continuations,
        masters: paginatedMasters,
        totalMasters,
        totalGames: allGameIds.size,
        directGames: directGameIds.size,
        continuationGames: continuationGameIds.size,
        page: pageNum,
        pageSize: pageSizeNum,
        hasDescendants,
        usedFallbackFen,
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
