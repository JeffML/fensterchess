import DOMPurify from 'dompurify';
import { WIKI_THEORY_API, WIKI_THEORY_API_QS } from '../common/urlConsts.js';
import { movesStringToPliesAry } from '../utils/openings.js'

const xformWikibooksUrl = (url) => {
    // original: https://en.wikibooks.org/w/api.php?titles=Chess_Opening_Theory/1._d4/1...Nf6&amp;redirects&amp;origin=*&amp;action=query&amp;prop=extracts&amp;formatversion=2&amp;format=json&amp;exchars=1200
    // wanted: https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._d4/1...Nf6
    // step 1: truncate
    const ampIndex = url.indexOf('&');
    // step 2: remove api junk in path
    let wanted = url.slice(0, ampIndex);
    wanted = wanted.replace('/w/', '/wiki/');
    wanted = wanted.replace('api.php?titles=', '');
    console.log({ wanted });
    return wanted;
};

export const theoryRequest = async (currentMoves, setHtml) => {
    const urlMoves = () => {
        const plies = movesStringToPliesAry(currentMoves);
        const moves = plies.map((ply, i) => {
            const move = Math.ceil((i + 1) / 2) + '.';
            const black = (i + 1) % 2 === 0;

            return move + (black ? '..' : '_') + ply;
        });

        return moves.join('/');
    };

    const url = `${WIKI_THEORY_API}${urlMoves()}${WIKI_THEORY_API_QS}`;
    const link = xformWikibooksUrl(url)

    const response = await fetch(url);
    const json = await response.json();
    let html = json.query?.pages[0]?.extract;

    if (html) {
        let anchorTagIndex = html.lastIndexOf('...');
        const anchor = `<p><a  style='color: lightgreen' href=${link}>(more)</a></p>`;

        if (anchorTagIndex === -1 || anchorTagIndex < html.length - 3) {
            html += anchor;
        } else {
            const before = html.slice(0, anchorTagIndex);
            html = before + anchor;
        }

        const clean = DOMPurify.sanitize(html);
        setHtml(clean);
    }
};

export const Theory = ({ html }) => {
    return (
        <div
            style={{ textAlign: "left", marginLeft: "1em" }}
            dangerouslySetInnerHTML={{ __html: html }} />
    );
};



