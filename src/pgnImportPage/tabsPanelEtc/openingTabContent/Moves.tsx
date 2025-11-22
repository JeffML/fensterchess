import { MutableRefObject, useState } from 'react';
import PliesAryToMovesStringSpan from '../../../common/PliesAryToMovesStringSpan';

interface MovesProps {
    openingPliesRef: MutableRefObject<string[]>;
    gamePliesRef: MutableRefObject<string[]>;
    plyIndex: number;
}

export const Moves = ({ openingPliesRef, gamePliesRef, plyIndex }: MovesProps) => {
    const openingMovesStyle = {
        color: 'powderblue',
    };

    const [showGameMoves, setShowGameMoves] = useState(false);

    const clickHandler = () => {
        setShowGameMoves(!showGameMoves);
    };

    let gamePlies: string[], gameMoves;

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
