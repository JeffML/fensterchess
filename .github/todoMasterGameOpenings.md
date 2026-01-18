# Master Games Browser - Implementation Plan

> **This is the authoritative implementation document.**  
> Historical context: See `masterGameDatabase.md` for original requirements.  
> Analysis data (now archived): See `masterGameDatabase-analysis.md` for scale/storage research.

## Overview

Add a "Master Games" browser to the PGN Import page that allows users to browse and explore the master games database organized by opening.

**UI Layout:**

- Add "Master Games" radio button alongside TWIC and Upload PGN options
- **Top Panel Structure (replaces PgnListPanel + RssFeed grid):**
  - **Right side:** Searchable/selectable list of openings from master games database (similar to Visualizations/ECO categories)
  - **Left side:** List of masters who played the selected opening(s), with count of games for each master
- **Bottom Panel (existing tabs):**
  - Hide **Summary** tab when in Master Games mode (not applicable)
  - Show **Games** tab with games from selected master
  - **Opening** tab behavior TBD (likely shows opening details)

**Right Panel - Opening Browser:**

- Openings organized by ECO category (A, B, C, D, E) - collapsible/expandable groups
- Search input at top: Filter by FEN or partial opening name
- Display format: `Opening Name - X games`
- **IMPORTANT: Only show the ~4,008 openings from `opening-by-name.json`** (openings that actually exist in master games, not all 15,836 eco.json openings)
- **Multi-select support:** Users can select multiple openings

**Left Panel - Master List:**

