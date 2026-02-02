import { TWIC } from "../common/urlConsts";

export const PgnSection = () => (
  <>
    <h2 id="pgn">The PGN Import Page</h2>
    <img
      src="resources/PgnImport.png"
      alt="the PGN import page"
      className="image"
    />
    <p>
      This page has links to games at <a href={TWIC}>The Week in Chess</a>{" "}
      website. Clicking on the a link will show information from the PGN file in
      the Summary tab. Selecting one or more of the check boxes under Openings
      (at left) will filter the games shown in the Games tab.{" "}
    </p>
    <img
      src="resources/PgnGameFilter.png"
      alt="the PGN import page"
      className="image"
      style={{ maxWidth: "50%" }}
    />
    <p>
      Now the Games tab will show only those games with the selected opening(s).
    </p>
    <img
      src="resources/PgnGameList.png"
      alt="the PGN game list"
      className="image"
    />
    <p>
      By clicking on the opening name of one of the games listed, the Opening
      tab will show what Fenster knows about the opening.
    </p>
    <img
      src="resources/PgnGameDetail.png"
      alt="the PGN import page"
      className="image"
    />
    <p>
      By clicking on the Fenster Opening Name, a new Fenster page will be opened
      with that variation.
    </p>
  </>
);
