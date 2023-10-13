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
            getOpeningForFenFull: { eco, name, moves, next },
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
                        <OpeningAdditionalWithBarChart
                            {...{ fen, name, sites: sites.selectedSites }}
                        />
                    )}
                </div>
                <NextMovesRow {...{ next, moves, handleMovePlayed }} />
            </div>
        );
    } else return <div className="double-column">&nbsp;</div>;
};

const FENorPGN = ({ setFen, placeholder, chess }) => {
    const handleInput = (e) => {
        const input = e.clipboardData.getData("text");
        
        // FEN?
        if (FENEX.test(input.split(" ")[0])) {
            setFen(input);
        } 

        // PGN?
        try {
            console.log("loading", input)
            chess.current.loadPgn(input)
            setFen(chess.current.fen())
        } catch (ex) {
            e.preventDefault()
            alert(ex.toString())
        }
    };

    return (
        <textarea
            spellCheck="false"
            placeholder={placeholder}
            style={{ width: "100%", height: "200%" }}
            onPaste={(e) => handleInput(e)}
        ></textarea>
    );
};

const SearchPage = ({ chess, fen, setFen }) => {
    const [placeholder, setPlaceholder] = useState("or paste in FEN/PGN here");

    const reset = () => {
        setFen("start");
        chess.current.reset();
    };

    const handleMovePlayed = (move) => {
        chess.current.move(move);
        setFen(chess.current.fen());
    };

    const back = () => {
        chess.current.undo();
        setFen(chess.current.fen());
    };

    const { error, data, loading } = useQuery(GET_OPENING, {
        variables: { fen },
        skip: fen === "start",
    });

    return (
        <>
            <div className="row" style={{ color: "white" }}>
                <div className="column" style={{ alignItems: "end" }}>
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
                        <FENorPGN
                            {...{ setFen, placeholder, setPlaceholder, chess}}
                        />
                    </div>
                </div>

                <div className="double-column left">
                    {loading && (
                        <span style={{ color: "lightgreen" }}>
                            Searching...
                        </span>
                    )}

                    {error && (
                        <span style={{ color: "red" }}>{error.toString()}</span>
                    )}

                    {data && <Opening {...{ fen, handleMovePlayed, data }} />}
                </div>
            </div>
            {data && data.getOpeningForFenFull?.from?.length > 1 && (
                <div className="row">
                    <div className="double-column">
                        <Transitions {...{ data }} />
                    </div>
                    <div className="column"></div>
                </div>
            )}
        </>
    );
};

const ThePage = (setMode) => {
    const [fen, setFen] = useState("start"); //TODO: use position history context (TBD)
    const chess = useRef(new Chess());

    return <SearchPage {...{ setMode, chess, fen, setFen }} />;
};

export default ThePage;
