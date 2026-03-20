/**
 * Opening panel for the chord diagram.
 * Shows a flat list of named openings for the decade band clicked in the diagram.
 */

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

interface OpeningSelectorProps {
  hasPlayers: boolean;
  selectedBand: string | null; // e.g. "B:9"
  bandOpenings: OpeningEntry[];
  isLoading: boolean;
}

export function OpeningSelector({
  hasPlayers,
  selectedBand,
  bandOpenings,
  isLoading,
}: OpeningSelectorProps) {
  if (!hasPlayers || !selectedBand) {
    return (
      <div className="chord-panel chord-openings-panel">
        <div className="chord-panel-header">Openings</div>
        <div style={{ fontSize: "0.8em", color: "#666", marginTop: 12 }}>
          {!hasPlayers
            ? "Select a player to begin"
            : "Click a decade band in the diagram to see its openings"}
        </div>
      </div>
    );
  }

  const [letter, decadeStr] = selectedBand.split(":");
  const decade = parseInt(decadeStr, 10);
  const [h, s] = ECO_HSL[letter] ?? [0, 0];
  const decadeLabel = `${letter}${decade}0\u2013${letter}${decade}9`;
  const headerColor = `hsl(${h},${s}%,68%)`;

  return (
    <div className="chord-panel chord-openings-panel">
      <div className="chord-panel-header">Openings</div>
      <div
        style={{
          fontSize: "0.78em",
          color: headerColor,
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {decadeLabel} &middot; {ECO_LABELS[letter]}
      </div>
      {isLoading ? (
        <div style={{ fontSize: "0.8em", color: "#555" }}>Loading…</div>
      ) : bandOpenings.length === 0 ? (
        <div style={{ fontSize: "0.8em", color: "#555" }}>
          No named openings in this band
        </div>
      ) : (
        <ul className="chord-opening-items">
          {bandOpenings.map((op) => {
            const href = op.fen
              ? `${window.location.origin}?fen=${encodeURIComponent(op.fen)}`
              : undefined;
            return (
              <li
                key={`${op.eco}:${op.name}`}
                className={`chord-opening-item${href ? " clickable" : ""}`}
                onClick={href ? () => window.open(href, "_blank") : undefined}
                title={href ? `Open ${op.name} in Search` : undefined}
              >
                <span
                  className="chord-opening-pip"
                  style={{
                    background: `hsl(${h},${s}%,${28 + decade * 3.8}%)`,
                  }}
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
}
