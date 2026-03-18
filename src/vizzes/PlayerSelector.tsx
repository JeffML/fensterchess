/**
 * Player selector for the chord diagram.
 * Maximum 3 players can be selected simultaneously.
 */

import { useState } from "react";
import type { PlayerEcoMatrix } from "../datasource/fetchPlayerOpeningMatrix";
import { PALETTE } from "./ChordDiagram";

const MAX_PLAYERS = 3;

type SortMode = "name" | "elo";

interface PlayerSelectorProps {
  players: PlayerEcoMatrix["players"];
  selected: string[];
  onChange: (selected: string[]) => void;
  onCollapse: () => void;
}

export function PlayerSelector({
  players,
  selected,
  onChange,
  onCollapse,
}: PlayerSelectorProps) {
  const [sort, setSort] = useState<SortMode>("elo");

  const entries = Object.entries(players);

  const sorted = [...entries].sort(([, a], [, b]) => {
    if (sort === "elo") {
      const ra = a.peakRating ?? 0;
      const rb = b.peakRating ?? 0;
      return rb - ra;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else if (selected.length < MAX_PLAYERS) {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="chord-panel chord-players-panel">
      <div className="chord-panel-header">
        Players
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            className={`chord-sort-btn${sort === "elo" ? " active" : ""}`}
            onClick={() => setSort("elo")}
            title="Sort by peak ELO"
          >
            ELO
          </button>
          <button
            className={`chord-sort-btn${sort === "name" ? " active" : ""}`}
            onClick={() => setSort("name")}
            title="Sort A–Z"
          >
            A–Z
          </button>
          <button
            className="chord-sort-btn"
            onClick={onCollapse}
            title="Collapse panel"
          >
            ◀
          </button>
        </span>
      </div>
      <div style={{ fontSize: "0.7em", color: "#888", marginBottom: 6 }}>
        Select up to {MAX_PLAYERS}
      </div>
      <ul className="chord-player-list">
        {sorted.map(([key, entry]) => {
          const idx = selected.indexOf(key);
          const isChecked = idx !== -1;
          const isCapped = !isChecked && selected.length >= MAX_PLAYERS;
          const slotColor = isChecked ? PALETTE[idx] : "#555";

          return (
            <li
              key={key}
              className={`chord-player-item${isCapped ? " capped" : ""}`}
              onClick={() => !isCapped && toggle(key)}
            >
              <span
                className="chord-player-dot"
                style={{ background: slotColor, opacity: isChecked ? 1 : 0.22 }}
              />
              <span className="chord-player-name">{entry.displayName}</span>
              {entry.peakRating && (
                <span className="chord-player-elo">{entry.peakRating}</span>
              )}
              <span className="chord-player-games">
                {entry.totalGames.toLocaleString()}g
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
