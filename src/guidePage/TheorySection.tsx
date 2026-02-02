import { WIKI_THEORY } from "../common/urlConsts";

export const TheorySection = () => (
  <>
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
  </>
);
