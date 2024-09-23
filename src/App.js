import { useState } from "react";
import AboutPage from "./AboutPage.js";
import "./App.css";
import { isTestMode, modes, SUBTITLES } from "./common/consts.js";
import { SelectedSitesContextProvider } from "./common/Contexts.js";
import PageHeader from "./PageHeader.js";
import PgnAnalysis from "./PgnAnalyzePage.js";
import SearchPage from "./SearchPage.js";
import TestComponent from "./TestComponent.js";
import { Visualizations } from "./Visualizations.js";

function App() {
    const [mode, setMode] = useState(isTestMode ? modes.test : modes.search);

    return (
        <div className="App">
            <SelectedSitesContextProvider>
                <PageHeader
                    {...{ subheading: SUBTITLES[mode], mode, setMode }}
                />
                {mode === modes.search && <SearchPage />}
                {mode === modes.pgnAnalyze && <PgnAnalysis {...{ setMode }} />}
                {mode === modes.visualization && <Visualizations />}
                {mode === modes.about && <AboutPage />}
                {mode === modes.test && <TestComponent />}
            </SelectedSitesContextProvider>
        </div>
    );
}

export default App;
