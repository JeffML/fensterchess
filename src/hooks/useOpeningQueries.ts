import { useQuery } from "@tanstack/react-query";
import { getFromTosForFen, getScoresForFens } from "../datasource/findOpening";
import type { FEN, FromTosResponse } from "../types";

/**
 * Custom hook to fetch from/to positions for a given FEN
 */
export function useFromTosForFen(fen: FEN | "start", enabled: boolean = true) {
  return useQuery({
    queryKey: ["fromTosForFen", fen],
    queryFn: async () => getFromTosForFen(fen as FEN),
    enabled:
      enabled &&
      fen != null &&
      fen !== "start",
  });
}

/**
 * Custom hook to fetch scores for a FEN and its variations
 */
export function useScoresForFens(
  fen: FEN | "start",
  fromTosForFen: FromTosResponse | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["scoresForFens", fen],
    queryFn: async () =>
      getScoresForFens({
        fen: fen as FEN,
        next: fromTosForFen?.next || [],
        from: fromTosForFen?.from || [],
      }),
    enabled: enabled && fromTosForFen != null,
  });
}
