// source: https://codesandbox.io/p/sandbox/sleepy-forest-pylzlz?file=%2Fpublic%2Findex.html

import "./flowchart.css";
import data from "../common/ecoCodes.js";
import React, { useState } from "react";

const arrow = {
    maxWidth: "1em",
    fontSize: "12pt",
    display: "block",
    marginBottom: "5px",
};

const arrowNode = {
    alignContent: "center",
    maxWidth: "1em",
};

const UP = 5,
    DOWN = -5,
    UPHARD = 10,
    DOWNHARD = -10;

const Node = ({ item, expanded, onExpandChange, arrows = true }) => {
    const [expandedChild, setExpandedChild] = useState();
    const [childIdx, setChildIdx] = useState(0);

    const bumpIndex = (upOrDown) => {
        setChildIdx(Math.max(0, Math.min(99, childIdx + upOrDown)));
    };

    return (
        <div className="node">
            {item.name && (
                <div className="card">
                    <img src={item.image} />
                    <div className="name">{item.name}</div>
                    <div className="designation">{item.designation}</div>
                    {onExpandChange && item.child?.length && (
                        <button onClick={onExpandChange}>
                            {expanded ? "hide" : "show"}
                        </button>
                    )}
                </div>
            )}

            {expanded && (
                <div className="children">
                    {arrows && (
                        <div className="node" style={arrowNode}>
                            <div
                                style={arrow}
                                className="hover"
                                onClick={() => bumpIndex(DOWN)}
                            >
                                {"\u227A"}
                            </div>
                            <div
                                style={arrow}
                                className="hover"
                                onClick={() => bumpIndex(DOWNHARD)}
                            >
                                {"\u226A"}
                            </div>
                        </div>
                    )}
                    {item.child?.slice(childIdx, childIdx + 5).map((item, idx) => (
                        <Node
                            key={idx}
                            item={item}
                            onExpandChange={() => {
                                setExpandedChild(
                                    expandedChild === idx ? null : idx
                                );
                            }}
                            expanded={expandedChild === idx}
                        />
                    ))}
                    {arrows && (
                        <div className="node" style={arrowNode}>
                            <div
                                style={arrow}
                                className="hover"
                                onClick={() => bumpIndex(UP)}
                            >
                                {"\u227B"}
                            </div>
                            <div
                                style={arrow}
                                className="hover"
                                onClick={() => bumpIndex(UPHARD)}
                            >
                                {"\u226B"}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/*
converts raw data to format like:
[
    {
      "key": "c1",
      "name": "Shagufta Merchant",
      "designation": "VP-Digital Operations & HR",
      "image": "/resources/placekitten.jpg",
      "about": "This is just test2",
      "child": [...]
    }...]

    Where child is array of similar
*/
const convert = (data) => {
    const newData = [];
    let currObj = {};

    // add categories
    Object.keys(data).map((key) => {
        currObj = {
            key,
            name: key,
            designation: "",
            image: "/resources/caro-panov.png",
        };
        let children = data[key].map(([code, name]) => ({
            key: code,
            name: code,
            designation: name,
            image: "/resources/caro-panov.png",
        }));

        currObj.child = children;
        newData.push(currObj);
    });

    return newData;
};

const root = {
    child: convert(data),
};

export default () => {
    return <Node item={root} expanded arrows={false} />;
};
