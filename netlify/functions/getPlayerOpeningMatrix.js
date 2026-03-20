/**
 * Get player-opening chord diagram data.
 *
 * Returns the player-eco-matrix index (all qualifying players with ECO decade
 * breakdowns) plus the opening-by-name index grouped by ECO letter/decade for
 * the opening selector panel.
 *
 * Query params:
 *   players (optional) — comma-separated lowercase player names; if supplied,
 *                         only those entries are returned from the matrix so the
 *                         payload stays small. Omit to get the full player list
 *                         (used to populate the selector).
 *
 * Returns:
 *   {
 *     matrix: PlayerEcoMatrix,          // player ECO breakdown
 *     openings: {                        // grouped for the opening selector
 *       [ecoLetter]: [{ name, eco, decade, games }]
 *     }
 *   }
 */

import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Module-level cache (persists across warm invocations)
let playerEcoMatrix = null;
let openingByNameIndex = null;
let gameToPlayersIndex = null;
let blobStore = null;

function getBlobStore() {
  if (!blobStore) {
    const siteID = process.env.SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    blobStore =
      siteID && token
        ? getStore({ name: "master-games", siteID, token })
        : getStore("master-games");
  }
  return blobStore;
}

async function loadIndexes() {
  const store = getBlobStore();

  if (!playerEcoMatrix) {
    const data = await store.get("indexes/player-eco-matrix.json");
    if (!data)
      throw new Error("player-eco-matrix.json not found in blob store");
    playerEcoMatrix = JSON.parse(data);
  }

  if (!openingByNameIndex) {
    const data = await store.get("indexes/opening-by-name.json");
    if (!data) throw new Error("opening-by-name.json not found in blob store");
    openingByNameIndex = JSON.parse(data);
  }

  if (!gameToPlayersIndex) {
    const data = await store.get("indexes/game-to-players.json");
    if (!data) throw new Error("game-to-players.json not found in blob store");
    gameToPlayersIndex = JSON.parse(data);
  }

  return { playerEcoMatrix, openingByNameIndex, gameToPlayersIndex };
}

/**
 * Group openings by ECO letter then decade for the opening selector panel.
 * Each entry: { name, eco, ecoLetter, decade, games }
 */
function buildOpeningGroups(openingByName) {
  const ECO_LETTERS = ["A", "B", "C", "D", "E"];
  const groups = Object.fromEntries(ECO_LETTERS.map((l) => [l, []]));

  for (const [name, entry] of Object.entries(openingByName)) {
    const eco = entry.eco ?? "";
    const letter = eco[0]?.toUpperCase();
    if (!letter || !groups[letter]) continue;

    const numericStr = eco.slice(1); // "90" from "B90"
    const numericVal = parseInt(numericStr, 10);
    const decade = isNaN(numericVal) ? 0 : Math.floor(numericVal / 10);

    groups[letter].push({
      name,
      eco,
      ecoLetter: letter,
      decade,
      games: Array.isArray(entry.gameIds)
        ? entry.gameIds.length
        : (entry.games ?? 0),
    });
  }

  // Sort each group: by game count descending, then name
  for (const letter of ECO_LETTERS) {
    groups[letter].sort(
      (a, b) => b.games - a.games || a.name.localeCompare(b.name),
    );
  }

  return groups;
}

export const handler = async (event) => {
  if (!authenticateRequest(event)) return authFailureResponse;

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const {
      playerEcoMatrix: matrix,
      openingByNameIndex: openingByName,
      gameToPlayersIndex: gameToPlayers,
    } = await loadIndexes();

    const playersParam = event.queryStringParameters?.players;
    const letterParam = event.queryStringParameters?.letter?.toUpperCase();
    const decadeParam = event.queryStringParameters?.decade;

    // Band-scoped request: ?players=...&letter=B&decade=9
    // Returns only the filtered opening list for that decade, for those players.
    if (playersParam && letterParam && decadeParam !== undefined) {
      const decade = parseInt(decadeParam, 10);
      const requested = playersParam
        .split("|")
        .map((s) => s.trim().toLowerCase())
        .filter((k) => matrix.players[k]);

      const displayNames = new Set(
        requested.map((k) => matrix.players[k].displayName),
      );

      // Filter opening-by-name to this ECO letter+decade, then count player games
      // using direct array access on gameToPlayers (matches getGamesByMasterAndOpening pattern)
      const result = [];
      for (const [name, entry] of Object.entries(openingByName)) {
        const eco = entry.eco ?? "";
        if (!eco.startsWith(letterParam)) continue;
        const numericVal = parseInt(eco.slice(1), 10);
        if (isNaN(numericVal) || Math.floor(numericVal / 10) !== decade) continue;
        const matchCount = (entry.gameIds ?? []).filter((id) => {
          const players = gameToPlayers[id];
          return players && (displayNames.has(players[0]) || displayNames.has(players[1]));
        }).length;
        if (matchCount === 0) continue;
        result.push({ name, eco, ecoLetter: letterParam, decade, games: matchCount, fen: entry.fen ?? null });
      }
      result.sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openings: result }),
      };
    }

    // Default: full matrix + all opening groups (no player filter used here)
    const openings = buildOpeningGroups(openingByName);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix, openings }),
    };
  } catch (err) {
    console.error("getPlayerOpeningMatrix error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message ?? "Internal server error" }),
    };
  }
};
