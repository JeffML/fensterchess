import { useState, useEffect, useRef, useContext } from "react";
import { Fragment } from "react/jsx-runtime";
import { GameAdapter } from "../../utils/gameAdapter";
import type { GameDatabase } from "../PgnTabsPanelContainer";
import { OpeningBookContext } from "../../contexts/OpeningBookContext";
import { findOpeningFromPgnText } from "../../utils/openings";

interface GameListItem {
  index: number;
  round: string;
  date: string;
  white: string;
  black: string;
  opening: string;
  result: string;
  pgnText: string;
  fensterOpening?: string; // Lazily computed
}

interface GamesTabProps {
  db: GameDatabase;
  filter: string[];
  setGame: (game: GameAdapter) => void;
  setTabIndex: (index: number) => void;
  tabIndex: number;
}

export const GamesTab = ({
  db,
  filter,
  setGame,
  setTabIndex,
  tabIndex,
}: GamesTabProps) => {
  const [openingSrc, setOpeningSrc] = useState<"pgn" | "fenster">("pgn");
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const totalGames = db.gameCount();
  const BATCH_SIZE = 25;
  const context = useContext(OpeningBookContext);
  const openingBook = context?.openingBook;
  const positionBook = context?.positionBook;

  // Track the current position in the game list
  const currentPositionRef = useRef(0);
  // Cache for computed Fenster openings (index -> opening name)
  const fensterOpeningsCache = useRef<Map<number, string>>(new Map());

  // Load games progressively
  useEffect(() => {
    // Only load games when Games tab is active (tabIndex === 1)
    if (tabIndex !== 1) {
      return;
    }

    let mounted = true;

    // Reset state when filter changes
    setIsLoading(true);
    setGames([]);
    currentPositionRef.current = 0;
    fensterOpeningsCache.current.clear();

    const loadGames = async () => {
      // Allow React to render the UI first
      await new Promise((resolve) => setTimeout(resolve, 0));

      const gamesList: GameListItem[] = [];
      let matchingCount = 0;
      let totalScanned = 0;

      // Iterate through indices (headers only, no full parsing)
      for (
        let i = 0;
        i < db.indices.length && matchingCount < BATCH_SIZE;
        i++
      ) {
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
            pgnText: db.indices[i].pgnText || "",
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
  }, [db, totalGames, filter, tabIndex]);

  const loadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const newGames: GameListItem[] = [];
    let matchingCount = 0;
    let totalScanned = 0;

    try {
      // Continue from our current position
      const startIndex = currentPositionRef.current;
      for (
        let i = startIndex;
        i < db.indices.length && matchingCount < BATCH_SIZE;
        i++
      ) {
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
            pgnText: db.indices[i].pgnText || "",
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

  // Get Fenster opening name with caching
  const getFensterOpening = (item: GameListItem): string => {
    if (!openingBook || !positionBook) return "Loading...";

    // Check cache first
    const cached = fensterOpeningsCache.current.get(item.index);
    if (cached !== undefined) return cached;

    // Compute and cache
    const opening = findOpeningFromPgnText(
      item.pgnText,
      openingBook,
      positionBook,
    );
    const name = opening?.name || "N/A";
    fensterOpeningsCache.current.set(item.index, name);
    return name;
  };

  return (
    <>
      <div className="games-container">
        <div id="games-header" className="font-cinzel games-tab-grid">
          <span>Rnd</span>
          <span>Date</span>
          <span>White</span>
          <span>Black</span>
          <span className="openingHeading">
            Opening from
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
                disabled={!openingBook}
                title={openingBook ? "Opening book" : "Loading opening book..."}
              ></input>
              eco.json
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
                    {openingSrc === "pgn"
                      ? item.opening || "N/A"
                      : getFensterOpening(item)}
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
      </div>
    </>
  );
};
