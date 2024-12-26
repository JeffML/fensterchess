import { gql, useQuery } from "@apollo/client";
import { Chess } from "chess.js";
import { Chessboard } from "kokopu-react";
import { useContext, useRef, useState } from "react";
import { FenOrPgn } from "./FenOrPgn.js";
import { OpeningTabs } from "./OpeningTabs.js";
import { ActionButton } from "./common/Buttons.js";
import { SelectedSitesContext } from "./common/SelectedSitesContext.js";
import { FENEX, NO_ENTRY_FOUND } from "./common/consts.js";
import "./stylesheets/textarea.css";

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

const Opening = ({ fen, setFen, handleMovePlayed, data }) => {
    const sites = useContext(SelectedSitesContext);

    if (data) {
        if (data.getOpeningForFenFull === null) {
            return <div className="double-column left">{NO_ENTRY_FOUND}</div>;
        }
        let {
            getOpeningForFenFull: {
                eco,
                name,
                moves: currentMoves,
                next: nextMoves,
                from,
            },
        } = data;

        return (
            <div className="double-column left">
                <span
                    className="font-cinzel"
                    style={{
                        fontSize: "larger",
                    }}
                >
                    Opening:&nbsp;&nbsp;
                    <span
                        style={{
                            fontWeight: "bolder",
                            display: "inline",
                            color: "aquamarine",
                            fontFamily: "sans",
                        }}
                    >
                        {eco}&nbsp;{name}
                    </span>
                </span>

                <OpeningTabs
                    {...{
                        fen,
                        setFen,
                        nextMoves,
                        currentMoves,
                        handleMovePlayed,
                        sites,
                        eco,
                        name,
                        from,
                    }}
                />
            </div>
        );
    } else
        return (
            <div className="double-column">
                <OpeningTabs
                    {...{
                        fen,
                        setFen,
                        handleMovePlayed,
                        sites,
                    }}
                />
            </div>
        );
};

const SearchPage = ({ chess, fen, setFen, moves }) => {

    if (moves) {
        chess.current.loadPgn(moves)
        setFen(chess.current.fen())
    }

    const reset = () => {
        setFen("start");
        chess.current.reset();
    };

    /*
    If we came in through a FEN input, we will get the following format when a move is put to the the chess object:
    "[SetUp \"1\"]\n[FEN \"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5\"]\n\n5. O-O"
    The code below handles this case.
    */
    const handleMovePlayed = (move) => {
        chess.current.move(move);
        const newFen = chess.current.fen();
        moves = chess.current.pgn();
        setFen(newFen);
        const movesPosition = moves.lastIndexOf("]"); // end of SetUp FEN
        if (movesPosition > -1) {
            moves = moves.substring(movesPosition + 3, moves.length); // +3 for the newlines between SetUp FEN and move list
        }
    };

    const back = () => {
        chess.current.undo();
        const newFen = chess.current.fen();
        moves = chess.current.pgn();
        setFen(newFen);
    };

    const { error, data, loading } = useQuery(GET_OPENING, {
        variables: { fen, loose: true },
        skip: fen === "start",
    });

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
                            <FenOrPgn {...{ fen, setFen, moves, chess }} />{" "}
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
                        <Opening {...{ fen, setFen, handleMovePlayed, data }} />
                    )}
                </div>
            </div>
        </div>
    );
};

let paramsRead = false;

const loadMoves = (moves, chess) => {
    let fen = ""

    try {
        chess.current.loadPgn(moves);
        fen = chess.current.fen();
    } catch (e) {
        console.error(e);
        moves = "";
    } finally {
        return {moves, fen}
    }
}

const ThePage = () => {
    let qfen = "start";
    let moves = "";

    const chess = useRef(new Chess());
    const url = new URLSearchParams(window.location.search);

    if (!paramsRead) {
        moves = url.get("moves");
        url.delete("moves"); // done with param

        if (moves) {
            ({qfen, moves} = loadMoves(moves, chess))   // nifty deconstruction, Batman!
        } else {
            qfen = url.get("fen");
            url.delete("fen");
        }

        if (qfen) {
            if (!FENEX.test(qfen.current.split(" ")[0])) {
                qfen = "start";
            }
        } else {
            qfen = "start";
        }

        paramsRead = true;
    }

    // we only need this state change to render FenOrPgn component; moves go with
    const [fen, setFen] = useState(qfen);

    return <SearchPage {...{ chess, fen, moves, setFen }} />;
};

export default ThePage;
