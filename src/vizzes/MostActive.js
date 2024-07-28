import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { HeatMap3D } from "./HeatMap3D.js";
import { HeatMap2D } from "./HeatMap2D.js";

const GET_DEST_FREQ = gql`
    query getDestFreq($cat: String!, $code: String) {
        getDestinationSquareByFrequency(cat: $cat, code: $code) {
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
        skip: !cat,
    });

    const [type, setType] = useState();

    if (error) console.error(error.toString());
    if (loading) return <div className="double-column left">Loading...</div>;
    if (data) {
        // scrub the data
        const dests = data.getDestinationSquareByFrequency.reduce((acc, d) => {
            const dest = d.key[2].substr(-2);
            acc[dest] = d.value;
            return acc;
        }, {});

        return <HeatMaps {...{ dests, type, setType }} />;
    }
    return null;
};

export { DestinationFrequenciesByEco as MostActiveSquaresByEco };
