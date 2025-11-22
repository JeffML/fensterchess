import { sortEnum } from "../../common/consts";
import { uniqWith } from "../../utils/uniqWith";
import { Opening } from "../../types";

interface Variation extends Opening {
  theMove?: string;
  nextPly?: string;
}

interface NextOpeningsGridProps {
  handleMovePlayed: (move: string) => void;
  legalMoves: Variation[];
  sortBy: number;
}

/**
 * Shows next opening variations from current positions
 * Note that with loose matching (position only), the current position may come from multiple
 * move sequences, leading to duplicate "to" variations appearing.
 */
export const NextOpeningsGrid = ({
  handleMovePlayed,
  legalMoves: dupeLegals,
  sortBy,
}: NextOpeningsGridProps) => {
  const legalMoves = uniqWith(dupeLegals, (a, b) => a.moves === b.moves);
  const toSort = [...legalMoves];

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

  const ListItem = (
    { name, score, eco, src, theMove, nextPly }: Variation,
    index: number
  ) => {
    const backgroundColor = index % 2 ? "darkslategrey" : "slategrey";
    return (
      <div
        key={nextPly + `_${index}`}
        id="listItem"
        style={{
          backgroundColor,
        }}
      >
        <div style={{ textAlign: "left", paddingLeft: "1em" }}>{theMove}</div>
        <div style={{ paddingLeft: "1em" }}>{eco}</div>
        <div className="fakeLink">
          <span
            style={{ textAlign: "left" }}
            onClick={() => handleMovePlayed(nextPly!)}
          >
            {src === "interpolated" ? <i>{name}</i> : name}
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
