import { ChessPGN } from "@chess-pgn/chess-pgn";
import { useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { parseMoves, toPlay } from "../utils/chessTools";
import { OpeningAdditionalWithBarChartGrid } from "./OpeningAdditional";
import { SimilarOpenings } from "./SimilarOpenings";
import { NextOpenings } from "./nextOpeningsEtc/NextOpenings";
import { Roots } from "./nextOpeningsEtc/Roots";
import { Theory, theoryRequest } from "./Theory";
import { BoardState, Opening } from "../types";
import { SelectedSitesState } from "../contexts/SelectedSitesContext";

const chess = new ChessPGN();

interface Variation extends Opening {
  theMove?: string;
  nextPly?: string;
}

interface MoveLists {
  legalMoves: Variation[];
  transpositions: Variation[];
}

/**
 * An "next" opening variation can be either:
 * - moved to from current move sequence (legal move)
 * - transposed to from a different move sequence (yet same position as current move sequence)
 */
const moveLists = ({
  variations,
  currentMoves,
}: {
  variations?: Opening[];
  currentMoves?: string;
}): MoveLists => {
  let legalMoves: Variation[] = [];
  let transpositions: Variation[] = [];

  for (const variation of variations ?? []) {
    const continuation = legalMove(currentMoves || "", variation);
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
 */
const legalMove = (moves: string, variation: Opening): Variation | null => {
  const { nextPly, theMove } = parseMoves(variation.moves);

  // the last ply might be illegal due to transposition of moves; filter these out
  chess.loadPgn(moves);
  const legalMoves = chess.moves();

  return legalMoves.includes(nextPly)
    ? { ...variation, theMove, nextPly }
    : null;
};

interface OpeningTabsProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  variations?: Opening[];
  currentMoves?: string;
  handleMovePlayed: (move: string) => void;
  sites: SelectedSitesState;
  eco?: string;
  name?: string;
  from?: Opening[];
  lastKnownOpening: Partial<Opening>;
}

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
}: OpeningTabsProps) => {
  const { fen } = boardState;
  const { move } = toPlay(fen);

  const searchable = parseInt(move) > 4;
  const showExternal = sites.selectedSites.length > 0;
  const showTransitions = from && from.length > 1;

  const [html, setHtml] = useState<string | null>(null);

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
              <Roots {...{ moves: currentMoves, from }} />
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
