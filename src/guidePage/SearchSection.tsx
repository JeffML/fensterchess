import { ECO_JSON, MEDIUM_INTERPOLATED2, WIKI_ECO } from "../common/urlConsts";
import { SearchPositionSection } from "./SearchPositionSection";
import { SearchNameSection } from "./SearchNameSection";
import { TheorySection } from "./TheorySection";
import { ExternalInfoSection } from "./ExternalInfoSection";
import { RootsSection } from "./RootsSection";
import { SimilarOpeningsSection } from "./SimilarOpeningsSection";

export const SearchSection = () => (
  <>
    <h2 id="search">The Search Page</h2>
    <p>
      The Search Page offers two ways to find openings: by position or by name.
      Use the tabs above the input fields to switch between search modes.
    </p>
    <img src="resources/SearchPage.png" className="image" alt="Search Page" />

    <SearchPositionSection />
    <SearchNameSection />

    <p>
      At the top of the right column is the opening name, along with its{" "}
      <a href={WIKI_ECO}>ECO code</a>. Directly below that are variations. There
      are two types:
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
      'Transpositions' have move sequences that are in conflict with the current
      opening shown on the board. In both of these cases, <b>2. c4</b> can't be
      played, because <b>1. c4</b> was already played. Clicking on the varition
      name of the transposition will open a new browser tab with the
      transposition's move sequence.
    </p>
    <p>
      Some opening names are italicized. These are{" "}
      <a href={MEDIUM_INTERPOLATED2}>interpolated openings</a>. These were added
      to fill in missing move sequences between variations from the original
      reference sources used by
      <a href={ECO_JSON}>eco.json</a>. Interpolated openings allow navigation
      continuity between variations.
    </p>
    <p>
      The rightmost column is a chess engine evaluation of the variation. A
      positive score is better for White, and negative is better for Black. The
      variations can be sorted by evaluation (absolute value, ascending),
      variation name, or ECO code.
    </p>

    <TheorySection />
    <ExternalInfoSection />
    <RootsSection />
    <SimilarOpeningsSection />
  </>
);
