import fetch from 'node-fetch';

// pulls the opening data from eco.json github repo
 async function getLatestEcoJson() {
    const ROOT = 'https://raw.githubusercontent.com/hayatbiralem/eco.json/master/';
    const openingsByCat = {
        A: { url: ROOT + 'ecoA.json' },
        B: { url: ROOT + 'ecoB.json' },
        C: { url: ROOT + 'ecoC.json' },
        D: { url: ROOT + 'ecoD.json' },
        E: { url: ROOT + 'ecoE.json' },
        IN: { url: ROOT + 'eco_interpolated.json' },
        FT: { url: ROOT + 'fromTo.json' },
    };

    const promises = [];
    for (const cat in openingsByCat) {
        promises.push(fetch(openingsByCat[cat].url));
    }

    const res = await Promise.all(promises);
    let i = 0;

    for (const cat in openingsByCat) {
        const json = await res[i++].json();
        openingsByCat[cat].json = json;
    }

    return openingsByCat;
}

export async function openingBook() {
    const { A, B, C, D, E, IN } = await getLatestEcoJson();

    const openingBook = {
        ...A.json,
        ...B.json,
        ...C.json,
        ...D.json,
        ...E.json,
        ...IN.json,
    };

    return openingBook
}