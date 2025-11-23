import { useContext, useEffect } from "react";
import { SelectedSitesContext } from "../contexts/SelectedSitesContext";
import { OpeningTabs } from "./OpeningTabs";
import { BoardState, Opening as OpeningType } from "../types";

interface OpeningProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  handleMovePlayed: (move: string) => void;
  data: OpeningType | null;
  lastKnownOpening: Partial<OpeningType>;
  setLastKnownOpening: (opening: Partial<OpeningType>) => void;
}

const Opening = ({
  boardState,
  setBoardState,
  handleMovePlayed,
  data,
  lastKnownOpening,
  setLastKnownOpening,
}: OpeningProps) => {
  const sites = useContext(SelectedSitesContext);

  useEffect(() => {
    if (data) {
      setLastKnownOpening(data);
    }
  }, [data, setLastKnownOpening]);

  if (data) {
    let {
      eco,
      name,
      moves: currentMoves,
      next: variations,
      from,
      src,
      score,
    } = data;

    return (
      <div className="double-column left">
        <OpeningName {...{ eco, src, name, score }} />

        <OpeningTabs
          {...{
            boardState,
            setBoardState,
            variations,
            currentMoves,
            handleMovePlayed,
            sites,
            eco,
            name,
            from,
            lastKnownOpening,
          }}
        />
      </div>
    );
  } else {
    const { eco, name, src, score } = lastKnownOpening;
    return (
      <div className="double-column left">
        <OpeningName {...{ eco, name, src, score }} />
        <OpeningTabs
          {...{
            boardState,
            setBoardState,
            variations: undefined,
            currentMoves: undefined,
            handleMovePlayed,
            sites,
            eco,
            name,
            from: undefined,
            lastKnownOpening,
          }}
        />
      </div>
    );
  }
};

export { Opening };

const Eval = ({ score }: { score?: number | null }) => (
  <span
    className="white"
    style={{
      marginLeft: "1rem",
      fontSize: "smaller",
    }}
  >
    eval: {score}
  </span>
);

interface OpeningNameProps {
  eco?: string;
  src?: string;
  name?: string;
  score?: number | null;
}

const OpeningName = ({ eco, src, name, score }: OpeningNameProps) => {
  return (
    <span
      className="font-cinzel"
      style={{
        fontSize: "larger",
      }}
    >
      Opening:&nbsp;&nbsp;
      <span className="opening-name">
        {eco}&nbsp;
        {src === "interpolated" ? (
          <i>
            {name} <Eval {...{ score }}></Eval>
          </i>
        ) : (
          <span>
            {name || "Unknown"}
            {name && <Eval {...{ score }}></Eval>}
          </span>
        )}
      </span>
    </span>
  );
};
