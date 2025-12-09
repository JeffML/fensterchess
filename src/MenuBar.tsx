import { modes, Modes } from "./common/consts";
import Sites from "./Sites";

interface MenuBarProps {
  mode: Modes;
  setMode: (mode: Modes) => void;
}

const MenuBar = ({ mode, setMode }: MenuBarProps) => {
  return (
    <div className="row menubar">
      <div
        className={
          "column menuitem " + (mode === modes.search ? "selected" : "")
        }
        onClick={() => setMode(modes.search)}
      >
        <span>Search Openings</span>
      </div>
      <div
        className={
          "column menuitem " + (mode === modes.pgnAnalyze ? "selected" : "")
        }
        onClick={() => setMode(modes.pgnAnalyze)}
      >
        <span>PGN Import</span>
      </div>
      <div
        className={
          "column menuitem viz-only " + (mode === modes.visualization ? "selected" : "")
        }
        onClick={() => setMode(modes.visualization)}
      >
        <span>Visualizations</span>
      </div>
      <div
        className={
          "column menuitem " + (mode === modes.about ? "selected" : "")
        }
        onClick={() => setMode(modes.about)}
      >
        <span>About</span>
      </div>
      <div className="double-column menuitem" style={{ marginTop: "0.5em" }}>
        <label>
          Include Info From:
          <Sites />
        </label>
      </div>
    </div>
  );
};

export default MenuBar;
