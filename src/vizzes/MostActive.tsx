import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HeatMap3D } from "./HeatMap3D.jsx";
import { HeatMap2D } from "./HeatMap2D";
import {
  getMostActiveSquaresByEco,
  getMostActiveSquaresByEcoDetailed,
} from "../datasource/getMostActiveSquaresByEco";

interface HeatMapTypeProps {
  type?: string;
  setType: (type: string) => void;
}

interface HeatMapsProps {
  dests: Record<string, number>;
  type?: string;
  setType: (type: string) => void;
}

interface MostActiveSquaresByEcoProps {
  cat?: string;
  code?: string;
}

interface MostActiveByPieceProps {
  cat?: string;
  code?: string;
  colors: string[];
  piece: string;
}

interface DetailedSquareData {
  pieces: string[];
  isWhite: boolean;
  count: number;
}

const HeatMapType = ({ type, setType }: HeatMapTypeProps) => {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "auto auto auto auto",
    gridColumnGap: "3em",
  };

  return (
    <div className="row" style={gridStyle} id="heatmaptype">
      <span style={{ fontWeight: "bold", color: "mediumturquoise" }}>
        Select a style:
      </span>
      <label>
        <input
          type="radio"
          name="type"
          defaultChecked={type === "2D"}
          onClick={() => setType("2D")}
        />{" "}
        2D
      </label>
      <br />
      <label>
        <input
          type="radio"
          name="type"
          defaultChecked={type === "3D"}
          onClick={() => setType("3D")}
        />
        3D
        {type === "3D" && (
          <span style={{ color: "lightgreen", marginLeft: "2em" }}>
            (mouse draggable)
          </span>
        )}
      </label>
    </div>
  );
};

const HeatMaps = ({ dests, type, setType }: HeatMapsProps) => {
  return (
    <div className="double-column left" style={{ marginTop: "1em" }}>
      <HeatMapType {...{ type, setType }} />
      <br />
      {type === "3D" && <HeatMap3D {...{ dests }} />}
      {type === "2D" && <HeatMap2D {...{ dests }} />}
    </div>
  );
};

const MostActiveSquaresByEco = ({ cat, code }: MostActiveSquaresByEcoProps) => {
  const [type, setType] = useState<string | undefined>();

  let processedCode = code;
  if (processedCode === "all") processedCode = undefined;
  else if (processedCode) processedCode = processedCode.substr(1, 2);

  const { isError, isPending, error, data } = useQuery<Record<string, number>>({
    queryFn: async () =>
      getMostActiveSquaresByEco((cat ?? "") + (processedCode ?? "")),
    queryKey: [
      "getMostActiveSquaresByEco",
      (cat ?? "") + (processedCode ?? ""),
    ],
    enabled: processedCode != null,
  });

  if (processedCode == null) return null;

  if (isError) console.error(error?.toString());
  if (isPending) return <div className="double-column left">Loading...</div>;
  if (data) {
    return <HeatMaps {...{ dests: data, type, setType }} />;
  }
  return null;
};

const MostActiveByPiece = ({
  cat,
  code,
  colors,
  piece,
}: MostActiveByPieceProps) => {
  const [type, setType] = useState<string | undefined>();

  let processedCode = code;
  if (processedCode === "all") processedCode = undefined;
  else if (processedCode) processedCode = processedCode.substr(1, 2);

  const { isError, isPending, error, data } = useQuery<
    Record<string, DetailedSquareData>
  >({
    queryKey: ["mostActiveDetailed", (cat ?? "") + (processedCode ?? "")],
    queryFn: async () =>
      getMostActiveSquaresByEcoDetailed((cat ?? "") + (processedCode ?? "")),
    enabled: processedCode != null,
  });

  if (processedCode == null) return null;

  if (isError) console.error(error?.toString());
  if (isPending) return <div className="double-column left">Loading...</div>;

  if (data) {
    const dests: Record<string, number> = {};
    // reduce according to colors and piece selected
    for (const dest in data) {
      const detail = data[dest];
      if (!detail.pieces.includes(piece)) continue;

      if (colors.includes("White") && detail.isWhite) {
        dests[dest] ??= 0;
        dests[dest] += detail.count;
      }

      if (colors.includes("Black") && !detail.isWhite) {
        dests[dest] ??= 0;
        dests[dest] += detail.count;
      }
    }

    return <HeatMaps {...{ dests, type, setType }} />;
  }

  return null;
};

export { MostActiveSquaresByEco, MostActiveByPiece };
