/**
 * SVG chord diagram: active players ↔ ECO letters.
 * ECO arcs are internally segmented into decade bands (E0x–E9x).
 * Selected openings highlight their specific decade band.
 */

import { useRef, useEffect } from "react";
import type { PlayerEcoEntry } from "../datasource/fetchPlayerOpeningMatrix";

export interface ActivePlayer {
  key: string; // lowercase player name (index key)
  entry: PlayerEcoEntry;
  color: string; // assigned from PALETTE by selection slot
}

export interface HighlightBand {
  ecoLetter: string;
  decade: number;
}

interface ChordDiagramProps {
  activePlayers: ActivePlayer[];
  highlightBands: HighlightBand[]; // empty = no highlight
}

// Fixed palette — color assigned by slot, not by player name
const PALETTE = ["#5b9bd5", "#e87c47", "#67c24a"];

const ECO_LETTERS = ["A", "B", "C", "D", "E"] as const;

// ECO letter: [hue, saturation] for HSL shading
const ECO_HSL: Record<string, [number, number]> = {
  A: [43, 72],
  B: [12, 66],
  C: [275, 50],
  D: [200, 60],
  E: [128, 46],
};

const R_OUT = 224,
  R_IN = 196;
const W = 540,
  H = 540;

function ecoBaseColor(letter: string) {
  const [h, s] = ECO_HSL[letter];
  return `hsl(${h},${s}%,54%)`;
}

function bandColor(letter: string, decadeIdx: number, highlighted: boolean) {
  const [h, s] = ECO_HSL[letter];
  if (highlighted) return `hsl(${h},${Math.min(s + 22, 100)}%,74%)`;
  const l = 28 + decadeIdx * 3.8;
  return `hsl(${h},${s}%,${l}%)`;
}

function pt(a: number, r: number): [number, number] {
  return [r * Math.cos(a), r * Math.sin(a)];
}

function arcPath(a0: number, a1: number, r0: number, r1: number) {
  const la = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(a0, r0),
    [x1, y1] = pt(a0, r1);
  const [x2, y2] = pt(a1, r1),
    [x3, y3] = pt(a1, r0);
  return `M${x0},${y0}L${x1},${y1}A${r1},${r1} 0 ${la} 1 ${x2},${y2}L${x3},${y3}A${r0},${r0} 0 ${la} 0 ${x0},${y0}Z`;
}

function ribbonPath(
  a1s: number,
  a1e: number,
  a2s: number,
  a2e: number,
  r: number,
) {
  const la1 = a1e - a1s > Math.PI ? 1 : 0;
  const la2 = a2e - a2s > Math.PI ? 1 : 0;
  const [ax, ay] = pt(a1s, r),
    [bx, by] = pt(a1e, r);
  const [cx, cy] = pt(a2e, r),
    [dx, dy] = pt(a2s, r);
  return `M${ax},${ay}A${r},${r} 0 ${la1} 1 ${bx},${by}Q0,0 ${cx},${cy}A${r},${r} 0 ${la2} 0 ${dx},${dy}Q0,0 ${ax},${ay}Z`;
}

