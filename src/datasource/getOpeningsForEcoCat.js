import { getLatestEcoJson } from './getLatestEcoJson';

export const getOpeningsForEcoCat = async (cat) => {
    const data = await getLatestEcoJson();

    const openings = data[cat].json;

    const roots = Object.entries(openings)
        .reduce((acc, [fen, opening]) => {
            if (opening.isEcoRoot) acc[fen] = opening
            return acc
        }, {})

    return { openings, roots };
};
