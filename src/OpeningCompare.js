import { ExitButton } from "./common/buttons.js";
import { OpeningAdditionalTable } from "./OpeningAdditional.js";
import { movesToFen } from "./utils/chessTools.js";

const cellStyle = {
    paddingLeft: "15px",
    paddingRight: "15px",
};

const GameDetails = ({ white, black }) => (
    <div className="column-double centered">
        <p className="font-cinzel" style={{ fontSize: "x-large" }}>
            Game Details
        </p>

        <div className="row white">
            <div className="column centered player">
                White: {white.title ?? ""} {white.name}
                <br />
                Rating: {white.elo ?? "n/a"}
            </div>
            <div className="column centered player">
                Black: {black.title ?? ""} {black.name}
                <br />
                Rating: {black.elo ?? "n/a"}
            </div>
        </div>
    </div>
);

const OpeningDetailRow = ({ site, name, moves }) => (
    <tr>
        <td style={cellStyle}>{site}</td>
        <td style={cellStyle}>{name}</td>
        <td style={cellStyle}>{moves}</td>
    </tr>
);

const OpeningDetails = ({ name, moves, openingBook, fen }) => {
    return (
        <>
            <div className="row">
                <table style={{ borderCollapse: "collapse" }}>
                    <tbody>
                        <tr>
                            <th style={cellStyle}>Source</th>
                            <th style={cellStyle}>Opening</th>
                            <th style={cellStyle}>Moves</th>
                        </tr>
                        <OpeningDetailRow {...{ site: "PGN", name, moves }} />
                        <OpeningDetailRow
                            {...{
                                site: "ECO",
                                name: openingBook.name,
                                moves: openingBook.bookMoves,
                            }}
                        />
                    </tbody>
                </table>
            </div>
            <div className="row">
                <OpeningAdditionalTable {...{ fen }} />
            </div>
        </>
    );
};

const OpeningCompare = ({ comparing, setComparing }) => {
    const goBack = () => setComparing(null); // Return handler

    const openingBook = comparing.getObOpening();
    const {
        game: { white, black },
        gameOpening: { name, moves },
    } = comparing;
    const fen = movesToFen(openingBook.bookMoves);

    return (
        <>
            <div className="row centered white">
                <h2>Opening Comparison</h2>
            </div>
            <GameDetails {...{ white, black }} />
            <OpeningDetails
                {...{ name, moves, openingBook, fen, comparing, goBack }}
            />
            <div className="row white">
                <ExitButton
                    {...{
                        style: { width: "9em" },
                        onClick: goBack,
                        text: "Return",
                    }}
                />
            </div>
        </>
    );
};

export default OpeningCompare;
