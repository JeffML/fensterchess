import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { HeatMap3D } from "./HeatMap3D.jsx";
import { HeatMap2D } from "./HeatMap2D.jsx";

const GET_DEST_FREQ = gql`
    query getDestFreq($cat: String!, $code: String, $groupLevel: Int) {
        getDestinationSquareByFrequency(cat: $cat, code: $code groupLevel: $groupLevel) {
            key
            value
        }
    }
`;

const HeatMapType = ({ type, setType }) => {
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "auto auto auto auto",
        gridColumnGap: "3em",
    };

    return (
        <div className="row" style={gridStyle} id="heatmaptype">
            <span style={{ fontWeight: "bold", color: "mediumturquoise" }}>
                Select a style:
            </span>
            <label>
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === "2D"}
                    onClick={() => setType("2D")}
                />{" "}
                2D
            </label>
            <br />
            <label>
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === "3D"}
                    onClick={() => setType("3D")}
                />
                3D
                {type === "3D" && (
                    <span style={{ color: "lightgreen", marginLeft: "2em" }}>
                        (mouse draggable)
                    </span>
                )}
            </label>
        </div>
    );
};

const HeatMaps = ({ dests, type, setType }) => {
    return (
        <div className="double-column left" style={{ marginTop: "1em" }}>
            <HeatMapType {...{ type, setType }} />
            <br />
            {type === "3D" && <HeatMap3D {...{ dests }} />}
            {type === "2D" && <HeatMap2D {...{ dests }} />}
        </div>
    );
};

const DestinationFrequenciesByEco = ({ cat, code }) => {
    if (code === "all") code = undefined;

    const { error, data, loading } = useQuery(GET_DEST_FREQ, {
        variables: { cat, code },
        skip: !cat || !code,
    });

    const [type, setType] = useState();

    if (error) console.error(error.toString());
    if (loading) return <div className="double-column left">Loading...</div>;
    if (data) {
        // summate the data for each square
        const dests = data.getDestinationSquareByFrequency.reduce((acc, d) => {
            const dest = d.key[2].substr(-2);
            acc[dest] ??= 0;
            acc[dest] += d.value;
            return acc;
        }, {});
        return <HeatMaps {...{ dests, type, setType }} />;
    }
    return null;
};

const MostActiveByPiece = ({ cat, code, colors, piece }) => {
    const [type, setType] = useState();

    if (code === "all") code = undefined;

    const { error, data, loading } = useQuery(GET_DEST_FREQ, {
        variables: { cat, code, groupLevel:4 },
        skip: !cat || !code,
    });

    if (error) console.error(error.toString());
    if (loading) return <div className="double-column left">Loading...</div>;
    if (data) {
        // reduce according to colors and piece selected
        const dests = data.getDestinationSquareByFrequency.reduce((acc, d) => {
            let dPiece = d.key[2][0]  // first letter of move
            if ("abcdefgh".includes(dPiece)) dPiece = 'P'            
            if (piece !== dPiece) return acc;

            const isWhite = d.key[3]

            const dest = d.key[2].substr(-2);
            acc[dest] ??= 0;

            if (colors.includes("White") && isWhite === "true") {
                acc[dest] += d.value;
            }

            if (colors.includes("Black") && isWhite === "false") {
                acc[dest] += d.value;
            }

            return acc;
        }, {});

        return <HeatMaps {...{ dests, type, setType }} />;
    }

    return null;
};

export {
    DestinationFrequenciesByEco as MostActiveSquaresByEco,
    MostActiveByPiece,
};
