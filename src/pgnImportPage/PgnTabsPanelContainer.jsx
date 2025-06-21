import { gql, useQuery } from '@apollo/client';
import { useQuery as useQueryRQ } from '@tanstack/react-query';
import { pgnRead } from 'kokopu';
import { Chessboard } from 'kokopu-react';
import { useContext, useRef, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { ActionButton } from '../common/Buttons.jsx';
import PliesAryToMovesStringSpan from '../common/PliesAryToMovesStringSpan.jsx';
import StackedBarChart from '../common/StackedBarChart.jsx';
import { SERVER } from '../common/consts.js';
import { OpeningBookContext } from '../contexts/OpeningBookContext.jsx';
import { SelectedSitesContext } from '../contexts/SelectedSitesContext.jsx';
import '../stylesheets/grid.css';
import '../stylesheets/tabs.css';
import {
    movesStringToPliesAry,
    pliesAryToMovesString,
} from '../utils/openings.js';
import { PgnTabsPanel } from './PgnTabsPanel.jsx';

// pgn file requests for url links
const getPgnFiles = async ({ pgnLinks }) => {
    const response = await fetch(SERVER + '/.netlify/functions/getPgnFiles', {
        method: 'POST',
        body: JSON.stringify({ pgnLinks }),
    });

    const data = await response.json();
    return { getPgnFiles: data };
};

const GET_OPENING_ADDITIONAL = gql`
    query getOpeningAdditional($fen: String!, $sites: [String]!) {
        getOpeningAdditional(fen: $fen, sites: $sites) {
            alsoKnownAs
            wins {
                w
                b
                d
            }
        }
    }
`;

export const getPgnSummary = (pgn) => {
    const ETC = ', etc.';
    const db = pgnRead(pgn);
    const gmCt = db.gameCount();

    // iterate through games, gathering stats
    let high = 0,
        low = 9999,
        avg = 0,
        players = {};
    const openings = new Set();
    let mainEvent = null;

    for (let game of db.games()) {
        const { white, black, opening, event } = game.pojo();

        mainEvent ??= event;
        if (event !== mainEvent && !mainEvent.endsWith(ETC)) mainEvent += ETC;

        players[white.name] = white;
        players[black.name] = black;

        openings.add(opening);

        const elos = [white.elo, black.elo];
        if (Number.isInteger(elos[0])) high = Math.max(high, elos[0]);
        if (Number.isInteger(elos[1])) high = Math.max(high, elos[1]);
        if (Number.isInteger(elos[0])) low = Math.min(low, elos[0]);
        if (Number.isInteger(elos[1])) low = Math.min(low, elos[1]);
        avg += elos[0] + elos[1];
    }

    avg = avg / gmCt / 2;

    return {
        db,
        players,
        high,
        low,
        avg,
        count: gmCt,
        openings,
        event: mainEvent,
    };
};

const ChessboardWithControls = ({ chess, plies, plyIndex, setPlyIndex }) => {
    const doRest = () => {
        const currMoves = pliesAryToMovesString(
            plies.current.slice(0, plyIndex)
        );
        chess.current.loadPgn(currMoves);
    };

    const back = () => {
        setPlyIndex(Math.max(--plyIndex, 0));
        doRest();
    };

    const forward = () => {
        setPlyIndex(Math.min(++plyIndex, plies.current.length));
        doRest();
    };

    const fen = chess.current.fen();

    return (
        <div>
            <Chessboard
                position={fen}
                squareSize={30}
                animated={false}
                coordinateVisible={false}
            />
            <div style={{ marginLeft: '-10%', marginTop: '-3%' }}>
                <ActionButton
                    onClick={back}
                    text="&lArr;"
                    style={{ fontSize: '14pt' }}
                ></ActionButton>
                <ActionButton
                    onClick={forward}
                    text="&rArr;"
                    style={{ fontSize: '14pt' }}
                ></ActionButton>
            </div>
        </div>
    );
};

const Moves = ({ openingPliesRef, gamePliesRef, plyIndex }) => {
    const openingMovesStyle = {
        color: 'powderblue',
    };
    const ellipsesStyle = {
        border: 'solid 1px darkgray',
        fontSize: '16pt',
        color: 'limegreen',
        display: 'inline-block',
        lineHeight: '0px',
        borderRadius: '3px',
        height: '12px',
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
                    style={ellipsesStyle}
                    className="hoverEffect"
                    onClick={clickHandler}
                >
                    ...
                </span>
            )}
            {showGameMoves && <span>{gameMoves}</span>}
        </span>
    );
};

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
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 3fr',
                marginTop: '1em',
            }}
        >
            <ChessboardWithControls
                {...{
                    chess,
                    plies: gamePliesRef,
                    plyIndex,
                    setPlyIndex,
                }}
            />
            <div
                id="game-details"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 3fr',
                    textAlign: 'left',
                    gridAutoRows: 'minContent',
                    gridAutoColumns: 'minContent',
                    marginLeft: '.6em',
                }}
            >
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
                <AdditionalOpenings {...{ fen }} />
            </div>
        </div>
    );
};

