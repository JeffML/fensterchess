import { ECO_JSON_RAW } from "../common/urlConsts";
import { OpeningBook } from "../types";

interface EcoCategoryData {
  url: string;
  json?: OpeningBook;
}

interface OpeningsByCat {
  initialized: boolean;
  A?: EcoCategoryData;
  B?: EcoCategoryData;
  C?: EcoCategoryData;
  D?: EcoCategoryData;
  E?: EcoCategoryData;
  IN?: EcoCategoryData;
}

let openingsByCat: OpeningsByCat = { initialized: false };

// pulls the opening data from eco.json github repo
export async function getLatestEcoJson(): Promise<OpeningsByCat> {
  if (!openingsByCat.initialized) {
    const ROOT = ECO_JSON_RAW;

    openingsByCat = {
      initialized: false,
      A: { url: ROOT + "ecoA.json" },
      B: { url: ROOT + "ecoB.json" },
      C: { url: ROOT + "ecoC.json" },
      D: { url: ROOT + "ecoD.json" },
      E: { url: ROOT + "ecoE.json" },
      IN: { url: ROOT + "eco_interpolated.json" },
      // FT: { url: ROOT + 'fromTo.json' },
    };

    const promises: Promise<Response>[] = [];
    for (const cat in openingsByCat) {
      if (cat !== "initialized") {
        const category =
          openingsByCat[cat as keyof Omit<OpeningsByCat, "initialized">];
        if (category) {
          promises.push(fetch(category.url));
        }
      }
    }

    const res = await Promise.all(promises);
    let i = 0;

    for (const cat in openingsByCat) {
      if (cat !== "initialized") {
        const category =
          openingsByCat[cat as keyof Omit<OpeningsByCat, "initialized">];
        if (category) {
          const json = await res[i++].json();
          category.json = json;
        }
      }
    }

    openingsByCat.initialized = true;
  }

  return openingsByCat;
}

export async function openingBook(): Promise<OpeningBook> {
  const { A, B, C, D, E, IN } = await getLatestEcoJson();

  const openingBook: OpeningBook = {
    ...A?.json,
    ...B?.json,
    ...C?.json,
    ...D?.json,
    ...E?.json,
    ...IN?.json,
  };

  return openingBook;
}
