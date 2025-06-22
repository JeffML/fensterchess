import { useRef, useState } from 'react';
import '../../../stylesheets/pgnImport.css';
import { movesStringToPliesAry } from '../../../utils/openings';
import { AdditionalDetails } from './AdditionalDetails';
import { ChessboardWithControls } from './ChessboardWithControls';
import { Moves } from './Moves';

export const OpeningDetails = ({ game, opening, chess }) => {
    const { eco, name, moves: openingMoves } = opening;
    const gamePliesRef = useRef(game.pojo().mainVariation);
    const openingPliesRef = useRef(movesStringToPliesAry(openingMoves ?? ''));
    const [plyIndex, setPlyIndex] = useState(openingPliesRef.current.length);

    const event = game.event();
    const white =
        (game.playerTitle('w') ?? '  ') + '   ' + game.playerName('w');
    const black =
        (game.playerTitle('b') ?? '  ') + '   ' + game.playerName('b');

    const onClickHandler = () => {
        const domain = window.location.origin;
        const newBrowserTab = domain + `?moves=${openingMoves}`;
        window.open(newBrowserTab, '_blank');
    };

    const fen = chess.current.fen();

    return (
        <div id="openingDetails" className="opening-details">
            <ChessboardWithControls
                {...{
                    chess,
                    plies: gamePliesRef,
                    plyIndex,
                    setPlyIndex,
                }}
            />
            <div id="gameDetails" className="game-details">
                <span>Event:</span>
                <span>{event}</span>
                <span>White:</span>
                <span>{white}</span>
                <span>Black:</span>
                <span>{black}</span>
                <span>Result:</span>
                <span>{game.result()}</span>
                <span>Fenster Opening Name:</span>
                <span
                    className="fakeLink"
                    style={{ color: 'cyan' }}
                    onClick={() => onClickHandler()}
                >
                    {name}
                </span>
                <span>ECO:</span>
                <span> {eco}</span>
                <span>Moves:</span>{' '}
                <Moves {...{ gamePliesRef, openingPliesRef, plyIndex }} />
                <span>FEN:</span>
                <span>{fen}</span>
                <AdditionalDetails {...{ fen }} />
            </div>
        </div>
    );
};
