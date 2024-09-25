const APP_NAME = "Fenster";
const VERSION = "2.3.0"; // keep in sync with package.json version!

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
const sites = ["FICS", "lichess", "shredder"];
const siteUrls = {
    FICS: "https://www.freechess.org/",
    lichess: "https://lichess.org/",
    shredder: "https://www.shredderchess.com/",
};

const FENEX = /(?!.*\d{2,}.*)^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/im;
const DEFAULT_SERVER = "fenster-s.netlify.app";

const token = process.env.REACT_APP_QUOTE; // authentication token
const alias = process.env.REACT_APP_SERVER; // this can be set as follows: "REACT_APP_SERVER=flum netlify dev"

const isTestMode = process.env.REACT_APP_TEST_MODE === "flum"; // brings up test page

// prettier-ignore
const serverUri = `https://${alias? alias + "--" : ""}${DEFAULT_SERVER}/.netlify/functions/server`;
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
};
