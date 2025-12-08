import { openingBook } from "@chess-openings/eco.json";
import { Opening } from "../types";

export const getOpeningsForEcoCode = async (
  eco: string
): Promise<Opening[]> => {
  const book = await openingBook();

  const openingsForEco = Object.values(book).filter(
    (opening) => opening.eco === eco
  );
  return openingsForEco;
};
