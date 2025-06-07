import { SelectedSitesContext } from './common/SelectedSitesContext.js';
import { OpeningTabs } from './OpeningTabs.js';
import { useContext, useEffect } from 'react';

const Opening = ({
    boardState,
    setBoardState,
    handleMovePlayed,
    data,
    lastKnownOpening,
    setLastKnownOpening,
}) => {
    const sites = useContext(SelectedSitesContext);

    useEffect(() => {
        if (data?.getOpeningForFenFull) {
            setLastKnownOpening(data.getOpeningForFenFull);
        }
    }, [data, setLastKnownOpening]);

    if (data?.getOpeningForFenFull) {
        let {
            getOpeningForFenFull: {
                eco,
                name,
                moves: currentMoves,
                next: variations,
                from,
                src,
                score,
            },
        } = data;

        return (
            <div className="double-column left">
                <OpeningName {...{ eco, src, name, score }} />

                <OpeningTabs
                    {...{
                        boardState,
                        setBoardState,
                        variations,
                        currentMoves,
                        handleMovePlayed,
                        sites,
                        eco,
                        name,
                        from,
                        lastKnownOpening,
                    }}
                />
            </div>
        );
    } else {
        const { eco, name, src, score } = lastKnownOpening;
        return (
            <div className="double-column left">
                <OpeningName {...{ eco, name, src, score }} />
                <OpeningTabs
                    {...{
                        boardState,
                        setBoardState,
                        handleMovePlayed,
                        sites,
                        lastKnownOpening,
                    }}
                />
            </div>
        );
    }
};

export { Opening };

const Eval = ({ score }) => (
    <span
        className="white"
        style={{
            marginLeft: '1rem',
            fontSize: 'smaller',
        }}
    >
        eval: {score}
    </span>
);

const OpeningName = ({ eco, src, name, score }) => {
    return (
        <span
            className="font-cinzel"
            style={{
                fontSize: 'larger',
            }}
        >
            Opening:&nbsp;&nbsp;
            <span
                style={{
                    fontWeight: 'bolder',
                    display: 'inline',
                    color: 'aquamarine',
                    fontFamily: 'sans',
                }}
            >
                {eco}&nbsp;
                {src === 'interpolated' ? (
                    <i>
                        {name} <Eval {...{score}}></Eval>
                    </i>
                ) : (
                    (
                        <span>
                            {name}
                            <Eval {...{score}}></Eval>
                        </span>
                    ) || 'Unknown'
                )}
            </span>
        </span>
    );
};
