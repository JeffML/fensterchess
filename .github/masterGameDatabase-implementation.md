# Master Game Database - Implementation Staging

**Date**: December 30, 2025  
**Related**: [masterGameDatabase.md](./masterGameDatabase.md), [masterGameDatabase-analysis.md](./masterGameDatabase-analysis.md)

---

## Phase 0: Preparation (Week 1)

**Goal**: Set up foundation and validate approach

### Tasks:

- [ ] Create `scripts/` directory for indexing tools
- [ ] Install dependencies: `adm-zip`, `7zip-min` for archive extraction
- [ ] Create TypeScript interfaces for all index structures
- [ ] Set up Netlify Blobs SDK and test read/write
- [ ] Create sample filtering script with 5 test games
- [ ] Validate hash generation and deduplication logic

### Deliverables:

- `scripts/types.ts` - All interface definitions
- `scripts/filterGame.ts` - Game filtering logic
- `scripts/hashGame.ts` - Hash generation
- `scripts/testBlobs.ts` - Blob storage test

### Success Criteria:

- ✅ Can read/write to Netlify Blobs
- ✅ Filtering correctly rejects variants, FEN setups, low-rated games
- ✅ Annotation stripping works correctly
- ✅ Hash generation is deterministic

---

## Phase 1: Single Source Proof of Concept (Week 2-3)

**Goal**: Index 5 masters from pgnmentor.com, build all indexes

### Scope:

- **5 masters**: Carlsen, Kasparov, Nakamura, Anand, Fischer
- **Estimated games**: ~25,000 (after filtering)
- **Purpose**: Validate entire pipeline

### Tasks:

- [ ] Implement `scripts/downloadPgnMentor.ts`
  - Download ZIP files (with 10-second throttle)
  - Extract PGN
  - Filter games
  - Strip annotations
- [ ] Implement `scripts/buildIndexes.ts`
  - Generate all 6 user indexes
  - Create deduplication index
  - Create source tracking
  - Chunk game data
- [ ] Upload to Netlify Blobs
- [ ] Create simple serverless function to test retrieval
- [ ] Verify index sizes and structure

### Deliverables:

- Working indexing pipeline
- ~25,000 games in blob storage
- All 6 search indexes functional
- Test serverless function

### Success Criteria:

- ✅ All indexes generated correctly
- ✅ Can query by opening, player, event, date
- ✅ No duplicates in dataset
- ✅ Index sizes match projections (±20%)

---

## Phase 2: Scale to All pgnmentor Masters (Week 4-5)

**Goal**: Index all ~200 master files

### Scope:

- **200 masters** from pgnmentor.com
- **Estimated games**: ~320,000 (after filtering from 800K raw)
- **Runtime**: ~33 minutes with 10-second throttle

### Tasks:

- [ ] Expand master list to full 200 players
- [ ] Implement checkpoint system (save every 10 masters)
- [ ] Add progress logging and error recovery
- [ ] Run full indexing
- [ ] Verify deduplication working across files
- [ ] Upload all indexes and games to Netlify Blobs

### Deliverables:

- Complete pgnmentor dataset indexed
- ~320K games available
- All indexes updated

### Success Criteria:

- ✅ All 200 masters processed successfully
- ✅ Deduplication rate ~10-15% (expected overlap in tournaments)
- ✅ Total storage ~800MB (indexes + games)
- ✅ Can search across all masters

---

## Phase 3: Add Lumbras Gigabase (DEFERRED)

**Status**: ⏸️ Deferred - Will revisit after Phase 5 completion

**Goal**: Integrate time-period archives from Lumbras

### Scope:

- **Focus**: 2020-2024 period first (largest, most relevant)
- **Estimated games**: ~200,000 (after filtering from 500K raw)
- **Format**: 7z archives, different structure

### Deferral Rationale:

- pgnmentor provides sufficient master games (~320K) for initial launch
- 7z extraction adds dependency complexity
- Can validate feature utility with single source first
- Easier to add later once pipeline is proven

### Tasks (when resumed):

- [ ] Implement 7z extraction (different from ZIP)
- [ ] Handle time-period organization (vs player-based)
- [ ] Test deduplication (expect 30-40% overlap with pgnmentor)
- [ ] Integrate into existing indexes
- [ ] Add other time periods (2015-2019, 2010-2014, etc.)

### Deliverables (when resumed):

- Lumbras data integrated
- ~480K total unique games (after deduplication)
- Updated indexes

### Success Criteria (when resumed):

- ✅ 7z extraction working
- ✅ Deduplication catches overlaps with pgnmentor
- ✅ All time periods indexed
- ✅ Total storage ~1.5GB

---

## Phase 4: Serverless Functions (Week 6)

**Goal**: Production-ready API for Fenster

### API Endpoints:

**1. Search Operations**

```
GET /api/searchMasterGames?action=searchByOpening&fen=...
GET /api/searchMasterGames?action=searchByName&query=najdorf
GET /api/searchMasterGames?action=searchByEco&code=B90
GET /api/searchMasterGames?action=searchByPlayer&name=Carlsen
GET /api/searchMasterGames?action=searchByEvent&name=World%20Championship
GET /api/searchMasterGames?action=searchByDate&year=2023
```

**2. Game Retrieval**

```
GET /api/searchMasterGames?action=getGame&idx=42
GET /api/searchMasterGames?action=getGames&indices=42,156,892
```

**3. Combined Search**

```
POST /api/searchMasterGames
Body: {
  player: "Carlsen",
  opening: "Najdorf",
  yearFrom: 2020,
  yearTo: 2025
}
```

