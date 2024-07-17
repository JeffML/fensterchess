const PliesAryToMovesStringSpan = (plies, { start = 0, plyIndex, color }) => {
    const moveString = (move, i) => {
        return (i % 2 === 0 ? `${i / 2 + 1}. ` : " ") + `${move} `;
    };

    return (
        <>
            {plies.map((ply, index) => {
                let i = index + start;
                if (i === plyIndex - 1) {
                    return <u key={i} style={{ color }}><b>{moveString(ply, i)}</b></u>;
                } else {
                    return <span key={i} style={{ color }}>{moveString(ply, i)}</span>;
                }
            })}
        </>
    );
};

export default PliesAryToMovesStringSpan;
