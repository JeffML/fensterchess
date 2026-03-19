import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchPage from "../src/searchPage/SearchPage";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";
import { extractSanMoves } from "../src/utils/chessTools";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { useRef, useState } from "react";

describe("Forward/Back Navigation", () => {
  let queryClient;
  let mockOpeningBook;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockOpeningBook = {
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
        name: "Starting Position",
        moves: "",
        eco: "",
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
  });

  // Helper: renders SearchPage with controlled boardState
  const renderSearchPage = (initialBoardState) => {
    let externalSetBoardState;

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      const [boardState, setBoardState] = useState(initialBoardState);

      // Expose the setter so tests can inspect state changes
      externalSetBoardState = setBoardState;

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage
              chess={chess}
              boardState={boardState}
              setBoardState={setBoardState}
              data={null}
            />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    const utils = render(<TestComponent />);
    return { ...utils, getExternalSetBoardState: () => externalSetBoardState };
  };

  it("should have Forward button disabled initially", () => {
    renderSearchPage({ fen: "start", moves: "", currentPly: 0 });
    const forwardButton = screen.getByText(">>");
    expect(forwardButton).toBeTruthy();
    expect(forwardButton.disabled).toBe(true);
  });

  it("back button navigates one ply back after moves are loaded", () => {
    // Two moves played: e4 e5; currentPly is at end (2)
    renderSearchPage({ fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", moves: "1. e4 e5", currentPly: 2 });

    const backButton = screen.getByText("<<");
    expect(backButton.disabled).toBe(false);

    act(() => { fireEvent.click(backButton); });

    // After one back press the forward button must be enabled (we're no longer at end)
    const forwardButton = screen.getByText(">>");
    expect(forwardButton.disabled).toBe(false);
  });

  it("back button should work on the first press, not require two presses", () => {
    // Regression: currentPly must not be inflated by the PGN '*' termination marker.
    // One move played: e4; currentPly is 1. After one back press we should be at ply 0.
    // At ply 0, forward becomes enabled — proof that back worked on the first press.
    renderSearchPage({ fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", moves: "1. e4", currentPly: 1 });

    const backButton = screen.getByText("<<");
    act(() => { fireEvent.click(backButton); });

    // After one back press we should be at ply 0; forward must now be enabled
    const forwardButton = screen.getByText(">>");
    expect(forwardButton.disabled).toBe(false);
  });

  it("forward button is disabled when currentPly equals move count", () => {
    renderSearchPage({ fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", moves: "1. e4 e5", currentPly: 2 });

    const forwardButton = screen.getByText(">>");
    expect(forwardButton.disabled).toBe(true);
  });

  it("forward button is enabled when currentPly is less than move count", () => {
    renderSearchPage({ fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", moves: "1. e4 e5", currentPly: 1 });

    const forwardButton = screen.getByText(">>");
    expect(forwardButton.disabled).toBe(false);
  });
});

describe("extractSanMoves", () => {
  it("strips the PGN game-termination marker (*) from move count", () => {
    // Regression: chess.current.pgn() returns e.g. "1. e4 *"
    // The '*' must not be counted as a move, or currentPly would be inflated by 1.
    const moves = extractSanMoves("1. e4 *");
    expect(moves).toEqual(["e4"]);
    expect(moves.length).toBe(1);
  });

  it("handles multi-move PGN with termination marker", () => {
    const moves = extractSanMoves("1. e4 e5 2. Nf3 *");
    expect(moves).toEqual(["e4", "e5", "Nf3"]);
    expect(moves.length).toBe(3);
  });

  it("returns empty array for empty PGN", () => {
    expect(extractSanMoves("")).toEqual([]);
  });
});
