import { useState } from "react";
import { Display } from "./vizzes/Display.js";

const visualizations = [
    { name: "from-to squares", type: "graph" },
    // "flowchart": {type: "graph"},
    { name: "most active squares", type: "heatmap" },
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
                    <h3 className="left">Graphs</h3>
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

export default Visualizations;
