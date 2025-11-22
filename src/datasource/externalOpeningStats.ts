import { FEN } from "../types";

interface ExternalOpeningStatsRequest {
  fen: FEN;
  sites: string[];
}

export const externalOpeningStats = async (
  fen: FEN,
  sites: string[]
): Promise<any> => {
  const response = await fetch("/.netlify/functions/getExternalOpeningStats", {
    method: "POST",
    body: JSON.stringify({ fen, sites } as ExternalOpeningStatsRequest),
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
    },
  });

  const json = await response.json();
  return json;
};
