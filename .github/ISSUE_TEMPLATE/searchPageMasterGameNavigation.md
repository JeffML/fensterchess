For Search page:

- IFF an input FEN (or a FEN generated from an input move sequence) matches opening FENs from master games
  - display master games (done)
- when a master game is chosen
  - load the game moves in move sequence box (done)
  - set the current position to the opening FEN (done)
  - forward/backward buttons should navigate through the game moves (done)

New behavior:

- The list of master game should remain unchanged, except when:
  - either the forward or back button action leads to a new position for which _new_ master games are found with that new opening FEN
    - in this case, update the entire master game list
  - if the user pastes in a new FEN or new move sequence (which generates a new FEN)

## Detailed Clarifications

**Navigation Behavior:**

1. Master games list should stay frozen at the original opening FEN UNLESS the new position (from forward/back) happens to have its own master games
2. Backward navigation will always be within the opening book (named opening positions)
3. Forward navigation may go beyond the opening book (positions without named openings)

**Query Strategy:**

- Query for master games on every forward/back move to check if games exist for that position
- Current master games query behavior (query by FEN, return games where position occurs) remains unchanged

**UI Updates:**

- When new master games are found during navigation: completely replace the list
- Consider flashing the title row to indicate the list has changed
- Clear visual indicator when displaying master games from a different position than originally loaded

**Performance:**

- No specific debouncing required at this time (can be added later if needed)
