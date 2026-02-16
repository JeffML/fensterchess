# Data Directory

**All data files have been migrated to remote sources:**

- **Master game data**: Stored in Netlify Blobs (loaded by serverless functions at runtime)
- **Opening transitions** (`fromToPositionIndexed.json`): Downloaded from [eco.json GitHub](https://github.com/JeffML/eco.json/blob/master/fromToPositionIndexed.json) on demand
- **Position scores** (`scores.json`): Downloaded from [eco.json GitHub](https://github.com/JeffML/eco.json/blob/master/scores.json) on demand
- **PGN downloads** and processing: Maintained in [fensterchess.tooling](https://github.com/JeffML/fensterchess.tooling) repository

This directory is preserved for potential future local data caching.
