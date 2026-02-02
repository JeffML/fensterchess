import { CHESS_DATA } from "../common/urlConsts";

export const VisualizationsSection = () => (
  <>
    <h2 id="visualizations">Visualizations</h2>
    <img
      src="resources/Visualizations.png"
      alt="the PGN import page"
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
      This is a heatmap showing which squares are most "active", meaning the
      most common destination of all pieces for a given ECO code
    </p>

    <h3 id="destination-squares">Destination squares</h3>
    <p>
      Similar to above, this heatmap pertains to specific pieces and player
      color. Inspired by <a href={CHESS_DATA}>this project</a>.
    </p>
  </>
);
