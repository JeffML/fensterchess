import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchPageContainer from "../src/searchPage/SearchPageContainer";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";
import { SelectedSitesContext } from "../src/contexts/SelectedSitesContext";

// Mock fetch for master games and moves
global.fetch = vi.fn();

describe("Master Game Navigation - Forward/Backward", () => {
  let queryClient;
  const testFen =
    "r1bqk2r/5pbp/p1np1p2/1p1Np3/4P3/N2B4/PPP2PPP/R2QK2R b KQkq - 3 11";
  const testGameMoves =
    "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 h6 11. Bh4";
  // FEN after stepping back one move from the end of the loaded game
  const backOneFen =
    "rnb1kb1r/1p3pp1/p2ppn1p/4P1B1/3N1P2/q1N5/P1PQ2PP/1R2KB1R w Kkq - 0 11";

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

      // Mock queryMasterGamesByFen - return different games based on FEN
      if (url.includes("queryMasterGamesByFen")) {
        const encodedFen = url.split("fen=")[1];
        const fen = decodeURIComponent(encodedFen);

        // Different games for different positions
        if (fen.includes(backOneFen.split(" ")[0])) {
          // Games for position after stepping back
          return Promise.resolve({
            ok: true,
            json: async () => ({
              games: [
                {
                  idx: 2,
                  white: "Anand, Viswanathan",
                  black: "Lautier, Joel",
                  whiteElo: 2770,
                  blackElo: 2650,
                  whiteTitle: "GM",
                  blackTitle: "GM",
                  result: "1-0",
                  date: "1997.01.01",
                  event: "Previous Position Event",
                  eco: "B90",
                  opening: "Sicilian Defense",
                  ply: 21,
                  source: "pgnmentor",
                },
              ],
              total: 1,
              page: 0,
              pageSize: 20,
            }),
          });
        } else {
          // Original position games
          return Promise.resolve({
            ok: true,
            json: async () => ({
              games: [
                {
                  idx: 1,
                  white: "Topalov, Veselin",
                  black: "Carlsen, Magnus",
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

      // Mock getExternalOpeningStats
      if (url.includes("getExternalOpeningStats")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }

      // Mock Wikipedia API for theory
      if (url.includes("wikipedia.org") || url.includes("wikibooks.org")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ query: { pages: [{ extract: "" }] } }),
        });
      }

      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  it("should navigate forward and backward through a master game", async () => {
    const mockOpeningBook = {
      [testFen]: {
        name: "Sicilian Defense, Najdorf Variation",
        moves:
          "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 h6 11. Bh4",
        eco: "B90",
      },
      [backOneFen]: {
        name: "Sicilian Defense, Najdorf Variation",
        moves:
          "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. e5 h6",
        eco: "B90",
      },
    };

    const mockSelectedSites = {
      selectedSites: ["pgnmentor"],
      handleToggle: vi.fn(),
    };

    // Set up URL with FEN parameter
    delete window.location;
    window.location = { search: `?fen=${encodeURIComponent(testFen)}` };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookContext.Provider
          value={{ openingBook: mockOpeningBook, positionBook: {} }}
        >
          <SelectedSitesContext.Provider value={mockSelectedSites}>
            <SearchPageContainer />
          </SelectedSitesContext.Provider>
        </OpeningBookContext.Provider>
      </QueryClientProvider>
    );

    // Wait for opening to load
    await waitFor(() => {
      expect(screen.getByText(/Sicilian Defense/)).toBeTruthy();
    });

    // Click on "External Info" tab to show master games
    const externalInfoTab = await waitFor(() =>
      screen.getByText("External Info")
    );
    fireEvent.click(externalInfoTab);

    // Wait for master games to load - should see Topalov-Carlsen
    await waitFor(
      () => {
        expect(screen.getByText(/Topalov, Veselin/)).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Click on the game to load moves
    const whitePlayer = screen.getByText(/Topalov, Veselin/);
    fireEvent.click(whitePlayer);

    // Wait for moves to load
    await waitFor(
      () => {
        const moveSequence = container.querySelector("#moves-input");
        expect(moveSequence?.value).toContain("e4");
      },
      { timeout: 5000 }
    );

    // Find back button
    const backButton = screen.getByText("<<");

    // Step back one move - this should trigger master games to update
    fireEvent.click(backButton);

    // Wait for the master games to update to show Anand-Lautier for the new position
    // (Don't check specific FEN, just check that the player list changed)
    await waitFor(
      () => {
        expect(screen.getByText(/Anand, Viswanathan/)).toBeTruthy();
      },
      { timeout: 10000 }
    );

    // Find forward button
    const forwardButton = screen.getByText(">>");

    // Step forward one move
    fireEvent.click(forwardButton);

    // Master games list should return to original (Topalov-Carlsen)
    await waitFor(
      () => {
        expect(screen.getByText(/Topalov, Veselin/)).toBeTruthy();
      },
      { timeout: 5000 }
    );
  }, 15000);
});
