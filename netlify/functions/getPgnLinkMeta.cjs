const https = require('https');
import { authFailureResponse, authenticateRequest } from './utils/auth'

exports.handler = async (event) => {
    if (!authenticateRequest(event)) return authFailureResponse;

    const url = event.queryStringParameters?.url;
    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing URL parameter' }),
        };
    }

    try {
        const p = new Promise((resolve) => {
            https
                .request(url, { method: 'HEAD' }, (res) => {
                    const {
                        headers: {
                            date,
                            'last-modified': lastModified,
                            'content-type': contentType,
                            'content-length': contentLength,
                        },
                    } = res;
                    resolve({
                        lastModified: lastModified || date,
                        contentLength,
                        contentType,
                    });
                })
                .end();
        });

        const result = await p;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
            },
            body: JSON.stringify({ url, ...result }),
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
