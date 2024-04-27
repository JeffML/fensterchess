import { Fragment, useState } from "react";
import { MostActiveSquaresByEco } from "./vizzes/MostActive.js";
import { FromToCircle } from "./vizzes/FromToCircle.js";
import {BallOfMud}  from "./vizzes/BallOfMud.js"
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
    "from-to squares": {},
    "most active squares": {},
    // "ball of mud": {},               TODO (or not)
};

// FIXME: HARDWIRED
const fen = "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2";
const type = "pathBySquare";

const EcoCatCode = ({ cat, setCat, setCode }) => {
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
                    <label key={c}>
                        {c}
                        <input
                            display="inline"
                            type="radio"
                            name="cat"
                            defaultChecked={cat === c}
                            value={c}
                            onChange={() => setCat(c)}
                        />
                    </label>
                ))}
            </div>
            {ecoCodes[cat] && (
                <>
                    <span className="left font-cinzel">ECO Codes</span>
                    <div>
                        <select
                            size={5}
                            onChange={({ target }) => {
                                setCode(target.value);
                            }}
                        >
                            <option value={"all"} key="x">
                                All
                            </option>
                            {ecoCodes[cat].map((entry) => (
                                <option value={entry[0]} key={entry[0]}>
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
    if (!viz)
        return (
            <div className="double-column left" style={{marginTop:"1em"}}>
                <img src="resources/ekthpeeramenths.jpg" />
            </div>
        );
    if (viz === "most active squares")
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <MostActiveSquaresByEco {...{ cat, code }} />
            </div>
        );
    if (viz === "ball of mud")
        return <BallOfMud {...{ fen, type }} />;
    if (viz === "from-to squares")
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <FromToCircle {...{ cat, code }} />
            </div>
        );
    return <div className="double-column left" />;
};

const Visualization = () => {
    const [viz, setViz] = useState("");
    const handler = ({ target }) => {
        setViz(target.value);
    };

    return (
        <>
            <div className="row white left">
                <div style={gridStyle} className="column left">
                    <span
                        style={{
                            gridColumn: "1 / span 2",
                            textAlign: "left",
                            marginLeft: "1em",
                            fontSize: "larger"
                        }}
                        className="font-cinzel"
                    >
                        Experimental Visualizations
                    </span>
                    <div
                        style={{ display: "grid", gridTemplateColumns: "1fr" }}
                    >
                        {Object.keys(visualizations).map((k) => (
                            <div key={k} style={{display:"flex", marginLeft:"2em"}}>
                                <label>
                                    <input
                                        type="radio"
                                        name="viz"
                                        value={k}
                                        onClick={handler}
                                        style={{ width: "1em"}}
                                    ></input>
                                    {k}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <Display {...{ viz }}/>
            </div>
        </>
    );
};

export default Visualization;
