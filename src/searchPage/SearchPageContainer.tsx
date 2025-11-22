import { ChessPGN } from "@chess-pgn/chess-pgn";
import { useContext, useRef, useState, useEffect, MutableRefObject } from "react";
import { FENEX } from "../common/consts";
import { OpeningBookContext } from "../contexts/OpeningBookContext";
import SearchPage from "./SearchPage";
import { useQuery } from "@tanstack/react-query";
import {
  findOpening,
  getFromTosForFen,
  getScoresForFens,
} from "../datasource/findOpening";
import { BoardState } from "../types";

interface LoadMovesResult {
  moves: string;
  fen: string;
}

const loadMoves = (
  moves: string,
  chess: MutableRefObject<ChessPGN>
): LoadMovesResult => {
  let fen = "";

  try {
    chess.current.loadPgn(moves);
    fen = chess.current.fen();
  } catch (e) {
    console.error(e);
    moves = "";
  } finally {
    return { moves, fen };
  }
};

function readParams(
  url: URLSearchParams,
  chess: MutableRefObject<ChessPGN>
): BoardState {
  const qmoves = url.get("moves");
  url.delete("moves");

  if (qmoves) {
    const { moves, fen } = loadMoves(qmoves, chess);
    return { moves, fen };
  } else {
    let qfen = url.get("fen");
    url.delete("fen");

    if (qfen) {
      if (!FENEX.test(qfen.split(" ")[0])) {
        qfen = "start";
      }
    } else {
      qfen = "start";
    }

    return { moves: "", fen: qfen ?? "start" };
  }
}

const SearchPageContainer = () => {
  const [boardState, setBoardState] = useState<BoardState>({
    fen: "start",
    moves: "",
  });

  const chess = useRef(new ChessPGN());

  // Read URL parameters on mount
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const { fen, moves } = readParams(url, chess);
    if (fen !== "start" || moves !== "") {
      setBoardState({ fen, moves });
    }
  }, []); // Empty dependency array - only run on mount

  const { fen } = boardState;
  const context = useContext(OpeningBookContext);
  
  if (!context) return <div>Loading...</div>;
  
  const { openingBook, positionBook } = context;

  const { data: fromTosForFen } = useQuery({
    queryKey: ["fromTosForFen", fen],
    queryFn: async () => getFromTosForFen(fen),
    enabled: fen != null && fen !== "start" && openingBook != null && openingBook[fen] != null,
  });

  const { data: scoresForFens } = useQuery({
    queryKey: ["scoresForFens", fen],
    queryFn: async () => getScoresForFens({ fen, next: fromTosForFen?.next || [], from: fromTosForFen?.from || [] }),
    enabled: fromTosForFen != null,
  });

  // Get the current moves BEFORE calling findOpening (which may overwrite the chess instance)
  const moves = chess.current.pgn();

  let opening = findOpening(
    openingBook!,
    fen,
    positionBook!,
    fromTosForFen || null,
    scoresForFens || null,
    chess
  );

  if (fen !== boardState.fen || moves !== boardState.moves) {
    setBoardState({ fen, moves });
  }

  return (
    <SearchPage {...{ chess, boardState, setBoardState, data: opening }} />
  );
};

export default SearchPageContainer;
