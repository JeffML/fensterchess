import { useState } from "react";
import { sortEnum } from "../../common/consts.js";
import "../../stylesheets/variationsRow.css";
import { NextOpeningsGrid } from "./NextOpeningsGrid.jsx";
import { TranspositionsGrid } from "./TranspositionsGrid.jsx";


/**
 * Sorting options for opening lists
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
export const NextOpenings = ({ legalMoves, transpositions, handleMovePlayed }) => {
    const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

    if (legalMoves && legalMoves.length !== 0) {
        return (
            <div className="row">
                <div className="column left" style={{ marginBottom: "0px" }}>
                    <SortBy {...{ sortBy, setSortBy }} />
                </div>

                <div className="row">
                    <div className="column">
                        <h3 className="row" style={{marginBottom: "0px"}}>Continuations</h3>
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
                            <h3 className="row" style={{marginBottom: "0", marginTop:"-10px"}}>Transpositions</h3>
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


