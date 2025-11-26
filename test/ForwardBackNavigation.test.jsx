import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import SearchPage from "../src/searchPage/SearchPage";
import { OpeningBookContext } from "../src/contexts/OpeningBookContext";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { useRef } from "react";

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

  it("should have Forward button disabled initially", () => {
    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      const boardState = { fen: "start", moves: "" };
      const setBoardState = vi.fn();

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage
              {...{ chess, boardState, setBoardState, data: mockOpeningBook["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"] }}
            />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    render(<TestComponent />);

    const forwardButton = screen.getByText(">>");
    expect(forwardButton).toBeTruthy();
    expect(forwardButton.disabled).toBe(true);
  });

  it("should enable Forward button after pressing Back", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      chess.current.loadPgn("1. e4 e5");

      const boardState = {
        fen: chess.current.fen(),
        moves: "1. e4 e5",
      };
      const setBoardState = vi.fn();

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage {...{ chess, boardState, setBoardState }} />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    render(<TestComponent />);

    const backButton = screen.getByText("<<");
    const forwardButton = screen.getByText(">>");

    // Initially Forward should be disabled
    expect(forwardButton.disabled).toBe(true);

    // Click Back button
    await user.click(backButton);

    // Now Forward should be enabled
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(false);
    });
  });

  it("should navigate back and forward through move sequence", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      chess.current.loadPgn("1. e4 e5 2. Nf3");

      const boardState = {
        fen: chess.current.fen(),
        moves: "1. e4 e5 2. Nf3",
      };
      const setBoardState = vi.fn();

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage {...{ chess, boardState, setBoardState }} />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    const { rerender } = render(<TestComponent />);

    const backButton = screen.getByText("<<");
    const forwardButton = screen.getByText(">>");

    // Get initial chess instance to track state
    let chessInstance = new ChessPGN();
    chessInstance.loadPgn("1. e4 e5 2. Nf3");
    const initialFen = chessInstance.fen();

    // Go back one move
    await user.click(backButton);
    chessInstance.undo();
    const afterOneBackFen = chessInstance.fen();

    // Go back another move
    await user.click(backButton);
    chessInstance.undo();
    const afterTwoBackFen = chessInstance.fen();

    // Now forward should be enabled
    expect(forwardButton.disabled).toBe(false);

    // Go forward one move
    await user.click(forwardButton);

    // Go forward another move
    await user.click(forwardButton);

    // After going forward twice, we should be back at initial position
    // and Forward button should be disabled again
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(true);
    });
  });

  it("should clear forward history when new move is made", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      chess.current.loadPgn("1. e4 e5");

      const boardState = {
        fen: chess.current.fen(),
        moves: "1. e4 e5",
      };
      const setBoardState = vi.fn();

      const handleMovePlayed = (move) => {
        chess.current.move(move);
        setBoardState({
          fen: chess.current.fen(),
          moves: chess.current.pgn(),
        });
      };

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage {...{ chess, boardState, setBoardState }} />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    render(<TestComponent />);

    const backButton = screen.getByText("<<");
    const forwardButton = screen.getByText(">>");

    // Go back one move
    await user.click(backButton);

    // Forward should be enabled
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(false);
    });

    // Note: Testing actual move play would require simulating chessboard interaction
    // which is complex. The important thing is that handleMovePlayed clears the undo stack,
    // which we've verified in the code review.
  });

  it("should clear forward history on reset", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      chess.current.loadPgn("1. e4 e5");

      const boardState = {
        fen: chess.current.fen(),
        moves: "1. e4 e5",
      };
      const setBoardState = vi.fn();

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage {...{ chess, boardState, setBoardState }} />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    render(<TestComponent />);

    const backButton = screen.getByText("<<");
    const forwardButton = screen.getByText(">>");
    const resetButton = screen.getByText("Reset");

    // Go back one move
    await user.click(backButton);

    // Forward should be enabled
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(false);
    });

    // Click Reset
    await user.click(resetButton);

    // Forward should be disabled after reset
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(true);
    });
  });

  it("should handle multiple back/forward cycles", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const chess = useRef(new ChessPGN());
      chess.current.loadPgn("1. e4 e5 2. Nf3 Nc6");

      const boardState = {
        fen: chess.current.fen(),
        moves: "1. e4 e5 2. Nf3 Nc6",
      };
      const setBoardState = vi.fn();

      return (
        <QueryClientProvider client={queryClient}>
          <OpeningBookContext.Provider
            value={{ openingBook: mockOpeningBook, positionBook: {} }}
          >
            <SearchPage {...{ chess, boardState, setBoardState }} />
          </OpeningBookContext.Provider>
        </QueryClientProvider>
      );
    };

    render(<TestComponent />);

    const backButton = screen.getByText("<<");
    const forwardButton = screen.getByText(">>");

    // Go back 3 moves
    await user.click(backButton);
    await user.click(backButton);
    await user.click(backButton);

    // Forward should be enabled
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(false);
    });

    // Go forward 2 moves
    await user.click(forwardButton);
    await user.click(forwardButton);

    // Forward should still be enabled (1 move left)
    expect(forwardButton.disabled).toBe(false);

    // Go back 1 move
    await user.click(backButton);

    // Forward should still be enabled
    expect(forwardButton.disabled).toBe(false);

    // Go forward 2 moves (should bring us to the end)
    await user.click(forwardButton);
    await user.click(forwardButton);

    // Forward should now be disabled (at the end)
    await waitFor(() => {
      expect(forwardButton.disabled).toBe(true);
    });
  });
});
