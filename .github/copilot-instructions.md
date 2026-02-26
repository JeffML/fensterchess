# Copilot Instructions for Fenster Chess

## Quick Reference

**chessPGN API Patterns:**

- **Single game**: `loadPgn(pgnString)` → `IChessGame` instance (use `.move()`, `.fen()`, etc.)
- **Bulk processing**: `indexPgnGames(pgnString)` → `Cursor<metadata>` (yields `{startOffset, endOffset, headers}`)
- **CRITICAL**: Cursor items are metadata objects, NOT `IChessGame` instances - must call `loadPgn()` separately for full game API
- Access metadata: `game.headers.White` (not `game.header('White')`)

**Netlify Serverless Functions:**

- **ESM syntax required**: Use `import`/`export`, never `require`/`module.exports`
- **File paths**: Use simple relative paths like `'data/file.json'` (see `getFromTosForFen.js` for pattern)
- **NEVER use**: `import.meta.url`, `__dirname`, `path.join()` - causes bundler warnings
- **Auth pattern**: Import from `./utils/auth.js`, check `VITE_API_SECRET_TOKEN`
- **Data files**: Configure in `netlify.toml` under `[functions]` → `included_files`

**Opening Lookup Patterns:**

- **openingBook**: Full FEN → opening data (exact match with turn/castling/en passant)
- **positionBook**: Position-only FEN → full FEN (fallback for transpositions)
- **Pattern**: `findOpening(openingBook, fen, positionBook)` tries exact match first, then position-only
- **FEN structure**: `"position w KQkq - halfmove fullmove"` - position is first field split by space

**Game vs Opening Data:**

- **Opening data** (~12K named variations): Use `@chess-openings/eco.json` package methods
- **Master games** (~45K games): Load from Netlify Blobs via serverless functions
- **Transitions**: Download `fromToPositionIndexed.json` from eco.json GitHub repo (optimized for lookup)
- **Position scores**: Download `scores.json` from eco.json GitHub repo

## Project Overview

This workspace contains two related chess projects:

1. **fensterchess** - React web app for chess opening research **hosted on Netlify**
2. **chessPGN** - TypeScript chess library with enhanced PGN parsing (npm package `@chess-pgn/chess-pgn`)

