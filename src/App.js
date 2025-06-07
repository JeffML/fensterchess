import { useState } from 'react';
import AboutPage from './AboutPage.js';
import './App.css';
import { isTestMode, modes, SUBTITLES } from './common/consts.js';
import { SelectedSitesContextProvider } from './common/SelectedSitesContext.js';
import PageHeader from './PageHeader.js';
import PgnAnalysis from './PgnAnalyzePage.js';
import {SearchPageContainer} from './SearchPage.js';
// import TestComponent from "./TestComponent.js";
import { Visualizations } from './Visualizations.js';
import { useQuery } from '@tanstack/react-query';
import { openingBook, fromTo } from './datasource/getLatestEcoJson.js';

function App() {
    const [mode, setMode] = useState(isTestMode ? modes.test : modes.search);

    const { isPending, isError, error, data } = useQuery({
        queryKey: ['repoData'],
        queryFn: async () => {
            const ob = await openingBook(); // TBD: error checking
            const { from, to } = await fromTo();
            return { ob, from, to };
        },
    });

    if (isError) {
        console.error(error)
        return <span className='white'>An error has occurred: {error.message}</span>
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
                    {mode === modes.search && (
                        <SearchPageContainer
                            {...{
                                openingBook: data.ob,
                                from: data.from,
                                to: data.to,
                            }}
                        />
                    )}
                    {mode === modes.pgnAnalyze && (
                        <PgnAnalysis {...{ setMode }} />
                    )}
                    {mode === modes.visualization && <Visualizations />}
                    {mode === modes.about && <AboutPage />}
                    {/* {mode === modes.test && <TestComponent />} */}
                </SelectedSitesContextProvider>
            </div>
        )
    );
}

export default App;
