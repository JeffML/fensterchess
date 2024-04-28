import { gql, useQuery } from "@apollo/client";
import { Chessboard } from "kokopu-react";
import { useContext, useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import NextMovesRow, { Transitions } from "./NextMovesRow.js";
import { SelectedSitesContext } from "./common/Contexts.js";
import StackedBarChart from "./common/StackedBarChart.js";
import { newName, theoryRequest, toPlay } from "./utils/chessTools.js";

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

const GET_SIMILAR = gql`
    query getSimilar($fen: String!) {
        getSimilarOpenings(fen: $fen) {
            fen
            simScore
            name
        }
    }
`;

const toJson = ({ getOpeningAdditional }, sites) => {
    const json = {};
    let { alsoKnownAs, wins } = getOpeningAdditional;

    for (let [i, site] of sites.entries()) {
        json[site] = {};
        json[site].aka = alsoKnownAs[i];
        json[site].wins = wins[i];
    }

    return json;
};

const wins2pctgs = ({ w, b, d }) => {
    let games = w + b + d;
    const pctg = (n) => Math.round((n / games) * 100);

    if (games) {
        return {
            w: pctg(w),
            b: pctg(b),
            d: pctg(d),
        };
    } else return { w: 0, b: 0, d: 0 };
};

const OpeningAdditionalWithBarChartGrid = ({ fen }) => {
    const { selectedSites: sites } = useContext(SelectedSitesContext);

    const { error, loading, data } = useQuery(GET_OPENING_ADDITIONAL, {
        variables: { fen, sites },
        skip: fen === "start",
    });
    if (error) return <span color="red">{error.toString()}</span>;
    if (loading) return <span color="yellow">Loading...</span>;

    if (data) {
        const json = toJson(data, sites);
        return (
            <div style={{ marginTop: "1em" }}>
                {Object.entries(json).map(([site, data]) => {
                    const { aka, wins } = data;
                    const games = wins.w + wins.d + wins.b;
                    return (
                        <div
                            id="opening-additional"
                            key={site}
                            style={{ marginBottom: "1em" }}
                        >
                            <div className="site left">
                                <span
                                    className="font-cinzel"
                                    style={{ fontWeight: "bold" }}
                                >
                                    {site}
                                </span>
                            </div>
                            <div className="left">
                                <span>
                                    {aka && aka.length ? aka : "(no name)"},{" "}
                                    {games} games
                                </span>
                            </div>
                            <div>
                                {games ? (
                                    <StackedBarChart
                                        {...{ pctgs: wins2pctgs(wins) }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
};

const SimilarOpenings = ({ fen, setFen }) => {
    const { error, data, loading } = useQuery(GET_SIMILAR, {
        variables: { fen },
    });

    if (loading) {
        return <span>Loading...</span>;
    }
    if (error) {
        return <span> ERROR: {error.toString()}</span>;
    }
    if (data) {
        const sims = data.getSimilarOpenings.map((sim) => {
            return (
                <div
                    key={sim.fen}
                    style={{
                        display: "grid",
                        justifyItems: "flex-start",
                        paddingLeft: "2em",
                        paddingTop: "0.7em",
                    }}
                >
                    <span
                        style={{ paddingBottom: "3px" }}
                        className="fakeLink"
                        onClick={() => setFen(sim.fen)}
                    >
                        {newName(sim.name)}
                    </span>
                    <Chessboard position={sim.fen} squareSize={20} />
                </div>
            );
        });

        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                {sims}
            </div>
        );
    }
};
const Theory = ({ currentMoves }) => {
    const [html, setHtml] = useState(null);

    useEffect(() => {
        theoryRequest(currentMoves, setHtml);
    }, [currentMoves]);

    return (
        <div
            style={{ textAlign: "left", marginLeft: "1em" }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

const OpeningTabs = ({
    fen,
    setFen,
    nextMoves,
    currentMoves,
    handleMovePlayed,
    sites,
    eco,
    name,
    from,
}) => {
    const tabStyle = {
        border: "1px solid #FFFFFF ",
        borderRadius: "10px 10px 0 0",
    };
    const { move, color } = toPlay(fen);

    const searchable = move > 5 || (move === "5" && color === "b");
    const showExternal = sites.selectedSites.length > 0;
    const showTransitions = from && from.length > 1;

    return (
        <Tabs
            style={{ minWidth: "-webkit-fill-available", marginRight: "2em" }}
        >
            <TabList className="left" style={{ marginBottom: "0px" }}>
                {nextMoves && <Tab style={tabStyle}>Next Moves</Tab>}
                <Tab style={tabStyle}>Theory</Tab>
                {showExternal && <Tab style={tabStyle}>External Info</Tab>}
                {searchable && <Tab style={tabStyle}>Similar Openings</Tab>}
                {showTransitions && <Tab style={tabStyle}>Transitions</Tab>}
            </TabList>
            <div style={{ border: "thick solid white" }}>
                {nextMoves && <TabPanel>
                    <NextMovesRow
                        {...{ nextMoves, currentMoves, handleMovePlayed }}
                    />
                </TabPanel>}
                <TabPanel>
                    <Theory {...{ currentMoves }} />
                </TabPanel>
                {showExternal && (
                    <TabPanel>
                        <div
                            className="row"
                            style={{ marginLeft: "1em", marginBottom: "1em" }}
                        >
                            <OpeningAdditionalWithBarChartGrid
                                id="OpeningAdditionalWithBarChartGrid"
                                {...{
                                    eco,
                                    fen,
                                    name,
                                    sites: sites.selectedSites,
                                }}
                            />
                        </div>
                    </TabPanel>
                )}
                {searchable && (
                    <TabPanel>
                        <SimilarOpenings {...{ fen, setFen }} />
                    </TabPanel>
                )}
                {showTransitions && (
                    <TabPanel>
                        <div className="row">
                            <Transitions
                                {...{ moves: currentMoves, from }}
                                style={{ marginLeft: "1em" }}
                            />
                        </div>
                    </TabPanel>
                )}
            </div>
        </Tabs>
    );
};

export { OpeningAdditionalWithBarChartGrid, OpeningTabs };
