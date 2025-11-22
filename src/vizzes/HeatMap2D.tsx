import HeatMap from "jsheatmap";
import { RANKS as ordinals, FILES as files } from "../common/consts";
import { Fragment } from "react";

interface SquareProps {
  value: number;
}

interface HeatMap2DProps {
  dests: Record<string, number>;
}

const Square = ({ value }: SquareProps) => {
  const bgColor = `hsl(196deg 36% ${value > 0 ? 95 - value * 5 : 95}%)`;

  return (
    <div className="square" style={{ backgroundColor: bgColor }}>
      {value}
    </div>
  );
};

const destsToRows = (dests: Record<string, number>): [string, number[]][] => {
  const ranks: [string, number[]][] = [];

  ordinals.forEach((n, i) => {
    ranks[n - 1] = [files[i], files.map((f) => dests[`${f}${n}`] ?? 0)];
  });

  return ranks;
};

const HeatMap2D = ({ dests }: HeatMap2DProps) => {
  const heatmap = new HeatMap(ordinals, destsToRows(dests));
  const data = heatmap.getData() as any;

  const ranks = data.rows.reverse().map((row: any, j: number) => {
    return (
      <Fragment key={j}>
        {row.cells.values.map((_: any, i: number) => (
          <Square key={i} {...{ value: row.cells.values[i] }} />
        ))}
      </Fragment>
    );
  });

  return <div className="hmgrid">{ranks}</div>;
};

export { HeatMap2D };
