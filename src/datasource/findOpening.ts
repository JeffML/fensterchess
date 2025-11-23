import type {
  FEN,
  Opening,
  OpeningBook,
  PositionBook,
  ChessRef,
  FromTosResponse,
  ScoresResponse,
  ScoresRequest,
} from "../types";

export function findOpening(
  openingBook: OpeningBook,
  fen: FEN | "start",
  positionBook: PositionBook,
  fromTosForFen: FromTosResponse | null,
  scoresForFens: ScoresResponse | null,
  chess: ChessRef
): Opening | undefined {
  let opening = openingBook[fen as FEN];
  if (!opening && fen !== "start") {
    const posEntry = positionBook[fen.split(" ")[0]];
    if (posEntry) opening = openingBook[posEntry[0]];
  }

  if (fromTosForFen && scoresForFens && opening) {
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

    chess.current.loadPgn(opening.moves);
  }
  return opening;
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
