import { VERSION } from "./common/consts";
import { ECO_JSON, DISCUSSION, ISSUES } from "./common/urlConsts";
import "./stylesheets/about.css";

const About = () => (
  <>
    <div className="font-cinzel white left version">version {VERSION}</div>
    <div className="about">
      <h1>About Fenster Chess</h1>
      <h2>Project Purpose & Philosophy</h2>
      <p>
        Fenster is an open-source chess opening reference designed to make the
        world’s chess opening knowledge accessible, transparent, and explorable
        for everyone. The project aims to provide a comprehensive, trustworthy,
        and user-friendly resource for chess players, students, and researchers.
      </p>
      <h2>Target Audience</h2>
      <p>
        Fenster is for chess enthusiasts of all levels—club players, students,
        coaches, and anyone curious about chess openings. It is especially
        useful for those who want to understand opening theory, explore
        transpositions, or analyze master games.
      </p>
      <h2>Origin Story</h2>
      <p>
        Fenster began as a personal project to unify and clean up the fragmented
        world of chess opening data. Frustrated by the lack of a single, open,
        and well-indexed source, the author set out to build a tool that would
        serve both as a reference and a playground for chess opening
        exploration.
      </p>
      <h2>Maintenance Status</h2>
      <p>
        Fenster is actively maintained and regularly updated with new features,
        bug fixes, and data improvements. Contributions and feedback are
        welcome!
      </p>
      <h2>Author & Organization</h2>
      <p>
        Fenster Chess is developed and maintained by Jeff Lowery. The project is
        not affiliated with any chess federation or commercial entity.
      </p>
      <h2>Links & Contact</h2>
      <ul>
        <li>
          <a href={ECO_JSON}>eco.json opening database</a>
        </li>
        <li>
          <a href={DISCUSSION}>Project discussions & roadmap</a>
        </li>
        <li>
          <a href={ISSUES}>Bug tracker & feature requests</a>
        </li>
      </ul>
      <h2>Why Trust Fenster?</h2>
      <p>
        Fenster is open source, data-driven, and transparent. All opening data
        is public and versioned. The codebase and data sources are open for
        inspection, and the project welcomes community review and contributions.
      </p>
    </div>
  </>
);

export default About;
