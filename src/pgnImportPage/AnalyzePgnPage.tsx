import { useState } from "react";
import "../stylesheets/fileSelector.css";
import "../stylesheets/pgnImport.css";
import { PgnListPanel, PgnMode } from "./PgnListPanel";
import { PgnTabsPanelContainer } from "./PgnTabsPanelContainer";
import { RssFeed } from "./RssFeed";
import { MasterGamesBrowser } from "./MasterGamesBrowser";

/**
 * Fetch PGN urls from a site; then process each pgn file.
 */
const AnalyzePgnPage = () => {
  const [link, setLink] = useState<{ url?: string; pgn?: string }>({});
  const [pgnMode, setPgnMode] = useState<PgnMode>(null);

  // State for master games selection
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [selectedOpenings, setSelectedOpenings] = useState<string[]>([]);

  const handleSelectMaster = (player: string, openings: string[]) => {
    setSelectedMaster(player);
    setSelectedOpenings(openings);
  };

  const isMasterMode = pgnMode === "master";

  // show either the list of links (along with meta data), or a "deep dive" into the pgn data itself
  return (
    <>
      {isMasterMode ? (
        // Master Games mode - full width browser
        <div style={{ marginBottom: "1em" }}>
          <div className="white radio-style" style={{ marginBottom: "1em" }}>
            <input
              type="radio"
              name="pgnMode"
              value="twic"
              checked={false}
              onChange={(e) => setPgnMode(e.target.value as PgnMode)}
            />
            <label>TWIC games</label>
            <input
              type="radio"
              name="pgnMode"
              value="local"
              checked={false}
              onChange={(e) => setPgnMode(e.target.value as PgnMode)}
              style={{ marginLeft: "1em" }}
            />
            <label>Upload PGN</label>
            <input
              type="radio"
              name="pgnMode"
              value="master"
              checked={true}
              onChange={(e) => setPgnMode(e.target.value as PgnMode)}
              style={{ marginLeft: "1em" }}
            />
            <label>Master Games</label>
          </div>
          <MasterGamesBrowser onSelectMaster={handleSelectMaster} />
        </div>
      ) : (
        // TWIC/Upload mode - original grid layout
        <div className="grid-style-top-panel">
          <PgnListPanel {...{ link, setLink, pgnMode, setPgnMode }} />
          <RssFeed />
        </div>
      )}
      <div>
        <PgnTabsPanelContainer
          {...{
            link,
            pgnMode,
            selectedMaster,
            selectedOpenings,
          }}
        />
      </div>
    </>
  );
};

export default AnalyzePgnPage;
