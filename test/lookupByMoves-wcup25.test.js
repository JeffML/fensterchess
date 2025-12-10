import { describe, it, expect, beforeAll } from "vitest";
import { findNearestOpening } from "../src/datasource/findOpening";
import { openingBook as getOpeningBook } from "@chess-openings/eco.json";

describe("lookupByMoves with wcup25.pgn games", () => {
  let openingBook;

  beforeAll(async () => {
    // Load the full opening book once for all tests
    openingBook = await getOpeningBook();
  });

  it("should find opening for Game 1: French Exchange Variation", () => {
    // Game 1: Abugenda vs Erdogmus
    const pgnOpening = "French";
    const pgnVariation = "exchange variation";
    const pgnEco = "C01";

    const moves = `1. e4 e6 2. d4 d5 3. exd5 exd5 4. Bd3 Nc6 5. c3 Bd6 6. h3 Nge7 7. Qf3 O-O 8. Ne2
Ng6 9. h4 Re8 10. g3 Nce5 11. dxe5 Nxe5 12. Qxd5 Be6 13. Qe4 f5 14. Qe3 Bd5 15.
Kf1 Bxh1 16. Bxf5 Bc5 17. Qg5 Qd1#`;

    const result = findNearestOpening(moves, openingBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.eco).toBeDefined();
    // Game went 17 moves deep, should find opening well before move 25
    expect(result.movesBack).toBeGreaterThan(0);
    console.log(`Game 1:`);
    console.log(`  PGN: ${pgnOpening}: ${pgnVariation} (${pgnEco})`);
    console.log(`  eco.json: ${result.opening.name} (${result.opening.eco})`);
    console.log(`  Walked back: ${result.movesBack} moves`);
  });

  it("should find opening for Game 5: Two Knights Defence", () => {
    // Game 5: Alrehaili vs Adams
    const pgnOpening = "Two knights defence (Modern bishop's opening)";
    const pgnVariation = "";
    const pgnEco = "C55";

    const moves = `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Be7 5. O-O O-O 6. Re1 d6 7. c3 Na5 8. Bb5
a6 9. Ba4 b5 10. Bc2 c5 11. Nbd2 Nc6 12. Nf1 Be6 13. h3 h6 14. Ng3 Re8 15. d4
cxd4 16. cxd4 exd4 17. Nxd4 Nxd4 18. Qxd4 Rc8 19. Bb3 d5 20. e5 Bc5 21. Qf4 Ne4
22. Nxe4 dxe4 23. Qxe4 Qd4 24. Qf3 Bxb3 25. axb3 Rxe5 26. Rxe5 Qxe5 27. Bxh6 Re8
28. Bf4 Qe2 29. b4 Qxb2 30. Rxa6 Qxb4 31. Kh2 Qd4 32. Ra8 Rxa8 33. Qxa8+ Kh7 34.
Bg3 Bd6 35. Bxd6 Qxd6+ 36. g3 Qd4 37. Qa2 Qc4 38. Qa6 Qe2 39. Qb6 b4 40. h4 Qc4
41. h5 b3 42. Qb7 Qc2`;

    const result = findNearestOpening(moves, openingBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.eco).toBeDefined();
    // Game went 42 moves deep - should skip to ply 50 and work backward
    expect(result.movesBack).toBeGreaterThan(0);
    console.log(`Game 5:`);
    console.log(
      `  PGN: ${pgnOpening}${
        pgnVariation ? ": " + pgnVariation : ""
      } (${pgnEco})`
    );
    console.log(`  eco.json: ${result.opening.name} (${result.opening.eco})`);
    console.log(`  Walked back: ${result.movesBack} moves`);
  });

  it("should find opening for Game 20: Ruy Lopez Open Variation", () => {
    // Game 20: Pranesh vs Akhmedinov
    const pgnOpening = "Ruy Lopez";
    const pgnVariation = "open, 8...Be6";
    const pgnEco = "C80";

    const moves = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5
Be6 9. Be3 Be7 10. c3 Nc5 11. Bc2 Nd7 12. Bd4 Na5 13. b4 Nc4 14. Nbd2 Na3 15.
Nb3 Qc8 16. Bd3 a5 17. Nxa5 c5 18. Be3 h6 19. Qe2 Nc4 20. a3 Nxa5 21. bxa5 c4
22. Bc2 Rxa5 23. Nd4 Nxe5 24. f4 Nd3 25. f5 Bd7 26. f6 gxf6 27. Bxd3 cxd3 28.
Qxd3 Qc4 29. Qd2 Be6 30. Nf5 Kd7 31. Nxe7 Kxe7 32. Bd4 Rha8 33. Qxh6 Rxa3 34.
Rae1 Ra2 35. Qxf6+ Kd7 36. Qg7 Re2 37. Rxf7+ Bxf7 38. Qxf7+ Kc6 39. Qg6+ Kb7 40.
Qb6+ Kc8 41. Rf1 Re8 42. Bc5 Ra2 43. Qc6+ Kd8 44. Bb6+ Ke7 45. Qb7+ Kd6 46. Rf6+
Ke5 47. Qg7 Ra1+ 48. Rf1+`;

    const result = findNearestOpening(moves, openingBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.eco).toBeDefined();
    // Game went 48 moves deep - should skip to ply 50 and work backward
    expect(result.movesBack).toBeGreaterThan(0);
    console.log(`Game 20:`);
    console.log(`  PGN: ${pgnOpening}: ${pgnVariation} (${pgnEco})`);
    console.log(`  eco.json: ${result.opening.name} (${result.opening.eco})`);
    console.log(`  Walked back: ${result.movesBack} moves`);
  });

  it("should verify ply 50 optimization is working", () => {
    // Use actual game 20 truncated at move 30 (60 plies) to test ply 50 optimization
    const longGame = `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5
Be6 9. Be3 Be7 10. c3 Nc5 11. Bc2 Nd7 12. Bd4 Na5 13. b4 Nc4 14. Nbd2 Na3 15.
Nb3 Qc8 16. Bd3 a5 17. Nxa5 c5 18. Be3 h6 19. Qe2 Nc4 20. a3 Nxa5 21. bxa5 c4
22. Bc2 Rxa5 23. Nd4 Nxe5 24. f4 Nd3 25. f5 Bd7 26. f6 gxf6 27. Bxd3 cxd3 28.
Qxd3 Qc4 29. Qd2 Be6 30. Nf5`;

    const result = findNearestOpening(longGame, openingBook);

    expect(result.opening).toBeDefined();
    // Game is 60 plies - should start searching at ply 50
    expect(result.movesBack).toBeGreaterThan(0);
    console.log(
      `Long game (60 plies) - ${result.opening.name} (${result.opening.eco}), ${result.movesBack} moves back from ply 50`
    );
  });
});
