// source: https://codesandbox.io/p/sandbox/sleepy-forest-pylzlz?file=%2Fpublic%2Findex.html

import "./flowchart.css";

import data from "./flowchartData.json";

import React, { useState } from "react";

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
                    {item.child?.map((item, idx) => (
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
                </div>
            )}
        </div>
    );
};

const root = {
    child: data,
};

export default () => {
    return <Node item={root} expanded />;
};
