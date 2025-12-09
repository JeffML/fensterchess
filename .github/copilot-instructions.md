# Copilot Instructions for Fenster Chess

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

- `getFromTosForFen.js` - Returns next/previous positions for a FEN (reads from `data/fromToPositionIndexed.json`)
- `scoresForFens.js` - Evaluates positions using pre-computed scores (`data/scores.json`)
- `getPgnLinks.js` / `getRssXml.js` - Fetch PGN data from external chess sites
- All functions use Bearer token authentication via `utils/auth.js` (checks `VITE_API_SECRET_TOKEN`)

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

## Common Pitfalls

1. **Don't edit `src/pgn.js` directly** - modify `src/pgn.peggy` and run `npm run parser`
2. **ChessPGN vs Game** - Modify Game.ts for logic changes; ChessPGN is just a wrapper
3. **Worker thread setup** - Workers use CommonJS; see `src/workerParser.js` for pattern
4. **Netlify function data** - Use `included_files` in `netlify.toml` to bundle JSON data
5. **React Query keys** - Must include ALL variables that affect the query (especially FEN strings)
6. **Opening book lookup** - Always check `positionBook` fallback when `openingBook[fen]` is null
