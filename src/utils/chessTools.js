import { Chess } from 'chess.js';
import DOMPurify from 'dompurify';
import { WIKI_THEORY_API, WIKI_THEORY_API_QS } from '../common/urlConsts.js';
import { movesStringToPliesAry } from './openings.js';

const movesToFen = (moves) => {
    const chess = new Chess();
    chess.loadPgn(moves);
    return chess.fen();
};

export const getFullOpeningNameFromKokopuGame = (g) => {
    let opening = g.opening();
    const variation = g.openingVariation();
    const subVariation = g.openingSubVariation();

    if (variation) {
        opening+=': ' + variation
        if (subVariation) opening += ` (${subVariation})`
    }

    return opening;
};

const toPlay = (fen) => {
    const splitFen = fen.split(' ');
    const color = splitFen.at(-5);
    const move = splitFen.at(-1);
    return { move, color };
};

const theoryRequest = async (currentMoves, setHtml) => {
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

function parseMoves(moveString) {
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
const pos = (fen) => fen.split(' ')[0];

function pgnMovesOnly(pgn) {
    const i = pgn.lastIndexOf(']');
    return pgn.slice(i + 2);
}

export { movesToFen, parseMoves, pgnMovesOnly, pos, theoryRequest, toPlay };
