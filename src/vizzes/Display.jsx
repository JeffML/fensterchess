import { useState } from 'react';
import {
    ECO_FLOWCHART,
    FROM_TO,
    MOST_ACTIVE,
    PIECE_DESTINATION,
} from '../Visualizations.jsx';
import { ColorAndPieces } from './ColorAndPieces.jsx';
import { EcoFlowchart } from './EcoFlowchart.jsx';
import { FromToCircle } from './FromToCircle.jsx';
import { MostActiveByPiece, MostActiveSquaresByEco } from './MostActive.jsx';
import { EcoCatCode } from './EcoCatSelector.jsx';

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

    if (viz === MOST_ACTIVE)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <MostActiveSquaresByEco {...{ cat, code }} />
            </div>
        );

    if (viz === FROM_TO)
        return (
            <div className="double-column left">
                <EcoCatCode {...{ cat, setCat, code, setCode }} />
                <FromToCircle {...{ cat, code }} />
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
                <MostActiveByPiece {...{ cat, code, colors, piece }} />
            </div>
        );

    if (viz === ECO_FLOWCHART) return <EcoFlowchart />;

    return <div className="double-column left" />;
};

export default Display;
