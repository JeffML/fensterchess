/**
 * Radar / spider chart showing each player's ECO opening family distribution (A–E).
 * Reuses the same playerOpeningMatrix query as ChordVizContainer — data is cached.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerOpeningMatrix } from "../datasource/fetchPlayerOpeningMatrix";
import { PALETTE } from "./ChordDiagram";
import { PlayerSelector } from "./PlayerSelector";

const ECO_KEYS = ["A", "B", "C", "D", "E"] as const;
type EcoKey = (typeof ECO_KEYS)[number];

const ECO_LABELS: Record<EcoKey, string> = {
  A: "Flank/Irr.",
  B: "Semi-Open",
  C: "Open",
  D: "Closed",
  E: "Indian",
};

// SVG geometry constants
const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 160;
const N = ECO_KEYS.length;
const LEVELS = 4;

function radarAngle(i: number) {
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function radarPt(i: number, r: number): [number, number] {
  return [CX + r * Math.cos(radarAngle(i)), CY + r * Math.sin(radarAngle(i))];
}

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

export function RadarVizContainer() {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playersCollapsed, setPlayersCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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

  // Compute per-player ECO percentages
  const playerData = selectedPlayers
    .map((key, idx) => {
      const entry = fullData.matrix.players[key];
      if (!entry) return null;
      const total = entry.totalGames || 1;
      const pcts = {} as Record<EcoKey, number>;
      for (const eco of ECO_KEYS) {
        pcts[eco] = ((entry.eco[eco]?.total ?? 0) / total) * 100;
      }
      return { key, entry, pcts, color: PALETTE[idx] };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Auto-scale: outer ring = highest value across all selected players, rounded up to nearest 5%
  const allValues = playerData.flatMap((p) =>
    ECO_KEYS.map((eco) => p.pcts[eco]),
  );
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 40;
  const SCALE_MAX = Math.max(5, Math.ceil(dataMax / 5) * 5);

  function pctToR(pct: number) {
    return (pct / SCALE_MAX) * R;
  }

  const hasPlayers = playerData.length > 0;

  // ── Grid rings ──
  const gridRings = Array.from({ length: LEVELS }, (_, lv) => {
    const r = (R * (lv + 1)) / LEVELS;
    const points = ECO_KEYS.map((_, i) => radarPt(i, r).join(",")).join(" ");
    const isOuter = lv === LEVELS - 1;
    const labelPct = Math.round(((lv + 1) * SCALE_MAX) / LEVELS);
    const [lx, ly] = radarPt(0, r);
    return (
      <g key={lv}>
        <polygon
          points={points}
          fill="none"
          stroke={isOuter ? "#555" : "#333"}
          strokeWidth={isOuter ? 1.5 : 0.8}
        />
        <text x={lx + 4} y={ly - 3} fill="#444" fontSize={9}>
          {labelPct}%
        </text>
      </g>
    );
  });

  // ── Axis spokes + labels ──
  const axes = ECO_KEYS.map((eco, i) => {
    const [x, y] = radarPt(i, R);
    const [lx, ly] = radarPt(i, R + 22);
    return (
      <g key={eco}>
        <line x1={CX} y1={CY} x2={x} y2={y} stroke="#3a3a3a" strokeWidth={1} />
        <text
          x={lx}
          y={ly - 4}
          textAnchor="middle"
          fill="#e0e0e0"
          fontSize={16}
          fontWeight="bold"
          fontFamily="Georgia, serif"
        >
          {eco}
        </text>
        <text x={lx} y={ly + 12} textAnchor="middle" fill="#999" fontSize={11}>
          {ECO_LABELS[eco]}
        </text>
      </g>
    );
  });

  // ── Player polygons + vertex dots ──
  const polygons = playerData.map(({ key, entry, pcts, color }) => {
    const pointStr = ECO_KEYS.map((eco, i) =>
      radarPt(i, pctToR(pcts[eco])).join(","),
    ).join(" ");

    const dots = ECO_KEYS.map((eco, i) => {
      const [cx2, cy2] = radarPt(i, pctToR(pcts[eco]));
      return (
        <circle
          key={eco}
          cx={cx2}
          cy={cy2}
          r={4}
          fill={color}
          stroke="#222"
          strokeWidth={1.5}
          style={{ cursor: "default" }}
          onMouseEnter={(e) =>
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              text: `${entry.displayName} · ECO ${eco} (${ECO_LABELS[eco]}): ${pcts[eco].toFixed(1)}%`,
            })
          }
          onMouseMove={(e) =>
            setTooltip((prev) =>
              prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
            )
          }
          onMouseLeave={() => setTooltip(null)}
        />
      );
    });

    return (
      <g key={key}>
        <polygon
          points={pointStr}
          fill={color}
          fillOpacity={0.12}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.85}
        />
        {dots}
      </g>
    );
  });

  const explanation = hasPlayers
    ? `Each axis is an ECO family (A–E). The outer ring = ${SCALE_MAX}%. Hover a vertex to see exact percentages.`
    : "Select up to 3 players to compare their opening repertoire across ECO families (A–E). Each axis shows the percentage of games in that family.";

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
            onChange={setSelectedPlayers}
            onCollapse={() => setPlayersCollapsed(true)}
          />
        )}

        <div className="radar-svg-wrap">
          {!hasPlayers ? (
            <div className="radar-empty-hint">
              Select players from the list on the left to display the radar
            </div>
          ) : (
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {gridRings}
              {axes}
              {polygons}
            </svg>
          )}
        </div>

        {hasPlayers && (
          <div className="radar-legend">
            {playerData.map(({ key, entry, color }) => (
              <div key={key} className="radar-legend-item">
                <span
                  className="radar-legend-dot"
                  style={{ background: color }}
                />
                {entry.displayName}
              </div>
            ))}
            <div className="radar-legend-item radar-legend-scale">
              outer ring = {SCALE_MAX}%
            </div>
          </div>
        )}
      </div>

      {tooltip && (
        <div
          className="radar-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
