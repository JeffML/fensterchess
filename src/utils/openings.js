import { Chess } from 'chess.js'

const getFensForMoves = (plies) => {
    const chess = new Chess()
    const [fens, varMoves] = plies.reduce(([a, b], move) => {
        chess.move(move)
        a.push(chess.fen())
        b.push(chess.pgn()) // this will return a string of moves, e.g. '1. d4 Nf6 2. c4 e6 3. Nc3'
        return [a, b]
    }, [[], []])

    return [fens, varMoves]
}

const pliesAryToMovesString = (plies) => {
    return plies.reduce((prev, curr, i) => {
        if (i%2 === 0) prev += `${(i/2)+1}. ${curr} `
        else prev += `${curr} `
        return prev
    }, "")
}

const movesStringToPliesAry = (moves) => {
    const plies = moves.split(/\s+/).map((move) => {
        const matches = move.match(/(?:\d{1,3}\.)?(.*)/);
        return matches[1];
      });
    return plies.filter(p => p !== "");
}

// see FIND_OPENINGS query
// note that game move order may not match Opening Book move order
// const extractOpeningData = ({getOpeningsForFens2}, game) => {
//     const gameMoves = pliesAryToMovesString(game.mainVariation)

//     // opening book search results for game fens:
//     const obOpenings = getOpeningsForFens2.map(({eco: ECO, name, moves: bookMoves}) => 
//         ({ECO, name, bookMoves}))
//     const gameOpening = {
//         ECO: game.eco,
//         moves: gameMoves.slice(0, obOpenings.at(-1).bookMoves.length),    // truncate game opening moves to same length as OB opening moves 
//         name: game.opening + (game.openingVariation? ", " + game.openingVariation : "")
//     }
//     return {
//         obOpenings, gameOpening,
//         getObOpening: () => obOpenings.at(-1),
//         game
//     }
// }

export { getFensForMoves, /*extractOpeningData,*/ movesStringToPliesAry, pliesAryToMovesString }