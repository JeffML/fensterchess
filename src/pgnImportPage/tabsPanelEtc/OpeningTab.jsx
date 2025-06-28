import { Chess } from 'chess.js';
import { useRef } from 'react';
import { findOpeningForKokopuGame } from '../../utils/openings';
import { OpeningDetails } from './openingTabContent/OpeningDetails';


export const OpeningTab = ({ game }) => {
    const chess = useRef(new Chess());

    if (!game)
        return (
            <span className="white" style={{ fontSize: 'larger' }}>
                Please select an opening from the Games tab
            </span>
        );

    const opening = findOpeningForKokopuGame(game);
    chess.current.loadPgn(opening.moves);
    return <OpeningDetails {...{ opening, game, chess }} />;
};
