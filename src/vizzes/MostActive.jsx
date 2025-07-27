import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { HeatMap3D } from './HeatMap3D.jsx';
import { HeatMap2D } from './HeatMap2D.jsx';
import {
    getMostActiveSquaresByEco,
    getMostActiveSquaresByEcoDetailed,
} from '../datasource/getMostActiveSquaresByEco.js';

const HeatMapType = ({ type, setType }) => {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'auto auto auto auto',
        gridColumnGap: '3em',
    };

    return (
        <div className="row" style={gridStyle} id="heatmaptype">
            <span style={{ fontWeight: 'bold', color: 'mediumturquoise' }}>
                Select a style:
            </span>
            <label>
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === '2D'}
                    onClick={() => setType('2D')}
                />{' '}
                2D
            </label>
            <br />
            <label>
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === '3D'}
                    onClick={() => setType('3D')}
                />
                3D
                {type === '3D' && (
                    <span style={{ color: 'lightgreen', marginLeft: '2em' }}>
                        (mouse draggable)
                    </span>
                )}
            </label>
        </div>
    );
};

const HeatMaps = ({ dests, type, setType }) => {
    return (
        <div className="double-column left" style={{ marginTop: '1em' }}>
            <HeatMapType {...{ type, setType }} />
            <br />
            {type === '3D' && <HeatMap3D {...{ dests }} />}
            {type === '2D' && <HeatMap2D {...{ dests }} />}
        </div>
    );
};

const MostActiveSquaresByEco = ({ cat, code }) => {
    const [type, setType] = useState();

    if (code === 'all') code = undefined;
    else if (code) code = code.substr(1, 2);

    const { isError, isPending, error, data } = useQuery({
        queryFn: async () => getMostActiveSquaresByEco(cat + code),
        queryKey: ['getMostActiveSquaresByEco', cat + code],
        enabled: code != null,
    });

    if (code == null) return null;

    if (isError) console.error(error.toString());
    if (isPending) return <div className="double-column left">Loading...</div>;
    if (data) {
        return <HeatMaps {...{ dests: data, type, setType }} />;
    }
    return null;
};

const MostActiveByPiece = ({ cat, code, colors, piece }) => {
    const [type, setType] = useState();

    if (code === 'all') code = undefined;
    else if (code) code = code.substr(1, 2);

    const { isError, isPending, error, data } = useQuery({
        queryKey: ['mostActiveDetailed', cat + code],
        queryFn: async () => getMostActiveSquaresByEcoDetailed(cat + code),
        enabled: code != null,
    });

    if (code == null) return null;

    if (isError) console.error(error.toString());
    if (isPending) return <div className="double-column left">Loading...</div>;

    if (data) {
        const dests = {};
        // reduce according to colors and piece selected
        for (const dest in data) {
            const detail = data[dest];
            if (!detail.pieces.includes(piece)) continue;

            if (colors.includes('White') && detail.isWhite) {
                dests[dest] ??= 0;
                dests[dest] += detail.count;
            }

            if (colors.includes('Black') && !detail.isWhite) {
                dests[dest] ??= 0;
                dests[dest] += detail.count;
            }
        }

        return <HeatMaps {...{ dests, type, setType }} />;
    }

    return null;
};

export { MostActiveSquaresByEco, MostActiveByPiece };
