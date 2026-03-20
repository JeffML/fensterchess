import { useQuery } from "@tanstack/react-query";
import { HeatMap2D } from "./HeatMap2D";
import {
  getMostActiveSquaresByEco,
  getMostActiveSquaresByEcoDetailed,
} from "../datasource/getMostActiveSquaresByEco";

interface HeatMapsProps {
  dests: Record<string, number>;
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

const HeatMaps = ({ dests }: HeatMapsProps) => {
  return (
    <div className="double-column left" style={{ marginTop: "1em" }}>
      <HeatMap2D {...{ dests }} />
    </div>
  );
};

const MostActiveSquaresByEco = ({ cat, code }: MostActiveSquaresByEcoProps) => {
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
    return <HeatMaps {...{ dests: data }} />;
  }
  return null;
};

const MostActiveByPiece = ({
  cat,
  code,
  colors,
  piece,
}: MostActiveByPieceProps) => {
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

    return <HeatMaps {...{ dests }} />;
  }

  return null;
};

export { MostActiveSquaresByEco, MostActiveByPiece };
