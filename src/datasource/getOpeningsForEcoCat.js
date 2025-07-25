import { getLatestEcoJson } from './getLatestEcoJson';

//special case: A00 has no true root
const A00Root = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": {
        "src": "none",
        "eco": "A00",
        "moves": "",
        "name": "Irregular Openings",
        "isEcoRoot": true
    }
}

export const getEcoRootsForCat = async (cat) => {
    const data = await getLatestEcoJson();

    const openings = data[cat].json;

        // Find all eco roots
    let roots = Object.entries(openings)
        .filter(([fen, opening]) => opening.isEcoRoot)
        .reduce((acc, [fen, opening]) => {
            acc[fen] = opening;
            return acc;
        }, {});

    if (cat === 'A')
        roots = { ...A00Root, ...roots };

    return roots;
}

export const getOpeningsForEcoCat = async (cat) => {
    const roots = await getEcoRootsForCat(cat)
    const json = await getLatestEcoJson()
    const openingsForCat = json[cat]

    // For each root, find all openings that start with the root's move sequence
    const rootsWithOpenings = Object.entries(roots).map(([rootFen, rootOpening]) => {
        // Find all openings under this root
        const children = Object.entries(openingsForCat.json)
            .filter(([fen, opening]) =>
                opening.eco === rootOpening.eco && !opening.isEcoRoot
            )
            .map(([fen, opening]) => ({
                fen,
                name: opening.name,
                moves: opening.moves,
            }));

        return {
            rootFen,
            root: rootOpening,
            children,
        };
    });

    return rootsWithOpenings;
};
