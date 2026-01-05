import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchPageContainer from "../src/searchPage/SearchPageContainer";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";

// Mock fetch for master games and moves
global.fetch = vi.fn();

describe("Master Game Navigation - Forward/Backward", () => {
  let queryClient;
  const testFen = "r1bqk2r/5pbp/p1np1p2/1p1Np3/4P3/N2B4/PPP2PPP/R2QK2R b KQkq - 3 11";
  const testGameMoves = "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 h6 11. Bh4";

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock getSimilarForFen
    global.fetch.mockImplementation((url) => {
      if (url.includes("getSimilarForFen")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ similar: [] }),
        });
      }
      
      // Mock queryMasterGamesByFen
      if (url.includes("queryMasterGamesByFen")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            games: [
              {
                idx: 1,
                white: "Carlsen, Magnus",
                black: "Nakamura, Hikaru",
                whiteElo: 2850,
                blackElo: 2800,
                whiteTitle: "GM",
                blackTitle: "GM",
                result: "1-0",
                date: "2023.05.15",
                event: "Test Tournament",
                eco: "B90",
                opening: "Sicilian Defense",
                ply: 22,
                source: "pgnmentor",
              },
            ],
            total: 1,
            page: 0,
            pageSize: 20,
          }),
        });
      }
      
      // Mock getMasterGameMoves
      if (url.includes("getMasterGameMoves")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ moves: testGameMoves }),
        });
      }
      
      // Mock getFromTosForFen
      if (url.includes("getFromTosForFen")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ next: [], from: [] }),
        });
      }
      
      // Mock scoresForFens
      if (url.includes("scoresForFens")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ scores: {} }),
        });
      }

      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  it("should navigate forward and backward through a master game", async () => {
    const mockOpeningBook = {
      [testFen]: {
        name: "Sicilian Defense, Najdorf Variation",
        moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
        eco: "B90",
      },
    };

    const { container, debug } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{ openingBook: mockOpeningBook, positionBook: {} }}
        >
          <SearchPageContainer initialFen={testFen} />
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Debug: Print the DOM to see what's rendering
    console.log("=== DOM CONTENT ===");
    console.log(container.innerHTML.substring(0, 2000));
    
    // Wait for master games to load
    await waitFor(
      () => {
        const masterGamesSection = container.textContent;
        console.log("Master games section:", masterGamesSection.includes("Master Games"));
        expect(screen.getByText(/Carlsen, Magnus/)).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Click on the game to load moves
    const whitePlayer = screen.getByText(/Carlsen, Magnus/);
    fireEvent.click(whitePlayer);

    // Wait for moves to load
    await waitFor(
      () => {
        const moveSequence = container.querySelector('textarea[placeholder*="Move Sequence"]');
        expect(moveSequence?.value).toContain("e4");
      },
      { timeout: 5000 }
    );

    // Find forward and back buttons
    const backButton = screen.getByText("◀");
    const forwardButton = screen.getByText("▶");

    // Initial state should be at the opening position (ply 11 in the example FEN)
    const initialMoveSequence = container.querySelector('textarea[placeholder*="Move Sequence"]');
    expect(initialMoveSequence?.value).toContain("Bh4"); // Should show full game

    // Test forward navigation
    fireEvent.click(forwardButton);
    await waitFor(() => {
      const fen = container.querySelector('input[placeholder*="FEN"]')?.value;
      expect(fen).not.toBe(testFen); // FEN should have changed
    });

    // Test backward navigation
    fireEvent.click(backButton);
    await waitFor(() => {
      const fen = container.querySelector('input[placeholder*="FEN"]')?.value;
      expect(fen).toBe(testFen); // Should return to opening FEN
    });

    // Test multiple forward clicks
    fireEvent.click(forwardButton);
    fireEvent.click(forwardButton);
    fireEvent.click(forwardButton);
    
    await waitFor(() => {
      const fen = container.querySelector('input[placeholder*="FEN"]')?.value;
      expect(fen).not.toBe(testFen); // Should be different from opening
    });

    // Test multiple backward clicks to return
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    
    await waitFor(() => {
      const fen = container.querySelector('input[placeholder*="FEN"]')?.value;
      expect(fen).toBe(testFen); // Should return to opening FEN
    });
  }, 30000); // 30 second timeout for this complex test

  it("should not go forward beyond the end of the game", async () => {
    const mockOpeningBook = {
      [testFen]: {
        name: "Sicilian Defense",
        moves: "1. e4 c5",
        eco: "B20",
      },
    };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{ openingBook: mockOpeningBook, positionBook: {} }}
        >
          <SearchPageContainer initialFen={testFen} />
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Wait for master games and load one
    await waitFor(() => {
      expect(screen.getByText(/Carlsen, Magnus/)).toBeTruthy();
    });

    const whitePlayer = screen.getByText(/Carlsen, Magnus/);
    fireEvent.click(whitePlayer);

    await waitFor(() => {
      const moveSequence = container.querySelector('textarea[placeholder*="Move Sequence"]');
      expect(moveSequence?.value).toContain("e4");
    });

    const forwardButton = screen.getByText("▶");
    
    // Click forward many times (more than the number of moves in the game)
    for (let i = 0; i < 50; i++) {
      fireEvent.click(forwardButton);
    }

    // Should not crash, and should be at the end of the game
    await waitFor(() => {
      const moveSequence = container.querySelector('textarea[placeholder*="Move Sequence"]');
      expect(moveSequence?.value).toContain("Bh4"); // Should still show full game
    });
  }, 30000);

  it("should not go backward before the start of navigation", async () => {
    const mockOpeningBook = {
      [testFen]: {
        name: "Sicilian Defense",
        moves: "1. e4 c5",
        eco: "B20",
      },
    };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{ openingBook: mockOpeningBook, positionBook: {} }}
        >
          <SearchPageContainer initialFen={testFen} />
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Wait for master games and load one
    await waitFor(() => {
      expect(screen.getByText(/Carlsen, Magnus/)).toBeTruthy();
    });

    const whitePlayer = screen.getByText(/Carlsen, Magnus/);
    fireEvent.click(whitePlayer);

    await waitFor(() => {
      const moveSequence = container.querySelector('textarea[placeholder*="Move Sequence"]');
      expect(moveSequence?.value).toContain("e4");
    });

    const backButton = screen.getByText("◀");
    const initialFen = container.querySelector('input[placeholder*="FEN"]')?.value;
    
    // Click backward many times
    for (let i = 0; i < 50; i++) {
      fireEvent.click(backButton);
    }

    // Should not crash, and FEN should be at or before opening position
    await waitFor(() => {
      const fen = container.querySelector('input[placeholder*="FEN"]')?.value;
      expect(fen).toBeTruthy(); // Should have a valid FEN
    });
  }, 30000);
});
