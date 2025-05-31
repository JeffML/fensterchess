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
            },
        } = data;

        return (
            <div className="double-column left">
                <OpeningName {...{ eco, src, name }} />

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
        const { eco, name, src } = lastKnownOpening;
        return (
            <div className="double-column left">
                <OpeningName {...{ eco, name, src }} />
                <OpeningTabs
                    {...{
                        boardState,
                        setBoardState,
                        handleMovePlayed,
                        sites,
                        lastKnownOpening
                    }}
                />
            </div>
        );
    }
};

export { Opening };

const OpeningName = ({ eco, src, name }) => {
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
                {src === 'interpolated' ? <i>{name}</i> : name || 'Unknown'}
            </span>
        </span>
    );
};
