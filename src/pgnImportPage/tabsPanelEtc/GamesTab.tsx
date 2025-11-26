import { useState, useEffect, useRef } from "react";
import { Fragment } from "react/jsx-runtime";
import { GameAdapter } from "../../utils/gameAdapter";
import type { GameDatabase } from "../PgnTabsPanelContainer";

interface GameListItem {
  index: number;
  round: string;
  date: string;
  white: string;
  black: string;
  opening: string;
  result: string;
}

interface GamesTabProps {
  db: GameDatabase;
  filter: string[];
  setGame: (game: GameAdapter) => void;
  setTabIndex: (index: number) => void;
}

export const GamesTab = ({
  db,
  filter,
  setGame,
  setTabIndex,
}: GamesTabProps) => {
  const [openingSrc, setOpeningSrc] = useState<"pgn" | "fenster">("pgn");
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const totalGames = db.gameCount();
  const BATCH_SIZE = 25;

  // Track the current position in the game list
  const currentPositionRef = useRef(0);

  // Load games progressively
  useEffect(() => {
    let mounted = true;

    // Reset state when filter changes
    setIsLoading(true);
    setGames([]);
    currentPositionRef.current = 0;

    const loadGames = async () => {
      // Allow React to render the UI first
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const gamesList: GameListItem[] = [];
      let matchingCount = 0;
      let totalScanned = 0;

      // Iterate through indices (headers only, no full parsing)
      for (let i = 0; i < db.indices.length && matchingCount < BATCH_SIZE; i++) {
        if (!mounted) break;
        totalScanned++;

        const headers = db.indices[i].headers || {};
        const opening = headers.Opening || "";

        // Apply filter
        if (filter.length === 0 || filter.includes(opening)) {
          gamesList.push({
            index: i,
            round: headers.Round || "?",
            date: headers.Date || "????.??.??",
            white: headers.White || "?",
            black: headers.Black || "?",
            opening,
            result: headers.Result || "*",
          });
          matchingCount++;
        }
      }

      // Show the games we loaded
      if (mounted) {
        setGames(gamesList);
        currentPositionRef.current = totalScanned;
        setIsLoading(false);
        setHasMore(totalScanned < totalGames && gamesList.length >= BATCH_SIZE);
      }
    };

    loadGames();

    return () => {
      mounted = false;
    };
  }, [db, totalGames, filter]);

  const loadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const newGames: GameListItem[] = [];
    let matchingCount = 0;
    let totalScanned = 0;

    try {
      // Continue from our current position
      const startIndex = currentPositionRef.current;
      for (let i = startIndex; i < db.indices.length && matchingCount < BATCH_SIZE; i++) {
        totalScanned++;

        const headers = db.indices[i].headers || {};
        const opening = headers.Opening || "";

        // Apply filter
        if (filter.length === 0 || filter.includes(opening)) {
          newGames.push({
            index: i,
            round: headers.Round || "?",
            date: headers.Date || "????.??.??",
            white: headers.White || "?",
            black: headers.Black || "?",
            opening,
            result: headers.Result || "*",
          });
          matchingCount++;
        }
      }

      const updatedPosition = startIndex + totalScanned;

      setGames((prev) => [...prev, ...newGames]);
      currentPositionRef.current = updatedPosition;

      // Check if we've loaded all games
      if (updatedPosition >= totalGames || matchingCount < BATCH_SIZE) {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const clickHandler = (item: GameListItem) => {
    // Parse the full game on-demand
    const fullGame = db.parseGameAtIndex(item.index);
    setGame(fullGame);
    setTabIndex(2);
  };

  return (
    <>
      <div id="games-header" className="font-cinzel games-tab-grid">
        <span>Rnd</span>
        <span>Date</span>
        <span>White</span>
        <span>Black</span>
        <span className="openingHeading">
          Opening
          <span>
            <input
              type="radio"
              name="source"
              value="pgn"
              checked={openingSrc === "pgn"}
              onClick={() => setOpeningSrc("pgn")}
              readOnly={true}
            ></input>
            PGN
          </span>
          <span>
            <input
              type="radio"
              name="source"
              value="fenster"
              checked={openingSrc === "fenster"}
              readOnly={true}
              onClick={() => setOpeningSrc("fenster")}
              disabled={true}
              title="Fenster openings disabled for performance"
            ></input>
            Fenster (disabled)
          </span>
        </span>
        <span>Result</span>
      </div>
      <hr />
      <div id="games-rows" className="white games-tab-grid">
        {isLoading ? (
          <div style={{ gridColumn: "1 / -1", padding: "20px" }}>
            Loading games...
          </div>
        ) : (
          games.map((item, i) => {
            // Create unique key from game properties
            const key = `${item.white}-${item.black}-${item.date}-${item.round}-${i}`;

            return (
              <Fragment key={key}>
                <span style={{ marginLeft: "15px" }}>{item.round}</span>
                <span>{item.date}</span>
                <span>{item.white}</span>
                <span>{item.black}</span>
                <span className="fakeLink" onClick={() => clickHandler(item)}>
                  {item.opening || "N/A"}
                </span>
                <span>{item.result}</span>
              </Fragment>
            );
          })
        )}
      </div>
      {hasMore && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: isLoadingMore ? "wait" : "pointer",
              backgroundColor: isLoadingMore ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {isLoadingMore
              ? "Loading..."
              : `Load Next ${BATCH_SIZE} (showing ${games.length} of ${totalGames})`}
          </button>
        </div>
      )}
    </>
  );
};
