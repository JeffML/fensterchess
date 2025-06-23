import { useQuery as useQueryRQ } from '@tanstack/react-query';
import { pgnRead } from 'kokopu';
import { useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { SERVER } from '../common/consts.js';
import '../stylesheets/grid.css';
import '../stylesheets/tabs.css';
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
