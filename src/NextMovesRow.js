import { sortEnum } from "./common/consts.js";
import { Fragment, useState } from "react";

const movesDiff = (moves, nextMoves) => {
    const denumberateAndSplit = (moves) => {
        const regex = /\d{1,3}\.\s/g;
        return moves.replace(regex, "").split(" ");
    };
    const plies = [denumberateAndSplit(moves), denumberateAndSplit(nextMoves)];
    let nm;

    /*  iterate backwards by 2 until a ply difference is found
        This won't be perfect, (for instance Ne2 vs Nfe2), but that can be dealt with later
        
        ex:
        plies[0]: ["g3", "c5"]
        plies[1]: ["e4", "c5", "g3"]

    */

    for (let i = plies[1].length - 1; i >= 0; i -= 2) {
        nm = plies[1][i];
        if (!plies[0].includes(nm)) {
            break;
        }
    }
    return nm;
};

const NextMovesGrid = ({ moves, handleMovePlayed, next, sortBy }) => {
    const toSort = [...next];

    switch (sortBy) {
        case sortEnum.EVALUATION:
            toSort.sort((a, b) => Math.abs(a.score) - Math.abs(b.score));
            break;
        case sortEnum.NAME:
            toSort.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            throw Error(`unknkown case ${sortBy}`)
    }

    const ListItem = ({ name, moves: nextMoves, score }, index) => {
        const nextMove = movesDiff(moves, nextMoves);
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

const NextMovesRow = ({ next, moves, handleMovePlayed }) => {
    const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

    return (
        <div className="row">
            {next && next.length !== 0 && (
                <>
                        <div
                            className="column"
                            style={{ alignItems: "start", marginBottom: "0px" }}
                        >
                            <label
                                htmlFor="sortBy"
                                style={{ fontWeight: "bold" }}
                            >
                                Next Moves
                            </label>
                        </div>
                        <div className="column" style={{ marginBottom: "0px" }}>
                            <SortBy {...{ sortBy, setSortBy }} />
                        </div>
                        <div className="row">
                            <div className="column">
                                <NextMovesGrid
                                    {...{
                                        moves,
                                        next,
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
