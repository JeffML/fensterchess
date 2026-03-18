import { useState, lazy, Suspense, MouseEvent } from "react";
import "./stylesheets/vizz.css";

const Display = lazy(() =>
  import("./vizzes/Display.jsx").then((module) => ({
    default: module.Display,
  })),
);

export const MOST_ACTIVE = "Destination Squares (for all pieces)";
export const FROM_TO = "from-to squares";
export const PIECE_DESTINATION = "Destination Squares (detailed)";
export const ECO_FLOWCHART = "ECO Categories";
export const PLAYER_OPENING_CHORD = "Player ↔ Opening Repertoire";

interface Visualization {
  name: string;
  type: "graph" | "heatmap";
  source: "openings" | "games";
}

const visualizations: Visualization[] = [
  { name: FROM_TO, type: "graph", source: "openings" },
  { name: ECO_FLOWCHART, type: "graph", source: "openings" },
  { name: MOST_ACTIVE, type: "heatmap", source: "openings" },
  { name: PIECE_DESTINATION, type: "heatmap", source: "openings" },
  { name: PLAYER_OPENING_CHORD, type: "graph", source: "games" },
];

interface VisualizationGroupProps {
  items: Visualization[];
  handler: (event: MouseEvent<HTMLInputElement>) => void;
  id: string;
}

const VisualizationGroup = ({
  items,
  handler,
  id,
}: VisualizationGroupProps) => (
  <div id={id} className="grid-column">
    {items.map((item) => (
      <div key={item.name} className="grid-child">
        <label>
          <input
            type="radio"
            name="viz"
            value={item.name}
            onClick={handler}
            style={{ width: "1em" }}
          />
          {item.name}
        </label>
      </div>
    ))}
  </div>
);

const Visualizations = () => {
  const [viz, setViz] = useState("");
  const handler = ({ target }: MouseEvent<HTMLInputElement>) =>
    setViz((target as HTMLInputElement).value);

  const openingVizzes = visualizations.filter((o) => o.source === "openings");
  const gameVizzes = visualizations.filter((o) => o.source === "games");

  return (
    <div className="white grid-style">
      <div style={{ textAlign: "left", marginLeft: "1em" }}>
        <h2 className="font-cinzel">Experimental Visualizations</h2>

        <div style={{ gridColumn: "1" }}>
          <h3 className="left">Opening Book</h3>
          <VisualizationGroup
            items={openingVizzes}
            handler={handler}
            id="openings"
          />
        </div>

        <div style={{ gridColumn: "1" }}>
          <h3 className="left">Master Games</h3>
          {gameVizzes.length > 0 ? (
            <VisualizationGroup
              items={gameVizzes}
              handler={handler}
              id="games"
            />
          ) : (
            <div
              style={{
                marginLeft: "0.5em",
                fontStyle: "italic",
                color: "#aaa",
              }}
            >
              Coming soon
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={<div>Loading visualization...</div>}>
        <Display viz={viz} />
      </Suspense>
    </div>
  );
};

export default Visualizations;
