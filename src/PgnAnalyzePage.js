import { gql, useQuery } from "@apollo/client";
import { useState , useEffect} from "react";
import { ActionButton } from "./common/buttons.js";
import { INCR } from "./common/consts.js";
import PgnTabs from "./PgnTabs.js";
import getFeedAsJson from "./utils/getFeedAsJson.js";
import "./stylesheets/fileSelector.css";

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    padding: "3px",
    gridColumnGap: "2em",
    marginLeft: "2em",
};

const radioStyle = {
    display: "flex",
    paddingTop: "2em",
    paddingBottom: "2em",
    marginLeft: "2em",
    gap: "1em",
};
const gridStyle2 = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
};
const gridStyle3 = {
    display: "grid",
    gridTemplateColumns: "repeat(1, 1fr)",
};

// pulls pgn links off of the page at $url
const GET_PGN_LINKS = gql`
    query GetPgnLinks($url: String) {
        getPgnLinks(url: $url)
    }
`;

// HEAD requests for each link
const GET_PGN_LINK_META = gql`
    query getPgnLinkMeta($url: String!) {
        getPgnLinkMeta(url: $url) {
            link
            contentLength
            lastModified
        }
    }
`;

function PgnMetaRow({ link, setLink }) {
    const { error, loading, data } = useQuery(GET_PGN_LINK_META, {
        variables: { url: link },
    });

    if (error) {
        console.error(error.toLocaleString());
        return <span>ERROR!</span>;
    }

    if (loading) return <span>...</span>;

    const clickHandler = () => {
        setLink({ url: link });
    };

    if (data) {
        const { lastModified, contentLength } = data.getPgnLinkMeta;

        const millis = Date.parse(lastModified);
        const localeTime = new Date(millis).toLocaleString("en-US", {
            hour12: false,
            dateStyle: "short",
            timeStyle: "short",
        });

        return (
            <>
                <span
                    className="fakeLink"
                    style={{ color: "cyan" }}
                    onClick={clickHandler}
                >
                    {link.substring(link.lastIndexOf("/") + 1)}
                </span>
                <span>{localeTime}</span>
                <span>
                    {Math.round(contentLength / 1000)}
                    <span style={{ fontSize: "smaller" }}>K</span>
                </span>
            </>
        );
    }
}

const PgnLinkGrid = ({ links, end, setEnd, setLink }) => {
    const doMore = () => {
        setEnd((p) => p + INCR);
    };

    const Headers = () => (
        <>
            <span>File Name </span>
            <span>Date</span>
            <span>Size</span>
        </>
    );

    const PgnMetaRows = () => {
        return links
            .slice(0, end)
            .map((link) => <PgnMetaRow key={link} {...{ link, setLink }} />);
    };

    return (
        <div
            style={{ ...gridStyle, textAlign: "start", color: "white" }}
            className="font-cinzel"
        >
            <Headers />
            <PgnMetaRows />

            {end < links.length ? (
                <span colSpan="4">
                    <ActionButton
                        {...{
                            style: { width: "8em" },
                            onClick: () => doMore(),
                            text: "More...",
                        }}
                    />{" "}
                </span>
            ) : null}
        </div>
    );
};

const PgnFileUploader = ({ setLink }) => {
    const handler = (e) => {
        const listener = (e) => {
            setLink({ pgn: reader.result });
        };
        const reader = new FileReader();
        reader.addEventListener("load", listener);
        reader.readAsText(e.target.files[0]);
    };

    return (
        <div className="row white centered">
            <div className="row centered">
                <label htmlFor="pgn">Choose a PGN file:</label>
                <br />
            </div>{" "}
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
    const [json, setJson] = useState({})

    const rss ='https://corsproxy.io/?' + encodeURIComponent('https://theweekinchess.com/twic-rss-feed');

    useEffect(()=>{
        async function getJSON() {
            const j = await getFeedAsJson(rss)
            setJson(j)
        }

        getJSON()
    }, [rss])
    
    return (<p>{JSON.stringify(json)}</p>)
}


const PgnChooser = ({ link, setLink }) => {
    const { loading, error, data } = useQuery(GET_PGN_LINKS);
    const [end, setEnd] = useState(INCR);
    const [pgnMode, setPgnMode] = useState("twic");

    const handlePgnMode = (e) => {
        setLink({});
        setPgnMode(e.target.value);
    };



    return (
        <>
            <div style={radioStyle} className="white">
                <input
                    type="radio"
                    name="pgnMode"
                    value="twic"
                    checked={pgnMode === "twic"}
                    onChange={handlePgnMode}
                ></input>
                <label>
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://theweekinchess.com/a-year-of-pgn-game-files"
                    >
                        TWIC games
                    </a>
                </label>
                <input
                    type="radio"
                    name="pgnMode"
                    value="local"
                    checked={pgnMode === "local"}
                    onChange={handlePgnMode}
                    style={{ marginLeft: "1em" }}
                ></input>
                <label>Upload PGN</label>
            </div>

            {pgnMode === "twic" && (
                <div className="row">
                    {error && <p>ERROR! {error.toString()}</p>}
                    {loading && <p style={{ minWidth: "40%" }}>Loading ...</p>}
                    {data && (
                        <div style={gridStyle2}>
                            <PgnLinkGrid
                                {...{
                                    links: data.getPgnLinks,
                                    end,
                                    setEnd,
                                    link,
                                    setLink,
                                }}
                            />
                            <RssFeed/>
                        </div>
                    )}
                </div>
            )}
            {pgnMode === "local" && <PgnFileUploader {...{ setLink }} />}
        </>
    );
};

/**
 * Fetch PGN urls from a site; then process each pgn file.
 */
const AnalyzePGN = () => {
    const [link, setLink] = useState({}); // currently selected link

    // show either the list of links (along with meta data), or a "deep dive" into the pgn data itself
    return (
        <div style={gridStyle3}>
            <div>
                <PgnChooser {...{ link, setLink }} />
            </div>
            <div>
                <PgnTabs {...link} />
            </div>
        </div>
    );
};

export default AnalyzePGN;
