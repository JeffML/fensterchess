# Master Game Database - Serverless Function Specification

**Date**: January 1, 2026  
**Related**: [masterGameDatabase.md](./masterGameDatabase.md), [masterGameDatabase-implementation.md](./masterGameDatabase-implementation.md)

---

## Core Principle

**The master game database exists to support opening research, not as an end in itself.**

Users exploring opening positions in fensterchess need to see master games that reached those positions. FEN-based lookup is the primary feature.

---

## Serverless Functions

### Function 1: `queryMasterGames`

**Purpose**: Search/filter games by position and other criteria for opening research

**HTTP Method**: GET

**Endpoint**: `/.netlify/functions/queryMasterGames`

**Query Parameters**:

- `fen` (string, optional) - Position FEN - **PRIMARY filter for opening research**
- `master` (string, optional) - Player name filter (secondary refinement)
- `openingName` (string, optional) - Opening name substring
- `sortOrder` (string, optional) - "asc" or "desc" (default: "desc" = newest first)

**Filter Logic**: AND combination when multiple filters provided

**Response**:

```typescript
{
  games: GameMetadata[],  // WITHOUT 'moves' field
  count: number
}

// GameMetadata shape (moves field excluded for performance):
interface GameMetadata {
  idx: number,           // Unique game index
  white: string,         // White player name
  black: string,         // Black player name
  whiteElo: number,      // White ELO rating
  blackElo: number,      // Black ELO rating
  result: string,        // "1-0", "0-1", "1/2-1/2", "*"
  date: string,          // "YYYY.MM.DD" format
  event: string,         // Tournament/event name
  site: string,          // Location
  eco?: string,          // ECO code (if available)
  opening?: string,      // Opening name (if available)
  ply: number,           // Number of half-moves
  source: string,        // "pgnmentor"
  sourceFile: string,    // Original file name
  hash: string           // Game hash for deduplication
  // NOTE: 'moves' field excluded from this response
}
```

**Implementation Details**:

- Reads from `data/indexes/` directory:
  - `opening-by-fen.json` - FEN → game indices array
  - `player-index.json` - Player name → game indices array
  - `opening-by-name.json` - Opening name → game indices array
  - `master-index.json` - Complete metadata (without moves)
- Cross-references indexes to find matching game indices
- Strips `moves` field from metadata to reduce payload size
- Sorts by date field (chronological)
- Returns all matching results (no pagination for now)

**Authentication**: Bearer token via `VITE_API_SECRET_TOKEN`

**Error Handling**:

- 400: Missing or invalid parameters
- 401: Authentication failed
- 500: Internal server error

---

### Function 2: `getMasterGame`

**Purpose**: Fetch full game data (including moves) when user clicks to view a specific game

**HTTP Method**: GET

**Endpoint**: `/.netlify/functions/getMasterGame`

**Query Parameters**:

- `idx` (number, required) - Game index from queryMasterGames response

**Response**:

```typescript
{
  game: GameMetadata; // Full object WITH 'moves' field
}

// 'moves' field contains PGN move text:
// Example: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
```

**Implementation Details**:

- Calculate chunk file: `chunk-${Math.floor(idx / 100)}.json`
- Read from `data/indexes/chunk-N.json`
- Find game by matching `idx` field within chunk
- Return complete GameMetadata including moves (PGN text string)
- UI will parse moves using chessPGN library

**Authentication**: Bearer token via `VITE_API_SECRET_TOKEN`

**Error Handling**:

- 400: Missing or invalid idx parameter
- 401: Authentication failed
- 404: Game not found (invalid idx)
- 500: Internal server error

---

## Data Sources

All data read from `data/indexes/` directory (built by `scripts/buildIndexes.ts`):

### Index Files

- `opening-by-fen.json` - FEN string → game index array mapping
- `player-index.json` - Player name → game index array mapping
- `opening-by-name.json` - Opening name → game index array mapping
- `master-index.json` - Game index → metadata (WITHOUT moves)

### Game Data Files

- `chunk-*.json` - Full game data WITH moves (100 games per chunk)

### Example Index Structures

**opening-by-fen.json**:

```json
{
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR": [0, 15, 42, 103],
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR": [1, 18, 50]
}
```

**player-index.json**:

```json
{
  "Carlsen, Magnus": [0, 5, 12, 18, 25],
  "Kasparov, Garry": [3, 8, 15, 22]
}
```

**master-index.json**:

```json
[
  {
    "idx": 0,
    "white": "Carlsen, Magnus",
    "black": "Nakamura, Hikaru",
    "whiteElo": 2882,
    "blackElo": 2789,
    "result": "1-0",
    "date": "2023.05.15",
    "event": "Norway Chess 2023",
    "eco": "C42",
    "opening": "Russian Game: Classical Attack"
    // NO 'moves' field
  }
]
```

**chunk-0.json** (games 0-99):

