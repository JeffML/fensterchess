import { ChessPGN } from "@chess-pgn/chess-pgn";
import { useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { parseMoves, toPlay } from "../utils/chessTools.js";
import { OpeningAdditionalWithBarChartGrid } from "./OpeningAdditional.jsx";
import { SimilarOpenings } from "./SimilarOpenings.jsx";
import { NextOpenings } from "./nextOpeningsEtc/NextOpenings.jsx";
import { Roots } from "./nextOpeningsEtc/Roots.jsx";
import { Theory, theoryRequest } from "./Theory.jsx";

const chess = new ChessPGN();

/**
 * An "next" opening variation can be either:
 * - moved to from current move sequence (legal move)
 * - transposed to from a different move sequence (yet same position as current move sequence)
 *
 * @param {*} variations
 * @param {*} currentMoves
 * @returns {{ legalMoves: {}; transpositions: {}; }}
 */
const moveLists = ({ variations, currentMoves }) => {
  let legalMoves = [];
  let transpositions = [];

  for (const variation of variations ?? []) {
    const continuation = legalMove(currentMoves, variation);
    if (continuation) {
      legalMoves.push(continuation);
    } else {
      transpositions.push(variation);
    }
  }

  return { legalMoves, transpositions };
};

/**
 * Determine if the variation's moves are compatible with the current move list.
 *
 * @param {*} moves - played moves
 * @param {*} variation - a variation that is either a transposition or mainline
 * @returns {{ theMove: string; nextPly: any; }}
 */
const legalMove = (moves, variation) => {
  const { nextPly, theMove } = parseMoves(variation.moves);

  // the last ply might be illegal due to transposition of moves; filter these out
  chess.loadPgn(moves);
  const legalMoves = chess.moves();

  return legalMoves.includes(nextPly)
    ? { ...variation, theMove, nextPly }
    : null;
};

const OpeningTabs = ({
  boardState,
  setBoardState,
  variations,
  currentMoves,
  handleMovePlayed,
  sites,
  eco,
  name,
  from,
  lastKnownOpening,
}) => {
  const { fen } = boardState;
  const { move, color } = toPlay(fen);

  const searchable = move > 4;
  const showExternal = sites.selectedSites.length > 0;
  const showTransitions = from && from.length > 1;

  const [html, setHtml] = useState(null);

  const { legalMoves, transpositions } = moveLists({
    variations,
    currentMoves,
  });

  useEffect(() => {
    if (currentMoves) theoryRequest(currentMoves, setHtml);
  }, [currentMoves]);

  const hasLastMove = Object.keys(lastKnownOpening).length !== 0;

  return (
    <Tabs style={{ minWidth: "100%", marginRight: "2em" }}>
      <TabList className="left openings-tablist">
        {legalMoves && legalMoves.length !== 0 && <Tab>Variations</Tab>}
        {showTransitions && <Tab>Roots</Tab>}
        {html && <Tab>Theory</Tab>}
        {showExternal && <Tab>External Info</Tab>}
        {searchable && <Tab>Similar Openings</Tab>}
      </TabList>
      <div style={{ border: "thick solid white" }}>
        {legalMoves && legalMoves.length !== 0 && (
          <TabPanel>
            <NextOpenings
              {...{
                legalMoves,
                transpositions,
                handleMovePlayed,
              }}
            />
          </TabPanel>
        )}
        {showTransitions && (
          <TabPanel id="roots">
            <div className="row">
              <Roots
                {...{ moves: currentMoves, from }}
                style={{ marginLeft: "1em" }}
              />
            </div>
          </TabPanel>
        )}
        {html && <TabPanel>{hasLastMove && <Theory {...{ html }} />}</TabPanel>}
        {showExternal && (
          <TabPanel>
            <div
              className="row"
              style={{ marginLeft: "1em", marginBottom: "1em" }}
            >
              <OpeningAdditionalWithBarChartGrid
                id="OpeningAdditionalWithBarChartGrid"
                {...{
                  eco,
                  fen,
                  name,
                  sites: sites.selectedSites,
                }}
              />
            </div>
          </TabPanel>
        )}
        {searchable && (
          <TabPanel>
            <SimilarOpenings {...{ setBoardState, boardState }} />
          </TabPanel>
        )}
      </div>
    </Tabs>
  );
};

export { OpeningTabs };
