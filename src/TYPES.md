# TypeScript Types Reference

This file documents the shared TypeScript types for the fensterchess application.

## Core Chess Types

### `Opening`
Represents a chess opening from eco.json:
```typescript
import type { Opening } from './types';

const opening: Opening = {
  name: "Sicilian Defense",
  moves: "1. e4 c5",
  eco: "B20",
  score: 0.15,
  next: [...],  // Added by serverless functions
  from: [...]   // Added by serverless functions
};
```

### `OpeningBook` and `PositionBook`
```typescript
import type { OpeningBook, PositionBook } from './types';

// Maps FEN to Opening
const book: OpeningBook = {
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2": {
    name: "Sicilian Defense",
    // ...
  }
};

// Maps position-only FEN to array of full FENs
const posBook: PositionBook = {
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR": [
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2"
  ]
};
```

### `BoardState`
```typescript
import type { BoardState } from './types';

const state: BoardState = {
  fen: "start",  // or a FEN string
  moves: "1. e4 e5 2. Nf3"
};
```

### `ChessRef`
```typescript
import { useRef } from 'react';
import { ChessPGN } from '@chess-pgn/chess-pgn';
import type { ChessRef } from './types';

const chess: ChessRef = useRef(new ChessPGN());
```

## API Types

### `FromTosResponse`
Response from `getFromTosForFen`:
```typescript
import type { FromTosResponse } from './types';

const response: FromTosResponse = {
  next: ["fen1", "fen2"],
  from: ["fen3", "fen4"]
};
```

### `ScoresResponse`
Response from `scoresForFens`:
```typescript
import type { ScoresResponse } from './types';

const scores: ScoresResponse = {
  score: 0.15,
  nextScores: [0.12, 0.18],
  fromScores: [0.10]
};
```

## UI Component Types

### `GamePercentages`
Used in StackedBarChart and visualizations:
```typescript
import type { GamePercentages } from './types';

const stats: GamePercentages = {
  w: 45,  // White wins %
  b: 35,  // Black wins %
  d: 20   // Draws %
};
```

### `Player`
```typescript
import type { Player } from './types';

const player: Player = {
  name: "Magnus Carlsen",
  elo: 2882,
  title: "GM"
};
```

## Context Types

### `OpeningBookContextValue`
```typescript
import type { OpeningBookContextValue } from './types';

const contextValue: OpeningBookContextValue = {
  openingBook: {...},  // or null
  positionBook: {...}  // or null
};
```

### `SelectedSitesContextValue`
```typescript
import type { SelectedSitesContextValue } from './types';

const sites: SelectedSitesContextValue = ["FICS", "lichess"];
```

## Utility Types

### `FEN`, `PGN`, `EcoCode`, `Square`
Type aliases for better documentation:
```typescript
import type { FEN, PGN, EcoCode, Square } from './types';

const fen: FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const pgn: PGN = "1. e4 e5 2. Nf3 Nc6";
const eco: EcoCode = "C42";
const square: Square = "e4";
```

## Migration Tips

1. **Import types with `type` keyword:**
   ```typescript
   import type { Opening, FEN } from './types';
   ```

2. **Use in function signatures:**
   ```typescript
   function findOpening(fen: FEN, book: OpeningBook): Opening | undefined {
     return book[fen];
   }
   ```

3. **Type component props:**
   ```typescript
   interface MyComponentProps {
     opening: Opening;
     onSelect: (fen: FEN) => void;
   }
   ```

4. **Type context values:**
   ```typescript
   const OpeningBookContext = createContext<OpeningBookContextValue | null>(null);
   ```
