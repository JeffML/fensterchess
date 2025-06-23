import HeatMap from "jsheatmap";
import { RANKS as ordinals, FILES as files } from "../common/consts.js";
import { Fragment } from "react";

// eslint-disable-next-line no-unused-vars
const rgbColor = (rgb) =>
    `rgb(${rgb.red * 100}%, ${rgb.green * 100}%, ${rgb.blue * 100}%)`;

const Square = ({ rgb, value }) => {
    const bgColor = `hsl(196deg 36% ${value > 0 ? 95 - value * 5 : 95}%)`;

    return (
        <div className="square" style={{backgroundColor: bgColor }}>{value}</div>
    );

};

const destsToRows = (dests) => {
    const ranks = [];

    ordinals.forEach((n, i) => {
        ranks[n - 1] = [files[i], files.map((f) => dests[`${f}${n}`] ?? 0)];
    });

    return ranks;
};

const HeatMap2D = ({ dests }) => {
    const heatmap = new HeatMap(ordinals, destsToRows(dests));
    const data = heatmap.getData();

    const ranks = data.rows.reverse().map(({ cells }, j) => {
        return <Fragment key={j}>
         {cells.colors.map((rgb, i) => (
            <Square id={i} key={i} {...{ rgb, value: cells.values[i] }} />
        ))}
        </Fragment>;
    });

    return <div className="hmgrid">{ranks}</div>;
};

export { HeatMap2D };
