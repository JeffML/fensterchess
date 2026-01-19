import { useQuery as useQueryRQ } from "@tanstack/react-query";
import {
  indexPgnGames,
  CursorImpl,
  type Game as ChessPGNGame,
} from "@chess-pgn/chess-pgn";
import { GameAdapter } from "../utils/gameAdapter";
import { useState } from "react";
import "react-tabs/style/react-tabs.css";
import "../stylesheets/grid.css";
import "../stylesheets/tabs.css";
import { PgnTabsPanel } from "./PgnTabsPanel";

interface PgnFileRequest {
  link: string;
  lastModified: string;
}

export interface GameDatabase {
  gameCount: () => number;
  games: (startIndex?: number) => AsyncGenerator<GameAdapter, void, unknown>;
  indices: { headers?: Record<string, string>; pgnText?: string }[];
  parseGameAtIndex: (index: number) => GameAdapter;
}

export interface Player {
  name: string;
  elo?: number;
  title?: string;
}

export interface PgnSummary {
  db: GameDatabase;
  players: Record<string, Player>;
  high: number;
  low: number;
  avg: number;
  count: number;
  openings: Set<string>;
  event: string;
}

// pgn file requests for url links
const getPgnFiles = async ({ pgnLinks }: { pgnLinks: PgnFileRequest[] }) => {
  const response = await fetch("/.netlify/functions/getPgnFiles", {
    method: "POST",
    body: JSON.stringify({ pgnLinks }),
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
    },
  });

  const data = await response.json();
  return data;
};

export const getPgnSummary = async (pgn: string): Promise<PgnSummary> => {
  const ETC = ", etc.";
  const indices = indexPgnGames(pgn);
  const gmCt = indices.length;

  // Extract raw PGN text for each game using offsets
  const indicesWithPgn = indices.map((index) => ({
    ...index,
    pgnText: pgn.substring(index.startOffset, index.endOffset),
  }));

  // iterate through game HEADERS only (fast!), gathering stats
  let high = 0,
    low = 9999,
    avg = 0;
  const players: Record<string, Player> = {};
  const openings = new Set<string>();
  let mainEvent: string | null = null;

  // Use headers from indices instead of parsing full games
  for (const index of indicesWithPgn) {
    const headers = index.headers || {};

    const white: Player = {
      name: headers.White || "?",
      elo: parseInt(headers.WhiteElo) || undefined,
      title: headers.WhiteTitle || undefined,
    };
    const black: Player = {
      name: headers.Black || "?",
      elo: parseInt(headers.BlackElo) || undefined,
      title: headers.BlackTitle || undefined,
    };
    const opening = headers.Opening || undefined;
    const event = headers.Event || "?";

    mainEvent ??= event;
    if (event !== mainEvent && !mainEvent.endsWith(ETC)) mainEvent += ETC;

    // Store or update player info - prefer entries with more complete data
    if (!players[white.name]) {
      players[white.name] = white;
    } else {
      // Update with title if current entry doesn't have one
      if (white.title && !players[white.name].title) {
        players[white.name].title = white.title;
      }
      // Update with ELO if current entry doesn't have one
      if (white.elo && !players[white.name].elo) {
        players[white.name].elo = white.elo;
      }
    }

    if (!players[black.name]) {
      players[black.name] = black;
    } else {
      // Update with title if current entry doesn't have one
      if (black.title && !players[black.name].title) {
        players[black.name].title = black.title;
      }
      // Update with ELO if current entry doesn't have one
      if (black.elo && !players[black.name].elo) {
        players[black.name].elo = black.elo;
      }
    }

    if (opening) openings.add(opening);

    const elos = [white.elo, black.elo];
    if (Number.isInteger(elos[0])) high = Math.max(high, elos[0]!);
    if (Number.isInteger(elos[1])) high = Math.max(high, elos[1]!);
    if (Number.isInteger(elos[0])) low = Math.min(low, elos[0]!);
    if (Number.isInteger(elos[1])) low = Math.min(low, elos[1]!);
    avg += (elos[0] || 0) + (elos[1] || 0);
  }

  avg = avg / gmCt / 2;

  // Helper to parse a single game on-demand
  const parseGameAtIndex = (index: number): GameAdapter => {
    const gameCursor = new CursorImpl(pgn, indices, {
      start: index,
      length: 1,
    });
    const game = gameCursor.next();
    if (!game) {
      throw new Error(`Failed to parse game at index ${index}`);
    }
    return new GameAdapter(game as ChessPGNGame);
  };

  // Create a wrapper that provides kokopu-like db.games() iterator
  // Games are parsed lazily only when actually iterated
  const db: GameDatabase = {
    gameCount: () => gmCt,
    games: async function* (startIndex = 0) {
      const gameCursor = new CursorImpl(pgn, indices, { start: startIndex });
      for await (const game of gameCursor) {
        // CursorImpl returns Game objects from @chess-pgn/chess-pgn
        yield new GameAdapter(game as ChessPGNGame);
      }
    },
    indices: indicesWithPgn,
    parseGameAtIndex,
  };

  return {
    db,
    players,
    high,
    low,
    avg,
    count: gmCt,
    openings,
    event: mainEvent || "?",
  };
};

/*
Arguments are url OR pgn.

If given a url, query TWIC for games; else load the pgn file directly.
*/
interface PgnLink {
  url?: string | null;
  pgn?: string;
}

interface PgnTabsPanelContainerProps {
  link: PgnLink;
  pgnMode?: "twic" | "local" | "master";
  selectedMaster?: string | null;
  selectedOpenings?: string[];
}

export const PgnTabsPanelContainer = ({
  link,
  pgnMode,
  selectedMaster,
  selectedOpenings,
}: PgnTabsPanelContainerProps) => {
  const { url = null, pgn } = link;

  // controlled mode; see https://www.npmjs.com/package/react-tabs#controlled-vs-uncontrolled-mode
  const [tabIndex, setTabIndex] = useState(0);

  const dummyMetaPgnInput: PgnFileRequest = {
    link: url || "",
    lastModified: "",
  };

  const { isPending, error, data } = useQueryRQ({
    queryKey: ["pgnFiles", url],
    queryFn: async () => {
      const pgnFiles = await getPgnFiles({
        pgnLinks: [dummyMetaPgnInput],
      });
      return pgnFiles;
    },
    enabled: url !== null && url !== undefined,
  });

  if (error) console.error(error.toString());
  if (url && isPending) return <span className="white">Loading...</span>;

  // Master Games mode - show placeholder or games for selected master
  if (pgnMode === "master") {
    if (!selectedMaster || !selectedOpenings?.length) {
      return (
        <div className="white" style={{ padding: "1em", color: "#888" }}>
          Select openings and a master to view their games
        </div>
      );
    }
    // TODO: Implement master games display
    return (
      <div className="white" style={{ padding: "1em" }}>
        <p>
          Showing games for <strong>{selectedMaster}</strong>
        </p>
        <p style={{ color: "#888" }}>
          Openings: {selectedOpenings.join(", ")}
        </p>
        <p style={{ color: "#666", marginTop: "1em" }}>
          (Games tab coming in Day 5)
        </p>
      </div>
    );
  }

  if (data || pgn) {
    return (
      <PgnTabsPanel
        {...{
          pgn: data ? data[0].pgn : pgn,
          tabIndex,
          setTabIndex,
        }}
      />
    );
  }

  return null;
};
