import { Chess } from "chess.js";
import { Fragment } from "react";

const getFensForMoves = (plies) => {
    const chess = new Chess();
    const [fens, varMoves] = plies.reduce(
        ([a, b], move) => {
            chess.move(move);
            a.push(chess.fen());
            b.push(chess.pgn()); // this will return a string of moves, e.g. '1. d4 Nf6 2. c4 e6 3. Nc3'
            return [a, b];
        },
        [[], []]
    );

    return [fens, varMoves];
};

const pliesAryToMovesString = (plies) => {
    return plies.reduce((prev, curr, i) => {
        if (i % 2 === 0) prev += `${i / 2 + 1}. `;
        prev += `${curr} `;
        return prev;
    }, "");
};

const PliesAryToMovesStringSpan = (plies, { start = 0, plyIndex, color }) => {
    const moveString = (move, i) => {
        return (i % 2 === 0 ? `${i / 2 + 1}. ` : " ") + `${move} `;
    };

    return (
        <>
            {plies.map((ply, index) => {
                let i = index + start;
                if (i === plyIndex - 1) {
                    return <u key={i} style={{color}}><b>{moveString(ply, i)}</b></u>;
                } else {
                    return <span key={i} style={{color}}>{moveString(ply, i)}</span>
                }
            })}
        </>
    );
};

const movesStringToPliesAry = (moves) => {
    const plies = moves.split(/\s+/).map((move) => {
        const matches = move.match(/(?:\d{1,3}\.)?(.*)/);
        return matches[1];
    });
    return plies.filter((p) => p !== "");
};

export {
    getFensForMoves,
    movesStringToPliesAry,
    pliesAryToMovesString,
    PliesAryToMovesStringSpan,
};
