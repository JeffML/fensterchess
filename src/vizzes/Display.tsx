import { useState, lazy, Suspense } from 'react';
import {
    ECO_FLOWCHART,
    FROM_TO,
    MOST_ACTIVE,
    PIECE_DESTINATION,
} from '../Visualizations.jsx';
import { ColorAndPieces } from './ColorAndPieces';
import { EcoCatCode } from './EcoCatSelector';

// Lazy load heavy components
const EcoFlowchart = lazy(() => import('./EcoFlowchart').then(m => ({ default: m.EcoFlowchart })));
const FromToCircle = lazy(() => import('./FromToCircle.jsx').then(m => ({ default: m.FromToCircle })));
const MostActiveByPiece = lazy(() => import('./MostActive').then(m => ({ default: m.MostActiveByPiece })));
const MostActiveSquaresByEco = lazy(() => import('./MostActive').then(m => ({ default: m.MostActiveSquaresByEco })));

interface DisplayProps {
    viz?: string;
}

export const Display = ({ viz }: DisplayProps) => {
    const [cat, setCat] = useState<string | undefined>();
    const [code, setCode] = useState<string | undefined>();
    const [colors, setColors] = useState<string[]>(["White"]);
    const [piece, setPiece] = useState<string>('P');

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
