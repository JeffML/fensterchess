import { gql, useQuery } from "@apollo/client";
import { Chess } from "chess.js";
import { Chessboard } from "kokopu-react";
import { useRef, useState } from "react";
import { FenOrPgn } from "./FenOrPgn.js";
import { Opening } from "./Opening.js";
import { ActionButton } from "./common/Buttons.js";

import { FENEX, NO_ENTRY_FOUND } from "./common/consts.js";


const GET_OPENING = gql`
    query getOpening($fen: String!, $loose: Boolean) {
        getOpeningForFenFull(fen: $fen, loose: $loose) {
            eco
            name
            moves
            next {
                name
                moves
                score
                eco
            }
            from {
                name
                moves
            }
            aliases
            score
            src
        }
    }
`;


const SearchPage = ({ chess, boardState, setBoardState, loading, error, data }) => {
    const reset = () => {
        setBoardState({ fen: "start", moves: "" });
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
        const movesPosition = moves.lastIndexOf("]"); // end of SetUp FEN
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

    const {fen, moves} = boardState;

    return (
        <div className="row" style={{ color: "white" }}>
            <div className="column" style={{ alignItems: "center" }}>
                <Chessboard
                    interactionMode="playMoves"
                    position={fen}
                    onMovePlayed={(move) => handleMovePlayed(move)}
                />
                <div className="row centered">
                    <ActionButton
                        {...{ onClick: () => back(), text: "<< Back" }}
                    />
                    <ActionButton
                        {...{ onClick: () => reset(), text: "Reset" }}
                    />
                </div>

                <div className="row">
                    <div className="column">
                        <div className="row" style={{ marginBottom: "10px" }}>
                            Drag pieces above, or paste a move sequence or FEN
                            below:
                        </div>
                        <div className="row">
                            <FenOrPgn
                                {...{ boardState, setBoardState, chess }}
                            />{" "}
                        </div>
                    </div>
                </div>
            </div>

            <div className="double-column left">
                <div className="row" style={{ marginTop: "0px" }}>
                    {loading && (
                        <span style={{ color: "lightgreen" }}>
                            Searching...
                        </span>
                    )}

                    {error &&
                        (error.message.startsWith("not_found") ? (
                            NO_ENTRY_FOUND
                        ) : (
                            <span style={{ color: "red" }}>
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
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const loadMoves = (moves, chess) => {
    let fen = "";

    try {
        chess.current.loadPgn(moves);
        fen = chess.current.fen();
    } catch (e) {
        console.error(e);
        moves = "";
    } finally {
        return { moves, fen };
    }
};

let paramsRead = false;

const ThePage = () => {
    const [boardState, setBoardState] = useState({ fen: "start", moves: "" });

    const chess = useRef(new Chess());
    const url = new URLSearchParams(window.location.search);

    const readParams = () => {
        const qmoves = url.get("moves");
        url.delete("moves"); // done with param

        if (qmoves) {
            const { moves, fen } = loadMoves(qmoves, chess);
            return { moves, fen };
        } else {
            let qfen = url.get("fen");
            url.delete("fen");

            if (qfen) {
                if (!FENEX.test(qfen.current.split(" ")[0])) {
                    qfen = "start";
                }
            } else {
                qfen = "start";
            }

            return { moves: "", fen: qfen??"start" };
        }
    };

    if (!paramsRead) {
        const { fen, moves } = readParams();
        paramsRead = true;
        setBoardState({ fen, moves });
    }


    const { error, data, loading } = useQuery(GET_OPENING, {
        variables: { fen: boardState.fen, loose: true },
        skip: boardState.fen === "start",
    });


    const { fen } = boardState;

    if (data) {
        chess.current.loadPgn(data.getOpeningForFenFull.moves)
        const moves = chess.current.pgn()
        if (fen !== boardState.fen || moves != boardState.moves) setBoardState({fen, moves})
    }

    return <SearchPage {...{ chess, boardState, setBoardState, loading, error, data }} />;
};

export default ThePage;
