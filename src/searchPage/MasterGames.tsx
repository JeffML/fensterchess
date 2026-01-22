import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, memo, MutableRefObject } from "react";
import { FEN, BoardState } from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";

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

interface Opening {
  name: string;
  fen: string;
  eco: string;
  gameCount: number;
}

interface Master {
  playerName: string;
  gameCount: number;
}

interface MasterGamesByPositionResponse {
  openings: Opening[];
  masters: Master[];
  totalMasters: number;
  totalGames: number;
  page: number;
  pageSize: number;
  usedAncestorFallback: boolean;
  matchedPositions: number;
}

interface MasterGamesResponse {
  games: MasterGame[];
  total: number;
  page: number;
  pageSize: number;
}

// Fetch openings and masters for a position (uses ancestor fallback)
async function fetchMasterGamesByPosition(
  fen: string,
  page: number
): Promise<MasterGamesByPositionResponse> {
  const response = await fetch(
    `/.netlify/functions/getMasterGamesByPosition?fen=${encodeURIComponent(
      fen
    )}&page=${page}&pageSize=10`,
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

// Fetch games for a specific FEN (exact match)
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

const MasterGamesComponent = ({
  fen,
  openingName,
  chess,
  setBoardState,
}: {
  fen: FEN;
  openingName?: string;
  chess: MutableRefObject<ChessPGN>;
  setBoardState: (state: BoardState) => void;
}) => {
  const [page, setPage] = useState(0);
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [gamesPage, setGamesPage] = useState(0);
  const [selectedGameIdx, setSelectedGameIdx] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [expandedEcoCodes, setExpandedEcoCodes] = useState<Set<string>>(
    new Set()
  );
  const prevOpeningNameRef = useRef<string | undefined>(openingName);

  // Reset selection when FEN changes
  useEffect(() => {
    setSelectedOpening(null);
    setGamesPage(0);
    setPage(0);
    setSelectedGameIdx(null);
    setExpandedEcoCodes(new Set());
  }, [fen]);

  // Detect when opening name changes and trigger flash
  useEffect(() => {
    if (
      openingName &&
      prevOpeningNameRef.current &&
      openingName !== prevOpeningNameRef.current
    ) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 800);
      return () => clearTimeout(timer);
    }
    prevOpeningNameRef.current = openingName;
  }, [openingName]);

  const handlePlayerClick = async (gameId: number, targetFen: string) => {
    setSelectedGameIdx(gameId);
    try {
      const moves = await fetchGameMoves(gameId);

      // Load the full game into chess to find the opening position
      chess.current.loadPgn(moves);
      const fullGameMoves = chess.current.pgn();

      // Navigate to the opening position by undoing moves until we reach the opening FEN
      let currentFen = chess.current.fen();
      const targetPositionFen = targetFen.split(" ")[0]; // Position-only FEN (ignore turn/castling)
      let plyCount = chess.current.history().length;

      while (currentFen.split(" ")[0] !== targetPositionFen) {
        const history = chess.current.history();
        if (history.length === 0) {
          // Can't go back further - position not found in game
          console.warn(
            "Opening position not found in game, loading from start"
          );
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
      setBoardState({
        fen: resultingFen,
        moves: fullGameMoves,
        currentPly: plyCount,
      });
    } catch (error) {
      console.error("Error loading game moves:", error);
      alert(`Error loading game: ${(error as Error).message}`);
    }
  };

  // Fetch openings/masters for the position
  const { isError, error, data, isPending } =
    useQuery<MasterGamesByPositionResponse>({
      queryKey: ["masterGamesByPosition", fen, page],
      queryFn: () => fetchMasterGamesByPosition(fen, page),
      staleTime: 24 * 60 * 60 * 1000, // 24 hours - data is immutable
    });

  // Fetch games when an opening is selected
  const { data: gamesData, isPending: gamesPending } =
    useQuery<MasterGamesResponse>({
      queryKey: ["masterGames", selectedOpening?.fen, gamesPage],
      queryFn: () => fetchMasterGames(selectedOpening!.fen, gamesPage),
      enabled: !!selectedOpening,
      staleTime: 24 * 60 * 60 * 1000,
    });

  // Reset page when opening name changes
  useEffect(() => {
    setPage(0);
  }, [openingName]);

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

  if (!data || data.totalGames === 0) {
    return null; // Don't show section if no games found
  }

  const totalMasterPages = Math.ceil(data.totalMasters / data.pageSize);
  const hasNextMasterPage = page < totalMasterPages - 1;
  const hasPrevMasterPage = page > 0;

  // If showing games for a selected opening
  if (selectedOpening && gamesData) {
    const totalGamesPages = Math.ceil(gamesData.total / gamesData.pageSize);
    const hasNextGamesPage = gamesPage < totalGamesPages - 1;
    const hasPrevGamesPage = gamesPage > 0;

    return (
      <div style={{ marginTop: "2em", marginBottom: "1em" }}>
        <div
          className="font-cinzel"
          style={{
            fontWeight: "bold",
            color: "#fff",
            marginBottom: "0.5em",
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <button
            onClick={() => setSelectedOpening(null)}
            style={{
              padding: "0.25em 0.5em",
              backgroundColor: "#4a4a4a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85em",
            }}
          >
            ← Back
          </button>
          <span>
            {selectedOpening.eco} {selectedOpening.name} ({gamesData.total}{" "}
            games)
          </span>
        </div>

        {gamesPending ? (
          <div style={{ color: "#aaa" }}>Loading games...</div>
        ) : (
          <>
            {/* Game list */}
            <div
              style={{
                fontSize: "0.9em",
                color: "#ddd",
                textAlign: "left",
              }}
            >
              {/* Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr 1fr auto auto",
                  gap: "0.5em 1em",
                  padding: "0.25em 0.5em",
                  fontWeight: "bold",
                  color: "#aaa",
                  borderBottom: "1px solid #444",
                }}
              >
                <div>#</div>
                <div>White</div>
                <div>Black</div>
                <div>Result</div>
                <div>Event</div>
              </div>

              {/* Games */}
              {gamesData.games.map((game, idx) => {
                const whiteDisplay = game.whiteTitle
                  ? `${game.whiteTitle} ${game.white} (${game.whiteElo})`
                  : `${game.white} (${game.whiteElo})`;
                const blackDisplay = game.blackTitle
                  ? `${game.blackTitle} ${game.black} (${game.blackElo})`
                  : `${game.black} (${game.blackElo})`;

                return (
                  <div
                    key={game.idx}
                    onClick={() =>
                      handlePlayerClick(game.idx, selectedOpening.fen)
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr 1fr auto auto",
                      gap: "0.5em 1em",
                      padding: "0.25em 0.5em",
                      cursor: "pointer",
                      borderBottom: "1px solid #333",
                      backgroundColor:
                        selectedGameIdx === game.idx ? "#2a4a6a" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedGameIdx !== game.idx) {
                        e.currentTarget.style.backgroundColor = "#3a3a3a";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedGameIdx !== game.idx) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                    title="Click to load game"
                  >
                    <div style={{ color: "#888" }}>
                      {gamesPage * gamesData.pageSize + idx + 1}
                    </div>
                    <div style={{ color: "#6db3f2" }}>{whiteDisplay}</div>
                    <div style={{ color: "#6db3f2" }}>{blackDisplay}</div>
                    <div>{game.result}</div>
                    <div style={{ fontSize: "0.85em", color: "#bbb" }}>
                      {game.event}{" "}
                      {game.date && `(${game.date.substring(0, 4)})`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Games Pagination */}
            {totalGamesPages > 1 && (
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
                  onClick={() => setGamesPage(gamesPage - 1)}
                  disabled={!hasPrevGamesPage}
                  style={{
                    padding: "0.5em 1em",
                    backgroundColor: hasPrevGamesPage ? "#4a4a4a" : "#2a2a2a",
                    color: hasPrevGamesPage ? "#fff" : "#666",
                    border: "none",
                    borderRadius: "4px",
                    cursor: hasPrevGamesPage ? "pointer" : "not-allowed",
                  }}
                >
                  Previous
                </button>
                <span>
                  Page {gamesPage + 1} of {totalGamesPages}
                </span>
                <button
                  onClick={() => setGamesPage(gamesPage + 1)}
                  disabled={!hasNextGamesPage}
                  style={{
                    padding: "0.5em 1em",
                    backgroundColor: hasNextGamesPage ? "#4a4a4a" : "#2a2a2a",
                    color: hasNextGamesPage ? "#fff" : "#666",
                    border: "none",
                    borderRadius: "4px",
                    cursor: hasNextGamesPage ? "pointer" : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2em", marginBottom: "1em" }}>
      <div
        className="font-cinzel"
        style={{
          fontWeight: "bold",
          color: "#fff",
          marginBottom: "0.5em",
          transition: "background-color 0.3s ease",
          backgroundColor: isFlashing ? "#4a7c59" : "transparent",
          padding: "0.25em 0.5em",
          borderRadius: "4px",
        }}
      >
        Master Games ({data.totalGames.toLocaleString()} games in{" "}
        {new Set(data.openings.map((o) => o.eco)).size} ECO codes)
        {data.usedAncestorFallback && (
          <span
            style={{ fontSize: "0.8em", color: "#aaa", marginLeft: "0.5em" }}
          >
            (via descendant positions)
          </span>
        )}
      </div>

      {/* Openings list - grouped by ECO code */}
      <div
        style={{
          fontSize: "0.9em",
          color: "#ddd",
          textAlign: "left",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {/* Group openings by ECO code */}
        {(() => {
          // Group openings by ECO code
          const ecoGroups = new Map<string, Opening[]>();
          for (const opening of data.openings) {
            const group = ecoGroups.get(opening.eco) || [];
            group.push(opening);
            ecoGroups.set(opening.eco, group);
          }

          // Sort ECO codes
          const sortedEcos = Array.from(ecoGroups.keys()).sort();

          return sortedEcos.map((eco) => {
            const openings = ecoGroups.get(eco)!;
            const totalGames = openings.reduce(
              (sum, o) => sum + o.gameCount,
              0
            );
            const isExpanded = expandedEcoCodes.has(eco);
            const hasMultiple = openings.length > 1;

            // If only one opening, show it directly
            if (!hasMultiple) {
              const opening = openings[0];
              return (
                <div
                  key={eco}
                  onClick={() => {
                    setSelectedOpening(opening);
                    setGamesPage(0);
                  }}
                  style={{
                    display: "flex",
                    gap: "0.5em",
                    padding: "0.25em 0.5em",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#333")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <span
                    style={{
                      color: "#6a9",
                      fontWeight: "bold",
                      minWidth: "3em",
                    }}
                  >
                    {eco}
                  </span>
                  <span style={{ color: "#6db3f2", flex: 1 }}>
                    {opening.name}
                  </span>
                  <span style={{ color: "#888" }}>({opening.gameCount})</span>
                </div>
              );
            }

            // Multiple openings - show collapsible group
            return (
              <div key={eco}>
                {/* ECO header row */}
                <div
                  onClick={() => {
                    setExpandedEcoCodes((prev) => {
                      const next = new Set(prev);
                      if (next.has(eco)) {
                        next.delete(eco);
                      } else {
                        next.add(eco);
                      }
                      return next;
                    });
                  }}
                  style={{
                    display: "flex",
                    gap: "0.5em",
                    padding: "0.25em 0.5em",
                    cursor: "pointer",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "4px",
                    marginTop: "0.2em",
                  }}
                >
                  <span style={{ color: "#888", width: "1em" }}>
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <span
                    style={{
                      color: "#6a9",
                      fontWeight: "bold",
                      minWidth: "3em",
                    }}
                  >
                    {eco}
                  </span>
                  <span style={{ color: "#ccc", flex: 1 }}>
                    {openings.length} variations
                  </span>
                  <span style={{ color: "#888" }}>({totalGames})</span>
                </div>

                {/* Expanded children */}
                {isExpanded && (
                  <div style={{ paddingLeft: "2em" }}>
                    {openings.map((opening) => (
                      <div
                        key={opening.fen}
                        onClick={() => {
                          setSelectedOpening(opening);
                          setGamesPage(0);
                        }}
                        style={{
                          display: "flex",
                          gap: "0.5em",
                          padding: "0.2em 0.5em",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#333")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <span style={{ color: "#6db3f2", flex: 1 }}>
                          {opening.name}
                        </span>
                        <span style={{ color: "#888" }}>
                          ({opening.gameCount})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Top Masters */}
      {data.masters.length > 0 && (
        <div style={{ marginTop: "1em" }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#aaa",
              marginBottom: "0.5em",
              textAlign: "left",
            }}
          >
            Top Masters ({data.totalMasters})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.25em 1em",
              fontSize: "0.85em",
            }}
          >
            {data.masters.map((master) => (
              <div
                key={master.playerName}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.2em 0.5em",
                  borderRadius: "4px",
                  color: "#ccc",
                  backgroundColor: "#2a2a2a",
                }}
              >
                <span>{master.playerName}</span>
                <span style={{ color: "#888" }}>{master.gameCount}</span>
              </div>
            ))}
          </div>

          {/* Masters Pagination */}
          {totalMasterPages > 1 && (
            <div
              style={{
                marginTop: "0.5em",
                display: "flex",
                gap: "0.5em",
                alignItems: "center",
                color: "#888",
                fontSize: "0.85em",
              }}
            >
              <button
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevMasterPage}
                style={{
                  padding: "0.25em 0.5em",
                  backgroundColor: hasPrevMasterPage ? "#4a4a4a" : "#2a2a2a",
                  color: hasPrevMasterPage ? "#fff" : "#666",
                  border: "none",
                  borderRadius: "4px",
                  cursor: hasPrevMasterPage ? "pointer" : "not-allowed",
                  fontSize: "0.85em",
                }}
              >
                ←
              </button>
              <span>
                {page + 1}/{totalMasterPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNextMasterPage}
                style={{
                  padding: "0.25em 0.5em",
                  backgroundColor: hasNextMasterPage ? "#4a4a4a" : "#2a2a2a",
                  color: hasNextMasterPage ? "#fff" : "#666",
                  border: "none",
                  borderRadius: "4px",
                  cursor: hasNextMasterPage ? "pointer" : "not-allowed",
                  fontSize: "0.85em",
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const MasterGames = memo(
  MasterGamesComponent,
  (prevProps, nextProps) => {
    // Re-render if chess or setBoardState references change
    if (
      prevProps.chess !== nextProps.chess ||
      prevProps.setBoardState !== nextProps.setBoardState
    ) {
      return false;
    }

    // Always re-render when FEN changes (master games are queried by FEN)
    if (prevProps.fen !== nextProps.fen) {
      return false;
    }

    // Re-render when opening name changes
    return prevProps.openingName === nextProps.openingName;
  }
);
