import { useState } from 'react';
import {
    ECO_FLOWCHART,
    FROM_TO,
    MOST_ACTIVE,
    PIECE_DESTINATION,
} from '../Visualizations.jsx';
import { BallOfMud } from './BallOfMud.jsx';
import { ColorAndPieces } from './ColorAndPieces.jsx';
import { EcoFlowchart } from './EcoFlowchart.jsx';
import { FromToCircle } from './FromToCircle.jsx';
import { MostActiveByPiece, MostActiveSquaresByEco } from './MostActive.jsx';
import ecoCats from '../datasource/ecoCats.json';
import { getEcoRootsForCat } from '../datasource/getOpeningsForEcoCat.js';
import { useQuery } from '@tanstack/react-query';

const EcoCats = ({ setCat, cat }) => (
    <div className="radio-grid">
        {Object.entries(ecoCats).map(([c]) => (
            <label key={c}>
                {c}
                <input
                    display="inline"
                    type="radio"
                    name="cat"
                    defaultChecked={cat === c}
                    value={c}
                    onChange={() => setCat(c)}
                />
            </label>
        ))}
    </div>
);

const EcoCodes = ({ setCode, cat }) => {
    const { isPending, isError, error, data: ecoCodes } = useQuery({
        queryKey: ['getEcoRootsForCat', cat],
        queryFn: async () => await getEcoRootsForCat(cat),
        enabled: cat != null, // loose equality handles undefined as well
    });

    if (isPending) return null;
    if (isError) console.error(error);

    return (
        <>
            <span className=" left font-cinzel">ECO Codes</span>
            <div>
                <select
                    id="eco-codes"
                    size={5}
                    onChange={({ target }) => {
                        setCode(target.value);
                    }}
                >
                    {Object.entries(ecoCodes).map(([, {name, eco, moves}]) => (
                        <option
                            value={eco}
                            key={eco}
                            title={name}
                        >
                            {eco} {name}, {moves.substring(0, 30)}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

function EcoCatCode({ cat, setCat, setCode }) {
    return (
        <div style={{ marginLeft: '10%' }}>
            <span className=" left font-cinzel">ECO Categories</span>
            <EcoCats {...{ setCat, cat }} />
            <EcoCodes {...{ setCode, cat }} />
        </div>
    );
}

export const Display = ({ viz }) => {
    const [cat, setCat] = useState();
    const [code, setCode] = useState();
    const [colors, setColors] = useState([]);
    const [piece, setPiece] = useState();

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
    if (viz === 'ball of mud') {
        // FIXME: HARDWIRED
        const fen =
            'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2';
        const type = 'pathBySquare';

        return <BallOfMud {...{ fen, type }} />;
    }
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
    if (viz === ECO_FLOWCHART) return <EcoFlowchart></EcoFlowchart>;

    return <div className="double-column left" />;
};
