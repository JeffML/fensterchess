import { getOpeningsForEcoCode } from "./getOpeningsForEcoCode";
import { movesStringToPliesAry } from "../utils/openings";

export const getMostActiveSquaresByEco = async(eco) => {
    const openings = await getOpeningsForEcoCode(eco)

    const destinationCounts = {}

    openings.forEach(opening => {
        const plies = movesStringToPliesAry(opening.moves)
        plies.forEach( ply => {
            const dest = ply.slice(-2)
            destinationCounts[dest]??=0;
            destinationCounts[dest]++
        })
    })
    
    return destinationCounts
}