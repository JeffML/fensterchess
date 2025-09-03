import { createContext, useState, useEffect } from 'react';
import { openingBook } from '../datasource/getLatestEcoJson'; 
import { getPositionBook } from '../datasource/positionBook';

const OpeningBookContext = createContext();

const OpeningBookProvider = ({ children }) => {
  const [book, setBook] = useState(null);
  const [posBook, setPosBook] = useState(null)
  useEffect(() => {
    // If openingBook is async, use async/await
    const loadBook = async () => {
      const data = await openingBook();
      setBook(data);
      setPosBook(getPositionBook(data))
    };
    loadBook();
  }, []);

  return (
    <OpeningBookContext.Provider value={{ openingBook: book, positionBook: posBook }}>
      {children}
    </OpeningBookContext.Provider>
  );
};

export {OpeningBookContext, OpeningBookProvider}
