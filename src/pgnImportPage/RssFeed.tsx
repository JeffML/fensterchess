import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { TWIC_RSS } from "../common/urlConsts";
import { dateStringShort } from "../utils/dateStringShort";
import { getFeedAsJson } from "../utils/getFeedAsJson";

const getRssXml2 = async () => {
  const response = await fetch(
    "/.netlify/functions/getRssXml?url=" + TWIC_RSS,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );
  const data = await response.text();
  return data;
};

interface FeedJson {
  link: string;
  title: string;
  description?: string;
  items?: Array<{
    title: string;
    link: string;
    description: string;
  }>;
}

export const RssFeed = () => {
  const [json, setJson] = useState<FeedJson | null>(null);

  const { isError, error, data } = useQuery({
    queryKey: ["getRssXml2", dateStringShort()],
    queryFn: getRssXml2,
  });

  useEffect(() => {
    if (data) {
      setJson(getFeedAsJson(data));
    }
  }, [data]);

  if (isError) console.error(error);

  return (
    json && (
      <div className="white" style={{ textAlign: "left" }}>
        <h3 style={{ marginLeft: "-1.5em" }}>
          News from{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href={json?.link}
            style={{ color: "limegreen" }}
          >
            {json?.title}
          </a>
        </h3>
        {/* <h4>{json?.description}</h4> */}
        {json.items?.map((item) => (
          <Fragment key={item.title}>
            <b>
              <a
                target="_blank"
                rel="noreferrer"
                href={item.link}
                style={{ color: "limegreen" }}
              >
                {item.title}
              </a>
            </b>
            <br />
            <div className="news">{item.description.slice(0, 325)}</div>
          </Fragment>
        ))}
      </div>
    )
  );
};
