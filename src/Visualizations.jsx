import { useState } from "react";
import { Display } from "./vizzes/Display.jsx";

const MOST_ACTIVE = "most active squares";
const FROM_TO = "from-to squares";
const PIECE_DESTINATION = "destination squares";
const ECO_FLOWCHART = "ECO Categories";

const visualizations = [
    { name: FROM_TO, type: "graph" },
    { name: ECO_FLOWCHART, type: "graph" },
    { name: MOST_ACTIVE, type: "heatmap" },
    { name: PIECE_DESTINATION, type: "heatmap" },
    // "ball of mud": {type: "graph"},               TODO (or not)
];

const Graphs = ({ graphs, handler }) => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
            {graphs.map((g) => (
                <div
                    key={g.name}
                    style={{ display: "flex", marginLeft: "2em" }}
                >
                    <label>
                        <input
                            type="radio"
                            name="viz"
                            value={g.name}
                            onClick={handler}
                            style={{ width: "1em" }}
                        ></input>
                        {g.name}
                    </label>
                </div>
            ))}
        </div>
    );
};

const Heatmaps = ({ heatmaps, handler }) => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
            {heatmaps.map((g) => (
                <div
                    key={g.name}
                    style={{ display: "flex", marginLeft: "2em" }}
                >
                    <label>
                        <input
                            type="radio"
                            name="viz"
                            value={g.name}
                            onClick={handler}
                            style={{ width: "1em" }}
                        ></input>
                        {g.name}
                    </label>
                </div>
            ))}
        </div>
    );
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    maxHeight: "250px",
    minWidth: "fit-content",
    marginTop: "1em",
    overflowX: "visible",
    columnGap: "1px",
    color: "white",
};

const Visualizations = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

    const graphs = visualizations.filter((o) => o.type === "graph");
    const heatmaps = visualizations.filter((o) => o.type === "heatmap");

    return (
        <div className="white" style={gridStyle}>
            <div
                style={{
                    textAlign: "left",
                    marginLeft: "1em",
                }}
            >
                <h2 className="font-cinzel">Experimental Visualizations</h2>
                <div style={{ gridColumn: "1" }}>
                    <h3 className="left">Graphs & Lists</h3>
                    <Graphs {...{ graphs, handler }}></Graphs>
                </div>
                <div style={{ gridColumn: "1" }}>
                    <h3 className="left">Heatmaps</h3>
                    <Heatmaps {...{ heatmaps, handler }}></Heatmaps>
                </div>
            </div>
            <Display {...{ viz }} />
        </div>
    );
};

export { Visualizations, FROM_TO, PIECE_DESTINATION, MOST_ACTIVE, ECO_FLOWCHART };
