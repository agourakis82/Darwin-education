# Apply CIP Achievements Migration

Since the Supabase CLI is having path/migration history issues, here's the **simplest way** to apply the achievements system:

## Quick Method (Recommended)

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye/sql/new
   ```

2. **Copy the entire SQL file**:
   ```bash
   cat scripts/cip-achievements-schema.sql | pbcopy  # macOS
   # OR
   cat scripts/cip-achievements-schema.sql | xclip -selection clipboard  # Linux
   # OR just open the file and copy manually
   ```

3. **Paste into SQL Editor and click "Run"**

4. **Done!** Then run:
   ```bash
   pnpm tsx scripts/setup-cip-data-full.ts
   ```

---

## Alternative: Command Line (If you have DB password)

If you have your database password from Supabase dashboard:

```bash
# Set your database password
export PGPASSWORD="your-db-password-from-supabase-dashboard"

# Apply the migration
psql -h db.jpzkjkwcoudaxscrukye.supabase.co \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f scripts/cip-achievements-schema.sql

# Populate data
pnpm tsx scripts/setup-cip-data-full.ts
```

---

## What This Migration Does

- Creates `cip_achievements` table (19 pre-configured achievements)
- Creates `user_cip_achievements` table (tracks user progress)
- Creates `check_cip_achievements()` function (auto-detection)
- Creates trigger to auto-check achievements after puzzle completion
- Creates helper views for easy querying
- Sets up RLS policies

**File**: `scripts/cip-achievements-schema.sql` (237 lines)
