import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { useQuery, gql } from "@apollo/client";
import "react-tabs/style/react-tabs.css";
import "./stylesheets/grid.css";
import { pgnRead } from "kokopu";
import { Fragment, useContext, useState } from "react";
import sleep from "./utils/sleep.js";
import { SelectedSitesContext } from "./common/Contexts.js";

const blueBoldStyle = { color: "LightSkyBlue" };

const tabStyle = {
    border: "1px solid #FFFFFF ",
    borderRadius: "10px 10px 0 0",
};

const tabFlashStyle = {
    ...tabStyle,
    transition: "all 0.1s ease-in",
    // color: "orange",
    // padding: "20px",
};

const tabFlashStyle2 = {
    backgroundColor: "orange",
};

// file requests for (a) link
const GET_PGN_FILES = gql`
    query GetPgnFiles($pgnLinks: [MetaPgnInput]) {
        getPgnFiles(pgnLinks: $pgnLinks) {
            link
            pgn
        }
    }
`;

const FIND_OPENINGS = gql`
    query FindOpeningsForFens($fens: [String]!) {
        getOpeningsForFens2(fens: $fens) {
            eco
            name
            moves
            fen
        }
    }
`;

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

const getPgnSummary = (pgn) => {
    const ETC = ", etc."
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

        mainEvent ??= event
        if (event !== mainEvent && !mainEvent.endsWith(ETC)) mainEvent += ETC

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

    return { db, players, high, low, avg, count: gmCt, openings, event:mainEvent };
};

const Openings = ({ openings, setFlash, filter, setFilter }) => {
    const gridStyle = {
        display: "grid",
        gridTemplate: "1fr 2fr",
        maxHeight: "250px",
        minWidth: "fit-content",
        marginTop: "1em",
        overflowX: "visible",
    };

    const handler = async ({ target }) => {
        setFlash(true);
        await sleep(200);
        setFlash(false);
        await sleep(200);
        setFlash(true);
        await sleep(200);
        setFlash(false);
        await sleep(200);
        setFlash(true);
        await sleep(200);
        setFlash(false);

        if (target.checked)
            setFilter((prev) => {
                prev.push(target.value);
                return prev;
            });
        else setFilter((prev) => prev.filter((f) => f !== target.value));
    };

    return (
        <div style={gridStyle} className="scrollableY white">
            <span
                className="font-cinzel left"
                style={{ ...blueBoldStyle, gridColumn: "span 2" }}
            >
                Openings
                <span style={{ fontSize: "smaller", paddingTop: "2px" }}>
                    &nbsp;(from PGN)
                </span>
            </span>
            {Array.from(openings)
                .sort((a, b) => a.localeCompare(b))
                .map((o, i) => (
                    <Fragment key={o + i}>
                        <input
                            type="checkbox"
                            value={o}
                            onClick={handler}
                            defaultChecked={filter.includes(o)}
                        ></input>
                        <span key={o + i} className="left">
                            {o ?? "(no name)"}
                        </span>
                    </Fragment>
                ))}
        </div>
    );
};

const PgnSummary = ({ pgnSumm, setFlash, filter, setFilter }) => {
    const { count, high, low, openings, event } = pgnSumm;

    return (
        <>
            <div className="row">
                <div name="details" className="column left white">
                    <div><span style={blueBoldStyle}>Event:</span> {event}</div>
                    <div>
                        <span style={blueBoldStyle}>Games:</span> {count}
                    </div>
                    <div>
                        <span style={blueBoldStyle}>High Rating:</span> {high}
                    </div>
                    <div>
                        <span style={blueBoldStyle}>Low Rating:</span>
                        {low}
                    </div>
                    <div className="row">
                        <Openings
                            {...{ openings, setFlash, filter, setFilter }}
                        />
                    </div>
                </div>
                <div className="column left">
                    <Players {...{ pgnSumm }} />
                </div>
            </div>
        </>
    );
};

