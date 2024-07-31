// source: https://codesandbox.io/p/sandbox/sleepy-forest-pylzlz?file=%2Fpublic%2Findex.html

import "./flowchart.css";
import data from "../common/ecoCodes.js";
import React, { useState } from "react";

const ellipse = {
    maxWidth: "1em",
    backgroundColor: "white", writingMode: "vertical-rl" , textOrientation: "upright", fontSize:"16pt", 
}

const ellipseNode = {
    alignContent: "center",
    maxWidth: "1em"
}

const Node = ({ item, expanded, onExpandChange }) => {
    const [expandedChild, setExpandedChild] = useState();

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
                    <div className="node" style={ellipseNode}><span style={ellipse}>{"<"}</span></div>
                    {item.child?.slice(0, 5).map((item, idx) => (
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
                    <div className="node" style={ellipseNode}><span style={ellipse}>{">"}</span></div>
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
            image:  "/resources/caro-panov.png",
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
    return <Node item={root} expanded />;
};
