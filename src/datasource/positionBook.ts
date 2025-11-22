import { OpeningBook, PositionBook, FEN } from "../types";

export const getPositionBook = (openingBook: OpeningBook): PositionBook => {
  const positionToFen: PositionBook = {};

  for (const fen in openingBook) {
    const position = fen.split(" ")[0];

    positionToFen[position] ??= [];
    positionToFen[position].push(fen as FEN);
  }

  return positionToFen;
};
