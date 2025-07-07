import { getLatestEcoJson } from './getLatestEcoJson';

//special case: A00 has no true root
const A00Root = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
        "src": "none",
        "eco": "A00",
        "moves": "",
        "name": "Irregular Openings",
    }
}

export const getOpeningsForEcoCat = async (cat) => {
    const data = await getLatestEcoJson();

    const openings = data[cat].json;
    
    let roots = Object.entries(openings)
        .reduce((acc, [fen, opening]) => {
            if (opening.isEcoRoot) acc[fen] = opening
            return acc
        }, {})
    
    roots = {...A00Root, ...roots}
    return { openings, roots };
};
