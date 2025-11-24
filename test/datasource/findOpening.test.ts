import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findOpening,
  getFromTosForFen,
  getScoresForFens,
} from "../../src/datasource/findOpening";
import type {
  OpeningBook,
  PositionBook,
  FromTosResponse,
  ScoresResponse,
} from "../../src/types";

describe("findOpening", () => {
  const mockOpeningBook: OpeningBook = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
      name: "Starting Position",
      moves: "",
      eco: "A00",
    },
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": {
      name: "King's Pawn Opening",
      moves: "1. e4",
      eco: "B00",
    },
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": {
      name: "King's Pawn Game",
      moves: "1. e4 e5",
      eco: "C20",
    },
  };

  const mockPositionBook: PositionBook = {
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR": [
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    ],
  };

  it("should find opening by exact FEN match", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const opening = findOpening(
      mockOpeningBook,
      fen,
      mockPositionBook,
      null,
      null
    );

    expect(opening).toBeDefined();
    expect(opening?.name).toBe("King's Pawn Opening");
    expect(opening?.moves).toBe("1. e4");
  });

  it("should find opening by position-only FEN (ignoring turn/castling)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 5 3";
    const opening = findOpening(
      mockOpeningBook,
      fen,
      mockPositionBook,
      null,
      null
    );

    expect(opening).toBeDefined();
    expect(opening?.name).toBe("King's Pawn Opening");
  });

  it("should return undefined for unknown position", () => {
    const fen = "8/8/8/8/8/8/8/8 w - - 0 1";
    const opening = findOpening(
      mockOpeningBook,
      fen,
      mockPositionBook,
      null,
      null
    );

    expect(opening).toBeUndefined();
  });

  it("should enrich opening with fromTos and scores data", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const fromTos: FromTosResponse = {
      next: ["rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2"],
      from: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
    };
    const scores: ScoresResponse = {
      score: 0.2,
      nextScores: [0.1],
      fromScores: [0.0],
    };

    const opening = findOpening(
      mockOpeningBook,
      fen,
      mockPositionBook,
      fromTos,
      scores
    );

    expect(opening).toBeDefined();
    expect(opening?.score).toBe(0.2);
    expect(opening?.next).toHaveLength(1);
    expect(opening?.next?.[0].name).toBe("King's Pawn Game");
    expect(opening?.next?.[0].score).toBe(0.1);
    expect(opening?.from).toHaveLength(1);
    expect(opening?.from?.[0].name).toBe("Starting Position");
    expect(opening?.from?.[0].score).toBe(0.0);
  });

  it("should handle null fromTos and scores gracefully", () => {
    // Use a fresh opening book to avoid contamination from previous tests
    const freshOpeningBook: OpeningBook = {
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": {
        name: "King's Pawn Game",
        moves: "1. e4 e5",
        eco: "C20",
      },
    };
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
    const opening = findOpening(
      freshOpeningBook,
      fen,
      mockPositionBook,
      null,
      null
    );

    expect(opening).toBeDefined();
    expect(opening?.score).toBeUndefined();
    expect(opening?.next).toBeUndefined();
    expect(opening?.from).toBeUndefined();
  });
});

describe("getFromTosForFen API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch fromTos successfully", async () => {
    const mockResponse: FromTosResponse = {
      next: ["fen1", "fen2"],
      from: ["fen3"],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await getFromTosForFen(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    );

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("getFromTosForFen?fen="),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      })
    );
  });

  it("should handle fetch errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response)
    );

    const result = await getFromTosForFen("invalid-fen");

    expect(result).toEqual({ next: [], from: [] });
  });

  it("should include authorization token", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ next: [], from: [] }),
      } as Response)
    );

    await getFromTosForFen("test-fen");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Authorization: expect.stringContaining("Bearer"),
        },
      })
    );
  });
});

describe("getScoresForFens API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch scores successfully", async () => {
    const mockRequest = {
      fen: "test-fen",
      next: ["fen1", "fen2"],
      from: ["fen3"],
    };

    const mockResponse: ScoresResponse = {
      score: 0.5,
      nextScores: [0.3, 0.4],
      fromScores: [0.2],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await getScoresForFens(mockRequest);

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("scoresForFens"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
          "Content-type": "application/json",
        }),
        body: JSON.stringify(mockRequest),
      })
    );
  });

  it("should handle fetch errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response)
    );

    const result = await getScoresForFens({
      fen: "test",
      next: [],
      from: [],
    });

    expect(result).toEqual({ score: null, nextScores: [], fromScores: [] });
  });

  it("should send POST request with proper JSON body", async () => {
    const request = {
      fen: "test-fen",
      next: ["next1", "next2"],
      from: ["from1"],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ score: null, nextScores: [], fromScores: [] }),
      } as Response)
    );

    await getScoresForFens(request);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
      })
    );
  });
});
