// Query master games database by FEN position
// Returns paginated list of games matching the position

import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Load indexes on cold start
let openingByFenIndex = null;
let chunksCache = new Map();

function loadIndex() {
  if (!openingByFenIndex) {
    const indexPath = "data/indexes/opening-by-fen.json";
    openingByFenIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return openingByFenIndex;
}

function loadChunk(chunkId) {
  if (!chunksCache.has(chunkId)) {
    const chunkPath = `data/indexes/chunk-${chunkId}.json`;
    const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf-8"));
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

    // Load FEN index
    const index = loadIndex();

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

    // Load games from chunks
    const games = [];
    for (const gameId of paginatedIds) {
      // Game IDs are sequential - determine which chunk they're in
      // Each chunk has 4000 games (chunk-0: 0-3999, chunk-1: 4000-7999, etc.)
      const chunkId = Math.floor(gameId / 4000);
      const chunk = loadChunk(chunkId);

      // Find game in chunk
      const game = chunk.games.find((g) => g.idx === gameId);
      if (game) {
        // Return only metadata (not full PGN moves)
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
        titleRank[a.blackTitle] || 99
      );
      const bMaxTitle = Math.min(
        titleRank[b.whiteTitle] || 99,
        titleRank[b.blackTitle] || 99
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
