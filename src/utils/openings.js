import { ChessPGN } from "@chess-pgn/chess-pgn";

export const getFensForMoves = (plies) => {
  const chess = new ChessPGN();
  const [fens, varMoves] = plies.reduce(
    ([a, b], move) => {
      chess.move(move);
      a.push(chess.fen());
      b.push(chess.pgn()); // this will return a string of moves, e.g. '1. d4 Nf6 2. c4 e6 3. Nc3'
      return [a, b];
    },
    [[], []]
  );

  return [fens, varMoves];
};

export const pliesAryToMovesString = (plies) => {
  return plies.reduce((prev, curr, i) => {
    if (i % 2 === 0) prev += `${i / 2 + 1}. `;
    prev += `${curr} `;
    return prev;
  }, "");
};

export const movesStringToPliesAry = (moves) => {
  const plies = moves.split(/\s+/).map((move) => {
    const matches = move.match(/(?:\d{1,3}\.)?(.*)/);
    return matches[1];
  });
  return plies.filter((p) => p !== "");
};

export const findOpeningForKokopuGame = (game, openingBook) => {
  const fens = game
    .nodes()
    .slice(0, 50)
    .map((n) => n.fen());

  let opening;

  for (let fen of fens.reverse()) {
    const obEntry = openingBook[fen];
    if (obEntry) {
      const { eco, name, moves } = obEntry;

      opening = { eco, name, moves, fen };
      break;
    }
  }

  return opening;
};
