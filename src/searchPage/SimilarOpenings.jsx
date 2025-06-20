import { useQuery } from '@tanstack/react-query';
import { Chessboard } from 'kokopu-react';
import { useContext } from 'react';
import { SERVER } from '../common/consts.js';
import { OpeningBookContext } from '../contexts/OpeningBookContext.jsx';


const getSimilar = async (fen) => {
    const response = await fetch(
        SERVER + '/.netlify/functions/getSimilarForFen?fen=' + fen
    );
    const data = await response.json();
    return data;
};

const SimilarOpenings = ({ boardState, setBoardState }) => {
    const { fen, moves } = boardState;
    const {openingBook} = useContext(OpeningBookContext)

    const {
        isPending: loading,
        isError,
        error,
        data,
    } = useQuery({
        queryKey: ['getSimilar', fen],
        queryFn: async () => {
            const sims = await getSimilar(fen);
            return { getSimilarOpenings: sims.similar };
        },
    });

    if (loading) {
        return <span>Loading...</span>;
    }
    if (isError) {
        console.error(error);
        return <span> ERROR: {error.toString()}</span>;
    }
    if (data) {
        const fullSimInfo = data.getSimilarOpenings.map((fen) => {
            const { name, moves } = openingBook[fen];
            return { fen, name, moves };
        });

        //   if (!openingBook) return <div>Loading...</div>;
        const sims = fullSimInfo.map((sim) => {
            return (
                <div
                    key={sim.fen}
                    style={{
                        display: 'grid',
                        justifyItems: 'flex-start',
                        paddingLeft: '2em',
                        paddingTop: '0.7em',
                    }}
                >
                    <span
                        style={{ paddingBottom: '3px' }}
                        className="fakeLink"
                        onClick={() => setBoardState({ fen: sim.fen, moves })}
                    >
                        {sim.name}
                    </span>
                    <Chessboard position={sim.fen} squareSize={20} />
                </div>
            );
        });

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                }}
            >
                {sims}
            </div>
        );
    }
};

export { SimilarOpenings };
