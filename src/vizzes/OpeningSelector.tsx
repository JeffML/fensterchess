/**
 * Opening selector for the chord diagram.
 * ECO-grouped, collapsible. Checking an opening highlights its
 * decade band in the chord diagram.
 */

import { useState } from "react";
import type { OpeningEntry } from "../datasource/fetchPlayerOpeningMatrix";

const ECO_LABELS: Record<string, string> = {
  A: "Flank / Irregular",
  B: "Semi-Open",
  C: "Open (1.e4 e5)",
  D: "Closed / Semi-Closed",
  E: "Indian Defenses",
};

const ECO_HSL: Record<string, [number, number]> = {
  A: [43, 72],
  B: [12, 66],
  C: [275, 50],
  D: [200, 60],
  E: [128, 46],
};

function pipColor(letter: string, decade: number, highlighted: boolean) {
  const [h, s] = ECO_HSL[letter];
  if (highlighted) return `hsl(${h},${Math.min(s + 22, 100)}%,74%)`;
  const l = 28 + decade * 3.8;
  return `hsl(${h},${s}%,${l}%)`;
}

interface OpeningSelectorProps {
  openings: Record<string, OpeningEntry[]>;
  highlightedBands: Set<string>; // "B:9"
  onHighlightChange: (bands: Set<string>) => void;
}

export function OpeningSelector({
  openings,
  highlightedBands,
  onHighlightChange,
}: OpeningSelectorProps) {
  const letters = Object.keys(openings).sort();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(letters));

  const toggleLetter = (letter: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(letter) ? next.delete(letter) : next.add(letter);
      return next;
    });
  };

  const toggleBand = (letter: string, decade: number) => {
    const key = `${letter}:${decade}`;
    const next = new Set(highlightedBands);
    next.has(key) ? next.delete(key) : next.add(key);
    onHighlightChange(next);
  };

  return (
    <div className="chord-panel chord-openings-panel">
      <div className="chord-panel-header">Openings</div>
      <div style={{ fontSize: "0.7em", color: "#888", marginBottom: 6 }}>
        Highlight a band in the diagram
      </div>
      <div className="chord-openings-list">
        {letters.map((letter) => {
          const items = openings[letter];
          const isOpen = expanded.has(letter);
          const anyHl = items.some((op) =>
            highlightedBands.has(`${letter}:${op.decade}`),
          );
          const [h, s] = ECO_HSL[letter];
          const baseClr = `hsl(${h},${s}%,60%)`;

          return (
            <div key={letter} className="chord-eco-group">
              <div
                className={`chord-eco-header${anyHl ? " highlighted" : ""}`}
                onClick={() => toggleLetter(letter)}
                style={{ color: anyHl ? `hsl(${h},${s}%,78%)` : baseClr }}
              >
                <span className="chord-eco-chevron">{isOpen ? "▾" : "▸"}</span>
                <span className="chord-eco-letter">{letter}</span>
                <span className="chord-eco-desc">{ECO_LABELS[letter]}</span>
              </div>
              {isOpen && (
                <ul className="chord-opening-items">
                  {items.map((op) => {
                    const bandKey = `${letter}:${op.decade}`;
                    const isHl = highlightedBands.has(bandKey);
                    const pip = pipColor(letter, op.decade, isHl);

                    return (
                      <li
                        key={`${op.eco}:${op.name}`}
                        className={`chord-opening-item${isHl ? " highlighted" : ""}`}
                        onClick={() => toggleBand(letter, op.decade)}
                      >
                        <span
                          className="chord-opening-pip"
                          style={{ background: pip }}
                        />
                        <span className="chord-opening-name">{op.name}</span>
                        <span className="chord-opening-eco">{op.eco}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
