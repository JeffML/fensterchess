import https from 'https';

export const handler = async (event) => {
    const url = event.queryStringParameters?.url;
    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing URL parameter' }),
        };
    }

    try {
        const p = new Promise((resolve) => {
            https.get(url, (res) => {
                let xml = '';
                res.setEncoding('utf-8');
                res.on('data', (chunk) => (xml += chunk)).on('end', () => {
                    resolve(xml);
                });
            });
        });

        const xml = await p;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/xml',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
            },
            body: xml,
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
