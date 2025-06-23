import { useState } from "react";
import { ECO_FLOWCHART, FROM_TO, MOST_ACTIVE, PIECE_DESTINATION } from "../Visualizations.jsx";
import ecoCodes from "../datasource/ecoCodes.js";
import { BallOfMud } from "./BallOfMud.jsx";
import { ColorAndPieces } from "./ColorAndPieces.jsx";
import { EcoFlowchart } from './EcoFlowchart.jsx';
import { FromToCircle } from "./FromToCircle.jsx";
import { MostActiveByPiece, MostActiveSquaresByEco } from "./MostActive.jsx";

function EcoCatCode({ cat, setCat, setCode }) {
    const cats = Object.keys(ecoCodes);

    return (
        <div style={{ marginLeft: "10%" }}>
            <span className=" left font-cinzel">ECO Categories</span>
            <div className="radio-grid">
                {cats.map((c) => (
                    <label key={c}>
                        {c}
                        <input
                            display="inline"
                            type="radio"
                            name="cat"
                            defaultChecked={cat === c}
                            value={c}
                            onChange={() => setCat(c)} />
                    </label>
                ))}
            </div>
            {ecoCodes[cat] && (
                <>
                    <span className=" left font-cinzel">ECO Codes</span>
                    <div>
                        <select
                            id="eco-codes"
                            size={5}
                            onChange={({ target }) => {
                                setCode(target.value);
                            } }
                        >
                            {ecoCodes[cat].map((entry) => (
                                <option value={entry[0]} key={entry[0]} title={entry[2]}>
                                    {cat}
                                    {entry[0]} {entry[1]}, {entry[2].substring(0, 30)}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>
    );
}

export const Display = ({ viz }) => {
    const [cat, setCat] = useState();
    const [code, setCode] = useState();
    const [colors, setColors] = useState([]);
    const [piece, setPiece] = useState();

    if (!viz)
        return (
            <div>
                <img
                    src="resources/ekthpeeramenths.jpg"
                    alt="frankenstein movie still"
                />
            </div>
        );
    if (viz === MOST_ACTIVE)
        return (
            <div className="double-column left">
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
    if (viz === FROM_TO)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <FromToCircle {...{ cat, code }} />
            </div>
        );
    if (viz === PIECE_DESTINATION)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                {cat && code && (
                    <ColorAndPieces
                        {...{ colors, piece, setColors, setPiece }}
                    />
                )}
                <MostActiveByPiece {...{ cat, code, colors, piece}} />
            </div>
        );
    if (viz === ECO_FLOWCHART) 
        return (
            <EcoFlowchart></EcoFlowchart>
        )
    return <div className="double-column left" />;
};
