import { useState, useEffect } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Game } from 'kokopu';
import { getPgnSummary } from './PgnTabsPanelContainer';
import type { PgnSummary } from './PgnTabsPanelContainer';
import { GamesTab } from './tabsPanelEtc/GamesTab';
import { OpeningTab } from './tabsPanelEtc/OpeningTab';
import { PgnSummaryTab } from './tabsPanelEtc/PgnSummaryTab';

interface PgnTabsPanelProps {
    pgn: string;
    tabIndex: number;
    setTabIndex: (index: number) => void;
}

export const PgnTabsPanel = ({ pgn, tabIndex, setTabIndex }: PgnTabsPanelProps) => {
    const [game, setGame] = useState<Game | null>(null);
    const [flash, setFlash] = useState(false);
    const [filter, setFilter] = useState<string[]>([]);
    const [pgnSumm, setPgnSumm] = useState<PgnSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            setIsLoading(true);
            const summary = await getPgnSummary(pgn);
            if (mounted) {
                setPgnSumm(summary);
                setIsLoading(false);
            }
        };

        loadSummary();

        return () => {
            mounted = false;
        };
    }, [pgn]);

    if (isLoading || !pgnSumm) {
        return <div className="white">Loading PGN summary...</div>;
    }

    return (
        <Tabs
            selectedIndex={tabIndex}
            onSelect={setTabIndex}
            className="pgn-tabs-panel"
        >
            <TabList className="left" style={{ marginBottom: '0px' }}>
                <Tab className="react-tabs__tab tab-base">Summary</Tab>
                <Tab
                    className={`react-tabs__tab tab-base tab-flash1 ${
                        flash ? 'tab-flash2' : ''
                    }`}
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
                    <PgnSummaryTab {...{ pgnSumm, setFlash, filter, setFilter }} />
                </TabPanel>
                <TabPanel>
                    <GamesTab {...{ db: pgnSumm.db, filter, setGame, setTabIndex }} />
                </TabPanel>
                <TabPanel>
                    <OpeningTab {...{ game }} />
                </TabPanel>
            </div>
        </Tabs>
    );
};
