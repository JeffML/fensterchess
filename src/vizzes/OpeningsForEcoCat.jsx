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
    const [expandedRootFen, setExpandedRootFen] = useState(null);

    if (contentStyle !== "block") return null;
    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error: {error?.message || error?.toString()}</div>;
    if ((!data) || data.length === 0) return <div>No openings found.</div>;

    // Find the opening (root or child) for the popupFen
    let popupOpening = null;
    if (popupFen) {
        for (const { rootFen, root, children } of data) {
            if (rootFen === popupFen) {
                popupOpening = root;
                break;
            }
            const child = children.find(child => child.fen === popupFen);
            if (child) {
                popupOpening = child;
                break;
            }
        }
    }

    // Popup always at a fixed position on the left
    const popupStyle = popupFen
        ? {
            position: 'fixed',
            left: 24,
            top: 450,
            zIndex: 100,
            background: 'rgba(40,40,40,0.97)',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: 4,
            pointerEvents: 'none',
        }
        : { display: 'none' };

    const handleRootClick = (fen) => {
        setExpandedRootFen(expandedRootFen === fen ? null : fen);
    };

    return (
        <div className="content eco-cats" style={{ display: contentStyle, position: 'relative'}}>
            {data.map(({ rootFen, root, children }) => (
                <div className="eco-root-block" key={rootFen}>
                    <div className="row">
                        <span className="column">
                            <span
                                id="code"
                                style={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline dotted',
                                    fontWeight: expandedRootFen === rootFen ? 'bold' : 'normal',
                                    userSelect: 'none'
                                }}
                                onClick={() => handleRootClick(rootFen)}
                                onMouseEnter={() => setPopupFen(rootFen)}
                                onMouseLeave={() => setPopupFen(null)}
                            >

                                {root.eco}: {root.name}
                            <span style={{display: 'inline-block', width: '1.2em', marginLeft: "0.3em"}}>
                                    {expandedRootFen === rootFen ? '▼' : '▶'}
                                </span>
                            </span>
                            {/* {root.moves && <span>, {root.moves}</span>} */}
                        </span>
                    </div>
                    {expandedRootFen === rootFen && children.length > 0 && (
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
                                        {popupOpening && popupOpening.moves && (
            <div
                style={{
                    marginTop: 8,
                    color: '#fff',
                    fontSize: '0.95em',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxWidth: 300,
                    textAlign: 'left',
                }}
            >
                {popupOpening.moves}
            </div>
                    )}
                </div>
            )}
        </div>
    );
};
