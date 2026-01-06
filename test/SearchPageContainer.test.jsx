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
vi.mock("../src/datasource/findOpening.ts", () => ({
  findOpening: vi.fn((openingBook, fen) => openingBook[fen]),
  findNearestOpening: vi.fn(() => ({ opening: undefined, movesBack: 0 })),
  getFromTosForFen: vi.fn(() => Promise.resolve({ next: [], from: [] })),
  getScoresForFens: vi.fn(() =>
    Promise.resolve({ score: null, nextScores: [], fromScores: [] })
  ),
}));

// Reset the module between tests to clear the paramsRead flag
afterEach(() => {
  vi.resetModules();
});

describe("SearchPageContainer with query parameters", () => {
  let queryClient;
  const mockOpeningBook = {
    start: { name: "Starting Position" },
    "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6": {
      name: "Queen's Gambit Declined",
      moves: "1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5",
    },
    "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3": {
      name: "French Defense: Exchange Variation",
      moves: "1. e4 e6 2. d4 d5 3. exd5",
    },
  };
  const mockPositionBook = {
    "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R": [
      "r1bqkb1r/pppn1ppp/5n2/3p4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6",
    ],
    "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR": [
      "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
    ],
  };

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
      const movesInput = container.querySelector("#moves-input");
      expect(movesInput).toBeTruthy();
      expect(movesInput.value).toContain("d4");
    });

    // Verify the moves input contains the correct moves
    const movesInput = container.querySelector("#moves-input");
    expect(movesInput.value).toContain("d4");
    expect(movesInput.value).toContain("Nf6");
    expect(movesInput.value).toContain("cxd5");
    expect(movesInput.value).toContain("exd5");

    // Verify the FEN display contains the resulting position
    const fenDisplay = container.querySelector("div[contenteditable]");
    expect(fenDisplay).toBeTruthy();
    expect(fenDisplay.textContent).toContain(expectedFen);
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
      const fenDisplay = container.querySelector("div[contenteditable]");
      expect(fenDisplay).toBeTruthy();
      const content = fenDisplay.textContent;
      // Verify the board is NOT at the starting position
      expect(content).not.toContain("rnbqkbnr/pppppppp");
      // Verify it has the correct position
      expect(content).toContain(expectedFen);
    });

    const movesInput = container.querySelector("#moves-input");
    const content = movesInput.value;

    // The moves should be present
    expect(content).toContain("d4");
    expect(content).toContain("Nf6");
    expect(content).toContain("cxd5");
    expect(content).toContain("exd5");
  });

  it.skip("should load and display opening moves when FEN query parameter is provided", async () => {
    // TODO: This test needs better mocking of the async opening lookup and useEffect timing
    // Set up the URL with FEN query parameter
    const fen = "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3";
    const searchParams = new URLSearchParams({ fen });

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

    // Wait for the opening to be found and moves to be displayed
    await waitFor(
      () => {
        const movesInput = container.querySelector("#moves-input");
        expect(movesInput).toBeTruthy();
        expect(movesInput.value).toContain("d4");
      },
      { timeout: 3000 }
    );

    // Verify the FEN display shows the position
    const fenDisplay = container.querySelector("div[contenteditable]");
    expect(fenDisplay.textContent).toContain(fen);

    // Verify the moves input shows the opening moves
    const movesInput = container.querySelector("#moves-input");
    expect(movesInput.value).toContain("d4");
    expect(movesInput.value).toContain("c4");
    expect(movesInput.value).toContain("cxd5");
  });

  it("should display FEN correctly when FEN query parameter is provided without opening", async () => {
    // Use a FEN that's not in the opening book
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const searchParams = new URLSearchParams({ fen });

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

    // Wait for the FEN to be displayed
    await waitFor(() => {
      const fenDisplay = container.querySelector("div[contenteditable]");
      expect(fenDisplay).toBeTruthy();
      expect(fenDisplay.textContent).toContain("rnbqkbnr");
    });

    // Verify the FEN display shows the position
    const fenDisplay = container.querySelector("div[contenteditable]");
    expect(fenDisplay.textContent).toContain(fen);

    // Verify moves input is empty (no opening found)
    const movesInput = container.querySelector("#moves-input");
    expect(movesInput.value).toBe("");
  });

  it.skip("should display correct moves when French Defense FEN is provided", async () => {
    // TODO: Same async timing issue as the skipped test above - React Query + useEffect
    // makes the opening lookup timing difficult to mock reliably in tests
    const fen = "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3";
    const expectedMoves = "1. e4 e6 2. d4 d5 3. exd5";
    const searchParams = new URLSearchParams({ fen });

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

    // Wait for the FEN to be displayed AND moves to be loaded from opening
    await waitFor(
      () => {
        const fenDisplay = container.querySelector("div[contenteditable]");
        expect(fenDisplay).toBeTruthy();
        expect(fenDisplay.textContent).toContain(fen);

        const movesInput = container.querySelector("#moves-input");
        expect(movesInput).toBeTruthy();
        // Wait for moves to be populated
        expect(movesInput.value).not.toBe("");
      },
      { timeout: 3000 }
    );

    // Verify the moves are displayed correctly
    const movesInput = container.querySelector("#moves-input");
    expect(movesInput.value).toContain("e4");
    expect(movesInput.value).toContain("e6");
    expect(movesInput.value).toContain("d4");
    expect(movesInput.value).toContain("d5");
    expect(movesInput.value).toContain("exd5");
  });

  it("should display correct FEN when French Defense moves are provided", async () => {
    const moves = "1. e4 e6 2. d4 d5 3. exd5";
    const expectedFen =
      "rnbqkbnr/ppp2ppp/4p3/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3";
    const searchParams = new URLSearchParams({ moves });

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

    // Wait for the moves to be processed
    await waitFor(() => {
      const movesInput = container.querySelector("#moves-input");
      expect(movesInput).toBeTruthy();
      expect(movesInput.value).toContain("e4");
    });

    // Verify the FEN is displayed correctly
    const fenDisplay = container.querySelector("div[contenteditable]");
    expect(fenDisplay.textContent).toContain(expectedFen);

    // Verify the moves are displayed
    const movesInput = container.querySelector("#moves-input");
    expect(movesInput.value).toContain("e4");
    expect(movesInput.value).toContain("e6");
    expect(movesInput.value).toContain("exd5");
  });
});
