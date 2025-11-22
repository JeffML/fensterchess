import { useState } from "react";
import { ActionButton } from "../common/Buttons";
import { NO_ENTRY_FOUND } from "../common/consts";
import "../stylesheets/search.css";
import { FenOrPgn } from "./FenOrPgn";

import { lazy, Suspense } from "react";

// Lazy load heavy components
const Opening = lazy(() =>
  import("./Opening").then((m) => ({ default: m.Opening }))
);
const Chessboard = lazy(() =>
  import("kokopu-react").then((m) => ({ default: m.Chessboard }))
);

const SearchPage = ({
  chess,
  boardState,
  setBoardState,
  loading,
  error,
  data,
}) => {
  const [lastKnownOpening, setLastKnownOpening] = useState({});

  const reset = () => {
    setBoardState({ fen: "start", moves: "" });
    chess.current.reset();
  };

  /*
    If we came in through a FEN input, we will get the following format when a move is put to the the chess object:
    "[SetUp \"1\"]\n[FEN \"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5\"]\n\n5. O-O"
    The code below handles this case.
    */
  const handleMovePlayed = (move) => {
    chess.current.move(move);
    const fen = chess.current.fen();
    let moves = chess.current.pgn();
    const movesPosition = moves.lastIndexOf("]"); // end of SetUp FEN
    if (movesPosition > -1) {
      moves = moves.substring(movesPosition + 3, moves.length); // +3 for the newlines between SetUp FEN and move list
    }
    setBoardState({ fen, moves });
  };

  const back = () => {
    chess.current.undo();
    const fen = chess.current.fen();
    const moves = chess.current.pgn();
    setBoardState({ fen, moves });
  };

  const { fen } = boardState;

  return (
    <div className="row" style={{ color: "white" }}>
      <div className="column" style={{ alignItems: "center" }}>
        <Suspense fallback={<div>Loading chessboard...</div>}>
          <Chessboard
            interactionMode="playMoves"
            position={fen}
            onMovePlayed={(move) => handleMovePlayed(move)}
          />
        </Suspense>
        <div className="row centered">
          <ActionButton {...{ onClick: () => back(), text: "<< Back" }} />
          <ActionButton {...{ onClick: () => reset(), text: "Reset" }} />
        </div>

        <div className="row">
          <div className="column">
            <div className="row" style={{ marginBottom: "10px" }}>
              Drag pieces above, or paste a move sequence or FEN below:
            </div>
            <div className="row">
              <FenOrPgn
                {...{
                  boardState,
                  setBoardState,
                  chess,
                  setLastKnownOpening,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="double-column left">
        <div className="row" style={{ marginTop: "0px" }}>
          {loading && <span style={{ color: "lightgreen" }}>Searching...</span>}

          {error &&
            (error.message.startsWith("not_found") ? (
              NO_ENTRY_FOUND
            ) : (
              <span style={{ color: "red" }}>{error.toString()}</span>
            ))}

          {data && (
            <Suspense fallback={<div>Loading opening data...</div>}>
              <Opening
                {...{
                  boardState,
                  setBoardState,
                  handleMovePlayed,
                  data,
                  lastKnownOpening,
                  setLastKnownOpening,
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
