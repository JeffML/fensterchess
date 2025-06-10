import { gql, useQuery } from "@apollo/client";
import { ActionButton } from "./common/Buttons.jsx";
import { INCR } from "./common/consts.js";

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

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    padding: "3px",
    gridColumnGap: "2em",
    marginLeft: "2em",
};

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
            style={{
                ...gridStyle,
                maxHeight: 0,
                textAlign: "start",
                color: "white",
            }}
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

export default PgnLinkGrid;
