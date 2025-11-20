import { useQuery as useQueryRQ } from "@tanstack/react-query";
import { indexPgnGames, CursorImpl } from "@chess-pgn/chess-pgn";
import { GameAdapter } from "../utils/gameAdapter.js";
import { useState } from "react";
import "react-tabs/style/react-tabs.css";
import "../stylesheets/grid.css";
import "../stylesheets/tabs.css";
import { PgnTabsPanel } from "./PgnTabsPanel.jsx";

// pgn file requests for url links
const getPgnFiles = async ({ pgnLinks }) => {
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

export const getPgnSummary = async (pgn) => {
  const ETC = ", etc.";
  const indices = indexPgnGames(pgn);
  const gmCt = indices.length;

  // iterate through game HEADERS only (fast!), gathering stats
  let high = 0,
    low = 9999,
    avg = 0,
    players = {};
  const openings = new Set();
  let mainEvent = null;

  // Use headers from indices instead of parsing full games
  for (const index of indices) {
    const headers = index.headers || {};

    const white = {
      name: headers.White || "?",
      elo: parseInt(headers.WhiteElo) || undefined,
    };
    const black = {
      name: headers.Black || "?",
      elo: parseInt(headers.BlackElo) || undefined,
    };
    const opening = headers.Opening || undefined;
    const event = headers.Event || "?";

    mainEvent ??= event;
    if (event !== mainEvent && !mainEvent.endsWith(ETC)) mainEvent += ETC;

    players[white.name] = white;
    players[black.name] = black;

    if (opening) openings.add(opening);

    const elos = [white.elo, black.elo];
    if (Number.isInteger(elos[0])) high = Math.max(high, elos[0]);
    if (Number.isInteger(elos[1])) high = Math.max(high, elos[1]);
    if (Number.isInteger(elos[0])) low = Math.min(low, elos[0]);
    if (Number.isInteger(elos[1])) low = Math.min(low, elos[1]);
    avg += (elos[0] || 0) + (elos[1] || 0);
  }

  avg = avg / gmCt / 2;

  // Create a wrapper that provides kokopu-like db.games() iterator
  // Games are parsed lazily only when actually iterated
  const db = {
    gameCount: () => gmCt,
    games: async function* () {
      const gameCursor = new CursorImpl(pgn, indices, { start: 0 });
      for await (const game of gameCursor) {
        yield new GameAdapter(game);
      }
    },
  };

  return {
    db,
    players,
    high,
    low,
    avg,
    count: gmCt,
    openings,
    event: mainEvent,
  };
};

/*
Arguments are url OR pgn.

If given a url, query TWIC for games; else load the pgn file directly.
*/
export const PgnTabsPanelContainer = ({ link }) => {
  const { url = null, pgn } = link;

  // controlled mode; see https://www.npmjs.com/package/react-tabs#controlled-vs-uncontrolled-mode
  const [tabIndex, setTabIndex] = useState(0);

  const dummyMetaPgnInput = { link: url, lastModified: "" };

  const { isError, isPending, error, data } = useQueryRQ({
    queryKey: ["pgnFiles", url],
    queryFn: async () => {
      const pgnFiles = await getPgnFiles({
        pgnLinks: [dummyMetaPgnInput],
      });
      return pgnFiles;
    },
    enabled: url !== null,
  });

  if (error) console.error(error.toLocaleString());
  if (url && isPending) return <span className="white">Loading...</span>;

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
};
