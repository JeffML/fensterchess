import { useQuery, gql } from "@apollo/client";
import StackedBarChart from "./common/StackedBarChart.js";
import { SelectedSitesContext } from "./common/Contexts.js";
import { useContext } from "react";

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
            <div style={{marginTop:"1em"}}>
                {Object.entries(json).map(([site, data]) => {
                    const { aka, wins } = data;
                    const games = wins.w + wins.d + wins.b;
                    return (
                        <div id="opening-additional">
                            <div className="site left" key={site}>
                                <span
                                    className="font-cinzel"
                                    style={{ alignSelf: "start" }}
                                >
                                    {site}
                                </span>
                            </div>
                            <div className="left">
                                <span>
                                    {aka && aka.length? aka : "no name"}, {games} games
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

export { OpeningAdditionalWithBarChartGrid };
