import { Fragment } from "react";
import { handleMoves } from "./handleMoves";

/**
 * Root move sequences for current position
 */
const Roots = ({ from }) => {
    if (from.length === 0) return null;

    const roots = Object.entries(from).map(([, { name, moves, src }]) => {
        return (
            <Fragment key={name}>
                <div
                    className="fakeLink"
                    onClick={() => handleMoves(moves)}
                    style={{
                        textAlign: "left",
                        marginLeft: "40px",
                        marginRight: "100px",
                    }}
                >
                    {src === "interpolated" ? <i>{name}</i> : name}
                </div>
                <div className="white left">{moves}</div>
            </Fragment>
        );
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
