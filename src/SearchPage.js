import { useContext, useRef, useState } from "react";

import { gql, useQuery } from "@apollo/client";
import { Chess } from "chess.js";
import { Chessboard } from "kokopu-react";
import { OpeningTabs } from "./OpeningAdditional.js";
import { SelectedSitesContext } from "./common/Contexts.js";
import { ActionButton } from "./common/buttons.js";
import { FENEX } from "./common/consts.js";
import "./stylesheets/textarea.css";
import { newName } from "./utils/chessTools.js";
import {client} from "./common/policyMap.js"


const GET_OPENING = gql`
    query getOpening($fen: String!) {
        getOpeningForFenFull(fen: $fen) {
            eco  ${client}
            name ${client}
            moves ${client}
            next  ${client} {
                name
                moves
                score
                eco
            }
            from ${client} {
                name
                moves
            }
            aliases ${client}
            score ${client}
        }
    }
`;

const Opening = ({ fen, setFen, handleMovePlayed, data }) => {
    const sites = useContext(SelectedSitesContext);

    if (data) {
        if (data.getOpeningForFenFull === null) {
            return (
                <div className="double-column left">
                    No Entry Found in Opening Book
                </div>
            );
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
                        {eco}&nbsp;{newName(name)}
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
    } else return <div className="double-column">&nbsp;</div>;
};

const FENorPGN = ({ setFen, text, setText, chess }) => {
    const handleInput = (e) => {
        e.preventDefault();
        const input = e.clipboardData.getData("text");
        const stubFen = input.split(" ")[0];

        // FEN?
        if (FENEX.test(stubFen)) {
            try {
                const fen = input;
                chess.current.load(fen);
                setFen(fen);
                setText(fen);
            } catch (ex) {
                alert(ex.toString());
            }
        } else {
            // PGN?
            try {
                chess.current.loadPgn(input);
                setText(input);
                setFen(chess.current.fen());
            } catch (ex) {
                alert(ex.toString());
            }
        }
    };

    return (
        <textarea
            id="fenpgn"
            spellCheck="false"
            placeholder={"Move, or paste in FEN/PGN here"}
            onChange={() => {}}
            onPaste={(e) => handleInput(e)}
            value={text}
        ></textarea>
    );
};

const SearchPage = ({ chess, fen, setFen }) => {
    const [text, setText] = useState("");

    const reset = () => {
        setFen("start");
        chess.current.reset();
        setText("");
    };

    /*
    If we came in through a FEN input, we will get the following format when a move is put to the the chess object:
    "[SetUp \"1\"]\n[FEN \"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5\"]\n\n5. O-O"
    The following code handles this case.
    */
    const handleMovePlayed = (move) => {
        chess.current.move(move);
        const newFen = chess.current.fen();
        setFen(newFen);
        let pgn = chess.current.pgn();
        const movesPosition = pgn.lastIndexOf("]"); // end of SetUp FEN
        if (movesPosition > -1) {
            pgn = pgn.substring(movesPosition + 3, pgn.length); // +3 for the newlines between SetUp FEN and move list
        }
        setText(`FEN:\n${newFen}\n\nmoves: ${pgn}`);
    };

    const back = () => {
        chess.current.undo();
        const newFen = chess.current.fen();
        setFen(newFen);
        setText(`FEN:\n${newFen}\n\nmoves: ${chess.current.pgn()}`);
    };

    const { error, data, loading } = useQuery(GET_OPENING, {
        variables: { fen },
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
                    <FENorPGN {...{ setFen, text, setText, chess }} />
                </div>
            </div>

            <div className="double-column left">
                <div className="row" style={{ marginTop: "0px" }}>
                    {loading && (
                        <span style={{ color: "lightgreen" }}>
                            Searching...
                        </span>
                    )}

                    {error && (
                        <span style={{ color: "red" }}>{error.toString()}</span>
                    )}

                    {data && (
                        <Opening {...{ fen, setFen, handleMovePlayed, data }} />
                    )}
                </div>
            </div>
        </div>
    );
};

const ThePage = () => {
    let qfen = new URLSearchParams(window.location.search).get("fen");

    if (qfen) {
        if (!FENEX.test(qfen.split(" ")[0])) {
            qfen = "start";
        }
    } else {
        qfen = "start";
    }

    const [fen, setFen] = useState(qfen);
    const chess = useRef(new Chess());

    return <SearchPage {...{ chess, fen, setFen }} />;
};

export default ThePage;
