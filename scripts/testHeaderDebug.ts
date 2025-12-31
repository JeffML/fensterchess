// Quick test to see what headers look like from indexPgnGames
import { indexPgnGames } from "@chess-pgn/chess-pgn";
import fs from "fs";

const samplePgn = `[Event "Titled Tue 29th Oct Early"]
[Site "chess.com INT"]
[Date "2024.10.29"]
[Round "4"]
[White "Carlsen,M"]
[Black "Kosakowski,Jakub"]
[Result "1-0"]
[WhiteElo "2831"]
[BlackElo "2516"]
[ECO "B10"]

1.e4 c6 2.Nf3 d5 3.d3 Bg4 1-0`;

async function test() {
  const cursor = indexPgnGames(samplePgn);
  
  for await (const game of cursor) {
    console.log("Game type:", typeof game);
    console.log("Game constructor:", game.constructor.name);
    console.log("Game keys:", Object.keys(game));
    console.log("\nTrying to access properties:");
    console.log("  game.White:", (game as any).White);
    console.log("  game.WhiteElo:", (game as any).WhiteElo);
    console.log("  game.headers:", (game as any).headers);
  }
}

test();
