import { useQuery } from '@tanstack/react-query';
import { useState, lazy, Suspense } from 'react';
import './App.css';
import PageHeader from './PageHeader.jsx';
import { SUBTITLES, isTestMode, modes } from './common/consts.js';
import { OpeningBookProvider } from './contexts/OpeningBookContext.jsx';
import { SelectedSitesContextProvider } from './contexts/SelectedSitesContext.jsx';
import { fromTo } from './datasource/getLatestEcoJson.js';

// Dynamic imports - match the export style of each component
const AboutPage = lazy(() => import('./AboutPage.jsx')); // default export
const Visualizations = lazy(() => import('./Visualizations.jsx')); 
const AnalyzePgnPage = lazy(() => import('./pgnImportPage/AnalyzePgnPage.jsx')); 
const SearchPageContainer = lazy(() => import('./searchPage/SearchPageContainer.jsx')); 

function App() {
    const [mode, setMode] = useState(isTestMode ? modes.test : modes.search);

    const { isPending, isError, error, data } = useQuery({
        queryKey: ['fromTo'],
        queryFn: async () => {
            const { from, to } = await fromTo();
            return { from, to };
        },
    });

    if (isError) {
        console.error(error);
        return (
            <span className="white">
                An error has occurred: {error.message}
            </span>
        );
    }

    return (
        data && (
            <div className="App">
                <SelectedSitesContextProvider>
                    <PageHeader
                        {...{
                            subheading: SUBTITLES[mode],
                            mode,
                            setMode,
                            isPending,
                        }}
                    />
                    <OpeningBookProvider>
                        <Suspense fallback={<div>Loading...</div>}>
                            {mode === modes.search && (
                                <SearchPageContainer
                                    {...{
                                        from: data.from,
                                        to: data.to,
                                    }}
                                />
                            )}
                            {mode === modes.pgnAnalyze && <AnalyzePgnPage />}
                            {mode === modes.visualization && <Visualizations />}
                            {mode === modes.about && <AboutPage />}
                        </Suspense>
                    </OpeningBookProvider>
                </SelectedSitesContextProvider>
            </div>
        )
    );
}

export default App;
