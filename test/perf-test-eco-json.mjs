// Performance comparison: eco.json package vs fensterchess methods
import {
  openingBook,
  findOpening,
  getFromTos,
  getPositionBook,
} from "@chess-openings/eco.json";
import { getLatestEcoJson } from "./src/datasource/getLatestEcoJson.ts";
import { findOpening as fensterFindOpening } from "./src/datasource/findOpening.ts";
import { getPositionBook as fensterGetPositionBook } from "./src/datasource/positionBook.ts";

const TEST_FENS = [
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", // e4
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", // d4
  "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2", // Alekhine
  "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2", // Sicilian
  "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", // French
];

function formatTime(ms) {
  return ms < 1 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(2)}ms`;
}

async function measureAsync(name, fn) {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`  ${name}: ${formatTime(duration)}`);
  return { duration, result };
}

function measure(name, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(`  ${name}: ${formatTime(duration)}`);
  return { duration, result };
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("Performance Comparison: eco.json package vs fensterchess");
  console.log("=".repeat(70));
  console.log();

  // Test 1: Load opening data
  console.log("Test 1: Loading Opening Data");
  console.log("-".repeat(70));

  const eco1 = await measureAsync("eco.json package", async () => {
    return await openingBook();
  });

  const fenster1 = await measureAsync("fensterchess     ", async () => {
    return await getLatestEcoJson();
  });

  console.log(`  Speedup: ${(fenster1.duration / eco1.duration).toFixed(2)}x`);
  console.log(`  Data size: ${Object.keys(eco1.result).length} openings`);
  console.log();

  // Test 2: Build position book
  console.log("Test 2: Building Position Book");
  console.log("-".repeat(70));

  const eco2 = measure("eco.json package", () => {
    return getPositionBook(eco1.result);
  });

  const fenster2 = measure("fensterchess     ", () => {
    return fensterGetPositionBook(fenster1.result);
  });

  console.log(`  Speedup: ${(fenster2.duration / eco2.duration).toFixed(2)}x`);
  console.log(`  Position keys: ${Object.keys(eco2.result).length}`);
  console.log();

  // Test 3: Find openings (batch)
  console.log("Test 3: Finding Openings (5 lookups)");
  console.log("-".repeat(70));

  const eco3 = measure("eco.json package", () => {
    return TEST_FENS.map((fen) => findOpening(eco1.result, fen, eco2.result));
  });

  const fenster3 = measure("fensterchess     ", () => {
    return TEST_FENS.map((fen) =>
      fensterFindOpening(fenster1.result, fen, fenster2.result, null, null)
    );
  });

  console.log(`  Speedup: ${(fenster3.duration / eco3.duration).toFixed(2)}x`);
  console.log(
    `  Avg per lookup: ${formatTime(
      eco3.duration / TEST_FENS.length
    )} (eco.json)`
  );
  console.log(
    `  Avg per lookup: ${formatTime(
      fenster3.duration / TEST_FENS.length
    )} (fensterchess)`
  );
  console.log();

  // Test 4: Get transitions (note: will fail for eco.json if file not on GitHub)
  console.log("Test 4: Get Transitions (if available)");
  console.log("-".repeat(70));

  try {
    const eco4 = await measureAsync("eco.json package", async () => {
      return await getFromTos(TEST_FENS[0], eco1.result);
    });
    console.log(`  Next positions: ${eco4.result.next.length}`);
    console.log(`  From positions: ${eco4.result.from.length}`);
  } catch (err) {
    console.log(`  eco.json package: SKIPPED (${err.message})`);
  }

  console.log();

  // Summary
  console.log("=".repeat(70));
  console.log("Summary");
  console.log("=".repeat(70));
  console.log(
    `Total time (eco.json):    ${formatTime(
      eco1.duration + eco2.duration + eco3.duration
    )}`
  );
  console.log(
    `Total time (fensterchess): ${formatTime(
      fenster1.duration + fenster2.duration + fenster3.duration
    )}`
  );
  console.log();
  console.log("Notes:");
  console.log("  - eco.json package and fensterchess use identical algorithms");
  console.log("  - Small differences are due to network timing and caching");
  console.log("  - Both implementations should have similar performance");
  console.log();
}

runTests().catch(console.error);
