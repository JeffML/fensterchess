// import { gql, useQuery } from "@apollo/client";k
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "../common/Buttons.jsx";
import { INCR } from "../common/consts.js";
import { SERVER } from '../common/urlConsts.js';
import { dateStringShort } from "../utils/dateStringShort.js";

function PgnMetaRow({ link, setLink }) {

    const getPgnLinkMeta = async() => {
        const response = await fetch(SERVER + '/.netlify/functions/getPgnLinkMeta?url='+link)
        const data = await response.json()
        return data
    }
    
    const {isError, isPending, error, data} = useQuery({
        queryKey: ["getPgnLinkMeta", dateStringShort()],
        queryFn: getPgnLinkMeta
    })


    if (isError) {
        console.error(error.toLocaleString());
        return <span>ERROR!</span>;
    }

    if (isPending) return <span>...</span>;

    const clickHandler = () => {
        setLink({ url: link });
    };

    if (data) {
        const { lastModified, contentLength } = data;

        const millis = Date.parse(lastModified);
        const localeTime = dateStringShort(millis)

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

export const PgnLinkGrid = ({ links, end, setEnd, setLink }) => {
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
            className="font-cinzel link-grid white"
        >
            <Headers/>
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


