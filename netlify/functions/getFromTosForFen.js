import fs from 'fs'

const result = fs.readFileSync('data/fromToPositionIndexed.json')

const json = JSON.parse(result)


if (json == null) console.error("did not read data file")


//return position part of FEN string
const pos = (fen) => fen.split(' ')[0];

export const handler = async(event) => {
    const fen = event.queryStringParameters?.fen

    if (!fen) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing fen parameter' }),
        };
    }

    const position = pos(fen)

    const result = {next: json.to[position]??[], from: json.from[position]??[]}

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
        },
        body: JSON.stringify(result),
    };
}