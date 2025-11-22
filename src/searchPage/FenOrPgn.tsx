import { ClipboardEvent, MutableRefObject } from "react";
import { FENEX } from "../common/consts";
import "../stylesheets/textarea.css";
import { pgnMovesOnly } from "../utils/chessTools";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { BoardState, Opening } from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";

interface FenOrPgnProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  chess: MutableRefObject<ChessPGN>;
  setLastKnownOpening: (opening: Partial<Opening>) => void;
}

const FenOrPgn = ({
  boardState,
  setBoardState,
  chess,
  setLastKnownOpening,
}: FenOrPgnProps) => {
  const { fen, moves } = boardState;

  const text = `FEN:\n${fen}\n\nmoves: ${pgnMovesOnly(moves)}`;

  const handleInput = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);
    const stubFen = input.split(" ")[0];

    let moves = "",
      fen = "start";

    // FEN?
    if (FENEX.test(stubFen)) {
      try {
        fen = input;
        chess.current.load(fen);
        fen = chess.current.fen(); //scrubs e.p. falsities
      } catch (ex) {
        alert((ex as Error).toString());
      }
    } else {
      // PGN?
      try {
        chess.current.loadPgn(input);
        moves = chess.current.pgn(); // canonical pgn
        fen = chess.current.fen();
      } catch (ex) {
        alert((ex as Error).toString());
      }
    }
    setBoardState({ fen, moves });
    setLastKnownOpening({});
  };

  return (
    <textarea
      id="fenpgn"
      spellCheck="false"
      placeholder={"Paste moves or FEN here"}
      onChange={() => {}}
      onPaste={(e) => handleInput(e)}
      value={text}
    ></textarea>
  );
};

export { FenOrPgn };
