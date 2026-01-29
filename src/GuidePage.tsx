import "./App.css";
import { VERSION } from "./common/consts";
import {
  CHESS_DATA,
  DISCUSSION,
  ECO_JSON,
  FICS_GAMES,
  ISSUES,
  LICHESS,
  MEDIUM_INTERPOLATED2,
  TWIC,
  WIKI_ECO,
  WIKI_THEORY,
} from "./common/urlConsts";
import "./stylesheets/about.css";

const toc = [
  {
    id: "search",
    label: "The Search Page",
    subs: [
      { id: "search-position", label: "Search by Position" },
      { id: "search-name", label: "Search by Name" },
      { id: "theory", label: "Theory" },
      { id: "external-info", label: "External Info" },
      { id: "roots", label: "Roots" },
      { id: "similar", label: "Similar openings" },
    ],
  },
  { id: "pgn", label: "The PGN Import Page" },
  {
    id: "visualizations",
    label: "Visualizations",
    subs: [
      { id: "fromto", label: "From-To squares" },
      { id: "eco-categories", label: "ECO categories and codes" },
      { id: "active-squares", label: "Most active squares" },
      { id: "destination-squares", label: "Destination squares" },
    ],
  },
  { id: "questions", label: "Questions? Bugs? Feature requests?" },
];

