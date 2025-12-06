import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { GamesTab } from "../src/pgnImportPage/tabsPanelEtc/GamesTab";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";
import type { GameDatabase } from "../src/pgnImportPage/PgnTabsPanelContainer";

// Mock GameAdapter
vi.mock("../src/utils/gameAdapter", () => ({
  GameAdapter: vi.fn(),
}));

describe("GamesTab Filter Synchronization", () => {
  const mockOpeningBook = {};
  const mockPositionBook = {};

  const createMockDatabase = (
    games: Array<{ opening: string }>
  ): GameDatabase => {
    return {
      gameCount: () => games.length,
      games: async function* () {
        // Not used in this test
      },
      indices: games.map((game, index) => ({
        headers: {
          Opening: game.opening,
          White: "Player A",
          Black: "Player B",
          Result: "1-0",
          Round: "1",
          Date: "2025.12.06",
        },
        pgnText: '[Event "Test"]\n1. e4 e5',
      })),
      parseGameAtIndex: vi.fn(),
    };
  };

  const mockSetGame = vi.fn();
  const mockSetTabIndex = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show filtered games when switching to Games tab with active filter", async () => {
    // Create a database with 3 games, 2 with "Sicilian Defense", 1 with "French Defense"
    const db = createMockDatabase([
      { opening: "Sicilian Defense" },
      { opening: "Sicilian Defense" },
      { opening: "French Defense" },
    ]);

    // Scenario: User is on Summary tab (tabIndex=0), selects "Sicilian Defense" filter
    const filter = ["Sicilian Defense"];

    const { rerender } = render(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={filter}
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={0} // Summary tab active
        />
      </OpeningBookContext.Provider>
    );

    // Now switch to Games tab (tabIndex=1)
    rerender(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={filter}
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={1} // Games tab now active
        />
      </OpeningBookContext.Provider>
    );

    // Wait for games to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Should show only 2 games (Sicilian Defense games)
    const gameRows = screen.getAllByText(/Player A/);
    expect(gameRows).toHaveLength(2);

    // Should not show the French Defense game
    expect(screen.queryByText(/French Defense/)).not.toBeInTheDocument();
  });

  it("should reload games when filter changes on Games tab", async () => {
    const db = createMockDatabase([
      { opening: "Sicilian Defense" },
      { opening: "Sicilian Defense" },
      { opening: "French Defense" },
    ]);

    // Start with no filter
    const { rerender } = render(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={[]}
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={1} // Games tab active
        />
      </OpeningBookContext.Provider>
    );

    // Wait for initial load - should show all 3 games
    await waitFor(() => {
      const gameRows = screen.getAllByText(/Player A/);
      expect(gameRows).toHaveLength(3);
    });

    // Now apply filter
    rerender(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={["French Defense"]}
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={1}
        />
      </OpeningBookContext.Provider>
    );

    // Wait for filtered results - should show only 1 game
    await waitFor(() => {
      const gameRows = screen.getAllByText(/Player A/);
      expect(gameRows).toHaveLength(1);
    });

    // Should show French Defense
    expect(screen.getByText(/French Defense/)).toBeInTheDocument();
  });

  it("should show all games when filter is empty after switching tabs", async () => {
    const db = createMockDatabase([
      { opening: "Sicilian Defense" },
      { opening: "French Defense" },
    ]);

    // Start on Summary tab with filter
    const { rerender } = render(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={["Sicilian Defense"]}
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={0}
        />
      </OpeningBookContext.Provider>
    );

    // Clear filter and switch to Games tab
    rerender(
      <OpeningBookContext.Provider
        value={{
          openingBook: mockOpeningBook,
          positionBook: mockPositionBook,
        }}
      >
        <GamesTab
          db={db}
          filter={[]} // Filter cleared
          setGame={mockSetGame}
          setTabIndex={mockSetTabIndex}
          tabIndex={1}
        />
      </OpeningBookContext.Provider>
    );

    // Should show all games
    await waitFor(() => {
      const gameRows = screen.getAllByText(/Player A/);
      expect(gameRows).toHaveLength(2);
    });
  });
});
