import "./App.css";
import { useState } from "react";
import modes from "./utils/modes.js";
import { SUBTITLES } from "./common/consts.js";
import AdminPage from "./AdminPage.js";
import PageHeader from "./PageHeader.js";
import SearchPage from "./SearchPage.js";
import PgnAnalysis from "./PgnAnalyzePage.js";
import { SelectedSitesContextProvider } from "./common/Contexts.js";

function App() {
    const [mode, setMode] = useState(modes.search);

    return (
        <div className="App">
            <SelectedSitesContextProvider>
                <PageHeader
                    {...{ subheading: SUBTITLES[mode], mode, setMode }}
                />
                {mode === modes.admin && process.env.REACT_APP_QUOTE && (
                    <AdminPage {...{ setMode }} />
                )}
                {mode === modes.search && <SearchPage {...{ setMode }} />}
                {mode === modes.pgnAnalyze && <PgnAnalysis {...{ setMode }} />}
            </SelectedSitesContextProvider>
        </div>
    );
}

export default App;
