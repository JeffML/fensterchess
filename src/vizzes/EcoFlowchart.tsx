import { useState } from 'react';
import ecoCats from '../datasource/ecoCats.json';
import './EcoFlowchart.css';
import { OpeningsForEcoCat } from './OpeningsForEcoCat';

interface EcoCatsProps {
    category: string;
    desc: string;
}

const EcoCats = ({ category, desc }: EcoCatsProps) => {
    const [active, setActive] = useState<string>('');
    const [contentStyle, setContentStyle] = useState<'none' | 'block'>('none');

    const handler = () => {
        setContentStyle(contentStyle === 'block' ? 'none' : 'block');
        setActive(active === 'active' ? '' : 'active');
    };

    return (
        <>
            <button
                type="button"
                className={`collapsible font-cinzel " + ${active}`}
                style={{ fontSize: 'large' }}
                onClick={handler}
            >
                {category}&mdash;{desc}
            </button>
            <OpeningsForEcoCat {...{ category, contentStyle }} />
        </>
    );
};

const EcoFlowchart = () => (
    <div style={{ marginRight: '3em' }}>
        {Object.entries(ecoCats).map(([category, desc]) => (
            <EcoCats {...{ category, desc }} key={category} />
        ))}
    </div>
);

export { EcoFlowchart };
