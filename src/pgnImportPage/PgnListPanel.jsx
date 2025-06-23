import { gql, useQuery } from "@apollo/client";
import { useState } from 'react';
import { INCR } from '../common/consts';
import { PgnLinkGrid } from "./PgnLinkGrid";



// pulls pgn links off of the page at $url
const GET_PGN_LINKS = gql`
    query GetPgnLinks($url: String) {
        getPgnLinks(url: $url)
    }
`;


export const PgnListPanel = ({ link, setLink }) => {
    const { loading, error, data } = useQuery(GET_PGN_LINKS);
    const [end, setEnd] = useState(INCR);
    const [pgnMode, setPgnMode] = useState('twic');

    const handlePgnMode = (e) => {
        setLink({});
        setPgnMode(e.target.value);
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
