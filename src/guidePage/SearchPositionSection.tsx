export const SearchPositionSection = () => (
  <>
    <h3 id="search-position">Search by Position</h3>
    <p>
      Search openings by entering moves on the board, or by pasting FEN or PGN
      text in the separate Position (FEN) and Move Sequence input fields. If an
      opening is found in the database, information will be displayed on the
      right.
    </p>
    <p>
      <b>Position-only FEN:</b> You can paste just the board position part of a
      FEN string (without turn, castling, or en passant info). Fenster will look
      it up in the opening book and load the matching opening automatically.
    </p>
    <p>
      <b>Nearest Opening:</b> When you enter moves that don't match any known
      opening exactly, Fenster will search backward through your move history to
      find the nearest opening in the database. A yellow banner will indicate
      how many moves back the nearest match was found (e.g., "Nearest known
      opening is 2 moves back").
    </p>
  </>
);
