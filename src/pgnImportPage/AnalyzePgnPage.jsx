import { useState } from 'react';
import '../stylesheets/fileSelector.css';
import { PgnListPanel } from './PgnListPanel.jsx';
import { PgnTabsPanelContainer } from './PgnTabsPanelContainer.jsx';
import { RssFeed } from './RssFeed.jsx';


const gridStyle2 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
};

/**
 * Fetch PGN urls from a site; then process each pgn file.
 */
const AnalyzePgnPage = () => {
    const [link, setLink] = useState({}); // currently selected link

    // show either the list of links (along with meta data), or a "deep dive" into the pgn data itself
    return (
        <>
            <div style={gridStyle2}>
                <PgnListPanel {...{ link, setLink }} />
                <RssFeed />
            </div>
            <div>
                <PgnTabsPanelContainer {...{ link }} />
            </div>
        </>
    );
};

export { AnalyzePgnPage };
