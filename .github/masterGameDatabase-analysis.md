# Master Game Database - Implementation Analysis

**Date**: December 22, 2025  
**Status**: Planning Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Scale Assessment](#scale-assessment)
3. [Recommended Architecture](#recommended-architecture)
4. [Implementation Components](#implementation-components)
5. [Storage Analysis](#storage-analysis)
6. [Implementation Phases](#implementation-phases)
7. [Open Questions](#open-questions)
8. [Timeline & Estimates](#timeline--estimates)

---

## Executive Summary

This document provides comprehensive analysis of the master game database feature proposed in [masterGameDatabase.md](./masterGameDatabase.md). The feature enables Fenster users to browse and import games from pgnmentor.com without replicating the entire database.

### Key Findings

- **Scale**: ~800-1,000 files containing 800K-1.5M games total
- **Recommended Initial Scope**: ~200 master player files
- **Storage Strategy**: Hybrid sparse index (320MB) + on-demand caching
- **Indexing Time**: ~33 minutes for 200 masters with 10-second throttle
- **Total Storage**: ~370-520MB (well within Netlify limits)

### Architecture Overview

**Two-tier approach**:

1. **Sparse Index (Always Available)**: Metadata for all games (~400 bytes/game)
2. **On-Demand Full Games**: Fetch and cache complete PGN files when requested

This balances storage efficiency, retrieval speed, and respectful access to pgnmentor.com.

---

## Scale Assessment

### Website Structure (pgnmentor.com)

**Analysis performed**: December 22, 2025  
**Source**: https://www.pgnmentor.com/files.html

#### Master Player Files (~200 files)

| Category    | Count | Notable Examples                   | Last Updated |
| ----------- | ----- | ---------------------------------- | ------------ |
| Players A-L | ~100  | Carlsen (6,615), Anand (5,518)     | July 2025    |
| Players M-Z | ~100  | Nakamura (8,727), Kasparov (4,523) | July 2025    |

**URL Pattern**: `https://www.pgnmentor.com/players/[Name].zip`

**Sample Player Counts**:

- Nakamura: 8,727 games (largest)
- Carlsen: 6,615 games
- Anand: 5,518 games
- Kasparov: 4,523 games
- Average: ~4,000 games per master

#### Opening Files (~200 files)

Categories:

- Modern Queen Pawn
- Classical Queen Pawn
- Modern King Pawn
- Classical King Pawn
- Flank and Unorthodox

**Last Updated**: January 2025

#### Event/Tournament Files (~400 files)

- Tournaments (1976-2024, 1851-1975)
- Candidates/Interzonals (1987-2023, 1948-1985)
- World Championships

**Last Updated**: January 2025

### Total Corpus Estimate

- **Files**: ~800-1,000 total
- **Games**: 800,000 to 1,500,000 estimated
- **Master Files Only**: ~200 files, ~800,000 games

---

## Recommended Architecture

### Tier 1: Sparse Index (Always in Memory)

**Purpose**: Enable fast filtering and search without fetching full games

**Storage**: ~320MB JSON for 800,000 games

**Structure**:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-07-15",
  "totalGames": 800000,
  "totalMasters": 200,

  "masters": {
    "Carlsen.pgn": {
      "totalGames": 6615,
      "lastUpdated": "2025-07-01",
      "url": "https://www.pgnmentor.com/players/Carlsen.zip",
      "games": [
        {
          "idx": 0,
          "openingFen": "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -",
          "ecoOpening": "Alekhine Defense",
          "eco": "B02",
          "white": "Carlsen, Magnus",
          "whiteElo": 2882,
          "black": "Nepomniachtchi, Ian",
          "blackElo": 2795,
          "result": "1-0",
          "date": "2021.11.24",
          "event": "World Championship",
          "round": "3"
        }
        // ... 6,614 more games
      ]
    }
    // ... 199 more masters
  },

  "byOpening": {
    "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": [
      { "file": "Carlsen.pgn", "idx": 0 },
      { "file": "Kasparov.pgn", "idx": 142 },
      { "file": "Nakamura.pgn", "idx": 89 }
    ]
    // ... thousands of opening FENs
  }
}
```

**Per-Game Overhead Calculation**:

| Field         | Bytes          | Example                                   |
| ------------- | -------------- | ----------------------------------------- |
| openingFen    | 60             | "rnbqkb1r/pppppppp/5n2..."                |
| ecoOpening    | 30             | "Alekhine Defense"                        |
| eco           | 5              | "B02"                                     |
| Player names  | 50             | "Carlsen, Magnus" + "Nepomniachtchi, Ian" |
| Elos          | 10             | 2882, 2795                                |
| Result        | 5              | "1-0"                                     |
| Date          | 12             | "2021.11.24"                              |
| Event/round   | 80             | "World Championship", "3"                 |
| JSON overhead | 150            | Brackets, quotes, commas                  |
| **Total**     | **~400 bytes** |                                           |

**Total**: 800,000 games × 400 bytes = **320MB**

### Tier 2: On-Demand Full Games (Cached)

**Purpose**: Fetch complete PGN files only when users actually need them

**Process**:

1. User selects master and game from sparse index
2. Check if full PGN file cached in Netlify Blobs (`cache/[filename].pgn`)
3. If not cached:
   - Fetch ZIP from pgnmentor.com
   - Extract PGN
   - Store in blob cache
4. Parse PGN and extract specific game by index
5. Load into Fenster's analysis interface

**Cache Growth**:

| Timeline       | Usage Pattern    | Cache Size |
| -------------- | ---------------- | ---------- |
| Initial        | Empty            | 0 MB       |
| After 1 month  | 100 unique files | ~50 MB     |
| After 6 months | 50% coverage     | ~100 MB    |
| Maximum        | All 200 files    | ~200 MB    |

**Cache Characteristics**:

- Average file size: ~500KB compressed, ~2MB uncompressed
- TTL: 90 days (refresh with updates)
- Storage format: Compressed PGN text

### Why This Architecture Works

1. **Fast Opening-Based Search**: All games pre-indexed by FEN

   - User can search "Show me all Najdorf games by Kasparov" instantly
   - No need to fetch/parse hundreds of files

2. **Low Initial Storage**: 320MB vs 2GB+ for full database

   - Fits comfortably within Netlify Blobs limits
   - Fast to download/update

3. **Respectful to Source**: Only fetch when needed

   - Initial indexing: One-time 33-minute batch
   - Runtime: Only fetch files users actually request
   - No ongoing scraping or heavy load

4. **Scales With Usage**: Cache grows organically

   - Popular masters (Carlsen, Kasparov) cached quickly
   - Obscure masters only cached if requested
   - Total worst-case: 520MB (320MB index + 200MB cache)

5. **Cross-Master Queries**: Opening index enables powerful search
   - "Show me all King's Indian games from 2020+"
   - "Compare how Carlsen and Kasparov handle the Najdorf"
   - Results instant from sparse index

---

## Architecture: Serverless Functions for Runtime Access

### Why Serverless Functions Are Perfect for This Feature

**Answer**: Yes - Serverless functions (Netlify Functions) are the **ideal solution** for runtime access to master game data.

### Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ ONE-TIME: Local Script (Developer Machine/CI)          │
│ • Fetches all master files from pgnmentor.com          │
│ • Builds sparse index (320MB JSON)                     │
│ • Uploads to Netlify Blobs                             │
│ Runtime: 33 minutes (one-time + quarterly updates)     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ STORAGE: Netlify Blobs                                  │
│ • master-games/index.json (320MB sparse index)         │
│ • game-cache/*.pgn (grows with usage, ~50-200MB)       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ RUNTIME: Netlify Function (getMasterGames.ts)          │
│ • Serves sparse index data (fast, cached in memory)    │
│ • Fetches full PGN from pgnmentor.com when needed      │
│ • Caches full PGN in Blobs for future requests         │
│ Response time: < 5 seconds                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ UI: React Component (MasterGamesTab.tsx)               │
│ • Lists masters                                         │
│ • Shows game metadata                                   │
│ • Loads games into Fenster                             │
└─────────────────────────────────────────────────────────┘
```

### Serverless Function Operations

#### Operation 1: List Masters

```
User clicks "Master Games" tab
    ↓
GET /api/getMasterGames?action=listMasters
    ↓
Function: Load index from Blobs (or memory cache)
    ↓
Return: [{ name: "Carlsen", totalGames: 6615 }, ...]
    ↓
Response time: 50-100ms
```

#### Operation 2: Show Games for Master

```
User selects "Carlsen" from dropdown
    ↓
GET /api/getMasterGames?action=getGamesForMaster&master=Carlsen
    ↓
Function: Read index, extract Carlsen's game metadata
    ↓
Return: 6,615 games with metadata (no full PGN yet)
    ↓
Response time: 100-200ms
```

#### Operation 3: Load Specific Game

```
User clicks game row (e.g., game #42)
    ↓
GET /api/getMasterGames?action=getGame&master=Carlsen&idx=42
    ↓
Function:
  1. Check if Carlsen.pgn cached in Blobs
  2. If not: Fetch from pgnmentor.com, cache it
  3. Parse PGN to extract game #42
  4. Return full game PGN
    ↓
Response time: <1s (cached) or 3-5s (first fetch)
    ↓
UI: Load game into Fenster's analysis board
```

#### Operation 4: Search by Opening

```
User searches for "Najdorf" games
    ↓
GET /api/getMasterGames?action=getGamesForOpening&fen=rnbq...
    ↓
Function: Query index.byOpening[fen]
    ↓
Return: All Najdorf games across all masters
    ↓
Response time: 100-200ms
```

### Why Serverless Functions Excel Here

#### ✅ Performance Advantages

| Operation           | Time      | Constraint Met?        |
| ------------------- | --------- | ---------------------- |
| List masters        | 50-100ms  | ✅ YES (< 26s timeout) |
| Load game list      | 100-200ms | ✅ YES                 |
| Fetch cached game   | <1s       | ✅ YES                 |
| Fetch uncached game | 3-5s      | ✅ YES                 |
| Opening search      | 100-200ms | ✅ YES                 |

All operations complete in **seconds**, well within Netlify's 26-second timeout.

#### ✅ Scalability Advantages

1. **Automatic Scaling**: Multiple users browse simultaneously without slowdown
2. **No Server Management**: Netlify handles infrastructure
3. **Smart Caching**:
   - Index cached in function memory (warm invocations)
   - Popular masters cached in Blobs (Carlsen, Kasparov)
   - Obscure masters fetched on-demand
4. **Cost Efficient**: Only pay for actual usage, no idle server costs

#### ✅ User Experience Advantages

1. **Fast Initial Load**: Sparse index provides instant browsing
2. **Progressive Enhancement**: Full games loaded only when clicked
3. **Cross-Master Search**: Opening-based queries work instantly
4. **Graceful Degradation**: Cache ensures repeat visits are instant

### Why NOT Serverless for Indexing

| Constraint      | Bulk Indexing | Runtime Access      |
| --------------- | ------------- | ------------------- |
| **Duration**    | 33 minutes    | <5 seconds          |
| **Timeout OK?** | ❌ NO         | ✅ YES              |
| **Frequency**   | Quarterly     | Every user action   |
| **Best Tool**   | Local script  | Serverless function |

**Critical blocker**: 26-second timeout makes 33-minute indexing impossible.

### Deployment Strategy

**Phase 1: One-Time Setup**

```bash
# Run locally on developer machine
cd /home/jlowery2663/fensterchess
npx tsx scripts/indexPgnMentor.ts  # 33 minutes

# Upload to Netlify Blobs
netlify blobs:set master-games index.json ./data/masterGamesIndex.json
```

**Phase 2: Quarterly Updates**

```bash
# Re-run indexing every 3 months
npx tsx scripts/indexPgnMentor.ts
netlify blobs:set master-games index.json ./data/masterGamesIndex.json
```

**Phase 3: Production Access**

- Netlify Function handles all user requests automatically
- No manual intervention needed
- Scales automatically with traffic

### Alternative: CI/CD Automation (Future Enhancement)

Could automate quarterly updates via **GitHub Actions**:

```yaml
# .github/workflows/update-master-games.yml
name: Update Master Games Index
on:
  schedule:
    - cron: "0 0 1 */3 *" # First day of quarter
  workflow_dispatch: # Manual trigger

jobs:
  index:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx tsx scripts/indexPgnMentor.ts
      - name: Upload to Netlify
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        run: |
          npm install -g netlify-cli
          netlify blobs:set master-games index.json ./data/masterGamesIndex.json
```

**Advantages**:

- No manual intervention
- Runs in controlled environment
- Automatic quarterly updates
- Full logs and error tracking
- Can set 60-minute timeout (more than enough)

**When to implement**: After Phase 1 proves successful.

### Summary: Optimal Architecture

✅ **Serverless functions are perfect for runtime access**

- All user operations complete in seconds
- Automatic scaling and caching
- No infrastructure management

❌ **Serverless functions won't work for bulk indexing**

- 33-minute runtime exceeds timeout limits
- Local script is the right tool

This hybrid approach uses the **right tool for each job**:

- **Heavy lifting** (indexing): Local script with full control
- **User-facing** (queries): Serverless functions for speed and scale

---

```yaml
# .github/workflows/update-master-games.yml
name: Update Master Games Index
on:
  schedule:
    - cron: "0 0 1 */3 *" # First day of quarter
  workflow_dispatch: # Manual trigger

jobs:
  index:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx tsx scripts/indexPgnMentor.ts
      - name: Upload to Netlify
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        run: |
          npm install -g netlify-cli
          netlify blobs:set master-games index.json ./data/masterGamesIndex.json
```

**Advantages**:

- No manual intervention
- Runs in controlled environment
- Automatic quarterly updates
- Full logs and error tracking
- Can set 60-minute timeout (more than enough)

**When to implement**: After Phase 1 proves successful.

---

## Data Sources

### 1. pgnmentor.com

- **URL**: https://www.pgnmentor.com/files.html
- **Focus**: Players section (~200 master files)
- **Format**: ZIP files containing PGN
- **Organization**: By player name
- **File size**: ~500KB compressed, ~2MB uncompressed per master

### 2. Lumbras Gigabase

- **URL**: https://lumbrasgigabase.com/en/download-in-pgn-format-en/
- **Format**: 7z compressed archives
- **Organization**: By time period (OTB games)
- **Total size**: ~1.4GB compressed across 12 time periods
- **Updates**: Monthly updates with recent games
- **Latest**: December 2025 (TWIC 1618-1621, Lichess Broadcast)

---

## Game Filtering and Processing

### Strict Filtering Criteria

**Import ONLY games meeting ALL criteria:**

1. ✅ **Standard chess only** - No variants (Chess960, etc.)
2. ✅ **No FEN field in headers** - Must start from initial position
3. ✅ **Both players rated >2400** - Master-level games only
4. ✅ **Strip all annotations** - Remove comments `{...}`, variations `(...)`, and NAGs `$1`, `!`, `?`, etc.

### Filtering Implementation

```typescript
interface GameHeaders {
  White?: string;
  Black?: string;
  WhiteElo?: string;
  BlackElo?: string;
  FEN?: string;
  Variant?: string;
  // ... other headers
}

function shouldImportGame(game: IChessGame): boolean {
  const header = game.header();

  // Must be standard chess (no variants)
  if (header.Variant && header.Variant !== "Standard") {
    return false;
  }

  // Must start from initial position (no FEN setup)
  if (header.FEN) {
    return false;
  }

  // Both players must be rated >2400
  const whiteElo = header.WhiteElo ? parseInt(header.WhiteElo) : 0;
  const blackElo = header.BlackElo ? parseInt(header.BlackElo) : 0;

  if (whiteElo <= 2400 || blackElo <= 2400) {
    return false;
  }

  return true;
}

function stripAnnotations(pgnContent: string): string {
  // Remove comments: {...}
  let cleaned = pgnContent.replace(/\{[^}]*\}/g, "");

  // Remove variations: (...)
  // More complex - need to handle nested parens
  cleaned = removeNestedParentheses(cleaned);

  // Remove NAGs: $1, $2, etc.
  cleaned = cleaned.replace(/\$\d+/g, "");

  // Remove symbolic annotations: !, !!, ?, ??, !?, ?!
  cleaned = cleaned.replace(/[!?]+/g, "");

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function removeNestedParentheses(text: string): string {
  let result = text;
  let changed = true;

  // Keep removing innermost parentheses until none remain
  while (changed) {
    const newResult = result.replace(/\([^()]*\)/g, "");
    changed = newResult !== result;
    result = newResult;
  }

  return result;
}
```

### Multiple Index Strategy

**Single unified games collection** - No need to separate by source

**CRITICAL: Index must be partitioned to stay under 100MB blob limit**

With 800K games × 400 bytes = 320MB, we need to split into chunks:

```typescript
// Partition strategy: 200K games per index chunk = ~80MB each
interface GameIndexChunk {
  version: string;
  chunkId: number; // 0, 1, 2, 3
  totalChunks: number; // 4
  startIdx: number; // 0, 200000, 400000, 600000
  endIdx: number; // 199999, 399999, 599999, 799999
  games: GameMetadata[];
}

// Master index: Points to chunks
interface MasterIndex {
  version: string;
  totalGames: number;
  totalChunks: number;
  chunkSize: number;
  chunks: {
    id: number;
    blobKey: string; // "indexes/games-chunk-0.json"
    startIdx: number;
    endIdx: number;
    size: number; // bytes
  }[];
  byOpening: {
    [fen: string]: number[]; // Game indices across all chunks
  };
  lastUpdated: string;
}
```

**Blob organization:**

```
master-games/
  indexes/
    master-index.json           (~4MB: Metadata + pointers to other indexes)

    # Game data chunks
    games-chunk-0.json          (~85MB: Games 0-199,999)
    games-chunk-1.json          (~85MB: Games 200,000-399,999)
    games-chunk-2.json          (~85MB: Games 400,000-599,999)
    games-chunk-3.json          (~85MB: Games 600,000-799,999)

    # Search indexes (for Fenster users)
    opening-by-fen.json         (~15MB: FEN → game indices)
    opening-by-name.json        (~10MB: Opening name → game indices)
    opening-by-eco.json         (~8MB: ECO code → game indices)
    player-index.json           (~25MB: Player name → game indices)
    event-index.json            (~20MB: Event/tournament → game indices)
    date-index.json             (~5MB: Year/month → game indices)

    # Maintenance indexes
    deduplication.json          (~50MB: Hash → game index)
    source-tracking.json        (~1MB: File metadata, Last-Modified, ETags)

  games/
    chunk-0.pgn                 (~100MB: Actual PGN games)
    chunk-1.pgn                 (~100MB)
    ...
```

## User-Facing Search Indexes

### 1. Opening by FEN Index

**File**: `opening-by-fen.json` (~15MB)

**Purpose**: Look up all games that reached a specific position

```typescript
interface OpeningByFenIndex {
  version: string;
  byFen: {
    [fen: string]: {
      ecoOpening: string;
      eco: string;
      gameCount: number;
      gameIndices: number[]; // Global game indices
    };
  };
}

// Example usage in Fenster:
// User has position on board, wants to see master games
const currentFen = chess.fen();
const games = await findGamesByFen(currentFen);
// Returns: "Found 1,523 master games reaching this position"
```

**Size calculation**: 10,000 unique opening positions × 1.5KB avg = ~15MB

---

### 2. Opening by Name Index

**File**: `opening-by-name.json` (~10MB)

**Purpose**: Search by opening name (text search, autocomplete)

```typescript
interface OpeningByNameIndex {
  version: string;
  byName: {
    [normalizedName: string]: {
      displayName: string;
      eco: string;
      variations: string[];
      gameCount: number;
      gameIndices: number[];
    };
  };
  searchTerms: {
    [term: string]: string[]; // "sicilian" → ["Sicilian Defense", "Sicilian Najdorf", ...]
  };
}

// Example usage:
// User types "najdorf" in search
const results = await searchOpenings("najdorf");
// Returns: ["Sicilian Defense, Najdorf", "Sicilian Defense, Najdorf, 6.Bg5", ...]
```

**Features**:

- Normalized names (lowercase, no punctuation)
- Search terms map for autocomplete
- Handles variations and sub-variations

---

### 3. Opening by ECO Code Index

**File**: `opening-by-eco.json` (~8MB)

**Purpose**: Filter by ECO code (A00-E99)

```typescript
interface OpeningByEcoIndex {
  version: string;
  byEco: {
    [eco: string]: {
      name: string;
      gameCount: number;
      gameIndices: number[];
    };
  };
  byCategory: {
    A: { codes: string[]; gameCount: number };
    B: { codes: string[]; gameCount: number };
    C: { codes: string[]; gameCount: number };
    D: { codes: string[]; gameCount: number };
    E: { codes: string[]; gameCount: number };
  };
}

// Example usage:
// User selects ECO category "B" (semi-open games)
const bGames = await getGamesByEcoCategory("B");
// Or specific code
const najdorfGames = await getGamesByEco("B90");
```

---

### 4. Player Index

**File**: `player-index.json` (~25MB)

**Purpose**: Find all games by a specific player (white or black)

```typescript
interface PlayerIndex {
  version: string;
  players: {
    [normalizedName: string]: {
      displayName: string;
      peakRating: number;
      gameCount: number;
      asWhite: number[]; // Game indices where player is white
      asBlack: number[]; // Game indices where player is black
      openings: {
        [eco: string]: number; // Most played openings
      };
    };
  };
  searchTerms: {
    [term: string]: string[]; // "carlsen" → ["Carlsen, Magnus"]
  };
}

// Example usage:
// User searches for "Carlsen"
const carlsenGames = await getPlayerGames("Carlsen, Magnus");
// Returns: 4,521 games (2,301 as white, 2,220 as black)

// Or filter by color
const carlsenWhite = await getPlayerGames("Carlsen, Magnus", "white");
```

**Features**:

- Search by last name only
- Separate indices for white/black
- Most-played openings per player
- Peak rating from dataset

---

### 5. Event Index

**File**: `event-index.json` (~20MB)

**Purpose**: Filter by tournament/event

```typescript
interface EventIndex {
  version: string;
  events: {
    [normalizedEvent: string]: {
      displayName: string;
      years: number[]; // Years this event occurred
      gameCount: number;
      gameIndices: number[];
      topPlayers: string[]; // Most frequent participants
    };
  };
  categories: {
    "World Championship": string[];
    Candidates: string[];
    Olympiad: string[];
    "Grand Prix": string[];
    Other: string[];
  };
}

// Example usage:
// User wants World Championship games
const wcGames = await getEventGames("World Championship");

// Or specific year
const wc2021 = await getEventGamesByYear("World Championship", 2021);
```

---

### 6. Date Index

**File**: `date-index.json` (~5MB)

**Purpose**: Filter games by time period

```typescript
interface DateIndex {
  version: string;
  byYear: {
    [year: string]: {
      gameCount: number;
      gameIndices: number[];
    };
  };
  byDecade: {
    [decade: string]: {
      gameCount: number;
      years: string[];
    };
  };
  statistics: {
    earliest: string; // "1900"
    latest: string; // "2025"
    peakYear: string; // Year with most games
  };
}

// Example usage:
// User wants recent games (2020-2025)
const recentGames = await getGamesByDateRange(2020, 2025);

// Or specific year
const games2023 = await getGamesByYear(2023);
```

---

## Combined Search Queries

Fenster can combine multiple indexes for powerful searches:

```typescript
// "Show me Carlsen's Najdorf games from 2020-2025"
async function advancedSearch(criteria: {
  player?: string;
  opening?: string;
  eco?: string;
  event?: string;
  yearFrom?: number;
  yearTo?: number;
}) {
  const results: Set<number> = new Set();

  // Get candidate games from each index
  const playerGames = criteria.player
    ? await getPlayerGames(criteria.player)
    : null;
  const openingGames = criteria.opening
    ? await searchOpenings(criteria.opening)
    : null;
  const dateGames = criteria.yearFrom
    ? await getGamesByDateRange(criteria.yearFrom, criteria.yearTo)
    : null;

  // Intersect sets
  const allSets = [playerGames, openingGames, dateGames].filter(Boolean);
  const intersection = allSets.reduce(
    (acc, set) => new Set([...acc].filter((x) => set.has(x)))
  );

  return Array.from(intersection);
}
```

---

## Index Size Summary

| Index                | Size       | Purpose                   | Update Frequency     |
| -------------------- | ---------- | ------------------------- | -------------------- |
| master-index.json    | 4MB        | Metadata, chunk pointers  | Every update         |
| games-chunk-\*.json  | 85MB × 4   | Game metadata             | Every update         |
| opening-by-fen.json  | 15MB       | Position lookup           | Every update         |
| opening-by-name.json | 10MB       | Text search, autocomplete | Every update         |
| opening-by-eco.json  | 8MB        | ECO code filter           | Every update         |
| player-index.json    | 25MB       | Player search             | Every update         |
| event-index.json     | 20MB       | Tournament filter         | Every update         |
| date-index.json      | 5MB        | Time period filter        | Every update         |
| deduplication.json   | 50MB       | Hash lookup               | During indexing only |
| source-tracking.json | 1MB        | File metadata             | During indexing only |
| **Total indexes**    | **~480MB** |                           |                      |
| **Games PGN**        | ~1.6GB     | Actual game content       | Every update         |
| **Grand Total**      | **~2.1GB** |                           |                      |

All well within 100GB Netlify limit ✅

**Source tracking** - Track last visit per source for incremental updates

```json
{
  "version": "1.0.0",
  "sources": {
    "pgnmentor": {
      "lastVisited": "2025-12-30T10:30:00Z",
      "files": {
        "Carlsen.zip": {
          "url": "https://www.pgnmentor.com/players/Carlsen.zip",
          "lastModified": "2025-07-01T00:00:00Z",
          "etag": "\"5f8a2b3c4d5e6f7g\"",
          "size": 524288,
          "gamesImported": 4521
        },
        "Kasparov.zip": {
          "url": "https://www.pgnmentor.com/players/Kasparov.zip",
          "lastModified": "2025-06-15T00:00:00Z",
          "etag": "\"1a2b3c4d5e6f7g8h\"",
          "size": 456789,
          "gamesImported": 3842
        }
      }
    },
    "lumbras": {
      "lastVisited": "2025-12-30T10:45:00Z",
      "files": {
        "OTB-2020-2024.7z": {
          "url": "https://lumbrasgigabase.com/...",
          "lastModified": "2025-12-02T00:00:00Z",
          "etag": null,
          "size": 232898560,
          "gamesImported": 185432,
          "note": "Lumbras may not support HEAD requests - fallback to version tracking"
        }
      }
    }
  }
}
```

**Update detection strategy:**

```typescript
async function checkForUpdates(
  sourceTracking: SourceTracking
): Promise<FileUpdate[]> {
  const updates: FileUpdate[] = [];

  for (const [source, data] of Object.entries(sourceTracking.sources)) {
    for (const [filename, fileInfo] of Object.entries(data.files)) {
      try {
        // Try HEAD request first
        const response = await fetch(fileInfo.url, { method: "HEAD" });

        if (response.ok) {
          const lastModified = response.headers.get("Last-Modified");
          const etag = response.headers.get("ETag");
          const contentLength = response.headers.get("Content-Length");

          // Check if file changed
          if (
            lastModified !== fileInfo.lastModified ||
            etag !== fileInfo.etag ||
            parseInt(contentLength || "0") !== fileInfo.size
          ) {
            updates.push({
              source,
              filename,
              reason: "File modified",
              oldDate: fileInfo.lastModified,
              newDate: lastModified,
            });
          }
        }
      } catch (error) {
        // Lumbras or other sites may not support HEAD
        console.warn(
          `HEAD request failed for ${filename}, will check on next full scan`
        );

        // Fallback: Check if it's been >30 days since last visit
        const daysSinceVisit = daysBetween(data.lastVisited, new Date());
        if (daysSinceVisit > 30) {
          updates.push({
            source,
            filename,
            reason: "Periodic check (30+ days)",
            note: "HEAD not supported, will download to check",
          });
        }
      }
    }
  }

  return updates;
}
```

**Key points:**

- ✅ Unified games collection (no source separation needed)
- ✅ Track source metadata for incremental updates
- ✅ Use HEAD requests to detect file changes (Last-Modified, ETag, size)
- ✅ Fallback for Lumbras: Periodic 30-day re-check if HEAD not supported
- ✅ Avoid re-downloading unchanged files

---

## Implementation Components

### 1. Bulk Indexing Script (Local/CI Only)

**File**: `scripts/indexPgnMentor.ts`

**Purpose**: One-time offline processing to build sparse index

**Key Features**:

- Processes ~200 master files sequentially
- 10-second throttle between requests (respectful)
- Checkpoint saves every 10 masters (fault tolerance)
- Uses eco.json `lookupByMoves` for opening detection
- Outputs `masterGamesIndex.json`

**Implementation**:

```typescript
import { indexPgnGames } from "@chess-pgn/chess-pgn";
import {
  lookupByMoves,
  getLatestEcoJson,
  getPositionBook,
} from "@chess-openings/eco.json";
import { GameAdapter } from "../src/utils/gameAdapter";
import AdmZip from "adm-zip";

interface GameMetadata {
  idx: number;
  openingFen: string | null;
  ecoOpening: string | null;
  eco: string | null;
  white: string;
  whiteElo: number | null;
  black: string;
  blackElo: number | null;
  result: string;
  date: string;
  event: string;
  round: string;
}

interface MasterFileIndex {
  totalGames: number;
  lastUpdated: string;
  url: string;
  games: GameMetadata[];
}

interface MasterGameIndex {
  version: string;
  lastUpdated: string;
  totalGames: number;
  totalMasters: number;
  masters: Record<string, MasterFileIndex>;
  byOpening: Record<string, Array<{ file: string; idx: number }>>;
}

const MASTER_PLAYERS = [
  "Abdusattorov",
  "Adams",
  "Akobian",
  "Akesson",
  "Alekseenko",
  "Anand",
  "Andreikin",
  "Anton",
  "Aronian",
  "Artemiev",
  // ... (full list of ~200 masters from pgnmentor.com)
  "Yusupov",
  "Zhao",
  "Zherebukh",
  "Zhigalko",
  "Zvjaginsev",
];

const THROTTLE_MS = 10000; // 10 seconds between requests

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchZipAndExtract(url: string): Promise<string> {
  console.log(`  Fetching ${url}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const entries = zip.getEntries();

  // Find .pgn file in ZIP
  const pgnEntry = entries.find((e) => e.entryName.endsWith(".pgn"));
  if (!pgnEntry) {
    throw new Error("No .pgn file found in ZIP");
  }

  return pgnEntry.getData().toString("utf8");
}

async function fetchAndProcessMaster(
  name: string,
  openingBook: any,
  positionBook: any
): Promise<MasterFileIndex> {
  const url = `https://www.pgnmentor.com/players/${name}.zip`;
  console.log(`Processing ${name}...`);

  const pgnContent = await fetchZipAndExtract(url);

  const games: GameMetadata[] = [];
  const cursor = indexPgnGames(pgnContent, {
    workers: 4,
    workerBatchSize: 10,
    onError: (err, idx) => console.error(`  Game ${idx} error: ${err.message}`),
  });

  let idx = 0;
  for await (const game of cursor) {
    try {
      const chess = new GameAdapter(game);
      const opening = lookupByMoves(chess, openingBook, positionBook);

      const header = game.header();
      games.push({
        idx,
        openingFen: opening?.fen || null,
        ecoOpening: opening?.name || null,
        eco: opening?.eco || header.ECO || null,
        white: header.White || "Unknown",
        whiteElo: header.WhiteElo ? parseInt(header.WhiteElo) : null,
        black: header.Black || "Unknown",
        blackElo: header.BlackElo ? parseInt(header.BlackElo) : null,
        result: header.Result || "*",
        date: header.Date || "????.??.??",
        event: header.Event || "Unknown",
        round: header.Round || "?",
      });
      idx++;
    } catch (err) {
      console.error(`  Game ${idx} failed: ${err.message}`);
      idx++;
      continue;
    }
  }

  await cursor.terminate();

  console.log(`  ✓ ${games.length} games indexed`);

  return {
    totalGames: games.length,
    lastUpdated: new Date().toISOString().split("T")[0],
    url,
    games,
  };
}

async function buildIndex(): Promise<MasterGameIndex> {
  console.log("Loading opening books...");
  const [openingBook, positionBook] = await Promise.all([
    getLatestEcoJson({ includeInterpolated: true }),
    getLatestEcoJson({ includeInterpolated: true }).then(getPositionBook),
  ]);

  const index: MasterGameIndex = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
    totalGames: 0,
    totalMasters: 0,
    masters: {},
    byOpening: {},
  };

  console.log(`\nProcessing ${MASTER_PLAYERS.length} masters...\n`);

  // Process with checkpoints
  for (let i = 0; i < MASTER_PLAYERS.length; i++) {
    const name = MASTER_PLAYERS[i];
    const progress = `[${i + 1}/${MASTER_PLAYERS.length}]`;

    try {
      const masterIndex = await fetchAndProcessMaster(
        name,
        openingBook,
        positionBook
      );
      const filename = `${name}.pgn`;
      index.masters[filename] = masterIndex;
      index.totalGames += masterIndex.totalGames;
      index.totalMasters++;

      // Build opening-to-game index
      masterIndex.games.forEach((game) => {
        if (game.openingFen) {
          if (!index.byOpening[game.openingFen]) {
            index.byOpening[game.openingFen] = [];
          }
          index.byOpening[game.openingFen].push({
            file: filename,
            idx: game.idx,
          });
        }
      });

      console.log(`${progress} ✓ ${name}: ${masterIndex.totalGames} games`);

      // Save checkpoint every 10 masters
      if ((i + 1) % 10 === 0) {
        await saveCheckpoint(index, i + 1);
      }

      // Throttle (except on last file)
      if (i < MASTER_PLAYERS.length - 1) {
        console.log(`  Waiting 10 seconds...`);
        await sleep(THROTTLE_MS);
      }
    } catch (error) {
      console.error(`${progress} ✗ ${name} failed: ${error.message}`);
      // Continue with next master
    }
  }

  return index;
}

async function saveCheckpoint(
  index: MasterGameIndex,
  count: number
): Promise<void> {
  const fs = await import("fs/promises");
  const filename = `./data/masterGames-checkpoint-${count}.json`;
  await fs.writeFile(filename, JSON.stringify(index, null, 2));
  console.log(`  💾 Checkpoint saved: ${count} masters processed`);
}

// Main execution
async function main() {
  console.log("=".repeat(60));
  console.log("Master Game Database Indexer");
  console.log("=".repeat(60));

  const startTime = Date.now();

  try {
    const index = await buildIndex();

    // Save final index
    const fs = await import("fs/promises");
    await fs.writeFile(
      "./data/masterGamesIndex.json",
      JSON.stringify(index, null, 2)
    );

    const duration = Math.round((Date.now() - startTime) / 1000 / 60);

    console.log("\n" + "=".repeat(60));
    console.log("✓ Indexing Complete!");
    console.log("=".repeat(60));
    console.log(`Masters processed: ${index.totalMasters}`);
    console.log(`Total games: ${index.totalGames.toLocaleString()}`);
    console.log(
      `Unique openings: ${Object.keys(index.byOpening).length.toLocaleString()}`
    );
    console.log(`Output: ./data/masterGamesIndex.json`);
    console.log(`Duration: ${duration} minutes`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
```

**Running the Script**:

```bash
cd /home/jlowery2663/fensterchess
npm install adm-zip
npx tsx scripts/indexPgnMentor.ts
```

**Expected Output**:

```
============================================================
Master Game Database Indexer
============================================================
Loading opening books...

Processing 200 masters...

[1/200] Processing Abdusattorov...
  Fetching https://www.pgnmentor.com/players/Abdusattorov.zip...
  ✓ 2554 games indexed
[1/200] ✓ Abdusattorov: 2554 games
  Waiting 10 seconds...

[2/200] Processing Adams...
...

[10/200] ✓ Akobian: 1234 games
  💾 Checkpoint saved: 10 masters processed
...

============================================================
✓ Indexing Complete!
============================================================
Masters processed: 200
Total games: 798,432
Unique openings: 8,421
Output: ./data/masterGamesIndex.json
Duration: 33 minutes
============================================================
```

**Estimated Runtime**: 200 files × 10 seconds = 2,000 seconds = **~33 minutes**

### 2. Netlify Function for Runtime Access

**File**: `netlify/functions/getMasterGames.ts`

**Purpose**: Provide API for UI to query sparse index and fetch full games

**Endpoints**:

- `?action=listMasters` - List all available masters
- `?action=getGamesForMaster&master=Carlsen` - Get game metadata for a master
- `?action=getGame&master=Carlsen&idx=42` - Fetch specific game PGN
- `?action=getGamesForOpening&fen=...` - Find games by opening FEN

**Implementation**:

```typescript
import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import AdmZip from "adm-zip";
import { indexPgnGames } from "@chess-pgn/chess-pgn";

interface MasterGameIndex {
  version: string;
  lastUpdated: string;
  totalGames: number;
  totalMasters: number;
  masters: Record<string, any>;
  byOpening: Record<string, Array<{ file: string; idx: number }>>;
}

// Cache index in memory across function invocations
let cachedIndex: MasterGameIndex | null = null;

async function getIndex(context: Context): Promise<MasterGameIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const store = getStore("master-games");
  cachedIndex = await store.get("index.json", { type: "json" });

  if (!cachedIndex) {
    throw new Error("Master game index not found");
  }

  return cachedIndex;
}

async function fetchAndCachePgn(
  url: string,
  filename: string,
  context: Context
): Promise<string> {
  const cache = getStore("game-cache");

  // Check cache first
  let pgnContent = await cache.get(filename, { type: "text" });

  if (pgnContent) {
    console.log(`Cache hit: ${filename}`);
    return pgnContent;
  }

  // Fetch from pgnmentor.com
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const entries = zip.getEntries();

  const pgnEntry = entries.find((e) => e.entryName.endsWith(".pgn"));
  if (!pgnEntry) {
    throw new Error("No .pgn file found in ZIP");
  }

  pgnContent = pgnEntry.getData().toString("utf8");

  // Cache for future use (90-day TTL)
  await cache.set(filename, pgnContent, {
    metadata: {
      cachedAt: new Date().toISOString(),
    },
  });

  return pgnContent;
}

async function extractGameByIndex(
  pgnContent: string,
  idx: number
): Promise<string> {
  const cursor = indexPgnGames(pgnContent, { workers: 2 });

  let currentIdx = 0;
  for await (const game of cursor) {
    if (currentIdx === idx) {
      await cursor.terminate();
      return game.pgn();
    }
    currentIdx++;
  }

  await cursor.terminate();
  throw new Error(`Game ${idx} not found in PGN`);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const index = await getIndex(context);

    switch (action) {
      case "listMasters": {
        const masters = Object.keys(index.masters)
          .map((file) => ({
            name: file.replace(".pgn", ""),
            totalGames: index.masters[file].totalGames,
            lastUpdated: index.masters[file].lastUpdated,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        return Response.json({
          totalMasters: masters.length,
          masters,
        });
      }

      case "getGamesForMaster": {
        const master = url.searchParams.get("master");
        if (!master) {
          return Response.json(
            { error: "master parameter required" },
            { status: 400 }
          );
        }

        const file = `${master}.pgn`;

        if (!index.masters[file]) {
          return Response.json({ error: "Master not found" }, { status: 404 });
        }

        return Response.json({
          master,
          totalGames: index.masters[file].totalGames,
          lastUpdated: index.masters[file].lastUpdated,
          games: index.masters[file].games,
        });
      }

      case "getGame": {
        const master = url.searchParams.get("master");
        const idxParam = url.searchParams.get("idx");

        if (!master || !idxParam) {
          return Response.json(
            {
              error: "master and idx parameters required",
            },
            { status: 400 }
          );
        }

        const idx = parseInt(idxParam);
        const file = `${master}.pgn`;

        if (!index.masters[file]) {
          return Response.json({ error: "Master not found" }, { status: 404 });
        }

        if (idx < 0 || idx >= index.masters[file].totalGames) {
          return Response.json(
            { error: "Invalid game index" },
            { status: 400 }
          );
        }

        // Fetch full PGN (with caching)
        const pgnContent = await fetchAndCachePgn(
          index.masters[file].url,
          file,
          context
        );

        // Extract specific game
        const gamePgn = await extractGameByIndex(pgnContent, idx);

        return Response.json({
          master,
          idx,
          metadata: index.masters[file].games[idx],
          pgn: gamePgn,
        });
      }

      case "getGamesForOpening": {
        const fen = url.searchParams.get("fen");
        if (!fen) {
          return Response.json(
            { error: "fen parameter required" },
            { status: 400 }
          );
        }

        const refs = index.byOpening[fen] || [];

        const games = refs.map((ref) => {
          const masterGames = index.masters[ref.file].games;
          const game = masterGames[ref.idx];
          return {
            master: ref.file.replace(".pgn", ""),
            ...game,
          };
        });

        return Response.json({
          opening: fen,
          totalGames: games.length,
          games: games.slice(0, 100), // Limit to 100 results
        });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
};
```

**Usage Examples**:

```bash
# List all masters
curl https://fensterchess.com/api/getMasterGames?action=listMasters

# Get games for Carlsen
curl https://fensterchess.com/api/getMasterGames?action=getGamesForMaster&master=Carlsen

# Fetch specific game
curl https://fensterchess.com/api/getMasterGames?action=getGame&master=Carlsen&idx=42

# Find games for opening
curl "https://fensterchess.com/api/getMasterGames?action=getGamesForOpening&fen=rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR%20w%20KQkq%20-"
```

### 3. UI Component

**File**: `src/pgnImportPage/MasterGamesTab.tsx`

**Purpose**: React component for browsing and importing master games

**Features**:

- Master selection dropdown
- Game list with filtering/sorting
- Opening-based search
- Click to load game into Fenster

**Implementation**:

```typescript
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Master {
  name: string;
  totalGames: number;
  lastUpdated: string;
}

interface GameMetadata {
  idx: number;
  ecoOpening: string | null;
  eco: string | null;
  white: string;
  whiteElo: number | null;
  black: string;
  blackElo: number | null;
  result: string;
  date: string;
  event: string;
  round: string;
}

export function MasterGamesTab() {
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingGame, setLoadingGame] = useState<number | null>(null);

  // Load list of masters
  const { data: mastersData, isLoading: mastersLoading } = useQuery({
    queryKey: ["mastersList"],
    queryFn: async () => {
      const response = await fetch("/api/getMasterGames?action=listMasters");
      if (!response.ok) throw new Error("Failed to load masters");
      return response.json();
    },
  });

  // Load games for selected master
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ["masterGames", selectedMaster],
    queryFn: async () => {
      const response = await fetch(
        `/api/getMasterGames?action=getGamesForMaster&master=${selectedMaster}`
      );
      if (!response.ok) throw new Error("Failed to load games");
      return response.json();
    },
    enabled: !!selectedMaster,
  });

  // Load specific game
  const loadGame = async (idx: number) => {
    if (!selectedMaster) return;

    setLoadingGame(idx);
    try {
      const response = await fetch(
        `/api/getMasterGames?action=getGame&master=${selectedMaster}&idx=${idx}`
      );

      if (!response.ok) throw new Error("Failed to load game");

      const data = await response.json();

      // Dispatch event to load PGN (existing Fenster logic will handle)
      window.dispatchEvent(
        new CustomEvent("loadPgn", {
          detail: {
            pgn: data.pgn,
            source: `${selectedMaster} - Game ${idx + 1}`,
          },
        })
      );
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Failed to load game. Please try again.");
    } finally {
      setLoadingGame(null);
    }
  };

  // Filter games by search term
  const filteredGames =
    gamesData?.games?.filter((game: GameMetadata) => {
      if (!searchTerm) return true;

      const search = searchTerm.toLowerCase();
      return (
        game.white.toLowerCase().includes(search) ||
        game.black.toLowerCase().includes(search) ||
        game.ecoOpening?.toLowerCase().includes(search) ||
        game.eco?.toLowerCase().includes(search) ||
        game.event.toLowerCase().includes(search)
      );
    }) || [];

  return (
    <div className="master-games-tab" style={{ padding: "20px" }}>
      <h2 style={{ color: "#fff" }}>Master Games Database</h2>
      <p style={{ color: "#ccc", marginBottom: "20px" }}>
        Browse and import games from {mastersData?.totalMasters || 0} chess
        masters
      </p>

      {/* Master Selection */}
      <div className="controls" style={{ marginBottom: "20px" }}>
        <label style={{ color: "#fff", marginRight: "10px" }}>
          Select Master:
        </label>
        <select
          value={selectedMaster || ""}
          onChange={(e) => {
            setSelectedMaster(e.target.value);
            setSearchTerm("");
          }}
          disabled={mastersLoading}
          style={{
            padding: "8px",
            fontSize: "14px",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "#fff",
            border: "1px solid #555",
          }}
        >
          <option value="">
            {mastersLoading ? "Loading..." : "Choose a master..."}
          </option>
          {mastersData?.masters?.map((m: Master) => (
            <option key={m.name} value={m.name}>
              {m.name} ({m.totalGames.toLocaleString()} games)
            </option>
          ))}
        </select>
      </div>

      {/* Search/Filter */}
      {selectedMaster && (
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by player, opening, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              borderRadius: "4px",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #555",
            }}
          />
          <small style={{ color: "#999", marginTop: "5px", display: "block" }}>
            Showing {filteredGames.length} of {gamesData?.totalGames || 0} games
          </small>
        </div>
      )}

      {/* Games List */}
      {gamesLoading && (
        <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>
          Loading games...
        </div>
      )}

      {selectedMaster && !gamesLoading && (
        <div
          className="games-list"
          style={{
            maxHeight: "600px",
            overflowY: "auto",
            border: "1px solid #555",
            borderRadius: "4px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#1a1a1a",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#2a2a2a",
                zIndex: 1,
              }}
            >
              <tr>
                <th style={headerStyle}>Opening</th>
                <th style={headerStyle}>White</th>
                <th style={headerStyle}>Black</th>
                <th style={headerStyle}>Result</th>
                <th style={headerStyle}>Date</th>
                <th style={headerStyle}>Event</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game: GameMetadata) => (
                <tr
                  key={game.idx}
                  onClick={() => loadGame(game.idx)}
                  style={{
                    cursor: loadingGame === game.idx ? "wait" : "pointer",
                    backgroundColor:
                      loadingGame === game.idx ? "#3a3a3a" : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#2a2a2a")
                  }
                  onMouseLeave={(e) => {
                    if (loadingGame !== game.idx) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <td style={cellStyle}>
                    {game.ecoOpening || game.eco || "Unknown"}
                    {game.eco && (
                      <small style={{ color: "#999" }}> ({game.eco})</small>
                    )}
                  </td>
                  <td style={cellStyle}>
                    {game.white}
                    {game.whiteElo && (
                      <small style={{ color: "#999" }}>
                        {" "}
                        ({game.whiteElo})
                      </small>
                    )}
                  </td>
                  <td style={cellStyle}>
                    {game.black}
                    {game.blackElo && (
                      <small style={{ color: "#999" }}>
                        {" "}
                        ({game.blackElo})
                      </small>
                    )}
                  </td>
                  <td style={cellStyle}>{game.result}</td>
                  <td style={cellStyle}>{game.date}</td>
                  <td style={cellStyle}>
                    {game.event}
                    {game.round !== "?" && (
                      <small style={{ color: "#999" }}> (R{game.round})</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  color: "#fff",
  fontWeight: "bold",
  borderBottom: "2px solid #555",
};

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "#ddd",
  borderBottom: "1px solid #333",
};
```

**Integration**:

Add to `src/pgnImportPage/PgnImportPage.tsx`:

```typescript
import { MasterGamesTab } from "./MasterGamesTab";

// Add as new tab alongside TWIC, Sites, etc.
<Tab label="Master Games">
  <MasterGamesTab />
</Tab>;
```

---

## Storage Analysis

### Netlify Professional Plan

**Blobs Storage Limits**:

- **Total storage**: 100GB included
- **Individual blob size**: 100MB max per blob
- **Blob count**: Unlimited
- **Additional storage**: $0.15/GB/month
- **Bandwidth**: 1TB/month included

**Critical constraint**: Individual blobs limited to **100MB each**

**Current Usage**: (Before this feature)

- Opening data: ~50MB
- Other data: ~20MB
- **Total: ~70MB**

### Deduplication Strategy

**Problem**: Games appear in multiple sources (same tournament in different player files, across time periods)

**Solution**: Game hash index for deduplication

```typescript
interface GameHash {
  hash: string; // SHA-256 of normalized game content
  firstSeen: {
    source: string; // "pgnmentor" or "lumbras"
    file: string; // "Carlsen.pgn" or "2020-2024"
    idx: number; // Game index in source
  };
  also_in: Array<{
    // Other occurrences
    source: string;
    file: string;
    idx: number;
  }>;
}

interface DeduplicationIndex {
  version: string;
  totalUniqueGames: number;
  totalDuplicates: number;
  byHash: Record<string, GameHash>;
}
```

**Hashing strategy for duplicates:**

```typescript
function normalizeGameForHash(game: IChessGame): string {
  const header = game.header();

  // Normalize player names (trim, lowercase)
  const white = (header.White || "").trim().toLowerCase();
  const black = (header.Black || "").trim().toLowerCase();

  // Normalize date (handle various formats)
  const date = (header.Date || "").replace(/\./g, "-");

  // Get moves only (already stripped of annotations)
  const moves = game.history().join(" ");

  // Create canonical string
  return `${white}|${black}|${date}|${moves}`;
}

function hashGame(game: IChessGame): string {
  const normalized = normalizeGameForHash(game);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function checkDuplicate(
  hash: string,
  dedupIndex: DeduplicationIndex
): boolean {
  return hash in dedupIndex.byHash;
}
```

**Blob organization for size limits:**

Since individual blobs are limited to 100MB:

```typescript
// DON'T: Store all games in one blob (will exceed 100MB)
// games-all.json - TOO BIG!

// DO: Partition by source and time
netlify blobs:
  master-games/
    indexes/
      pgnmentor-players.json           // <100MB: Player index only
      lumbras-2020-2024.json          // <100MB: Time period index
      deduplication.json               // <50MB: Hash lookup
      combined-openings.json           // <100MB: Cross-source opening index

    games/
      pgnmentor/
        Carlsen.pgn                    // <10MB: Individual player files
        Kasparov.pgn
        ...
      lumbras/
        2020-2024-part1.pgn            // <100MB: Split large periods
        2020-2024-part2.pgn
        2020-2024-part3.pgn
```

**Storage estimation with filtering:**

Assuming >2400 rating filter removes ~60% of games:

| Source                  | Raw Games | Filtered Games | Storage              |
| ----------------------- | --------- | -------------- | -------------------- |
| pgnmentor (200 players) | 800K      | 320K           | ~640MB (partitioned) |
| Lumbras (2020-2024)     | 500K      | 200K           | ~400MB (partitioned) |
| Lumbras (other periods) | 700K      | 280K           | ~560MB (partitioned) |
| **Total games blob**    | **2M**    | **800K**       | **~1.6GB**           |
| **Indexes**             | -         | -              | **~400MB**           |
| **Grand Total**         | **2M**    | **800K**       | **~2GB**             |

### Projected Master Game Database Usage

| Stage                   | Storage    | Cost                    |
| ----------------------- | ---------- | ----------------------- |
| Initial (Index only)    | 320MB      | $0.00 (within included) |
| After 1 month           | ~370MB     | $0.00                   |
| After 6 months          | ~470MB     | $0.00                   |
| Maximum (all cached)    | ~520MB     | $0.00                   |
| **Total with existing** | **~590MB** | **$0.00**               |

**Conclusion**: Well within free tier limits, no additional cost expected

### Alternative: GitHub Releases (If Needed)

If Netlify Blobs become insufficient:

1. Store sparse index as GitHub Release asset (no size limit)
2. Netlify function fetches from GitHub on startup
3. Cache in function memory (warm invocations)
4. Store only full game cache in Netlify Blobs

**Advantages**:

- Unlimited storage for static index
- Version control for index updates
- Free CDN delivery via GitHub

**Implementation**:

```typescript
// In Netlify function
const GITHUB_INDEX_URL =
  "https://github.com/JeffML/fensterchess/releases/download/master-games-v1.0.0/masterGamesIndex.json";

async function getIndex(): Promise<MasterGameIndex> {
  if (cachedIndex) return cachedIndex;

  const response = await fetch(GITHUB_INDEX_URL);
  cachedIndex = await response.json();

  return cachedIndex;
}
```

---

## Implementation Phases

### Phase 1: Proof of Concept (Week 1)

**Goal**: Validate architecture with small sample

**Tasks**:

- [x] Analyze pgnmentor.com structure (COMPLETE)
- [x] Design architecture (COMPLETE)
- [ ] Implement indexing script for 5 sample masters:
  - Carlsen (6,615 games)
  - Kasparov (4,523 games)
  - Fischer (~900 games)
  - Nakamura (8,727 games)
  - Anand (5,518 games)
- [ ] Run sample indexing (~1 minute)
- [ ] Store in `data/masterGames-sample.json`
- [ ] Verify opening detection accuracy
- [ ] Calculate actual per-game overhead

**Success Criteria**:

- Script runs without errors
- Opening detection rate > 90%
- Actual storage matches estimates (±20%)
- Sample index < 10MB

### Phase 2: Full Indexing (Week 2)

**Goal**: Build complete sparse index

**Tasks**:

- [ ] Expand script to all 200 masters
- [ ] Add error handling and retry logic
- [ ] Implement checkpoint system
- [ ] Run full indexing (~33 minutes)
- [ ] Upload to Netlify Blobs
- [ ] Verify index integrity:
  - No duplicate games within masters
  - All FEN strings valid
  - Opening index cross-references valid

**Success Criteria**:

- All 200 masters processed successfully
- Total games > 750,000
- Index size 300-350MB
- Unique openings > 5,000
- Zero data corruption

### Phase 3: Runtime Access (Week 3)

**Goal**: Enable on-demand game fetching

**Tasks**:

- [ ] Implement Netlify function endpoints
- [ ] Add ZIP extraction logic
- [ ] Implement Blobs caching
- [ ] Add authentication (same as existing functions)
- [ ] Test with various masters
- [ ] Monitor cache hit rates
- [ ] Optimize game extraction performance

**Success Criteria**:

- All endpoints working correctly
- First game fetch < 5 seconds
- Cached game fetch < 1 second
- Cache hit rate > 50% after testing
- No rate limit errors from pgnmentor.com

### Phase 4: UI Integration (Week 4)

**Goal**: User-facing interface

**Tasks**:

- [ ] Create MasterGamesTab component
- [ ] Add to Import PGN page
- [ ] Implement search/filter
- [ ] Add opening-based filtering
- [ ] Connect to existing PGN loading logic
- [ ] Add loading states and error handling
- [ ] Style for consistency with existing UI

**Success Criteria**:

- Tab appears in Import PGN page
- Master selection works
- Game list loads and displays correctly
- Click loads game into main interface
- Search/filter works smoothly
- UI consistent with Fenster design

### Phase 5: Polish & Deploy (Week 5)

**Goal**: Production-ready feature

**Tasks**:

- [ ] Handle edge cases:
  - Network timeouts
  - Missing games
  - Corrupted ZIP files
  - Invalid indices
- [ ] Add user feedback:
  - Loading indicators
  - Error messages
  - Success confirmations
- [ ] Performance testing:
  - Large game lists
  - Concurrent requests
  - Memory usage
- [ ] Documentation:
  - User guide
  - Maintenance procedures
- [ ] Deploy to production

**Success Criteria**:

- Zero unhandled errors in testing
- Average game load < 2 seconds
- Memory usage < 100MB sustained
- Feature documented
- Successfully deployed
- User can browse and load games end-to-end

---

## Open Questions for Decision

### 1. Scope: Which files to index?

**Options**:

- **A. Master players only (~200 files)**
  - Pros: Manageable, clear user value, faster indexing
  - Cons: Misses opening-specific and tournament collections
- **B. All files (~800-1000 files)**
  - Pros: Complete database, more search options
  - Cons: 4-5x storage, longer indexing, potential overlap

**Recommendation**: Start with **Option A** (masters only)

- Clear user stories: "Show me Carlsen's games"
- Manageable scale for Phase 1
- Can expand later based on usage

### 2. Update Frequency

**Options**:

- **A. Monthly**
  - Pros: Stay current with new games
  - Cons: 33-minute indexing job monthly
- **B. Quarterly**
  - Pros: Less maintenance
  - Cons: Games 1-3 months out of date
- **C. On-demand**
  - Pros: Only update when needed
  - Cons: Manual trigger required

**Recommendation**: **Option B** (Quarterly)

- Matches pgnmentor.com update frequency
- Low maintenance burden
- Acceptable staleness for historical database

### 3. Opening Filter UI

**Options**:

- **A. ECO code dropdown (A00-E99)**
- **B. Opening name text search**
- **C. Both A and B**
- **D. Current position FEN match**

**Recommendation**: **Option C** (Both)

- Power users can use ECO codes
- Casual users can search "Sicilian"
- Phase 4 can add Option D for advanced users

### 4. Duplicate Games

Many tournaments appear in multiple masters' files.

**Options**:

- **A. Show all instances**
  - Pros: Simple, shows "Carlsen played this game"
  - Cons: Duplicate results in opening search
- **B. Deduplicate with "also in" field**
  - Pros: Cleaner results
  - Cons: Complex logic, which copy to show?

**Recommendation**: **Option A** for Phase 1

- Simpler implementation
- Clear attribution to masters
- Can add deduplication in future if needed

### 5. Storage Location

**Options**:

- **A. Netlify Blobs**
  - Pros: Integrated, fast access, easy deployment
  - Cons: 100GB limit (but we only need ~500MB)
- **B. GitHub Releases**
  - Pros: Unlimited, version control
  - Cons: Cold start slower, extra complexity

**Recommendation**: **Option A** (Netlify Blobs)

- Current scale well within limits
- Simpler architecture
- Can migrate to B if we expand to all 800+ files

---

## Timeline & Estimates

### Development Timeline (Part-Time)

| Phase                     | Duration    | Calendar    |
| ------------------------- | ----------- | ----------- |
| Phase 1: Proof of Concept | 1 week      | Week 1      |
| Phase 2: Full Indexing    | 1 week      | Week 2      |
| Phase 3: Runtime Access   | 1 week      | Week 3      |
| Phase 4: UI Integration   | 1 week      | Week 4      |
| Phase 5: Polish & Deploy  | 1 week      | Week 5      |
| **Total**                 | **5 weeks** | **5 weeks** |

### Effort Breakdown

| Component         | Hours        |
| ----------------- | ------------ |
| Indexing script   | 8            |
| Netlify function  | 6            |
| UI component      | 10           |
| Testing           | 8            |
| Documentation     | 3            |
| Polish/deployment | 5            |
| **Total**         | **40 hours** |

### Runtime Operations

| Operation             | Duration     |
| --------------------- | ------------ |
| Initial full indexing | 33 minutes   |
| Quarterly re-indexing | 33 minutes   |
| First game fetch      | 3-5 seconds  |
| Cached game fetch     | 0.5-1 second |
| Master list load      | < 0.1 second |

---

## Success Metrics

### Technical Metrics

- [ ] **Indexing success rate**: > 95% of files processed without error
- [ ] **Opening detection rate**: > 90% of games have opening identified
- [ ] **Storage efficiency**: < 450 bytes/game average
- [ ] **Cache hit rate**: > 70% after 1 month usage
- [ ] **API latency**:
  - List masters: < 100ms
  - Load game list: < 200ms
  - Fetch game (cached): < 1s
  - Fetch game (uncached): < 5s

### User Experience Metrics

- [ ] **Feature discoverability**: Users find Master Games tab
- [ ] **Game load success**: > 98% of game loads succeed
- [ ] **Search effectiveness**: Users find desired games within 3 actions
- [ ] **Error recovery**: Clear error messages with recovery actions

### Business Metrics

- [ ] **Adoption rate**: % of users who try Master Games feature
- [ ] **Engagement**: Average games loaded per session
- [ ] **Retention**: % of users who return to feature
- [ ] **Cost**: < $1/month Netlify overage (target: $0)

---

## Dependencies

### New npm Packages

```json
{
  "dependencies": {
    "adm-zip": "^0.5.10"
  }
}
```

**Rationale**: Need to extract .pgn files from .zip downloads

### Existing Dependencies (No changes)

- `@chess-pgn/chess-pgn` - Multi-game PGN parsing
- `@chess-openings/eco.json` - Opening detection
- `@tanstack/react-query` - Data fetching
- `@netlify/blobs` - Storage (already available)

### Netlify Features

- ✅ Netlify Blobs (already available on Professional plan)
- ✅ Netlify Functions (already in use)
- ✅ 100GB storage (more than sufficient)

---

## Risk Assessment

### Technical Risks

| Risk                            | Likelihood | Impact | Mitigation                                  |
| ------------------------------- | ---------- | ------ | ------------------------------------------- |
| pgnmentor.com structure changes | Medium     | High   | Cache downloaded files, monitor for changes |
| Storage exceeds Netlify limits  | Low        | Medium | Use GitHub Releases fallback                |
| Opening detection failures      | Medium     | Low    | Store original PGN headers as fallback      |
| ZIP extraction errors           | Low        | Medium | Retry logic, error reporting                |

### Operational Risks

| Risk                             | Likelihood | Impact | Mitigation                                |
| -------------------------------- | ---------- | ------ | ----------------------------------------- |
| Rate limiting from pgnmentor.com | Low        | Medium | 10-second throttle, respectful user agent |
| Index becomes stale              | Medium     | Low    | Quarterly re-indexing schedule            |
| Cache grows too large            | Low        | Medium | Implement TTL, LRU eviction               |

### User Experience Risks

| Risk                            | Likelihood | Impact | Mitigation                                  |
| ------------------------------- | ---------- | ------ | ------------------------------------------- |
| Slow game loading               | Medium     | High   | Optimize extraction, show loading indicator |
| Confusing UI                    | Low        | Medium | User testing, clear labels                  |
| Duplicate games frustrate users | Low        | Low    | Accept for v1, consider dedup later         |

---

## Future Enhancements

### Phase 2 Features (After Initial Launch)

1. **Opening Repertoire Builder**

   - User selects opening
   - System finds all master games in that opening
   - Generate repertoire PGN with variations

2. **Master Comparison**

   - Compare how 2+ masters handle specific openings
   - "How does Carlsen vs Kasparov play the Najdorf?"

3. **Tournament/Event Collections**

   - Expand beyond masters to tournament files
   - "Show me all games from World Championship 2021"

4. **Advanced Search**

   - Search by date range
   - Filter by rating range
   - Filter by result
   - Combine multiple criteria

5. **Statistics Dashboard**
   - Win rates by opening per master
   - Most played openings
   - Historical trends

### Long-Term Ideas

1. **Personal Game Collection**

   - User uploads their own games
   - Indexed alongside master games
   - "Show me openings I play that Carlsen also plays"

2. **AI-Powered Recommendations**

   - "Games similar to your current position"
   - "Masters who play your style"

3. **Social Features**
   - Share game collections
   - Annotate and discuss master games
   - Study groups

---

## Maintenance Procedures

### Quarterly Re-Indexing

```bash
# 1. Check for updates on pgnmentor.com
curl -I https://www.pgnmentor.com/players/Carlsen.zip | grep "Last-Modified"

# 2. Run indexing script
cd /home/jlowery2663/fensterchess
npx tsx scripts/indexPgnMentor.ts

# 3. Upload to Netlify Blobs
netlify blobs:set master-games index.json ./data/masterGamesIndex.json

# 4. Clear game cache (force fresh downloads)
netlify blobs:delete game-cache '*'

# 5. Verify in production
curl https://fensterchess.com/api/getMasterGames?action=listMasters
```

### Monitoring

**Weekly checks**:

- [ ] Netlify Blobs usage (should be < 600MB)
- [ ] Error rate in getMasterGames function (should be < 1%)
- [ ] Average response time (should be < 2s)

**Monthly checks**:

- [ ] Cache hit rate (should be > 70%)
- [ ] Feature usage metrics
- [ ] User feedback/bug reports

### Troubleshooting

**Problem**: Games fail to load

**Diagnosis**:

1. Check Netlify function logs
2. Verify index.json exists in Blobs
3. Test direct URL: `https://www.pgnmentor.com/players/[Master].zip`
4. Check for ZIP format changes

**Solution**:

- If source file changed: Re-run indexing for that master
- If Blobs corrupted: Re-upload index
- If pgnmentor.com down: Show cached games only with warning

---

## Conclusion

The master game database feature is **technically feasible** and **economically viable** with the proposed architecture:

✅ **Scalable**: Handles 800K+ games efficiently  
✅ **Cost-effective**: $0 additional cost within current limits  
✅ **Respectful**: Minimal load on pgnmentor.com  
✅ **User-friendly**: Simple browse and load workflow  
✅ **Maintainable**: Quarterly updates, clear procedures

**Recommended Next Steps**:

1. **Approve scope decisions** (masters only, quarterly updates, etc.)
2. **Implement Phase 1** (5-master proof of concept)
3. **Review results** before proceeding to full indexing
4. **Iterate based on findings**

**Timeline**: 5 weeks to production-ready feature (40 hours effort)

---

**Document Version**: 1.0  
**Last Updated**: December 22, 2025  
**Author**: GitHub Copilot  
**Status**: Awaiting approval to proceed
