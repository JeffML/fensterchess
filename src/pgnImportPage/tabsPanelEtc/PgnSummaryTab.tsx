import { Openings } from "./summaryTabContent/Openings";
import { Players } from "./summaryTabContent/Players";
import type { PgnSummary } from "../PgnTabsPanelContainer";

export const blueBoldStyle = { color: "LightSkyBlue" };

interface PgnSummaryTabProps {
  pgnSumm: PgnSummary;
  setFlash: (value: boolean) => void;
  filter: string[];
  setFilter: React.Dispatch<React.SetStateAction<string[]>>;
}

export const PgnSummaryTab = ({
  pgnSumm,
  setFlash,
  filter,
  setFilter,
}: PgnSummaryTabProps) => {
  const { count, high, low, openings, event } = pgnSumm;

  return (
    <>
      <div className="row">
        <div className="column left white">
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
            <Openings {...{ openings, setFlash, filter, setFilter }} />
          </div>
        </div>
        <div className="column left">
          <Players {...{ pgnSumm }} />
        </div>
      </div>
    </>
  );
};
