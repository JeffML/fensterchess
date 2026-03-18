/**
 * Fetch player-opening matrix data from the serverless function.
 * Used by the chord diagram visualization.
 */

export interface PlayerEcoLetter {
  total: number;
  decades: number[]; // index 0–9 for E0x…E9x
}

export interface PlayerEcoEntry {
  displayName: string;
  totalGames: number;
  peakRating?: number;
  ratingSource?: string;
  eco: Record<string, PlayerEcoLetter>;
}

export interface PlayerEcoMatrix {
  totalPlayers: number;
  minGames: number;
  builtAt: string;
  players: Record<string, PlayerEcoEntry>;
}

export interface OpeningEntry {
  name: string;
  eco: string;
  ecoLetter: string;
  decade: number;
  games: number;
}

export interface PlayerOpeningMatrixResponse {
  matrix: PlayerEcoMatrix;
  openings: Record<string, OpeningEntry[]>; // keyed by ECO letter A–E
}

const AUTH_HEADER = {
  Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
};

/** Fetch the full player list + opening groups (no player filter). */
export async function fetchPlayerOpeningMatrix(): Promise<PlayerOpeningMatrixResponse> {
  const res = await fetch("/.netlify/functions/getPlayerOpeningMatrix", {
    headers: AUTH_HEADER,
  });
  if (!res.ok) throw new Error(`getPlayerOpeningMatrix: ${res.status}`);
  return res.json();
}

/** Fetch matrix rows for specific players only (smaller payload for the diagram). */
export async function fetchPlayerMatrixForPlayers(
  players: string[],
): Promise<PlayerOpeningMatrixResponse> {
  const qs = new URLSearchParams({ players: players.join(",") });
  const res = await fetch(
    `/.netlify/functions/getPlayerOpeningMatrix?${qs.toString()}`,
    { headers: AUTH_HEADER },
  );
  if (!res.ok) throw new Error(`getPlayerOpeningMatrix: ${res.status}`);
  return res.json();
}
