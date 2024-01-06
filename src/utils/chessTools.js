import {Chess} from 'chess.js'
import { movesStringToPliesAry } from './openings.js'

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

const theoryRequest = async(currentMoves, setHtml) => {
    const urlMoves = () => {
        const plies = movesStringToPliesAry(currentMoves)
        const moves = plies.map((ply, i) => {
            const move = Math.ceil((i+1)/2) + "."
            const black = (i+1)%2 === 0

            return move + (black? ".." : "_") + ply
        })

        return moves.join('/')
    }

    const url = `https://en.wikibooks.org/w/api.php?titles=Chess_Opening_Theory/${urlMoves()}&redirects&origin=*&action=query&prop=extracts&formatversion=2&format=json&exchars=1200`

    const response = await fetch(url)
    const json = await response.json()
    setHtml(json.query?.pages[0]?.extract)
}

export {movesToFen, newName, toPlay, theoryRequest}