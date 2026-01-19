// Get all openings from master games database grouped by ECO category
// Returns openings organized by ECO letter (A, B, C, D, E)

import fs from "fs";
import { authenticateRequest, authFailureResponse } from "./utils/auth.js";

// Cache index on cold start
let openingByNameIndex = null;

function loadIndex() {
  if (!openingByNameIndex) {
    const indexPath = "data/indexes/opening-by-name.json";
    openingByNameIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  return openingByNameIndex;
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
    const index = loadIndex();

    // Group openings by ECO category letter
    const grouped = { A: [], B: [], C: [], D: [], E: [] };

    for (const [name, data] of Object.entries(index)) {
      const ecoLetter = data.eco.charAt(0).toUpperCase();
      if (grouped[ecoLetter]) {
        grouped[ecoLetter].push({
          name,
          fen: data.fen,
          eco: data.eco,
          gameCount: data.gameIds.length,
        });
      }
    }

    // Sort each category alphabetically by name
    for (const letter of Object.keys(grouped)) {
      grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
      body: JSON.stringify({
        openings: grouped,
        totalOpenings: Object.keys(index).length,
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
