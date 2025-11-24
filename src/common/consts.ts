import packageJson from "../../package.json";
import { FICS, LICHESS } from "./urlConsts";

export const APP_NAME = "Fenster";
export const VERSION = packageJson.version;

export const INCR = 5; // list increment

export const COMPARE = 1;

export enum SortEnum {
  EVALUATION = 1,
  NAME = 2,
  // RESULTS = 3,
  ECO = 4,
}

// Legacy export for backward compatibility
export const sortEnum = SortEnum;

export enum Modes {
  MAIN = 1,
  TEST = 2,
  SEARCH = 3,
  PGN_ANALYZE = 4,
  ABOUT = 5,
  VISUALIZATION = 6,
}

// Legacy export for backward compatibility
export const modes = {
  main: Modes.MAIN,
  test: Modes.TEST,
  search: Modes.SEARCH,
  pgnAnalyze: Modes.PGN_ANALYZE,
  about: Modes.ABOUT,
  visualization: Modes.VISUALIZATION,
} as const;

export const SUBTITLES: Record<number, string> = {
  [Modes.SEARCH]: "Search Openings",
  [Modes.TEST]: "Test and Administration",
  [Modes.PGN_ANALYZE]: "Import and Analyze PGN",
  [Modes.VISUALIZATION]: "Visualization",
  [Modes.ABOUT]: "About Fenster",
};

export const siteUrls = {
  FICS,
  lichess: LICHESS,
} as const;

export const sites = Object.keys(siteUrls) as Array<keyof typeof siteUrls>;

export const FENEX = /(?!.*\d{2,}.*)^([1-8PNBRQK]+\/){7}[1-8PNBRQK]+$/im;

// Regex for position-only FEN (just piece positions, no game state)
export const POSITION_ONLY_FEN_REGEX =
  /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+$/;

export const token = import.meta.env.VITE_APP_QUOTE as string | undefined;
export const isTestMode = import.meta.env.VITE_APP_TEST_MODE === "flum";

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export const NO_ENTRY_FOUND = "No Entry Found in Opening Book";

export type Rank = (typeof RANKS)[number];
export type File = (typeof FILES)[number];
export type Square = `${File}${Rank}`;
