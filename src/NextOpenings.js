import { sortEnum } from "./common/consts.js";
import { Fragment, useState } from "react";
import { newName } from "./utils/chessTools.js";
import "./stylesheets/nextMovesRow.css";
import { Chess } from "chess.js";

const chess = new Chess();

/**
 * Shows next opening variations from current positions
 *
 * @param {{ currentMoves: any; handleMovePlayed: any; nextMoves: any; sortBy: any; }} param0
 * @param {*} param0.currentMoves
 * @param {*} param0.handleMovePlayed
 * @param {*} param0.nextMoves
 * @param {*} param0.sortBy
 * @returns {*}
 */
const NextOpeningsGrid = ({ handleMovePlayed, legalMoves, sortBy }) => {
    const toSort = [...legalMoves];

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

    const ListItem = ({ name, score, eco, theMove, nextPly }, index) => {
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

const TranspositionsGrid = ({ transpositions, sortBy }) => {
    // open a new tab with this transposition
    const handleMovePlayed = (moves) => {
        const domain = window.location.origin;
        const newBrowserTab = domain + `?moves=${moves}`;
        window.open(newBrowserTab, "_blank");
    };

    const toSort = [...transpositions];

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

    const ListItem = ({ name, score, eco, moves }, index) => {
        name = newName(name);

        const backgroundColor = index % 2 ? "darkslategrey" : "slategrey";
        return (
            <div
                key={moves}
                id="listItem"
                style={{
                    backgroundColor,
                }}
            >
                <div
                    style={{
                        textAlign: "left",
                        paddingLeft: "1em",
                        fontFamily: "mono",
                    }}
                >
                    {moves.replace(/(\d{1,3}\.)\s/g, "$1")}
                </div>
                <div style={{ paddingLeft: "1em" }}>{eco}</div>
                <div className="fakeLink">
                    <span
                        style={{ textAlign: "left" }}
                        onClick={() => handleMovePlayed(moves)}
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

/**
 * Description placeholder
 *
 * @param {{ setSortBy: any; }} param0
 * @param {*} param0.setSortBy
 * @returns {*}
 */
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

/**
 * Container for list of opening variations that can be moved to or transposed from current position
 *
 * @param {{legalMoves: *; handleMovePlayed: Function; }} param0
 * @param {Function} param0.handleMovePlayed
 * @returns {*}
 */
const NextOpenings = ({ legalMoves, transpositions, handleMovePlayed }) => {
    const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

    if (legalMoves && legalMoves.length !== 0) {
        return (
            <div className="row">
                <div className="column left" style={{ marginBottom: "0px" }}>
                    <SortBy {...{ sortBy, setSortBy }} />
                </div>

                <div className="row">
                    <div className="column">
                        <h3 className="row">Next Moves</h3>
                        <NextOpeningsGrid
                            {...{
                                legalMoves,
                                handleMovePlayed,
                                sortBy,
                            }}
                        />
                    </div>
                </div>
                {transpositions.length !== 0 && (
                    <div className="row">
                        <div className="column">
                            <h3 className="row">Transpositions</h3>
                            <TranspositionsGrid
                                {...{
                                    transpositions,
                                    sortBy,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    } else {
        return <span>No continuations found</span>;
    }
};

/**
 * Root move sequences for current position
 *
 * @param {{ moves: any; from: any; }} param0
 * @param {*} param0.moves: omoves
 * @param {*} param0.from
 * @returns {*}
 */
const Roots = ({ moves: omoves, from }) => {
    if (from.length === 0) return null;

    const tmoves = omoves.slice(0, omoves.lastIndexOf(" "));

    const roots = Object.entries(from).map(([, { name, moves }]) => {
        if (moves !== tmoves) {
            return (
                <Fragment key={name}>
                    <div
                        className="white"
                        style={{ textAlign: "left", marginLeft: "40px" }}
                    >
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
                Root Sequences
            </span>
            <span></span>
            {roots}
        </div>
    );
};

export { NextOpenings, Roots };