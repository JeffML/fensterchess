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

const cellStyle = {
    paddingLeft: "15px",
    paddingRight: "15px",
};

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

const OpeningAdditionalTable = ({ fen }) => {
    const sites = useContext(SelectedSitesContext).selectedSites

    if (sites.length) {
        return (
            <div className="double-column">
                <table style={{ borderCollapse: "collapse", marginTop: "2em" }}>
                    <tbody>
                        <tr>
                            <th>Site</th>
                            <th>Opening</th>
                            <th colSpan={4}>Winning %</th>
                            <th>Games</th>
                        </tr>
                        <OpeningAdditionalTableRows {...{ fen, sites }} />
                    </tbody>
                </table>
            </div>
        );
    }
};

const wins2pctgs = ({w, b, d}) => {
    let games = w + b + d
    const pctg = (n) => Math.round(n/games*100)
    
    if (games) {
        return {
            w: pctg(w),
            b: pctg(b),
            d: pctg(d)

        }
    } else return {w: 0, b: 0, d: 0}
}

const OpeningAddlRow = ({ site, name, wins }) => {
    const games = wins.w + wins.b + wins.d
    const pctgs = wins2pctgs(wins)
    return (
    <tr>
        {games && (
            <>
                <td style={cellStyle}>{site}</td>
                <td style={cellStyle}>{name}</td>
                <td style={cellStyle} colSpan={4}>
                    <StackedBarChart {...{ pctgs }} />
                </td>
            </>
        )}
        <td style={cellStyle}>{games}</td>
    </tr>
)};

const OpeningAdditionalTableRows = ({ fen, sites }) => {

    const { error, loading, data } = useQuery(GET_OPENING_ADDITIONAL, {
        variables: { fen, sites },
        skip: fen === "start",
    });
    if (error)
        return (
            <tr>
                <td color="red">{error.toString()}</td>
            </tr>
        );
    if (loading)
        return (
            <tr>
                <td color="yellow">Loading...</td>
            </tr>
        );

    if (data) {
        const json = toJson(data, sites);

        return Object.entries(json).map(([site, data]) => {
            const { aka, wins } = data;

            return (
                <OpeningAddlRow
                    key={site}
                    {...{ site, name: aka, wins }}
                />
            );
        });
    } else return null;
};

const OpeningAdditionalWithBarChart = ({ fen }) => {
    const inlineStyle = { fontFamily: "initial", marginLeft: "10px" };

    const {selectedSites:sites} = useContext(SelectedSitesContext)

    const { error, loading, data } = useQuery(GET_OPENING_ADDITIONAL, {
        variables: { fen, sites },
        skip: fen === "start",
    });
    if (error) return <span color="red">{error.toString()}</span>;
    if (loading) return <span color="yellow">Loading...</span>;

    if (data) {
        const json = toJson(data, sites);
        return (
            <>
                {Object.entries(json).map(([site, data]) => {
                    const {
                        aka,
                        wins,
                    } = data;
                    const games = wins.w + wins.d + wins.b
                    return (
                        <div
                            className="row"
                            key={site}
                            style={{ marginBottom: "2em" }}
                        >
                            <span
                                className="font-cinzel"
                                style={{ alignSelf: "start" }}
                            >
                                {site}
                                <span style={inlineStyle}>{aka}</span>
                                <span style={inlineStyle}>
                                    (games: {games})
                                </span>
                            </span>
                            {games? 
                                <StackedBarChart {...{ pctgs: wins2pctgs(wins) }} /> : null
                            }
                        </div>
                    );
                })}
            </>
        );
    }
};

export { OpeningAdditionalTable, OpeningAdditionalWithBarChart };
