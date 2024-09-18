import { useState } from "react";
import { Display } from "./vizzes/Display.js";
import eslintConfigReactApp from "eslint-config-react-app";

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

const visualizations = [
    { "from-to squares": { type: "graph" } },
    // "flowchart": {type: "graph"},
    { "most active squares": { type: "heatmap" } },
    // "ball of mud": {type: "graph"},               TODO (or not)
];

const vizTitle = (o) => Object.keys(o)[0]

const Graphs = ({ graphs }) => {

    return <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
        {graphs.map(g => (
            <div key={vizTitle(g)} style={{ display: "flex", marginLeft: "2em" }}>
                <label>
                    <input
                        type="radio"
                        name="viz"
                        value={vizTitle(g)}
                        onClick={handler}
                        style={{ width: "1em" }}
                    ></input>
                    {vizTitle(g)}
                </label>
            </div>
        ))}
    </div>
}

const HeatMaps = ({heatmaps}) => {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
        {heatmaps.map(g => (
            <div key={vizTitle(g)} style={{ display: "flex", marginLeft: "2em" }}>
                <label>
                    <input
                        type="radio"
                        name="viz"
                        value={vizTitle(g)}
                        onClick={handler}
                        style={{ width: "1em" }}
                    ></input>
                    {vizTitle(g)}
                </label>
            </div>
        ))}
    </div>
}

const Visualization = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

    const graphs = visualizations.filter(o => o.type === "graph")
    const heatmaps = visualizations.filter(o => o.type === "heatmap")

    return (
        <div style={gridStyle} className="left">
            <h2
                style={{
                    gridColumn: "1 / span 2",
                    textAlign: "left",
                    marginLeft: "1em",
                    // fontSize: "larger",
                }}
                className="font-cinzel"
            >
                Experimental Visualizations
            </h2>
            <h3>Graphs</h3>
            <Graphs {...{ graphs }}></Graphs>
            <h3>Heatmaps</h3>
            <Heatmaps {...{ heatmaps }}></Heatmaps>
            <Display {...{ viz }} />{" "}
        </div>
    );
};

export default Visualization;
