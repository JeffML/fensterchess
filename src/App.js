import "./App.css";
import { useState } from "react";
import {modes, SUBTITLES, isTestMode } from "./common/consts.js";
import AboutPage from "./AboutPage.js"
import PageHeader from "./PageHeader.js";
import SearchPage from "./SearchPage.js";
import PgnAnalysis from "./PgnAnalyzePage.js";
import Visualizations from "./Visualizations.js";
import { SelectedSitesContextProvider } from "./common/Contexts.js";
import TestComponent from "./TestComponent.js";

function App() {
    const [mode, setMode] = useState(isTestMode? modes.test : modes.search);

    return (
        <div className="App">
            <SelectedSitesContextProvider>
                <PageHeader
                    {...{ subheading: SUBTITLES[mode], mode, setMode }}
                />
                {mode === modes.search && <SearchPage />}
                {mode === modes.pgnAnalyze && <PgnAnalysis {...{ setMode }} />}
                {mode === modes.visualization && <Visualizations />}
                {mode === modes.about && <AboutPage/>}
                {mode === modes.test && <TestComponent/>}
            </SelectedSitesContextProvider>
        </div>
    );
}

export default App;
