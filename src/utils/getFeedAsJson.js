// import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const getFeedAsJson = async (url) => {
    const response = await fetch(url);

    const xml = await response.text();

    const json = new XMLParser().parse(xml);

    return json;
};

export default getFeedAsJson;
