import { useQuery } from '@tanstack/react-query';
import { Chessboard } from 'kokopu-react';
import { useState } from 'react';
import { getOpeningsForEcoCat } from '../datasource/getOpeningsForEcoCat';

export const OpeningsForEcoCat = ({ category, contentStyle }) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['openingsForCat', category],
        queryFn: () => getOpeningsForEcoCat(category),
        enabled: contentStyle === 'block'
    });

    const [popupFen, setPopupFen] = useState(null);

    if (contentStyle !== "block") return null;
    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error: {error?.message || error?.toString()}</div>;
    if ((!data) || data.length === 0) return <div>No openings found.</div>;

    // Popup always at a fixed position on the left
    const popupStyle = popupFen
        ? {
            position: 'fixed',
            left: 24, // px from the left edge of the viewport
            top: 500, // px from the top, adjust as needed
            zIndex: 100,
            background: 'rgba(40,40,40,0.97)',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 4,
            pointerEvents: 'none',
        }
        : { display: 'none' };

    return (
        <div className="content eco-cats" style={{ display: contentStyle, position: 'relative'}}>
            {data.map(({ rootFen, root, children }, idx) => (
                <div className="eco-root-block" key={rootFen}>
                    <div className="row">
                        <span className="column">
                            <span
                                id="code"
                                style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                                onMouseEnter={() => setPopupFen(rootFen)}
                                onMouseLeave={() => setPopupFen(null)}
                            >
                                {root.eco}: {root.name}
                            </span>
                            {/* {root.moves && <span>, {root.moves}</span>} */}
                        </span>
                    </div>
                    {children.length > 0 && (
                        <ul className="eco-root-openings" style={{marginTop: "-0.5em"}}>
                            {children.map(child => (
                                <li
                                    key={child.fen}
                                    style={{ cursor: 'pointer', textDecoration: 'underline dotted', marginBottom: "0.4em" }}
                                    onMouseEnter={() => setPopupFen(child.fen)}
                                    onMouseLeave={() => setPopupFen(null)}
                                >
                                    {child.name}
                                    {/* {child.moves && <span> ({child.moves})</span>} */}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            {popupFen && (
                <div style={popupStyle}>
                    <Chessboard position={popupFen} squareSize={32} />
                </div>
            )}
        </div>
    );
};
