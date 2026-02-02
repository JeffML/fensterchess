import { DISCUSSION, ISSUES } from "../common/urlConsts";

export const QuestionsSection = () => (
  <>
    <h2 id="questions">Questions? Bugs? Feature requests?</h2>
    The Fenster client is an open source project maintained on github. There you
    can open a <a href={DISCUSSION}>discussion</a>,{" "}
    <a href={ISSUES}>log a bug, or request a feature</a>.
  </>
);
