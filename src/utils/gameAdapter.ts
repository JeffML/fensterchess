/**
 * Adapter to make @chess-pgn/chess-pgn Game objects compatible with kokopu Game API
 *
 * This adapter wraps a chessPGN Game to provide the same interface as kokopu Game objects,
 * allowing gradual migration from kokopu to chessPGN.
 */

import { ChessPGN, type Game, type Move } from "@chess-pgn/chess-pgn";

interface PlayerInfo {
  name: string;
  elo?: number;
  title?: string;
}

interface GamePojo {
  white: PlayerInfo;
  black: PlayerInfo;
  opening?: string;
  event: string;
  site: string;
  date: string;
  round?: string;
  result: string;
  mainVariation: string[];
}

interface GameNode {
  fen: () => string;
  notation: () => string;
}

// Type for chess games from the library (either ChessPGN wrapper or Game class)
type ChessGameType = ChessPGN | Game;

/**
 * GameAdapter wraps a chessPGN Game to provide kokopu-compatible API
 */
export class GameAdapter {
  private _game: ChessGameType;

  constructor(chessPgnGame: ChessGameType) {
    this._game = chessPgnGame;
  }

  /**
   * Get the opening name from headers
   * @returns Opening name or undefined if not present
   */
  opening(): string | undefined {
    const opening = this._game.header()["Opening"];
    return opening || undefined;
  }

  /**
   * Get the opening variation from headers
   * @returns Opening variation or undefined if not present
   */
  openingVariation(): string | undefined {
    const variation = this._game.header()["Variation"];
    return variation || undefined;
  }

  /**
   * Get the opening sub-variation from headers
   * @returns Opening sub-variation or undefined if not present
   */
  openingSubVariation(): string | undefined {
    const subVariation = this._game.header()["SubVariation"];
    return subVariation || undefined;
  }

  /**
   * Get the full round information
   * @returns Round information or undefined if not present
   */
  fullRound(): string | undefined {
    const round = this._game.header()["Round"];
    // Return undefined for missing or '?' values to match kokopu behavior
    return round && round !== "?" ? round : undefined;
  }

  /**
   * Get the date as a string formatted with 3-letter month abbreviation (e.g., "Nov 15, 2023")
   * @returns Date string
   */
  dateAsString(): string {
    const dateStr = this._game.header()["Date"] || "????.??.??";

    // If it's the default or malformed, return as-is
    if (dateStr === "????.??.??" || !dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
      return dateStr;
    }

    // Convert from "2023.11.15" to "Nov 15, 2023"
    const [year, month, day] = dateStr.split(".");
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10)
    );

    const monthAbbr = date.toLocaleDateString("en-US", { month: "short" });
    const dayNum = parseInt(day, 10);

    return `${monthAbbr} ${dayNum}, ${year}`;
  }

  /**
   * Get player name by color
   * @param color - 'w' for white, 'b' for black
   * @returns Player name
   */
  playerName(color: "w" | "b"): string {
    const colorKey = color === "w" ? "White" : "Black";
    return this._game.header()[colorKey] || "?";
  }

  /**
   * Get player title by color
   * @param color - 'w' for white, 'b' for black
   * @returns Player title (GM, IM, FM, etc.) or undefined
   */
  playerTitle(color: "w" | "b"): string | undefined {
    const colorKey = color === "w" ? "WhiteTitle" : "BlackTitle";
    const title = this._game.header()[colorKey];
    return title && title !== "?" ? title : undefined;
  }

  /**
   * Get the event name
   * @returns Event name
   */
  event(): string {
    return this._game.header()["Event"] || "?";
  }

  /**
   * Get the game result
   * @returns Result string (1-0, 0-1, 1/2-1/2, or *)
   */
  result(): string {
    return this._game.header()["Result"] || "*";
  }

  /**
   * Get the game variant (currently only supports 'regular')
   * @returns Variant name or null for regular chess
   */
  variant(): string | null {
    // chessPGN doesn't have variant support yet, assume regular chess
    return "regular";
  }

  /**
   * Get a POJO (Plain Old JavaScript Object) representation of the game
   * Mimics kokopu's pojo() method
   * @returns Game data as plain object
   */
  pojo(): GamePojo {
    const headers = this._game.header();
    return {
      white: {
        name: this.playerName("w"),
        elo: headers["WhiteElo"] ? parseInt(headers["WhiteElo"]) : undefined,
        title: this.playerTitle("w"),
      },
      black: {
        name: this.playerName("b"),
        elo: headers["BlackElo"] ? parseInt(headers["BlackElo"]) : undefined,
        title: this.playerTitle("b"),
      },
      opening: this.opening(),
      event: this.event(),
      site: headers["Site"] || "?",
      date: this.dateAsString(),
      round: this.fullRound(),
      result: this.result(),
      mainVariation: this.nodes().map((n) => n.notation()),
    };
  }

  /**
   * Get the underlying chessPGN Game object
   * @returns The wrapped chessPGN Game
   */
  unwrap(): ChessGameType {
    return this._game;
  }

  /**
   * Get an array of position nodes (each move in the game)
   * Mimics kokopu's nodes() method which returns positions after each move
   * @returns Array of nodes with fen() and notation() methods
   */
  nodes(): GameNode[] {
    const game = this._game;
    const moves = game.history({ verbose: true }) as Move[];

    // We need to replay the game to get FEN after each move
    // Create a new game and replay moves
    const replay = new ChessPGN();

    const nodes: GameNode[] = [];
    for (const move of moves) {
      replay.move(move.san);
      const currentFen = replay.fen();
      const notation = move.san;

      // Create a node object that mimics kokopu's node interface
      nodes.push({
        fen: () => currentFen,
        notation: () => notation,
      });
    }

    return nodes;
  }
}

/**
 * Create a GameAdapter from a chessPGN Game
 * @param chessPgnGame - A chessPGN Game object
 * @returns Wrapped game with kokopu-compatible API
 */
export function adaptGame(chessPgnGame: ChessGameType): GameAdapter {
  return new GameAdapter(chessPgnGame);
}
