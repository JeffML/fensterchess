import { ChessPGN } from "@chess-pgn/chess-pgn";
import type { FEN, PGN, Square } from "../types";

export const movesToFen = (moves: PGN): FEN => {
  const chess = new ChessPGN();
  chess.loadPgn(moves);
  return chess.fen();
};

interface GameAdapter {
  opening: () => string | undefined;
  openingVariation: () => string | undefined;
  openingSubVariation: () => string | undefined;
}

export const getFullOpeningNameFromKokopuGame = (g: GameAdapter): string => {
  let opening = g.opening();
  const variation = g.openingVariation();
  const subVariation = g.openingSubVariation();

  if (variation) {
    opening += ": " + variation;
    if (subVariation) opening += ` (${subVariation})`;
  }

  return opening || "";
};

interface ToPlayResult {
  move: string;
  color: string;
}

export const toPlay = (fen: FEN): ToPlayResult => {
  const splitFen = fen.split(" ");
  const color = splitFen[splitFen.length - 5] || "w";
  const move = splitFen[splitFen.length - 1] || "1";
  return { move, color };
};

interface ParseMovesResult {
  nextPly: string;
  theMove: string;
}

export function parseMoves(moveString: string): ParseMovesResult {
  const tokens = moveString.trim().split(/\s+/g);
  const wholeMoves = Math.trunc(tokens.length / 3);
  const partialMoves = tokens.length % 3;
  const nextPly = tokens[tokens.length - 1] || "";

  const theMove =
    wholeMoves +
    (partialMoves ? 1 : 0) +
    (partialMoves ? ". " : "... ") +
    nextPly;
  return { nextPly, theMove };
}

/** Return position part of FEN string (without turn, castling, etc.) */
export const pos = (fen: FEN): string => fen.split(" ")[0];

export function pgnMovesOnly(pgn: PGN): string {
  const i = pgn.lastIndexOf("]");
  if (i === -1) return pgn; // No headers, return as-is
  // Skip past the closing bracket and any whitespace/newlines
  return pgn.slice(i + 1).trim();
}

/**
 * Extract destination squares from a move string
 * @example destinationSquaresFromMoves("1. e4 e5 2. d4 exd4") => ["e4", "e5", "d4", "d4"]
 */
export const destinationSquaresFromMoves = (moveString: string): Square[] => {
  // Strip move numbers and split
  const sanMoves = moveString
    .replace(/\d+\./g, "") // remove "1.", "2.", etc.
    .trim()
    .split(/\s+/); // split into individual SAN moves

  const dests: Square[] = [];
  sanMoves.forEach((move, i) => {
    const isBlack = i % 2;
    let dest = move.slice(-2);
    if (dest === "-O") {
      if (move.slice(-5) === "O-O-O") {
        if (isBlack) dests.push("c8", "d8");
        else dests.push("c1", "d1");
      } else {
        if (isBlack) dests.push("f8", "g8");
        else dests.push("f1", "g1");
      }
    } else if (/[a-h][1-8]/.test(dest)) {
      dests.push(dest as Square);
    }
  });

  return dests;
};
