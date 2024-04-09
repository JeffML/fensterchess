import HeatMap from "jsheatmap";

const square = {
    width: "2em",
    height: "2em",
    textShadow:"1px 1px #000000",
    lineHeight: "2rem",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridGap: "1px",
};

const ordinals = [1, 2, 3, 4, 5, 6, 7, 8];
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const rgbColor = (rgb) =>
    `rgb(${rgb.red * 100}%, ${rgb.green * 100}%, ${rgb.blue * 100}%)`;

const Square = ({rgb, value}) => (
    <div style={{ ...square, backgroundColor: rgbColor(rgb) }}>{value}</div>
);

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

    const ranks = data.rows.map(({ cells }) => {
        return cells.colors.map((rgb,i) => <Square {...{rgb, value:cells.values[i]}} />);
    });

    return <div style={gridStyle}>{ranks}</div>;
};

export { HeatMap2D };
