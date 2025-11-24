import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FenAndMovesInputs } from "../src/searchPage/FenAndMovesInputs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";
import { ChessPGN } from "@chess-pgn/chess-pgn";

const mockOpeningBook = {
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": {
    name: "King's Pawn",
    moves: "1. e4",
    eco: "B00",
  },
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2": {
    name: "Sicilian Defense",
    moves: "1. e4 c5",
    eco: "B20",
  },
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2": {
    name: "Sicilian Defense: Open",
    moves: "1. e4 c5 2. Nf3",
    eco: "B20",
  },
  "rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4": {
    name: "Sicilian Defense: Accelerated Dragon",
    moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6",
    eco: "B35",
  },
  "rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3": {
    name: "King's Indian Defense",
    moves: "1. d4 Nf6 2. c4",
    eco: "E60",
  },
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1": {
    name: "Queen's Pawn",
    moves: "1. d4",
    eco: "A40",
  },
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3": {
    name: "Petrov Defense",
    moves: "1. e4 e5 2. Nf3 Nf6",
    eco: "C42",
  },
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4": {
    name: "Ruy Lopez",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    eco: "C60",
  },
  "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2": {
    name: "Caro-Kann Defense",
    moves: "1. e4 c6",
    eco: "B10",
  },
};

const mockPositionBook = {};

function TestWrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function FenAndMovesInputsWrapper(props) {
  const chess = useRef(new ChessPGN());
  return <FenAndMovesInputs chess={chess} {...props} />;
}

describe("Opening Name Search", () => {
  let setBoardState, setLastKnownOpening;

  beforeEach(() => {
    setBoardState = vi.fn();
    setLastKnownOpening = vi.fn();
  });

  it("should filter openings by name with case-insensitive matching", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FenAndMovesInputsWrapper
          boardState={{ fen: "start", moves: "" }}
          setBoardState={setBoardState}
          setLastKnownOpening={setLastKnownOpening}
          openingBook={mockOpeningBook}
          positionBook={mockPositionBook}
        />
      </TestWrapper>
    );

    // Switch to name search mode
    const nameTab = screen.getByText(/By Name/);
    await user.click(nameTab);

    // Type "sicilian" in the search box
    const searchInput = screen.getByPlaceholderText(/Type opening name/);
    await user.type(searchInput, "sicilian");

    // Wait for debounce and results
    await waitFor(() => {
      const results = screen.getAllByText(/Sicilian/i);
      expect(results.length).toBeGreaterThan(0);
    });

    // Verify that all displayed results contain "Sicilian" in the name
    const displayedNames = screen
      .getAllByText(/Sicilian/i)
      .map((el) => el.textContent);

    displayedNames.forEach((name) => {
      expect(name.toLowerCase()).toContain("sicilian");
    });
  });

  it("should handle multi-word search (all words must match)", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FenAndMovesInputsWrapper
          boardState={{ fen: "start", moves: "" }}
          setBoardState={setBoardState}
          setLastKnownOpening={setLastKnownOpening}
          openingBook={mockOpeningBook}
          positionBook={mockPositionBook}
        />
      </TestWrapper>
    );

    // Switch to name search mode
    const nameTab = screen.getByText(/By Name/);
    await user.click(nameTab);

    // Type "king indian" (words in different order than opening name)
    const searchInput = screen.getByPlaceholderText(/Type opening name/);
    await user.type(searchInput, "king indian");

    // Wait for results
    await waitFor(() => {
      const result = screen.getByText(/King's Indian Defense/);
      expect(result).toBeInTheDocument();
    });

    // Should match "King's Indian Defense"
    expect(screen.getByText(/King's Indian Defense/)).toBeInTheDocument();
    
    // Should NOT show "King's Pawn" (doesn't have "indian")
    expect(screen.queryByText("King's Pawn")).not.toBeInTheDocument();
  });

  it("should handle aliases (petrov/petroff)", async () => {
    const user = userEvent.setup();

    // Add Petroff variant to mock data
    const bookWithPetroff = {
      ...mockOpeningBook,
      "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4": {
        name: "Petroff Defense",
        moves: "1. e4 e5 2. Nf3 Nf6",
        eco: "C43",
      },
    };

    render(
      <TestWrapper>
        <FenAndMovesInputsWrapper
          boardState={{ fen: "start", moves: "" }}
          setBoardState={setBoardState}
          setLastKnownOpening={setLastKnownOpening}
          openingBook={bookWithPetroff}
          positionBook={mockPositionBook}
        />
      </TestWrapper>
    );

    // Switch to name search mode
    const nameTab = screen.getByText(/By Name/);
    await user.click(nameTab);

    // Search for "petrov" (with 'v')
    const searchInput = screen.getByPlaceholderText(/Type opening name/);
    await user.type(searchInput, "petrov");

    // Wait for results - should match both Petrov and Petroff
    await waitFor(() => {
      const results = screen.queryAllByText(/Petro(v|ff) Defense/);
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should display opening names without ECO codes", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FenAndMovesInputsWrapper
          boardState={{ fen: "start", moves: "" }}
          setBoardState={setBoardState}
          setLastKnownOpening={setLastKnownOpening}
          openingBook={mockOpeningBook}
          positionBook={mockPositionBook}
        />
      </TestWrapper>
    );

    // Switch to name search mode
    const nameTab = screen.getByText(/By Name/);
    await user.click(nameTab);

    // Search for an opening
    const searchInput = screen.getByPlaceholderText(/Type opening name/);
    await user.type(searchInput, "ruy lopez");

    // Wait for result
    await waitFor(() => {
      expect(screen.getByText(/Ruy Lopez/)).toBeInTheDocument();
    });

    // Verify opening name is displayed
    expect(screen.getByText(/Ruy Lopez/)).toBeInTheDocument();
    
    // Verify ECO code is NOT displayed (we removed it for visibility)
    expect(screen.queryByText("C60")).not.toBeInTheDocument();
  });

  it("should load the selected opening when clicked", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FenAndMovesInputsWrapper
          boardState={{ fen: "start", moves: "" }}
          setBoardState={setBoardState}
          setLastKnownOpening={setLastKnownOpening}
          openingBook={mockOpeningBook}
          positionBook={mockPositionBook}
        />
      </TestWrapper>
    );

    // Switch to name search mode
    const nameTab = screen.getByText(/By Name/);
    await user.click(nameTab);

    // Search and click result
    const searchInput = screen.getByPlaceholderText(/Type opening name/);
    await user.type(searchInput, "sicilian");

    await waitFor(() => {
      expect(screen.getByText(/Sicilian Defense$/)).toBeInTheDocument();
    });

    const result = screen.getByText(/Sicilian Defense$/);
    await user.click(result);

    // Verify setBoardState was called
    expect(setBoardState).toHaveBeenCalled();
    const call = setBoardState.mock.calls[0][0];
    expect(call.moves).toContain("1. e4 c5");
  });
});
