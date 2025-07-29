
export const externalOpeningStats = async (fen, sites) => {
    const response = await fetch('/.netlify/functions/getExternalOpeningStats', {
        method: 'POST',
        body: JSON.stringify({ fen, sites }),
    });

    const json = await response.json()
    return json
};
