// Game hashing for deduplication
// Phase 0 - Foundation

import crypto from "crypto";
import type { IChessGame } from "@chess-pgn/chess-pgn";

/**
 * Normalizes game data to canonical format for hashing
 * Format: white|black|date|moves
 *
 * - Player names: lowercase, trimmed
 * - Date: as-is from header
 * - Moves: space-separated SAN sequence
 *
 * @param game - Chess game to normalize
 * @returns Canonical string representation
 */
export function normalizeGameForHash(game: IChessGame): string {
  const header = game.header();

  // Normalize player names (lowercase, trim)
  const white = (header.White || "").toLowerCase().trim();
  const black = (header.Black || "").toLowerCase().trim();

  // Normalize date (YYYY.MM.DD or YYYY.??.??)
  const date = (header.Date || "").trim();

  // Get move sequence (already stripped of annotations)
  const moves = game.history().join(" ");

  // Canonical format: white|black|date|moves
  return `${white}|${black}|${date}|${moves}`;
}

/**
 * Generates SHA-256 hash for game deduplication
 * Deterministic: same game data always produces same hash
 *
 * @param game - Chess game to hash
 * @returns SHA-256 hash (64 hex characters)
 */
export function hashGame(game: IChessGame): string {
  const normalized = normalizeGameForHash(game);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
