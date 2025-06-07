import { Chess } from 'chess.js';
import { Chessboard } from 'kokopu-react';
import { useRef, useState } from 'react';
import { FenOrPgn } from './FenOrPgn.js';
import { Opening } from './Opening.js';
import { ActionButton } from './common/Buttons.js';
import {pos} from './utils/chessTools.js'
import { FENEX, NO_ENTRY_FOUND } from './common/consts.js';
import {scores} from './datasource/scores.js'

const SearchPage = ({
    chess,
    boardState,
    setBoardState,
    loading,
    error,
    data,
}) => {
    const [lastKnownOpening, setLastKnownOpening] = useState({});

    const reset = () => {
        setBoardState({ fen: 'start', moves: '' });
        chess.current.reset();
    };

    /*
    If we came in through a FEN input, we will get the following format when a move is put to the the chess object:
    "[SetUp \"1\"]\n[FEN \"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5\"]\n\n5. O-O"
    The code below handles this case.
    */
    const handleMovePlayed = (move) => {
        chess.current.move(move);
        const fen = chess.current.fen();
        let moves = chess.current.pgn();
        const movesPosition = moves.lastIndexOf(']'); // end of SetUp FEN
        if (movesPosition > -1) {
            moves = moves.substring(movesPosition + 3, moves.length); // +3 for the newlines between SetUp FEN and move list
        }
        setBoardState({ fen, moves });
    };

    const back = () => {
        chess.current.undo();
        const fen = chess.current.fen();
        const moves = chess.current.pgn();
        setBoardState({ fen, moves });
    };

    const { fen } = boardState;

    return (
        <div className="row" style={{ color: 'white' }}>
            <div className="column" style={{ alignItems: 'center' }}>
                <Chessboard
                    interactionMode="playMoves"
                    position={fen}
                    onMovePlayed={(move) => handleMovePlayed(move)}
                />
                <div className="row centered">
                    <ActionButton
                        {...{ onClick: () => back(), text: '<< Back' }}
                    />
                    <ActionButton
                        {...{ onClick: () => reset(), text: 'Reset' }}
                    />
                </div>

                <div className="row">
                    <div className="column">
                        <div className="row" style={{ marginBottom: '10px' }}>
                            Drag pieces above, or paste a move sequence or FEN
                            below:
                        </div>
                        <div className="row">
                            <FenOrPgn
                                {...{
                                    boardState,
                                    setBoardState,
                                    chess,
                                    setLastKnownOpening,
                                }}
                            />{' '}
                        </div>
                    </div>
                </div>
            </div>

            <div className="double-column left">
                <div className="row" style={{ marginTop: '0px' }}>
                    {loading && (
                        <span style={{ color: 'lightgreen' }}>
                            Searching...
                        </span>
                    )}

                    {error &&
                        (error.message.startsWith('not_found') ? (
                            NO_ENTRY_FOUND
                        ) : (
                            <span style={{ color: 'red' }}>
                                {error.toString()}
                            </span>
                        ))}

                    {data && (
                        <Opening
                            {...{
                                boardState,
                                setBoardState,
                                handleMovePlayed,
                                data,
                                lastKnownOpening,
                                setLastKnownOpening,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

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
        url.delete('moves'); // done with param

        if (qmoves) {
            const { moves, fen } = loadMoves(qmoves, chess);
            return { moves, fen };
        } else {
            let qfen = url.get('fen');
            url.delete('fen');

            if (qfen) {
                if (!FENEX.test(qfen.current.split(' ')[0])) {
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


const SearchPageContainer = ({openingBook, from, to}) => {
    const [boardState, setBoardState] = useState({ fen: 'start', moves: '' });

    const chess = useRef(new Chess());
    const url = new URLSearchParams(window.location.search);

    readParamsMaybe(url, chess, setBoardState);

    const { fen } = boardState;
    let data = null;

    if (fen !== 'start') {
        data = {getOpeningForFenFull: {...openingBook[fen], score:scores[fen]}}
        
        if (data) {
            if (data.getOpeningForFenFull) {
                const nexts = to[pos(fen)]??[]
                data.getOpeningForFenFull.next = nexts.map(fen => {
                    const variation = {...openingBook[fen], score:scores[fen]}
                    return variation
                })

                chess.current.loadPgn(data.getOpeningForFenFull.moves);
            }
            const moves = chess.current.pgn();

            if (fen !== boardState.fen || moves !== boardState.moves)
                setBoardState({ fen, moves });
        }
    }
    return (
        <SearchPage
            {...{ chess, boardState, setBoardState, data }}
        />
    );
};

export {SearchPageContainer};

