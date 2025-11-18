import { Chess } from "chess.js";
import { useContext, useRef, useState, useEffect } from "react";
import { FENEX } from "../common/consts.js";
import { OpeningBookContext } from "../contexts/OpeningBookContext.jsx";
import SearchPage from "./SearchPage.jsx";
import { useQuery } from "@tanstack/react-query";
import {
  findOpening,
  getFromTosForFen,
  getScoresForFens,
} from "../datasource/findOpening.js";

const loadMoves = (moves, chess) => {
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

function readParams(url, chess) {
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
  const [boardState, setBoardState] = useState({ fen: "start", moves: "" });

  const chess = useRef(new Chess());

  // Read URL parameters on mount
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const { fen, moves } = readParams(url, chess);
    if (fen !== "start" || moves !== "") {
      setBoardState({ fen, moves });
    }
  }, []); // Empty dependency array - only run on mount

  const { fen } = boardState;
  const { openingBook, positionBook } = useContext(OpeningBookContext);

  const {
    isPending,
    isError,
    error,
    data: fromTosForFen,
  } = useQuery({
    queryKey: ["fromTosForFen", fen],
    queryFn: async () => getFromTosForFen(fen),
    enabled: fen != null && fen !== "start" && openingBook[fen] != null,
  });

  const {
    isPending: isPending2,
    isError: isError2,
    error: error2,
    data: scoresForFens,
  } = useQuery({
    queryKey: ["scoresForFens", fen],
    queryFn: async () => getScoresForFens({ fen, ...fromTosForFen }),
    enabled: fromTosForFen != null,
  });

  if (!openingBook) return <div>Loading...</div>;

  // Get the current moves BEFORE calling findOpening (which may overwrite the chess instance)
  const moves = chess.current.pgn();

  let opening = findOpening(
    openingBook,
    fen,
    positionBook,
    fromTosForFen,
    scoresForFens,
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
