import { CHESS_DATA } from "../common/urlConsts";

export const VisualizationsSection = () => (
  <>
    <h2 id="visualizations">Visualizations</h2>
    <img
      src="resources/Visualizations.png"
      alt="the Visualizations page"
      className="image"
    />
    <p>These are experimental and targeted toward the idly curious.</p>

    <h3 id="fromto">From-To squares</h3>
    <p>
      For all variations in a selected ECO code, an association graph will be
      drawn showing origination and destination squares of all pieces.
    </p>

    <h3 id="eco-categories">ECO categories and codes</h3>
    <p>
      By selecting an ECO category, a list of all ECO codes in that category
      will be shown.
    </p>

    <h3 id="active-squares">Most active squares</h3>
    <p>
      This is a heatmap showing which squares are most “active”, meaning the
      most common destination of all pieces for a given ECO code.
    </p>

    <h3 id="destination-squares">Destination squares</h3>
    <p>
      Similar to above, this heatmap pertains to specific pieces and player
      color. Inspired by <a href={CHESS_DATA}>this project</a>.
    </p>

    <h3 id="eco-theory-heatmap">ECO Theory Heatmap</h3>
    <p>
      A 5×10 grid showing how many named opening variations exist in each ECO
      decade group (A0x–E9x). Brighter cells mean richer theory. Click any cell
      to open a drill-down panel listing each ECO code in that group; click a
      code to expand the full list of named variations within it.
    </p>

    <h3 id="player-chord">Player ↔ Opening Repertoire</h3>
    <p>
      A chord diagram linking players to the ECO opening families they play most
      often in the master game database. Bands are sized by game count; click a
      band to filter the opening list below the diagram.
    </p>

    <h3 id="player-radar">Player ECO Radar</h3>
    <p>
      A radar (spider) chart showing each player’s ECO family distribution
      across the five families (A–E). Useful for comparing repertoire breadth at
      a glance. Select one or more players from the legend to overlay their
      polygons.
    </p>

    <h3 id="player-diversity">Player Opening Diversity</h3>
    <p>
      A sorted horizontal bar chart ranking players by Shannon entropy of their
      ECO distribution. A higher score means a more balanced repertoire across
      all five opening families; a lower score means a specialist. Hover a bar
      to see the exact entropy value and ECO breakdown.
    </p>
  </>
);
