import { useState } from 'react';
import AboutPage from './AboutPage.jsx';
import './App.css';
import { isTestMode, modes, SUBTITLES } from './common/consts.js';
import { SelectedSitesContextProvider } from './common/SelectedSitesContext.jsx';
import PageHeader from './PageHeader.jsx';
import {AnalyzePgnPage} from './AnalyzePgnPage.jsx';
import {SearchPageContainer} from './SearchPage.jsx';
// import TestComponent from "./TestComponent.js";
import { Visualizations } from './Visualizations.jsx';
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
                        <AnalyzePgnPage {...{ openingBook: data.ob }} />
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
