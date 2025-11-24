import { describe, it, expect } from "vitest";
import { POSITION_ONLY_FEN_REGEX } from "../src/common/consts";

describe("Position-only FEN handling", () => {
  it("should match valid position-only FEN strings", () => {
    // Starting position
    expect(
      POSITION_ONLY_FEN_REGEX.test("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    ).toBe(true);

    // After 1. e4
    expect(
      POSITION_ONLY_FEN_REGEX.test("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR")
    ).toBe(true);

    // Complex position
    expect(
      POSITION_ONLY_FEN_REGEX.test("r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R")
    ).toBe(true);
  });

  it("should not match full FEN strings", () => {
    // Full FEN with game state
    expect(
      POSITION_ONLY_FEN_REGEX.test(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      )
    ).toBe(false);

    // Partial FEN with turn
    expect(
      POSITION_ONLY_FEN_REGEX.test("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w")
    ).toBe(false);
  });

  it("should not match invalid FEN strings", () => {
    // Too few ranks
    expect(POSITION_ONLY_FEN_REGEX.test("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP")).toBe(
      false
    );

    // Too many ranks
    expect(
      POSITION_ONLY_FEN_REGEX.test(
        "rnbqkbnr/pppppppp/8/8/8/8/8/PPPPPPPP/RNBQKBNR"
      )
    ).toBe(false);

    // Invalid characters
    expect(
      POSITION_ONLY_FEN_REGEX.test("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX")
    ).toBe(false);

    // Empty string
    expect(POSITION_ONLY_FEN_REGEX.test("")).toBe(false);
  });

  it("should normalize position-only FEN by appending game state", () => {
    const positionOnly = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    const normalized = `${positionOnly} w KQkq - 0 1`;

    // Check that normalization creates valid full FEN
    expect(normalized).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
  });

  it("should handle position-only FEN in different positions", () => {
    const positions = [
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR", // After e4
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR", // After e4 e5
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R", // After e4 e5 Nf3
      "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R", // After e4 e5 Nf3 Nc6
    ];

    positions.forEach((pos) => {
      expect(POSITION_ONLY_FEN_REGEX.test(pos)).toBe(true);
      const normalized = `${pos} w KQkq - 0 1`;
      expect(normalized.split(" ").length).toBe(6); // Full FEN has 6 parts
    });
  });
});
