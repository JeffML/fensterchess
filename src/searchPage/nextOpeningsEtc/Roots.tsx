import { Fragment } from "react";
import { handleMoves } from "./handleMoves";
import { Opening } from "../../types";

interface RootsProps {
  from?: Opening[];
}

/**
 * Root move sequences for current position
 */
export const Roots = ({ from }: RootsProps) => {
  if (!from || from.length === 0) return null;

  const roots = Object.entries(from).map(([, { name, moves, src }]) => {
    return (
      <Fragment key={name}>
        <div className="fakeLink root" onClick={() => handleMoves(moves)}>
          {src === "interpolated" ? <i>{name}</i> : name}
        </div>
        <div className="white left">{moves}</div>
      </Fragment>
    );
  });

  return (
    <div id="transitionsGrid">
      <span className="font-cinzel white left underline">Root Sequences</span>
      <span></span>
      {roots}
    </div>
  );
};
