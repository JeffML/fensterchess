import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { INCR } from '../common/consts';
import { TWIC_PGN_LINKS } from '../common/urlConsts';
import { dateStringShort } from '../utils/dateStringShort';
import { PgnLinkGrid } from './PgnLinkGrid';
import { PgnFileUploader } from './PgnFileUploader';

const getPgnLinks = async (url: string) => {
    const response = await fetch(`/.netlify/functions/getPgnLinks?url=${url}`, {
        headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
        },
    });
    const data = { getPgnLinks: await response.json() };
    return data;
};

interface PgnLink {
    url?: string;
    pgn?: string;
}

interface PgnListPanelProps {
    link: PgnLink;
    setLink: (link: PgnLink) => void;
}

export const PgnListPanel = ({ link, setLink }: PgnListPanelProps) => {
    const { isPending, isError, data, error } = useQuery({
        queryFn: () => getPgnLinks(TWIC_PGN_LINKS),
        queryKey: ['pgnLinks', TWIC_PGN_LINKS, dateStringShort()],
    });
    const [end, setEnd] = useState(INCR);
    const [pgnMode, setPgnMode] = useState<'twic' | 'local'>('twic');

    const handlePgnMode = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLink({});
        setPgnMode(e.target.value as 'twic' | 'local');
    };

    return (
        <div>
            <div className="white radio-style">
                <input
                    type="radio"
                    name="pgnMode"
                    value="twic"
                    checked={pgnMode === 'twic'}
                    onChange={handlePgnMode}
                ></input>
                <label>
                    <a target="_blank" rel="noreferrer">
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
                    {isError && <p>ERROR! {error.toString()}</p>}
                    {isPending && (
                        <p style={{ minWidth: '40%' }}>Loading ...</p>
                    )}
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
