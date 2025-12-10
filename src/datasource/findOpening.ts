import { ChessPGN } from "@chess-pgn/chess-pgn";
import {
  findOpening as ecoFindOpening,
  lookupByMoves,
  getPositionBook,
} from "@chess-openings/eco.json";
import type {
  FEN,
  Opening,
  OpeningBook,
  PositionBook,
  FromTosResponse,
  ScoresResponse,
  ScoresRequest,
} from "../types";

interface NearestOpeningResult {
  opening: Opening | undefined;
  movesBack: number;
}

export function findOpening(
  openingBook: OpeningBook,
  fen: FEN | "start",
  positionBook: PositionBook,
  fromTosForFen: FromTosResponse | null,
  scoresForFens: ScoresResponse | null
): Opening | undefined {
  // Use eco.json's findOpening for base lookup (cast to handle type compatibility)
  const baseOpening = ecoFindOpening(
    openingBook as any,
    fen === "start" ? "start" : fen,
    positionBook
  );

  if (!baseOpening) {
    return undefined;
  }

  // Create enriched opening with fensterchess-specific fields
  let opening: Opening = { ...baseOpening };

  // Enrich with scores and transitions (fensterchess-specific)
  if (fromTosForFen && scoresForFens) {
    const { score, nextScores, fromScores } = scoresForFens;
    opening.score = score;

    // Only map if next/from arrays exist (API call succeeded)
    if (fromTosForFen.next && Array.isArray(fromTosForFen.next)) {
      opening.next = fromTosForFen.next.map((fen, i) => {
        const variation: Opening = {
          ...openingBook[fen],
          score: nextScores?.[i],
        };
        return variation;
      });
    }

    if (fromTosForFen.from && Array.isArray(fromTosForFen.from)) {
      opening.from = fromTosForFen.from.map((fen, i) => {
        const variation: Opening = {
          ...openingBook[fen],
          score: fromScores?.[i],
        };
        return variation;
      });
    }

    // chess.current.loadPgn(opening.moves);  // handled by useEffect in SearchPageContainer
  }
  return opening;
}

/**
 * Walks backward through chess move history to find the nearest opening in the database.
 * Returns the opening and how many moves back it was found.
 *
 * @param moves - The PGN moves string
 * @param openingBook - The opening book database
 * @param positionBook - The position-only lookup database
 * @returns Object with opening (or undefined) and movesBack count
 */
export function findNearestOpening(
  moves: string,
  openingBook: OpeningBook
): NearestOpeningResult {
  if (!moves || moves.trim() === "") {
    return { opening: undefined, movesBack: 0 };
  }

  // Create a temporary chess instance to walk through moves
  const tempChess = new ChessPGN();

  try {
    tempChess.loadPgn(moves);
  } catch (e) {
    console.error("Failed to load moves for backward search:", e);
    return { opening: undefined, movesBack: 0 };
  }

  // Use eco.json's optimized lookupByMoves
  // Note: Type cast needed because fensterchess Opening.src is optional
  const posBook = getPositionBook(openingBook as any);
  const result = lookupByMoves(tempChess, openingBook as any, {
    positionBook: posBook,
  });

  return {
    opening: result.opening as Opening | undefined,
    movesBack: result.movesBack,
  };
}

export const getFromTosForFen = async (fen: FEN): Promise<FromTosResponse> => {
  const response = await fetch(
    "/.netlify/functions/getFromTosForFen?fen=" + fen,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Failed to fetch fromTos for FEN: ${response.status} ${response.statusText}`
    );
    // Return empty arrays instead of throwing, so the app continues to work
    return { next: [], from: [] };
  }

  return await response.json();
};

export const getScoresForFens = async (
  json: ScoresRequest
): Promise<ScoresResponse> => {
  const response = await fetch("/.netlify/functions/scoresForFens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      "Content-type": "application/json",
    },
    body: JSON.stringify(json),
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch scores: ${response.status} ${response.statusText}`
    );
    // Return null scores instead of throwing, so the app continues to work
    return { score: null, nextScores: [], fromScores: [] };
  }

  const data = await response.json();
  return data;
};
