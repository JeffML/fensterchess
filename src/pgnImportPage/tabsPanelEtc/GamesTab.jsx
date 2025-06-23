import { Fragment } from 'react/jsx-runtime';

export const GamesTab = ({ db, filter, setGame, setTabIndex }) => {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 3fr 3fr 4fr 1fr',
        maxHeight: '250px',
        gap: '3px',
    };

    const games = Array.from(db.games());

    const clickHandler = (g) => {
        setTabIndex(2);
        setGame(g);
    };

    const filterFunc = (game) => !filter.length || filter.includes(game.opening());

    return (
        <>
            <div name="lefty" className="white font-cinzel games-tab-grid">
                <span>Round</span>
                <span>Date</span>
                <span>White</span>
                <span>Black</span>
                <span>
                    Opening{' '}
                    <span style={{ fontSize: 'smaller' }}>(from PGN)</span>
                </span>
                <span>Result</span>
            </div>
            <hr />
            <div name="lefty" className="scrollableY white games-tab-grid">
                {games.filter(filterFunc).map((g, i) => {
                    const pgnOpening = g.opening();
                    let variant = g.variant();
                    if (variant && variant === 'regular') variant = null;

                    return (
                        <Fragment key={i}>
                            <span>{g.fullRound()}</span>
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
                                    {pgnOpening ?? 'N/A'}
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