function TocSidebar() {
  // Use a green accent for TOC links for visibility on dark backgrounds
  const accent = "#6fcf97"; // soft green, matches site accent
  return (
    <nav
      className="guide-toc"
      style={{
        position: "sticky",
        top: 20,
        alignSelf: "flex-start",
        minWidth: 220,
        maxWidth: 260,
        marginRight: 32,
      }}
    >
      <h2
        style={{
          fontSize: "1.1em",
          marginBottom: 8,
          color: accent,
          borderBottom: `2px solid ${accent}`,
          paddingBottom: 2,
        }}
      >
        Guide Contents
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {toc.map((section) => (
          <li key={section.id} style={{ marginBottom: 8 }}>
            <a
              href={`#${section.id}`}
              style={{ color: accent, textDecoration: "none", fontWeight: 600 }}
            >
              {section.label}
            </a>
            {section.subs && (
              <ul style={{ listStyle: "none", paddingLeft: 16, marginTop: 4 }}>
                {section.subs.map((sub) => (
                  <li key={sub.id} style={{ marginBottom: 4 }}>
                    <a
                      href={`#${sub.id}`}
                      style={{
                        color: "#b6f5c3",
                        textDecoration: "none",
                        fontWeight: 400,
                      }}
                    >
                      {sub.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const GuidePage = () => (
  <div style={{ display: "flex", alignItems: "flex-start" }}>
    <TocSidebar />
    <main style={{ flex: 1 }}>
      <div className="font-cinzel white left version">version {VERSION}</div>
      <div className="about">
        <p>
          Fenster is a comprehensive chess opening reference with over 15,000
          variations in its database. The opening database content is public and
          can be found at <a href={ECO_JSON}>eco.json</a>.
        </p>
        <p>
          Fenster is not a repository of chess games, though it does pull game
          metadata from the following sources:{" "}
        </p>
        <ul style={{ marginLeft: "inherit" }}>
          <li>
            <a href={FICS_GAMES}>FICS</a>
          </li>
          <li>
            <a href={LICHESS}>lichess</a>
          </li>
        </ul>
        <h2 id="search">The Search Page</h2>
        <p>
          The Search Page offers two ways to find openings: by position or by
          name. Use the tabs above the input fields to switch between search
          modes.
        </p>
        <img
          src="resources/SearchPage.png"
          className="image"
          alt="Search Page"
        />
        <h3 id="search-position">Search by Position</h3>
        <p>
          Search openings by entering moves on the board, or by pasting FEN or
          PGN text in the separate Position (FEN) and Move Sequence input
          fields. If an opening is found in the database, information will be
          displayed on the right.
        </p>
        <p>
          <b>Position-only FEN:</b> You can paste just the board position part
          of a FEN string (without turn, castling, or en passant info). Fenster
          will look it up in the opening book and load the matching opening
          automatically.
        </p>
        <p>
          <b>Nearest Opening:</b> When you enter moves that don't match any
          known opening exactly, Fenster will search backward through your move
          history to find the nearest opening in the database. A yellow banner
          will indicate how many moves back the nearest match was found (e.g.,
          "Nearest known opening is 2 moves back").
        </p>
        <h3 id="search-name">Search by Name</h3>
        <p>
          Click the "By Name" tab to search for openings by typing their name.
          The search is fuzzy and supports:
        </p>
        <ul style={{ marginLeft: "inherit" }}>
          <li>
            Case-insensitive matching (e.g., "sicilian" finds "Sicilian
            Defense")
          </li>
          <li>
            Multi-word search in any order (e.g., "indian king" finds "King's
            Indian Defense")
          </li>
          <li>Common aliases (e.g., "petrov" also finds "Petroff Defense")</li>
        </ul>
        <p>
          Results appear as you type, showing up to 20 matching openings.
          Duplicate names are filtered to show only the shortest variation.
          Click any result to load that opening on the board.
        </p>
        <p>
          At the top of the right column is the opening name, along with its{" "}
          <a href={WIKI_ECO}>ECO code</a>. Directly below that are variations.
          There are two types:
        </p>
        <ul style={{ marginLeft: "inherit" }}>
          <li>
            Those that can be played from the current opening sequence, called
            'Continuations'
          </li>
          <li>
            Variations with a conflicting move sequence, called 'Transpositions'
          </li>
        </ul>
        <p>
          The latter needs some explanation. Let's look at the move sequence{" "}
          <b>1.c4 d5</b>:
          <img
            src="resources/Transpositions.png"
            className="image"
            alt="Next and Transposition variations"
          />
        </p>
        <p>
          From the current position, it is possible to move directly to the two
          positions listed under 'Continuations' by playing either
          <b>2. cxd5</b> and <b>2.Nf3</b>. The two variations listed under
          'Transpositions' have move sequences that are in conflict with the
          current opening shown on the board. In both of these cases,{" "}
          <b>2. c4</b> can't be played, because <b>1. c4</b> was already played.
          Clicking on the varition name of the transposition will open a new
          browser tab with the transposition's move sequence.
        </p>
        <p>
          Some opening names are italicized. These are{" "}
          <a href={MEDIUM_INTERPOLATED2}>interpolated openings</a>. These were
          added to fill in missing move sequences between variations from the
          original reference sources used by
          <a href={ECO_JSON}>eco.json</a>. Interpolated openings allow
          navigation continuity between variations.
        </p>
        <p>
          The rightmost column is a chess engine evaluation of the variation. A
          positive score is better for White, and negative is better for Black.
          The variations can be sorted by evaluation (absolute value,
          ascending), variation name, or ECO code.
        </p>
        <h3 id="theory">Theory</h3>
        <p>
          This is a short explanation of the ideas behind the opening from{" "}
          <a href={WIKI_THEORY}>Wikibooks</a>
        </p>
        <img
          src="resources/Theory.png"
          className="image"
          alt="Chess Opening Theory tab"
        />
        <h3 id="external-info">External Info</h3>
        <p>
          On all pages is a selector on the upper right to include information
          from FICS or lichess. If one of these has been selected, then the
          External Info tab will be displayed. On this tab is game data from the
          external site(s) selected.
          <img
            src="resources/ExternalInfo.png"
            className="image"
            alt="external site data"
          />
        </p>
        <p>
          In the above image, lichess was selected earlier, and the External
          Info tab pane shows aggregate game information from that site. Lichess
          shows 464 games in it's database with this position. It also has the
          same opening name as Fenster, though this won't always be the case as
          opening names are not standardized.
        </p>
        <h3 id="roots">Roots</h3>
        <p>
          An opening position might be arrived at through different root move
          sequences.
        </p>
        <img src="resources/Roots.png" className="image" alt="Roots tab" />
        <p>
          In the position shown above, the variation in Fenster's opening book
          is named <b>DO6 Queen's Gambit</b>. This position can be arrived at
          via the move sequences{" "}
          <b>English Opening: Anglo-Scandinavian Defense</b> or from the{" "}
          <b>Queen's Pawn Game</b>. Clicking on the root opening name will open
          a new browser tab with that opening.
        </p>
        <h3 id="similar">Similar openings</h3>
        <p>
          After five moves by white, the Similar Openings tab <i>may</i> appear.
          If it does, clicking on the tab will show a list of positions that are
          (somewhat) like the current position.
        </p>
        <img
          src="resources/Similar.png"
          alt="similar openings shown"
          className="image"
        />
        <h2 id="pgn">The PGN Import Page</h2>
        <img
          src="resources/PgnImport.png"
          alt="the PGN import page"
          className="image"
        />
        <p>
          This page has links to games at <a href={TWIC}>The Week in Chess</a>{" "}
          website. Clicking on the a link will show information from the PGN
          file in the Summary tab. Selecting one or more of the check boxes
          under Openings (at left) will filter the games shown in the Games
          tab.{" "}
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
        <p>
          By clicking on the Fenster Opening Name, a new Fenster page will be
          opened with that variation.
        </p>
        <h2 id="visualizations">Visualizations</h2>
        <img
          src="resources/Visualizations.png"
          alt="the PGN import page"
          className="image"
        />
        <p>These are experimental and targeted toward the idly curious.</p>
        <h3 id="fromto">From-To squares</h3>
        <p>
          For all variations in a selected ECO code, an association graph will
          be drawn showing origination and destination squares of all pieces.
        </p>
        <h3 id="eco-categories">ECO categories and codes</h3>
        <p>
          By selecting an ECO category, a list of all ECO codes in that category
          will be shown.
        </p>
        <h3 id="active-squares">Most active squares</h3>
        <p>
          This is a heatmap showing which squares are most "active", meaning the
          most common destination of all pieces for a given ECO code
        </p>
        <h3 id="destination-squares">Destination squares</h3>
        <p>
          Similar to above, this heatmap pertains to specific pieces and player
          color. Inspired by <a href={CHESS_DATA}>this project</a>.
        </p>
        <h2 id="questions">Questions? Bugs? Feature requests?</h2>
        The Fenster client is an open source project maintained on github. There
        you can open a <a href={DISCUSSION}>discussion</a>,{" "}
        <a href={ISSUES}>log a bug, or request a feature</a>.
      </div>
    </main>
  </div>
);

export default GuidePage;
