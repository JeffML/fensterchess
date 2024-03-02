import { Fragment, useState } from "react";

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
    tree: { name: "bar" },
    heatmap: { name: "flum" },
    "ball of mud": {}
};

const Display = ({ viz }) => {
    return <div className="double-column left" id={viz}>The Viz</div>;
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
