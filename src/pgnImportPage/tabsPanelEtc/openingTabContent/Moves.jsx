import { useState } from "react";
import PliesAryToMovesStringSpan from '../../../common/PliesAryToMovesStringSpan';

export const Moves = ({ openingPliesRef, gamePliesRef, plyIndex }) => {
    const openingMovesStyle = {
        color: 'powderblue',
    };

    const [showGameMoves, setShowGameMoves] = useState(false);

    const clickHandler = () => {
        setShowGameMoves(!showGameMoves);
    };

    let gamePlies, gameMoves;

    if (showGameMoves) {
        const opLen = openingPliesRef.current.length;
        gamePlies = gamePliesRef.current.slice(opLen);
        gameMoves = PliesAryToMovesStringSpan(gamePlies, {
            start: opLen,
            plyIndex,
            color: 'lightgreen',
        });
    }
    const openingMoves = PliesAryToMovesStringSpan(openingPliesRef.current, {
        plyIndex,
        color: 'powderblue',
    });

    return (
        <span>
            <span style={openingMovesStyle}>{openingMoves}&nbsp;</span>
            {!showGameMoves && (
                <span 
                    className="ellipses hover-effect"
                    onClick={clickHandler}
                >
                    ...
                </span>
            )}
            {showGameMoves && <span>{gameMoves}</span>}
        </span>
    );
};
