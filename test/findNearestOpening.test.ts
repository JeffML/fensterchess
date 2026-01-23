import { describe, it, expect, beforeAll } from "vitest";
import { findNearestOpening } from "../src/datasource/findOpening";
import { openingBook } from "@chess-openings/eco.json";
import type { OpeningBook } from "../src/types";

describe("findNearestOpening", () => {
  let book: OpeningBook;

  beforeAll(async () => {
    book = (await openingBook()) as unknown as OpeningBook;
  });

  it("should return undefined for empty moves", () => {
    const result = findNearestOpening("", book);
    expect(result.opening).toBeUndefined();
    expect(result.movesBack).toBe(0);
  });

  it("should find exact match opening with movesBack = 0", () => {
    // 1. b3 is the Nimzo-Larsen Attack
    const result = findNearestOpening("1. b3", book);
    expect(result.opening).toBeDefined();
    expect(result.opening?.name).toContain("Nimzo-Larsen");
    expect(result.movesBack).toBe(0);
    // FEN should be the position after 1. b3
    expect(result.opening?.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1"
    );
  });

  it("should find nearest opening when current position has no named opening", () => {
    // 1. b3 d6 has no named opening, but 1. b3 (Nimzo-Larsen Attack) does
    const result = findNearestOpening("1. b3 d6", book);
    expect(result.opening).toBeDefined();
    expect(result.opening?.name).toContain("Nimzo-Larsen");
    expect(result.movesBack).toBe(1);
    // FEN should be the position after 1. b3, NOT after 1. b3 d6
    expect(result.opening?.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1"
    );
  });

  it("should find nearest opening multiple moves back", () => {
    // 1. b3 d6 2. Bb2 has no named opening
    const result = findNearestOpening("1. b3 d6 2. Bb2", book);
    expect(result.opening).toBeDefined();
    expect(result.opening?.name).toContain("Nimzo-Larsen");
    expect(result.movesBack).toBe(2);
    // FEN should be the position after 1. b3
    expect(result.opening?.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1"
    );
  });

  it("should include opening FEN that differs from search FEN", () => {
    // This is the key test - verifies the FEN is the opening's position, not the search position
    const result = findNearestOpening("1. b3 d6", book);

    // The search position FEN (after 1. b3 d6)
    const searchFen =
      "rnbqkbnr/ppp1pppp/3p4/8/8/1P6/P1PPPPPP/RNBQKBNR w KQkq - 0 2";

    // The opening FEN (after 1. b3) should be DIFFERENT
    expect(result.opening?.fen).not.toBe(searchFen);
    expect(result.opening?.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1"
    );
  });
});
