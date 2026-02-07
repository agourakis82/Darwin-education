#!/bin/bash
# Apply CIP Achievements migration to Supabase

set -e

echo "🧩 CIP Achievements Migration Script"
echo "======================================"
echo ""

# Check if SQL file exists
if [ ! -f "scripts/cip-achievements-schema.sql" ]; then
    echo "❌ Error: scripts/cip-achievements-schema.sql not found"
    exit 1
fi

# Try to get Supabase URL from env
if [ -f "apps/web/.env.local" ]; then
    export $(grep NEXT_PUBLIC_SUPABASE_URL apps/web/.env.local | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found"
    echo "   Please set it in apps/web/.env.local or export it"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo "📍 Project: $PROJECT_REF"
echo "🔗 URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Check if user is logged in to Supabase CLI
if ! supabase projects list &>/dev/null; then
    echo "⚠️  Not logged in to Supabase CLI"
    echo ""
    echo "Please run: supabase login"
    echo ""
    echo "Then run this script again, OR manually apply the migration:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: scripts/cip-achievements-schema.sql"
    echo "3. Paste and click 'Run'"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI is authenticated"
echo ""

# Link project if not already linked
if [ ! -f "infrastructure/supabase/.branches/_current_branch" ]; then
    echo "🔗 Linking Supabase project..."
    cd infrastructure/supabase
    supabase link --project-ref $PROJECT_REF
    cd ../..
fi

# Apply migration using Supabase CLI
echo "📤 Applying CIP achievements migration..."
echo ""

cd infrastructure/supabase

# Use db execute to run the SQL file
if supabase db execute --file ../../scripts/cip-achievements-schema.sql --project-ref $PROJECT_REF; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run: pnpm tsx scripts/setup-cip-data-full.ts"
    echo "2. Test at: $NEXT_PUBLIC_SUPABASE_URL/cip"
else
    echo ""
    echo "❌ Migration failed"
    echo ""
    echo "Manual fallback:"
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: scripts/cip-achievements-schema.sql"
    echo "3. Paste and click 'Run'"
fi

cd ../..
