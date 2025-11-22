import { ChessPGN } from "@chess-pgn/chess-pgn";
import { MutableRefObject } from "react";

// ============================================================================
// Chess & Opening Types
// ============================================================================

/** FEN string representing a chess position */
export type FEN = string;

/** PGN string representing chess moves */
export type PGN = string;

/** ECO code (e.g., "A00", "B12", "C42") */
export type EcoCode = string;

/** Square on chess board (e.g., "e4", "a1", "h8") */
export type Square = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8}`;

/**
 * Chess opening data structure from eco.json
 */
export interface Opening {
  /** Opening name (e.g., "Sicilian Defense") */
  name: string;
  /** Move sequence in PGN notation */
  moves: string;
  /** ECO classification code */
  eco: EcoCode;
  /** Optional evaluation score */
  score?: number;
  /** Next possible positions (added by serverless functions) */
  next?: Opening[];
  /** Previous positions leading to this one (added by serverless functions) */
  from?: Opening[];
  /** Source/origin information */
  src?: string;
  /** Whether this is the root ECO position */
  isEcoRoot?: boolean;
  /** FEN string for this position */
  fen?: FEN;
}

/**
 * Opening book - maps FEN strings to Opening data
 */
export type OpeningBook = Record<FEN, Opening>;

/**
 * Position book - maps position-only FEN to full FEN strings
 * Used for lookup when turn/castling/en passant is unknown
 */
export type PositionBook = Record<string, FEN[]>;

/**
 * Board state used throughout the app
 */
export interface BoardState {
  fen: FEN | "start";
  moves: string;
}

/**
 * Chess instance ref type used in React components
 */
export type ChessRef = MutableRefObject<ChessPGN>;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from getFromTosForFen serverless function
 */
export interface FromTosResponse {
  /** Array of FEN strings for next positions */
  next: FEN[];
  /** Array of FEN strings for previous positions */
  from: FEN[];
}

/**
 * Response from scoresForFens serverless function
 */
export interface ScoresResponse {
  /** Current position score */
  score: number;
  /** Scores for next positions */
  nextScores?: number[];
  /** Scores for previous positions */
  fromScores?: number[];
}

/**
 * Request payload for scoresForFens function
 */
export interface ScoresRequest {
  fen: FEN;
  next: FEN[];
  from: FEN[];
}

/**
 * PGN link metadata
 */
export interface PgnLinkMeta {
  url: string;
  title: string;
  description?: string;
  date?: string;
}

/**
 * External opening statistics
 */
export interface ExternalOpeningStats {
  white: number;
  black: number;
  draws: number;
  total: number;
}

// ============================================================================
// Game & Player Types
// ============================================================================

/**
 * Game percentages for visualization
 */
export interface GamePercentages {
  /** White win percentage */
  w: number;
  /** Black win percentage */
  b: number;
  /** Draw percentage */
  d: number;
}

/**
 * Player information
 */
export interface Player {
  name: string;
  elo?: number;
  title?: string;
}

/**
 * Game summary information
 */
export interface GameSummary {
  white: Player;
  black: Player;
  opening?: string;
  event: string;
  site: string;
  date: string;
  round?: string;
  result: string;
}

/**
 * Database summary from PGN file parsing
 */
export interface DatabaseSummary {
  db: {
    gameCount: () => number;
    games: (startIndex?: number) => AsyncGenerator<any, void, unknown>;
  };
  players: Record<string, Player>;
  high: number;
  low: number;
  avg: number;
  count: number;
  openings: Set<string>;
  event: string;
}

// ============================================================================
// Visualization Types
// ============================================================================

/**
 * Heatmap data point
 */
export interface HeatmapData {
  square: Square;
  value: number;
}

/**
 * Opening for ECO category visualization
 */
export interface EcoOpening {
  name: string;
  moves: string;
  eco: EcoCode;
  x?: number;
  y?: number;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Opening book context value
 */
export interface OpeningBookContextValue {
  openingBook: OpeningBook | null;
  positionBook: PositionBook | null;
}

/**
 * Selected sites context value
 */
export type SelectedSitesContextValue = string[];

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Props for components that accept chess ref and board state
 */
export interface ChessBoardProps {
  chess: ChessRef;
  plyIndex: number;
  setPlyIndex: (index: number) => void;
}

/**
 * Props for move display components
 */
export interface MovesDisplayProps {
  gamePliesRef: MutableRefObject<string[]>;
  openingPliesRef: MutableRefObject<string[]>;
  plyIndex: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Async function that returns a promise
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Handler for move events
 */
export type MoveHandler = (move: string) => void;

/**
 * Error with optional context
 */
export interface AppError extends Error {
  context?: string;
  code?: string;
}
