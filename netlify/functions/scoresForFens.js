export const handler = async (event) => {
    const { fen } = event.queryStringParameters;
    
    if (!fen) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'FEN parameter is required' })
        };
    }

    try {
        // Import scores data - you can optimize this based on your scores.js structure
        const { scores } = await import('/.netlify/functions/data/scores.js');
        
        // Look up score for the given FEN
        const score = scores[fen];
        
        if (score === undefined) {
            return {
                statusCode: 404,
                body: JSON.stringify({ 
                    error: 'Score not found for this position',
                    fen 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust for production
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
            body: JSON.stringify({ 
                fen,
                score 
            })
        };

    } catch (error) {
        console.error('Error fetching score:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};