const APP_NAME = "Fenster";
const VERSION = "2.0.1";

const INCR = 5; //list increment

const COMPARE = 1;

const sortEnum = {
    EVALUATION: 1,
    NAME: 2,
    // RESULTS: 3,
    ECO: 4
};

const modes = {
    main: 1,
    admin: 2,
    search: 3,
    pgnAnalyze: 4,
    about: 5,
};

const SUBTITLES = [];
SUBTITLES[modes.search] = "Search Openings";
SUBTITLES[modes.admin] = "Test and Administration";
SUBTITLES[modes.pgnAnalyze] = "Import and Analyze PGN";
SUBTITLES[modes.about] = "About Fenster";

const sites = ["FICS", "lichess", "shredder"];
const siteUrls = {
    FICS: "https://www.freechess.org/",
    lichess: "https://lichess.org/",
    shredder: "https://www.shredderchess.com/",
};

const FENEX = /(?!.*\d{2,}.*)^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/im;
const DEFAULT_SERVER = "fenster-s.netlify.app"

    // get the authentication token from local storage if it exists
    const token = process.env.REACT_APP_QUOTE;
    const serverUri = `https://${process.env.REACT_APP_SERVER??DEFAULT_SERVER}/.netlify/functions/server`;

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
    serverUri
};
