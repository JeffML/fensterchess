import { sortEnum } from "../../common/consts";
import { uniqWith } from "../../utils/uniqWith";
import { handleMoves } from "./handleMoves";
import { Opening } from "../../types";

interface TranspositionsGridProps {
  transpositions: Opening[];
  sortBy: number;
}

// see comment on dupe "to" records in NextOpeningGrid.tsx
export const TranspositionsGrid = ({
  transpositions: dupeTrans,
  sortBy,
}: TranspositionsGridProps) => {
  const transpositions = uniqWith(dupeTrans, (a, b) => a.moves === b.moves);
  const toSort = [...transpositions];

  switch (sortBy) {
    case sortEnum.EVALUATION:
      toSort.sort((a, b) => Math.abs(a.score || 0) - Math.abs(b.score || 0));
      break;
    case sortEnum.NAME:
      toSort.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case sortEnum.ECO:
      toSort.sort((a, b) => a.eco.localeCompare(b.eco));
      break;
    default:
      throw Error(`unknown case ${sortBy}`);
  }

  const ListItem = ({ name, score, eco, moves }: Opening, index: number) => {
    const backgroundColor = index % 2 ? "darkslategrey" : "slategrey";
    return (
      <div
        key={moves}
        id="listItem"
        style={{
          backgroundColor,
        }}
      >
        <div className="move">{moves.replace(/(\d{1,3}\.)\s/g, "$1")}</div>
        <div style={{ paddingLeft: "1em" }}>{eco}</div>
        <div className="fakeLink">
          <span
            style={{ textAlign: "left" }}
            onClick={() => handleMoves(moves)}
          >
            {name}
          </span>
        </div>
        <div style={{ textAlign: "left" }}>{score}</div>
      </div>
    );
  };

  return (
    <div style={{ borderStyle: "solid", marginTop: "1em" }}>
      {toSort.map((s, i) => ListItem(s, i))}
    </div>
  );
};
