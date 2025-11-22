import { getLatestEcoJson } from "./getLatestEcoJson";
import { Opening } from "../types";

export const getOpeningsForEcoCode = async (
  eco: string
): Promise<Opening[]> => {
  const json = await getLatestEcoJson();
  const openingsForCat = json[eco[0] as keyof Omit<typeof json, "initialized">];

  if (!openingsForCat) {
    throw new Error(`Invalid ECO category: ${eco[0]}`);
  }

  const openingsForEco = Object.values(openingsForCat.json || {}).filter(
    (ofc) => ofc.eco === eco
  );
  return openingsForEco;
};
