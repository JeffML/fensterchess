/**
 * ECO Theory Heatmap.
 * Shows how many named opening variations exist in each ECO decade group (A0x–E9x).
 * Data is computed directly from the OpeningBookContext — no extra fetch.
 * Right panel provides a two-level drill-down: ECO code → named variations.
 */

import { useContext, useMemo, useState } from "react";
import { OpeningBookContext } from "../contexts/OpeningBookContext";
import type { Opening } from "../types";

const ECO_KEYS = ["A", "B", "C", "D", "E"] as const;
type EcoKey = (typeof ECO_KEYS)[number];

const ECO_LABELS: Record<EcoKey, string> = {
  A: "Flank/Irr.",
  B: "Semi-Open",
  C: "Open",
  D: "Closed",
  E: "Indian",
};

// Match chord/radar ECO palette
const ECO_HUE: Record<EcoKey, number> = {
  A: 43,
  B: 12,
  C: 275,
  D: 200,
  E: 128,
};

interface CodeGroup {
  code: string;
  canonical: string;
  variations: string[];
}

interface HeatmapData {
  counts: Record<EcoKey, number[]>;
  maxPerLetter: Record<EcoKey, number>;
  codeGroups: Record<string, CodeGroup>;
}

function buildHeatmapData(book: Record<string, Opening>): HeatmapData {
  const counts: Record<EcoKey, number[]> = {
    A: Array(10).fill(0),
    B: Array(10).fill(0),
    C: Array(10).fill(0),
    D: Array(10).fill(0),
    E: Array(10).fill(0),
  };
  const codeGroups: Record<string, CodeGroup> = {};

  for (const opening of Object.values(book)) {
    const eco = opening.eco;
    if (!eco || eco.length < 3) continue;
    const letter = eco[0] as EcoKey;
    const decade = parseInt(eco[1], 10);
    if (!ECO_KEYS.includes(letter) || isNaN(decade)) continue;

    counts[letter][decade]++;

    if (!codeGroups[eco]) {
      codeGroups[eco] = { code: eco, canonical: opening.name, variations: [] };
    }
    codeGroups[eco].variations.push(opening.name);
  }

  // Compute canonical name: prefer entry with no ": " (base opening), else shortest
  for (const grp of Object.values(codeGroups)) {
    const base = grp.variations.find((n) => !n.includes(": "));
    grp.canonical =
      base ?? [...grp.variations].sort((a, b) => a.length - b.length)[0];
    // Sort variations: base first, then alphabetical
    grp.variations = [
      ...grp.variations.filter((n) => !n.includes(": ")),
      ...grp.variations.filter((n) => n.includes(": ")).sort(),
    ];
  }

  const maxPerLetter = {} as Record<EcoKey, number>;
  for (const k of ECO_KEYS) {
    maxPerLetter[k] = Math.max(...counts[k]);
  }

  return { counts, maxPerLetter, codeGroups };
}

function cellColor(
  letterHue: number,
  count: number,
  max: number,
): { bg: string; t: number } {
  const t = max > 0 ? count / max : 0;
  const sat = Math.round(20 + 55 * t);
  const lit = Math.round(8 + 42 * t);
  return { bg: `hsl(${letterHue},${sat}%,${lit}%)`, t };
}

interface SelectedCell {
  letter: EcoKey;
  decade: number;
}

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

