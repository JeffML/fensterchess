import { sortEnum } from "./common/consts.js";
import { Fragment, useState } from "react";
import {Chess} from 'chess.js'

const chess = new Chess()

const legalMove = (moves, variation) => {
    const nextMove = variation.split(' ').at(-1);

    // the last ply might be illegal due to transposition of moves; filter these out
    chess.loadPgn(moves)
    const legalMoves = chess.moves()  

    return legalMoves.includes(nextMove)? nextMove : null;
}

const NextMovesGrid = ({ currentMoves, handleMovePlayed, nextMoves, sortBy }) => {

    const toSort = [...nextMoves];

    switch (sortBy) {
        case sortEnum.EVALUATION:
            toSort.sort((a, b) => Math.abs(a.score) - Math.abs(b.score));
            break;
        case sortEnum.NAME:
            toSort.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            throw Error(`unknown case ${sortBy}`)
    }

    const ListItem = ({ name, moves: variation, score }, index) => {
        const nextMove = legalMove(currentMoves, variation);
        if (!nextMove) return null

        name = name.replace(/(\s\(i\))+/, '*')

        const backgroundColor = index % 2 ? "darkslategrey" : "slategrey";
        return (
            <div
                key={nextMove}
                style={{
                    backgroundColor,
                    display: "grid",
                    gridTemplateColumns: "1fr 3fr 1fr",
                    padding: "3px",
                }}
            >
                <div style={{ textAlign: "left", paddingLeft: "1em" }}>
                    {nextMove}:
                </div>
                <div className="fakeLink">
                    <span
                        style={{ textAlign: "left" }}
                        onClick={() => handleMovePlayed(nextMove)}
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

const NextMovesRow = ({ nextMoves, currentMoves, handleMovePlayed }) => {
    const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

    return (
        <div className="row">
            {nextMoves && nextMoves.length !== 0 && (
                <>
                        <div
                            className="column"
                            style={{ alignItems: "start", marginBottom: "0px" }}
                        >
                            <span
                                style={{ fontWeight: "bold" }}
                            >
                                Next Moves
                            </span>
                        </div>
                        <div className="column" style={{ marginBottom: "0px" }}>
                            <SortBy {...{ sortBy, setSortBy }} />
                        </div>
                        <div className="row">
                            <div className="column">
                                <NextMovesGrid
                                    {...{
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
};

const Transitions = ({ data }) => {
    const { moves: omoves, from } = data.getOpeningForFenFull;
    //TODO: from is an object of variations (name/moves) with FEN keys;
    // 0. check of moves = from[key].moves; if so, do nothing
    // 1. use a grid like the one for next moves for each from variation that differs from main
    // 2. highlight the move diffs (see OpeningCompare.js)
    // 3. show variation name and moves in grid

    if (from.length === 0) return null;

    const tmoves = omoves.slice(0, omoves.lastIndexOf(" "));

    const transitions = Object.entries(from).map(([, { name, moves }]) => {
        if (moves !== tmoves) {
            return (
                <Fragment key={name}>
                    <div className="white" style={{textAlign:"left"}}>{name}</div>
                    <div className="white">{moves}</div>
                </Fragment>
            );
        } else {
            return null;
        }
    });

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                padding: "3px",
            }}
        >
            <span className="font-cinzel white left underline">Opening Transitions</span><span></span>
            {transitions}
        </div>
    );
};

export { NextMovesRow as default, Transitions };
