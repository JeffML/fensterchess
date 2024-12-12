// import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const getFeedAsJson = async (url) => {
    try {
        const response = await fetch(url);

        if (response.status == 404) {
            throw Error("404 response")
        }

        const xml = await response.text();

        const json = new XMLParser().parse(xml);

        const {
            rss: {
                channel: { title, link, description, item },
            },
        } = json;

        const items = item
            .map((item) => {
                const { title, link, description } = item;
                return { title, link, description };
            })
            .slice(0, 4);
        return { title, link, description, items };
    } catch (error) {
        console.error(error);
        return null;
    }

};

export {getFeedAsJson};
