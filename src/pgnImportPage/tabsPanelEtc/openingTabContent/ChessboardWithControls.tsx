import { Chessboard } from "kokopu-react";
import { MutableRefObject } from "react";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { ActionButton } from "../../../common/Buttons";
import { pliesAryToMovesString } from "../../../utils/openings";

interface ChessboardWithControlsProps {
  chess: MutableRefObject<ChessPGN>;
  plies: MutableRefObject<string[]>;
  plyIndex: number;
  setPlyIndex: (index: number) => void;
}

export const ChessboardWithControls = ({
  chess,
  plies,
  plyIndex,
  setPlyIndex,
}: ChessboardWithControlsProps) => {
  const doRest = () => {
    const currMoves = pliesAryToMovesString(plies.current.slice(0, plyIndex));
    chess.current.loadPgn(currMoves);
  };

  const back = () => {
    setPlyIndex(Math.max(--plyIndex, 0));
    doRest();
  };

  const forward = () => {
    setPlyIndex(Math.min(++plyIndex, plies.current.length));
    doRest();
  };

  const fen = chess.current.fen();

  return (
    <div>
      <Chessboard
        position={fen}
        squareSize={30}
        animated={false}
        coordinateVisible={false}
      />
      <div style={{ marginLeft: "-10%", marginTop: "-3%" }}>
        <ActionButton
          onClick={back}
          text="&lArr;"
          style={{ fontSize: "14pt" }}
        ></ActionButton>
        <ActionButton
          onClick={forward}
          text="&rArr;"
          style={{ fontSize: "14pt" }}
        ></ActionButton>
      </div>
    </div>
  );
};
