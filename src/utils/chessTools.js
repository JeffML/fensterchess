import { Chess } from 'chess.js';
import DOMPurify from 'dompurify';
import { WIKI_THEORY_API, WIKI_THEORY_API_QS } from '../common/urlConsts.js';
import { movesStringToPliesAry } from './openings.js';

export const movesToFen = (moves) => {
    const chess = new Chess();
    chess.loadPgn(moves);
    return chess.fen();
};

export const getFullOpeningNameFromKokopuGame = (g) => {
    let opening = g.opening();
    const variation = g.openingVariation();
    const subVariation = g.openingSubVariation();

    if (variation) {
        opening += ': ' + variation;
        if (subVariation) opening += ` (${subVariation})`;
    }

    return opening;
};

export const toPlay = (fen) => {
    const splitFen = fen.split(' ');
    const color = splitFen.at(-5);
    const move = splitFen.at(-1);
    return { move, color };
};

export const theoryRequest = async (currentMoves, setHtml) => {
    const urlMoves = () => {
        const plies = movesStringToPliesAry(currentMoves);
        const moves = plies.map((ply, i) => {
            const move = Math.ceil((i + 1) / 2) + '.';
            const black = (i + 1) % 2 === 0;

            return move + (black ? '..' : '_') + ply;
        });

        return moves.join('/');
    };

    const url = `${WIKI_THEORY_API}${urlMoves()}${WIKI_THEORY_API_QS}`;

    const response = await fetch(url);
    const json = await response.json();
    const html = json.query?.pages[0]?.extract;
    if (html) {
        const clean = DOMPurify.sanitize(html);
        setHtml(clean);
    }
};

export function parseMoves(moveString) {
    const tokens = moveString.trim().split(/\s+/g);
    const wholeMoves = Math.trunc(tokens.length / 3);
    const partialMoves = tokens.length % 3;
    const nextPly = tokens.at(-1);

    const theMove =
        wholeMoves +
        (partialMoves ? 1 : 0) +
        (partialMoves ? '. ' : '... ') +
        nextPly;
    return { nextPly, theMove };
}

//return position part of FEN string
export const pos = (fen) => fen.split(' ')[0];

export function pgnMovesOnly(pgn) {
    const i = pgn.lastIndexOf(']');
    return pgn.slice(i + 2);
}

// moveString example: "1. e4 e5 2. d4 exd4"
export const destinationSquaresFromMoves = (moveString) => {
    // Step 1: Strip move numbers and split
    const sanMoves = moveString
        .replace(/\d+\./g, '') // remove "1.", "2.", etc.
        .trim()
        .split(/\s+/); // split into individual SAN moves

    const dests = [];
    sanMoves.forEach((move, i) => {
        const isBlack = i % 2;
        let dest = move.slice(-2);
        if (dest === '-O') {
            if (move.slice(-5) === 'O-O-O') {
                if (isBlack) dests.push(...['c8', 'd8']);
                else dests.push(...['c1', 'd1']);
            } else {
                if (isBlack) dests.push(...['f8', 'g8']);
                else dests.push(...['f1', 'g1']);
            }
        } else if (/[a-h]\d/.test(dest)) dests.push(dest);
    });

    return dests;
};
