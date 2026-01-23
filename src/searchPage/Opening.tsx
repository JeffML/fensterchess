import { useContext, useEffect } from "react";
import { SelectedSitesContext } from "../contexts/SelectedSitesContext";
import { OpeningTabs } from "./OpeningTabs";
import { Opening as OpeningType } from "../types";

interface OpeningProps {
  handleMovePlayed: (move: string) => void;
  data: OpeningType | null;
  lastKnownOpening: Partial<OpeningType>;
  setLastKnownOpening: (opening: Partial<OpeningType>) => void;
  nearestOpeningInfo?: { fen: string; movesBack: number } | null;
}

const Opening = ({
  handleMovePlayed,
  data,
  lastKnownOpening,
  setLastKnownOpening,
  nearestOpeningInfo,
}: OpeningProps) => {
  const sites = useContext(SelectedSitesContext);
  // Context is available to child components (OpeningTabs, MasterGames, etc.)

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

        {nearestOpeningInfo && (
          <div
            style={{
              color: "yellow",
              marginBottom: "10px",
              marginTop: "5px",
              fontSize: "0.9em",
              fontStyle: "italic",
            }}
          >
            Nearest known opening found {nearestOpeningInfo.movesBack} move
            {nearestOpeningInfo.movesBack !== 1 ? "s" : ""} back
          </div>
        )}

        <OpeningTabs
          {...{
            variations,
            currentMoves,
            handleMovePlayed,
            sites,
            eco,
            name,
            from,
            lastKnownOpening,
            openingFen: data.fen,
          }}
        />
      </div>
    );
  } else {
    const { eco, name, src, score, fen: openingFen } = lastKnownOpening;
    return (
      <div className="double-column left">
        <OpeningName {...{ eco, name, src, score }} />
        <OpeningTabs
          {...{
            variations: undefined,
            currentMoves: undefined,
            handleMovePlayed,
            sites,
            eco,
            name,
            from: undefined,
            lastKnownOpening,
            openingFen,
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
