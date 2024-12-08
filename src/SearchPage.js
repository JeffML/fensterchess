import { gql, useQuery } from "@apollo/client";
import { Chess } from "chess.js";
import { Chessboard } from "kokopu-react";
import { useContext, useRef, useState } from "react";
import { OpeningTabs } from "./OpeningTabs.js";
import { SelectedSitesContext } from "./common/Contexts.js";
import { ActionButton } from "./common/Buttons.js";
import { FENEX, NO_ENTRY_FOUND } from "./common/consts.js";
import "./stylesheets/textarea.css";

const GET_OPENING = gql`
    query getOpening($fen: String!) {
        getOpeningForFenFull(fen: $fen) {
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

const FENorPGN = ({ setFen, text, setText, chess }) => {
    const handleInput = (e) => {
        e.preventDefault();
        let input = e.clipboardData.getData("text");
        const stubFen = input.split(" ")[0].replace('"', '');

        // FEN?
        if (FENEX.test(stubFen)) {
            try {
                let fen = input.replaceAll(/[\"\n]/g, '');
                chess.current.load(fen);  
                fen = chess.current.fen()   //scrubs e.p. falsities
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
            placeholder={"Paste moves or FEN here"}
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
    The code below handles this case.
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
                    <div className="column">
                    <div className="row" style={{marginBottom: "10px"}}>Drag pieces above, or paste a move sequence or FEN below:</div>
                    <div className="row"><FENorPGN {...{ setFen, text, setText, chess }} /> </div>
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

const ThePage = () => {
    const qfen = useRef("start");
    const chess = useRef(new Chess());

    if (!paramsRead) {
        const url = new URLSearchParams(window.location.search);
        let qmoves = url.get("moves");
        url.delete("moves"); // done with param

        if (qmoves) {
            try {
                chess.current.loadPgn(qmoves);
                qfen.current = chess.current.fen();
            } catch (e) {
                console.log(e);
                qmoves = "";
            }
        } else {
            qfen.current = new URLSearchParams(window.location.search).get(
                "fen"
            );
        }

        if (qfen.current) {
            if (!FENEX.test(qfen.current.split(" ")[0])) {
                qfen.current = "start";
            }
        } else {
            qfen.current = "start";
        }

        paramsRead = true;
    }

    const [fen, setFen] = useState(qfen.current);

    return <SearchPage {...{ chess, fen, setFen }} />;
};

export default ThePage;
