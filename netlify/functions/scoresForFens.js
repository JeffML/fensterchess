import fs from 'fs';
import { authFailureResponse, authenticateRequest } from './utils/auth'

export const handler = async (event) => {
    // if (!authenticateRequest(event)) return authFailureResponse;
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 400,
            body: 'You are not using an HTTP POST method for this endpoint.',
            headers: { Allow: 'POST' },
        };
    }

    let body;
    if (
        event.headers['content-type'] &&
        event.headers['content-type'].includes('application/json')
    ) {
        body = JSON.parse(event.body);
    }

    try {
        const {fen, from, next} = body

        const text = fs.readFileSync(
            'data/scores.json'
        );

        const scores = JSON.parse(text)

        // Look up score for the given FEN
        const score = scores[fen];

        if (score === undefined) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'Score not found for this position',
                    fen,
                }),
            };
        }

        const nextScores = next.map(fen => scores[fen])
        const fromScores = from.map(fen => scores[fen])

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust for production
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
            body: JSON.stringify({
                score,
                nextScores,
                fromScores
            }),
        };
    } catch (error) {
        console.error('Error fetching score:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
            }),
        };
    }
};
