import { useQuery } from '@tanstack/react-query';
import { Chessboard } from 'kokopu-react';
import { useContext } from 'react';
import { OpeningBookContext } from '../contexts/OpeningBookContext.jsx';
import '../stylesheets/similar.css';

const getSimilar = async (fen) => {
    const response = await fetch(
        '/.netlify/functions/getSimilarForFen?fen=' + fen
    );
    const data = await response.json();
    return data;
};

const SimilarOpenings = ({ boardState, setBoardState }) => {
    const { fen, moves } = boardState;
    const { openingBook } = useContext(OpeningBookContext);

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
                    id="similar-opening"
                    key={sim.fen}
                    className="similar-opening"
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
            <div id="no-similar" className='similar-openings'>
                {sims}
            </div>
        );
    }
};

export { SimilarOpenings };
