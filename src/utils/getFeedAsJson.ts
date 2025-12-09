import { XMLParser } from "fast-xml-parser";

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

  // Safely check if RSS structure exists
  if (!json?.rss?.channel) {
    console.error("Invalid RSS feed structure:", json);
    return { title: "", link: "", description: "", items: [] };
  }

  const {
    rss: {
      channel: { title, link, description, item },
    },
  } = json;

  // Handle case where item might not be an array or might be undefined
  const itemsArray = Array.isArray(item) ? item : item ? [item] : [];

  const items = itemsArray
    .map((item) => {
      const { title, link, description } = item;
      return { title, link, description };
    })
    .slice(0, 4);
  return { title, link, description, items };
};
