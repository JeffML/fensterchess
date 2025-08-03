import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ecoCats from '../datasource/ecoCats.json';
import { getEcoRootsForCat } from '../datasource/getOpeningsForEcoCat.js';

const EcoCats = ({ setCat, cat }) => (
    <div className="radio-grid">
        {Object.entries(ecoCats).map(([c]) => (
            <label key={c}>
                {c}
                <input
                    display="inline"
                    type="radio"
                    name="cat"
                    defaultChecked={cat === c}
                    value={c}
                    onChange={() => setCat(c)}
                />
            </label>
        ))}
    </div>
);

const EcoCodes = ({ setCode, cat }) => {
    const { isPending, isError, error, data: ecoCodes } = useQuery({
        queryKey: ['getEcoRootsForCat', cat],
        queryFn: async () => await getEcoRootsForCat(cat),
        enabled: cat != null,
    });

    if (isPending) return null;
    if (isError) console.error(error);

    return (
        <>
            <span className=" left font-cinzel">ECO Codes</span>
            <div>
                <select
                    id="eco-codes"
                    size={5}
                    onChange={({ target }) => {
                        setCode(target.value);
                    }}
                >
                    {Object.entries(ecoCodes).map(([, {name, eco, moves}]) => (
                        <option
                            value={eco}
                            key={eco}
                            title={name}
                        >
                            {eco} {name}, {moves.substring(0, 30)}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
};

export function EcoCatCode({ cat, setCat, setCode }) {
    return (
        <div style={{ marginLeft: '10%' }}>
            <span className=" left font-cinzel">ECO Categories</span>
            <EcoCats {...{ setCat, cat }} />
            <EcoCodes {...{ setCode, cat }} />
        </div>
    );
}