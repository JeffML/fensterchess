import { getLatestEcoJson } from "./getLatestEcoJson";

export const getOpeningsForEcoCode = async (eco) => {
    const json = await getLatestEcoJson()
    const openingsForCat = json[eco[0]]
    const openingsForEco = Object.values(openingsForCat.json).filter(ofc => ofc.eco === eco)    
    return openingsForEco;
}