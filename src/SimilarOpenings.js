import { gql, useQuery } from "@apollo/client";
import { Chessboard } from "kokopu-react";

const GET_SIMILAR = gql`
    query getSimilar($fen: String!) {
        getSimilarOpenings(fen: $fen) {
            fen
            simScore
            name
        }
    }
`;

const SimilarOpenings = ({ fen, setFen }) => {
    const { error, data, loading } = useQuery(GET_SIMILAR, {
        variables: { fen },
    });

    if (loading) {
        return <span>Loading...</span>;
    }
    if (error) {
        return <span> ERROR: {error.toString()}</span>;
    }
    if (data) {
        const sims = data.getSimilarOpenings.map((sim) => {
            return (
                <div
                    key={sim.fen}
                    style={{
                        display: "grid",
                        justifyItems: "flex-start",
                        paddingLeft: "2em",
                        paddingTop: "0.7em",
                    }}
                >
                    <span
                        style={{ paddingBottom: "3px" }}
                        className="fakeLink"
                        onClick={() => setFen(sim.fen)}
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                {sims}
            </div>
        );
    }
};

export { SimilarOpenings };