fensterchess consumes chessPGN as a dependency and fetches chess opening data from the [eco.json](https://github.com/hayatbiralem/eco.json) GitHub repository.

## Deployment

**fensterchess is deployed on Netlify:**

- Production: Automatic deployment from `main` branch
- Preview: Draft deployments for testing (never deploy to production via CLI)
- Serverless Functions: Netlify Functions for API endpoints
- Environment Variables: Set in Netlify dashboard (e.g., `VITE_API_SECRET_TOKEN`)
- Build Command: `npm run build` (TypeScript check + Vite build)
- Service Worker: Auto-generated via vite-plugin-pwa

**Local Development:**

- Use `netlify dev` (not `npm run preview`) to test serverless functions locally
- Netlify CLI automatically injects environment variables from `.env` and Netlify dashboard
- Runs on `localhost:8888` (or similar) with full serverless function support
- `npm run preview` only serves static files - serverless functions won't work (CONNECTION_REFUSED errors)

## Architecture

### fensterchess (React App)

**Multi-page React app** with lazy-loaded pages controlled by mode state in `src/App.jsx`:

- `SearchPageContainer` - Main opening research interface
- `AnalyzePgnPage` - PGN file import and analysis
- `Visualizations` - Opening statistics visualizations
- `AboutPage` - Project information

**Context Providers** manage global state:

- `OpeningBookContext` - Loads and caches eco.json opening data (split across ecoA-E.json + eco_interpolated.json)
- `SelectedSitesContext` - Tracks user's selected chess sites for PGN import

**Data Flow Pattern:**

1. `OpeningBookContext` fetches eco.json files from GitHub on mount (`src/datasource/getLatestEcoJson.js`)
2. Position lookup uses FEN as key; falls back to position-only (ignoring turn/castling) via `positionBook`
3. Serverless functions enrich opening data with move scores and transition statistics

**Netlify Serverless Functions** (`netlify/functions/`):

- `getFromTosForFen.js` - Returns next/previous positions for a FEN (downloads from eco.json GitHub)
- `scoresForFens.js` - Evaluates positions using pre-computed scores (downloads from eco.json GitHub)
- `getPgnLinks.js` / `getRssXml.js` - Fetch PGN data from external chess sites
- `queryMasterGamesByFen.js` - Returns master games matching a FEN (loads from Netlify Blobs)
- `getMasterGameMoves.js` - Returns full moves for a specific game (loads from Netlify Blobs)
- All master game functions load indexes from Netlify Blobs with module-level caching
- All functions use Bearer token authentication via `utils/auth.js` (checks `VITE_API_SECRET_TOKEN`)

**CRITICAL - Serverless Function Format:**

- **MUST use ESM syntax** (`import`/`export`) not CommonJS (`require`/`exports`)
- package.json has `"type": "module"` - all .js files are treated as ESM
- Pattern: `export const handler = async (event) => { ... }`
- Import with extensions: `import { auth } from "./utils/auth.js"` (note .js extension)
- **NEVER use `import.meta.url` or `__dirname`** - Netlify's esbuild bundler defaults to cjs output format and throws warnings
- **Use simple relative paths** for file operations: `fs.readFileSync('data/file.json')` (see existing functions like getFromTosForFen.js)

**React Query Integration:**

- Use `@tanstack/react-query` for server state management
- See `src/searchPage/SearchPageContainer.jsx` for pattern: `useQuery` with `queryKey: ["fromTosForFen", fen]`
- Query keys must include all variables that affect the request

**Chess Integration:**

- Uses `@chess-pgn/chess-pgn` library (see chessPGN section below)
- Instantiate: `const chess = useRef(new ChessPGN())` (use ref to persist across renders)
- Display boards with `kokopu-react` components

**UI Styling Guidelines:**

- **Background**: Main page background is dark gray
- **Text Color**: Always use light colors (white, light gray) or explicitly set dark colors for light backgrounds
- **When adding new content**: Ensure text color contrasts with the dark gray background
- **Example**: Use `color: "#fff"` or `color: "#000"` explicitly rather than relying on default text colors
- **Testing**: Check visibility against dark backgrounds before committing UI changes

**CRITICAL - Game Type Usage:**

- **NEVER import `Game` from `kokopu`** in src/ files - kokopu is only in devDependencies for testing
- Always use `GameAdapter` from `src/utils/gameAdapter.ts` for game objects in application code
- `GameAdapter` wraps `@chess-pgn/chess-pgn` Game objects and provides kokopu-compatible API
- `kokopu-react` Chessboard component is OK to use (only UI dependency in production)
- When iterating games from `indexPgnGames()` cursor, wrap with `new GameAdapter(game)`
- Test files can use kokopu for compatibility verification only

### chessPGN (TypeScript Library)

**Delegation Architecture:**

- `ChessPGN` class - Legacy wrapper for backward compatibility with chess.js
- `Game` class - Core implementation (single source of truth)
- Both implement `IChessGame` interface and produce identical results (verified via parity tests)
- **When modifying chess logic, edit `Game.ts` only** - `ChessPGN` delegates all operations

**Multi-Game PGN Parsing:**

- `indexPgnGames(pgnContent, options)` returns async `Cursor` for iterating large PGN files
- Supports worker threads for parallel parsing (3-5x speedup): `{ workers: 4, workerBatchSize: 10 }`
- Worker implementation in `src/workerParser.js` (not TypeScript)

**PGN Parser:**

- Grammar defined in `src/pgn.peggy` (Peggy parser generator)
- Build parser: `npm run parser` (generates `src/pgn.js`)
- **Never manually edit `src/pgn.js`** - always modify `pgn.peggy` and rebuild

**Type System:**

- All types in `src/types.ts` - import from there, not from implementation files
- Use `Square`, `Color`, `PieceSymbol`, `Piece` types for type safety
- Export `Move` class with rich move metadata (from/to/piece/capture/promotion/flags)

## Development Workflows

### fensterchess Development

```bash
# Start local Netlify dev server (includes serverless functions)
netlify dev  # Runs on localhost:8888

# Alternative: Vite only (no serverless functions)
npm run dev  # Runs on localhost:3000

# Run tests
npm test           # Run once
npm run test:ui    # Interactive UI

# TypeScript type checking
npm run type-check  # Check types without building

# Build for production
npm run build      # Type-check + bundle to dist/
```

**CRITICAL - Deployment Policy:**

- **NEVER run production deployments** (`netlify deploy --prod` or similar)
- Agent can suggest draft/preview deployments (`netlify deploy` without --prod flag)
- Agent should only assist with local development, testing, and building
- Production deployments are exclusively handled by the project maintainer
- Agent can run `npm run build` to verify build succeeds

**TypeScript Migration:**

- In progress: piecemeal conversion from .jsx to .tsx
- Completed: `src/common/`, `src/contexts/`, `App.tsx`, shared types in `src/types.ts`
- Pattern: Convert utilities first, then components
- See `src/TYPES.md` for type usage examples
- `allowJs: true` in tsconfig enables gradual migration

**CRITICAL - TypeScript File Types:**

- **This is a TypeScript project** - All new code files in `src/` MUST be `.ts` or `.tsx`
- **NEVER create `.js` or `.jsx` files** in the `src/` directory
- When editing existing files, always edit the `.tsx`/`.ts` version, not `.jsx`/`.js`
- Test files in `test/` directory can remain `.js`/`.jsx` (acceptable convention)
- If you see import statements referencing `.jsx` in TypeScript files, the actual source files are `.tsx`

**Environment Variables:**

- Set `VITE_API_SECRET_TOKEN` in Netlify dashboard or `.env` for serverless function auth
- Access in code: `import.meta.env.VITE_API_SECRET_TOKEN`

### chessPGN Development

```bash
# Run all checks (required before commit)
npm run check  # Runs: format check, lint, tests, build, API extractor

# Individual commands
npm test              # Run tests
npm run format        # Auto-fix formatting
npm run lint          # ESLint check
npm run build         # Build CJS, ESM, and types
npm run parser        # Regenerate PGN parser from peggy.config.mjs

# API surface tracking
npm run api:check     # Verify no unintended API changes
npm run api:update    # Accept API changes (updates etc/chess-pgn.api.md)
```

**Build Outputs (dist/):**

- `dist/cjs/chessPGN.js` - CommonJS bundle
- `dist/esm/chessPGN.js` - ES Module bundle
- `dist/types/chessPGN.d.ts` - TypeScript declarations

**Critical Pre-Commit:**
Always run `npm run check` before pushing - this is the same check CI uses.

## Testing Conventions

### fensterchess Tests

Located in `test/` directory (not `__tests__/`):

- Use Vitest + React Testing Library
- Mock contexts and fetch calls (see `test/SearchPageContainer.test.jsx`)
- Reset `window.location` when testing URL params: `delete window.location; window.location = { search: '?moves=...' }`
- Wrap components in `QueryClientProvider` for React Query tests

### chessPGN Tests

Located in `__tests__/` directory:

- 527+ tests covering all functionality
- **Parity tests** (`game-chessPgn-parity.test.ts`) ensure `ChessPGN` ≡ `Game` across 469 real games
- When adding Game methods, add corresponding ChessPGN wrapper and parity test
- Use descriptive test names: `test('should reject invalid FEN with wrong piece count', ...)`

## Project-Specific Conventions

### Code Patterns

**FEN Strings:**

- Full FEN includes turn, castling, en passant: `"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"`
- Position-only (first field): `"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"`
- Use `fen.split(' ')[0]` to get position when ignoring game state

**Move Representation:**

- SAN (Standard Algebraic Notation): `"Nf3"`, `"O-O"`, `"e4"`
- Long algebraic: `{ from: "e2", to: "e4", promotion: "q" }`
- `chess.move()` accepts both formats

**Opening Data Structure (eco.json):**

```javascript
{
  "fen-string": {
    name: "Opening Name",
    moves: "1. e4 e5 2. Nf3",
    eco: "C42",  // ECO code
    next: [...],  // Next positions (added by serverless functions)
    from: [...],  // Previous positions
    score: 0.12   // Position evaluation
  }
}
```

### File Organization

**fensterchess Structure:**

- `src/common/` - Shared utilities, constants (`consts.js`, `urlConsts.js`)
- `src/contexts/` - React context providers
- `src/datasource/` - API calls and data fetching logic
- `src/[feature]Page/` - Feature-specific page components
- `netlify/functions/` - Serverless function handlers

**chessPGN Structure:**

- `src/chessPGN.ts` - Legacy API entry point
- `src/Game.ts` - Core chess engine (2133 lines)
- `src/types.ts` - All type definitions and constants
- `src/Cursor.ts` - Multi-game PGN iterator
- `src/pgn.peggy` - PGN parser grammar (source of truth)

### API Guidelines

**chessPGN Public API:**

- Use JSDoc comments for all public methods (see `CONTRIBUTING.md`)
- API surface is tracked by `@microsoft/api-extractor`
- Breaking changes require major version bump, new features require minor bump
- Mark deprecated APIs with `@deprecated` JSDoc tag

**Naming Conventions:**

- Classes: `PascalCase` (ChessPGN, Game, Move)
- Methods: `camelCase` (makeMove, isCheckmate)
- Constants: `UPPER_SNAKE_CASE` (DEFAULT_POSITION, SQUARES)
- Private: prefix `_` (\_board, \_makeMove)

## Key Files Reference

### Must-Read Files

- `fensterchess/src/App.jsx` - App structure and routing
- `fensterchess/netlify/functions/utils/auth.js` - Serverless auth pattern
- `chessPGN/src/Game.ts` - Core chess implementation
- `chessPGN/src/types.ts` - Type system
- `chessPGN/CLAUDE.md` - Quick method reference

### Configuration Files

- `netlify.toml` - Serverless function config + included files
- `vite.config.js` (fensterchess) - Vite + Netlify plugin
- `vite.config.mts` (chessPGN) - Vitest config
- `rollup.config.mjs` - chessPGN multi-format build

## Master Game Database (In Progress)

**Goal**: Build searchable database of ~25,000 master games for opening research

**CRITICAL - Tooling Separation**: Data maintenance scripts are in the separate [fensterchess.tooling](https://github.com/JeffML/fensterchess.tooling) repository. This follows the pattern established by eco.json + eco.json.tooling.

### Repository Structure

**fensterchess** (this repo):
- Runtime code: `src/searchPage/MasterGames.tsx`, `src/datasource/fetchMasterGames.ts`
- Serverless functions: `netlify/functions/queryMasterGamesByFen.js`, `getMasterGameMoves.js`
- **Zero bundled data files** - all data loaded from remote sources:
  - Master game indexes: Netlify Blobs (uploaded by fensterchess.tooling)
  - Opening transitions: eco.json GitHub (`fromToPositionIndexed.json`)
  - Position scores: eco.json GitHub (`scores.json`)

**fensterchess.tooling** (separate repo):
- Data pipeline scripts: `downloadPgnmentor.ts`, `buildIndexes.ts`, `filterGame.ts`, `hashGame.ts`, `rechunkByHash.ts`
- Type definitions: `types.ts` (GameMetadata, indexes, deduplication)
- Filtering tests: `testFiltering.js`
- **When modifying data processing logic, work in fensterchess.tooling repo**

### Data Processing Pipeline

See [fensterchess.tooling](https://github.com/JeffML/fensterchess.tooling) for:
- Download scripts (pgnmentor + Lichess Elite)
- Filtering strategies (ELO, time control, titles)
- Index building (9 index types + chunking)
- Deduplication logic
- Performance optimization

**Filtering Strategy** (site-specific in `filterGame.ts`):

_Common filters (all sources):_

- Standard chess only (no variants)
- No FEN setups (must start from standard position)
- Both players ELO >2400
- Time control rapid or slower (≥600 seconds base time)

_pgnmentor.com:_

- Downloads from Players section only
- No title requirement
- Accepts all 2400+ rated games
- Current: 5 masters (Carlsen, Kasparov, Nakamura, Anand, Fischer) + additional downloads = ~45K games

_Lichess Elite Database:_

- **Requires BOTH players to have FIDE titles** (GM, IM, FM, WGM, WIM, WFM, CM, WCM, NM, WNM)
- Combined with common filters above
- Expected: ~3K-5K titled player games per month
- More restrictive filtering ensures high-quality games

**Performance**:

- Manual SAN parsing (no loadPgn overhead): ~16 games/sec
- 19K games: ~20 minutes processing time
- Lichess Elite processing: ~15-20 minutes per month

**Data Structure**:

**Netlify Blobs** (`master-games` store):
- `indexes/opening-by-name.json` - Opening name → {fen, eco, gameIds}
- `indexes/opening-by-eco.json` - ECO code → openings
- `indexes/game-to-players.json` - GameId → [white, black]
- `indexes/game-to-chunk.json` - idx → chunkId (correct chunk lookup; see Critical note below)
- `indexes/chunk-*.json` - Game data chunks (insertion-order, 4000 games each, ~4 MB per chunk)

**Local** (`data/` directory):
- `pgn-downloads/` - Downloaded ZIP files and processed-games.json (gitignored, not deployed)
- `README.md` - Data file origin documentation

**CRITICAL - Game Identity** (defined in fensterchess.tooling `scripts/types.ts`):

- **`hash`**: SHA-256 of `event|white|black|date|round`. Globally unique per game. The true identity key.
- **`idx`**: Per-source-file sequential integer. NOT globally unique across sources. Do not use for deduplication.

**CRITICAL - Chunk Lookup** (`queryMasterGamesByFen.js`):

- **NEVER use `Math.floor(idx / 4000)` to find a game's chunk.** After `rechunkByHash` sorted chunks by hash (not idx), this formula returns wrong chunks.
- Always use `game-to-chunk.json` index via `getChunkIdForGame(gameId)`. The helper falls back to `Math.floor` only if the index hasn't loaded yet.
- `game-to-chunk.json` is built by `buildGameToChunkIndex()` in `buildIndexes.ts` and must be re-generated + uploaded whenever chunks change.

**CRITICAL - GameMetadata Opening Fields** (defined in fensterchess.tooling `scripts/types.ts`):

Each game in the index has these fields for opening lookup:

- **`ecoJsonFen`**: THE KEY for `opening-by-fen.json` index. This is the FEN of the opening position the game is indexed under. To query games for an opening, use THIS FEN as the lookup key.
- **`ecoJsonOpening`**: The opening name (e.g., "Nimzo-Larsen Attack")
- **`ecoJsonEco`**: The ECO code (e.g., "A01")
- **`movesBack`**: How many half-moves from the end of the game this opening position occurs

**Example**: A game ending at move 40 that plays 1.b3 d6 2.Bb2:

- `ecoJsonFen`: FEN after 1.b3 (the Nimzo-Larsen Attack position - the INDEX KEY)
- `ecoJsonOpening`: "Nimzo-Larsen Attack"
- `ecoJsonEco`: "A01"
- `movesBack`: 3 (d6 and Bb2 are 2 more half-moves after 1.b3)

**Why this matters**: When a user is at position 1.b3 d6 (no named opening), to find relevant games, look up the `opening-by-fen.json` using the nearest ancestor opening's FEN (1.b3), NOT the current position's FEN. The game metadata already stores this as `ecoJsonFen`.

**Current Status**:

- ✅ Phase 0: Foundation and filtering logic complete
- ✅ Phase 1: Downloaded 5 masters (Carlsen, Kasparov, Nakamura, Anand, Fischer)
- ✅ Phase 2: UI integration (search interface and game viewer)
- ✅ Phase 3: Complete migration to Netlify Blobs
  - All indexes uploaded to Netlify Blobs
  - Serverless functions load from blobs with module-level caching
  - Zero bundled data files (30.9 MB eliminated)
  - fromToPositionIndexed.json and scores.json download from eco.json GitHub
- ✅ Phase 4: Chunk stability
  - Insertion-order chunk model (append-only via `saveGamesToChunks`)
  - `buildIndexes` enriches in-place without rechunking
  - Deduplication via SHA-256 hash (not `idx`); ~45K unique games across 12 chunks
  - Upload does diff by chunk fingerprint; orphan blobs deleted automatically
  - `game-to-chunk.json` index enables correct chunk lookup (replaces broken `Math.floor(idx/4000)` formula)

**Design Docs**: See `.github/masterGameDatabase*.md` for detailed architecture (these docs have been moved to fensterchess.tooling repo)

## Common Pitfalls

1. **Don't edit `src/pgn.js` directly** - modify `src/pgn.peggy` and run `npm run parser`
2. **ChessPGN vs Game** - Modify Game.ts for logic changes; ChessPGN is just a wrapper
3. **Worker thread setup** - Workers use CommonJS; see `src/workerParser.js` for pattern
4. **Netlify Blobs** - Master game indexes load from Netlify Blobs, NOT bundled files
5. **eco.json GitHub files** - fromToPositionIndexed.json and scores.json download from eco.json repo
6. **React Query keys** - Must include ALL variables that affect the query (especially FEN strings)
7. **Opening book lookup** - Always check `positionBook` fallback when `openingBook[fen]` is null
8. **Chunk lookup** - NEVER use `Math.floor(idx/4000)` to find a game's chunk; use `getChunkIdForGame()` backed by `game-to-chunk.json`
