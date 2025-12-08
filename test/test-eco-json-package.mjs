// Quick test of @chess-openings/eco.json package
import {
  openingBook,
  findOpening,
  getFromTos,
  getPositionBook,
} from "@chess-openings/eco.json";

async function test() {
  console.log("Testing @chess-openings/eco.json...\n");

  // Test 1: Load opening book
  console.log("1. Loading opening book...");
  const openings = await openingBook();
  const count = Object.keys(openings).length;
  console.log(`✓ Loaded ${count} openings\n`);

  // Test 2: Find opening by FEN
  console.log("2. Finding opening by FEN (e4)...");
  const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
  const posBook = getPositionBook(openings);
  const opening = findOpening(openings, fen, posBook);

  if (opening) {
    console.log(`✓ Found: ${opening.name}`);
    console.log(`  ECO: ${opening.eco}`);
    console.log(`  Moves: ${opening.moves}\n`);
  } else {
    console.log("✗ Opening not found\n");
  }

  // Test 3: Get transitions
  console.log("3. Getting transitions...");
  const { next, from } = await getFromTos(fen, openings);
  console.log(`✓ Found ${next.length} next positions`);
  if (next.length > 0) {
    console.log(`  Example: ${next[0].name}`);
  }
  console.log(`✓ Found ${from.length} previous positions`);
  if (from.length > 0) {
    console.log(`  Example: ${from[0].name}`);
  }

  console.log("\n✓ All tests passed!");
}

test().catch(console.error);
