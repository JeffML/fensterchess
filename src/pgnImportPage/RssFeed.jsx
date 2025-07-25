import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { SERVER, TWIC_RSS } from '../common/urlConsts';
import { dateStringShort } from '../utils/dateStringShort';
import { getFeedAsJson } from "../utils/getFeedAsJson";

const getRssXml = async(url) => {
    const response = await fetch(
        SERVER + '/.netlify/functions/getRssXml?url=' + TWIC_RSS
    )
    const data = await response.text();
    return data;
}


export const RssFeed = () => {
    const [json, setJson] = useState(null);

    const {isError, error, data} = useQuery({
        queryKey: ["getRssXml", dateStringShort()],
        queryFn: getRssXml
    })

    useEffect(() => {
        if (data) {
            setJson(getFeedAsJson(data));
        }
    }, [data]);

    if (isError) console.error(error);

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
                            {item.description.slice(0, 325)}
                        </div>
                    </Fragment>
                ))}
            </div>
        )
    );
};