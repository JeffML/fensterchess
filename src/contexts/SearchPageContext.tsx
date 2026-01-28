import React, { useState, useRef } from "react";
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

// Default board state for provider (customize as needed)
const defaultBoardState: BoardState = {
  fen: "startpos",
  moves: "",
  currentPly: 0,
  openingPlyCount: 0,
};

export const SearchPageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [boardState, setBoardState] = useState<BoardState>(defaultBoardState);
  const chess = useRef(new ChessPGN());
  return (
    <SearchPageContext.Provider value={{ chess, boardState, setBoardState }}>
      {children}
    </SearchPageContext.Provider>
  );
};
