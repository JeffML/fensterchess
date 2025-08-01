import https from 'https';
import { parse } from 'node-html-parser';
import resolver from 'url';
import { authFailureResponse, authenticateRequest } from './utils/auth'
/*
  returns a list of pgn links from an html page
 */
export const handler = async (event) => {
    if (!authenticateRequest(event)) return authFailureResponse;
    
    const url = event.queryStringParameters?.url;
    try {
        const p = new Promise((resolve) => {
            https.get(url, (res) => {
                let html = '';
                res.setEncoding('utf-8');
                res.on('data', (chunk) => (html += chunk)).on('end', () => {
                    resolve(html);
                });
            });
        });

        const html = await p;

        let els = parse(html).querySelectorAll('a[href$=".pgn"]');
        let links = [];

        // Note: els is a NodeList, not an Array
        for (let i = 0; i < els.length; i++) {
            links.push(resolver.resolve(url, els[i].attributes.href)); //expands the partial link to a full one
        }

        // console.log(JSON.stringify(links));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
            },
            body: JSON.stringify(links),
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
