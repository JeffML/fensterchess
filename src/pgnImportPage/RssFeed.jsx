import { gql, useQuery } from '@apollo/client';
import { Fragment, useEffect, useState } from 'react';
import { getFeedAsJson } from "../utils/getFeedAsJson";

const newsStyle = {
    fontSize: 'smaller',
    WebkitMaskImage: 'linear-gradient(180deg, #000 20%, transparent)',
    paddingRight: '3em',
    marginBottom: '1em',
};

const GET_RSS_XML = gql`
    query GetRssXML($url: String) {
        getRssXml(url: $url)
    }
`;


export const RssFeed = () => {
    const [json, setJson] = useState(null);

    const { loading, error, data } = useQuery(GET_RSS_XML, {
        variables: { url: 'https://theweekinchess.com/twic-rss-feed' },
        skip: json,
    });

    useEffect(() => {
        if (data) {
            setJson(getFeedAsJson(data.getRssXml));
        }
    }, [data]);

    if (error) console.error(error);

    return (
        json && (
            <div className="white" style={{ textAlign: 'left' }}>
                <h3 style={{ marginLeft: '-1.5em' }}>
                    News from{' '}
                    <a target="_blank" rel="noreferrer" href={json?.link}>
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
                            >
                                {item.title}
                            </a>
                        </b>
                        <br />
                        <div className='news'>
                            {item.description.slice(0, 350)}
                        </div>
                    </Fragment>
                ))}
            </div>
        )
    );
};