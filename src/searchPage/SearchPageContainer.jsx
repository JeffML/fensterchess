import { Chess } from 'chess.js';
import { useContext, useRef, useState } from 'react';
import { FENEX } from '../common/consts.js';
import { OpeningBookContext } from '../contexts/OpeningBookContext.jsx';
import SearchPage from './SearchPage.jsx';
import { useQuery } from '@tanstack/react-query';

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

const getFromTosForFen = async (fen) => {
    const fromTos = await fetch(
        '/.netlify/functions/getFromTosForFen?fen=' + fen
    );
    return await fromTos.json();
};

const getScoresForFens = async (json) => {
    const response = await fetch('/.netlify/functions/scoresForFens', {
        method: 'POST',
        headers: {"Content-type": 'application/json'},
        body: JSON.stringify(json),
    });

    const data = await response.json();
    return data;
};

const SearchPageContainer = () => {
    const [boardState, setBoardState] = useState({ fen: 'start', moves: '' });

    const chess = useRef(new Chess());
    const url = new URLSearchParams(window.location.search);

    readParamsMaybe(url, chess, setBoardState);

    const { fen } = boardState;
    const { openingBook } = useContext(OpeningBookContext);

    const { isPending, isError, error, data } = useQuery({
        queryKey: ['fromTosForFen', fen],
        queryFn: async () => getFromTosForFen(fen),
        enabled: fen != null && fen !== 'start',
    });

    const {isPending: isPending2, isError:isError2, error:error2, data: data2} = useQuery({
        queryKey: ['scoresForFens', fen],
        queryFn: async () => getScoresForFens({fen, ...data}),
        enabled: data != null
    })

    if (!openingBook) return <div>Loading...</div>;

    const opening = openingBook[fen];

    if (data && data2 && opening) {
        const {score, nextScores, fromScores} = data2
        opening.score = score;
        
        opening.next = data.next.map((fen, i) => {
            const variation = {
                ...openingBook[fen],
                score: nextScores[i],
            };
            return variation;
        });
        opening.from = data.from.map((fen, i) => {
            const variation = {
                ...openingBook[fen],
                score: fromScores[i],
            };
            return variation;
        });

        chess.current.loadPgn(opening.moves);
    }
    const moves = chess.current.pgn();

    if (fen !== boardState.fen || moves !== boardState.moves)
        setBoardState({ fen, moves });

    return <SearchPage {...{ chess, boardState, setBoardState, data:opening }} />;
};

export default SearchPageContainer;
