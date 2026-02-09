// Get all openings from master games database grouped by ECO category
// Returns openings organized by ECO letter (A, B, C, D, E), then by ECO code

import { getStore } from "@netlify/blobs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache indexes on cold start
let openingByNameIndex = null;
let ecoRootsIndex = null;
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

async function loadIndexes() {
  const store = getBlobStore();

  if (!openingByNameIndex) {
    const data = await store.get("indexes/opening-by-name.json");
    openingByNameIndex = JSON.parse(data);
  }
  if (!ecoRootsIndex) {
    const data = await store.get("indexes/eco-roots.json");
    ecoRootsIndex = JSON.parse(data);
  }
  return { openingByNameIndex, ecoRootsIndex };
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
    const { openingByNameIndex, ecoRootsIndex } = await loadIndexes();

    // First, group all openings by ECO code
    const byEcoCode = {};

    for (const [name, data] of Object.entries(openingByNameIndex)) {
      const eco = data.eco;
      if (!byEcoCode[eco]) {
        byEcoCode[eco] = [];
      }
      byEcoCode[eco].push({
        name,
        fen: data.fen,
        eco: data.eco,
        gameCount: data.gameIds.length,
      });
    }

    // Build hierarchical structure: ECO letter → ECO codes with root + children
    const grouped = { A: [], B: [], C: [], D: [], E: [] };

    for (const [eco, openings] of Object.entries(byEcoCode)) {
      const ecoLetter = eco.charAt(0).toUpperCase();
      if (!grouped[ecoLetter]) continue;

      // Get the root info for this ECO code
      const rootInfo = ecoRootsIndex[eco];
      const rootName = rootInfo ? rootInfo.name : eco;
      const rootFen = rootInfo?.fen;

      // Find if the root opening exists in our master games
      const rootOpening = openings.find((o) => o.fen === rootFen);

      // Separate root from children
      const children = openings.filter((o) => o.fen !== rootFen);

      // Sort children by name
      children.sort((a, b) => a.name.localeCompare(b.name));

      // Calculate total games for this ECO code
      const totalGames = openings.reduce((sum, o) => sum + o.gameCount, 0);

      grouped[ecoLetter].push({
        eco,
        rootName,
        rootFen,
        rootOpening: rootOpening || null, // The root opening if it exists in master games
        children, // Other openings with same ECO code
        totalGames,
      });
    }

    // Sort ECO codes within each category
    for (const letter of Object.keys(grouped)) {
      grouped[letter].sort((a, b) => a.eco.localeCompare(b.eco));
    }

    // Count totals
    let totalEcoCodes = 0;
    let totalOpenings = 0;
    for (const codes of Object.values(grouped)) {
      totalEcoCodes += codes.length;
      for (const code of codes) {
        totalOpenings += (code.rootOpening ? 1 : 0) + code.children.length;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
      body: JSON.stringify({
        openings: grouped,
        totalEcoCodes,
        totalOpenings,
      }),
    };
  } catch (error) {
    console.error("Error loading master game openings:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
