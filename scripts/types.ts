// Type definitions for Master Game Database
// Phase 0 - Foundation

/**
 * Core game metadata structure
 * ~400 bytes per game
 */
export interface GameMetadata {
  idx: number; // Global index
  white: string;
  black: string;
  whiteElo: number;
  blackElo: number;
  result: string;
  date: string;
  event: string;
  site: string;
  eco?: string; // ECO code from PGN header
  opening?: string; // Opening name from PGN header
  variation?: string; // Variation from PGN header
  subVariation?: string; // SubVariation from PGN header
  moves: string; // SAN move sequence
  ply: number; // Half-moves
  source: "pgnmentor" | "lichess-elite";
  sourceFile: string;
  hash: string; // SHA-256 for deduplication

  // eco.json opening match (added during buildIndexes)
  ecoJsonFen?: string; // FEN at deepest eco.json matched position
  ecoJsonOpening?: string; // eco.json opening name
  ecoJsonEco?: string; // eco.json ECO code
  movesBack?: number; // Number of moves walked back to find eco.json match
}

/**
 * Chunked game index
 * Each chunk contains 200K games (~85MB)
 */
export interface GameIndexChunk {
  version: string;
  chunkId: number;
  totalChunks: number;
  startIdx: number;
  endIdx: number;
  games: GameMetadata[];
}

/**
 * Master index with pointers to chunks
 * Top-level index for navigating game collection
 */
export interface MasterIndex {
  version: string;
  totalGames: number;
  totalChunks: number;
  chunks: {
    id: number;
    blobKey: string;
    startIdx: number;
    endIdx: number;
  }[];
}

/**
 * Opening by FEN index
 * Maps eco.json FEN strings to game indices
 * Built during buildIndexes using lookupByMoves() from @chess-openings/eco.json
 */
export interface OpeningByFenIndex {
  [fen: string]: number[]; // Array of game indices that reached this eco.json position
}

/**
 * Opening by name index
 * Maps opening names to game indices (normalized lowercase)
 */
export interface OpeningByNameIndex {
  [openingName: string]: number[];
}

/**
 * Opening by ECO code index
 * Maps ECO codes to game indices
 */
export interface OpeningByEcoIndex {
  [ecoCode: string]: number[];
}

/**
 * Player index
 * Maps player names to games where they played as white/black
 */
export interface PlayerIndex {
  [playerName: string]: {
    asWhite: number[];
    asBlack: number[];
    totalGames: number;
  };
}

/**
 * Event/tournament index
 * Maps event names to game indices
 */
export interface EventIndex {
  [eventName: string]: number[];
}

/**
 * Date index
 * Maps years to game indices for time-based search
 */
export interface DateIndex {
  [year: string]: number[];
}

/**
 * Deduplication index
 * Maps SHA-256 hashes to game indices
 */
export interface DeduplicationIndex {
  [hash: string]: number; // Hash → game index
}

/**
 * Source tracking metadata
 * Tracks downloaded files and their metadata for incremental updates
 */
export interface SourceTracking {
  sources: {
    [filename: string]: {
      url: string;
      lastModified?: string;
      etag?: string;
      size?: number;
      lastChecked: string;
      gameCount: number;
    };
  };
}
