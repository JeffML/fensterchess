import { lazy, MutableRefObject, Suspense, useState, useMemo } from "react";
import { ActionButton } from "../common/Buttons";
import { NO_ENTRY_FOUND } from "../common/consts";
import "../stylesheets/search.css";
import { FenAndMovesInputs } from "./FenAndMovesInputs";
import {
  BoardState,
  Opening as OpeningType,
  OpeningBook,
  PositionBook,
} from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { SearchPageContext } from "./SearchPageContext";
import { extractSanMoves } from "../utils/chessTools";

// Lazy load heavy components
const Opening = lazy(() =>
  import("./Opening").then((m) => ({ default: m.Opening }))
);
const Chessboard = lazy(() =>
  import("kokopu-react").then((m) => ({ default: m.Chessboard }))
);

interface SearchPageProps {
  chess: MutableRefObject<ChessPGN>;
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  loading?: boolean;
  error?: Error | null;
  data?: OpeningType | null;
  nearestOpeningInfo?: { fen: string; movesBack: number } | null;
  openingBook?: OpeningBook;
  positionBook?: PositionBook;
}

const SearchPage = ({
  chess,
  boardState,
  setBoardState,
  loading,
  error,
  data,
  nearestOpeningInfo,
  openingBook,
  positionBook,
}: SearchPageProps) => {
  const [lastKnownOpening, setLastKnownOpening] = useState<
    Partial<OpeningType>
  >({});
  
  // Create context value with all shared state
  const contextValue = useMemo(
    () => ({ chess, boardState, setBoardState }),
    [chess, boardState, setBoardState]
  );

  const reset = () => {
    setBoardState({ fen: "start", moves: "" });
    chess.current.reset();
  };

  /*
    If we came in through a FEN input, we will get the following format when a move is put to the the chess object:
    "[SetUp \"1\"]\n[FEN \"r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5\"]\n\n5. O-O"
    The code below handles this case.
    */
  const handleMovePlayed = (move: string) => {
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
    const { moves, currentPly } = boardState;
    if (!moves || currentPly === undefined || currentPly === 0) return;

    // Navigate to previous ply
    const targetPly = currentPly - 1;
    
    // Load the game from start and navigate to target ply
    chess.current.reset();
    const sanMoves = extractSanMoves(moves);
    
    for (let i = 0; i < targetPly; i++) {
      if (i < sanMoves.length) {
        chess.current.move(sanMoves[i]);
      }
    }

    const fen = chess.current.fen();
    setBoardState({ fen, moves, currentPly: targetPly });
  };

  const forward = () => {
    const { moves, currentPly } = boardState;
    if (!moves || currentPly === undefined) return;

    const sanMoves = extractSanMoves(moves);
    if (currentPly >= sanMoves.length) return; // Already at end

    // Navigate to next ply
    const targetPly = currentPly + 1;
    
    // Load the game from start and navigate to target ply
    chess.current.reset();
    
    for (let i = 0; i < targetPly; i++) {
      if (i < sanMoves.length) {
        chess.current.move(sanMoves[i]);
      }
    }

    const fen = chess.current.fen();
    setBoardState({ fen, moves, currentPly: targetPly });
  };

  const { fen } = boardState;

  return (
    <SearchPageContext.Provider value={contextValue}>
      <div className="row text-white">
      <div className="column" style={{ alignItems: "center" }}>
        <Suspense fallback={<div>Loading chessboard...</div>}>
          <Chessboard
            interactionMode="playMoves"
            position={fen}
            onMovePlayed={(move: string) => handleMovePlayed(move)}
          />
        </Suspense>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginLeft: "-20px",
          }}
        >
          <ActionButton {...{ onClick: () => back(), text: "<<" }} />
          <ActionButton {...{ onClick: () => reset(), text: "Reset" }} />
          <ActionButton
            {...{
              onClick: () => forward(),
              text: ">>",
              disabled: boardState.currentPly === undefined || 
                        !boardState.moves ||
                        boardState.currentPly >= extractSanMoves(boardState.moves).length,
            }}
          />
        </div>

        <div className="row">
          <div className="column">
            <div className="row">
              <FenAndMovesInputs
                {...{
                  boardState,
                  setBoardState,
                  chess,
                  setLastKnownOpening,
                  openingBook,
                  positionBook,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="double-column left">
        <div className="row" style={{ marginTop: "0px" }}>
          {loading && <span className="text-success">Searching...</span>}

          {error &&
            (error.message.startsWith("not_found") ? (
              NO_ENTRY_FOUND
            ) : (
              <span className="text-error">{error.toString()}</span>
            ))}

          {data && (
            <Suspense fallback={<div>Loading opening data...</div>}>
              <Opening
                {...{
                  handleMovePlayed,
                  data,
                  lastKnownOpening,
                  setLastKnownOpening,
                  nearestOpeningInfo,
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
    </SearchPageContext.Provider>
  );
};

export default SearchPage;
