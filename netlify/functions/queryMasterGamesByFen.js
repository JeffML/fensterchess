// Force reload - v3 with Netlify Blobs
/**
 * Query master games by EXACT FEN position match
 *
 * Purpose: Find games indexed at a specific named opening position.
 * Use when: You have a terminal/named opening position and want games at that exact position.
 *
 * Fallback: Position-only matching (ignores turn/castling/en-passant metadata).
 * Does NOT search ancestor/descendant positions.
 *
 * Example: Sicilian Najdorf FEN → returns games indexed at Najdorf position
 *
 * For ancestor/root positions (e.g., 1.e4), use getMasterGamesByPosition instead,
 * which finds all descendant openings that branch from the given position.
 *
 * Returns: Paginated list of games with full metadata
 *
 * NOTE: Migrated from bundled JSON files to Netlify Blobs for better scalability.
 * Indexes are uploaded by fensterchess.tooling repository.
 */

import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes and chunks in memory during cold start
let openingByFenIndex = null;
let chunksCache = new Map();
let blobStore = null;

function getBlobStore() {
  if (!blobStore) {
    // Netlify Functions need explicit configuration for blobs
    // Environment variables should be set in Netlify dashboard
    const siteID = process.env.SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (siteID && token) {
      blobStore = getStore({
        name: "master-games",
        siteID,
        token,
      });
    } else {
      // Fallback to simple name (auto-config) if env vars not available
      blobStore = getStore("master-games");
    }
  }
  return blobStore;
}

async function loadIndex() {
  if (!openingByFenIndex) {
    const store = getBlobStore();
    const data = await store.get("indexes/opening-by-fen.json");
    openingByFenIndex = JSON.parse(data);
  }
  return openingByFenIndex;
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

function getPositionFen(fen) {
  // Extract position-only (first field) for fallback matching
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
      page = "0",
      pageSize = "20",
    } = event.queryStringParameters || {};

    if (!fen) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameter: fen" }),
      };
    }

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    // Load FEN index from Blobs
    const index = await loadIndex();

    // Try exact FEN match first
    let gameIds = index[fen];

    // If no exact match, try position-only fallback
    if (!gameIds) {
      const positionFen = getPositionFen(fen);

      // Search for any FEN with matching position
      for (const [indexedFen, ids] of Object.entries(index)) {
        if (getPositionFen(indexedFen) === positionFen) {
          gameIds = ids;
          break;
        }
      }
    }

    if (!gameIds || gameIds.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
        body: JSON.stringify({
          games: [],
          total: 0,
          page: pageNum,
          pageSize: pageSizeNum,
        }),
      };
    }

    // Paginate game IDs
    const startIdx = pageNum * pageSizeNum;
    const endIdx = Math.min(startIdx + pageSizeNum, gameIds.length);
    const paginatedIds = gameIds.slice(startIdx, endIdx);

    // Load games from chunks (stored in Blobs)
    // First, determine which chunks we need and load them in parallel
    const uniqueChunkIds = new Set(
      paginatedIds.map((gameId) => Math.floor(gameId / 4000)),
    );
    await Promise.all(
      Array.from(uniqueChunkIds).map((chunkId) => loadChunk(chunkId)),
    );

    // Now extract games from cached chunks
    const games = [];
    for (const gameId of paginatedIds) {
      const chunkId = Math.floor(gameId / 4000);
      const chunk = chunksCache.get(chunkId);

      // Find game in chunk
      const game = chunk.games.find((g) => g.idx === gameId);
      if (game) {
        // Return metadata and moves for filtering
        games.push({
          idx: game.idx,
          white: game.white,
          black: game.black,
          whiteElo: game.whiteElo,
          blackElo: game.blackElo,
          whiteTitle: game.whiteTitle,
          blackTitle: game.blackTitle,
          result: game.result,
          date: game.date,
          event: game.event,
          eco: game.eco,
          opening: game.opening || game.ecoJsonOpening,
          ply: game.ply,
          source: game.source,
          moves: game.moves,
        });
      }
    }

    // Sort by title rank then rating
    const titleRank = {
      GM: 1,
      IM: 2,
      FM: 3,
      WGM: 4,
      WIM: 5,
      WFM: 6,
      CM: 7,
      WCM: 8,
      NM: 9,
      WNM: 10,
    };

    games.sort((a, b) => {
      // Sort by highest title first
      const aMaxTitle = Math.min(
        titleRank[a.whiteTitle] || 99,
        titleRank[a.blackTitle] || 99,
      );
      const bMaxTitle = Math.min(
        titleRank[b.whiteTitle] || 99,
        titleRank[b.blackTitle] || 99,
      );

      if (aMaxTitle !== bMaxTitle) {
        return aMaxTitle - bMaxTitle;
      }

      // Then by average rating
      const aAvgElo = (a.whiteElo + a.blackElo) / 2;
      const bAvgElo = (b.whiteElo + b.blackElo) / 2;
      return bAvgElo - aAvgElo;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
      body: JSON.stringify({
        games,
        total: gameIds.length,
        page: pageNum,
        pageSize: pageSizeNum,
      }),
    };
  } catch (error) {
    console.error("Query error:", error);
    console.error("Error stack:", error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
