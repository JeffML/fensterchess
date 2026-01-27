import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
              {...{
                chess,
                boardState,
                setBoardState,
                data: mockOpeningBook[
                  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                ],
              }}
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
});
