import {Chess} from 'chess.js'

const movesToFen = (moves) => {
    const chess = new Chess()
    chess.loadPgn(moves)
    return chess.fen()
}

export {movesToFen}