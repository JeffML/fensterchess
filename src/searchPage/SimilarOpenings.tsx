import { useQuery } from "@tanstack/react-query";
import { Chessboard } from "kokopu-react";
import { useContext } from "react";
import { OpeningBookContext } from "../contexts/OpeningBookContext";
import "../stylesheets/similar.css";
import { FEN } from "../types";
import { useSearchPage } from "../contexts/SearchPageContext";

interface SimilarResponse {
  similar: FEN[];
}

const getSimilar = async (fen: FEN): Promise<SimilarResponse> => {
  const response = await fetch(
    "/.netlify/functions/getSimilarForFen?fen=" + fen,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    },
  );
  const data = await response.json();
  return data;
};

const SimilarOpenings = () => {
  const { chess, boardState, setBoardState } = useSearchPage();
  const { fen } = boardState;
  const context = useContext(OpeningBookContext);

  if (!context) {
    return <span>Loading opening book...</span>;
  }

  const { openingBook } = context;

  const {
    isPending: loading,
    isError,
    error,
    data,
  } = useQuery({
    queryKey: ["getSimilar", fen],
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
    const fullSimInfo = data.getSimilarOpenings
      .map((fen) => {
        const opening = openingBook?.[fen];
        if (!opening) return null;
        const { name, moves } = opening;
        return { fen, name, moves };
      })
      .filter(
        (sim): sim is { fen: FEN; name: string; moves: string } => sim !== null,
      );

    //   if (!openingBook) return <div>Loading...</div>;

    // Show "None found" message if no similar openings
    if (fullSimInfo.length === 0) {
      return (
        <div className="padding-1 text-white" style={{ fontStyle: "italic" }}>
          No similar openings found.
        </div>
      );
    }

    const sims = fullSimInfo.map((sim) => {
      return (
        <div id="similar-opening" key={sim.fen} className="similar-opening">
          <span
            style={{ paddingBottom: "3px" }}
            className="fakeLink"
            onClick={() => {
              // Sync chess instance with the similar opening
              chess.current.reset();
              if (sim.moves) {
                chess.current.loadPgn(sim.moves);
              }
              // Update board state with similar opening's FEN and moves
              setBoardState({ fen: sim.fen, moves: sim.moves });
            }}
          >
            {sim.name}
          </span>
          <Chessboard position={sim.fen} squareSize={20} />
        </div>
      );
    });

    return (
      <div id="no-similar" className="similar-openings">
        {sims}
      </div>
    );
  }
};

export { SimilarOpenings };
