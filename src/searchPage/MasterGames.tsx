import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FEN } from "../types";
import { useSearchPage } from "./SearchPageContext";

interface MasterGame {
  idx: number;
  white: string;
  black: string;
  whiteElo: number;
  blackElo: number;
  whiteTitle?: string;
  blackTitle?: string;
  result: string;
  date: string;
  event: string;
  eco?: string;
  opening?: string;
  ply: number;
  source: string;
}

interface MasterGamesResponse {
  games: MasterGame[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchMasterGames(
  fen: string,
  page: number
): Promise<MasterGamesResponse> {
  const response = await fetch(
    `/.netlify/functions/queryMasterGamesByFen?fen=${encodeURIComponent(
      fen
    )}&page=${page}&pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchGameMoves(gameId: number): Promise<string> {
  const response = await fetch(
    `/.netlify/functions/getMasterGameMoves?gameId=${gameId}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.moves;
}

export const MasterGames = ({ fen }: { fen: FEN }) => {
  const [page, setPage] = useState(0);
  const { chess, setBoardState } = useSearchPage();

  const handlePlayerClick = async (gameId: number) => {
    try {
      const moves = await fetchGameMoves(gameId);

      // Load the full game into chess to find the opening position
      chess.current.loadPgn(moves);
      const fullGameMoves = chess.current.pgn();

      // Navigate to the opening position by undoing moves until we reach the opening FEN
      let currentFen = chess.current.fen();
      const targetPositionFen = fen.split(' ')[0]; // Position-only FEN (ignore turn/castling)
      let plyCount = chess.current.history().length;
      
      while (currentFen.split(' ')[0] !== targetPositionFen) {
        const history = chess.current.history();
        if (history.length === 0) {
          // Can't go back further - position not found in game
          console.warn("Opening position not found in game, loading from start");
          chess.current.reset();
          chess.current.loadPgn(moves);
          plyCount = chess.current.history().length;
          break;
        }
        chess.current.undo();
        plyCount--;
        currentFen = chess.current.fen();
      }

      // Update board state with the opening position, full game moves, and current ply
      const resultingFen = chess.current.fen();
      setBoardState({ fen: resultingFen, moves: fullGameMoves, currentPly: plyCount });
    } catch (error) {
      console.error("Error loading game moves:", error);
      alert(`Error loading game: ${(error as Error).message}`);
    }
  };

  const { isError, error, data, isPending } = useQuery<MasterGamesResponse>({
    queryKey: ["masterGames", fen, page],
    queryFn: () => fetchMasterGames(fen, page),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - data is immutable
  });

  if (isError) {
    console.error(error);
    return (
      <div className="white" style={{ marginTop: "1em" }}>
        <span style={{ color: "#ff6b6b" }}>
          Error loading master games: {error.message}
        </span>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="white" style={{ marginTop: "1em" }}>
        Loading master games...
      </div>
    );
  }

  if (!data || data.total === 0) {
    return null; // Don't show section if no games found
  }

  const totalPages = Math.ceil(data.total / data.pageSize);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  return (
    <div style={{ marginTop: "2em", marginBottom: "1em" }}>
      <div
        className="font-cinzel"
        style={{ fontWeight: "bold", color: "#fff", marginBottom: "0.5em" }}
      >
        Master Games ({data.total.toLocaleString()} positions)
      </div>

      {/* Game list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr auto auto",
          gap: "0.5em 1em",
          fontSize: "0.9em",
          color: "#ddd",
          textAlign: "left",
        }}
      >
        {/* Headers */}
        <div style={{ fontWeight: "bold", color: "#aaa" }}>#</div>
        <div style={{ fontWeight: "bold", color: "#aaa" }}>White</div>
        <div style={{ fontWeight: "bold", color: "#aaa" }}>Black</div>
        <div style={{ fontWeight: "bold", color: "#aaa" }}>Result</div>
        <div style={{ fontWeight: "bold", color: "#aaa" }}>Event</div>

        {/* Games */}
        {data.games.map((game, idx) => {
          const whiteDisplay = game.whiteTitle
            ? `${game.whiteTitle} ${game.white} (${game.whiteElo})`
            : `${game.white} (${game.whiteElo})`;
          const blackDisplay = game.blackTitle
            ? `${game.blackTitle} ${game.black} (${game.blackElo})`
            : `${game.black} (${game.blackElo})`;

          return (
            <div key={game.idx} style={{ display: "contents" }}>
              <div style={{ color: "#888" }}>
                {page * data.pageSize + idx + 1}
              </div>
              <div
                onClick={() => handlePlayerClick(game.idx)}
                style={{
                  cursor: "pointer",
                  color: "#6db3f2",
                  textDecoration: "underline",
                }}
                title="Click to load game moves"
              >
                {whiteDisplay}
              </div>
              <div
                onClick={() => handlePlayerClick(game.idx)}
                style={{
                  cursor: "pointer",
                  color: "#6db3f2",
                  textDecoration: "underline",
                }}
                title="Click to load game moves"
              >
                {blackDisplay}
              </div>
              <div>{game.result}</div>
              <div style={{ fontSize: "0.85em", color: "#bbb" }}>
                {game.event} {game.date && `(${game.date.substring(0, 4)})`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: "1em",
            display: "flex",
            gap: "1em",
            alignItems: "center",
            color: "#ddd",
          }}
        >
          <button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevPage}
            style={{
              padding: "0.5em 1em",
              backgroundColor: hasPrevPage ? "#4a4a4a" : "#2a2a2a",
              color: hasPrevPage ? "#fff" : "#666",
              border: "none",
              borderRadius: "4px",
              cursor: hasPrevPage ? "pointer" : "not-allowed",
            }}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
            style={{
              padding: "0.5em 1em",
              backgroundColor: hasNextPage ? "#4a4a4a" : "#2a2a2a",
              color: hasNextPage ? "#fff" : "#666",
              border: "none",
              borderRadius: "4px",
              cursor: hasNextPage ? "pointer" : "not-allowed",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
