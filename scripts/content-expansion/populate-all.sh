#!/usr/bin/env bash
set -euo pipefail

# Darwin Education — Content Expansion Population Script
# Executes all seed SQL files against Supabase via Management API
#
# Usage:
#   SUPABASE_PROJECT_REF=xxx SUPABASE_SERVICE_KEY=xxx ./populate-all.sh
#
# Or set env vars in .env.local and source it first.

PROJECT_REF="${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF}"
MGMT_KEY="${SUPABASE_MGMT_KEY:?Set SUPABASE_MGMT_KEY (Management API bearer token)}"

API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"
SEED_DIR="$(cd "$(dirname "$0")/../../infrastructure/supabase/seed/expansion" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

run_sql_file() {
  local file="$1"
  local name
  name="$(basename "$file")"

  if [ ! -f "$file" ]; then
    echo -e "${RED}[SKIP] File not found: ${name}${NC}"
    return 1
  fi

  echo -ne "${YELLOW}[RUN]  ${name}...${NC} "

  local payload
  payload=$(python3 -c "
import json, sys
with open('$file', 'r') as f:
    sql = f.read()
print(json.dumps({'query': sql}))
")

  local response
  response=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer ${MGMT_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error' in data:
    print(data['error'])
    sys.exit(1)
" 2>/dev/null; then
    echo -e "${RED}[FAIL]${NC}"
    echo "  Error: $response"
    return 1
  else
    echo -e "${GREEN}[OK]${NC}"
  fi
}

echo "========================================="
echo "Darwin Education — Content Expansion"
echo "========================================="
echo "Project: ${PROJECT_REF}"
echo "Seed dir: ${SEED_DIR}"
echo ""

# Phase 1: Migration (schema changes — run manually first)
echo "--- Phase 1: Migration 009 ---"
echo "(Run infrastructure/supabase/migrations/009_content_expansion.sql manually if not done)"
echo ""

# Phase 2: DDL Questions
echo "--- Phase 2: DDL Questions (100) ---"
for area in clinica_medica cirurgia ginecologia_obstetricia pediatria saude_coletiva; do
  run_sql_file "${SEED_DIR}/ddl_${area}_20.sql"
done
echo ""

# Phase 3: Flashcards
echo "--- Phase 3: Flashcards (~1000) ---"
run_sql_file "${SEED_DIR}/flashcard_decks_system.sql"
for area in clinica_medica cirurgia ginecologia pediatria saude_coletiva; do
  run_sql_file "${SEED_DIR}/flashcards_${area}_200.sql"
done
echo ""

# Phase 5: Study Tracks
echo "--- Phase 5: Study Tracks ---"
run_sql_file "${SEED_DIR}/study_modules_new.sql"
run_sql_file "${SEED_DIR}/study_paths_new.sql"
echo ""

# Verification
echo "--- Verification ---"
verify_query='
SELECT
  (SELECT count(*) FROM ddl_questions) AS ddl_count,
  (SELECT count(*) FROM flashcard_decks WHERE is_system = true) AS system_decks,
  (SELECT count(*) FROM flashcards WHERE deck_id IN (SELECT id FROM flashcard_decks WHERE is_system = true)) AS system_flashcards,
  (SELECT count(*) FROM study_paths) AS study_paths,
  (SELECT count(*) FROM study_modules) AS study_modules;
'

response=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer ${MGMT_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json; print(json.dumps({'query': '''$verify_query'''}))")")

echo "Counts: $response"
echo ""
echo "========================================="
echo "Done!"
echo "========================================="
