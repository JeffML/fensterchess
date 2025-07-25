import { useQuery } from '@tanstack/react-query';
import { Chessboard } from 'kokopu-react';
import { useState } from 'react';
import { getOpeningsForEcoCat } from '../datasource/getOpeningsForEcoCat';
import '../stylesheets/vizz.css';

export const OpeningsForEcoCat = ({ category, contentStyle }) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['openingsForCat', category],
        queryFn: async () => getOpeningsForEcoCat(category),
        enabled: contentStyle === 'block',
    });

    const [popupFen, setPopupFen] = useState(null);
    const [expandedRootFen, setExpandedRootFen] = useState(null);

    if (contentStyle !== 'block') return null;
    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error: {error?.message || error?.toString()}</div>;
    if (!data || data.length === 0) return <div>No openings found.</div>;

    // Find the opening (root or child) for the popupFen
    let popupOpening = null;
    if (popupFen) {
        for (const { rootFen, root, children } of data) {
            if (rootFen === popupFen) {
                popupOpening = root;
                break;
            }
            const child = children.find((child) => child.fen === popupFen);
            if (child) {
                popupOpening = child;
                break;
            }
        }
    }

    const popupStyle = popupFen
        ? { }
        : { display: 'none' };

    const handleRootClick = (fen) => {
        setExpandedRootFen(expandedRootFen === fen ? null : fen);
    };

    return (
        <div
            className="content eco-cats"
            style={{ display: contentStyle, position: 'relative' }}
        >
            {data.map(({ rootFen, root, children }) => (
                <div className="eco-root-block" key={rootFen}>
                    <div className="row">
                        <span className="column">
                            <span
                                id="code"
                                className={`eco-root-name${expandedRootFen === rootFen ? ' expanded' : ''}`}
                                onClick={() =>
                                    window.open(
                                        `https://fensterchess.com/?fen=${encodeURIComponent(
                                            rootFen
                                        )}`,
                                        '_blank'
                                    )
                                }
                                onMouseEnter={() => setPopupFen(rootFen)}
                                onMouseLeave={() => setPopupFen(null)}
                            >
                                {root.eco}: {root.name}
                                <span
                                    className="eco-arrow"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRootClick(rootFen);
                                    }}
                                >
                                    {expandedRootFen === rootFen ? '▼' : '▶'}
                                </span>
                            </span>
                        </span>
                    </div>
                    {expandedRootFen === rootFen && children.length > 0 && (
                        <ul
                            className="eco-root-openings"
                        >
                            {children.map((child) => (
                                <li
                                    key={child.fen}
                                    className="eco-child-name"
                                    onMouseEnter={() => setPopupFen(child.fen)}
                                    onMouseLeave={() => setPopupFen(null)}
                                    onClick={() =>
                                        window.open(
                                            `https://fensterchess.com/?fen=${encodeURIComponent(
                                                child.fen
                                            )}`,
                                            '_blank'
                                        )
                                    }
                                >
                                    {child.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            {popupFen && (
                <div className="eco-popup" style={popupStyle}>
                    <Chessboard position={popupFen} squareSize={32} />
                    {popupOpening && popupOpening.moves && (
                        <div className="eco-popup-moves">
                            {popupOpening.moves}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
