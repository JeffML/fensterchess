There are multiple web sites that have master chess games to download.

## Data Sources

1. **pgnmentor.com** - https://www.pgnmentor.com/files.html

   - Focus on: 'Players' section (~200 master files)
   - Format: ZIP files containing PGN
   - Organization: By player name

2. **Lumbras Gigabase** - https://lumbrasgigabase.com/en/download-in-pgn-format-en/
   - Format: PGN downloads
   - Note: Trickier to process (structure TBD)

I would like to use these sites as a rudimentary database of games.
The download files are in zip format (or PGN format)

I want to be a good netizen, however, so the number of requests should be throttled.

## Game Filtering Criteria

**Import only games that meet ALL criteria:**

1. **Standard games only** - No chess variants
2. **No FEN field** - Must start from standard starting position
3. **Both players rated >2400** - Master-level games only
4. **Strip annotations** - Remove comments, variations, and annotations from moves

## Index Architecture

### Blob Organization

```
master-games/
  indexes/
    master-index.json           (~4MB: Metadata + pointers)

    # Game data chunks (stay under 100MB blob limit)
    games-chunk-0.json          (~85MB: Games 0-199,999)
    games-chunk-1.json          (~85MB: Games 200,000-399,999)
    games-chunk-2.json          (~85MB: Games 400,000-599,999)
    games-chunk-3.json          (~85MB: Games 600,000-799,999)

    # User-facing search indexes
    opening-by-fen.json         (~15MB: FEN → game indices)
    opening-by-name.json        (~10MB: Opening name → game indices)
    opening-by-eco.json         (~8MB: ECO code → game indices)
    player-index.json           (~25MB: Player name → game indices)
    event-index.json            (~20MB: Event/tournament → game indices)
    date-index.json             (~5MB: Year/month → game indices)

    # Maintenance indexes (used during import/update only)
    deduplication.json          (~50MB: Hash → game index)
    source-tracking.json        (~1MB: File metadata, Last-Modified, ETags)

  games/
    # Actual PGN content (chunked to stay under 100MB)
    chunk-0.pgn                 (~100MB: Game PGN text)
    chunk-1.pgn                 (~100MB)
    chunk-2.pgn                 (~100MB)
    ...
```

### Search Index Details

**1. Opening by FEN** (`opening-by-fen.json`)

- Look up all games reaching a specific position
- Use case: "Show me master games from this position"
- ~10,000 unique positions × 1.5KB = ~15MB

**2. Opening by Name** (`opening-by-name.json`)

- Text search with autocomplete
- Normalized names for fuzzy matching
- Search terms map: "najdorf" → ["Sicilian Defense, Najdorf", ...]
- ~10MB

**3. Opening by ECO Code** (`opening-by-eco.json`)

- Filter by ECO categories (A-E) or specific codes (B90, etc.)
- Category groupings for browsing
- ~8MB

**4. Player Index** (`player-index.json`)

- Search by player name (last name search supported)
- Separate indices for white/black games
- Most-played openings per player
- Peak rating from dataset
- ~25MB

**5. Event Index** (`event-index.json`)

- Filter by tournament/championship
- Categorized: World Championship, Candidates, Olympiad, etc.
- Years available per event
- Top players per event
- ~20MB

**6. Date Index** (`date-index.json`)

- Filter by year or decade
- Statistics: earliest/latest/peak year
- ~5MB

### Combined Search Capability

Multiple indexes can be intersected for powerful queries:

- "Carlsen's Najdorf games from 2020-2025"
- "All Sicilian Defense games from World Championships"
- "Games reaching this position by 2700+ players"

### Storage Totals

| Component      | Size       | Notes                      |
| -------------- | ---------- | -------------------------- |
| Search indexes | ~480MB     | User-facing                |
| Game chunks    | ~340MB     | Metadata only              |
| PGN content    | ~1.6GB     | Actual games               |
| **Total**      | **~2.4GB** | Well within 100GB limit ✅ |

### Update Strategy

**Source Tracking** - Track last visit and file metadata:

- Use HEAD requests to detect changes (Last-Modified, ETag, Content-Length)
- Fallback for sites without HEAD support: 30-day periodic re-check
- Incremental updates: Only re-download modified files

**Deduplication** - SHA-256 hash of normalized game:

- Hash = `white|black|date|moves` (normalized, annotations stripped)
- Check hash before importing to avoid duplicates
- Track first occurrence in deduplication index

## Processing Strategy

- **Multiple unified indexes** based on game content (opening, player, event, date)
- Each source contributes to same unified collection
- No need to separate by source in user-facing data

## Implementation Details

The files are organized by chess master name (pgnmentor) or time period (Lumbras). What I would like to do is to:

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
