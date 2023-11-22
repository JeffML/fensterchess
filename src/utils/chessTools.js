import {Chess} from 'chess.js'

const movesToFen = (moves) => {
    const chess = new Chess()
    chess.loadPgn(moves)
    return chess.fen()
}

const newName = (name) => name.replace(/(\s\(i\))+/, "*");

export {movesToFen, newName}