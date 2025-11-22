import { XMLParser } from 'fast-xml-parser';

interface FeedItem {
    title: string;
    link: string;
    description: string;
}

interface FeedData {
    title: string;
    link: string;
    description: string;
    items: FeedItem[];
}

interface RssChannel {
    title: string;
    link: string;
    description: string;
    item: FeedItem[];
}

interface RssRoot {
    rss: {
        channel: RssChannel;
    };
}

export const getFeedAsJson = (xml: string): FeedData => {
    const json = new XMLParser().parse(xml) as RssRoot;

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
