#!/bin/bash

# Supabase Migration Deployment Script
# This script uses Supabase CLI to deploy migrations automatically

set -e

echo "🚀 Supabase Migration Deployment"
echo "================================"
echo ""

# Project details
PROJECT_REF="jpzkjkwcoudaxscrukye"
SUPABASE_URL="https://jpzkjkwcoudaxscrukye.supabase.co"
MIGRATIONS_DIR="infrastructure/supabase/supabase/migrations"

echo "📍 Project: $PROJECT_REF"
echo "📁 Migrations: $MIGRATIONS_DIR"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📦 Supabase CLI version:"
supabase --version
echo ""

# Method 1: Try using the access token if provided
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
    echo ""
    echo "🔑 To authenticate, run:"
    echo ""
    echo "   supabase login"
    echo ""
    echo "This will open a browser window for authentication."
    echo "Your access token will be saved automatically."
    echo ""

    # Try to link anyway
    cd infrastructure/supabase

    echo "🔗 Linking to project..."
    supabase link --project-ref $PROJECT_REF || {
        echo ""
        echo "❌ Could not link. Please run 'supabase login' first."
        exit 1
    }
else
    echo "✅ SUPABASE_ACCESS_TOKEN is set"
    cd infrastructure/supabase
fi

echo ""
echo "📤 Pushing migrations..."
echo ""

# Push migrations
supabase db push

echo ""
echo "✅ Migration deployment complete!"
echo ""
echo "📊 Verifying tables..."
echo ""

# Verify tables via curl
HEADERS='-H "apikey: '$SUPABASE_ANON_KEY'" -H "Authorization: Bearer '$SUPABASE_SERVICE_ROLE_KEY'"

tables=(
    "theory_topics_generated"
    "theory_citations"
    "theory_topic_citations"
    "theory_research_cache"
    "theory_generation_jobs"
    "theory_generation_job_topics"
    "theory_validation_results"
)

for table in "${tables[@]}"; do
    response=$(curl -s "$SUPABASE_URL/rest/v1/$table?select=count&limit=0" $HEADERS)
    if echo "$response" | grep -q "\"count\":"; then
        echo "  ✅ $table"
    else
        echo "  ❓ $table (verify manually)"
    fi
done

echo ""
echo "🎉 Ready for theory generation!"
echo ""
echo "Next steps:"
echo "  1. Test API: curl -X POST http://localhost:3001/api/theory-gen/generate"
echo "  2. Check database: Supabase Dashboard > Editor > Select theory_topics_generated"
echo "  3. Generate topics: POST /api/theory-gen/generate with { topicTitle, area }"
