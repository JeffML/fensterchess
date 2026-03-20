/**
 * Opening diversity score visualization.
 * Computes Shannon entropy of each player's ECO family distribution
 * and renders a sorted horizontal bar chart.
 * Reuses the playerOpeningMatrix query — zero extra data cost.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayerOpeningMatrix } from "../datasource/fetchPlayerOpeningMatrix";
import type { PlayerEcoEntry } from "../datasource/fetchPlayerOpeningMatrix";

const ECO_KEYS = ["A", "B", "C", "D", "E"] as const;
type EcoKey = (typeof ECO_KEYS)[number];

const ECO_LABELS: Record<EcoKey, string> = {
  A: "Flank/Irr.",
  B: "Semi-Open",
  C: "Open",
  D: "Closed",
  E: "Indian",
};

// Matches chord diagram's ECO_HSL palette
const ECO_COLORS: Record<EcoKey, string> = {
  A: "hsl(43,72%,48%)",
  B: "hsl(12,66%,54%)",
  C: "hsl(275,50%,58%)",
  D: "hsl(200,60%,50%)",
  E: "hsl(128,46%,44%)",
};

const MAX_ENTROPY = Math.log2(5); // ≈ 2.322 bits (perfectly uniform across 5 families)
const TICKS = [0, 0.5, 1.0, 1.5, 2.0, MAX_ENTROPY];

function computeEntropy(entry: PlayerEcoEntry): number {
  const total = entry.totalGames || 1;
  let h = 0;
  for (const eco of ECO_KEYS) {
    const count = entry.eco[eco]?.total ?? 0;
    if (count === 0) continue;
    const p = count / total;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Interpolate bar color from orange (specialist) to blue (diverse) */
function barColor(h: number): string {
  const t = h / MAX_ENTROPY;
  const r = Math.round(232 + (91 - 232) * t);
  const g = Math.round(124 + (155 - 124) * t);
  const b = Math.round(71 + (213 - 71) * t);
  return `rgb(${r},${g},${b})`;
}

interface TooltipState {
  x: number;
  y: number;
  key: string;
}

export function DiversityVizContainer() {
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

  const rows = Object.entries(fullData.matrix.players)
    .map(([key, entry]) => ({ key, entry, h: computeEntropy(entry) }))
    .sort((a, b) => b.h - a.h);

  const tooltipRow = tooltip ? rows.find((r) => r.key === tooltip.key) : null;

  return (
    <div className="chord-container diversity-container">
      <div className="chord-subtitle">
        Shannon entropy of ECO family distribution — higher = more varied repertoire
      </div>
      <div className="chord-explain">
        Each player's score is the <strong>Shannon entropy</strong> of their
        games across ECO families A–E. Max ≈ 2.32 bits (perfectly uniform).
        A score near 0 means nearly all games in one family — a specialist.
        The thin bar below each score shows the actual A–E breakdown.
      </div>

      <div className="diversity-chart">
        {/* Scale header */}
        <div className="diversity-scale-row">
          <div className="diversity-name-col" />
          <div className="diversity-bar-track diversity-scale-track">
            {TICKS.map((t) => {
              const pct = (t / MAX_ENTROPY) * 100;
              return (
                <div key={t} className="diversity-tick" style={{ left: `${pct}%` }}>
                  <span className="diversity-tick-label">
                    {t === MAX_ENTROPY ? `${t.toFixed(2)} (max)` : t.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player rows */}
        {rows.map(({ key, entry, h }, rank) => {
          const total = entry.totalGames || 1;
          const barPct = (h / MAX_ENTROPY) * 100;
          const color = barColor(h);

          return (
            <div key={key} className="diversity-row">
              <div className="diversity-rank">{rank + 1}</div>
              <div className="diversity-name-col" title={key}>
                {entry.displayName}
              </div>
              <div className="diversity-bar-track">
                {/* Entropy bar */}
                <div
                  className="diversity-entropy-wrap"
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, key })
                  }
                  onMouseMove={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, key })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="diversity-entropy-bar"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                  <span className="diversity-entropy-label">
                    <strong>{h.toFixed(3)}</strong> bits
                  </span>
                </div>

                {/* Stacked ECO mini-bar */}
                <div className="diversity-eco-bar">
                  {ECO_KEYS.map((eco) => {
                    const pct = ((entry.eco[eco]?.total ?? 0) / total) * 100;
                    return (
                      <div
                        key={eco}
                        className="diversity-eco-segment"
                        style={{
                          width: `${pct}%`,
                          background: ECO_COLORS[eco],
                        }}
                        title={`ECO ${eco} (${ECO_LABELS[eco]}): ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* ECO legend */}
        <div className="diversity-legend">
          {ECO_KEYS.map((eco) => (
            <div key={eco} className="diversity-legend-item">
              <span
                className="diversity-legend-swatch"
                style={{ background: ECO_COLORS[eco] }}
              />
              ECO {eco} — {ECO_LABELS[eco]}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && tooltipRow && (
        <div
          className="diversity-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="diversity-tt-name">
            {tooltipRow.entry.displayName} — {tooltipRow.h.toFixed(3)} bits
          </div>
          {ECO_KEYS.map((eco) => {
            const pct =
              ((tooltipRow.entry.eco[eco]?.total ?? 0) /
                (tooltipRow.entry.totalGames || 1)) *
              100;
            return (
              <div key={eco} className="diversity-tt-eco">
                <span className="diversity-tt-eco-label">
                  ECO {eco} ({ECO_LABELS[eco]})
                </span>
                <span>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
