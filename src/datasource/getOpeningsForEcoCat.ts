import { getLatestEcoJson } from "./getLatestEcoJson";
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
  const data = await getLatestEcoJson();

  const openings = data[cat as keyof Omit<typeof data, "initialized">]?.json;
  if (!openings) {
    throw new Error(`Invalid ECO category: ${cat}`);
  }

  // Find all eco roots
  let roots = Object.entries(openings)
    .filter(([, opening]) => (opening as any).isEcoRoot)
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
  const json = await getLatestEcoJson();
  const openingsForCat = json[cat as keyof Omit<typeof json, "initialized">];

  if (!openingsForCat) {
    throw new Error(`Invalid ECO category: ${cat}`);
  }

  // For each root, find all openings that start with the root's move sequence
  const rootsWithOpenings = Object.entries(roots).map(
    ([rootFen, rootOpening]) => {
      // Find all openings under this root
      const children = Object.entries(openingsForCat.json || {})
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
