import https from 'https';
import { authFailureResponse, authenticateRequest } from './utils/auth'

export const handler = async (event) => {
    if (!authenticateRequest(event)) return authFailureResponse;
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 501, // Not Implemented
            body: JSON.stringify({ message: 'Not Implemented' }),
            headers: { 'content-type': 'application/json' },
        };
    }

    try {
        const body = JSON.parse(event.body);
        const links = body.pgnLinks.entries();

        const contents = [];

        for (const [index, { link }] of links) {
            let string = '';
            contents[index] = new Promise((resolve) => {
                https
                    .request(link, (res) => {
                        res.on('data', (chunk) => (string += chunk));
                        res.on('end', () => resolve(string));
                    })
                    .end();
            });
        }
        const settled = await Promise.allSettled(contents);

        // return the link and associated PGN data. (other [meta]pgnLink fields not used at this time)
        const results = settled.map((result, index) => ({
            link: body.pgnLinks[index].link,
            pgn: result.value,
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
            },
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message,
            }),
        };
    }
};
