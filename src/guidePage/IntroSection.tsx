import { ECO_JSON, FICS_GAMES, LICHESS } from "../common/urlConsts";

export const IntroSection = () => (
  <>
    <p>
      Fenster is a comprehensive chess opening reference with over 15,000
      variations in its database. The opening database content is public and can
      be found at <a href={ECO_JSON}>eco.json</a>.
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
  </>
);
