// Build ancestor-to-descendants.json index
// Maps ancestor FEN positions → descendant FENs that exist in master games
// This enables searching for "French Defense" to find all specific variations

import fs from "fs";
import path from "path";

const INDEXES_DIR = "./data/indexes";
const OUTPUT_FILE = path.join(INDEXES_DIR, "ancestor-to-descendants.json");
const OPENING_BY_FEN_FILE = path.join(INDEXES_DIR, "opening-by-fen.json");
const FROM_TO_FILE = "./data/fromToPositionIndexed.json";

interface FromToIndex {
  to: Record<string, string[]>; // position → next positions
  from: Record<string, string[]>; // position → previous positions
}

type OpeningByFenIndex = Record<string, number[]>;

/**
 * Extract position-only FEN (first field, no turn/castling/en passant)
 */
function getPositionFen(fen: string): string {
  return fen.split(" ")[0];
}

/**
 * Recursively find all ancestors of a position using the 'from' transitions
 */
function findAncestors(
  positionFen: string,
  fromIndex: Record<string, string[]>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(positionFen)) {
    return [];
  }
  visited.add(positionFen);

  const ancestors: string[] = [];
  const parentFens = fromIndex[positionFen] || [];

  for (const parentFen of parentFens) {
    const parentPosition = getPositionFen(parentFen);
    ancestors.push(parentFen);
    // Recursively get grandparents, etc.
    ancestors.push(...findAncestors(parentPosition, fromIndex, visited));
  }

  return ancestors;
}

async function buildAncestorIndex(): Promise<void> {
  console.log("🌳 Building ancestor-to-descendants.json index\n");

  // Load opening-by-fen.json to get all FENs that have master games
  console.log(`📖 Reading ${OPENING_BY_FEN_FILE}...`);
  const openingByFen: OpeningByFenIndex = JSON.parse(
    fs.readFileSync(OPENING_BY_FEN_FILE, "utf-8")
  );
  const masterGameFens = Object.keys(openingByFen);
  console.log(
    `  Found ${masterGameFens.length} unique positions with master games`
  );

  // Load fromTo index from local file
  console.log(`\n📖 Reading ${FROM_TO_FILE}...`);
  const fromToIndex: FromToIndex = JSON.parse(
    fs.readFileSync(FROM_TO_FILE, "utf-8")
  );
  console.log(`  Loaded transition graph`);

  // Build ancestor → descendants mapping
  console.log(`\n🔨 Building ancestor mappings...`);
  const ancestorToDescendants: Record<string, string[]> = {};
  let processed = 0;

  for (const descendantFen of masterGameFens) {
    const descendantPosition = getPositionFen(descendantFen);

    // Find all ancestors of this position
    const ancestors = findAncestors(descendantPosition, fromToIndex.from);

    for (const ancestorFen of ancestors) {
      const ancestorPosition = getPositionFen(ancestorFen);

      // Skip if this ancestor is already a master game position
      // (no need to map it to descendants - direct lookup works)
      if (openingByFen[ancestorFen]) {
        continue;
      }

      if (!ancestorToDescendants[ancestorPosition]) {
        ancestorToDescendants[ancestorPosition] = [];
      }

      // Add descendant FEN if not already present
      if (!ancestorToDescendants[ancestorPosition].includes(descendantFen)) {
        ancestorToDescendants[ancestorPosition].push(descendantFen);
      }
    }

    processed++;
    if (processed % 500 === 0) {
      process.stdout.write(
        `\r  Processed ${processed}/${masterGameFens.length} positions...`
      );
    }
  }

  process.stdout.write(
    `\r  Processed ${masterGameFens.length}/${masterGameFens.length} positions\n`
  );

  console.log(
    `\n✅ Found ${Object.keys(ancestorToDescendants).length} ancestor positions`
  );

  // Calculate average descendants per ancestor
  const totalDescendants = Object.values(ancestorToDescendants).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const avgDescendants =
    totalDescendants / Object.keys(ancestorToDescendants).length;
  console.log(
    `  Average descendants per ancestor: ${avgDescendants.toFixed(1)}`
  );

  // Save index
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(ancestorToDescendants, null, 2));

  const size = fs.statSync(OUTPUT_FILE).size;
  console.log(
    `\n💾 Saved: ${OUTPUT_FILE} (${(size / 1024 / 1024).toFixed(2)} MB)`
  );
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAncestorIndex().catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
}

export { buildAncestorIndex };
