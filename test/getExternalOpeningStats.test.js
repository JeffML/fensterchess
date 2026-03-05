import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth before importing the handler
vi.mock("../netlify/functions/utils/auth.js", () => ({
  authenticateRequest: vi.fn(() => true),
  authFailureResponse: {
    statusCode: 401,
    body: JSON.stringify({ error: "Unauthorized" }),
  },
}));

// Mock fast-xml-parser
vi.mock("fast-xml-parser", () => ({
  XMLParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn(),
  })),
}));

import { handler } from "../netlify/functions/getExternalOpeningStats.js";
import { authenticateRequest } from "../netlify/functions/utils/auth.js";

const TEST_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

const makeEvent = (body) => ({
  httpMethod: "POST",
  headers: { origin: "http://localhost:8888" },
  body: JSON.stringify(body),
});

describe("getExternalOpeningStats handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateRequest).mockReturnValue(true);
  });

  it("returns 401 when auth fails", async () => {
    vi.mocked(authenticateRequest).mockReturnValue(false);

    const result = await handler(
      makeEvent({ fen: TEST_FEN, sites: ["lichess"] }),
    );

    expect(result.statusCode).toBe(401);
  });

  it("returns 501 for non-POST requests", async () => {
    const result = await handler({
      httpMethod: "GET",
      headers: { origin: "http://localhost:8888" },
      body: null,
    });

    expect(result.statusCode).toBe(501);
  });

  describe("lichess", () => {
    it("returns opening stats on success", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          opening: { name: "Sicilian Defense" },
          white: 100,
          black: 80,
          draws: 50,
        }),
      });

      const result = await handler(
        makeEvent({ fen: TEST_FEN, sites: ["lichess"] }),
      );

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.lichess.alsoKnownAs).toBe("Sicilian Defense");
      expect(data.lichess.wins).toEqual({ w: 100, b: 80, d: 50 });
    });

    it("URL-encodes the FEN (spaces must not appear in the request URL)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          opening: { name: "King's Pawn" },
          white: 200,
          black: 150,
          draws: 100,
        }),
      });

      await handler(makeEvent({ fen: TEST_FEN, sites: ["lichess"] }));

      const calledUrl = vi.mocked(global.fetch).mock.calls[0][0];
      expect(calledUrl).not.toContain(" ");
      expect(calledUrl).toContain(encodeURIComponent(TEST_FEN));
    });

    it("sends User-Agent header identifying fensterchess", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ opening: null, white: 0, black: 0, draws: 0 }),
      });

      await handler(makeEvent({ fen: TEST_FEN, sites: ["lichess"] }));

      const calledHeaders = vi.mocked(global.fetch).mock.calls[0][1]?.headers;
      expect(calledHeaders["User-Agent"]).toContain("fensterchess");
    });

    it("sends Authorization header when LICHESS_API_TOKEN env var is set", async () => {
      process.env.LICHESS_API_TOKEN = "test-token-123";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ opening: null, white: 0, black: 0, draws: 0 }),
      });

      await handler(makeEvent({ fen: TEST_FEN, sites: ["lichess"] }));

      const calledHeaders = vi.mocked(global.fetch).mock.calls[0][1]?.headers;
      expect(calledHeaders.Authorization).toBe("Bearer test-token-123");
      delete process.env.LICHESS_API_TOKEN;
    });

    it("omits Authorization header when LICHESS_API_TOKEN env var is not set", async () => {
      delete process.env.LICHESS_API_TOKEN;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ opening: null, white: 0, black: 0, draws: 0 }),
      });

      await handler(makeEvent({ fen: TEST_FEN, sites: ["lichess"] }));

      const calledHeaders = vi.mocked(global.fetch).mock.calls[0][1]?.headers;
      expect(calledHeaders.Authorization).toBeUndefined();
    });

    it("returns n/a when opening is null", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          opening: null,
          white: 10,
          black: 5,
          draws: 3,
        }),
      });

      const result = await handler(
        makeEvent({ fen: TEST_FEN, sites: ["lichess"] }),
      );

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.lichess.alsoKnownAs).toBe("n/a");
    });

    it("returns ERROR on non-ok HTTP response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await handler(
        makeEvent({ fen: TEST_FEN, sites: ["lichess"] }),
      );

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.lichess.alsoKnownAs).toBe("ERROR");
      expect(data.lichess.wins).toEqual({ w: 0, b: 0, d: 0 });
    });

    it("returns ERROR on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await handler(
        makeEvent({ fen: TEST_FEN, sites: ["lichess"] }),
      );

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.lichess.alsoKnownAs).toBe("ERROR");
      expect(data.lichess.wins).toEqual({ w: 0, b: 0, d: 0 });
    });
  });
});
