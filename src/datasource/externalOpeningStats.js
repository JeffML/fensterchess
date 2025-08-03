
export const externalOpeningStats = async (fen, sites) => {
    const response = await fetch('/.netlify/functions/getExternalOpeningStats', {
        method: 'POST',
        body: JSON.stringify({ fen, sites }),
        headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`
        }
    });

    const json = await response.json()
    return json
};
