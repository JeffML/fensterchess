import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import StackedBarChart from "../../../common/StackedBarChart";
import { SelectedSitesContext } from "../../../contexts/SelectedSitesContext";
import { externalOpeningStats } from "../../../datasource/externalOpeningStats";
import { dateStringShort } from "../../../utils/dateStringShort";
import { winsAsPercentages } from "../../../utils/winsAsPercentages";

interface AdditionalDetailsProps {
  fen: string;
}

export const AdditionalDetails = ({ fen }: AdditionalDetailsProps) => {
  const sites = useContext(SelectedSitesContext).selectedSites;

  const { isError, error, data, isPending } = useQuery({
    queryKey: [fen, sites, dateStringShort],
    queryFn: async () => externalOpeningStats(fen, sites),
  });

  if (isError) {
    console.error(error);
    return (
      <span className="white">An error has occurred: {error.message}</span>
    );
  }

  if (isPending)
    return (
      <div id="additionalDetailsLoading" className="additional-details-loading">
        <strong style={{ marginRight: "1em", color: "#FFCE44" }}>
          Loading...
        </strong>
      </div>
    );

  if (data) {
    return (
      <>
        {Object.entries(data).map(([site, siteData]) => {
          const { alsoKnownAs, wins } = siteData as any;
          const games = wins.w + wins.d + wins.b;

          return (
            <div
              id="AdditionalDetails"
              key={site}
              className="additional-details"
            >
              <span>&nbsp;</span>
              <span>&nbsp;</span>
              <strong style={{ marginRight: "1em" }}>{site}:</strong>{" "}
              <span>{alsoKnownAs}</span>
              <div style={{ marginRight: "3em" }}>
                <span
                  style={{
                    marginLeft: "1em",
                    marginRight: "1em",
                  }}
                >
                  games:
                </span>{" "}
                {games ?? 0}
              </div>
              <span>
                {games && (
                  <>
                    {" "}
                    w/d/l: &nbsp;&nbsp;
                    <StackedBarChart
                      {...{
                        pctgs: winsAsPercentages(wins),
                        style: {
                          display: "inline-grid",
                        },
                      }}
                    />{" "}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </>
    );
  }
};
