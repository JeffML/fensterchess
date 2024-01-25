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
                be displayed on the right.{" "}
            </p>
            <img
                src="resources/Screenshot 2024-01-24 1.29.02 PM.png"
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
            <p>
                At the upper right, available on all pages, is a selector to
                include information from FICS, lichess, or Shredder. If one of
                These has been selected, then the External Info tab will be
                displayed. On this tab is game data from the external site(s)
                selected.
                <img
                    src="resources/Screenshot 2024-01-24 1.44.48 PM.png"
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
            <h3>Similar openings</h3>
            <p>
                After five moves by white, the Similar Openings tab <i>may</i>{" "}
                appear. If it does, clicking on the tab will show a list of
                positions that are (somewhat) like the current position.
                <img
                    src="resources/Screenshot 2024-01-24 2.02.33 PM.png"
                    alt="similar openings shown"
                    className="image"
                />
            </p>
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
            <p>
                This page shows downloads available from{" "}
                <a href="https://theweekinchess.com/">The Week in Chess</a>{" "}
                website. (You also have the option to upload a PGN file from
                your computer.) By clicking on one of the TWIC links, infomation
                about openings in the PGN file is displayed, as well at the
                players and rating information. You can sort the list of players
                by name, rating (ELO) or title.
            </p>
            <p>
                In addition to the Summary tab, the are the Games and Openings
                tabs. These will display information about each game in the PGN
                file. If you click on the Opening name in the games listed, it
                will take you to the Openings tab with more information about
                the game opening, including the Fenster opening name (which may
                be different from what is called in the PGN file), as well as
                the move sequence and FEN. If one or more of the sites in the
                upper right menu are selected, the opening name as known to each
                site is displayed, as well as aggregate statistics for that
                opening.
            </p>
            <h2>Questions? Bugs?</h2>
            If you have any questions, spot a bug, or have suggestions for a
            feature you would like to see, contact us at{" "}
            <a href="mailto:fensterchess@gmail.com">Fenster</a> and we will get
            back to you soon.
            <div style={{ display: "none" }}>
                <h2>Developer Notes</h2>
                <p>
                    It is intended to make the Fenster client code open source,
                    but as of now only trusted collaborators will be accepted.
                    The tech stack for Fenster client is:
                </p>
                <ul>
                    <li>JavaScript</li>
                    <li>Node.js</li>
                    <li>React</li>
                    <li>Apollo GraphQL (client)</li>
                    <li>kokopu and chess.js</li>
                </ul>
                <p>
                    Netlify is the hosting service. There are no tests, but I'm
                    open to authors of integration tests using Cypress, or unit
                    tests using Jest. The Fenster server code is closed, but
                    that could change. Since the database is derived solely from
                    eco.json (+ Stockfish evaluations), it is perfectly possible
                    to generate a database of your own that will support the
                    GraphQL schema (to be published soon), though it is a
                    substantial amount of work.
                </p>
            </div>
        </div>
    </>
);

export default About;
