import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { getFullOpeningNameFromKokopuGame } from '../../utils/chessTools';
import { findOpeningForKokopuGame } from '../../utils/openings';

export const GamesTab = ({ db, filter, setGame, setTabIndex }) => {
    const [openingSrc, setOpeningSrc] = useState('pgn');
    // games in db are kokopu objects, not chess.js
    const games = Array.from(db.games());

    const clickHandler = (g) => {
        setTabIndex(2);
        setGame(g);
    };

    const filterFunc = (game) =>
        !filter.length || filter.includes(game.opening());

    // eslint-disable-next-line no-unused-vars
    const logOpening = (pgnOpening, fensterOpening) => {
        console.log(
            JSON.stringify(
                {
                    pgn: pgnOpening ?? 'N/A',
                    fenster: fensterOpening?.name ?? 'N/A',
                },
                null,
                2
            )
        );
    };

    return (
        <>
            <div id="games-header" className="font-cinzel games-tab-grid">
                <span>Rnd</span>
                <span>Date</span>
                <span>White</span>
                <span>Black</span>
                <span className="openingHeading">
                    Opening
                    <span>
                        <input
                            type="radio"
                            name="source"
                            value="pgn"
                            checked={openingSrc === 'pgn'}
                            onClick={() => setOpeningSrc('pgn')}
                            readOnly={true}
                        ></input>
                        PGN
                    </span>
                    <span>
                        <input
                            type="radio"
                            name="source"
                            value="fenster"
                            checked={openingSrc === 'fenster'}
                            readOnly={true}
                            onClick={() => setOpeningSrc('fenster')}
                        ></input>
                        Fenster
                    </span>
                </span>
                <span>Result</span>
            </div>
            <hr />
            <div id="games-rows" className="white games-tab-grid">
                {games.filter(filterFunc).map((g, i) => {
                    const pgnOpening = getFullOpeningNameFromKokopuGame(g)
                    const fensterOpening = findOpeningForKokopuGame(g);
                    let variant = g.variant();
                    if (variant && variant === 'regular') variant = null;
                    // logOpening(pgnOpening, fensterOpening);

                    const opening =
                        openingSrc === 'pgn' ? pgnOpening : fensterOpening?.name;

                    return (
                        <Fragment key={i}>
                            <span style={{ marginLeft: '15px' }}>
                                {g.fullRound()}
                            </span>
                            <span>{g.dateAsString()}</span>
                            <span>{g.playerName('w')}</span>
                            <span>{g.playerName('b')}</span>
                            {variant && (
                                <span>{variant} variant not supported</span>
                            )}
                            {!variant && (
                                <span
                                    className="fakeLink"
                                    onClick={() => clickHandler(g)}
                                >
                                    {opening?? 'N/A'}
                                </span>
                            )}

                            <span>{g.result()}</span>
                        </Fragment>
                    );
                })}
            </div>
        </>
    );
};
