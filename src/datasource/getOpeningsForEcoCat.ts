import { getEcoRoots, openingBook } from "@chess-openings/eco.json";
import { Opening, FEN } from "../types";

interface EcoRoot {
  [fen: FEN]: Opening & { isEcoRoot: true };
}

// Special case: A00 has no true root
const A00Root: EcoRoot = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
    src: "none",
    eco: "A00",
    moves: "",
    name: "Irregular Openings",
    isEcoRoot: true,
  },
};

export const getEcoRootsForCat = async (cat: string): Promise<EcoRoot> => {
  const allRoots = await getEcoRoots();

  // Filter roots for this category
  let roots = Object.entries(allRoots)
    .filter(([, opening]) => opening.eco?.startsWith(cat))
    .reduce((acc, [fen, opening]) => {
      acc[fen as FEN] = opening as Opening & { isEcoRoot: true };
      return acc;
    }, {} as EcoRoot);

  if (cat === "A") {
    roots = { ...A00Root, ...roots };
  }

  return roots;
};

interface OpeningChild {
  fen: FEN;
  name: string;
  moves: string;
}

interface RootWithOpenings {
  rootFen: FEN;
  root: Opening & { isEcoRoot: true };
  children: OpeningChild[];
}

export const getOpeningsForEcoCat = async (
  cat: string
): Promise<RootWithOpenings[]> => {
  const roots = await getEcoRootsForCat(cat);
  const book = await openingBook();

  // For each root, find all openings that start with the root's move sequence
  const rootsWithOpenings = Object.entries(roots).map(
    ([rootFen, rootOpening]) => {
      // Find all openings under this root
      const children = Object.entries(book)
        .filter(
          ([, opening]) =>
            opening.eco === rootOpening.eco && !(opening as any).isEcoRoot
        )
        .map(([fen, opening]) => ({
          fen: fen as FEN,
          name: opening.name,
          moves: opening.moves,
        }));

      return {
        rootFen: rootFen as FEN,
        root: rootOpening,
        children,
      };
    }
  );

  return rootsWithOpenings;
};
