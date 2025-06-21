import { useState } from 'react';



export const Players = ({ pgnSumm }) => {
    const { players } = pgnSumm;
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 3fr 1fr',
        gap: '2em',
    };

    const [method, setMethod] = useState('name');

    const sort = (a, b) => {
        const titleSort = [
            'GM',
            'WGM',
            'IM',
            'WIM',
            'FM',
            'WFM',
            'CM',
            'WCM',
            'NM',
            '',
        ];

        if (method === 'name') return a.name.localeCompare(b.name);
        if (method === 'ELO')
            return parseInt(b.elo ?? 0) - parseInt(a.elo ?? 0);
        if (method === 'title') {
            return (
                titleSort.indexOf(a.title ?? '') -
                titleSort.indexOf(b.title ?? '')
            );
        }
    };

    const onChange = (e) => setMethod(e.target.value);

    return (
        <>
            <div
                style={{
                    whiteSpace: 'nowrap',
                    color: 'powderblue',
                    justifyContent: 'space-evenly',
                }}
            >
                Sort by:{' '}
                <label style={{ marginLeft: '1em' }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="name"
                        defaultChecked="true"
                        onChange={onChange} />
                    Player name
                </label>
                <label style={{ display: 'inline', marginLeft: '1em' }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="ELO"
                        onChange={onChange} />
                    Player ELO
                </label>
                <label style={{ display: 'inline', marginLeft: '1em' }}>
                    <input
                        type="radio"
                        name="sortBy"
                        value="title"
                        onChange={onChange} />
                    Player Title
                </label>
            </div>
            <div className="column scrollableY">
                {Object.values(players)
                    .sort(sort)
                    .map(({ name, elo, title }, i) => (
                        <div
                            className="left white"
                            key={name}
                            style={{
                                ...gridStyle,
                                backgroundColor: i % 2 ? 'slategray' : 'inherit',
                            }}
                        >
                            <span className="left">{title}</span>
                            <span className="left">{name}</span>
                            <span>{elo}</span>
                        </div>
                    ))}
            </div>
        </>
    );
};
