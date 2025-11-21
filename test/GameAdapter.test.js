import { describe, it, expect, beforeEach } from "vitest";
import { pgnRead } from "kokopu";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { GameAdapter, adaptGame } from "../src/utils/gameAdapter";

// Sample PGN for testing
const SAMPLE_PGN = `[Event "Rated Blitz game"]
[Site "https://lichess.org/abcd1234"]
[Date "2023.11.15"]
[Round "1"]
[White "PlayerOne"]
[Black "PlayerTwo"]
[Result "1-0"]
[WhiteElo "2100"]
[BlackElo "2050"]
[Opening "Queen's Gambit Declined"]
[Variation "Orthodox Defense"]
[SubVariation "Classical Variation"]
[ECO "D63"]
[TimeControl "180+0"]
[UTCDate "2023.11.15"]
[UTCTime "14:30:00"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Nbd7 5. cxd5 exd5 6. Bg5 Be7 1-0`;

const MINIMAL_PGN = `[Event "Test Event"]
[Site "Test Site"]
[Date "2023.01.01"]
[Round "?"]
[White "White Player"]
[Black "Black Player"]
[Result "*"]

1. e4 e5 *`;

describe("GameAdapter", () => {
  let kokopuGame;
  let chessPgnGame;
  let adapter;

  beforeEach(() => {
    // Parse with both libraries
    const kokopuDb = pgnRead(SAMPLE_PGN);
    kokopuGame = Array.from(kokopuDb.games())[0];

    chessPgnGame = new ChessPGN();
    chessPgnGame.loadPgn(SAMPLE_PGN);

    adapter = new GameAdapter(chessPgnGame);
  });

  describe("opening information", () => {
    it("should return the opening name", () => {
      expect(adapter.opening()).toBe(kokopuGame.opening());
      expect(adapter.opening()).toBe("Queen's Gambit Declined");
    });

    it("should return the opening variation", () => {
      expect(adapter.openingVariation()).toBe(kokopuGame.openingVariation());
      expect(adapter.openingVariation()).toBe("Orthodox Defense");
    });

    it("should return the opening sub-variation", () => {
      expect(adapter.openingSubVariation()).toBe(
        kokopuGame.openingSubVariation()
      );
      expect(adapter.openingSubVariation()).toBe("Classical Variation");
    });

    it("should handle missing opening information", () => {
      const minimalChessGame = new ChessPGN();
      minimalChessGame.loadPgn(MINIMAL_PGN);
      const minimalAdapter = new GameAdapter(minimalChessGame);

      expect(minimalAdapter.opening()).toBeUndefined();
      expect(minimalAdapter.openingVariation()).toBeUndefined();
      expect(minimalAdapter.openingSubVariation()).toBeUndefined();
    });
  });

  describe("game metadata", () => {
    it("should return the round information", () => {
      expect(adapter.fullRound()).toBe(kokopuGame.fullRound());
      expect(adapter.fullRound()).toBe("1");
    });

    it("should return the date as string", () => {
      // GameAdapter uses 3-letter month abbreviations
      expect(adapter.dateAsString()).toBe("Nov 15, 2023");
    });

    it("should return white player name", () => {
      expect(adapter.playerName("w")).toBe(kokopuGame.playerName("w"));
      expect(adapter.playerName("w")).toBe("PlayerOne");
    });

    it("should return black player name", () => {
      expect(adapter.playerName("b")).toBe(kokopuGame.playerName("b"));
      expect(adapter.playerName("b")).toBe("PlayerTwo");
    });

    it("should return game result", () => {
      expect(adapter.result()).toBe(kokopuGame.result());
      expect(adapter.result()).toBe("1-0");
    });

    it("should return variant", () => {
      expect(adapter.variant()).toBe(kokopuGame.variant());
      expect(adapter.variant()).toBe("regular");
    });
  });

  describe("pojo() method", () => {
    it("should return a plain object with game data matching kokopu format", () => {
      const adapterPojo = adapter.pojo();
      const kokopuPojo = kokopuGame.pojo();

      expect(adapterPojo.white.name).toBe(kokopuPojo.white.name);
      expect(adapterPojo.black.name).toBe(kokopuPojo.black.name);
      expect(adapterPojo.opening).toBe(kokopuPojo.opening);
      expect(adapterPojo.event).toBe(kokopuPojo.event);
      expect(adapterPojo.result).toBe(kokopuPojo.result);
    });

    it("should include ELO ratings", () => {
      const pojo = adapter.pojo();

      expect(pojo.white.elo).toBe(2100);
      expect(pojo.black.elo).toBe(2050);
    });

    it("should handle missing ELO ratings", () => {
      const minimalChessGame = new ChessPGN();
      minimalChessGame.loadPgn(MINIMAL_PGN);
      const minimalAdapter = new GameAdapter(minimalChessGame);
      const pojo = minimalAdapter.pojo();

      expect(pojo.white.elo).toBeUndefined();
      expect(pojo.black.elo).toBeUndefined();
    });
  });

  describe("adaptGame factory function", () => {
    it("should create a GameAdapter instance", () => {
      const adapted = adaptGame(chessPgnGame);
      expect(adapted).toBeInstanceOf(GameAdapter);
    });

    it("should return adapter with correct methods", () => {
      const adapted = adaptGame(chessPgnGame);
      expect(adapted.opening()).toBe("Queen's Gambit Declined");
      expect(adapted.playerName("w")).toBe("PlayerOne");
    });
  });

  describe("unwrap method", () => {
    it("should return the underlying chessPGN game", () => {
      const unwrapped = adapter.unwrap();
      expect(unwrapped).toBe(chessPgnGame);
      expect(unwrapped).toBeInstanceOf(ChessPGN);
    });
  });

  describe("edge cases", () => {
    it("should handle games with default values", () => {
      const defaultPgn = `[Event "?"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "?"]
[Black "?"]
[Result "*"]

1. e4 e5 *`;

      const game = new ChessPGN();
      game.loadPgn(defaultPgn);
      const adapted = new GameAdapter(game);

      expect(adapted.opening()).toBeUndefined();
      expect(adapted.playerName("w")).toBe("?");
      expect(adapted.dateAsString()).toBe("????.??.??");
      expect(adapted.result()).toBe("*");
    });
  });
});