- Initially empty (shows placeholder text)
- After opening(s) selected: Display masters who played ANY of the selected openings
- Format:
  - Player name
  - Game count (# of games master played using any of the selected openings)
- When master is selected: Load their games into the **Games** tab (existing lower panel tab)
- Games shown in **alphabetical order by player name** (White/Black combined)
- Use debouncing if necessary for performance

---

## Existing Serverless Functions

The following functions already exist and can be reused:

| Function                   | Purpose                                 | Status      |
| -------------------------- | --------------------------------------- | ----------- |
| `queryMasterGamesByFen.js` | Query games by FEN position (paginated) | ✅ Complete |
| `getMasterGameMoves.js`    | Fetch full moves for a game by `gameId` | ✅ Complete |

**Index files available in `data/indexes/`:**

- `master-index.json` - Full game metadata
- `opening-by-eco.json` - Openings grouped by ECO code (467 unique ECO codes)
- `opening-by-fen.json` - Games indexed by position FEN (4,573 unique positions)
- `opening-by-name.json` - **KEY INDEX**: eco.json opening name → `{ fen, eco, gameIds }` (4,008 unique openings in master games)
- `player-index.json` - Games indexed by player name (1,602 unique players)
- `chunk-*.json` - Game data chunks (~4,000 games each, 5 chunks total)
- `game-to-players.json` - Fast lookup: gameId → [white, black] (564 KB, for instant player aggregation)
- `ancestor-to-descendants.json` - Ancestor FEN → descendant FENs with master games (4.5 MB, enables "French Defense" → all specific variations)

**Standalone build scripts (no full rebuild needed):**

- `scripts/buildGameToPlayers.ts` - Regenerates game-to-players.json from chunks
- `scripts/buildAncestorIndex.ts` - Regenerates ancestor-to-descendants.json from opening-by-fen.json + fromTo data

---

## Implementation Tasks

### Day 1: Backend / Serverless Functions

**Goal:** Create data layer for querying master games indexes

**Tasks:**

1. **Create `netlify/functions/getMasterGameOpenings.js`**

   - Query `opening-by-name.json` to get all 4,008 openings that exist in master games
   - Group by ECO category letter (A, B, C, D, E) using the `eco` field
   - Return: `{ A: [...], B: [...], C: [...], D: [...], E: [...] }`
   - Each opening: `{ name, fen, eco, gameCount }` (gameCount = gameIds.length)
   - Include auth with `VITE_API_SECRET_TOKEN`

2. **Create `netlify/functions/getMastersByOpenings.js`**

   - Input: Array of opening names (selected openings)
   - Query `opening-by-name.json` to get game indices for each opening
   - Use `game-to-players.json` for fast player aggregation (no chunk loading)
   - Aggregate: Count games per master across all selected openings
   - **Pagination:** `page` (default 0), `pageSize` (default 25)
   - **Sorting:** `sortBy` = "name" | "gameCount", `sortOrder` = "asc" | "desc"
   - Return: `{ masters: [{ playerName, gameCount }], total, page, pageSize }`
   - Include auth with `VITE_API_SECRET_TOKEN`

3. **Create `netlify/functions/getGamesByMasterAndOpening.js`**

   - Input: Player name + array of opening names
   - Query `opening-by-name.json` to get game indices for selected openings
   - Filter to only games where player is White OR Black
   - Load full game metadata from chunks
   - Return: Array of games with full metadata (White, Black, WhiteElo, BlackElo, Event, Result, Date, opening)
   - Include auth with `VITE_API_SECRET_TOKEN`

4. **Create `netlify/functions/getMasterGamesByPosition.js`** (for "enter moves" use case)

   - Input: FEN string
   - Check `opening-by-fen.json` for direct match → get gameIds
   - If no direct match, check `ancestor-to-descendants.json` for descendant FENs → get all gameIds
   - Use `game-to-players.json` for fast player aggregation
   - Return: `{ openings: [{ name, fen, eco, gameCount }], masters: [{ playerName, gameCount }], totalGames }`
   - **Pagination** for masters: `page`, `pageSize` (default 25)
   - **Sorting:** `sortBy` = "name" | "gameCount", `sortOrder` = "asc" | "desc"
   - Include auth with `VITE_API_SECRET_TOKEN`

5. **Client-side search** (no serverless function needed)
   - Search/filter opening list by partial name or ECO code
   - Done in browser since we load all 4,008 openings anyway

**Deliverable:** Four working serverless functions with auth

---

### Day 2: Basic UI Structure & Radio Button

**Goal:** Add Master Games option and create component skeleton

**Tasks:**

1. **Add "Master Games" radio button to PGN Import page**

   - Update `PgnListPanel.tsx` to include new radio option
   - Add state management for Master Games mode (alongside TWIC/Upload PGN)
   - Position alongside existing TWIC and Upload PGN buttons

2. **Create `src/pgnImportPage/MasterGamesBrowser.tsx`**

   - Replace top panel grid when Master Games mode active
   - Two-panel layout:
     - **Right panel:** Opening browser (placeholder for now)
     - **Left panel:** Master list (empty state with placeholder text)
   - Basic styling matching existing page design
   - Responsive grid layout similar to existing PgnListPanel + RssFeed

3. **Update `AnalyzePgnPage.tsx`**

   - Conditionally render `MasterGamesBrowser` vs existing grid when Master Games selected
   - Pass mode state down to components

4. **Hide Summary tab in Master Games mode**
   - Update `PgnTabsPanel.tsx` to conditionally hide Summary tab
   - Add prop to indicate Master Games mode
   - Adjust tab indices when Summary is hidden

**Deliverable:** Can click Master Games, see empty two-panel layout, Summary tab is hidden

---

### Day 3: Right Panel - Opening Browser

**Goal:** Display openings organized by ECO category with search

**Tasks:**

1. **Fetch openings data on component mount**

   - Call `getMasterGameOpenings` serverless function using React Query
   - Store in component state
   - Add loading state and error handling

2. **Build ECO category collapsible groups**

   - One section per category (A, B, C, D, E)
   - Click to expand/collapse
   - Show opening count per category in header (e.g., "Category A - 2,341 games")
   - Use similar styling to Visualizations ECO categories

3. **Display openings within each category**

   - Format: `Opening Name - X games`
   - Make clickable with checkbox or multi-select UI
   - Handle multi-selection state (highlight selected openings)
   - Store selected FENs in state

4. **Add search input at top**
   - Input field for FEN or partial opening name
   - Clear button
   - Filter displayed openings (hide empty categories)
   - Debounce input (300ms)
   - Maintain selection state during filtering

**Deliverable:** Can browse, search, and select multiple openings by ECO category

---

### Day 4: Left Panel - Master List

**Goal:** Show masters when opening(s) are selected

**Tasks:**

1. **Fetch masters when opening selection changes**

   - Call `getMastersByOpenings` with selected FEN array
   - Use debouncing (300ms) to avoid excessive calls during multi-select
   - Store masters in state
   - Add loading state

2. **Display master list**

   - Show placeholder text when no openings selected: "Select one or more openings to view masters"
   - After selection: List of masters with format:
     - `{Player Name} - {X games}`
   - Make clickable to select a master
   - Highlight selected master

3. **Handle empty states and errors**
   - No masters found for selected openings
   - Network errors
   - Loading indicators

**Deliverable:** Selecting opening(s) shows masters who played them in left panel

---

### Day 5: Games Tab Integration

**Goal:** Load master's games into existing Games tab

**Tasks:**

1. **Fetch games when master is selected**

   - Call `getGamesByMaster` with player name + selected FENs
   - Store games in format compatible with existing `GamesTab` component
   - Handle loading state

2. **Pass games to PgnTabsPanelContainer**

   - Update `AnalyzePgnPage.tsx` to pass master games data to lower panel
   - Create data structure compatible with existing `PgnSummary` interface
   - Populate `GameDatabase` with master's games

3. **Update `PgnTabsPanel` for Master Games mode**

   - Accept Master Games mode prop
   - Hide Summary tab (already done in Day 2)
   - Populate Games tab with master's games
   - Handle Opening tab (show opening details for selected game?)

4. **Handle game display in Games tab**
   - Reuse existing `GamesTab` component
   - Ensure game format matches expected structure
   - Sort games by player name (White/Black alphabetically)

**Deliverable:** Clicking master loads their games into Games tab

---

### Day 6: Polish, Testing & Documentation

**Goal:** Production-ready feature

**Tasks:**

1. **Error handling & edge cases**

   - Handle empty master games database gracefully
   - Handle network failures with retry logic
   - Handle malformed data
   - Handle no openings selected (clear master list)
   - Handle no games found for master

2. **Loading states & UX polish**

   - Loading indicators for all async operations (openings, masters, games)
   - Smooth transitions between states
   - Responsive design check (mobile/tablet)
   - Dark theme compatibility
   - Proper spacing and alignment

3. **Performance optimization**

   - Debouncing on search input
   - Debouncing on opening selection changes
   - Lazy loading for large game lists (if needed)
   - Memoization of expensive computations

4. **Testing**

   - Manual testing of all workflows:
     - Select single opening → masters appear → select master → games load
     - Select multiple openings → masters update → select master → games load
     - Search openings → select → masters update
     - Clear selections → reset state
   - Test with actual master games data
   - Test error scenarios (network failures, empty data)
   - Test responsive behavior

5. **Documentation**
   - Update README or RELEASE_NOTES with new feature
   - Add TODO comments for future enhancements:
     - Game click behavior (open game viewer or load to board)
     - Filter games by event, date range
     - Export selected games
     - Statistics view

**Deliverable:** Fully functional Master Games browser ready for production

---

## Data Flow Summary

1. **User selects opening(s)** (right panel) → Store selected FENs in state
2. **Selected FENs trigger fetch** → `getMastersByOpenings(fens)` → Display masters in left panel
3. **User selects master** → `getGamesByMaster(player, fens)` → Load games into Games tab
4. **User clicks game** (future) → Load game to Opening tab or analysis board

---

## Dependencies

- Master games indexes must exist in `data/indexes/`:
  - `master-index.json` - Full game metadata
  - `opening-by-eco.json` - Openings grouped by ECO
  - `opening-by-fen.json` - Games indexed by position FEN
- Netlify dev environment for testing serverless functions locally
- React Query for data fetching and caching
- Existing `PgnTabsPanel` and `GamesTab` components

---

## Data Scale & Netlify Blob Storage Planning

**Current Status (pgnmentor only - 19,211 games):**

- Game chunks (5 files): 19.3 MB (~4 MB per chunk, 4,000 games each)
- Search indexes: 8.7 MB (opening-by-eco, opening-by-fen, player-index, etc.)
- **Total storage: ~28 MB**

**Storage Efficiency:**

- Average size per game: ~1,047 bytes (~1 KB)
- 10,000 games ≈ 10 MB (game data)
- Indexes scale sub-linearly (opening FENs don't grow 1:1 with games)

**Netlify Blob Limits (Pro Tier):**

- Storage: **50 GB** (5,000x more than current usage)
- Bandwidth: **1 TB/month** (more than sufficient)
- Current usage: ~28 MB (0.056% of storage limit)

**Planned Data Sources:**

1. **pgnmentor.com (all masters):** 19,211 games ✅ COMPLETE

   - Carlsen, Kasparov, Nakamura, Anand, Fischer
   - Storage: ~20 MB chunks + 9 MB indexes = **29 MB**

2. **Lichess Elite Database (2400+ rated, titled players):**
   - December 2024: Estimated 3,000-5,000 games (filtered)
   - Per month: ~5 MB game data + ~1 MB index growth
   - **12 months (2024):** ~60 MB game data + ~20 MB indexes = **~80 MB**
   - **24 months (2023-2024):** ~120 MB game data + ~35 MB indexes = **~155 MB**
   - **36 months (2022-2024):** ~180 MB game data + ~50 MB indexes = **~230 MB**

**Recommended Scale (Pro Tier - Aggressive Import):**

- **pgnmentor:** 19,211 games (~30 MB) ✅
- **Lichess Elite:** 24-36 months (2022-2024) = **~60,000-90,000 games (~180-270 MB)**
- **Indexes:** ~50-80 MB (player, opening, event, date indexes)
- **Total: ~260-380 MB** (less than 1% of 50 GB Pro tier limit)
- **Bandwidth:** Minimal (indexes cached by service worker, chunks loaded on-demand)

**Maximum Theoretical Scale (Pro Tier Headroom):**

- **100,000 games:** ~100 MB chunks + 50 MB indexes = **~150 MB** (0.3% of limit)
- **500,000 games:** ~500 MB chunks + 150 MB indexes = **~650 MB** (1.3% of limit)
- **1,000,000 games:** ~1 GB chunks + 250 MB indexes = **~1.25 GB** (2.5% of limit)

**Realistically, you could import ALL available Lichess Elite data and still use <5% of storage.**

**Performance Impact:**

- Chunks are loaded on-demand (only when master is selected)
- Indexes loaded once and cached (service worker + React Query)
- No impact on initial page load
- Opening browser loads in ~150-200ms (opening-by-eco.json = 203 KB)

**Recommended Action Items (Pro Tier):**

- **Phase 1:** Import 24 months of Lichess Elite data (2023-2024) = ~60K games, ~180 MB
- **Phase 2 (optional):** Expand to 36 months (2022-2024) = ~90K games, ~270 MB
- **Phase 3 (optional):** Add more pgnmentor masters or go deeper on Lichess
- Monitor blob storage usage in Netlify dashboard
- Document storage in source-tracking.json

**Pro Tier Benefits:**

- No need to aggressively prune duplicates or filter
- Can include lower-rated titled players (FM, IM)
- Can import full tournament histories
- Plenty of headroom for future growth (using <1% of storage at 90K games)

---

## Component Structure

```
AnalyzePgnPage
├── [Master Games mode]
│   ├── MasterGamesBrowser (top panel)
│   │   ├── OpeningBrowser (right panel)
│   │   │   ├── Search input
│   │   │   └── ECO category groups (collapsible)
│   │   │       └── Opening items (multi-select)
│   │   └── MasterList (left panel)
│   │       └── Master items (clickable)
│   └── PgnTabsPanelContainer (bottom panel)
│       └── PgnTabsPanel
│           ├── [Summary tab - HIDDEN]
│           ├── Games tab (master's games)
│           └── Opening tab (selected game details)
└── [TWIC/Upload mode - existing]
    ├── PgnListPanel + RssFeed grid (top panel)
    └── PgnTabsPanelContainer (bottom panel)
```

---

## Future Enhancements (Post-Implementation)

- Game click behavior: Open game viewer or load moves to analysis board
- Filter games by event, date range, result
- Sort games by date
- Export selected games to PGN file
- Statistics view for selected opening (win/loss/draw percentages)
- Player profile view (all games by a master)
- Compare masters (side-by-side statistics)
- **Sort masters by peak rating:** Integrate FIDE rating list(s) to lookup peak ratings for each master, enabling rating-based sorting

---

## Incremental Update Strategy (For Adding New Games)

**Goal:** Add new games (e.g., monthly Lichess Elite updates) without full rebuild

**Current architecture supports this:**

- `deduplication-index.json` - Hash → gameId prevents duplicates
- `source-tracking.json` - Tracks processed files with checksums
- Chunk files - Append-only, 4,000 games each

**Incremental update workflow:**

1. Download new source files (e.g., lichess-elite-2026-01.pgn)
2. Filter and deduplicate against `deduplication-index.json`
3. Assign gameIds starting from current `totalGames`
4. Append to latest chunk (or create new chunk if full)
5. Update indexes incrementally:
   - Add new gameIds to `opening-by-fen.json`, `player-index.json`, etc.
   - Merge new entries into existing index files
6. Update `master-index.json` with new totals
7. Re-run standalone scripts: `buildGameToPlayers.ts`, `buildAncestorIndex.ts`

**Script needed:** `scripts/addNewGames.ts`

- Input: New PGN file(s)
- Output: Updated chunks + indexes
- Does NOT require re-downloading or reprocessing existing games
