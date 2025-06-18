import { gql, useQuery } from '@apollo/client';
import { useState, useEffect, Fragment } from 'react';
import { INCR } from './common/consts.js';
import PgnTabs from './PgnTabs.jsx';
import PgnLinkGrid from './PgnLinkGrid.jsx';
import { getFeedAsJson } from './utils/getFeedAsJson.js';
import './stylesheets/fileSelector.css';

const radioStyle = {
    display: 'flex',
    paddingTop: '2em',
    paddingBottom: '2em',
    marginLeft: '2em',
    gap: '1em',
};

const gridStyle2 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
};

const newsStyle = {
    fontSize: 'smaller',
    WebkitMaskImage: 'linear-gradient(180deg, #000 20%, transparent)',
    paddingRight: '3em',
    marginBottom: '1em',
};

// pulls pgn links off of the page at $url
const GET_PGN_LINKS = gql`
    query GetPgnLinks($url: String) {
        getPgnLinks(url: $url)
    }
`;

const GET_RSS_XML = gql`
    query GetRssXML($url: String) {
        getRssXml(url: $url)
    }
`;

const PgnFileUploader = ({ setLink }) => {
    const handler = (e) => {
        const listener = (e) => {
            setLink({ pgn: reader.result });
        };
        const reader = new FileReader();
        reader.addEventListener('load', listener);
        reader.readAsText(e.target.files[0]);
    };

    return (
        <div className="row white centered">
            <div className="row centered">
                <label htmlFor="pgn">Choose a PGN file:</label>
                <br />
            </div>{' '}
            <div className="row centered">
                <input
                    type="file"
                    id="pgn"
                    name="pgnFile"
                    accept=".pgn"
                    onChange={handler}
                />
            </div>
        </div>
    );
};

const RssFeed = () => {
    const [json, setJson] = useState(null);

    const { loading, error, data } = useQuery(GET_RSS_XML, {
        variables: { url: 'https://theweekinchess.com/twic-rss-feed' },
        skip: json,
    });

    useEffect(() => {
        if (data) {
            setJson(getFeedAsJson(data.getRssXml));
        }
    }, [data]);

    if (error) console.error(error);

    return (
        json && (
            <div className="white" style={{ textAlign: 'left' }}>
                <h3 style={{ marginLeft: '-1.5em' }}>
                    News from{' '}
                    <a target="_blank" rel="noreferrer" href={json?.link}>
                        {json?.title}
                    </a>
                </h3>
                {/* <h4>{json?.description}</h4> */}
                {json.items?.map((item) => (
                    <Fragment key={item.title}>
                        <b>
                            <a
                                target="_blank"
                                rel="noreferrer"
                                href={item.link}
                            >
                                {item.title}
                            </a>
                        </b>
                        <br />
                        <div style={newsStyle}>
                            {item.description.slice(0, 250)}
                        </div>
                    </Fragment>
                ))}
            </div>
        )
    );
};

const PgnChooser = ({ link, setLink }) => {
    const { loading, error, data } = useQuery(GET_PGN_LINKS);
    const [end, setEnd] = useState(INCR);
    const [pgnMode, setPgnMode] = useState('twic');

    const handlePgnMode = (e) => {
        setLink({});
        setPgnMode(e.target.value);
    };

    return (
        <div>
            <div style={radioStyle} className="white">
                <input
                    type="radio"
                    name="pgnMode"
                    value="twic"
                    checked={pgnMode === 'twic'}
                    onChange={handlePgnMode}
                ></input>
                <label>
                    <a
                        target="_blank"
                        rel="noreferrer"
                        // href="https://theweekinchess.com/a-year-of-pgn-game-files"
                    >
                        TWIC games
                    </a>
                </label>
                <input
                    type="radio"
                    name="pgnMode"
                    value="local"
                    checked={pgnMode === 'local'}
                    onChange={handlePgnMode}
                    style={{ marginLeft: '1em' }}
                ></input>
                <label>Upload PGN</label>
            </div>

            {pgnMode === 'twic' && (
                <div>
                    {error && <p>ERROR! {error.toString()}</p>}
                    {loading && <p style={{ minWidth: '40%' }}>Loading ...</p>}
                    {data && (
                        <PgnLinkGrid
                            {...{
                                links: data.getPgnLinks,
                                end,
                                setEnd,
                                link,
                                setLink,
                            }}
                        />
                    )}
                </div>
            )}
            {pgnMode === 'local' && <PgnFileUploader {...{ setLink }} />}
        </div>
    );
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
                <PgnChooser {...{ link, setLink }} />
                <RssFeed />
            </div>
            <div>
                <PgnTabs {...{ link }} />
            </div>
        </>
    );
};

export { AnalyzePgnPage };
