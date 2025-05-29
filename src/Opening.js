import { SelectedSitesContext } from "./common/SelectedSitesContext.js";
import { OpeningTabs } from "./OpeningTabs.js";
import { useContext, useState } from "react";
import { NO_ENTRY_FOUND } from "./common/consts.js";

const Opening = ({ boardState, setBoardState, handleMovePlayed, data }) => {
    const sites = useContext(SelectedSitesContext);
    const [lastKnownOpening, setLastKnownOpening = useState("")

    if (data) {
        if (data.getOpeningForFenFull === null) {
            return <div className="double-column left">{lastKnownOpening}</div>;
        }
        let {
            getOpeningForFenFull: {
                eco,
                name,
                moves: currentMoves,
                next: variations,
                from, src,
            },
        } = data;

        setLastKnownOpening(name)

        return (
            <div className="double-column left">
                <span
                    className="font-cinzel"
                    style={{
                        fontSize: "larger",
                    }}
                >
                    Opening:&nbsp;&nbsp;
                    <span
                        style={{
                            fontWeight: "bolder",
                            display: "inline",
                            color: "aquamarine",
                            fontFamily: "sans",
                        }}
                    >
                        {eco}&nbsp;{src==="interpolated"?(<i>{name}</i>):name}
                    </span>
                </span>

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
                    }}
                />
            </div>
        );
    } else
        return (
            <div className="double-column">
                <OpeningTabs
                    {...{
                        boardState,
                        setBoardState,
                        handleMovePlayed,
                        sites,
                    }}
                />
            </div>
        );
};

export {Opening}