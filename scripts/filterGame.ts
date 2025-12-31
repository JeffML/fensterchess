// Game filtering logic for Master Game Database
// Phase 0 - Foundation

import type { IChessGame } from "@chess-pgn/chess-pgn";

/**
 * Determines if a game should be imported based on filtering criteria:
 * - Standard chess only (no variants)
 * - No FEN setups (must start from standard position)
 * - Both players must have rating > 2400
 *
 * @param game - Chess game to evaluate
 * @returns true if game should be imported, false otherwise
 */
export function shouldImportGame(game: IChessGame): boolean {
  const header = game.header();

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

  return true;
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

  // Remove variations (nested parentheses)
  clean = removeNestedParentheses(clean);

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
