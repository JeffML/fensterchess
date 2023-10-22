import "./App.css";
import "./stylesheets/about.css";

const About = () => (
    <div className="about">
        <p>
            Fenster is a comprehensive chess opening reference site, the basis
            of which is <a href="">eco.json</a>. It is not a repository of chess
            games, though Fenster is capable of pulling in associated game
            information from FICS, lichess, and Shredder sites if requested.
        </p>
        <h2>The Search Page</h2>
        The Search Page is the default page. You can locate and opening by
        entering moves in the board at left, or entering a FEN or PGN in the
        text box below the board. When (and if) an opening is located,
        information about it is displayed on the right side. This includes the
        opening name, its ECO code and what variations, if any, branch off from
        this opening position. Sometimes, an opening position can be arrived at
        by difference move sequences; these will be displayed below the
        variations at right.
        <p>
            In most cases there is an evaluation given for each variation
            displayed at right. These scores are generated by Stockfish after
            running for 1.5 seconds on an Intel i7 processor. Variations can be
            sorted by evaluation (absolute value) as well as by opening name.
        </p>
        <p>
            At the upper right, available on all pages, is a selector to include
            information of FICS, lichess, or Shredder. The information, when
            selected, will include how many games with the current position can
            be found on each side, and what the white win, black win, and draw
            statistics are.
        </p>
        <h3> What is the "(i)"? </h3>
        Some entries in the opening "book" are <i>interpolated</i>. This means
        that there were no specific entries in eco.json, so variations that had
        no name were filled in. For instance, variations A and B are related,
        but there is a gap between them where the move sequences are not all
        named (have entries) in the opening book. In this case, the gap is
        filled in like: A=&lt;A'=&lt;A''=&lt;...B. For interpolated openings,
        the name of A is used (+ "(i)"). If you think you know a more
        appropriate name, contact the site administrator.
        <h2>The PGN Import Page</h2>
        This page shows downloads available from The Week in Chess website. (You
        have also the option to upload a PGN file from your computer.) By
        clicking on onw of the TWIC links, infomation about openings in the PGN
        file is displayed, as well at the players and rating information. You
        can sort the list of players by name, rating (ELO) or title.
        <p>
            In addition to the Summary tab, the is the Games tab. This will
            display information about each game in the PGN file. If you click on
            the Opening name, it will display what Fenster know the opening name
            (which may be different from what is called in the PGN file), as
            well as the move sequence. If one or more of the sites in the upper
            right are selected the opening name as known to each site is
            displayed, as well as aggregate statistics for that opening.
        </p>
        <h2>Developer Notes</h2>
        It is intended to make the Fenster client code open source, but as of
        now only trusted collaborators will be accepted. The tech stack for
        Fenster client is:
        <ul>
            <li>JavaScript (not TypeScript)</li>
            <li>Node.js</li>
            <li>React</li>
            <li>Apollo Client GraphQL</li>
            <li>kokopu and chess.js</li>
        </ul>
        Netlify is the hosting service. There are no tests, but I'm open to
        authors of integration tests using Cypress, or unit tests using Jest.
        The Fenster server code is closed, but that could change. Since the
        database is derived solely from eco.json (+ Stockfish evaluations), it
        is perfectly possible to generate a database of your own that will
        support the GraphQL schema (to be published soon), though it is a
        substantial amount of work.
    </div>
);

export default About;
