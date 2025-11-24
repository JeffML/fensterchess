import { ChessPGN } from "@chess-pgn/chess-pgn";
import {
  useContext,
  useRef,
  useState,
  useEffect,
  MutableRefObject,
} from "react";
import { FENEX } from "../common/consts";
import { OpeningBookContext } from "../contexts/OpeningBookContext";
import SearchPage from "./SearchPage";
import { useQuery } from "@tanstack/react-query";
import {
  findOpening,
  findNearestOpening,
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
  const [nearestOpeningInfo, setNearestOpeningInfo] = useState<{
    fen: string;
    movesBack: number;
  } | null>(null);

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

  // Get the current moves BEFORE calling findOpening (which may overwrite the chess instance)
  const moves = chess.current.pgn();

  let opening =
    openingBook && positionBook
      ? findOpening(
          openingBook,
          fen,
          positionBook,
          fromTosForFen || null,
          scoresForFens || null
        )
      : undefined;

  // If no opening found and we have moves, search backward for nearest opening
  if (!opening && moves && moves.trim() !== "" && openingBook && positionBook) {
    const { opening: nearestOpening, movesBack } = findNearestOpening(
      moves,
      openingBook,
      positionBook
    );

    if (nearestOpening && movesBack > 0) {
      opening = nearestOpening;
      // Store info about how far back we found the opening
      if (
        !nearestOpeningInfo ||
        nearestOpeningInfo.fen !== fen ||
        nearestOpeningInfo.movesBack !== movesBack
      ) {
        setNearestOpeningInfo({ fen, movesBack });
      }
    } else {
      // Clear nearest opening info if we're at a known position
      if (nearestOpeningInfo) {
        setNearestOpeningInfo(null);
      }
    }
  } else {
    // Clear nearest opening info if we found an exact match
    if (nearestOpeningInfo) {
      setNearestOpeningInfo(null);
    }
  }

  // Early returns AFTER all hooks
  if (!context) return <div>Loading...</div>;
  if (!openingBook || !positionBook) {
    return <div>Loading opening database...</div>;
  }

  return (
    <SearchPage
      {...{
        chess,
        boardState,
        setBoardState,
        data: opening,
        nearestOpeningInfo,
      }}
    />
  );
};

export default SearchPageContainer;