```json
[
  {
    "idx": 0,
    "white": "Carlsen, Magnus",
    // ... all metadata fields ...
    "moves": "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4..."
  }
]
```

---

## Integration Points

### Current: Import PGN Page

1. User selects "Master Games" radio button (vs TWIC)
2. Filter panel replaces RSS feed panel
3. User filters by master/opening/FEN
4. Results populate existing tabs structure (Games tab, Stats tab, etc.)
5. Same game list/viewer components as TWIC

### Future: SearchPage Integration

- Add "Find master games at this position" button
- Auto-populate FEN filter from current position
- Deep-link to Import PGN page with pre-filled filters

---

## Implementation Plan

### Phase 2A: Basic Query Function (Week 6)

**Goal**: Implement `queryMasterGames` with FEN filter only

- [ ] Create `netlify/functions/queryMasterGames.js`
- [ ] Load `opening-by-fen.json` index
- [ ] Load `master-index.json` metadata
- [ ] Implement FEN lookup logic
- [ ] Strip moves from response
- [ ] Add authentication
- [ ] Test with sample FENs from 5-master dataset

**Success Criteria**:

- Returns correct game metadata for known FEN
- Response excludes moves field
- ~10ms response time for typical query

---

### Phase 2B: Add Master Game Retrieval (Week 6)

**Goal**: Implement `getMasterGame` to fetch full games

- [ ] Create `netlify/functions/getMasterGame.js`
- [ ] Implement chunk file lookup logic
- [ ] Load and parse chunk-N.json files
- [ ] Find game by idx within chunk
- [ ] Return full metadata with moves
- [ ] Add authentication
- [ ] Test retrieval of games from different chunks

**Success Criteria**:

- Correctly retrieves game from any chunk
- Returns PGN moves as string
- ~15ms response time for typical retrieval

---

### Phase 2C: Add Combined Filters (Week 7)

**Goal**: Support master + opening name filters alongside FEN

- [ ] Update `queryMasterGames.js`
- [ ] Load `player-index.json`
- [ ] Load `opening-by-name.json`
- [ ] Implement cross-index filtering (AND logic)
- [ ] Add sorting by date (asc/desc)
- [ ] Test filter combinations
- [ ] Performance testing with ~25K games

**Success Criteria**:

- Correct results for combined filters
- Results properly sorted
- <50ms for complex queries

---

### Phase 2D: Bundle Data Files (Week 7)

**Goal**: Include index files in Netlify deployment

- [ ] Update `netlify.toml` `included_files` section
- [ ] Add `data/indexes/**/*.json` to deployment
- [ ] Verify file sizes within limits
- [ ] Test deployed functions read files correctly
- [ ] Document total deployment size impact

**Success Criteria**:

- All index files deployed to Netlify
- Functions can read files in production
- Total deployment under size limits

---

### Phase 2E: Update Import PGN UI (Week 8)

**Goal**: Add Master Games option to Import PGN page

- [ ] Add radio button: TWIC | Master Games
- [ ] Create filter panel component (replace RSS panel when Master Games selected)
- [ ] Add master name dropdown
- [ ] Add opening name text filter
- [ ] Add opening FEN text filter
- [ ] Wire up `queryMasterGames` API call
- [ ] Update tabs to display results
- [ ] Integrate `getMasterGame` for game viewer

**Success Criteria**:

- User can switch between TWIC and Master Games
- Filters work correctly
- Game list populates
- Individual games load in viewer

---

## Testing Strategy

### Unit Tests

- Index file parsing
- Filter combination logic
- Chunk file lookup calculations
- Authentication flow

### Integration Tests

- End-to-end query flow
- Multiple filter combinations
- Sort order variations
- Invalid parameter handling

### Performance Tests

- Query response time < 50ms
- Game retrieval < 15ms
- Memory usage with 25K games
- Concurrent request handling

---

## Future Enhancements (Not in Scope)

### Pagination

- Add `offset` and `limit` parameters
- Return `total` count separate from `games` array
- Implement when dataset grows beyond 25K games

### Advanced Filters

- Date range filter
- ECO code filter
- Event/tournament filter
- Result filter (wins/draws/losses)
- ELO range filter

### SearchPage Integration

- "Find master games" button on position view
- Auto-populate FEN from current board
- Show game count badge on button
- Deep-link to Import PGN with filters

### Caching

- Cache frequently accessed positions
- Reduce file reads for popular queries
- Consider Netlify Edge Functions for low latency

### Statistics

- Aggregate statistics by position
- Win/draw/loss percentages
- Most common continuations
- Average player ratings

---

## Notes

- **TWIC functionality remains unchanged** - Master Games is an addition, not a replacement
- **Position-first design** - FEN lookup is the primary use case for opening research
- **Lightweight responses** - Metadata excludes moves until specific game requested
- **Simple filtering** - Single-value filters, combinable via AND logic
- **No pagination** - Initially return all results, revisit if needed
