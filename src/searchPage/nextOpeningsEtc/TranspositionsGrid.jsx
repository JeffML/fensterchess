import { sortEnum } from '../../common/consts';
import { uniqWith } from '../../utils/uniqWith';
import { handleMoves } from './handleMoves';

// see comment on dupe "to" records in NextOpeningGrid.jsx
export const TranspositionsGrid = ({ transpositions: dupeTrans, sortBy }) => {
    const transpositions = uniqWith(dupeTrans, (a, b) => a.moves === b.moves);
    const toSort = [...transpositions];

    switch (sortBy) {
        case sortEnum.EVALUATION:
            toSort.sort((a, b) => Math.abs(a.score) - Math.abs(b.score));
            break;
        case sortEnum.NAME:
            toSort.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case sortEnum.ECO:
            toSort.sort((a, b) => a.eco.localeCompare(b.eco));
            break;
        default:
            throw Error(`unknown case ${sortBy}`);
    }

    const ListItem = ({ name, score, eco, moves }, index) => {
        const backgroundColor = index % 2 ? 'darkslategrey' : 'slategrey';
        return (
            <div
                key={moves}
                id="listItem"
                style={{
                    backgroundColor,
                }}
            >
                <div
                    style={{
                        textAlign: 'left',
                        paddingLeft: '1em',
                        fontFamily: 'mono',
                    }}
                >
                    {moves.replace(/(\d{1,3}\.)\s/g, '$1')}
                </div>
                <div style={{ paddingLeft: '1em' }}>{eco}</div>
                <div className="fakeLink">
                    <span
                        style={{ textAlign: 'left' }}
                        onClick={() => handleMoves(moves)}
                    >
                        {name}
                    </span>
                </div>
                <div style={{ textAlign: 'left' }}>{score}</div>
            </div>
        );
    };

    return (
        <div style={{ borderStyle: 'solid', marginTop: '1em' }}>
            {toSort.map((s, i) => ListItem(s, i))}
        </div>
    );
};
