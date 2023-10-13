import { gql, useQuery } from "@apollo/client";
import { useState } from "react";
import { ActionButton } from "./common/buttons.js";
import { INCR } from "./common/consts.js";
import PgnTabs from "./PgnTabs.js";

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    padding: "3px",
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
        setLink(link);
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

const PgnLinkGrid = ({
    links,
    end,
    setEnd,
    setLink,
}) => {
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
        <>
            <div className="double-column white centered">
                <div
                    style={{ ...gridStyle, textAlign: "start" }}
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
            </div>
        </>
    );
};

/**
 * Fetch PGN urls from a site; then process each pgn file.
 *
 * TODO: mark files already fetched unless last-modfied newer than previous
 */
const AnalyzePGN = () => {
    const { loading, error, data } = useQuery(GET_PGN_LINKS);
    const [end, setEnd] = useState(INCR);
    const [link, setLink] = useState(null); // currently selected link

    // show either the list of links (along with meta data), or a "deep dive" into the pgn data itself
    return (
        <>
            <div className="row">
                {error && <p>ERROR! {error.toString()}</p>}
                {loading && <p style={{ minWidth: "40%" }}>Loading ...</p>}
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
            <div className="row">
                <div className="column">
                    <PgnTabs {...{ link }} />
                </div>
            </div>
        </>
    );
};

export default AnalyzePGN;
