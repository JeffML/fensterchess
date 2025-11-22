import { ChessPGN } from '@chess-pgn/chess-pgn';
import type { FEN, Opening, OpeningBook, PGN } from '../types';

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
  }, '');
};

export const movesStringToPliesAry = (moves: string): string[] => {
  const plies = moves.split(/\s+/).map((move) => {
    const matches = move.match(/(?:\d{1,3}\.)?(.*)/);
    return matches ? matches[1] : '';
  });
  return plies.filter((p) => p !== '');
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
