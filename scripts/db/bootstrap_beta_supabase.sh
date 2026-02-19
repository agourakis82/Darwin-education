#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[db] Legacy bootstrap (direct psql) — prefer Supabase CLI."
echo "[db] Running: scripts/db/bootstrap_beta_supabase_cli.sh"
exec bash scripts/db/bootstrap_beta_supabase_cli.sh

ENV_FILE="apps/web/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "[db] Missing $ENV_FILE"
  echo "[db] Create it from apps/web/.env.example and add Supabase credentials."
  exit 1
fi

env_get() {
  local key="$1"
  node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');const k=process.argv[2];const m=t.match(new RegExp('^'+k+'\\\\s*=\\\\s*(.+)\\\\s*$','m'));const v=m?m[1].trim().replace(/^['\\\"]|['\\\"]$/g,''):'';process.stdout.write(v);" \
    "$ENV_FILE" "$key"
}

SUPABASE_URL="$(env_get NEXT_PUBLIC_SUPABASE_URL)"
DB_PASSWORD="$(env_get SUPABASE_DB_PASSWORD)"
SERVICE_ROLE_KEY="$(env_get SUPABASE_SERVICE_ROLE_KEY)"
PROJECT_REF="$(node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');const m=t.match(/^NEXT_PUBLIC_SUPABASE_URL\\s*=\\s*(.+)\\s*$/m);const url=m?m[1].trim().replace(/^['\\\"]|['\\\"]$/g,''):'';let ref='';try{ref=new URL(url).hostname.split('.')[0]}catch{};process.stdout.write(ref);" "$ENV_FILE")"

if [ -z "$SUPABASE_URL" ] || [ -z "$PROJECT_REF" ]; then
  echo "[db] NEXT_PUBLIC_SUPABASE_URL missing/invalid in $ENV_FILE"
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "[db] Missing SUPABASE_DB_PASSWORD in $ENV_FILE"
  echo "[db] Add the Postgres password from Supabase Dashboard → Settings → Database."
  echo "[db] (This file is gitignored; do NOT commit secrets.)"
  exit 1
fi

if [[ "$DB_PASSWORD" == eyJ*.*.* ]]; then
  echo "[db] SUPABASE_DB_PASSWORD looks like a JWT (API key), not a database password."
  echo "[db] Use Supabase Dashboard → Settings → Database → Database password."
  exit 1
fi

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "[db] Missing SUPABASE_SERVICE_ROLE_KEY in $ENV_FILE"
  echo "[db] Add it from Supabase Dashboard → Settings → API (service_role key)."
  exit 1
fi

SCHEMA_FILE="infrastructure/supabase/deploy_schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "[db] Missing $SCHEMA_FILE"
  echo "[db] Run: bash deploy.sh --generate"
  exit 1
fi

echo "[db] Target project: $PROJECT_REF"
echo "[db] Resolving database connection…"

DB_HOST=""
DB_PORT="5432"
DB_USER="postgres"

DIRECT_HOST="db.${PROJECT_REF}.supabase.co"
if dig +short "$DIRECT_HOST" A 2>/dev/null | head -n 1 | rg -q "\\d+\\.\\d+\\.\\d+\\.\\d+"; then
  DB_HOST="$DIRECT_HOST"
  DB_PORT="5432"
  DB_USER="postgres"
