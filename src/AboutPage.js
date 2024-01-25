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
                15,000 variations. The base opening data is public and can be
                found at{" "}
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.
            </p>
            <p>
                Fenster is not a repository of chess games, though it is capable
                of pulling in associated opening and game information from{" "}
                <a href="https://www.ficsgames.org/">FICS</a>,{" "}
                <a href="https://lichess.org/">lichess</a>, and{" "}
                <a href="https://www.shredderchess.com/">Shredder</a> sites if
                requested.
            </p>
            <h2>The Search Page</h2>
            <p>
                The Search Page can be used to search openings by entering moves
                on the board, or by pasting FEN or PGN text in the box below the
                board. If an opening is found in the database, information will
                be displayed on the right.
            </p>
            <img
                src="resources/Screenshot 2024-01-25 9.09.53 AM.png"
                className="image"
                alt="Search Page"
            />
            <p>
                At the top of the right column is the opening name, along with
                its{" "}
                <a href="https://en.wikipedia.org/wiki/Encyclopaedia_of_Chess_Openings#Main_ECO_codes">
                    ECO code
                </a>
                . Directly below that are next move continuations. A
                continuation may branch into a new opening variation, or may
                continue along the current opening variation. By clicking on the
                variation name, the next move will be made on the board.
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
                src="resources/Screenshot 2024-01-25 9.10.34 AM.png"
                className="image"
                alt="Chess Opening Theory tab"
            />
            <h3>External Info</h3>
            <p>
                At the upper right, available on all pages, is a selector to
                include information from FICS, lichess, or Shredder. If one of
                These has been selected, then the External Info tab will be
                displayed. On this tab is game data from the external site(s)
                selected.
                <img
                    src="resources/Screenshot 2024-01-25 9.47.13 AM.png"
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
            <h3>Transitions</h3>
            <p>
                An opening position might be arrived at through different move
                sequences, transitioning from one variation to another.
            </p>
            <img
                src="resources/Screenshot 2024-01-25 9.15.32 AM.png"
                className="image"
                alt="Opening Transitions tab"
            />
            <p>
                In the position shown above, the variation in Fenster's opening
                book is named <b>DO6 Queen's Gambit</b>. This position can be
                arrived at via the{" "}
                <b>English Opening: Anglo-Scandinavian Defense</b> or from the{" "}
                <b>Queen's Pawn Game</b> move order.
            </p>
            <h3>Similar openings</h3>
            <p>
                After five moves by white, the Similar Openings tab <i>may</i>{" "}
                appear. If it does, clicking on the tab will show a list of
                positions that are (somewhat) like the current position.
            </p>
            <img
                src="resources/Screenshot 2024-01-25 9.12.30 AM.png"
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
                src="resources/Screenshot 2024-01-25 10.23.53 AM.png"
                alt="the PGN import page"
                className="image"
            />
            <p>
                This page has links to games at
                <a href="https://theweekinchess.com/">The Week in Chess</a>{" "}
                website. Clicking on the a link will show information from the PGN file in the Summary tab. 
                Selecting one or more of the check boxes under Openings (at left) will filter the games shown in the Games tab. </p>
                
                <img
                src="resources/Screenshot 2024-01-25 12.07.23 PM.png"
                alt="the PGN import page"
                className="image" style={{maxWidth:"50%"}}
            />
            <p>Now the Games tab will show only those games with the selected opening(s).</p>
<img
                src="resources/Screenshot 2024-01-25 12.08.06 PM.png"
                alt="the PGN import page"
                className="image"
            />
            <p>By clicking on the opening name of one of the games listed, the Opening tab will show what Fenster knows about the opening.</p>
<img
                src="resources/Screenshot 2024-01-25 12.08.38 PM.png"
                alt="the PGN import page"
                className="image"
            />
            <h2>Questions?</h2>
            <p>Email us at <a href="mailto:fensterchess@gmail.com">Fenster</a> and
            we will get back to you soon.</p>
        </div>
    </>
);

export default About;
