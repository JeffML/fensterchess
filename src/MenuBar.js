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
            <div
                className={
                    "column menuitem " +
                    (mode === modes.pgnAnalyze ? "selected" : "")
                }
            >
                <span onClick={() => setMode(modes.about)}>About</span>
            </div>
            <div
                className="double-column menuitem"
                style={{ marginTop: "1.25em" }}
            >
                <label>
                    Include Info From:
                    <Sites />
                </label>
            </div>
        </div>
    );
};

export default MenuBar;
