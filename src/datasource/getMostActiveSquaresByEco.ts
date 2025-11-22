import { getOpeningsForEcoCode } from "./getOpeningsForEcoCode";
import { movesStringToPliesAry } from "../utils/openings";

interface DestinationCounts {
  [square: string]: number;
}

export const getMostActiveSquaresByEco = async (
  eco: string
): Promise<DestinationCounts> => {
  const openings = await getOpeningsForEcoCode(eco);

  const destinationCounts: DestinationCounts = {};

  openings.forEach((opening) => {
    const plies = movesStringToPliesAry(opening.moves);
    plies.forEach((ply) => {
      ply = ply.replace("+", "");
      const dest = ply.slice(-2);
      destinationCounts[dest] ??= 0;
      destinationCounts[dest]++;
    });
  });

  return destinationCounts;
};

interface SquareDetail {
  count: number;
  isWhite: boolean;
  pieces: string[];
}

interface DetailedDestinations {
  [square: string]: SquareDetail;
}

export const getMostActiveSquaresByEcoDetailed = async (
  eco: string
): Promise<DetailedDestinations> => {
  const openings = await getOpeningsForEcoCode(eco);

  const details: DetailedDestinations = {};

  openings.forEach((opening) => {
    const plies = movesStringToPliesAry(opening.moves);
    plies.forEach((ply, i) => {
      ply = ply.replace("+", "");
      const dest = ply.slice(-2);
      let piece = ply[0];
      if ("abcdefgh".includes(piece)) piece = "P";

      const d = (details[dest] ??= {
        count: 0,
        isWhite: i % 2 === 0,
        pieces: [],
      });

      d.count++;
      if (!d.pieces.includes(piece)) d.pieces.push(piece);
    });
  });

  return details;
};
