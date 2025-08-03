import { useState, lazy, Suspense } from 'react';
import {
    ECO_FLOWCHART,
    FROM_TO,
    MOST_ACTIVE,
    PIECE_DESTINATION,
} from '../Visualizations.jsx';
import { ColorAndPieces } from './ColorAndPieces.jsx';
import { EcoCatCode } from './EcoCatSelector.jsx';

// Lazy load heavy components
const EcoFlowchart = lazy(() => import('./EcoFlowchart.jsx').then(m => ({ default: m.EcoFlowchart })));
const FromToCircle = lazy(() => import('./FromToCircle.jsx').then(m => ({ default: m.FromToCircle })));
const MostActiveByPiece = lazy(() => import('./MostActive.jsx').then(m => ({ default: m.MostActiveByPiece })));
const MostActiveSquaresByEco = lazy(() => import('./MostActive.jsx').then(m => ({ default: m.MostActiveSquaresByEco })));

export const Display = ({ viz }) => {
    const [cat, setCat] = useState();
    const [code, setCode] = useState();
    const [colors, setColors] = useState(["White"]);
    const [piece, setPiece] = useState('P');

    if (!viz)
        return (
            <div>
                <img
                    src="resources/ekthpeeramenths.jpg"
                    alt="frankenstein movie still"
                />
            </div>
        );

    const Loading = () => <div>Loading...</div>;

    if (viz === MOST_ACTIVE)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <Suspense fallback={<Loading />}>
                    <MostActiveSquaresByEco {...{ cat, code }} />
                </Suspense>
            </div>
        );

    if (viz === FROM_TO)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <Suspense fallback={<Loading />}>
                    <FromToCircle {...{ cat, code }} />
                </Suspense>
            </div>
        );

    if (viz === PIECE_DESTINATION)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                {cat && code && (
                    <ColorAndPieces
                        {...{ colors, piece, setColors, setPiece }}
                    />
                )}
                <Suspense fallback={<Loading />}>
                    <MostActiveByPiece {...{ cat, code, colors, piece }} />
                </Suspense>
            </div>
        );

    if (viz === ECO_FLOWCHART) 
        return (
            <Suspense fallback={<Loading />}>
                <EcoFlowchart />
            </Suspense>
        );

    return <div className="double-column left" />;
};

export default Display;
