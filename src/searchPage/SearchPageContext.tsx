import { createContext, useContext, MutableRefObject } from "react";
import { ChessPGN } from "@chess-pgn/chess-pgn";
import { BoardState } from "../types";

interface SearchPageContextType {
  chess: MutableRefObject<ChessPGN>;
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
}

export const SearchPageContext = createContext<
  SearchPageContextType | undefined
>(undefined);

export const useSearchPage = () => {
  const context = useContext(SearchPageContext);
  if (!context) {
    throw new Error("useSearchPage must be used within SearchPageProvider");
  }
  return context;
};
