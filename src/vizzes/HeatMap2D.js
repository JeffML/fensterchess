import HeatMap from "jsheatmap";
import { RANKS as ordinals, FILES as files } from "../common/consts.js";

const square = {
    width: "2em",
    height: "2em",
    textShadow: "1px 1px #000000",
    lineHeight: "2rem",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridGap: "1px",
    marginBottom: "3em"
};

// eslint-disable-next-line no-unused-vars
const rgbColor = (rgb) =>
    `rgb(${rgb.red * 100}%, ${rgb.green * 100}%, ${rgb.blue * 100}%)`;

const Square = ({ rgb, value }) => {
    const bgColor = `hsl(196deg 36% ${value > 0 ? 95 - value * 5 : 95}%)`;

    return (
        <div style={{ ...square, backgroundColor: bgColor }}>{value}</div>
    );

    //    <div style={{ ...square, backgroundColor: rgbColor(rgb) }}>{value}</div>
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

    const ranks = data.rows.reverse().map(({ cells }) => {
        return cells.colors.map((rgb, i) => (
            <Square id={i} {...{ rgb, value: cells.values[i] }} />
        ));
    });

    return <div style={gridStyle}>{ranks}</div>;
};

export { HeatMap2D };
