import { useQuery } from '@tanstack/react-query';
import { ActionButton } from '../common/Buttons';
import { INCR } from '../common/consts';
import { dateStringShort } from '../utils/dateStringShort.js';

interface PgnLink {
    url: string;
    pgn?: string;
}

interface PgnMetaRowProps {
    link: string;
    setLink: (link: PgnLink) => void;
}

function PgnMetaRow({ link, setLink }: PgnMetaRowProps) {
    const getPgnLinkMeta = async () => {
        const response = await fetch(
            '/.netlify/functions/getPgnLinkMeta?url=' + link,
            {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
                },
            }
        );
        const data = await response.json();
        return data;
    };

    const { isError, isPending, error, data } = useQuery({
        queryKey: ['getPgnLinkMeta', dateStringShort()],
        queryFn: getPgnLinkMeta,
    });

    if (isError) {
        console.error(error.toString());
        return <span>ERROR!</span>;
    };

    if (isPending) return <span>...</span>;

    const clickHandler = () => {
        setLink({ url: link });
    };

    if (data) {
        const { lastModified, contentLength } = data;

        const millis = Date.parse(lastModified);
        const localeTime = dateStringShort(millis);

        return (
            <>
                <span
                    className="fakeLink"
                    style={{ color: 'cyan' }}
                    onClick={clickHandler}
                >
                    {link.substring(link.lastIndexOf('/') + 1)}
                </span>
                <span>{localeTime}</span>
                <span>
                    {Math.round(contentLength / 1000)}
                    <span style={{ fontSize: 'smaller' }}>K</span>
                </span>
            </>
        );
    }
}

interface PgnLinkGridProps {
    links: string[];
    end: number;
    setEnd: React.Dispatch<React.SetStateAction<number>>;
    setLink: (link: PgnLink) => void;
}

export const PgnLinkGrid = ({ links, end, setEnd, setLink }: PgnLinkGridProps) => {
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
        <div className="font-cinzel link-grid white">
            <Headers />
            <PgnMetaRows />

            {end < links.length ? (
                <span>
                    <ActionButton
                        {...{
                            style: { width: '8em' },
                            onClick: () => doMore(),
                            text: 'More...',
                        }}
                    />{' '}
                </span>
            ) : null}
        </div>
    );
};
