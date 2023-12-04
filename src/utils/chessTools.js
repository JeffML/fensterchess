import {Chess} from 'chess.js'

const movesToFen = (moves) => {
    const chess = new Chess()
    chess.loadPgn(moves)
    return chess.fen()
}

const newName = (name) => name.replace(/(\s\(i\))+/, "*");

const toPlay = (fen) => {
    const splitFen = fen.split(" ")
    const color = splitFen.at(-5)
    const move = splitFen.at(-1)
    return {move, color}
} 

export {movesToFen, newName, toPlay}