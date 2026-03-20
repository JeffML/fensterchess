/**
 * Container for the Player ↔ Opening chord diagram visualization.
 * Manages player selection, highlight state, and data fetching.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPlayerOpeningMatrix,
  fetchOpeningsForBand,
} from "../datasource/fetchPlayerOpeningMatrix";
import { ChordDiagram, PALETTE } from "./ChordDiagram";
import type { ActivePlayer, HighlightBand } from "./ChordDiagram";
import { PlayerSelector } from "./PlayerSelector";
import { OpeningSelector } from "./OpeningSelector";

export function ChordVizContainer() {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [playersCollapsed, setPlayersCollapsed] = useState(false);

  // Initial load — full player list + opening groups
  const {
    data: fullData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["playerOpeningMatrix"],
    queryFn: fetchPlayerOpeningMatrix,
    staleTime: 1000 * 60 * 10,
  });

  // Band-scoped openings query — fires only when a band is clicked with players selected
  const bandParts = selectedBand ? selectedBand.split(":") : null;
  const { data: bandData, isFetching: bandLoading } = useQuery({
    queryKey: ["bandOpenings", selectedBand, selectedPlayers],
    queryFn: () =>
      fetchOpeningsForBand(
        selectedPlayers,
        bandParts![0],
        parseInt(bandParts![1], 10),
      ),
    enabled: selectedBand !== null && selectedPlayers.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return <div className="chord-loading">Loading player data…</div>;
  }
  if (isError) {
    return (
      <div className="chord-error">
        Unable to load player data.{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
  if (!fullData) return null;

  // Build the active player list for the diagram
  const activePlayers: ActivePlayer[] = selectedPlayers
    .map((key, idx) => {
      const entry = fullData.matrix.players[key];
      if (!entry) return null;
      return { key, entry, color: PALETTE[idx] };
    })
    .filter((x): x is ActivePlayer => x !== null);

  const highlightBands: HighlightBand[] = selectedBand
    ? [
        {
          ecoLetter: selectedBand.split(":")[0],
          decade: parseInt(selectedBand.split(":")[1], 10),
        },
      ]
    : [];

  const handleBandClick = (letter: string, decade: number) => {
    const key = `${letter}:${decade}`;
    setSelectedBand((prev) => (prev === key ? null : key));
  };

  const handlePlayerChange = (newSelected: string[]) => {
    setSelectedPlayers(newSelected);
    setSelectedBand(null);
  };

  let explanation: string;
  if (activePlayers.length === 0) {
    explanation =
      "Select up to 3 players from the left panel. Each player's games will appear as a colored arc, connected by ribbons to the ECO opening family arcs (A–E).";
  } else if (activePlayers.length === 1) {
    const name = activePlayers[0].entry.displayName;
    explanation =
      `The colored arc shows ${name}'s games distributed across ECO families (A–E). ` +
      "Each family arc is split into decade bands (A0x, A1x … A9x) — thicker bands mean more games in that group. " +
      "Click a decade band to see its named openings.";
  } else {
    const names = activePlayers.map((p) => p.entry.displayName).join(" vs ");
    explanation =
      `Ribbons connect each player arc (${names}) to the ECO family arcs. ` +
      "Ribbon thickness reflects game count — wider means more games in that opening family. " +
      "Click a decade band to see its named openings.";
  }

  return (
    <div className="chord-container">
      <div className="chord-subtitle">
        Select up to 3 players to compare their ECO opening repertoire
      </div>
      <div className="chord-explain">{explanation}</div>
      <div className="chord-layout">
        {playersCollapsed ? (
          <div
            className="chord-players-collapsed"
            onClick={() => setPlayersCollapsed(false)}
            title="Expand player panel"
          >
            <span className="chord-players-collapsed-label">Players</span>
            {selectedPlayers.map((key, idx) => (
              <span
                key={key}
                className="chord-players-collapsed-dot"
                style={{ background: PALETTE[idx] }}
              />
            ))}
          </div>
        ) : (
          <PlayerSelector
            players={fullData.matrix.players}
            selected={selectedPlayers}
            onChange={handlePlayerChange}
            onCollapse={() => setPlayersCollapsed(true)}
          />
        )}
        <div className="chord-diagram-wrapper">
          {activePlayers.length === 0 ? (
            <div className="chord-empty-hint">
              Select players from the list on the left to display the chord
              diagram
            </div>
          ) : (
            <ChordDiagram
              activePlayers={activePlayers}
              highlightBands={highlightBands}
              onBandClick={handleBandClick}
            />
          )}
        </div>
        <OpeningSelector
          hasPlayers={selectedPlayers.length > 0}
          selectedBand={selectedBand}
          bandOpenings={bandData?.openings ?? []}
          isLoading={bandLoading}
        />
      </div>
    </div>
  );
}
