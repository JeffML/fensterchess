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
                
                
                This includes the opening
                name, its ECO code and what variations, if any, branch off from
                the opening position. Sometimes, an opening position can be
                arrived at by difference move sequences; these will be displayed
                below the variations at right.
            </p>
            <p>
                In most cases there is an evaluation given for each variation
                displayed at right. These scores are generated by{" "}
                <a href="https://stockfishchess.org/">Stockfish</a> after
                running for 1.5 seconds on an Intel i7 processor. Variations can
                be sorted by evaluation (absolute value) as well as by opening
                name.
            </p>
            <p>
                At the upper right, available on all pages, is a selector to
                include information of FICS, lichess, or Shredder. The
                information, when selected, will include how many games with the
                current position can be found on each side, and what the white
                win, black win, and draw statistics are.
            </p>
            <h3>Similar openings</h3>
            <p>
                After five complete moves, the __Similar Openings__ tab _may_
                list openings that are similar to the current one. The algorithm
                for determine what makes an opening similar will likely be
                refined in the future.
            </p>
            <h3> What does the '*' mean? </h3>
            <p>
                Some entries in the opening "book" are <i>interpolated</i>. This
                means that there were no specific entries in{" "}
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>,
                for a sequence of moves in a variation B. Opening entries were
                generated for each prior move in B until arriving at a root
                variation A that is in the opening book. In this case, the gap
                is filled in like:
            </p>
            <pre>A =&gt; A' =&gt; A'' =&gt; ... =&gt; B</pre>{" "}
            <p>
                For interpolated openings, the name of variation A is used with
                the addition of an "*". These names should be considered
                placeholders for real variation names, should they come along
                later.
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
