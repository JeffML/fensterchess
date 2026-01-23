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
  moves: string; // SAN move sequence (space-separated, no move numbers)
  ply: number; // Half-moves
  source: "pgnmentor" | "lichess-elite";
  sourceFile: string;
  hash: string; // SHA-256 for deduplication

  // =========================================================================
  // OPENING INDEX FIELDS (populated by buildIndexes.ts from eco.json lookup)
  // These fields are used to index games by opening position.
  // The FEN is the KEY used in opening-by-fen.json index.
  // =========================================================================

  /**
   * The FEN of the opening position this game is indexed under.
   * This is the opening's unique identifier in the opening-by-fen index.
   * Use this FEN to query games that pass through this opening position.
   * Example: "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1" for 1.b3
   */
  ecoJsonFen?: string;

  /** The opening name from eco.json (e.g., "Nimzo-Larsen Attack") */
  ecoJsonOpening?: string;

  /** The ECO code from eco.json (e.g., "A01") */
  ecoJsonEco?: string;

  /** How many half-moves back from the game's end position was this opening found */
  movesBack?: number;
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
 * Maps eco.json opening names to FEN, ECO code, and game indices
 */
export interface OpeningByNameEntry {
  fen: string; // eco.json FEN for this opening
  eco: string; // ECO code
  gameIds: number[]; // Game indices
}

export interface OpeningByNameIndex {
  [openingName: string]: OpeningByNameEntry;
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
