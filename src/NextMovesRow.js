import { sortEnum } from "./common/consts.js";
import { Fragment, useState } from "react";
import { Chess } from "chess.js";
import { newName } from "./utils/chessTools.js";
import "./stylesheets/nextMovesRow.css";

const chess = new Chess();

const legalMove = (moves, variation) => {
    const tokens = variation.split(" ");
    const wholeMoves = Math.trunc(tokens.length / 3);
    const partialMoves = tokens.length % 3;
    const nextPly = tokens.at(-1);

    const theMove =
        wholeMoves +
        (partialMoves ? 1 : 0) +
        (partialMoves ? ". " : "... ") +
        nextPly;

    // the last ply might be illegal due to transposition of moves; filter these out
    chess.loadPgn(moves);
    const legalMoves = chess.moves();

    return legalMoves.includes(nextPly) ? { theMove, nextPly } : null;
};

const NextMovesGrid = ({
    currentMoves,
    handleMovePlayed,
    nextMoves,
    sortBy,
}) => {
    const toSort = [...nextMoves];

    switch (sortBy) {
        case sortEnum.EVALUATION:
            toSort.sort((a, b) => Math.abs(a.score) - Math.abs(b.score));
            break;
        case sortEnum.NAME:
            toSort.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case sortEnum.ECO:
            toSort.sort((a, b) => a.eco.localeCompare(b.eco));
            break;
        default:
            throw Error(`unknown case ${sortBy}`);
    }

    const ListItem = ({ name, moves: variation, score, eco }, index) => {
        const nextMove = legalMove(currentMoves, variation);
        if (!nextMove) return null;

        const { theMove, nextPly } = nextMove;

        name = newName(name);

        const backgroundColor = index % 2 ? "darkslategrey" : "slategrey";
        return (
            <div
                key={nextPly}
                id="listItem"
                style={{
                    backgroundColor,
                }}
            >
                <div style={{ textAlign: "left", paddingLeft: "1em" }}>
                    {theMove}
                </div>
                <div style={{ paddingLeft: "1em" }}>{eco}</div>
                <div className="fakeLink">
                    <span
                        style={{ textAlign: "left" }}
                        onClick={() => handleMovePlayed(nextPly)}
                    >
                        {name}
                    </span>
                </div>
                <div style={{ textAlign: "left" }}>{score}</div>
            </div>
        );
    };

    return (
        <div style={{ borderStyle: "solid", marginTop: "1em" }}>
            {toSort.map((s, i) => ListItem(s, i))}
        </div>
    );
};

const SortBy = ({ setSortBy }) => {
    return (
        <span id="sortBy">
            Sort By:{" "}
            <select onChange={(e) => setSortBy(parseInt(e.target.value))}>
                {Object.keys(sortEnum).map((option) => (
                    <option key={option} value={sortEnum[option]}>
                        {option}
                    </option>
                ))}
            </select>
        </span>
    );
};

const NextMovesRow = ({ eco, nextMoves, currentMoves, handleMovePlayed }) => {
    const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

    if (nextMoves && nextMoves.length !== 0) {
        return (
            <div className="row">
                {nextMoves && nextMoves.length !== 0 && (
                    <>
                        <div
                            className="column left"
                            style={{ marginBottom: "0px" }}
                        >
                            <SortBy {...{ sortBy, setSortBy }} />
                        </div>
                        <div className="row">
                            <div className="column">
                                <NextMovesGrid
                                    {...{
                                        eco,
                                        currentMoves,
                                        nextMoves,
                                        handleMovePlayed,
                                        sortBy,
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    } else {
        return <span>No continuations found</span>;
    }
};

const Transitions = ({ moves: omoves, from }) => {
    if (from.length === 0) return null;

    const tmoves = omoves.slice(0, omoves.lastIndexOf(" "));

    const transitions = Object.entries(from).map(([, { name, moves }]) => {
        if (moves !== tmoves) {
            return (
                <Fragment key={name}>
                    <div className="white" style={{ textAlign: "left" }}>
                        {name}
                    </div>
                    <div className="white">{moves}</div>
                </Fragment>
            );
        } else {
            return null;
        }
    });

    return (
        <div id="transitionsGrid">
            <span className="font-cinzel white left underline">
                Opening Transitions
            </span>
            <span></span>
            {transitions}
        </div>
    );
};

export { NextMovesRow as default, Transitions };