export function EcoHeatmapContainer() {
  const ctx = useContext(OpeningBookContext);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [openCodes, setOpenCodes] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const data = useMemo<HeatmapData | null>(() => {
    if (!ctx?.openingBook) return null;
    return buildHeatmapData(ctx.openingBook);
  }, [ctx?.openingBook]);

  function toggleCode(code: string) {
    setOpenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function handleCellClick(letter: EcoKey, decade: number) {
    setSelected({ letter, decade });
    setOpenCodes(new Set()); // collapse all when switching cells
  }

  if (!ctx?.openingBook || !data) {
    return <div className="chord-loading">Loading opening book…</div>;
  }

  const { counts, maxPerLetter, codeGroups } = data;

  // Codes for the selected cell
  const selectedCodes: CodeGroup[] = selected
    ? ECO_KEYS.includes(selected.letter)
      ? Object.values(codeGroups)
          .filter(
            (g) =>
              g.code[0] === selected.letter &&
              parseInt(g.code[1], 10) === selected.decade,
          )
          .sort((a, b) => a.code.localeCompare(b.code))
      : []
    : [];

  const selectedCount = selected
    ? counts[selected.letter][selected.decade]
    : 0;

  return (
    <div className="heatmap-outer">
      {/* ── Left: grid ── */}
      <div className="heatmap-left">
        <div className="heatmap-explain">
          Each cell shows how many named variations exist in that ECO group (e.g.
          C4x&nbsp;=&nbsp;C40–C49). Brighter&nbsp;=&nbsp;richer theory. Click a cell to
          explore.
        </div>

        <div className="heatmap-grid-wrap">
          {/* Column headers */}
          <div className="heatmap-grid-header">
            <div className="heatmap-row-label" />
            {ECO_KEYS.map((letter) => (
              <div
                key={letter}
                className="heatmap-col-header"
                style={{ color: `hsl(${ECO_HUE[letter]},70%,65%)` }}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Rows ×0–×9 */}
          {Array.from({ length: 10 }, (_, decade) => (
            <div key={decade} className="heatmap-grid-row">
              <div className="heatmap-row-label">×{decade}</div>
              {ECO_KEYS.map((letter) => {
                const count = counts[letter][decade];
                const { bg, t } = cellColor(
                  ECO_HUE[letter],
                  count,
                  maxPerLetter[letter],
                );
                const isSel =
                  selected?.letter === letter && selected?.decade === decade;
                return (
                  <div
                    key={letter}
                    className={`heatmap-cell${isSel ? " selected" : ""}`}
                    style={{ background: bg }}
                    onClick={() => handleCellClick(letter, decade)}
                    onMouseEnter={(e) =>
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        text: `ECO ${letter}${decade}x — ${count} named variations`,
                      })
                    }
                    onMouseMove={(e) =>
                      setTooltip((prev) =>
                        prev
                          ? { ...prev, x: e.clientX, y: e.clientY }
                          : null,
                      )
                    }
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span
                      className="heatmap-cell-count"
                      style={{ opacity: t > 0.2 ? 1 : 0.5 }}
                    >
                      {count > 0 ? count : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Color scale legend */}
          <div className="heatmap-legend-row">
            <div className="heatmap-row-label" />
            {ECO_KEYS.map((letter) => (
              <div key={letter} className="heatmap-legend-item">
                <div
                  className="heatmap-legend-scale"
                  style={{
                    background: `linear-gradient(to right, hsl(${ECO_HUE[letter]},20%,8%), hsl(${ECO_HUE[letter]},75%,50%))`,
                  }}
                />
                <div className="heatmap-legend-range">
                  <span>0</span>
                  <span>{maxPerLetter[letter]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: drill-down panel ── */}
      <div className="heatmap-panel">
        <div className="heatmap-panel-header">
          {selected ? (
            <>
              <span
                style={{
                  color: `hsl(${ECO_HUE[selected.letter]},70%,65%)`,
                }}
              >
                ECO {selected.letter}
                {selected.decade}x
              </span>
              &nbsp;&nbsp;
              <span className="heatmap-panel-subtitle">
                {ECO_LABELS[selected.letter]}
              </span>
            </>
          ) : (
            "Openings"
          )}
        </div>

        {selected && (
          <div className="heatmap-panel-cell-label">
            {selectedCount} named variations — click a code to expand
          </div>
        )}

        <div className="heatmap-panel-list">
          {!selected ? (
            <div className="heatmap-panel-hint">
              Click a cell in the heatmap to see named openings
            </div>
          ) : selectedCodes.length === 0 ? (
            <div className="heatmap-panel-hint">
              No named openings in this group
            </div>
          ) : (
            selectedCodes.map(({ code, canonical, variations }) => {
              const isOpen = openCodes.has(code);
              return (
                <div key={code} className="heatmap-eco-row">
                  <div
                    className={`heatmap-eco-header${isOpen ? " open" : ""}`}
                    onClick={() => toggleCode(code)}
                  >
                    <span
                      className={`heatmap-eco-chevron${isOpen ? " open" : ""}`}
                    >
                      &#9658;
                    </span>
                    <span className="heatmap-eco-code">{code}</span>
                    <span className="heatmap-eco-name">{canonical}</span>
                    <span className="heatmap-eco-count">
                      {variations.length}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="heatmap-eco-variations">
                      {variations.map((name, i) => (
                        <div key={i} className="heatmap-variation-item">
                          <span className="heatmap-variation-name">{name}</span>
                          <span className="heatmap-variation-eco">{code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
