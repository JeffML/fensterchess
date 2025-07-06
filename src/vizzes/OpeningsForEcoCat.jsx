import { Chessboard } from 'kokopu-react';
import { useQuery } from '@tanstack/react-query';
import { getOpeningsForEcoCat } from '../datasource/getOpeningsForEcoCat';

export const OpeningsForEcoCat = ({ category, contentStyle }) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['openingsForCat', category],
        queryFn: async () => {
            const { roots } = await getOpeningsForEcoCat(category);
            return roots;
        },
        enabled: contentStyle === 'block'
    });

    if (contentStyle !== "block") return null;

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error: {error?.message || error?.toString()}</div>;
    if ((!data) || data.length === 0)
        return <div>No openings found.</div>;

    return (
        <div
            className="content eco-cats"
            style={{
                display: contentStyle,
            }}
        >
            {Object.entries(data).map(([fen, {eco, name, moves}], i) => (
                <div className="row" key={fen || code + i}>
                    <span className="column">
                        <span id="code">
                            {eco}:{'   '}
                        </span>
                        {name},{'  '}
                        {moves}
                    </span>
                    <span className="column right">
                        <Chessboard position={fen ?? 'start'} squareSize={20} />
                    </span>
                </div>
            ))}
        </div>
    );
};
