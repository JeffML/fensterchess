import packageJson from '../../package.json' // okay if it's open source anyway

const APP_NAME = "Fenster";
const VERSION = packageJson.version

const INCR = 5; // list increment

const COMPARE = 1;

const sortEnum = {
    EVALUATION: 1,
    NAME: 2,
    // RESULTS: 3,
    ECO: 4,
};

const modes = {
    main: 1,
    test: 2,
    search: 3,
    pgnAnalyze: 4,
    about: 5,
    visualization: 6,
};

const SUBTITLES = [];
SUBTITLES[modes.search] = "Search Openings";
SUBTITLES[modes.admin] = "Test and Administration";
SUBTITLES[modes.pgnAnalyze] = "Import and Analyze PGN";
SUBTITLES[modes.visualization] = "Visualization";
SUBTITLES[modes.about] = "About Fenster";

// Note: shredder has been down before; check https://www.shredderchess.com/online/opening-database.html or see fenster-s getOpeningAdditional resolver
// Update: removed by request of the Shredder guy
const siteUrls = {
    FICS: "https://www.freechess.org/",
    lichess: "https://lichess.org/",
    // shredder: "https://www.shredderchess.com/",
};

const alias = import.meta.env.VITE_APP_SERVER; // this can be set as follows: "VITE_APP_SERVER=flum netlify dev"
const DEFAULT_SERVER = "fenster-s.netlify.app";
const SERVER = `https://${alias? alias + "--" : ""}${DEFAULT_SERVER}`

const sites = Object.keys(siteUrls);

const FENEX = /(?!.*\d{2,}.*)^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/im;

const token = import.meta.env.VITE_APP_QUOTE; // authentication token
const isTestMode = import.meta.env.VITE_APP_TEST_MODE === "flum"; // brings up test page

// prettier-ignore
const serverUri = `${SERVER}/.netlify/functions/server`;
// console.log(`alias was ${alias}, serverUri is ${serverUri}`)

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const ECO_CATS = [
    ["A", "Flank Openings"],
    ["B", "Semi-Open Games"],
    ["C", "Open Games, and French Defense"],
    ["D", "Closed and Semi-Closed Games"],
    ["E", "Indian Defenses"],
];

const NO_ENTRY_FOUND = "No Entry Found in Opening Book"

export {
    APP_NAME,
    SUBTITLES,
    INCR,
    COMPARE,
    sortEnum,
    modes,
    sites,
    siteUrls,
    FENEX,
    VERSION,
    token,
    serverUri,
    RANKS,
    FILES,
    ECO_CATS,
    isTestMode,
    NO_ENTRY_FOUND,
    SERVER
};
