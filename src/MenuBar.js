import { modes } from "./common/consts.js";
import Sites from "./Sites.js";

const MenuBar = ({ mode, setMode }) => {
    return (
        <div className="row menubar">
            <div
                className={
                    "column menuitem " +
                    (mode === modes.search ? "selected" : "")
                }
            >
                <span onClick={() => setMode(modes.search)}>
                    Search Openings
                </span>
            </div>
            <div
                className={
                    "column menuitem " +
                    (mode === modes.pgnAnalyze ? "selected" : "")
                }
            >
                <span onClick={() => setMode(modes.pgnAnalyze)}>
                    PGN Import
                </span>
            </div>
            <div className="column menuitem">
                <label htmlFor="sites">Include Info From:</label>
                <Sites id="sites" />
            </div>
        </div>
    );
};

export default MenuBar;
