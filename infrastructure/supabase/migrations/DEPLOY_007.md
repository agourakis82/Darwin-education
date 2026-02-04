# Deploy Theory Generation System Migration (007)

## Quick Deployment via Supabase SQL Editor

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Darwin Education project
3. Click **SQL Editor** in the left sidebar
4. Click **"+ New query"**

### Step 2: Copy and Run Migration

```bash
# Copy the migration SQL to your clipboard
cat infrastructure/supabase/migrations/007_theory_generation_system.sql | pbcopy

# Or on Linux:
cat infrastructure/supabase/migrations/007_theory_generation_system.sql | xclip -selection clipboard
```

Or manually open the file:
```
infrastructure/supabase/migrations/007_theory_generation_system.sql
```

### Step 3: Execute in Supabase

1. Paste the entire SQL into the SQL Editor
2. Click **Run** (or press Ctrl/Cmd + Enter)
3. Wait for execution to complete (should take ~2-3 seconds)

### Step 4: Verify Deployment

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'theory_%'
ORDER BY table_name;
```

Expected tables (10 total):
- ✅ theory_topics_generated
- ✅ theory_citations
- ✅ theory_topic_citations
- ✅ theory_research_cache
- ✅ theory_generation_jobs
- ✅ theory_generation_job_topics
- ✅ theory_validation_results
- ✅ citation_verification_audit
- ✅ hallucination_audit
- ✅ citation_provenance_audit

### Step 5: Test with Sample Data

Insert a test topic to verify the schema works:

```sql
INSERT INTO theory_topics_generated (
  topic_id,
  title,
  description,
  area,
  difficulty,
  definition,
  key_points,
  source_type,
  status
) VALUES (
  'test-migration-007',
  'Test Topic - Migration 007',
  'Test topic to verify migration deployment',
  'clinica_medica',
  'basico',
  'This is a test definition to verify the schema is working correctly.',
  ARRAY['Test point 1', 'Test point 2', 'Test point 3'],
  'manual',
  'draft'
) RETURNING id, topic_id, title, status;
```

If this succeeds, the migration is deployed correctly!

---

## Alternative: Supabase CLI Deployment

If you have the Supabase CLI installed:

```bash
# Install CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## What This Migration Creates

### Core Tables (7)
1. **theory_topics_generated** - Generated theory topics with 8 content sections
2. **theory_citations** - Citations with evidence levels (A/B/C)
3. **theory_topic_citations** - Links citations to specific topic sections
4. **theory_research_cache** - Caches research results (7-day TTL)
5. **theory_generation_jobs** - Tracks batch generation jobs
6. **theory_generation_job_topics** - Individual topic results in batches
7. **theory_validation_results** - 5-stage validation pipeline results

### Audit Tables (3)
8. **citation_verification_audit** - Tracks citation verification (accessibility, title match, authority)
9. **hallucination_audit** - Tracks AI hallucination detection for medical claims
10. **citation_provenance_audit** - Maps specific claims to supporting citations

### Features
- ✅ Row-Level Security (RLS) policies
- ✅ Indexes for query performance
- ✅ Audit trail triggers
- ✅ Constraints for data validation
- ✅ Auto-cleanup for expired cache

---

## Troubleshooting

### Error: "relation already exists"
Some tables might already exist. You can either:
- Drop existing tables: `DROP TABLE IF EXISTS theory_topics_generated CASCADE;`
- Or skip CREATE TABLE statements that fail

### Error: "permission denied"
Make sure you're logged in as a Supabase admin or using the service_role key.

### Error: "syntax error"
Check that you copied the entire migration file, including all semicolons.

---

## Next Steps After Deployment

1. **Test the API endpoint**: `POST /api/theory-gen/generate`
2. **Generate first topic**: Use Darwin-MFC disease data
3. **Verify validation pipeline**: Check 5-stage validation scores
4. **Review audit trails**: Examine citation verification and hallucination detection

🎉 Ready to generate 100+ evidence-based medical theory topics!
