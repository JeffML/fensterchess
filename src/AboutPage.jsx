import './App.css';
import './stylesheets/about.css';
import { VERSION } from './common/consts.js';

const About = () => (
    <>
        <div
            className="font-cinzel white left"
            style={{ fontSize: '12pt', marginLeft: '1em', marginTop: '1em' }}
        >
            version {VERSION}
        </div>
        <div className="about">
            <p>
                Fenster is a comprehensive chess opening reference with over
                15,000 variations in its database. The opening database content
                is public and can be found at{' '}
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.
            </p>
            <p>
                At present, there is no repository of chess games, though
                Fenster is capable of pulling game metadata from the following
                sources:{' '}
            </p>
            <ul style={{marginLeft: "inherit"}}>
                <li>
                    <a href="https://www.ficsgames.org/">FICS</a>
                </li>
                <li>
                    <a href="https://lichess.org/">lichess</a>
                </li>
            </ul>
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
                its{' '}
                <a href="https://en.wikipedia.org/wiki/Encyclopaedia_of_Chess_Openings#Main_ECO_codes">
                    ECO code
                </a>
                . Directly below that are variations. There are two types:
            </p>
            <ul style={{marginLeft: "inherit"}}>
                <li>
                    Those that can be played from the current opening sequence,
                    called 'Continuations'
                </li>
                <li>
                    Variations with a conflicting move sequence, called
                    'Transpositions'
                </li>
            </ul>
            <p>
                The latter needs some explanation. Let's look at the move
                sequence <b>1.c4 d5</b>:
                <img
                    src="resources/Transpositions.png"
                    className="image"
                    alt="Next and Transposition variations"
                />
            </p>
            <p>
                From the current position, it is possible to move directly to
                the two positions listed under 'Continuations' by playing either
                <b>2. cxd5</b> and <b>2.Nf3</b>. The two variations listed under
                'Transpositions' have move sequences that are in conflict with
                the current opening shown on the board. In both of these cases,{' '}
                <b>2. c4</b> can't be played, because <b>1. c4</b> was already
                played. Clicking on the varition name of the transposition will
                open a new browser tab with the transposition's move sequence.
            </p>
            <p>
                Some opening names are italicized. These are{' '}
                <a href="https://medium.com/@jefflowery/navigating-chess-openings-part-2-408a488d919b">
                    interpolated openings
                </a>
                . These were added to fill in missing move sequences between
                variations from the original reference sources used by
                <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.
                Interpolated openings allow navigation continuity between
                variations.
            </p>
            <p>
                The rightmost column is a chess engine evaluation of the
                variation. A positive score is better for White, and negative is
                better for Black. The variations can be sorted by evaluation
                (absolute value, ascending), variation name, or ECO code.
            </p>
            <h3>Theory</h3>
            <p>
                This is a short explanation of the ideas behind the opening from{' '}
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
                On all pages is a selector on the upper right to include
                information from FICS or lichess. If one of these has been
                selected, then the External Info tab will be displayed. On this
                tab is game data from the external site(s) selected.
                <img
                    src="resources/ExternalInfo.png"
                    className="image"
                    alt="external site data"
                />
            </p>
            <p>
                In the above image, lichess was selected earlier, and the
                External Info tab pane shows aggregate game information from
                that site. Lichess shows 464 games in it's database with this
                position. It also has the same opening name as Fenster, though
                this won't always be the case as opening names are not
                standardized.
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
                arrived at via the move sequences{' '}
                <b>English Opening: Anglo-Scandinavian Defense</b> or from the{' '}
                <b>Queen's Pawn Game</b>. Clicking on the root opening name will
                open a new browser tab with that opening.
            </p>
            <h3>Similar openings</h3>
            <p>
                After five moves by white, the Similar Openings tab <i>may</i>{' '}
                appear. If it does, clicking on the tab will show a list of
                positions that are (somewhat) like the current position.
            </p>
            <img
                src="resources/Similar.png"
                alt="similar openings shown"
                className="image"
            />
            <h2>The PGN Import Page</h2>
            <img
                src="resources/PgnImport.png"
                alt="the PGN import page"
                className="image"
            />
            <p>
                This page has links to games at{' '}
                <a href="https://theweekinchess.com/">The Week in Chess</a>{' '}
                website. Clicking on the a link will show information from the
                PGN file in the Summary tab. Selecting one or more of the check
                boxes under Openings (at left) will filter the games shown in
                the Games tab.{' '}
            </p>
            <img
                src="resources/PgnGameFilter.png"
                alt="the PGN import page"
                className="image"
                style={{ maxWidth: '50%' }}
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
            <p>
                By clicking on the Fenster Opening Name, a new Fenster page will
                be opened with that variation.
            </p>
            <h2>Visualizations</h2>
            <img
                src="resources/Visualizations.png"
                alt="the PGN import page"
                className="image"
            />
            <p>These are experimental and targeted toward the idly curious.</p>
            <h3>From-To squares</h3>
            <p>
                For all variations in a selected ECO code, an association graph
                will be drawn showing origination and destination squares of all
                pieces.
            </p>
            <h3>ECO categories and codes</h3>
            <p>
                By selecting an ECO category, a list of all ECO codes in that
                category will be shown.
            </p>
            <h3>Most active squares</h3>
            <p>
                This is a heatmap showing which squares are most "active",
                meaning the most common destination of all pieces for a given
                ECO code
            </p>
            <h3>Destination squares</h3>
            <p>
                Similar to above, this heatmap pertains to specific pieces and
                player color. Inspired by{' '}
                <a href="https://github.com/Ramon-Deniz/ChessData">
                    this project
                </a>
                .
            </p>
            <h2>Questions? Bugs? Feature requests?</h2>
            The Fenster client is an open source project maintained on github.
            There you can open a{' '}
            <a href="https://github.com/JeffML/fensterchess/discussions/1">
                discussion
            </a>
            ,{' '}
            <a href="https://github.com/JeffML/fensterchess/issues">
                log a bug, or request a feature
            </a>
            .
        </div>
    </>
);

export default About;
