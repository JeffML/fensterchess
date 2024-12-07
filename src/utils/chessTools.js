import { Chess } from "chess.js";
import { movesStringToPliesAry } from "./openings.js";
import DOMPurify from "dompurify";

const movesToFen = (moves) => {
    const chess = new Chess();
    chess.loadPgn(moves);
    return chess.fen();
};

// const newName = (name) => name.replace(/(\s\(i\))+/, "*");

const toPlay = (fen) => {
    const splitFen = fen.split(" ");
    const color = splitFen.at(-5);
    const move = splitFen.at(-1);
    return { move, color };
};

const theoryRequest = async (currentMoves, setHtml) => {
    const urlMoves = () => {
        const plies = movesStringToPliesAry(currentMoves);
        const moves = plies.map((ply, i) => {
            const move = Math.ceil((i + 1) / 2) + ".";
            const black = (i + 1) % 2 === 0;

            return move + (black ? ".." : "_") + ply;
        });

        return moves.join("/");
    };

    const url = `https://en.wikibooks.org/w/api.php?titles=Chess_Opening_Theory/${urlMoves()}&redirects&origin=*&action=query&prop=extracts&formatversion=2&format=json&exchars=1200`;

    const response = await fetch(url);
    const json = await response.json();
    const html = json.query?.pages[0]?.extract;
    if (html) {
        const clean = DOMPurify.sanitize(html);
        setHtml(clean);
    }
};

function parseMoves(moveString) {
    const tokens = moveString.trim().split(/\s+/g);
    const wholeMoves = Math.trunc(tokens.length / 3);
    const partialMoves = tokens.length % 3;
    const nextPly = tokens.at(-1);

    const theMove = wholeMoves +
        (partialMoves ? 1 : 0) +
        (partialMoves ? ". " : "... ") +
        nextPly;
    return { nextPly, theMove };
}

export { movesToFen, toPlay, theoryRequest, parseMoves };
