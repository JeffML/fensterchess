import { ClipboardEvent, MutableRefObject } from "react";
import { FENEX, POSITION_ONLY_FEN_REGEX } from "../common/consts";
import "../stylesheets/textarea.css";
import { pgnMovesOnly } from "../utils/chessTools";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { BoardState, Opening, OpeningBook, PositionBook } from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";

interface FenAndMovesInputsProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  chess: MutableRefObject<ChessPGN>;
  setLastKnownOpening: (opening: Partial<Opening>) => void;
  openingBook: OpeningBook | undefined;
  positionBook: PositionBook | undefined;
}

const FenAndMovesInputs = ({
  boardState,
  setBoardState,
  chess,
  setLastKnownOpening,
  openingBook,
  positionBook,
}: FenAndMovesInputsProps) => {
  const { fen, moves } = boardState;

  const handleFenPaste = (
    e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);

    const isPositionOnly = POSITION_ONLY_FEN_REGEX.test(input);
    const stubFen = input.split(" ")[0];

    // Validate FEN position part
    if (!FENEX.test(stubFen)) {
      alert("Invalid FEN format");
      return;
    }

    // If position-only FEN, try to look it up in opening book
    if (isPositionOnly) {
      if (!openingBook || !positionBook) {
        alert("Opening database not loaded yet. Please wait and try again.");
        return;
      }

      // Look up the position in the position book
      const posEntry = positionBook[stubFen];
      if (!posEntry || posEntry.length === 0) {
        alert(
          "Position not found in opening database. Please enter a full FEN or a position from the opening book."
        );
        return;
      }

      // Get the first matching opening FEN
      const openingFen = posEntry[0];
      const opening = openingBook[openingFen];

      if (!opening) {
        alert("Position not found in opening database.");
        return;
      }

      // Success! Load the opening's moves and update state
      try {
        chess.current.loadPgn(opening.moves);
        const resultingFen = chess.current.fen();
        const validatedMoves = chess.current.pgn();
        setBoardState({ fen: resultingFen, moves: validatedMoves });
        setLastKnownOpening(opening);
      } catch (ex) {
        alert(`Error loading opening: ${(ex as Error).message}`);
      }
      return;
    }

    // Full FEN provided - validate and load it
    try {
      chess.current.load(input);
      const validatedFen = chess.current.fen();
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