else
  echo "[db] Direct DB host has no IPv4 A record (likely IPv6-only). Trying Supabase pooler…"

  prefixes=(aws-0 aws-1)
  regions=(
    us-east-1 us-east-2 us-west-1 us-west-2 ca-central-1
    eu-west-1 eu-west-2 eu-west-3 eu-central-1 eu-north-1
    ap-southeast-1 ap-southeast-2 ap-northeast-1 ap-northeast-2 ap-south-1
    sa-east-1
  )

  candidate_user="postgres.${PROJECT_REF}"
  found_password_fail=""

  for p in "${prefixes[@]}"; do
    for r in "${regions[@]}"; do
      host="${p}-${r}.pooler.supabase.com"
      if ! dig +short "$host" A >/dev/null 2>&1; then
        continue
      fi

      out="$(PGPASSWORD="$DB_PASSWORD" PGSSLMODE=require \
        psql "host=$host port=6543 user=$candidate_user dbname=postgres sslmode=require" \
        -c "select 1;" 2>&1 | head -n 1 || true)"

      if echo "$out" | rg -q "\\(1 row\\)"; then
        DB_HOST="$host"
        DB_PORT="6543"
        DB_USER="$candidate_user"
        break 2
      fi

      if echo "$out" | rg -qi "password authentication failed"; then
        found_password_fail="$host"
      fi
    done
  done

  if [ -z "$DB_HOST" ]; then
    if [ -n "$found_password_fail" ]; then
      echo "[db] Found a reachable pooler host ($found_password_fail) but password authentication failed."
      echo "[db] Verify SUPABASE_DB_PASSWORD (Supabase Dashboard → Settings → Database)."
      exit 1
    fi

    echo "[db] Could not find a reachable pooler host for this project from this environment."
    echo "[db] Recommended fallback: run deploy via Supabase SQL Editor using:"
    echo "[db]   infrastructure/supabase/deploy_schema.sql then infrastructure/supabase/deploy_seeds.sql"
    exit 1
  fi
fi

echo "[db] Using host=$DB_HOST port=$DB_PORT user=$DB_USER"
echo "[db] Applying schema+migrations…"

PGPASSWORD="$DB_PASSWORD" PGSSLMODE=require \
  psql "host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=postgres sslmode=require" \
  -v ON_ERROR_STOP=1 \
  -f "$SCHEMA_FILE"

echo "[db] Applying seeds (best-effort)…"

SEED_FILES=(
  "infrastructure/supabase/seed/01_question_banks.sql"
  "infrastructure/supabase/seed/02_sample_questions.sql"
  "infrastructure/supabase/seed/03_achievements.sql"
  "infrastructure/supabase/seed/04_study_paths.sql"
  "infrastructure/supabase/seed/05_enamed_2025_questions.sql"
  "infrastructure/supabase/seed/06_cip_sample_data.sql"
  "infrastructure/supabase/seed/07_fcr_cases.sql"
  "infrastructure/supabase/seed/ddl_questions_pilot.sql"
  "infrastructure/supabase/seed/qgen_misconceptions.sql"
  "infrastructure/supabase/seed/pilot_test_data.sql"
  "infrastructure/supabase/seed/expansion/flashcard_decks_system.sql"
  "infrastructure/supabase/seed/expansion/flashcards_clinica_medica_200.sql"
  "infrastructure/supabase/seed/expansion/flashcards_cirurgia_200.sql"
  "infrastructure/supabase/seed/expansion/flashcards_ginecologia_200.sql"
  "infrastructure/supabase/seed/expansion/flashcards_pediatria_200.sql"
  "infrastructure/supabase/seed/expansion/flashcards_saude_coletiva_200.sql"
  "infrastructure/supabase/seed/expansion/fcr_cases_expansion.sql"
  "infrastructure/supabase/seed/expansion/ddl_cirurgia_20.sql"
  "infrastructure/supabase/seed/expansion/ddl_clinica_medica_20.sql"
  "infrastructure/supabase/seed/expansion/ddl_ginecologia_obstetricia_20.sql"
  "infrastructure/supabase/seed/expansion/ddl_pediatria_20.sql"
  "infrastructure/supabase/seed/expansion/ddl_saude_coletiva_20.sql"
  "infrastructure/supabase/seed/expansion/study_paths_new.sql"
  "infrastructure/supabase/seed/expansion/study_modules_new.sql"
)

for file in "${SEED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "[db] WARN missing seed: $file"
    continue
  fi

  echo "[db] seed: $(basename "$file")"
  set +e
  PGPASSWORD="$DB_PASSWORD" PGSSLMODE=require \
    psql "host=$DB_HOST port=5432 user=postgres dbname=postgres sslmode=require" \
    -v ON_ERROR_STOP=1 \
    -f "$file" >/dev/null
  code="$?"
  set -e

  if [ "$code" -ne 0 ]; then
    echo "[db] WARN seed failed (continuing): $(basename "$file")"
  fi
done

echo "[db] Importing Darwin-MFC medical content…"
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
pnpm seed:medical-content

echo "[db] Done."
