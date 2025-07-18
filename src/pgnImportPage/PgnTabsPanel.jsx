import { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { getPgnSummary } from './PgnTabsPanelContainer';
import { GamesTab } from './tabsPanelEtc/GamesTab.jsx';
import { OpeningTab } from './tabsPanelEtc/OpeningTab';
import { PgnSummaryTab } from './tabsPanelEtc/PgnSummaryTab';

export const PgnTabsPanel = ({ pgn, tabIndex, setTabIndex }) => {
    const [game, setGame] = useState(null);
    const [flash, setFlash] = useState(false);
    const [filter, setFilter] = useState([]);

    const pgnSumm = getPgnSummary(pgn);

    return (
        <Tabs selectedIndex={tabIndex} onSelect={setTabIndex} className="pgn-tabs-panel">
            <TabList className="left" style={{ marginBottom: '0px' }}>
                <Tab className="react-tabs__tab tab-base">Summary</Tab>
                <Tab
                    className={`react-tabs__tab tab-base tab-flash1 ${flash ? 'tab-flash2' : ''}`}
                >
                    Games
                </Tab>
                <Tab
                    {...{ disabled: tabIndex !== 2 }}
                    className="react-tabs__tab tab-base"
                    style={{
                        color: tabIndex !== 2 ? 'GrayText' : 'lightgreen',
                    }}
                >
                    Opening
                </Tab>
            </TabList>
            <div style={{ border: 'thick solid white' }}>
                <TabPanel>
                    <PgnSummaryTab
                        {...{ pgnSumm, setFlash, filter, setFilter }} />
                </TabPanel>
                <TabPanel>
                    <GamesTab
                        {...{ db: pgnSumm.db, filter, setGame, setTabIndex }} />
                </TabPanel>
                <TabPanel>
                    <OpeningTab {...{ game }} />
                </TabPanel>
            </div>
        </Tabs>
    );
};
