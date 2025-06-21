import { Chess } from 'chess.js';
import { useContext, useRef } from 'react';
import { OpeningBookContext } from '../../contexts/OpeningBookContext';
import { OpeningDetails } from './openingTabContent/OpeningDetails';


const findOpeningForGame = (game) => {
    const { openingBook } = useContext(OpeningBookContext);

    const fens = game
        .nodes()
        .slice(0, 50)
        .map((n) => n.fen());

    let opening;

    for (let fen of fens.reverse()) {
        const obEntry = openingBook[fen];
        if (obEntry) {
            const { eco, name, moves } = obEntry;

            opening = { eco, name, moves, fen };
            break;
        }
    }

    return opening;
};

export const OpeningTab = ({ game }) => {
    const chess = useRef(new Chess());

    if (!game)
        return (
            <span className="white" style={{ fontSize: 'larger' }}>
                Please select an opening from the Games tab
            </span>
        );

    const opening = findOpeningForGame(game);
    chess.current.loadPgn(opening.moves);
    return <OpeningDetails {...{ opening, game, chess }} />;
};