export const findOpeningForGame = (game) => {
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

const AdditionalOpenings = ({ fen }) => {
    const wins2pctgs = ({ w, b, d }) => {
        let games = w + b + d;
        const pctg = (n) => Math.round((n / games) * 100);

        if (games) {
            return {
                games,
                w: pctg(w),
                b: pctg(b),
                d: pctg(d),
            };
        } else return { w: 0, b: 0, d: 0 };
    };

    const sites = useContext(SelectedSitesContext).selectedSites;

    const { loading, data } = useQuery(GET_OPENING_ADDITIONAL, {
        variables: { fen, sites },
        skip: fen === 'start' || sites.length === 0,
    });

    if (loading)
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto',
                    gridColumnStart: '2',
                    gridColumnEnd: 'auto',
                }}
            >
                <strong style={{ marginRight: '1em', color: '#FFCE44' }}>
                    Loading...
                </strong>
            </div>
        );

    if (data) {
        const { alsoKnownAs, wins } = data.getOpeningAdditional;

        const siteData = sites.map((site, i) => {
            const { games, w, b, d } = wins2pctgs(wins[i]);

            return (
                <div
                    id="AdditionalOpenings"
                    key={site}
                    style={{
                        display: 'contents',
                        gridColumnStart: '1',
                        textAlign: 'left',
                        color: 'white',
                    }}
                >
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                    <strong style={{ marginRight: '1em' }}>{site}:</strong>{' '}
                    <span>{alsoKnownAs[i]}</span>
                    <div style={{ marginRight: '3em' }}>
                        <span style={{ marginLeft: '1em', marginRight: '1em' }}>
                            games:
                        </span>{' '}
                        {games ?? 0}
                    </div>
                    <span>
                        {games && (
                            <>
                                {' '}
                                w/d/l: &nbsp;&nbsp;
                                <StackedBarChart
                                    {...{
                                        pctgs: { w, b, d },
                                        style: { display: 'inline-grid' },
                                    }}
                                />{' '}
                            </>
                        )}
                    </span>
                </div>
            );
        });

        return siteData;
    }
};

/*
Arguments are url OR pgn.

If given a url, query TWIC for games; else load the pgn file directly.
*/
export const PgnTabsPanelContainer = ({ link }) => {
    const { url = null, pgn } = link;

    // controlled mode; see https://www.npmjs.com/package/react-tabs#controlled-vs-uncontrolled-mode
    const [tabIndex, setTabIndex] = useState(0);

    const dummyMetaPgnInput = { link: url, lastModified: '' };

    const { isError, isPending, error, data } = useQueryRQ({
        queryKey: ['pgnFiles', url],
        queryFn: async () => {
            const pgnFiles = await getPgnFiles({
                pgnLinks: [dummyMetaPgnInput],
            });
            return pgnFiles;
        },
        enabled: url !== null,
    });

    if (error) console.error(error.toLocaleString());
    if (url && isPending) return <span className="white">Loading...</span>;

    if (data || pgn) {
        return (
            <PgnTabsPanel
                {...{
                    pgn: data.getPgnFiles[0].pgn || pgn,
                    tabIndex,
                    setTabIndex,
                }}
            />
        );
    }
};

