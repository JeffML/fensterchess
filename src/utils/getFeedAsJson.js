// import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const getFeedAsJson = async (url) => {
    const response = await fetch(url);

    const xml = await response.text();

    const json = new XMLParser().parse(xml);

    const {rss:{channel:{title, link, description, item}}} = json;

    const items = item.map(item => {
        const {title, link, description} = item
        return {title, link, description}
    }).slice(0, 4)

    return {title, link, description, items};
};

export default getFeedAsJson;
