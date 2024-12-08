import "./App.css";
import "./stylesheets/about.css";
import { VERSION } from "./common/consts.js";

const About = () => (
    <>
        <div
            className="font-cinzel white left"
            style={{ fontSize: "12pt", marginLeft: "1em", marginTop: "1em" }}
        >
            version {VERSION}
        </div>
        <div className="about">
            <p>
                Fenster is a comprehensive chess opening reference with over
                15,000 variations in its database. The opening database content
                is public and can be found at{" "}
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.
            </p>
            <p>
                At present, there is no repository of chess games, though
                Fenster is capable of pulling game metadata from the following
                sources:{" "}
                <ul>
                    <li>
                        <a href="https://www.ficsgames.org/">FICS</a>
                    </li>
                    <li>
                        <a href="https://lichess.org/">lichess</a>
                    </li>
                </ul>
            </p>
            <h2>The Search Page</h2>
            <p>
                The Search Page can be used to search openings by entering moves
                on the board, or by pasting FEN or PGN text in the box below the
                board. If an opening is found in the database, information will
                be displayed on the right.
            </p>
            <img
                src="resources/SearchPage.png"
                className="image"
                alt="Search Page"
            />
            <p>
                At the top of the right column is the opening name, along with
                its{" "}
                <a href="https://en.wikipedia.org/wiki/Encyclopaedia_of_Chess_Openings#Main_ECO_codes">
                    ECO code
                </a>
                . Directly below that are continuations. There are two types:
                <ul>
                    <li>
                        Those that can be played from the current opening
                        sequence, called 'Next Moves';
                    </li>
                    <li>
                        Variations with a conflicting move sequence, called
                        transpositions
                    </li>
                </ul>
                The latter needs some explaination. Let's look at the move
                sequence 1.c4 d5:
                <img
                    src="resources/NextVsTransposition.png"
                    className="image"
                    alt="Next and Transposition variations"
                />
                </p>
                <p>From the current position, we can arrive at all three positons
                arising from the variations listed in the Next Moves tab.
                However, two continuations can be played directly (<b>2. cxd5</b> and <b>2.Nf3</b>).
                The two others are transpositions whose move sequences are in
                conflict with the current variation. In these cases, <b>2. c4</b> can't
                be played, because <b>1. c4</b> was played already. If you click on the
                variation name of the transposition, it will open a new tab with that variation's
                move sequence.
            </p>
            <p>
                The rightmost column is a chess engine evaluation* of the
                continuation. A positive score is better for White, and negative
                is better for Black. The continuations can be sorted by
                evaluation (absolute value, ascending), variation name, or ECO
                code.
            </p>
            <h3>Theory</h3>
            <p>
                This is a short explanation of the ideas behind the opening from{" "}
                <a href="https://en.wikibooks.org/wiki/Chess_Opening_Theory">
                    Wikibooks
                </a>
            </p>
            <img
                src="resources/Theory.png"
                className="image"
                alt="Chess Opening Theory tab"
            />
            <h3>External Info</h3>
            <p>
                At the upper right, available on all pages, is a selector to
                include information from FICS or lichess. If one of
                these has been selected, then the External Info tab will be
                displayed. On this tab is game data from the external site(s)
                selected.
                <img
                    src="resources/ExternalInfo.png"
                    className="image"
                    alt="external site data"
                />
                In the above image, lichess and FICS have been selected, and the
                External Info tab pane show the game information each site has.
                FICS has 8119 games with this position, and has 23010. FICS does
                not have a variation name for this position, Lichess has the
                same variation name as Fenster has, but this won't always be the
                case as variation names are not standardized.
            </p>
            <h3>Roots</h3>
            <p>
                An opening position might be arrived at through different root
                move sequences.
            </p>
            <img src="resources/Roots.png" className="image" alt="Roots tab" />
            <p>
                In the position shown above, the variation in Fenster's opening
                book is named <b>DO6 Queen's Gambit</b>. This position can be
                arrived at via the move sequences{" "}
                <b>English Opening: Anglo-Scandinavian Defense</b> or from the{" "}
                <b>Queen's Pawn Game</b>.
            </p>
            <h3>Similar openings</h3>
            <p>
                After five moves by white, the Similar Openings tab <i>may</i>{" "}
                appear. If it does, clicking on the tab will show a list of
                positions that are (somewhat) like the current position.
            </p>
            <img
                src="resources/Similar.png"
                alt="similar openings shown"
                className="image"
            />
            <h3> What does the '*' mean? </h3>
            <p>
                Some entries in Fenster's opening "book" are <i>interpolated</i>
                , meaning that they respresent moves that were missing between
                to varitions in the original{" "}
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>{" "}
                data (itself pulled form several different sources). To provide
                continuity between variations, new "variations" were inserted
                (interpolated) to fill in the gaps. If there is a gap between
                variations "A" and "B", then the interpolated variation names
                will be "A*".
            </p>
            <h2>The PGN Import Page</h2>
            <img
                src="resources/PgnImport.png"
                alt="the PGN import page"
                className="image"
            />
            <p>
                This page has links to games at
                <a href="https://theweekinchess.com/">The Week in Chess</a>{" "}
                website. Clicking on the a link will show information from the
                PGN file in the Summary tab. Selecting one or more of the check
                boxes under Openings (at left) will filter the games shown in
                the Games tab.{" "}
            </p>
            <img
                src="resources/PgnGameFilter.png"
                alt="the PGN import page"
                className="image"
                style={{ maxWidth: "50%" }}
            />
            <p>
                Now the Games tab will show only those games with the selected
                opening(s).
            </p>
            <img
                src="resources/PgnGameList.png"
                alt="the PGN game list"
                className="image"
            />
            <p>
                By clicking on the opening name of one of the games listed, the
                Opening tab will show what Fenster knows about the opening.
            </p>
            <img
                src="resources/PgnGameDetail.png"
                alt="the PGN import page"
                className="image"
            />
            <h2>Visualizations</h2>
            <img
                src="resources/Visualizations.png"
                alt="the PGN import page"
                className="image"
            />
            <p>
                These are experimental and targeted toward the idly curious.
                <h3>From-To squares</h3>
                <p>
                    For all variations in a selected ECO code, an association
                    graph will be drawn showing origination and destination
                    squares of all pieces.
                </p>
                <h3>ECO categories and codes</h3>
                <p>
                    By selecting an ECO category, a list of all ECO codes in
                    that category will be shown.
                </p>
                <h3>Most active squares</h3>
                <p>
                    This is a heatmap showing which squares are most "active",
                    meaning the most common destination of all pieces for a
                    given ECO code
                </p>
                <h3>Destination squares</h3>
                <p>
                    Similar to above, this heatmap pertains to specific pieces
                    and player color. Inspired by{" "}
                    <a href="https://github.com/Ramon-Deniz/ChessData">
                        this project
                    </a>
                    .
                </p>
            </p>
            <h2>Questions? Bugs? Feature requests?</h2>
            The Fenster client is an open source project maintained on github.
            There you can open a{" "}
            <a href="https://github.com/JeffML/fensterchess/discussions/1">
                discussion
            </a>
            ,{" "}
            <a href="https://github.com/JeffML/fensterchess/issues">
                log a bug, or request a feature
            </a>
            .
        </div>
    </>
);

export default About;