export function ChordDiagram({
  activePlayers,
  highlightBands,
}: ChordDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = "";

    if (activePlayers.length === 0) return;

    const hlBandSet = new Set(
      highlightBands.map((b) => `${b.ecoLetter}:${b.decade}`),
    );
    const hlEcoSet = new Set(highlightBands.map((b) => b.ecoLetter));
    const anyHl = hlBandSet.size > 0;

    // Build group list: players first, then ECO letters
    type Group = { id: string; type: "player" | "eco"; color: string };
    const groups: Group[] = [
      ...activePlayers.map((p) => ({
        id: p.key,
        type: "player" as const,
        color: p.color,
      })),
      ...ECO_LETTERS.map((e) => ({
        id: e,
        type: "eco" as const,
        color: ecoBaseColor(e),
      })),
    ];

    // Player × ECO matrix from live data
    const matrix: number[][] = activePlayers.map((p) =>
      ECO_LETTERS.map((e) => p.entry.eco[e]?.total ?? 0),
    );

    // Totals per group
    const totals = groups.map((g, i) => {
      if (g.type === "player") return matrix[i].reduce((s, v) => s + v, 0);
      const ei = ECO_LETTERS.indexOf(g.id as (typeof ECO_LETTERS)[number]);
      return activePlayers.reduce((s, _, pi) => s + (matrix[pi][ei] ?? 0), 0);
    });

    const totalFlow = totals.reduce((s, v) => s + v, 0) / 2;
    if (totalFlow === 0) return;

    const GAP = 0.045;
    const avail = Math.PI * 2 - GAP * groups.length;

    // Arc angles
    let cursor = -Math.PI / 2;
    const angles = groups.map((_, i) => {
      const span = (totals[i] / totalFlow) * (avail / 2);
      const start = cursor;
      cursor += span + GAP;
      return { start, end: start + span, mid: start + span / 2 };
    });

    // SVG namespace helper
    const ns = (tag: string) =>
      document.createElementNS("http://www.w3.org/2000/svg", tag);

    // ── Defs: glow filter ──
    const defs = ns("defs");
    const filt = ns("filter");
    filt.setAttribute("id", "glow");
    ["x", "y"].forEach((a) => filt.setAttribute(a, "-60%"));
    ["width", "height"].forEach((a) => filt.setAttribute(a, "220%"));
    const blur = ns("feGaussianBlur");
    blur.setAttribute("stdDeviation", "4.5");
    blur.setAttribute("result", "b");
    const merge = ns("feMerge");
    ["b", "SourceGraphic"].forEach((inp) => {
      const n = ns("feMergeNode");
      n.setAttribute("in", inp);
      merge.appendChild(n);
    });
    filt.appendChild(blur);
    filt.appendChild(merge);
    defs.appendChild(filt);
    svg.appendChild(defs);

    const tooltip = tooltipRef.current;
    const showTip = (e: MouseEvent, text: string) => {
      if (!tooltip) return;
      tooltip.textContent = text;
      tooltip.style.display = "block";
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY - 28}px`;
    };
    const moveTip = (e: MouseEvent) => {
      if (!tooltip) return;
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY - 28}px`;
    };
    const hideTip = () => {
      if (tooltip) tooltip.style.display = "none";
    };

    // Build chord offsets
    const pOff: Record<string, number> = {};
    const eOff: Record<string, number> = {};
    activePlayers.forEach((p) => {
      const i = groups.findIndex((g) => g.id === p.key);
      pOff[p.key] = angles[i].start;
    });
    ECO_LETTERS.forEach((e) => {
      const i = groups.findIndex((g) => g.id === e);
      eOff[e] = angles[i].start;
    });

    // ── 1. Chord ribbons ──
    activePlayers.forEach((player, pi) => {
      const gi = groups.findIndex((g) => g.id === player.key);
      const pAng = angles[gi];
      const pTot = totals[gi];

      ECO_LETTERS.forEach((eco) => {
        const ei = ECO_LETTERS.indexOf(eco);
        const eGi = groups.findIndex((g) => g.id === eco);
        const eTot = totals[eGi];
        const val = matrix[pi][ei];
        if (!val) return;

        const pSpan = (val / pTot) * (pAng.end - pAng.start);
        const eSpan = (val / eTot) * (angles[eGi].end - angles[eGi].start);
        const p1s = pOff[player.key];
        pOff[player.key] += pSpan;
        const e1s = eOff[eco];
        eOff[eco] += eSpan;

        const isHl = anyHl && hlEcoSet.has(eco);
        const opac = isHl ? 0.62 : anyHl ? 0.04 : 0.21;

        const path = ns("path");
        path.setAttribute(
          "d",
          ribbonPath(p1s, p1s + pSpan, e1s, e1s + eSpan, R_IN),
        );
        path.setAttribute("fill", player.color);
        path.setAttribute("fill-opacity", String(opac));
        if (isHl) {
          path.setAttribute("stroke", player.color);
          path.setAttribute("stroke-width", "1");
          path.setAttribute("stroke-opacity", "0.65");
        }
        path.addEventListener("mouseenter", (e) =>
          showTip(
            e as MouseEvent,
            `${player.entry.displayName} → ECO ${eco}: ${val.toLocaleString()} games`,
          ),
        );
        path.addEventListener("mousemove", (e) => moveTip(e as MouseEvent));
        path.addEventListener("mouseleave", hideTip);
        svg.appendChild(path);
      });
    });

    // ── 2. ECO arcs with decade sub-bands ──
    groups.forEach((g, i) => {
      if (g.type !== "eco") return;
      const ang = angles[i];
      const [h, s] = ECO_HSL[g.id];
      const ecoIsHl = anyHl && hlEcoSet.has(g.id);
      const ecoDim = anyHl && !ecoIsHl;

      // Decade totals for this ECO from active players
      const decTotals = Array.from({ length: 10 }, (_, di) =>
        activePlayers.reduce(
          (sum, p) => sum + (p.entry.eco[g.id]?.decades[di] ?? 0),
          0,
        ),
      );
      const decTotal = decTotals.reduce((s, v) => s + v, 0);
      if (decTotal === 0) return;

      const BGAP = 0.005;
      const bAvail = ang.end - ang.start - BGAP * 9;
      let bc = ang.start;

      decTotals.forEach((count, di) => {
        if (count === 0) {
          bc += BGAP;
          return;
        }
        const span = (count / decTotal) * bAvail;
        const bStart = bc;
        bc += span + BGAP;

        const bandK = `${g.id}:${di}`;
        const bandHl = hlBandSet.has(bandK);
        let opac: number;
        if (ecoDim) opac = 0.16;
        else if (bandHl) opac = 0.95;
        else if (ecoIsHl) opac = 0.35;
        else opac = 0.85;

        const color = bandColor(g.id, di, bandHl);
        const p = ns("path");
        p.setAttribute("d", arcPath(bStart, bc - BGAP, R_IN + 1, R_OUT));
        p.setAttribute("fill", color);
        p.setAttribute("fill-opacity", String(opac));
        if (bandHl) {
          p.setAttribute("filter", "url(#glow)");
          p.setAttribute("stroke", color);
          p.setAttribute("stroke-width", "1.5");
          p.setAttribute("stroke-opacity", "0.9");
        }
        const label = `ECO ${g.id}${di}0–${g.id}${di}9 · ${count.toLocaleString()} games${bandHl ? "  ◀ selected opening" : ""}`;
        p.addEventListener("mouseenter", (e) =>
          showTip(e as MouseEvent, label),
        );
        p.addEventListener("mousemove", (e) => moveTip(e as MouseEvent));
        p.addEventListener("mouseleave", hideTip);
        svg.appendChild(p);
      });

      // ECO letter label
      const lBright = ecoDim
        ? `hsl(${h},${s}%,30%)`
        : ecoIsHl
          ? `hsl(${h},${s}%,80%)`
          : `hsl(${h},${s}%,60%)`;
      const labelR = R_OUT + 22;
      const [lx, ly] = pt(ang.mid, labelR);
      const txt = ns("text");
      txt.setAttribute("x", String(lx));
      txt.setAttribute("y", String(ly));
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "middle");
      txt.setAttribute("fill", lBright);
      txt.setAttribute("font-size", ecoIsHl ? "15" : "12");
      txt.setAttribute("font-weight", ecoIsHl ? "bold" : "normal");
      txt.setAttribute("font-family", "Georgia, serif");
      txt.textContent = g.id;
      svg.appendChild(txt);
    });

    // ── 3. Player arcs ──
    groups.forEach((g, i) => {
      if (g.type !== "player") return;
      const ang = angles[i];
      const p = ns("path");
      p.setAttribute("d", arcPath(ang.start, ang.end, R_IN + 1, R_OUT));
      p.setAttribute("fill", g.color);
      p.setAttribute("fill-opacity", "0.88");
      const player = activePlayers.find((ap) => ap.key === g.id)!;
      p.addEventListener("mouseenter", (e) =>
        showTip(
          e as MouseEvent,
          `${player.entry.displayName} · ${totals[i].toLocaleString()} games`,
        ),
      );
      p.addEventListener("mousemove", (e) => moveTip(e as MouseEvent));
      p.addEventListener("mouseleave", hideTip);
      svg.appendChild(p);

      const [lx, ly] = pt(ang.mid, R_OUT + 22);
      const txt = ns("text");
      txt.setAttribute("x", String(lx));
      txt.setAttribute("y", String(ly));
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "middle");
      txt.setAttribute("fill", g.color);
      txt.setAttribute("font-size", "11");
      txt.setAttribute("font-family", "-apple-system, sans-serif");
      txt.textContent = player.entry.displayName;
      svg.appendChild(txt);
    });
  }, [activePlayers, highlightBands]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg
        ref={svgRef}
        width={648}
        height={648}
        viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`}
      />
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          background: "#181818",
          border: "1px solid #494949",
          borderRadius: 4,
          padding: "4px 9px",
          fontSize: "0.78em",
          pointerEvents: "none",
          display: "none",
          color: "#ccc",
          zIndex: 999,
          whiteSpace: "nowrap",
        }}
      />
    </div>
  );
}

export { PALETTE };
