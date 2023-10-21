import "./App.css";
import { useState } from "react";
import {modes} from "./common/consts.js";
import { SUBTITLES } from "./common/consts.js";
import AdminPage from "./AdminPage.js";
import AboutPage from "./AboutPage.js"
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
                {mode === modes.search && <SearchPage />}
                {mode === modes.pgnAnalyze && <PgnAnalysis {...{ setMode }} />}
                {mode === modes.about && <AboutPage/>}
            </SelectedSitesContextProvider>
        </div>
    );
}

export default App;
