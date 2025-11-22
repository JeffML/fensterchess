import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import StackedBarChart from "../common/StackedBarChart";
import { SelectedSitesContext } from "../contexts/SelectedSitesContext";
import { externalOpeningStats } from "../datasource/externalOpeningStats";
import { dateStringShort } from "../utils/dateStringShort.js";
import { winsAsPercentages } from "../utils/winsAsPercentages.js";

export const OpeningAdditionalWithBarChartGrid = ({ fen }) => {
  const { selectedSites: sites } = useContext(SelectedSitesContext);

  const { isError, error, data, isPending } = useQuery({
    queryKey: [fen, sites, dateStringShort()],
    queryFn: async () => externalOpeningStats(fen, sites),
  });

  if (isError) {
    console.error(error);
    return (
      <span className="white">An error has occurred: {error.message}</span>
    );
  }

  if (isPending) return <span color="yellow">Loading...</span>;

  if (data) {
    return (
      <div style={{ marginTop: "1em" }}>
        {Object.entries(data).map(([site, data]) => {
          const { alsoKnownAs, wins } = data;
          const games = wins.w + wins.d + wins.b;
          return (
            <div
              id="opening-additional"
              key={site}
              style={{ marginBottom: "1em" }}
            >
              <div className="site left">
                <span className="font-cinzel" style={{ fontWeight: "bold" }}>
                  {site}
                </span>
              </div>
              <div className="left">
                <span>
                  {alsoKnownAs}, &nbsp;
                  {games.toLocaleString()} games
                </span>
              </div>
              <div>
                {games ? (
                  <StackedBarChart {...{ pctgs: winsAsPercentages(wins) }} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};
