import { SERVER_FN_URL } from "../common/urlConsts";

export const externalOpeningStats = async (fen, sites) => {
    const response = await fetch(SERVER_FN_URL + '/getExternalOpeningStats', {
        method: 'POST',
        body: JSON.stringify({ fen, sites }),
    });

    const json = await response.json()
    return json
};
