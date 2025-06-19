import { Chessboard } from "kokopu-react";
import { useState } from "react";
import { ECO_CATS } from "../common/consts.js";
import data from "../datasource/ecoCodes.js";
import "./EcoFlowchart.css";

const EcoCats = ({ category }) => {
    const [cat, desc] = category;
    const [active, setActive] = useState("");
    const [contentStyle, setContentStyle] = useState("none");

    const handler = (e) => {
        setActive(active === "active" ? "" : "active");
        setContentStyle(contentStyle === "block" ? "none" : "block");
    };

    return (
        <>
            <button
                type="button"
                className={`collapsible font-cinzel " + ${active}`}
                style={{ fontSize: "large" }}
                onClick={handler}
            >
                {cat}&mdash;{desc}
            </button>
            <div
                className="content"
                style={{
                    display: `${contentStyle}`,
                    fontFamily: "Serif",
                    fontSize: "larger",
                }}
            >
                {data[cat].map(([code, desc, moves, fen], i) => (
                    <div className="row" key={fen}>
                        <span
                            style={{ borderBottom: "solid 1px", margin: "1em" }}
                            key={fen}
                            className="column"
                        >
                            <span
                                style={{
                                    color: "lightgray",
                                    textShadow: "1px 1px 4px black",
                                }}
                            >
                                {cat}
                                {code}:{"   "}
                            </span>
                            {desc},{"  "}
                            {moves}
                        </span>
                        <span className="column right">
                            <Chessboard
                                position={fen ?? "start"}
                                squareSize={20}
                            />
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
};

const EcoFlowchart = () => (
    <div style={{ marginRight: "3em" }}>
        {ECO_CATS.map((category) => (
            <EcoCats {...{ category }} key={category[1]} />
        ))}
    </div>
);

export { EcoFlowchart };
