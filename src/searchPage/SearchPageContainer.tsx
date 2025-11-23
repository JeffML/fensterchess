import { ChessPGN } from "@chess-pgn/chess-pgn";
import {
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  MutableRefObject,
} from "react";
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
  const initializedFromUrl = useRef(false);

  // Read URL parameters on mount
  useEffect(() => {
    if (!initializedFromUrl.current) {
      const url = new URLSearchParams(window.location.search);
      const { fen, moves } = readParams(url, chess);
      // Only update if different from initial state
      if (fen !== "start" || moves !== "") {
        setBoardState({ fen, moves });
      }
      initializedFromUrl.current = true;
    }
  }, []); // Empty dependency array - only run on mount

  const { fen } = boardState;
  const context = useContext(OpeningBookContext);
  const { openingBook, positionBook } = context || {};

  // Call all hooks unconditionally before any early returns
  const { data: fromTosForFen } = useQuery({
    queryKey: ["fromTosForFen", fen],
    queryFn: async () => getFromTosForFen(fen),
    enabled:
      fen != null &&
      fen !== "start" &&
      openingBook != null &&
      openingBook[fen] != null,
  });

  const { data: scoresForFens } = useQuery({
    queryKey: ["scoresForFens", fen],
    queryFn: async () =>
      getScoresForFens({
        fen,
        next: fromTosForFen?.next || [],
        from: fromTosForFen?.from || [],
      }),
    enabled: fromTosForFen != null && openingBook != null,
  });

  const opening = useMemo(
    () =>
      openingBook && positionBook
        ? findOpening(
            openingBook,
            fen,
            positionBook,
            fromTosForFen || null,
            scoresForFens || null
          )
        : undefined,
    [openingBook, fen, positionBook, fromTosForFen, scoresForFens]
  );

  // Update chess engine and boardState moves when opening changes
  useEffect(() => {
    if (opening && fromTosForFen && scoresForFens) {
      chess.current.loadPgn(opening.moves);
      // Update boardState to show the opening's moves
      setBoardState((prev) => ({
        ...prev,
        moves: opening.moves,
      }));
    }
  }, [opening, fromTosForFen, scoresForFens, chess]);

  // Early returns AFTER all hooks
  if (!context) return <div>Loading...</div>;
  if (!openingBook || !positionBook) {
    return <div>Loading opening database...</div>;
  }

  return (
    <SearchPage {...{ chess, boardState, setBoardState, data: opening }} />
  );
};

export default SearchPageContainer;
