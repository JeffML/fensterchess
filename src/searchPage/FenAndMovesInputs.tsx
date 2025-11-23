import { ClipboardEvent, MutableRefObject } from "react";
import { FENEX } from "../common/consts";
import "../stylesheets/textarea.css";
import { pgnMovesOnly } from "../utils/chessTools";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { BoardState, Opening } from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";

interface FenAndMovesInputsProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  chess: MutableRefObject<ChessPGN>;
  setLastKnownOpening: (opening: Partial<Opening>) => void;
}

const FenAndMovesInputs = ({
  boardState,
  setBoardState,
  chess,
  setLastKnownOpening,
}: FenAndMovesInputsProps) => {
  const { fen, moves } = boardState;

  const handleFenPaste = (
    e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);
    const stubFen = input.split(" ")[0];

    // Validate FEN
    if (!FENEX.test(stubFen)) {
      alert("Invalid FEN format");
      return;
    }

    try {
      chess.current.load(input);
      const validatedFen = chess.current.fen(); // scrubs e.p. falsities
      setBoardState({ fen: validatedFen, moves: "" });
      setLastKnownOpening({});
    } catch (ex) {
      alert((ex as Error).toString());
    }
  };

  const handleMovesPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);

    // Validate PGN/moves
    try {
      chess.current.loadPgn(input);
      const validatedMoves = chess.current.pgn(); // canonical pgn
      const resultingFen = chess.current.fen();
      setBoardState({ fen: resultingFen, moves: validatedMoves });
      setLastKnownOpening({});
    } catch (ex) {
      alert((ex as Error).toString());
    }
  };

  const fenDisplay =
    fen === "start"
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : fen;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
      }}
    >
      <div>
        <label
          style={{ display: "block", marginBottom: "2px", fontSize: "11px" }}
        >
          Position (FEN):
        </label>
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck="false"
          onPaste={handleFenPaste}
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            width: "100%",
            minHeight: "20px",
            padding: "4px",
            border: "1px solid #ccc",
            borderRadius: "3px",
            backgroundColor: "#fff",
            color: "#000",
            overflowWrap: "break-word",
            cursor: "text",
          }}
        >
          {fenDisplay}
        </div>
      </div>

      <div>
        <label
          htmlFor="moves-input"
          style={{ display: "block", marginBottom: "2px", fontSize: "11px" }}
        >
          Move Sequence:
        </label>
        <textarea
          id="moves-input"
          spellCheck="false"
          placeholder="Paste moves or PGN here"
          onChange={() => {}}
          onPaste={handleMovesPaste}
          value={pgnMovesOnly(moves)}
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            width: "100%",
            minHeight: "55px",
            padding: "4px",
          }}
        />
      </div>
    </div>
  );
};

export { FenAndMovesInputs };
