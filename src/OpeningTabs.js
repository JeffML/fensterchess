import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { NextOpenings, Roots } from "./NextOpenings.js";
import { parseMoves, theoryRequest, toPlay } from "./utils/chessTools.js";
import { Chess } from "chess.js";
import { useState, useEffect } from "react";
import { OpeningAdditionalWithBarChartGrid } from "./OpeningAdditional.js";
import { SimilarOpenings } from "./SimilarOpenings.js";

const chess = new Chess();

const Theory2 = ({ html }) => {
    return (
        <div
            style={{ textAlign: "left", marginLeft: "1em" }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

/**
 * An "next" opening variation can be either:
 * - moved to from current move sequence (legal move)
 * - transposed to from a different move sequence (yet same position as current move sequence)
 *
 * @param {*} nextMoves
 * @param {*} currentMoves
 * @returns {{ legalMoves: {}; transpositions: {}; }}
 */
const moveLists = ({ nextMoves: variations, currentMoves }) => {
    let legalMoves = [];
    let transpositions = [];

    for (const variation of variations) {
        const lm = legalMove(currentMoves, variation);
        if (lm) {
            legalMoves.push(lm);
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
    fen,
    setFen,
    nextMoves,
    currentMoves,
    handleMovePlayed,
    sites,
    eco,
    name,
    from,
}) => {
    const tabStyle = {
        border: "1px solid #FFFFFF ",
        borderRadius: "10px 10px 0 0",
    };
    const { move, color } = toPlay(fen);

    const searchable = move > 5 || (move === "5" && color === "b");
    const showExternal = sites.selectedSites.length > 0;
    const showTransitions = from && from.length > 1;

    const [html, setHtml] = useState(null);

    const { legalMoves, transpositions } = moveLists({
        nextMoves,
        currentMoves,
    });

    useEffect(() => {
        theoryRequest(currentMoves, setHtml);
    }, [currentMoves]);

    return (
        <Tabs
            style={{ minWidth: "-webkit-fill-available", marginRight: "2em" }}
        >
            <TabList className="left" style={{ marginBottom: "0px" }}>
                {legalMoves && legalMoves.length !== 0 && (
                    <Tab style={tabStyle}>Next Moves</Tab>
                )}
                {showTransitions && <Tab style={tabStyle}>Roots</Tab>}
                {html && <Tab style={tabStyle}>Theory</Tab>}
                {showExternal && <Tab style={tabStyle}>External Info</Tab>}
                {searchable && <Tab style={tabStyle}>Similar Openings</Tab>}
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
                {html && (
                    <TabPanel>
                        <Theory2 {...{ html }} />
                    </TabPanel>
                )}
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
                        <SimilarOpenings {...{ fen, setFen }} />
                    </TabPanel>
                )}
            </div>
        </Tabs>
    );
};

export { OpeningTabs };
