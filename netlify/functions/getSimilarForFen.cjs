const similarData = require('./similar.json')

exports.handler = async (event) => {
    const fen = event.queryStringParameters?.fen;
    if (!fen) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing fen parameter' }),
        };
    }

    // Find similar openings for the given FEN
    const result = similarData[fen] || [];

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
        },
        body: JSON.stringify({ fen, similar: result }),
    };
};
