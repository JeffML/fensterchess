// Game filtering logic for Master Game Database
// Phase 0 - Foundation

import type { IChessGame } from "@chess-pgn/chess-pgn";

/**
 * Determines if a game should be imported based on filtering criteria:
 * - Standard chess only (no variants)
 * - No FEN setups (must start from standard position)
 * - Both players must have rating > 2400
 * - Time control must be rapid or slower (>= 600 seconds base time)
 *
 * @param game - Chess game to evaluate (IChessGame or game metadata)
 * @returns true if game should be imported, false otherwise
 */
export function shouldImportGame(game: IChessGame | any): boolean {
  // Handle both IChessGame (with header() method) and metadata objects (with .headers property)
  const header =
    typeof (game as any).header === "function"
      ? (game as IChessGame).header()
      : (game as any).headers || {};

  // Reject variants (only standard chess)
  if (header.Variant && header.Variant !== "Standard") {
    return false;
  }

  // Reject FEN setups (must start from standard position)
  if (header.FEN) {
    return false;
  }

  // Both players must be > 2400 rating
  const whiteElo = parseInt(header.WhiteElo || "0");
  const blackElo = parseInt(header.BlackElo || "0");

  if (whiteElo <= 2400 || blackElo <= 2400) {
    return false;
  }

  // Time control must be rapid or slower (>= 600 seconds = 10 minutes)
  if (header.TimeControl) {
    const baseTime = parseTimeControl(header.TimeControl);
    if (baseTime !== null && baseTime < 600) {
      return false;
    }
  }

  return true;
}

/**
 * Parse TimeControl header to extract base time in seconds
 * Formats: "600+0", "900+10", "40/7200", "-", "?"
 *
 * @param timeControl - TimeControl header value
 * @returns Base time in seconds, or null if unparseable/unknown
 */
function parseTimeControl(timeControl: string): number | null {
  if (!timeControl || timeControl === "-" || timeControl === "?") {
    return null; // Unknown time control - accept these
  }

  // Format: "600+0" or "900+10" (base time + increment)
  const incrementMatch = timeControl.match(/^(\d+)\+/);
  if (incrementMatch) {
    return parseInt(incrementMatch[1]);
  }

  // Format: "40/7200" (moves/seconds)
  const movesMatch = timeControl.match(/^\d+\/(\d+)/);
  if (movesMatch) {
    return parseInt(movesMatch[1]);
  }

  // Format: just seconds "3600"
  const simpleMatch = timeControl.match(/^(\d+)$/);
  if (simpleMatch) {
    return parseInt(simpleMatch[1]);
  }

  return null; // Unparseable - accept these
}

/**
 * Strips annotations from PGN text:
 * - Removes comments {...}
 * - Removes variations (nested parentheses)
 * - Removes NAGs ($1, $2, etc.)
 * - Cleans up whitespace
 *
 * @param pgn - PGN text with annotations
 * @returns Clean PGN text with only moves
 */
export function stripAnnotations(pgn: string): string {
  // Remove comments: {...}
  let clean = pgn.replace(/\{[^}]*\}/g, "");

  // Remove variations - optimized version (max 10 passes to prevent infinite loops)
  for (let i = 0; i < 10 && clean.includes("("); i++) {
    clean = clean.replace(/\([^()]*\)/g, "");
  }

  // Remove NAGs: $1, $2, etc.
  clean = clean.replace(/\$\d+/g, "");

  // Clean up whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Recursively removes nested parentheses (variations)
 * Handles arbitrarily deep nesting
 *
 * @deprecated Use stripAnnotations directly (optimized version)
 * @param text - Text containing nested parentheses
 * @returns Text with all parentheses removed
 */
function removeNestedParentheses(text: string): string {
  let result = text;
  let changed = true;

  while (changed) {
    const before = result;
    result = result.replace(/\([^()]*\)/g, "");
    changed = result !== before;
  }

  return result;
}
