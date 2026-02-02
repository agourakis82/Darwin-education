#!/bin/bash

# QGen Test Script
# ================
# Tests QGen API endpoints to verify integration

set -e

API_URL="${API_URL:-http://localhost:3000}"
echo "Testing QGen API at: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  $method /api/qgen$endpoint"

    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" "$API_URL/api/qgen$endpoint")
    else
        response=$(curl -s -X "$method" "$API_URL/api/qgen$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASSED${NC}"
    elif echo "$response" | grep -q '"success":false'; then
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Error: $(echo "$response" | jq -r '.error' 2>/dev/null || echo 'Unknown error')"
    else
        echo -e "${RED}✗ ERROR${NC}"
        echo "  Response: $response"
    fi
    echo ""
}

echo "=================================================="
echo "QGen-DDL API Integration Tests"
echo "=================================================="
echo ""

# Test 1: Single question generation
test_endpoint "POST" "/generate" \
    '{
        "config": {
            "targetArea": "clinica_medica",
            "targetDifficulty": 3,
            "targetBloomLevel": "APPLICATION",
            "requireClinicalCase": true
        },
        "validateAfterGeneration": true
    }' \
    "Generate single question"

# Test 2: Stats endpoint
test_endpoint "GET" "/stats" "" "Get generation statistics"

# Test 3: Misconceptions endpoint
test_endpoint "GET" "/misconceptions?limit=5" "" "List misconceptions"

# Test 4: Corpus stats
test_endpoint "GET" "/corpus" "" "Get corpus statistics"

# Test 5: Review queue
test_endpoint "GET" "/review?limit=5" "" "Get review queue"

echo "=================================================="
echo "Tests complete!"
echo ""
echo "To test in browser:"
echo "  1. Open: $API_URL/qgen"
echo "  2. Configure generation options"
echo "  3. Click 'Gerar Questão'"
echo ""
echo "To debug API responses:"
echo "  curl -X POST http://localhost:3000/api/qgen/generate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"config\": {\"targetArea\": \"clinica_medica\"}}'"
echo ""
