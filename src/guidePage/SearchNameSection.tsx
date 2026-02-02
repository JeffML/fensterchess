export const SearchNameSection = () => (
  <>
    <h3 id="search-name">Search by Name</h3>
    <p>
      Click the "By Name" tab to search for openings by typing their name. The
      search is fuzzy and supports:
    </p>
    <ul style={{ marginLeft: "inherit" }}>
      <li>
        Case-insensitive matching (e.g., "sicilian" finds "Sicilian Defense")
      </li>
      <li>
        Multi-word search in any order (e.g., "indian king" finds "King's Indian
        Defense")
      </li>
      <li>Common aliases (e.g., "petrov" also finds "Petroff Defense")</li>
    </ul>
    <p>
      Results appear as you type, showing up to 20 matching openings. Duplicate
      names are filtered to show only the shortest variation. Click any result
      to load that opening on the board.
    </p>
  </>
);
