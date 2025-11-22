import { ChessPGN } from '@chess-pgn/chess-pgn';
import { useRef, useContext } from 'react';
import { Game } from 'kokopu';
import { findOpeningForKokopuGame } from '../../utils/openings';
import { OpeningBookContext } from '../../contexts/OpeningBookContext';
import { OpeningDetails } from './openingTabContent/OpeningDetails';

interface OpeningTabProps {
    game: Game | null;
}

export const OpeningTab = ({ game }: OpeningTabProps) => {
    const context = useContext(OpeningBookContext);
    const chess = useRef(new ChessPGN());

    if (!game)
        return (
            <span className="white" style={{ fontSize: 'larger' }}>
                Please select an opening from the Games tab
            </span>
        );

    if (!context?.openingBook) {
        return (
            <span className="white" style={{ fontSize: 'larger' }}>
                Loading opening book...
            </span>
        );
    }

    const opening = findOpeningForKokopuGame(game, context.openingBook);
    if (!opening) {
        return (
            <span className="white" style={{ fontSize: 'larger' }}>
                Opening not found in database
            </span>
        );
    }

    chess.current.loadPgn(opening.moves);
    return <OpeningDetails {...{ opening, game, chess }} />;
};
