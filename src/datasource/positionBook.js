export const getPositionBook = (openingBook) => {
    const positionToFen = {};

    for (const fen in openingBook) {
        const position = fen.split(' ')[0];

        positionToFen[position] ??= [];
        positionToFen[position].push(fen);
    }

    return positionToFen;
};
