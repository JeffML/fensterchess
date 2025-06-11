import { XMLParser } from 'fast-xml-parser';

const getFeedAsJson = (xml) => {
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
};

export { getFeedAsJson };
