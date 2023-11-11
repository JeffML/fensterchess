import { useState, useRef, useContext } from "react";
import { OpeningAdditionalWithBarChart } from "./OpeningAdditional.js";
import { ActionButton } from "./common/buttons.js";
import { Chessboard } from "kokopu-react";
import { Chess } from "chess.js";
import { useQuery, gql } from "@apollo/client";
import NextMovesRow, { Transitions } from "./NextMovesRow.js";
import { SelectedSitesContext } from "./common/Contexts.js";
import { FENEX } from "./common/consts.js";

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
            }
            from {
                name
                moves
            }
            aliases
            score
        }
    }
`;

const Opening = ({ fen, handleMovePlayed, data }) => {
    const inlineStyle = { marginBottom: "1em" };

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
            getOpeningForFenFull: { eco, name, moves: currentMoves, next: nextMoves },
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
                        className="fakeLink"
                        style={{ fontWeight: "bolder", display: "inline" }}
                        onClick={() => {}}
                    >
                        {eco}&nbsp;{name}
                    </span>
                </span>

                <div className="row" style={inlineStyle}>
                    {sites.selectedSites.length > 0 && (
                        <OpeningAdditionalWithBarChart id="OpeningAdditionalWithBarChart"
                            {...{ fen, name, sites: sites.selectedSites }}
                        />
                    )}
                </div>
                <NextMovesRow {...{ nextMoves, currentMoves, handleMovePlayed }} />
            </div>
        );
    } else return <div className="double-column">&nbsp;</div>;
};

const FENorPGN = ({ setFen, text, setText, chess }) => {
    const handleInput = (e) => {
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
                e.preventDefault();
                alert(ex.toString());
            }
        } else {
            // PGN?
            try {
                chess.current.loadPgn(input);
                setText(input);
                setFen(chess.current.fen());
            } catch (ex) {
                e.preventDefault();
                alert(ex.toString());
            }
        }
    };

    return (
        <textarea
            id="fenpgn"
            spellCheck="false"
            placeholder={"or paste in FEN/PGN here"}
            style={{ width: "100%", height: "200%" }}
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

    const handleMovePlayed = (move) => {
        chess.current.move(move);
        const newFen = chess.current.fen()
        setFen(newFen);
        setText(`FEN:\n${newFen}\n\nmoves: ${chess.current.pgn()}`)
    };

    const back = () => {
        chess.current.undo();
        const newFen = chess.current.fen()
        setFen(newFen);
        setText(`FEN:\n${newFen}\n\nmoves: ${chess.current.pgn()}`)
    };

    const { error, data, loading } = useQuery(GET_OPENING, {
        variables: { fen },
        skip: fen === "start",
    });

    return (
        <>
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
                            <span style={{ color: "red" }}>
                                {error.toString()}
                            </span>
                        )}

                        {data && (
                            <Opening {...{ fen, handleMovePlayed, data }} />
                        )}
                    </div>
                    <div className="row">
                        {data &&
                            data.getOpeningForFenFull?.from?.length > 1 && (
                                <div className="row">
                                    <Transitions
                                        {...{ data }}
                                        style={{ marginLeft: "1em" }}
                                    />
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
};

const ThePage = () => {
    const [fen, setFen] = useState("start"); //TODO: use position history context (TBD)
    const chess = useRef(new Chess());

    return <SearchPage {...{ chess, fen, setFen }} />;
};

export default ThePage;
