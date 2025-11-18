import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchPageContainer from "../src/searchPage/SearchPageContainer";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";

// Mock the OpeningBookContext to provide a valid openingBook
vi.mock("../src/contexts/OpeningBookContext", async () => {
  const actual = await vi.importActual("../src/contexts/OpeningBookContext");
  return {
    ...actual,
    OpeningBookProvider: ({ children }) => children,
  };
});

// Mock the data fetch functions
vi.mock("../src/datasource/findOpening.js", () => ({
  findOpening: vi.fn(() => ({ name: "Test Opening" })),
  getFromTosForFen: vi.fn(() => Promise.resolve({})),
  getScoresForFens: vi.fn(() => Promise.resolve({})),
}));

// Reset the module between tests to clear the paramsRead flag
afterEach(() => {
  vi.resetModules();
});

describe("SearchPageContainer with moves query parameter", () => {
  let queryClient;
  const mockOpeningBook = {
    start: { name: "Starting Position" },
    "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6": {
      name: "Queen's Gambit Declined",
    },
  };
  const mockPositionBook = {};

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it("should load and display board state when moves query parameter is provided", async () => {
    // Set up the URL with moves query parameter
    const moves = "1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5";
    const searchParams = new URLSearchParams({ moves });
    const expectedFen =
      "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6";

    // Mock window.location.search
    delete window.location;
    window.location = { search: `?${searchParams.toString()}` };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{
            openingBook: mockOpeningBook,
            positionBook: mockPositionBook,
          }}
        >
          <SearchPageContainer />
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Wait for the board state to update
    await waitFor(() => {
      const textarea = container.querySelector("#fenpgn");
      expect(textarea).toBeTruthy();
      expect(textarea.value).toContain(expectedFen);
    });

    // Verify the textarea contains the correct FEN and moves
    const textarea = container.querySelector("#fenpgn");
    expect(textarea.value).toContain("FEN:");
    expect(textarea.value).toContain(expectedFen);
    expect(textarea.value).toContain("moves:");
    expect(textarea.value).toContain("d4");
    expect(textarea.value).toContain("Nf6");
  });

  it("should parse moves and set correct FEN position", async () => {
    const moves = "1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5";
    const searchParams = new URLSearchParams({ moves });
    const expectedFen =
      "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6";

    delete window.location;
    window.location = { search: `?${searchParams.toString()}` };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{
            openingBook: mockOpeningBook,
            positionBook: mockPositionBook,
          }}
        >
          <SearchPageContainer />
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Wait for the state to update with the parsed moves
    await waitFor(() => {
      const textarea = container.querySelector("#fenpgn");
      expect(textarea).toBeTruthy();
      const content = textarea.value;
      // Verify the board is NOT at the starting position
      expect(content).not.toContain("rnbqkbnr/pppppppp");
      // Verify it has the correct position
      expect(content).toContain(expectedFen);
    });

    const textarea = container.querySelector("#fenpgn");
    const content = textarea.value;

    // The moves should be present (not just "start")
    expect(content).toContain("d4");
    expect(content).toContain("Nf6");
    expect(content).toContain("cxd5");
    expect(content).toContain("exd5");
  });
});
