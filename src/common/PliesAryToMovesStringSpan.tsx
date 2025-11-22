import { CSSProperties } from 'react';

interface PliesAryToMovesStringSpanProps {
    start?: number;
    plyIndex: number;
    color?: CSSProperties['color'];
}

const PliesAryToMovesStringSpan = (
    plies: string[],
    { start = 0, plyIndex, color }: PliesAryToMovesStringSpanProps
) => {
    const moveString = (move: string, i: number): string => {
        return (i % 2 === 0 ? `${i / 2 + 1}. ` : ' ') + `${move} `;
    };

    return (
        <>
            {plies.map((ply, index) => {
                const i = index + start;
                if (i === plyIndex - 1) {
                    return (
                        <u key={i} style={{ color }}>
                            <b>{moveString(ply, i)}</b>
                        </u>
                    );
                } else {
                    return (
                        <span key={i} style={{ color }}>
                            {moveString(ply, i)}
                        </span>
                    );
                }
            })}
        </>
    );
};

export default PliesAryToMovesStringSpan;
