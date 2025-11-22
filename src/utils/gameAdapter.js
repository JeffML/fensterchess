/**
 * Adapter to make @chess-pgn/chess-pgn Game objects compatible with kokopu Game API
 *
 * This adapter wraps a chessPGN Game to provide the same interface as kokopu Game objects,
 * allowing gradual migration from kokopu to chessPGN.
 */

import { ChessPGN } from "@chess-pgn/chess-pgn";

/**
 * GameAdapter wraps a chessPGN Game to provide kokopu-compatible API
 */
export class GameAdapter {
  constructor(chessPgnGame) {
    this._game = chessPgnGame;
  }

  /**
   * Get the opening name from headers
   * @returns {string|undefined} Opening name or undefined if not present
   */
  opening() {
    const opening = this._game.header()["Opening"];
    return opening || undefined;
  }

  /**
   * Get the opening variation from headers
   * @returns {string|undefined} Opening variation or undefined if not present
   */
  openingVariation() {
    const variation = this._game.header()["Variation"];
    return variation || undefined;
  }

  /**
   * Get the opening sub-variation from headers
   * @returns {string|undefined} Opening sub-variation or undefined if not present
   */
  openingSubVariation() {
    const subVariation = this._game.header()["SubVariation"];
    return subVariation || undefined;
  }

  /**
   * Get the full round information
   * @returns {string|undefined} Round information or undefined if not present
   */
  fullRound() {
    const round = this._game.header()["Round"];
    // Return undefined for missing or '?' values to match kokopu behavior
    return round && round !== "?" ? round : undefined;
  }

  /**
   * Get the date as a string formatted with 3-letter month abbreviation (e.g., "Nov 15, 2023")
   * @returns {string} Date string
   */
  dateAsString() {
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
   * @param {string} color - 'w' for white, 'b' for black
   * @returns {string} Player name
   */
  playerName(color) {
    const colorKey = color === "w" ? "White" : "Black";
    return this._game.header()[colorKey] || "?";
  }

  /**
   * Get player title by color
   * @param {string} color - 'w' for white, 'b' for black
   * @returns {string|undefined} Player title (GM, IM, FM, etc.) or undefined
   */
  playerTitle(color) {
    const colorKey = color === "w" ? "WhiteTitle" : "BlackTitle";
    const title = this._game.header()[colorKey];
    return title && title !== "?" ? title : undefined;
  }

  /**
   * Get the event name
   * @returns {string} Event name
   */
  event() {
    return this._game.header()["Event"] || "?";
  }

  /**
   * Get the game result
   * @returns {string} Result string (1-0, 0-1, 1/2-1/2, or *)
   */
  result() {
    return this._game.header()["Result"] || "*";
  }

  /**
   * Get the game variant (currently only supports 'regular')
   * @returns {string|null} Variant name or null for regular chess
   */
  variant() {
    // chessPGN doesn't have variant support yet, assume regular chess
    return "regular";
  }

  /**
   * Get a POJO (Plain Old JavaScript Object) representation of the game
   * Mimics kokopu's pojo() method
   * @returns {Object} Game data as plain object
   */
  pojo() {
    const headers = this._game.header();
    return {
      white: {
        name: this.playerName("w"),
        elo: parseInt(headers["WhiteElo"]) || undefined,
        title: this.playerTitle("w"),
      },
      black: {
        name: this.playerName("b"),
        elo: parseInt(headers["BlackElo"]) || undefined,
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
   * @returns {Game} The wrapped chessPGN Game
   */
  unwrap() {
    return this._game;
  }

  /**
   * Get an array of position nodes (each move in the game)
   * Mimics kokopu's nodes() method which returns positions after each move
   * @returns {Array<Object>} Array of nodes with fen() and notation() methods
   */
  nodes() {
    const game = this._game;
    const moves = game.history({ verbose: true });

    // We need to replay the game to get FEN after each move
    // Create a new game and replay moves
    const replay = new ChessPGN();

    const nodes = [];
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
 * @param {Game} chessPgnGame - A chessPGN Game object
 * @returns {GameAdapter} Wrapped game with kokopu-compatible API
 */
export function adaptGame(chessPgnGame) {
  return new GameAdapter(chessPgnGame);
}
