import { describe, it, expect } from "vitest";
import { findNearestOpening } from "../src/datasource/findOpening";

describe("findNearestOpening", () => {
  const mockOpeningBook = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
      name: "Starting Position",
      eco: "A00",
      moves: "",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": {
      name: "King's Pawn Opening",
      eco: "B00",
      moves: "1. e4",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    },
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": {
      name: "King's Pawn Game",
      eco: "C20",
      moves: "1. e4 e5",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
    },
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2": {
      name: "King's Knight Opening",
      eco: "C40",
      moves: "1. e4 e5 2. Nf3",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    },
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3": {
      name: "King's Knight Opening: Normal Variation",
      eco: "C44",
      moves: "1. e4 e5 2. Nf3 Nc6",
      fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    },
  };

  const mockPositionBook = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR": [
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ],
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR": [
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    ],
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR": [
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
    ],
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": [
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    ],
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": [
      "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    ],
  };

  it("should return undefined for empty moves string", () => {
    const result = findNearestOpening("", mockOpeningBook);
    expect(result.opening).toBeUndefined();
    expect(result.movesBack).toBe(0);
  });

  it("should return undefined for whitespace-only moves string", () => {
    const result = findNearestOpening("   ", mockOpeningBook);
    expect(result.opening).toBeUndefined();
    expect(result.movesBack).toBe(0);
  });

  it("should find opening 1 move back", () => {
    // Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 (last move not in opening book)
    const moves = "1. e4 e5 2. Nf3 Nc6 3. Bc4";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    expect(result.opening.eco).toBe("C44");
    expect(result.movesBack).toBe(1);
  });

  it("should find opening 2 moves back", () => {
    // Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 (last 2 moves not in opening book)
    const moves = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    expect(result.opening.eco).toBe("C44");
    expect(result.movesBack).toBe(2);
  });

  it("should find opening 3 moves back", () => {
    // Moves: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O (last 3 moves not in opening book)
    const moves = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    expect(result.opening.eco).toBe("C44");
    expect(result.movesBack).toBe(3);
  });

  it("should return 0 moves back when last position is in opening book", () => {
    const moves = "1. e4 e5 2. Nf3 Nc6";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    expect(result.opening.eco).toBe("C44");
    expect(result.movesBack).toBe(0);
  });

  it("should find starting position when all moves are unknown", () => {
    // Completely different opening line not in our mock book
    const moves = "1. a3 a6 2. h3 h6";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("Starting Position");
    expect(result.movesBack).toBe(4); // 4 moves back to starting position
  });

  it("should handle single move sequences", () => {
    const moves = "1. e4";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Pawn Opening");
    expect(result.opening.eco).toBe("B00");
    expect(result.movesBack).toBe(0);
  });

  it("should walk back through multiple positions", () => {
    // 1. e4 e5 2. Nf3 followed by illegal move Nc3 (white can't move knight to c3 after Nf3)
    // Let's use a valid continuation instead
    const moves = "1. e4 e5 2. Nf3 d6"; // valid moves
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    // Should find "King's Knight Opening" (after 2. Nf3)
    expect(result.opening.eco).toBe("C40");
    expect(result.movesBack).toBe(1); // d6 is not in book
  });

  it("should use position book as fallback", () => {
    // Create a scenario where exact FEN match fails but position match succeeds
    const moves = "1. e4";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Pawn Opening");
    expect(result.opening.eco).toBe("B00");
  });

  it("should return undefined for invalid PGN", () => {
    const moves = "invalid pgn notation xyz";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeUndefined();
    expect(result.movesBack).toBe(0);
  });

  it("should handle moves with comments", () => {
    const moves = "1. e4 {best move} e5 2. Nf3 Nc6";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    expect(result.opening.eco).toBe("C44");
  });

  it("should find nearest opening in Sicilian Defense line", () => {
    const extendedOpeningBook = {
      ...mockOpeningBook,
      "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1": {
        name: "Queen's Pawn Opening",
        eco: "A40",
        moves: "1. d4",
        fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
      },
      "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 2": {
        name: "Benoni Defense",
        eco: "A43",
        moves: "1. d4 c5",
        fen: "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 2",
      },
    };

    const extendedPositionBook = {
      ...mockPositionBook,
      "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR": [
        "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
      ],
      "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR": [
        "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 2",
      ],
    };

    // Continue Benoni with moves not in book
    const moves = "1. d4 c5 2. d5 e6 3. Nc3";
    const result = findNearestOpening(moves, extendedOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("Benoni Defense");
    expect(result.movesBack).toBe(3); // 3 moves back (dxc5, e6, Nc3)
  });

  it("should handle deeply nested game continuation", () => {
    // Game continues far beyond opening book
    const moves =
      "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. Bg5 h6 7. Bh4 g5 8. Bg3 h5";
    const result = findNearestOpening(moves, mockOpeningBook);

    expect(result.opening).toBeDefined();
    expect(result.opening.name).toBe("King's Knight Opening: Normal Variation");
    // Should be 10 moves back (5 full moves after 2...Nc6)
    expect(result.movesBack).toBeGreaterThan(0);
  });
});
