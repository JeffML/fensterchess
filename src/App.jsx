import { useState } from 'react';
import AboutPage from './AboutPage.jsx';
import './App.css';
import { isTestMode, modes, SUBTITLES } from './common/consts.js';
import { SelectedSitesContextProvider } from './contexts/SelectedSitesContext.jsx';
import PageHeader from './PageHeader.jsx';
import { AnalyzePgnPage } from './AnalyzePgnPage.jsx';
import { SearchPageContainer } from './SearchPage.jsx';
// import TestComponent from "./TestComponent.js";
import { Visualizations } from './Visualizations.jsx';
import { useQuery } from '@tanstack/react-query';
import { openingBook, fromTo } from './datasource/getLatestEcoJson.js';
import { OpeningBookProvider } from './contexts/OpeningBookContext.jsx';

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
                        {mode === modes.search && (
                            <SearchPageContainer
                                {...{
                                    from: data.from,
                                    to: data.to,
                                }}
                            />
                        )}
                        {mode === modes.pgnAnalyze && (
                            <AnalyzePgnPage/>
                        )}
                        {mode === modes.visualization && <Visualizations />}
                        {mode === modes.about && <AboutPage />}
                    </OpeningBookProvider>
                    {/* {mode === modes.test && <TestComponent />} */}
                </SelectedSitesContextProvider>
            </div>
        )
    );
}

export default App;
