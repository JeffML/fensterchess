import { Fragment } from 'react/jsx-runtime';
import '../../../stylesheets/pgnImport.css';
import { sleep } from '../../../utils/sleep';
import { blueBoldStyle } from '../PgnSummaryTab';

export const Openings = ({ openings, setFlash, filter, setFilter }) => {

    const sleepTime = 300;

    const handler = async ({ target }) => {
        setFlash(true);
        await sleep(sleepTime);
        setFlash(false);
        await sleep(sleepTime);
        setFlash(true);
        await sleep(sleepTime);
        setFlash(false);
        await sleep(sleepTime);
        setFlash(true);
        await sleep(sleepTime);
        setFlash(false);

        if (target.checked)
            setFilter((prev) => {
                prev.push(target.value);
                return prev;
            });
        else setFilter((prev) => prev.filter((f) => f !== target.value));
    };

    return (
        <div  className="scrollableY white openings-grid">
            <span
                className="font-cinzel left"
                style={{ ...blueBoldStyle, gridColumn: 'span 2' }}
            >
                Openings
                <span style={{ fontSize: 'smaller', paddingTop: '2px' }}>
                    &nbsp;(from PGN)
                </span>
            </span>
            {Array.from(openings)
                .sort((a, b) => a.localeCompare(b))
                .map((o, i) => (
                    <Fragment key={o + i}>
                        <input
                            type="checkbox"
                            value={o}
                            onClick={handler}
                            defaultChecked={filter.includes(o)}
                        ></input>
                        <span key={o + i} className="left">
                            {o ?? '(no name)'}
                        </span>
                    </Fragment>
                ))}
        </div>
    );
};
