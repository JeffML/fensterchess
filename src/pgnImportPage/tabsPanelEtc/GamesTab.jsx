import { useState, useEffect, useContext } from "react";
import { Fragment } from "react/jsx-runtime";
import { getFullOpeningNameFromKokopuGame } from "../../utils/chessTools";
import { findOpeningForKokopuGame } from "../../utils/openings";
import { OpeningBookContext } from "../../contexts/OpeningBookContext";

export const GamesTab = ({ db, filter, setGame, setTabIndex }) => {
  const { openingBook } = useContext(OpeningBookContext);
  const [openingSrc, setOpeningSrc] = useState("pgn");
  const [games, setGames] = useState([]);
  const [displayCount, setDisplayCount] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const totalGames = db.gameCount();

  // Load games progressively
  useEffect(() => {
    let mounted = true;
    const INITIAL_BATCH = 25;

    const loadGames = async () => {
      const gamesList = [];
      let count = 0;

      for await (const game of db.games()) {
        if (!mounted) break;
        gamesList.push(game);
        count++;

        // Stop after initial batch - don't load all games
        if (count >= INITIAL_BATCH) {
          break;
        }
      }

      // Show the games we loaded
      if (mounted) {
        setGames(gamesList);
        setIsLoading(false);
        setIsLoadingAll(count < totalGames); // Still more to load if we stopped early
      }
    };

    loadGames();

    return () => {
      mounted = false;
    };
  }, [db, totalGames]);

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 25, games.length));
  };

  const clickHandler = (g) => {
    setTabIndex(2);
    setGame(g);
  };

  const filterFunc = (game) =>
    !filter.length || filter.includes(game.opening());

  // eslint-disable-next-line no-unused-vars
  const logOpening = (pgnOpening, fensterOpening) => {
    console.log(
      JSON.stringify(
        {
          pgn: pgnOpening ?? "N/A",
          fenster: fensterOpening?.name ?? "N/A",
        },
        null,
        2
      )
    );
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
        {games
          .slice(0, displayCount)
          .filter(filterFunc)
          .map((g, i) => {
            // Only use PGN openings (from headers) - skip fenster for performance
            const pgnOpening = getFullOpeningNameFromKokopuGame(g);
            const opening = pgnOpening;

            let variant = g.variant();
            if (variant && variant === "regular") variant = null;

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
                {variant && <span>{variant} variant not supported</span>}
                {!variant && (
                  <span className="fakeLink" onClick={() => clickHandler(g)}>
                    {opening ?? "N/A"}
                  </span>
                )}

                <span>{g.result()}</span>
              </Fragment>
            );
          })}
      </div>
      {displayCount < games.length && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <button
            onClick={loadMore}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Load More (showing {displayCount} of {games.length})
          </button>
        </div>
      )}
      {isLoadingAll && games.length > 0 && (
        <div style={{ textAlign: "center", padding: "10px", color: "#888" }}>
          Loading remaining games... ({games.length} of {totalGames})
        </div>
      )}
    </>
  );
};
