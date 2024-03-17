import { Fragment, useState} from "react";
import Constellation, {HeatMap3D, DestinationFrequenciesByEco} from "./Constellation.js";

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    maxHeight: "250px",
    minWidth: "fit-content",
    marginTop: "1em",
    overflowX: "visible",
    columnGap: "1px",
};

const visualizations = {
    "heatmap 3D": {},
    "ball of mud": {},
    "destination frequencies": {},
};



// FIXME: HARDWIRED
const fen = "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2";
const type = "pathBySquare";

const Display = ({ viz }) => {
    if (viz === "heatmap 3D") return <HeatMap3D></HeatMap3D>;
    if (viz === "ball of mud") return <Constellation {...{ fen, type }} />;
    if (viz === "destination frequencies") return <DestinationFrequenciesByEco />;
    return null;
};

const Visualization = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

    return (
        <div className="row white">
            <div style={gridStyle} className="column">
                <span
                    style={{
                        gridColumn: "1 / span 2",
                        textAlign: "left",
                        marginLeft: "1em",
                    }}
                >
                    Visualizations
                </span>
                {Object.keys(visualizations).map((k) => (
                    <Fragment key={k}>
                        <input
                            type="radio"
                            name="viz"
                            value={k}
                            onClick={handler}
                        ></input>
                        <span className="left">{k}</span>
                    </Fragment>
                ))}
            </div>
            <Display {...{ viz }} />
        </div>
    );
};

export default Visualization;
