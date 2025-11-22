import { useState } from 'react';
import '../stylesheets/fileSelector.css';
import '../stylesheets/pgnImport.css';
import { PgnListPanel } from './PgnListPanel';
import { PgnTabsPanelContainer } from './PgnTabsPanelContainer';
import { RssFeed } from './RssFeed';

/**
 * Fetch PGN urls from a site; then process each pgn file.
 */
const AnalyzePgnPage = () => {
    const [link, setLink] = useState<{ url?: string; pgn?: string }>({});

    // show either the list of links (along with meta data), or a "deep dive" into the pgn data itself
    return (
        <>
            <div className="grid-style-top-panel">
                <PgnListPanel {...{ link, setLink }} />
                <RssFeed />
            </div>
            <div>
                <PgnTabsPanelContainer {...{ link }} />
            </div>
        </>
    );
};

export default AnalyzePgnPage;
