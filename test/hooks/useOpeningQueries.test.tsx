import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFromTosForFen, useScoresForFens } from "../../src/hooks/useOpeningQueries";
import type { FromTosResponse, ScoresResponse } from "../../src/types";

// Mock the API functions
vi.mock("../../src/datasource/findOpening", () => ({
  getFromTosForFen: vi.fn(),
  getScoresForFens: vi.fn(),
  findOpening: vi.fn(), // Keep this for other imports
}));

import { getFromTosForFen, getScoresForFens } from "../../src/datasource/findOpening";

describe("useFromTosForFen hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch fromTos data successfully", async () => {
    const mockData: FromTosResponse = {
      next: ["fen1", "fen2"],
      from: ["fen3"],
    };

    vi.mocked(getFromTosForFen).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useFromTosForFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(getFromTosForFen).toHaveBeenCalledWith(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    );
  });

  it("should not fetch when fen is 'start'", async () => {
    const { result } = renderHook(() => useFromTosForFen("start"), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getFromTosForFen).not.toHaveBeenCalled();
  });

  it("should not fetch when enabled is false", async () => {
    const { result } = renderHook(
      () => useFromTosForFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", false),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getFromTosForFen).not.toHaveBeenCalled();
  });

  it("should handle fetch errors", async () => {
    vi.mocked(getFromTosForFen).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useFromTosForFen("test-fen"),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe("useScoresForFens hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch scores successfully", async () => {
    const mockFromTos: FromTosResponse = {
      next: ["fen1"],
      from: ["fen2"],
    };
    const mockScores: ScoresResponse = {
      score: 0.5,
      nextScores: [0.3],
      fromScores: [0.2],
    };

    vi.mocked(getScoresForFens).mockResolvedValue(mockScores);

    const { result } = renderHook(
      () => useScoresForFens("test-fen", mockFromTos),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockScores);
    expect(getScoresForFens).toHaveBeenCalledWith({
      fen: "test-fen",
      next: ["fen1"],
      from: ["fen2"],
    });
  });

  it("should not fetch when fromTosForFen is undefined", async () => {
    const { result } = renderHook(
      () => useScoresForFens("test-fen", undefined),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getScoresForFens).not.toHaveBeenCalled();
  });

  it("should not fetch when enabled is false", async () => {
    const mockFromTos: FromTosResponse = { next: [], from: [] };

    const { result } = renderHook(
      () => useScoresForFens("test-fen", mockFromTos, false),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getScoresForFens).not.toHaveBeenCalled();
  });

  it("should handle empty fromTos arrays", async () => {
    const mockFromTos: FromTosResponse = { next: [], from: [] };
    const mockScores: ScoresResponse = {
      score: null,
      nextScores: [],
      fromScores: [],
    };

    vi.mocked(getScoresForFens).mockResolvedValue(mockScores);

    const { result } = renderHook(
      () => useScoresForFens("test-fen", mockFromTos),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getScoresForFens).toHaveBeenCalledWith({
      fen: "test-fen",
      next: [],
      from: [],
    });
  });

  it("should handle fetch errors", async () => {
    const mockFromTos: FromTosResponse = { next: [], from: [] };
    vi.mocked(getScoresForFens).mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useScoresForFens("test-fen", mockFromTos),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
