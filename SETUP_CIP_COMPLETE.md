# 🧩 Complete CIP Setup Guide

You need to run **TWO** SQL migrations in order:

## Step 1: Main CIP Schema (REQUIRED FIRST)

**Open SQL Editor:**
```
https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye/sql/new
```

**Copy and paste this file:**
```
scripts/cip-schema-migration.sql
```

**Click "Run"**

This creates the 6 core CIP tables:
- `cip_findings` - Clinical findings
- `cip_diagnoses` - Medical diagnoses
- `cip_diagnosis_findings` - Mapping table
- `cip_puzzles` - Puzzle metadata
- `cip_puzzle_grid` - Puzzle grids (correct answers)
- `cip_attempts` - User attempts and scores

---

## Step 2: Achievements System (AFTER Step 1)

**In the same SQL Editor, click "New query"**

**Copy and paste this file:**
```
scripts/cip-achievements-schema.sql
```

**Click "Run"**

This adds:
- `cip_achievements` - Achievement definitions (19 achievements)
- `user_cip_achievements` - User progress
- Auto-detection function and trigger

---

## Step 3: Populate Sample Data

After both SQL migrations succeed, run:

```bash
pnpm tsx scripts/setup-cip-data-full.ts
```

This will insert:
- 15 diagnoses (all ENAMED areas)
- 70+ clinical findings
- 10 puzzles (Muito Fácil → Difícil)

---

## Verify Installation

Check that everything worked:

```sql
-- Should show 6 main tables + 2 achievement tables = 8 total
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'cip_%'
ORDER BY table_name;

-- Should show 10 puzzles
SELECT difficulty, COUNT(*)
FROM cip_puzzles
GROUP BY difficulty;

-- Should show 19 achievements
SELECT COUNT(*) FROM cip_achievements WHERE is_active = true;
```

---

## Quick Copy Commands

**Copy CIP schema:**
```bash
cat scripts/cip-schema-migration.sql
```

**Copy achievements schema:**
```bash
cat scripts/cip-achievements-schema.sql
```

---

## Order Matters!

❌ **Wrong**: Achievements first → ERROR (tables don't exist)
✅ **Right**: Main CIP schema → Then achievements → Then data

---

**Ready?** Start with Step 1 (cip-schema-migration.sql) in your SQL Editor!
