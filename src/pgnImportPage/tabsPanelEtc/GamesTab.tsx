import { useState, useEffect, useRef } from "react";
import { Fragment } from "react/jsx-runtime";
import { GameAdapter } from "../../utils/gameAdapter";
import { getFullOpeningNameFromKokopuGame } from "../../utils/chessTools";
import type { GameDatabase } from "../PgnTabsPanelContainer";

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
  const [games, setGames] = useState<GameAdapter[]>([]);
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

    const loadGames = async () => {
      const gamesList: GameAdapter[] = [];
      let count = 0;

      for await (const game of db.games()) {
        if (!mounted) break;
        gamesList.push(game);
        count++;

        // Stop after initial batch - don't load all games
        if (count >= BATCH_SIZE) {
          break;
        }
      }

      // Show the games we loaded
      if (mounted) {
        setGames(gamesList);
        currentPositionRef.current = gamesList.length;
        setIsLoading(false);
        setHasMore(count >= BATCH_SIZE && gamesList.length < totalGames);
      }
    };

    loadGames();

    return () => {
      mounted = false;
    };
  }, [db, totalGames]);

  const loadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const newGames: GameAdapter[] = [];
    let count = 0;

    try {
      // Create a new iterator starting from our current position
      for await (const game of db.games(currentPositionRef.current)) {
        newGames.push(game);
        count++;

        if (count >= BATCH_SIZE) {
          break;
        }
      }

      const updatedLength = games.length + newGames.length;

      setGames((prev) => [...prev, ...newGames]);
      currentPositionRef.current = updatedLength;

      // Check if we've loaded all games
      // Either we got fewer games than requested (end of file) or we've reached the total
      if (count < BATCH_SIZE || updatedLength >= totalGames) {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const clickHandler = (g: GameAdapter) => {
    setTabIndex(2);
    setGame(g);
  };

  const filterFunc = (game: GameAdapter) => {
    const opening = game.opening();
    return !filter.length || (opening && filter.includes(opening));
  };

  if (isLoading) {
    return (
      <>
        <div id="games-header" className="font-cinzel games-tab-grid">
          <span>Rnd</span>
          <span>Date</span>
          <span>White</span>
          <span>Black</span>
          <span className="openingHeading">Opening</span>
          <span>Result</span>
        </div>
        <hr />
        <div className="white" style={{ padding: "20px" }}>
          Loading games...
        </div>
      </>
    );
  }

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
        {games.filter(filterFunc).map((g, i) => {
          // Only use PGN openings (from headers) - skip fenster for performance
          const pgnOpening = getFullOpeningNameFromKokopuGame(g);
          const opening = pgnOpening;

          const variant = g.variant();
          const isRegular = variant && variant === "regular";

          // Create unique key from game properties
          const key = `${g.playerName("w")}-${g.playerName(
            "b"
          )}-${g.dateAsString()}-${g.fullRound()}-${i}`;

          return (
            <Fragment key={key}>
              <span style={{ marginLeft: "15px" }}>{g.fullRound()}</span>
              <span>{g.dateAsString()}</span>
              <span>{g.playerName("w")}</span>
              <span>{g.playerName("b")}</span>
              {variant && !isRegular && (
                <span>{variant} variant not supported</span>
              )}
              {(!variant || isRegular) && (
                <span className="fakeLink" onClick={() => clickHandler(g)}>
                  {opening ?? "N/A"}
                </span>
              )}

              <span>{g.result()}</span>
            </Fragment>
          );
        })}
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
