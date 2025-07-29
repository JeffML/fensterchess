import { useState } from "react";
import './stylesheets/vizz.css';
import { Display } from "./vizzes/Display.jsx";

const MOST_ACTIVE = "Destination Squares (for all pieces)";
const FROM_TO = "from-to squares";
const PIECE_DESTINATION = "Destination Squares (detailed)";
const ECO_FLOWCHART = "ECO Categories";

const visualizations = [
    { name: FROM_TO, type: "graph" },
    { name: ECO_FLOWCHART, type: "graph" },
    { name: MOST_ACTIVE, type: "heatmap" },
    { name: PIECE_DESTINATION, type: "heatmap" },
];

const Graphs = ({ graphs, handler }) => {
    return (
        <div id='graphs' className="grid-column">
            {graphs.map((g) => (
                <div
                    key={g.name} className="grid-child"
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
        <div id="heatmaps" className="grid-column">
            {heatmaps.map((g) => (
                <div
                    key={g.name} className="grid-child"
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

const Visualizations = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

    const graphs = visualizations.filter((o) => o.type === "graph");
    const heatmaps = visualizations.filter((o) => o.type === "heatmap");

    return (
        <div className="white grid-style">
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

export { ECO_FLOWCHART, FROM_TO, MOST_ACTIVE, PIECE_DESTINATION, Visualizations as default };

