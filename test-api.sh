#!/bin/bash
# Test fensterchess API endpoints in dev mode

echo "🧪 Testing Fensterchess API Endpoints"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"
ORIGIN="http://localhost:3001"

# Test 1: Check if dev server is running
echo "1️⃣  Checking if dev server is running..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo "   ✅ Dev server is running on $BASE_URL"
else
    echo "   ❌ Dev server is NOT running"
    echo "   Run: npm run dev"
    exit 1
fi
echo ""

# Test 2: Test getFromTosForFen (needs fromToPositionIndexed.json)
echo "2️⃣  Testing getFromTosForFen endpoint..."
RESPONSE=$(curl -s -H "Origin: $ORIGIN" "$BASE_URL/.netlify/functions/getFromTosForFen?fen=rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR%20b%20KQkq%20e3%200%201" 2>&1)
if echo "$RESPONSE" | grep -q "Failed to fetch fromToPositionIndexed.json"; then
    echo "   ❌ FAILED: fromToPositionIndexed.json not found on GitHub"
    echo "   Error: $RESPONSE"
    echo ""
    echo "   📝 TODO: Generate and commit fromToPositionIndexed.json to eco.json repo"
elif echo "$RESPONSE" | grep -q "Unauthorized"; then
    echo "   ❌ FAILED: Unauthorized (auth issue)"
elif echo "$RESPONSE" | grep -q '"next"'; then
    echo "   ✅ SUCCESS: API returned valid data"
else
    echo "   ⚠️  UNKNOWN: $RESPONSE"
fi
echo ""

# Test 3: Test scoresForFens (needs scores.json)
echo "3️⃣  Testing scoresForFens endpoint..."
RESPONSE=$(curl -s -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
    -d '{"fens":["rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"]}' \
    "$BASE_URL/.netlify/functions/scoresForFens" 2>&1)
if echo "$RESPONSE" | grep -q "Failed to fetch scores.json"; then
    echo "   ❌ FAILED: scores.json not found on GitHub"
    echo ""
    echo "   📝 TODO: Generate and commit scores.json to eco.json repo"
elif echo "$RESPONSE" | grep -q "Unauthorized"; then
    echo "   ❌ FAILED: Unauthorized (auth issue)"
elif echo "$RESPONSE" | grep -q "scores"; then
    echo "   ✅ SUCCESS: API returned scores"
else
    echo "   ⚠️  UNKNOWN: $RESPONSE"
fi
echo ""

echo "======================================"
echo "Summary:"
echo "  - If you see 404 errors for JSON files, they need to be generated"
echo "  - Check eco.json.tooling repo for generation scripts"
echo "  - Or create temporary local versions for dev"
