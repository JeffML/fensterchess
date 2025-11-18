import { describe, it, expect, beforeEach } from "vitest";
import { Chess } from "chess.js";

describe("Chess.js behavior with moves", () => {
  it("should correctly parse PGN moves and return FEN", () => {
    const chess = new Chess();
    const moves = "1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5";

    console.log("Initial FEN:", chess.fen());

    chess.loadPgn(moves);
    const fen = chess.fen();

    console.log("FEN after loadPgn:", fen);
    console.log("PGN:", chess.pgn());

    // The FEN should NOT be the starting position
    expect(fen).not.toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );

    // Should be the correct position after all the moves
    expect(fen).toBe(
      "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6"
    );
  });

  it("should handle URL-encoded moves", () => {
    const chess = new Chess();
    const encodedMoves =
      "1.%20d4%20Nf6%202.%20c4%20e6%203.%20Nf3%20d5%204.%20Nc3%20Nbd7%205.%20cxd5%20exd5";
    const decodedMoves = decodeURIComponent(encodedMoves);

    console.log("Decoded moves:", decodedMoves);

    chess.loadPgn(decodedMoves);
    const fen = chess.fen();

    console.log("FEN after URL-decoded moves:", fen);

    expect(fen).not.toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
  });
});
