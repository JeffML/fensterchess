import { getOpeningsByEco } from "@chess-openings/eco.json";
import { Opening } from "../types";

export const getOpeningsForEcoCode = async (
  eco: string
): Promise<Opening[]> => {
  return (await getOpeningsByEco(eco)) as Opening[];
};
