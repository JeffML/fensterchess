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

export interface BandOpeningsResponse {
  openings: OpeningEntry[];
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

/** Fetch openings for a specific ECO decade band, filtered to the given players. */
export async function fetchOpeningsForBand(
  players: string[],
  letter: string,
  decade: number,
): Promise<BandOpeningsResponse> {
  const qs = new URLSearchParams({
    players: players.join("|"),
    letter,
    decade: String(decade),
  });
  const res = await fetch(
    `/.netlify/functions/getPlayerOpeningMatrix?${qs.toString()}`,
    { headers: AUTH_HEADER },
  );
  if (!res.ok) throw new Error(`getPlayerOpeningMatrix band: ${res.status}`);
  return res.json();
}
