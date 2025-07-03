import packageJson from '../../package.json'; // it's okay if it's open source anyway
import { FICS, LICHESS, SERVER } from './urlConsts';

export const APP_NAME = "Fenster";
export const VERSION = packageJson.version

export const INCR = 5; // list increment

export const COMPARE = 1;

export const sortEnum = {
    EVALUATION: 1,
    NAME: 2,
    // RESULTS: 3,
    ECO: 4,
};

export const modes = {
    main: 1,
    test: 2,
    search: 3,
    pgnAnalyze: 4,
    about: 5,
    visualization: 6,
};

export const SUBTITLES = [];
SUBTITLES[modes.search] = "Search Openings";
SUBTITLES[modes.admin] = "Test and Administration";
SUBTITLES[modes.pgnAnalyze] = "Import and Analyze PGN";
SUBTITLES[modes.visualization] = "Visualization";
SUBTITLES[modes.about] = "About Fenster";

export const siteUrls = {
    FICS,
    lichess: LICHESS,
    // SHREDDER
};

export const sites = Object.keys(siteUrls);

export const FENEX = /(?!.*\d{2,}.*)^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/im;

export const token = import.meta.env.VITE_APP_QUOTE; // authentication token
export const isTestMode = import.meta.env.VITE_APP_TEST_MODE === "flum"; // brings up test page

// prettier-ignore
export const serverUri = `${SERVER}/.netlify/functions/server`;
// console.log(`alias was ${alias}, serverUri is ${serverUri}`)

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const ECO_CATS = [
    ["A", "Flank Openings"],
    ["B", "Semi-Open Games"],
    ["C", "Open Games, and French Defense"],
    ["D", "Closed and Semi-Closed Games"],
    ["E", "Indian Defenses"],
];

export const NO_ENTRY_FOUND = "No Entry Found in Opening Book"


