import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
// import { TestComponent } from '../temp/TestComponent.jsx'; 
import AboutPage from './AboutPage.jsx';
import './App.css';
import PageHeader from './PageHeader.jsx';
import { Visualizations } from './Visualizations.jsx';
import { SUBTITLES, isTestMode, modes } from './common/consts.js';
import { OpeningBookProvider } from './contexts/OpeningBookContext.jsx';
import { SelectedSitesContextProvider } from './contexts/SelectedSitesContext.jsx';
import { fromTo } from './datasource/getLatestEcoJson.js';
import { AnalyzePgnPage } from './pgnImportPage/AnalyzePgnPage.jsx';
import { SearchPageContainer } from './searchPage/SearchPage.jsx';

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
                        {/* <TestComponent/> */}
                    </OpeningBookProvider>
                </SelectedSitesContextProvider>
            </div>
        )
    );
}

export default App;
