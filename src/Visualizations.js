import { useState } from "react";
import { Display } from "./vizzes/Display.js";

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

const visualizations = {
    "from-to squares": {},
    "most active squares": {},
    // "ball of mud": {},               TODO (or not)
};

const Visualization = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

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
            <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
                {Object.keys(visualizations).map((k) => (
                    <div key={k} style={{ display: "flex", marginLeft: "2em" }}>
                        <label>
                            <input
                                type="radio"
                                name="viz"
                                value={k}
                                onClick={handler}
                                style={{ width: "1em" }}
                            ></input>
                            {k}
                        </label>
                    </div>
                ))}
            </div>
            <Display {...{ viz }} />{" "}
        </div>
    );
};

export default Visualization;
