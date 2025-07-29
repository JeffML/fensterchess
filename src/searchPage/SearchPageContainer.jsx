import { Chess } from 'chess.js';
import { useContext, useRef, useState } from 'react';
import { FENEX } from '../common/consts.js';
import { OpeningBookContext } from '../contexts/OpeningBookContext.jsx';
import { scores } from '../datasource/scores.js';
import { pos } from '../utils/chessTools.js';
import SearchPage from './SearchPage.jsx';

const loadMoves = (moves, chess) => {
    let fen = '';

    try {
        chess.current.loadPgn(moves);
        fen = chess.current.fen();
    } catch (e) {
        console.error(e);
        moves = '';
    } finally {
        return { moves, fen };
    }
};

let paramsRead = false;

function readParamsMaybe(url, chess, setBoardState) {
    const readParams = () => {
        const qmoves = url.get('moves');
        url.delete('moves');

        if (qmoves) {
            const { moves, fen } = loadMoves(qmoves, chess);
            return { moves, fen };
        } else {
            let qfen = url.get('fen');
            url.delete('fen');

            if (qfen) {
                if (!FENEX.test(qfen.split(' ')[0])) {
                    qfen = 'start';
                }
            } else {
                qfen = 'start';
            }

            return { moves: '', fen: qfen ?? 'start' };
        }
    };

    if (!paramsRead) {
        const { fen, moves } = readParams();
        paramsRead = true;
        setBoardState({ fen, moves });
    }
}

const SearchPageContainer = ({ from, to }) => {
    const [boardState, setBoardState] = useState({ fen: 'start', moves: '' });

    const chess = useRef(new Chess());
    const url = new URLSearchParams(window.location.search);

    readParamsMaybe(url, chess, setBoardState);

    const { fen } = boardState;
    let data = null;
    const { openingBook } = useContext(OpeningBookContext);

    if (!openingBook) return <div>Loading...</div>;
    
    if (fen !== 'start') {
        data = {
            getOpeningForFenFull: openingBook[fen]
                ? { ...openingBook[fen], score: scores[fen] }
                : null,
        };

        if (data.getOpeningForFenFull) {
            const nexts = to[pos(fen)] ?? [];
            const froms = from[pos(fen)] ?? [];
            data.getOpeningForFenFull.next = nexts.map((fen) => {
                const variation = { ...openingBook[fen], score: scores[fen] };
                return variation;
            });
            data.getOpeningForFenFull.from = froms.map((fen) => {
                const variation = { ...openingBook[fen], score: scores[fen] };
                return variation;
            });

            chess.current.loadPgn(data.getOpeningForFenFull.moves);
        }
        const moves = chess.current.pgn();

        if (fen !== boardState.fen || moves !== boardState.moves)
            setBoardState({ fen, moves });
    }
    
    return <SearchPage {...{ chess, boardState, setBoardState, data }} />;
};

export default SearchPageContainer;