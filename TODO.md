# Fensterchess TODO

## Visualization Ideas (Master Games)

### Zero additional data cost (uses player-eco-matrix.json, already fetched by chord diagram)

- ✅ **Radar/spider chart** — ECO letters (A–E) as axes, one polygon per player showing % of games in each family. Answers "is this player a 1.e4 or 1.d4 player?" at a glance. Shares the chord diagram's `playerOpeningMatrix` query cache. *(done)*

- [ ] **Opening diversity score** — sorted bar chart of players by Shannon entropy of their ECO distribution. High entropy = well-rounded; low = specialist. Computed client-side from the matrix, no new data needed.

### One small additional blob (date-index.json, 597 KB, already in Netlify Blobs)

- [ ] **Opening trends over time** — line/area chart of ECO letter (or decade) popularity by year. Shows rise of Indian defenses (E), decline of classical openings (C), etc. over the database's date range.

### Moderate additional cost (opening-by-eco.json, 602 KB, already in Netlify Blobs)

- [ ] **ECO treemap** — rectangles sized by game count, grouped and colored by ECO letter. Visual weight of the whole database's opening distribution. No player selection needed.

---

## Code Quality / Performance

- [ ] **Parallelize .json() parsing in getLatestEcoJson.ts** — change sequential `await res[i++].json()` loop to `Promise.all(res.map(r => r.json()))` for faster opening book load on cold start.
