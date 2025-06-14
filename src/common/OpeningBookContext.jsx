import { createContext, useContext, useState, useEffect } from 'react';
import { openingBook } from '../datasource/getLatestEcoJson'; 

const OpeningBookContext = createContext();

const OpeningBookProvider = ({ children }) => {
  const [book, setBook] = useState(null);

  useEffect(() => {
    // If openingBook is async, use async/await
    const loadBook = async () => {
      const data = await openingBook();
      setBook(data);
    };
    loadBook();
  }, []);

  return (
    <OpeningBookContext.Provider value={{ openingBook: book }}>
      {children}
    </OpeningBookContext.Provider>
  );
};

export {OpeningBookContext, OpeningBookProvider}
