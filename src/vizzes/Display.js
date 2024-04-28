import { useState } from "react";
import { MostActiveSquaresByEco } from "./MostActive.js";
import { FromToCircle } from "./FromToCircle.js";
import { BallOfMud } from "./BallOfMud.js";
import ecoCodes from "../common/ecoCodes.js";

const EcoCatCode = ({ cat, setCat, setCode }) => {
    const cats = Object.keys(ecoCodes);
    const radioGridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(5, 4rem)",
        padding: "3px",
        marginLeft: "2em",
    };

    return (
        <div style={{ marginLeft: "10%" }}>
            <span className=" left font-cinzel">ECO Categories</span>
            <div style={{ ...radioGridStyle }}>
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
                    <span className=" left font-cinzel">ECO Codes</span>
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

export const Display = ({ viz }) => {
    const [cat, setCat] = useState();
    const [code, setCode] = useState();
    if (!viz)
        return (
            <div>
                <img src="resources/ekthpeeramenths.jpg" />
            </div>
        );
    if (viz === "most active squares")
        return (
            <div>
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <MostActiveSquaresByEco {...{ cat, code }} />
            </div>
        );
    if (viz === "ball of mud") {
        // FIXME: HARDWIRED
        const fen =
            "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2";
        const type = "pathBySquare";

        return <BallOfMud {...{ fen, type }} />;
    }
    if (viz === "from-to squares")
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <FromToCircle {...{ cat, code }} />
            </div>
        );
    return <div className="double-column left" />;
};