const Players = ({ pgnSumm }) => {
    const { players } = pgnSumm;
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 3fr 1fr",
        gap: "2em",
    };

    const [method, setMethod] = useState("name");

    const sort = (a, b) => {
        const titleSort = [
            "GM",
            "WGM",
            "IM",
            "WIM",
            "FM",
            "WFM",
            "CM",
            "WCM",
            "NM",
            "",
        ];

        if (method === "name") return a.name.localeCompare(b.name);
        if (method === "ELO")
            return parseInt(b.elo ?? 0) - parseInt(a.elo ?? 0);
        if (method === "title") {
            return (
                titleSort.indexOf(a.title ?? "") -
                titleSort.indexOf(b.title ?? "")
            );
        }
    };

    const onChange = (e) => setMethod(e.target.value);

    return (
        <>
            <div
                style={{
                    whiteSpace: "nowrap",
                    color: "powderblue",
                    justifyContent: "space-evenly",
                }}
            >
                Sort by:{" "}
                <label style={{ marginLeft: "1em" }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="name"
                        defaultChecked="true"
                        onChange={onChange}
                    />
                    Player name
                </label>
                <label style={{ display: "inline", marginLeft: "1em" }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="ELO"
                        onChange={onChange}
                    />
                    Player ELO
                </label>
                <label style={{ display: "inline", marginLeft: "1em" }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="title"
                        onChange={onChange}
                    />
                    Player Title
                </label>
            </div>
            <div className="column scrollableY">
                {Object.values(players)
                    .sort(sort)
                    .map(({ name, elo, title }, i) => (
                        <div
                            className="left white"
                            key={name}
                            style={{
                                ...gridStyle,
                                backgroundColor:
                                    i % 2 ? "slategray" : "inherit",
                            }}
                        >
                            <span className="left">{title}</span>
                            <span className="left">{name}</span>
                            <span>{elo}</span>
                        </div>
                    ))}
            </div>
        </>
    );
};

const Games = ({ db, filter }) => {
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 2fr 3fr 3fr 4fr 1fr",
        maxHeight: "250px",
        gap: "3px",
    };

    const games = Array.from(db.games());
    const [index, setIndex] = useState(-1);

    const clickHandler = (i) => setIndex(i);

    const filterFunc = (game) =>
        !filter.length || filter.includes(game.opening());

    return (
        <>
            <div name="lefty" style={gridStyle} className="white font-cinzel">
                <span>Round</span>
                <span>Date</span>
                <span>White</span>
                <span>Black</span>
                <span>
                    Opening{" "}
                    <span style={{ fontSize: "smaller" }}>(from PGN)</span>
                </span>
                <span>Result</span>
            </div>
            <hr />
            <div name="lefty" style={gridStyle} className="scrollableY white">
                {games.filter(filterFunc).map((g, i) => {
                    const opening = g.opening();
                    return (
                        <Fragment key={i}>
                            <span>{g.fullRound()}</span>
                            <span>{g.dateAsString()}</span>
                            <span>{g.playerName("w")}</span>
                            <span>{g.playerName("b")}</span>
                            {opening ? (
                                <span
                                    className="fakeLink"
                                    onClick={() => clickHandler(i)}
                                >
                                    {opening}
                                </span>
                            ) : (
                                <span>N/A</span>
                            )}
                            <span>{g.result()}</span>
                            {index === i && (
                                <OpeningBookComparison
                                    key={i}
                                    {...{ game: g, id: i, index }}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </div>
        </>
    );
};

const OpeningBookComparison = ({ game }) => {
    const columnStyle = { gridColumnStart: "span 6" };
    const gridStyle = {
        display: "inline-grid",
        gridTemplateColumns: "auto auto",
        gap: "3px",
        marginLeft: "3em",
        color: "#BDEDFF",
    };

    const fens = game
        .nodes()
        .slice(0, 50)
        .map((n) => n.fen());
    const { data } = useQuery(FIND_OPENINGS, { variables: { fens } });

    if (data) {
        const openings = data.getOpeningsForFens2;
        const { name, moves, fen } = openings.at(-1);

        return (
            <span style={columnStyle}>
                <div style={gridStyle}>
                    <strong style={{ marginRight: "1em" }}>Fenster:</strong>{" "}
                    <span>{name}</span>
                    <strong style={{ marginLeft: "1em" }}>Moves:</strong>{" "}
                    <span> {moves}</span>
                    <AdditionalOpenings {...{ fen }} />
                </div>
            </span>
        );
    }
};

// Note: if called w/o a url, this does nothing (note the skip)
const PgnQueryGames = (url = null, flash, setFlash, filter, setFilter) => {
    const dummyMetaPgnInput = { link: url, lastModified: "" };
    const { error, data, loading } = useQuery(GET_PGN_FILES, {
        variables: { pgnLinks: [dummyMetaPgnInput] },
        skip: url === null,
    });

    if (error) console.error(error.toLocaleString());
    if (loading) return <span className="white">Loading...</span>;
    if (data) {
        return PgnDirectGames(
            data.getPgnFiles[0].pgn,
            flash,
            setFlash,
            filter,
            setFilter
        );
    }
};

const PgnDirectGames = (pgn, flash, setFlash, filter, setFilter) => {
    const pgnSumm = getPgnSummary(pgn);
    return (
        <Tabs>
            <TabList className="left" style={{ marginBottom: "0px" }}>
                <Tab style={tabStyle}>Summary</Tab>
                <Tab
                    style={{
                        ...tabFlashStyle,
                        ...(flash ? tabFlashStyle2 : null),
                    }}
                >
                    Games
                </Tab>
            </TabList>
            <div style={{ border: "thick solid white" }}>
                <TabPanel>
                    <PgnSummary {...{ pgnSumm, setFlash, filter, setFilter }} />
                </TabPanel>
                <TabPanel>
                    <Games {...{ db: pgnSumm.db, filter }} />
                </TabPanel>
            </div>
        </Tabs>
    );
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
        skip: fen === "start",
    });

    if (loading)
        return (
            <>
                <strong style={{ marginRight: "1em", color: "#FFCE44" }}>
                    Loading...
                </strong>{" "}
                <span></span>
                <strong style={{ marginLeft: "1em" }}></strong> <span></span>
            </>
        );

    if (data) {
        const { alsoKnownAs, wins } = data.getOpeningAdditional;

        const siteData = sites.map((site, i) => {
            const { games, w, b, d } = wins2pctgs(wins[i]);

            return (
                <Fragment key={site}>
                    <strong style={{ marginRight: "1em" }}>{site}:</strong>{" "}
                    <span>{alsoKnownAs[i]}</span>
                    <strong style={{ marginLeft: "1em" }}>
                        games (w/b/d %):
                    </strong>{" "}
                    <span>
                        {" "}
                        {games} {w}/{b}/{d}
                    </span>
                </Fragment>
            );
        });

        return siteData;
    }
};

/*
Arguments are url OR pgn.

If given a url, query TWIC for games; else load the pgn file directly.
*/
const PgnTabs = ({ url, pgn }) => {
    // The following have to be at this level because of the hooks issue mentioned below:
    const [flash, setFlash] = useState(false);
    const [filter, setFilter] = useState([]);

    let foo = PgnQueryGames(url, flash, setFlash, filter, setFilter); // this *has* to be called because it has hook in it: https://github.com/facebook/react/issues/24391
    if (pgn) foo = PgnDirectGames(pgn, flash, setFlash, filter, setFilter);
    return foo;
};

export default PgnTabs;
