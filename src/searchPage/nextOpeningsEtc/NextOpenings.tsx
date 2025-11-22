import { useState } from "react";
import { sortEnum } from "../../common/consts";
import "../../stylesheets/variationsRow.css";
import { NextOpeningsGrid } from "./NextOpeningsGrid";
import { TranspositionsGrid } from "./TranspositionsGrid";
import { Opening } from "../../types";

interface Variation extends Opening {
  theMove?: string;
  nextPly?: string;
}

interface SortByProps {
  setSortBy: (sortBy: number) => void;
}

/**
 * Sorting options for opening lists
 */
const SortBy = ({ setSortBy }: SortByProps) => {
  return (
    <span id="sortBy">
      Sort By:{" "}
      <select onChange={(e) => setSortBy(parseInt(e.target.value))}>
        {Object.keys(sortEnum).map((option) => (
          <option key={option} value={sortEnum[option as keyof typeof sortEnum]}>
            {option}
          </option>
        ))}
      </select>
    </span>
  );
};

interface NextOpeningsProps {
  legalMoves: Variation[];
  transpositions: Variation[];
  handleMovePlayed: (move: string) => void;
}

/**
 * Container for list of opening variations that can be moved to or transposed from current position
 */
export const NextOpenings = ({
  legalMoves,
  transpositions,
  handleMovePlayed,
}: NextOpeningsProps) => {
  const [sortBy, setSortBy] = useState(sortEnum.EVALUATION);

  if (legalMoves && legalMoves.length !== 0) {
    return (
      <div className="row">
        <div className="column left" style={{ marginBottom: "0px" }}>
          <SortBy {...{ sortBy, setSortBy }} />
        </div>

        <div className="row">
          <div className="column">
            <h3 className="row" style={{ marginBottom: "0px" }}>
              Continuations
            </h3>
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
              <h3 className="row" style={{ marginBottom: "0", marginTop: "-10px" }}>
                Transpositions
              </h3>
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
