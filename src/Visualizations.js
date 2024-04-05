import { Fragment, useState } from "react";
import Constellation, { DestinationFrequenciesByEco } from "./Constellation.js";
import ecoCodes from "./common/ecoCodes.js";

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
    heatmaps: {},
    "ball of mud": {},
};

// FIXME: HARDWIRED
const fen = "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2";
const type = "pathBySquare";

const EcoCatCode = ({ cat, setCat }) => {
    const cats = Object.keys(ecoCodes);
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        padding: "3px",
        gridColumnGap: "2em",
        marginLeft: "2em",
    };

    return (
        <div>
            <span className="left font-cinzel">ECO Categories</span>
            <div style={{ ...gridStyle }}>
                {cats.map((c) => (
                    <label>
                        {c}
                        <input
                            display="inline"
                            type="radio"
                            name="cat"
                            defaultChecked={cat === c}
                            value={c}
                            key={c}
                            onChange={() => setCat(c)}
                        />
                    </label>
                ))}
            </div>
            {ecoCodes[cat] && (
                <>
                    <span className="left font-cinzel">ECO Codes</span>
                    <div>
                        <select size={5}>
                            {ecoCodes[cat].map((entry) => (
                                <option value={entry[0]}>
                                    {cat}
                                    {entry[0]} {entry[1]}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    );
};

const Display = ({ viz }) => {
    const [cat, setCat] = useState();
    const [code, setCode] = useState();

    if (viz === "heatmaps")
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <DestinationFrequenciesByEco />
            </div>
        );
    if (viz === "ball of mud") return <Constellation {...{ fen, type }} />;
    return <div className="double-column left" />;
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
                    className="font-cinzel"
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
