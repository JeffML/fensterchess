import { useState, lazy, Suspense} from "react";
import './stylesheets/vizz.css';
// import { Display } from "./vizzes/Display.jsx";

const Display = lazy(() => 
    import("./vizzes/Display.jsx").then(module => ({ default: module.Display }))
);


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

// Single component instead of Graphs + Heatmaps
const VisualizationGroup = ({ items, handler, id }) => (
    <div id={id} className="grid-column">
        {items.map((item) => (
            <div key={item.name} className="grid-child">
                <label>
                    <input
                        type="radio"
                        name="viz"
                        value={item.name}
                        onClick={handler}
                        style={{ width: "1em" }}
                    />
                    {item.name}
                </label>
            </div>
        ))}
    </div>
);

const Visualizations = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => setViz(target.value);

    const graphs = visualizations.filter(o => o.type === "graph");
    const heatmaps = visualizations.filter(o => o.type === "heatmap");

    return (
        <div className="white grid-style">
            <div style={{ textAlign: "left", marginLeft: "1em" }}>
                <h2 className="font-cinzel">Experimental Visualizations</h2>
                
                <div style={{ gridColumn: "1" }}>
                    <h3 className="left">Graphs & Lists</h3>
                    <VisualizationGroup items={graphs} handler={handler} id="graphs" />
                </div>
                
                <div style={{ gridColumn: "1" }}>
                    <h3 className="left">Heatmaps</h3>
                    <VisualizationGroup items={heatmaps} handler={handler} id="heatmaps" />
                </div>
            </div>
            
            <Suspense fallback={<div>Loading visualization...</div>}>
                <Display viz={viz} />
            </Suspense>
        </div>
    );
};

export { ECO_FLOWCHART, FROM_TO, MOST_ACTIVE, PIECE_DESTINATION };
export default Visualizations;

