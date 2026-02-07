# 🚀 Quick Start - CIP Feature

## Step 1: Create Database Tables (2 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `scripts/cip-schema-migration.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: ✅ Success. No rows returned

## Step 2: Populate Sample Data (30 seconds)

Run from the project root:

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://jpzkjkwcoudaxscrukye.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ro1Bnlk1dUmK3G8dDi78_g_tNFWCAn2
pnpm tsx scripts/setup-cip-data.ts
```

You should see:
```
🚀 Setting up CIP sample data...
✅ Inserted 4 diagnoses
✅ Inserted 16 findings
✅ Created practice puzzle
✨ CIP setup complete!
```

## Step 3: Test It! (1 minute)

```bash
pnpm dev
```

Open: http://localhost:3000/cip

Click **"Puzzle Rápido"** and you're in! 🎉

---

**That's it!** The CIP feature is now fully functional for your beta testers.
