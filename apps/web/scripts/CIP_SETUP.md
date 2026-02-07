# CIP (Clinical Integrative Puzzle) Setup Guide

This guide will help you set up the CIP feature for your beta testers.

## Prerequisites

1. Supabase project set up and running
2. Environment variables configured in `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

## Setup Steps

### 1. Run the Database Migration

The CIP schema needs to be created in your Supabase database. You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire CIP schema from the migration file you received
5. Run the query

The schema includes these tables:
- `cip_diagnoses` - Medical diagnoses
- `cip_findings` - Clinical findings (symptoms, signs, lab results, treatments)
- `cip_diagnosis_findings` - Links diagnoses to their findings
- `cip_puzzles` - Puzzle definitions
- `cip_puzzle_grid` - Correct answers for each puzzle cell
- `cip_attempts` - User attempts and scores

#### Option B: Using Supabase CLI

If you have Supabase CLI installed:
```bash
cd /path/to/Darwin-education
supabase db push
```

### 2. Populate Sample Data

Run the setup script to add sample puzzles:

```bash
cd apps/web
npx tsx scripts/setup-cip-data.ts
```

This will create:
- 4 sample diagnoses (Diabetes, Hipertensão, Pneumonia, Apendicite)
- 16 clinical findings across 4 sections
- 1 practice puzzle with "Fácil" difficulty

### 3. Test the Feature

1. Start your development server: `pnpm dev`
2. Navigate to `/cip` to see the CIP main page
3. Click on "Puzzle Rápido" or go to `/cip/pratica?difficulty=facil`
4. You should be redirected to the practice puzzle
5. Try solving it and submitting!

## Troubleshooting

### "CIP tables not found" Error

Make sure you've run the database migration (Step 1). The script needs the tables to exist first.

### "No puzzles available" Message

This means Step 2 (populating data) hasn't been completed yet. Run the setup script.

### Permission Denied

Make sure your Supabase anon key has the right permissions. The RLS policies should allow:
- Public read access to `cip_diagnoses`, `cip_findings`, and `cip_puzzles`
- Authenticated users can create/read/update their own `cip_attempts`

## Adding More Puzzles

To add more puzzles for different difficulty levels, you can:

1. **Manual Entry**: Use the Supabase dashboard to insert data into the tables
2. **Extend the Script**: Modify `scripts/setup-cip-data.ts` to create additional puzzles
3. **Future**: Use the puzzle generator (requires medical data integration)

## What Your Beta Testers Will See

1. **Main Page** (`/cip`):
   - "How it works" explanation
   - Quick action buttons for different difficulty levels
   - List of available puzzles
   - Recent attempts history

2. **Puzzle Page** (`/cip/[puzzleId]`):
   - Grid with diagnoses (rows) × sections (columns)
   - Timer
   - Progress indicator
   - Option selection modal

3. **Results Page** (`/cip/[puzzleId]/result`):
   - TRI-based score (0-1000 scale)
   - Pass/fail status (600 threshold)
   - Performance breakdown by section
   - Performance breakdown by diagnosis
   - Option to review the grid with correct/incorrect answers

## Next Steps

After basic testing works:

1. Add more puzzles with varying difficulties
2. Integrate with `@darwin-mfc/medical-data` package for rich medical content
3. Enable dynamic puzzle generation
4. Add achievements for completing puzzles
5. Track progression over time
