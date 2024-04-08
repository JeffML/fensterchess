import HeatMap from "jsheatmap";

const square = {
    width: "1em",
    height: "1em",
    backgroundColor: "red",
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridGap: "10px",
};

const ordinals = [1, 2, 3, 4, 5, 6, 7, 8];
const files = ["a", "b", "c", "d", "e", "f", "g", "h"]

const Square = () => <div style={square}></div>;

const destsToRows = (dests) => {
    const ranks = [];
    
    for (let n of ordinals) {
        ranks[n-1] = [n, files.map( f => dests[`${f}${n}`]??0)]
    }

    return ranks
};

export const HeatMap2D = ({ dests, cat, code }) => {
    const heatmap = new HeatMap(ordinals, destsToRows(dests));
    const data = heatmap.getData()

    console.log(JSON.stringify(data, null, 2))

    return <div style={gridStyle}></div>;
};
