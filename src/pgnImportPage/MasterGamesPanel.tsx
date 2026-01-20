// Master Games Panel Component
// Displays games for a selected master and openings

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { GameAdapter } from "../utils/gameAdapter";
import { OpeningTab } from "./tabsPanelEtc/OpeningTab";
import "react-tabs/style/react-tabs.css";
import "../stylesheets/tabs.css";

interface MasterGame {
  idx: number;
  white: string;
  black: string;
  whiteElo?: number;
  blackElo?: number;
  result: string;
  date: string;
  event: string;
  eco: string;
  opening: string;
}

interface MasterGamesResponse {
  games: MasterGame[];
  total: number;
  player: string;
  openings: string[];
}

// Fetch games for a master and selected openings
async function fetchMasterGames(
  player: string,
  openings: string[]
): Promise<MasterGamesResponse> {
  const params = new URLSearchParams({
    player,
    openings: openings.join(","),
  });

  const response = await fetch(
    `/.netlify/functions/getGamesByMasterAndOpening?${params}`,
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

// Game data returned from getMasterGameMoves
interface GameMovesResponse {
  gameId: number;
  moves: string;
  white: string;
  black: string;
  whiteElo?: number;
  blackElo?: number;
  event?: string;
  date?: string;
  result?: string;
}

// Fetch full moves for a game
async function fetchGameMoves(gameId: number): Promise<GameMovesResponse> {
  const response = await fetch(
    `/.netlify/functions/getMasterGameMoves?gameId=${gameId}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (!data.moves) {
    throw new Error(`No moves in response: ${JSON.stringify(data)}`);
  }
  return data;
}

// Build PGN string with headers from game data
function buildPgn(data: GameMovesResponse): string {
  const headers: string[] = [];
  if (data.event) headers.push(`[Event "${data.event}"]`);
  if (data.white) headers.push(`[White "${data.white}"]`);
  if (data.black) headers.push(`[Black "${data.black}"]`);
  if (data.whiteElo) headers.push(`[WhiteElo "${data.whiteElo}"]`);
  if (data.blackElo) headers.push(`[BlackElo "${data.blackElo}"]`);
  if (data.date) headers.push(`[Date "${data.date}"]`);
  if (data.result) headers.push(`[Result "${data.result}"]`);

  return headers.join("\n") + "\n\n" + data.moves;
}

interface MasterGamesPanelProps {
  selectedMaster: string;
  selectedOpenings: string[];
}

export const MasterGamesPanel = ({
  selectedMaster,
  selectedOpenings,
}: MasterGamesPanelProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<MasterGame | null>(null);
  const [gameAdapter, setGameAdapter] = useState<GameAdapter | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);

  // Fetch games for selected master and openings
  const {
    data: gamesData,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["masterGames", selectedMaster, selectedOpenings],
    queryFn: () => fetchMasterGames(selectedMaster, selectedOpenings),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle game click - fetch moves and show in Opening tab
  const handleGameClick = async (game: MasterGame) => {
    setSelectedGame(game);
    setLoadingGame(true);

    try {
      const gameData = await fetchGameMoves(game.idx);
      const pgn = buildPgn(gameData);
      const chess = new ChessPGN();
      chess.loadPgn(pgn);
      const adapter = new GameAdapter(chess);
      setGameAdapter(adapter);
      setTabIndex(1); // Switch to Opening tab
    } catch (err) {
      console.error("Error loading game moves:", err);
    } finally {
      setLoadingGame(false);
    }
  };

  if (isPending) {
    return (
      <div className="white" style={{ padding: "1em" }}>
        Loading games for {selectedMaster}...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="white" style={{ padding: "1em", color: "#ff6b6b" }}>
        Error loading games: {error?.message}
      </div>
    );
  }

  return (
    <Tabs
      selectedIndex={tabIndex}
      onSelect={setTabIndex}
      className="pgn-tabs-panel"
    >
      <TabList className="left" style={{ marginBottom: "0px" }}>
        <Tab className="react-tabs__tab tab-base">
          Games ({gamesData?.total || 0})
        </Tab>
        <Tab
          disabled={!gameAdapter}
          className="react-tabs__tab tab-base"
          style={{
            color: !gameAdapter ? "GrayText" : "lightgreen",
          }}
        >
          Opening
        </Tab>
      </TabList>

      <div style={{ border: "thick solid white" }}>
        {/* Games Tab */}
        <TabPanel>
          <div
            style={{
              maxHeight: "400px",
              overflow: "auto",
              backgroundColor: "#1a1a1a",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 3fr 80px 100px",
                gap: "0.5em",
                padding: "0.5em 1em",
                backgroundColor: "#2a2a2a",
                fontWeight: "bold",
                color: "#fff",
                borderBottom: "1px solid #444",
                position: "sticky",
                top: 0,
              }}
            >
              <span>White</span>
              <span>Black</span>
              <span>Opening</span>
              <span>Result</span>
              <span>Date</span>
            </div>

            {/* Game rows */}
            {gamesData?.games.map((game) => (
              <div
                key={game.idx}
                onClick={() => handleGameClick(game)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 3fr 80px 100px",
                  gap: "0.5em",
                  padding: "0.5em 1em",
                  cursor: "pointer",
                  backgroundColor:
                    selectedGame?.idx === game.idx ? "#4a7c59" : "transparent",
                  color: selectedGame?.idx === game.idx ? "#fff" : "#ccc",
                  borderBottom: "1px solid #333",
                }}
                onMouseEnter={(e) => {
                  if (selectedGame?.idx !== game.idx) {
                    e.currentTarget.style.backgroundColor = "#333";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGame?.idx !== game.idx) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span>
                  {game.white}
                  {game.whiteElo && (
                    <span style={{ color: "#888", fontSize: "0.85em" }}>
                      {" "}
                      ({game.whiteElo})
                    </span>
                  )}
                </span>
                <span>
                  {game.black}
                  {game.blackElo && (
                    <span style={{ color: "#888", fontSize: "0.85em" }}>
                      {" "}
                      ({game.blackElo})
                    </span>
                  )}
                </span>
                <span style={{ color: "#aaa" }}>
                  <span style={{ color: "#888", marginRight: "0.5em" }}>
                    {game.eco}
                  </span>
                  {game.opening}
                </span>
                <span
                  style={{
                    color:
                      game.result === "1-0"
                        ? "#8bc34a"
                        : game.result === "0-1"
                          ? "#ff7043"
                          : "#aaa",
                  }}
                >
                  {game.result}
                </span>
                <span style={{ color: "#888" }}>{game.date}</span>
              </div>
            ))}

            {gamesData?.games.length === 0 && (
              <div
                style={{ padding: "2em", textAlign: "center", color: "#888" }}
              >
                No games found for {selectedMaster} with the selected openings
              </div>
            )}
          </div>

          {/* Summary */}
          <div
            style={{
              padding: "0.5em 1em",
              backgroundColor: "#2a2a2a",
              borderTop: "1px solid #444",
              fontSize: "0.85em",
              color: "#888",
            }}
          >
            {gamesData?.total} game{gamesData?.total !== 1 && "s"} •{" "}
            {selectedOpenings.length} opening
            {selectedOpenings.length !== 1 && "s"} selected
            {loadingGame && (
              <span style={{ marginLeft: "1em", color: "#4a7c59" }}>
                Loading game...
              </span>
            )}
          </div>
        </TabPanel>

        {/* Opening Tab */}
        <TabPanel>
          <OpeningTab game={gameAdapter} />
        </TabPanel>
      </div>
    </Tabs>
  );
};
