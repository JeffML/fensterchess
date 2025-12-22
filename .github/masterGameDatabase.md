There is a web site that has master chess games to download.
The download files are in zip format
I would like to use this site as a rudimentary database of games.

I want to be a good netizen, however, so the number of requests should be throttled.

The files are organized by chess master name. What I would like to do is to:

1. index the games in each master file
2. while indexing:
   1. find the opening (via eco.json)
   2. record in JSON format:
      1. the opening fen as key
      2. the file name where found
      3. the game index position in the file
      4. the PGN opening, variation, subvariation (if there are any)
      5. white and black player names and ratings
      6. game result
      7. the date and round number
   3. the above JSON data should be stored in a netlify blob
3. we will add an option in Fenster in the Import PGN page similar to the TWIC option
   1. when selected, this option will list the master names available that correspond to the files on the web site
      1. when a file name is selected, the game's index information will be shown in the summary tab
      2. in the games tab, when a game is selected, we parse the file at the index position and show details in the Opening tab

# Important

We should minimize the requests to this web site, but we also don't want to replicate all that data in whole on the Fenster server. You should evaluate if it is possible to stored parsed game data in a blob (perhaps as an addendum to the index data already gathered).

# stages

There are then two stages:

1. bulk gathering of index data to be done 'offline' and in a responsible way
2. in real time, we can pull full game date based on user actions in Fenster

I am will to consider ideas I have not outlined here. As for the above proposal, we need to be mindful of storage limits on our server; alternatives may be suggested.
