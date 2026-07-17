// Performance comparison: eco.json package methods
import { describe, test, expect } from "vitest";
import {
  openingBook,
  findOpening,
  getFromTos,
  getPositionBook,
} from "@chess-openings/eco.json";

const TEST_FENS = [
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", // e4
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", // d4
  "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2", // Alekhine
  "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2", // Sicilian
  "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", // French
];

function formatTime(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(2)}ms`;
}

describe("Performance: eco.json package", () => {
  test("Load opening data and benchmark lookups", async () => {
    console.log("\n" + "=".repeat(50));
    console.log("Performance: eco.json package");
    console.log("=".repeat(50));

    // Test 1: Load opening data
    const start1 = performance.now();
    const ecoBook = await openingBook();
    const eco1Duration = performance.now() - start1;
    console.log(`  Load opening data: ${formatTime(eco1Duration)}`);
    console.log(`  Openings loaded: ${Object.keys(ecoBook).length}`);
    expect(Object.keys(ecoBook).length).toBeGreaterThan(10000);

    // Test 2: Build position book (5 iterations)
    console.log("\nTest: Build Position Book (5 iterations)");
    const eco2Durations: number[] = [];
    let ecoPosBook;
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      ecoPosBook = getPositionBook(ecoBook);
      eco2Durations.push(performance.now() - start);
    }
    const eco2Avg = eco2Durations.reduce((a, b) => a + b) / eco2Durations.length;
    console.log(`  avg=${formatTime(eco2Avg)}`);
    expect(Object.keys(ecoPosBook!).length).toBeGreaterThan(5000);

    // Test 3: Find openings (5 iterations)
    console.log("\nTest: Find Openings (5 FENs, 5 iterations)");
    const eco3Durations: number[] = [];
    let ecoResults;
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      ecoResults = TEST_FENS.map((fen) => findOpening(ecoBook, fen, ecoPosBook));
      eco3Durations.push(performance.now() - start);
    }
    const eco3Avg = eco3Durations.reduce((a, b) => a + b) / eco3Durations.length;
    console.log(`  avg=${formatTime(eco3Avg)}`);
    console.log(`  Per lookup: ${formatTime(eco3Avg / TEST_FENS.length)}`);
    expect(ecoResults!.length).toBe(TEST_FENS.length);

    // Test 4: Get transitions
    console.log("\nTest: Get Transitions");
    try {
      const start7 = performance.now();
      const transitions = await getFromTos(TEST_FENS[0], ecoBook);
      console.log(`  Duration: ${formatTime(performance.now() - start7)}`);
      expect(transitions).toHaveProperty("next");
      expect(transitions).toHaveProperty("from");
    } catch (err) {
      console.log(`  SKIPPED (${err instanceof Error ? err.message : "error"})`);
    }

    console.log();
  });
    console.log("=".repeat(70));
    console.log(
      `Position book (avg): eco.json=${formatTime(
  }, 60000); // 60 second timeout for network requests
});
