// Game hashing for deduplication
// Phase 0 - Foundation

import crypto from "crypto";

/**
 * Normalizes game data to canonical format for hashing
 * Format: event|white|black|date|round
 *
 * - Event, player names: lowercase, trimmed
 * - Date, round: as-is from headers
 *
 * @param headers - Game headers object
 * @returns Canonical string representation
 */
export function normalizeGameForHash(headers: any): string {
  // Normalize to lowercase and trim
  const event = (headers.Event || "").toLowerCase().trim();
  const white = (headers.White || "").toLowerCase().trim();
  const black = (headers.Black || "").toLowerCase().trim();
  const date = (headers.Date || "").trim();
  const round = (headers.Round || "").trim();

  // Canonical format: event|white|black|date|round
  return `${event}|${white}|${black}|${date}|${round}`;
}

/**
 * Generates SHA-256 hash for game deduplication
 * Deterministic: same game data always produces same hash
 *
 * @param headers - Game headers object
 * @returns SHA-256 hash (64 hex characters)
 */
export function hashGame(headers: any): string {
  const normalized = normalizeGameForHash(headers);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
