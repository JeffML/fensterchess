import { createContext, useState, useEffect, ReactNode } from "react";
import { openingBook, getPositionBook } from "@chess-openings/eco.json";
import type { OpeningBookContextValue } from "../types";

const OpeningBookContext = createContext<OpeningBookContextValue | null>(null);

interface OpeningBookProviderProps {
  children: ReactNode;
}

const OpeningBookProvider = ({ children }: OpeningBookProviderProps) => {
  const [book, setBook] =
    useState<OpeningBookContextValue["openingBook"]>(null);
  const [posBook, setPosBook] =
    useState<OpeningBookContextValue["positionBook"]>(null);

  useEffect(() => {
    const loadBook = async () => {
      const data = await openingBook();
      setBook(data as OpeningBookContextValue["openingBook"]);
      setPosBook(
        getPositionBook(data) as OpeningBookContextValue["positionBook"]
      );
    };
    loadBook();
  }, []);

  return (
    <OpeningBookContext.Provider
      value={{ openingBook: book, positionBook: posBook }}
    >
      {children}
    </OpeningBookContext.Provider>
  );
};

export { OpeningBookContext, OpeningBookProvider };