describe("GameAdapter vs Kokopu compatibility", () => {
  it("should match kokopu API for all test cases", () => {
    const testPgns = [SAMPLE_PGN, MINIMAL_PGN];

    testPgns.forEach((pgn, index) => {
      const kokopuDb = pgnRead(pgn);
      const kokopuGame = Array.from(kokopuDb.games())[0];

      const chessPgnGame = new ChessPGN();
      chessPgnGame.loadPgn(pgn);
      const adapter = new GameAdapter(chessPgnGame);

      console.log(`Test case ${index + 1}:`);
      console.log("  Kokopu opening:", kokopuGame.opening());
      console.log("  Adapter opening:", adapter.opening());

      // Compare key methods
      expect(adapter.opening()).toBe(kokopuGame.opening());
      expect(adapter.fullRound()).toBe(kokopuGame.fullRound());
      // Note: GameAdapter uses abbreviated month format, kokopu uses full month name
      expect(adapter.dateAsString()).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
      expect(adapter.playerName("w")).toBe(kokopuGame.playerName("w"));
      expect(adapter.playerName("b")).toBe(kokopuGame.playerName("b"));
      expect(adapter.result()).toBe(kokopuGame.result());
      expect(adapter.variant()).toBe(kokopuGame.variant());
    });
  });

  it("should implement nodes() method compatible with kokopu", () => {
    // Create fresh instances for this test
    const kokopuDb = pgnRead(SAMPLE_PGN);
    const kokopuGame = Array.from(kokopuDb.games())[0];

    const chessPgnGame = new ChessPGN();
    chessPgnGame.loadPgn(SAMPLE_PGN);
    const adapter = new GameAdapter(chessPgnGame);

    const kokopuNodes = kokopuGame.nodes();
    const adapterNodes = adapter.nodes();

    // Should have same number of nodes
    expect(adapterNodes.length).toBe(kokopuNodes.length);

    // Check first few nodes match
    for (let i = 0; i < Math.min(3, kokopuNodes.length); i++) {
      expect(adapterNodes[i].fen()).toBe(kokopuNodes[i].fen());
      expect(adapterNodes[i].notation()).toBe(kokopuNodes[i].notation());
    }
  });
});
