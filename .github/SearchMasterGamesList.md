# MasterGames.tsx

1. When contructing the master games list, we find games were the opening matches the opening FEN or one of its ancestor moves. This works fine.

2. On line 267, we filter out games that don't match the search position. Unfortunately this removes games that meet the first condition, but _transpose_ into the named opening, and therefore the current search moves don't match the initial game moves.

3. we wind up omitting games under condition 2, which can lead to openings listed but with now games displayed under them.

4. I am perplexed how to deal with this.
