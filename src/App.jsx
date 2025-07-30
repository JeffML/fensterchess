import { useQuery } from '@tanstack/react-query';
import { useState, lazy, Suspense } from 'react';
import './App.css';
import PageHeader from './PageHeader.jsx';
import { SUBTITLES, isTestMode, modes } from './common/consts.js';
import { OpeningBookProvider } from './contexts/OpeningBookContext.jsx';
import { SelectedSitesContextProvider } from './contexts/SelectedSitesContext.jsx';

// Dynamic imports - match the export style of each component
const AboutPage = lazy(() => import('./AboutPage.jsx')); // default export
const Visualizations = lazy(() => import('./Visualizations.jsx'));
const AnalyzePgnPage = lazy(() => import('./pgnImportPage/AnalyzePgnPage.jsx'));
const SearchPageContainer = lazy(() =>
    import('./searchPage/SearchPageContainer.jsx')
);

function App() {
    const [mode, setMode] = useState(isTestMode ? modes.test : modes.search);

    return (
        <div className="App">
            <SelectedSitesContextProvider>
                <PageHeader
                    {...{
                        subheading: SUBTITLES[mode],
                        mode,
                        setMode,
                    }}
                />
                <OpeningBookProvider>
                    <Suspense
                        fallback={<div className="white">Loading...</div>}
                    >
                        {mode === modes.search && <SearchPageContainer />}
                        {mode === modes.pgnAnalyze && <AnalyzePgnPage />}
                        {mode === modes.visualization && <Visualizations />}
                        {mode === modes.about && <AboutPage />}
                    </Suspense>
                </OpeningBookProvider>
            </SelectedSitesContextProvider>
        </div>
    );
}

export default App;