### Tasks:

- [ ] Implement all search endpoints
- [ ] Add caching (warm function keeps indexes in memory)
- [ ] Add authentication (same pattern as existing functions)
- [ ] Error handling and validation
- [ ] Performance testing

### Deliverables:

- `netlify/functions/searchMasterGames.ts`
- Working API with all endpoints

### Success Criteria:

- ✅ All searches return correct results
- ✅ Response times <500ms for index searches
- ✅ Response times <2s for game retrieval
- ✅ Handles concurrent requests

---

## Phase 5: UI Integration (Week 7-8)

**Goal**: Add Master Games tab to Fenster

### Components:

**1. Master Games Tab** (`src/pgnImportPage/MasterGamesTab.tsx`)

- Search interface (opening, player, event, date filters)
- Combined search with multiple criteria
- Results table
- Click to load game

**2. Search Components**

- `OpeningSearch.tsx` - FEN/name/ECO search
- `PlayerSearch.tsx` - Player autocomplete
- `EventSearch.tsx` - Event/tournament dropdown
- `DateRangeSearch.tsx` - Year range picker

**3. Integration**

- Add tab to Import PGN page
- Connect to serverless functions
- Load game into main board
- Show game metadata

### Tasks:

- [ ] Create all React components
- [ ] Implement search UI
- [ ] Add loading states and error handling
- [ ] Style consistently with existing Fenster UI
- [ ] Test user workflows

### Deliverables:

- Complete Master Games UI
- Integrated into Fenster

### Success Criteria:

- ✅ Users can search by all criteria
- ✅ Results load quickly
- ✅ Games load into analysis board
- ✅ UI is intuitive and responsive

---

## Phase 6: Incremental Updates (Week 9)

**Goal**: Automated monthly updates

### Update Strategy:

1. Check source tracking for last visit dates
2. HEAD request each file to check Last-Modified/ETag
3. Download only changed files
4. Process new/updated games
5. Deduplicate against existing
6. Rebuild affected indexes
7. Upload updated blobs

### Tasks:

- [ ] Implement `scripts/updateIndexes.ts`
- [ ] HEAD request logic with fallback
- [ ] Incremental index rebuilding
- [ ] Test with sample updates

### Optional: GitHub Actions

- [ ] Create workflow for monthly updates
- [ ] Automated upload to Netlify Blobs
- [ ] Email notification on completion

### Deliverables:

- Update script
- Documentation for running updates

### Success Criteria:

- ✅ Can detect file changes
- ✅ Only downloads modified files
- ✅ Deduplication prevents re-adding existing games
- ✅ Update completes in <10 minutes for typical monthly changes

---

## Timeline Summary

| Phase                    | Duration    | Cumulative  | Key Deliverable     |
| ------------------------ | ----------- | ----------- | ------------------- |
| Phase 0: Preparation     | 1 week      | 1 week      | Foundation          |
| Phase 1: POC (5 masters) | 2 weeks     | 3 weeks     | Working pipeline    |
| Phase 2: All pgnmentor   | 2 weeks     | 5 weeks     | 320K games          |
| ~~Phase 3: Lumbras~~     | ~~2 weeks~~ | ~~7 weeks~~ | ⏸️ **DEFERRED**     |
| Phase 4: Serverless API  | 1 week      | 6 weeks     | Production API      |
| Phase 5: UI              | 2 weeks     | 8 weeks     | User-facing feature |
| Phase 6: Updates         | 1 week      | 9 weeks     | Maintenance system  |

**Total: ~9 weeks (2 months) to production feature with pgnmentor**  
**Phase 3 (Lumbras) can be added later: +2 weeks**

---

## Risk Mitigation

### Technical Risks

- **Index size exceeds 100MB**: Implemented chunking strategy
- **Deduplication failures**: Hash includes normalized moves, very reliable
- **7z extraction issues**: Deferred with Phase 3
- **API timeout**: Caching and index chunking prevent this
- **API timeout**: Caching and index chunking prevent this

### Operational Risks

- **Source site changes**: Source tracking captures metadata, can detect
- **Rate limiting**: 10-second throttle, respectful user agent
- **Storage costs**: Well within 100GB limit, projected $0/month

### Mitigation Strategies

- Start small (Phase 1: 5 masters)
- Validate at each phase before scaling
- Checkpoint system prevents data loss
- Can pause/resume indexing

---

## Next Steps

**Immediate** (This week):

1. Review and approve Phase 0 scope
2. Set up `scripts/` directory structure
3. Install dependencies
4. Create initial TypeScript interfaces
   **Short-term** (Next 2 weeks):
5. Complete Phase 0 preparation
6. Begin Phase 1 POC with 5 masters
7. Validate filtering and indexing pipeline

**Long-term** (Next 2 months):

1. Scale to full pgnmentor dataset (320K games)
2. Build serverless API
3. Create Fenster UI
4. Set up update automation

**Future Enhancement** (Post-launch):

- Phase 3: Integrate Lumbras Gigabase (+2 weeks)
- Expands dataset from 320K to ~480K unique games

5. Set up update automation
   **Document Version**: 1.1  
   **Last Updated**: December 30, 2025  
   **Status**: Planning - Phase 3 deferred, awaiting approval to begin Phase 0  
   **Change Log**: v1.1 - Deferred Phase 3 (Lumbras), reduced timeline to 9 weeks
   **Document Version**: 1.0  
   **Last Updated**: December 30, 2025  
   **Status**: Planning - Awaiting approval to begin Phase 0
