import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { MasterGames } from "../src/searchPage/MasterGames";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import type { BoardState } from "../src/types";

describe("MasterGames Component", () => {
  let queryClient: QueryClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  const testFen =
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Wrapper component to provide chess ref
  const TestWrapper = ({
    fen,
    openingName,
    onBoardStateChange,
  }: {
    fen: string;
    openingName?: string;
    onBoardStateChange?: (state: BoardState) => void;
  }) => {
    const chess = useRef(new ChessPGN());
    const setBoardState = onBoardStateChange || vi.fn();

    return (
      <QueryClientProvider client={queryClient}>
        <MasterGames
          fen={fen}
          openingName={openingName}
          chess={chess}
          setBoardState={setBoardState}
        />
      </QueryClientProvider>
    );
  };

  it("should display master games for a position", async () => {
    // First call: getMasterGamesByPosition returns openings and masters
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        openings: [
          {
            name: "Italian Game",
            fen: testFen,
            eco: "C50",
            gameCount: 2,
          },
        ],
        masters: [
          { playerName: "Carlsen, Magnus", gameCount: 2 },
          { playerName: "Nakamura, Hikaru", gameCount: 1 },
        ],
        totalMasters: 2,
        totalGames: 2,
        page: 0,
        pageSize: 10,
        usedAncestorFallback: false,
        matchedPositions: 1,
      }),
    });

    render(<TestWrapper fen={testFen} openingName="Italian Game" />);

    // Wait for data to load and display
    await waitFor(() => {
      expect(screen.getByText(/Master Games/)).toBeTruthy();
    });

    // Check masters are displayed
    expect(screen.getByText(/Carlsen, Magnus/)).toBeTruthy();
    expect(screen.getByText(/Nakamura, Hikaru/)).toBeTruthy();
  });

  it("should show loading state", () => {
    fetchSpy.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<TestWrapper fen={testFen} openingName="Italian Game" />);

    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it("should render nothing when no games found", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        openings: [],
        masters: [],
        totalMasters: 0,
        totalGames: 0,
        page: 0,
        pageSize: 10,
        usedAncestorFallback: false,
        matchedPositions: 0,
      }),
    });

    render(<TestWrapper fen={testFen} openingName="Rare Opening" />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).toBeNull();
    });

    // Component should render nothing - no player names or games visible
    expect(screen.queryByText(/Master Games/i)).toBeNull();
  });

  it("should refetch when FEN changes", async () => {
    const fen1 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const fen2 =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openings: [
            { name: "King's Pawn", fen: fen1, eco: "B00", gameCount: 1 },
          ],
          masters: [{ playerName: "Player A", gameCount: 1 }],
          totalMasters: 1,
          totalGames: 1,
          page: 0,
          pageSize: 10,
          usedAncestorFallback: false,
          matchedPositions: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openings: [
            { name: "King's Pawn Game", fen: fen2, eco: "C20", gameCount: 1 },
          ],
          masters: [{ playerName: "Player C", gameCount: 1 }],
          totalMasters: 1,
          totalGames: 1,
          page: 0,
          pageSize: 10,
          usedAncestorFallback: false,
          matchedPositions: 1,
        }),
      });

    const { rerender } = render(
      <TestWrapper fen={fen1} openingName="King's Pawn" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Player A/)).toBeTruthy();
    });

    // Change FEN
    rerender(<TestWrapper fen={fen2} openingName="King's Pawn Game" />);

    await waitFor(() => {
      expect(screen.getByText(/Player C/)).toBeTruthy();
    });

    // Verify fetch was called twice with different FENs
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(encodeURIComponent(fen1)),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(encodeURIComponent(fen2)),
      expect.any(Object),
    );
  });

  it("should load game moves when clicking a game row", async () => {
    const gameMoves = "1. e4 e5 2. Nf3 Nc6 3. Bb5";
    const setBoardState = vi.fn();

    // First call: getMasterGamesByPosition returns openings
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openings: [
            { name: "Spanish Game", fen: testFen, eco: "C60", gameCount: 1 },
          ],
          masters: [{ playerName: "Fischer, Bobby", gameCount: 1 }],
          totalMasters: 1,
          totalGames: 1,
          page: 0,
          pageSize: 10,
          usedAncestorFallback: false,
          matchedPositions: 1,
        }),
      })
      // Second call: queryMasterGamesByFen returns games for the opening
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          games: [
            {
              idx: 42,
              white: "Fischer, Bobby",
              black: "Spassky, Boris",
              whiteElo: 2785,
              blackElo: 2660,
              result: "1-0",
              date: "1972.07.11",
              event: "World Championship",
              ply: 56,
              source: "pgnmentor",
            },
          ],
          total: 1,
          page: 0,
          pageSize: 20,
        }),
      })
      // Third call: getMasterGameMoves returns moves
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ moves: gameMoves }),
      });

    render(
      <TestWrapper
        fen={testFen}
        openingName="Spanish Game"
        onBoardStateChange={setBoardState}
      />,
    );

    // Wait for openings to load
    await waitFor(() => {
      expect(screen.getByText(/Spanish Game/)).toBeTruthy();
    });

    // Click on the opening to see games (the opening row has ECO + name)
    fireEvent.click(screen.getByText(/Spanish Game/));

    // Wait for games to load - look for the game row which has "Click to load game" title
    await waitFor(() => {
      expect(screen.getByTitle("Click to load game")).toBeTruthy();
    });

    // Click on the game row
    fireEvent.click(screen.getByTitle("Click to load game"));

    // Wait for moves to be fetched and board state to update
    await waitFor(() => {
      expect(setBoardState).toHaveBeenCalled();
    });

    // Verify getMasterGameMoves was called
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("getMasterGameMoves?gameId=42"),
      expect.any(Object),
    );
  });
});
