// Test game filtering and hash generation
// Phase 0 - Foundation

import { ChessPGN } from "@chess-pgn/chess-pgn";
import { shouldImportGame, stripAnnotations } from "./filterGame.js";
import { hashGame } from "./hashGame.js";

const samplePgn = `
[Event "Test Tournament"]
[White "Carlsen"]
[WhiteElo "2850"]
[Black "Nakamura"]
[BlackElo "2800"]
[Result "1-0"]

1. e4 e5 2. Nf3 {This is a comment} Nc6 (2... Nf6 3. Nxe5) 3. Bb5 1-0

[Event "Variant Game"]
[Variant "Chess960"]
[White "Player1"]
[WhiteElo "2500"]
[Black "Player2"]
[BlackElo "2500"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Low Rating Game"]
[White "Amateur"]
[WhiteElo "2200"]
[Black "Expert"]
[BlackElo "2450"]
[Result "1-0"]

1. e4 e5 1-0

[Event "FEN Setup"]
[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"]
[White "Player3"]
[WhiteElo "2600"]
[Black "Player4"]
[BlackElo "2600"]
[Result "1-0"]

1... e5 2. Nf3 1-0
`;

async function testFiltering() {
  console.log("🧪 Testing game filtering logic...\n");

  // Test each game individually
  const games = [
    // Game 1: Valid master game
    `[Event "Test Tournament"]
[White "Carlsen"]
[WhiteElo "2850"]
[Black "Nakamura"]
[BlackElo "2800"]
[Result "1-0"]

1. e4 e5 2. Nf3 {This is a comment} Nc6 (2... Nf6 3. Nxe5) 3. Bb5 1-0`,

    // Game 2: Variant (should reject)
    `[Event "Variant Game"]
[Variant "Chess960"]
[White "Player1"]
[WhiteElo "2500"]
[Black "Player2"]
[BlackElo "2500"]
[Result "1-0"]

1. e4 e5 1-0`,

    // Game 3: Low rating (should reject)
    `[Event "Low Rating Game"]
[White "Amateur"]
[WhiteElo "2200"]
[Black "Expert"]
[BlackElo "2450"]
[Result "1-0"]

1. e4 e5 1-0`,

    // Game 4: FEN setup (should reject)
    `[Event "FEN Setup"]
[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"]
[White "Player3"]
[WhiteElo "2600"]
[Black "Player4"]
[BlackElo "2600"]
[Result "1-0"]

1... e5 2. Nf3 1-0`,
  ];

  let accepted = 0;
  let rejected = 0;

  for (const pgnText of games) {
    const chess = new ChessPGN();
    chess.loadPgn(pgnText);

    const header = chess.header();
    console.log(`Testing: ${header.Event}`);

    if (shouldImportGame(chess)) {
      console.log("✅ ACCEPTED");

      // Test annotation stripping
      const pgn = chess.pgn();
      const cleaned = stripAnnotations(pgn);
      const preview =
        cleaned.length > 100 ? cleaned.substring(0, 100) + "..." : cleaned;
      console.log("  Cleaned moves:", preview);

      // Test hash generation
      const hash = hashGame(chess);
      console.log("  Hash:", hash.substring(0, 16) + "...");

      accepted++;
    } else {
      console.log("❌ REJECTED");
      if (header.Variant && header.Variant !== "Standard") {
        console.log("  Reason: Variant chess");
      } else if (header.FEN) {
        console.log("  Reason: FEN setup");
      } else {
        const whiteElo = parseInt(header.WhiteElo || "0");
        const blackElo = parseInt(header.BlackElo || "0");
        console.log(`  Reason: Low rating (W:${whiteElo}, B:${blackElo})`);
      }
      rejected++;
    }

    console.log("");
  }

  console.log("─────────────────────────────");
  console.log(`Results: ${accepted} accepted, ${rejected} rejected`);
  console.log(`Expected: 1 accepted, 3 rejected`);

  if (accepted === 1 && rejected === 3) {
    console.log("🎉 All filtering tests passed!");
  } else {
    console.log("❌ Filtering test failed!");
    process.exit(1);
  }
}

testFiltering().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
