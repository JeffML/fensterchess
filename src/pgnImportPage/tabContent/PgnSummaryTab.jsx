import { Openings } from './summaryTabContent/Openings';
import { Players } from './summaryTabContent/Players';

export const blueBoldStyle = { color: 'LightSkyBlue' };

export const PgnSummaryTab = ({ pgnSumm, setFlash, filter, setFilter }) => {
    const { count, high, low, openings, event } = pgnSumm;

    return (
        <>
            <div className="row">
                <div name="details" className="column left white">
                    <div>
                        <span style={blueBoldStyle}>Event:</span> {event}
                    </div>
                    <div>
                        <span style={blueBoldStyle}>Games:</span> {count}
                    </div>
                    <div>
                        <span style={blueBoldStyle}>High Rating:</span> {high}
                    </div>
                    <div>
                        <span style={blueBoldStyle}>Low Rating:</span>
                        {low}
                    </div>
                    <div className="row">
                        <Openings
                            {...{ openings, setFlash, filter, setFilter }} />
                    </div>
                </div>
                <div className="column left">
                    <Players {...{ pgnSumm }} />
                </div>
            </div>
        </>
    );
};
