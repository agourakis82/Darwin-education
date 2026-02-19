#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="apps/web/.env.local"
WORKDIR="infrastructure/supabase"
PROJECT_REF_FILE="$WORKDIR/supabase/.temp/project-ref"

if [ ! -f "$ENV_FILE" ]; then
  echo "[db] Missing $ENV_FILE"
  echo "[db] Create it from apps/web/.env.example and add Supabase credentials."
  exit 1
fi

SUPABASE_CLI=("$ROOT_DIR/apps/web/node_modules/.bin/supabase")

if [ ! -x "${SUPABASE_CLI[0]}" ]; then
  echo "[db] Supabase CLI not found at: ${SUPABASE_CLI[0]}"
  echo "[db] Run: pnpm --filter @darwin-education/web install"
  exit 1
fi

echo "[db] Checking Supabase CLI auth..."
set +e
"${SUPABASE_CLI[@]}" projects list --output json >/dev/null 2>&1
AUTH_CODE="$?"
set -e

if [ "$AUTH_CODE" -ne 0 ]; then
  echo "[db] Supabase CLI is not authenticated."
  echo "[db] Fix one of the following, then re-run this script:"
  echo "[db]   - Run: ./apps/web/node_modules/.bin/supabase login"
  echo "[db]   - Or export SUPABASE_ACCESS_TOKEN=... and re-run"
  exit 1
fi

PROJECT_REF="$(node -e "const fs=require('fs');const env=fs.readFileSync(process.argv[1],'utf8');const m=env.match(/^NEXT_PUBLIC_SUPABASE_URL\\s*=\\s*(.+)\\s*$/m);const raw=(m?m[1]:'').trim().replace(/^['\\\"]|['\\\"]$/g,'');let ref='';try{ref=new URL(raw).hostname.split('.')[0]}catch{};process.stdout.write(ref);" "$ENV_FILE")"

if [ -z "$PROJECT_REF" ]; then
  echo "[db] NEXT_PUBLIC_SUPABASE_URL missing/invalid in $ENV_FILE"
  exit 1
fi

if [ ! -f "$PROJECT_REF_FILE" ]; then
  echo "[db] Linking project: $PROJECT_REF"
  echo "[db] (Supabase CLI may prompt for the database password in the terminal.)"
  "${SUPABASE_CLI[@]}" link --workdir "$WORKDIR" --project-ref "$PROJECT_REF"
fi

echo "[db] Pushing migrations..."
"${SUPABASE_CLI[@]}" db push --workdir "$WORKDIR" --linked --yes

echo "[db] Importing Darwin-MFC medical content..."
set -a
source "$ENV_FILE"
set +a
pnpm seed:medical-content

echo "[db] Done."
