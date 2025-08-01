import { XMLParser } from 'fast-xml-parser';
import { authenticateRequest, authFailureResponse } from './utils/auth';

// see https://lichess.org/api#tag/Opening-Explorer/operation/openingExplorerMaster
const lichessRequest = async ({ fen }) => {
    try {
        const url = `https://explorer.lichess.ovh/masters?fen=${fen}`;
        const response = await fetch(url);

        if (response.statusText !== 'OK') {
            console.error('Lichess request failed:', response.statusText);
            return { alsoKnownAs: 'ERROR', wins: { w: 0, b: 0, d: 0 } };
        }

        const json = await response.json();
        const { opening, white, black, draws } = json;

        return {
            site: 'lichess',
            alsoKnownAs: opening ? opening.name : '',
            wins: { w: white, b: black, d: draws },
        };
    } catch (error) {
        console.error('Lichess request error:', error);
        return { alsoKnownAs: 'ERROR', wins: { w: 0, b: 0, d: 0 } };
    }
};

/*
FICS responses are in XML
query: FEN=rnbqkbnr%2Fpp1p1ppp%2F4p3%2F8%2F3pP3%2F5N2%2FPPP2PPP%2FRNBQKB1R+w+KQkq+-+0+4&ratingclass=1&variant=0&transpos=1
*/
const ficsRequest = async ({ fen }) => {
    try {
        const url = `https://www.ficsgames.org/cgi-bin/explorer.cgi?FEN=${fen}&ratingclass=1&variant=0&transpos=1`;
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            console.error(
                'FICS request failed:',
                response.status,
                response.statusText
            );
            return { alsoKnownAs: 'ERROR', wins: { w: 0, b: 0, d: 0 } };
        }
        const text = await response.text();

        const parser = new XMLParser();
        const json = parser.parse(text);

        const {
            ECOName,
            NumGames: games,
            MvList: { Mv: next },
        } = json.FEN;

        // calculate w/b/d from next move list
        let wbd = { white: 0, black: 0, draw: 0, games2: 0 };
        if (next) {
            wbd = next.reduce((acc, curr) => {
                acc.white += curr.ww;
                acc.black += curr.bw;
                acc.draw += curr.d;
                acc.games2 += curr.n;
                return acc;
            }, wbd);
        }

        const { white, black, draw, games2 } = wbd;

        if (games !== games2) console.error('UH-OH', games, games2);

        return {
            site: 'fics',
            alsoKnownAs: ECOName,
            wins: { w: white, b: black, d: draw },
        };
    } catch (error) {
        console.error('FICS request error:', error);
        return { alsoKnownAs: 'ERROR', wins: { w: 0, b: 0, d: 0 } };
    }
};

const siteRequests = {
    FICS: ficsRequest,
    lichess: lichessRequest,
    // chessDotCom: chessDotComRequest,
};

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
        const { fen, sites } = JSON.parse(event.body);

        const awaiting = [];
        const data = {};

        for (let site of sites) {
            awaiting.push(siteRequests[site]({ fen }));
        }

        const results = await Promise.all(awaiting);
        // array of results are in sites request order
        sites.forEach((site, i) => {
            let { alsoKnownAs, wins } = results[i];
            if (alsoKnownAs == null || alsoKnownAs.length === 0)
                alsoKnownAs = 'n/a';
            data[site] = { alsoKnownAs, wins };
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
            },
            body: JSON.stringify(data),
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
