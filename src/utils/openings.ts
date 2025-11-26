import { ChessPGN } from "@chess-pgn/chess-pgn";
import type { FEN, Opening, OpeningBook, PGN } from "../types";

export const getFensForMoves = (plies: string[]): [FEN[], PGN[]] => {
  const chess = new ChessPGN();
  const [fens, varMoves] = plies.reduce<[FEN[], PGN[]]>(
    ([a, b], move) => {
      chess.move(move);
      a.push(chess.fen());
      b.push(chess.pgn()); // returns string like '1. d4 Nf6 2. c4 e6 3. Nc3'
      return [a, b];
    },
    [[], []]
  );

  return [fens, varMoves];
};

export const pliesAryToMovesString = (plies: string[]): string => {
  return plies.reduce((prev, curr, i) => {
    if (i % 2 === 0) prev += `${i / 2 + 1}. `;
    prev += `${curr} `;
    return prev;
  }, "");
};

export const movesStringToPliesAry = (moves: string): string[] => {
  const plies = moves.split(/\s+/).map((move) => {
    const matches = move.match(/(?:\d{1,3}\.)?(.*)/);
    return matches ? matches[1] : "";
  });
  return plies.filter((p) => p !== "");
};

interface GameNode {
  fen: () => FEN;
}

interface GameAdapter {
  nodes: () => GameNode[];
}

export const findOpeningForKokopuGame = (
  game: GameAdapter,
  openingBook: OpeningBook
): Opening | undefined => {
  const fens = game
    .nodes()
    .slice(0, 50)
    .map((n) => n.fen());

  let opening: Opening | undefined;

  for (const fen of fens.reverse()) {
    const obEntry = openingBook[fen];
    if (obEntry) {
      const { eco, name, moves } = obEntry;

      opening = { eco, name, moves, fen };
      break;
    }
  }

  return opening;
};

/**
 * Find opening from raw PGN text by parsing it and walking through positions
 * @param pgnText - Raw PGN text (headers + moves)
 * @param openingBook - The opening book database
 * @param positionBook - Position-only lookup for fallback
 * @returns Opening or undefined if not found
 */
export const findOpeningFromPgnText = (
  pgnText: string,
  openingBook: OpeningBook,
  positionBook?: Record<string, FEN[]>
): Opening | undefined => {
  try {
    const chess = new ChessPGN();
    chess.loadPgn(pgnText);
    
    // Get all positions from the game
    const history = chess.history();
    chess.reset();
    
    const fens: FEN[] = [];
    for (const move of history) {
      chess.move(move);
      fens.push(chess.fen());
    }
    
    // Walk backward through positions to find first match
    for (const fen of fens.reverse()) {
      let opening = openingBook[fen];
      
      // Try position book fallback if provided
      if (!opening && positionBook) {
        const posEntry = positionBook[fen.split(" ")[0]];
        if (posEntry && posEntry.length > 0) {
          opening = openingBook[posEntry[0]];
        }
      }
      
      if (opening) {
        return { ...opening, fen };
      }
    }
    
    return undefined;
  } catch (e) {
    console.error("Error finding opening from PGN text:", e);
    return undefined;
  }
};
