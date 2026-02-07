#!/usr/bin/env tsx
/**
 * Darwin Education - Platform Population Script
 *
 * This script generates a combined SQL file with all seed data in the correct
 * order, then verifies the data was populated correctly via Supabase REST API.
 *
 * Usage:
 *   # Step 1: Generate combined SQL
 *   pnpm tsx scripts/populate-platform.ts generate
 *
 *   # Step 2: Paste the generated SQL into Supabase SQL Editor and run it
 *   # Or use psql: psql $DATABASE_URL < scripts/populate-all.sql
 *
 *   # Step 3: Verify data counts
 *   pnpm tsx scripts/populate-platform.ts verify
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')

// Load env from apps/web/.env.local
function loadEnv() {
  try {
    const envFile = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf-8')
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.+)$/)
      if (match) {
        process.env[match[1]] = match[2]
      }
    }
  } catch {
    // .env.local not found
  }
}

// SQL files in execution order (respects FK dependencies)
const SQL_FILES = [
  {
    path: 'infrastructure/supabase/seed/01_question_banks.sql',
    name: 'Question Banks (12 banks)',
    phase: 1,
  },
  {
    path: 'infrastructure/supabase/seed/03_achievements.sql',
    name: 'Achievements (41 achievements)',
    phase: 2,
  },
  {
    path: 'infrastructure/supabase/seed/04_study_paths.sql',
    name: 'Study Paths (6 paths + 14 modules)',
    phase: 3,
  },
  {
    path: 'infrastructure/supabase/seed/02_sample_questions.sql',
    name: 'Sample Questions (50 questions)',
    phase: 4,
  },
  {
    path: 'infrastructure/supabase/seed/05_enamed_2025_questions.sql',
    name: 'ENAMED 2025 Official Questions (90 questions)',
    phase: 5,
  },
  {
    path: 'scripts/cip-full-puzzles-fixed.sql',
    name: 'CIP Puzzles (10 diagnoses + 63 findings + 9 puzzles)',
    phase: 6,
  },
  {
    path: 'scripts/cip-leaderboard-schema.sql',
    name: 'CIP Leaderboard Views + Trigger',
    phase: 7,
  },
  {
    path: 'scripts/cip-achievements-safe.sql',
    name: 'CIP Achievements (19 achievements)',
    phase: 8,
  },
]

function generateCombinedSQL() {
  console.log('\n=== Darwin Education - Platform Population ===\n')
  console.log('Generating combined SQL file...\n')

  const parts: string[] = []

  parts.push('-- ============================================================')
  parts.push('-- Darwin Education - Combined Population SQL')
  parts.push(`-- Generated: ${new Date().toISOString()}`)
  parts.push('-- Execute this file in Supabase SQL Editor or via psql')
  parts.push('-- ============================================================\n')

  for (const file of SQL_FILES) {
    const filePath = join(ROOT, file.path)
    try {
      const content = readFileSync(filePath, 'utf-8')
      parts.push(`-- ============================================================`)
      parts.push(`-- Phase ${file.phase}: ${file.name}`)
      parts.push(`-- Source: ${file.path}`)
      parts.push(`-- ============================================================\n`)
      parts.push(content)
      parts.push('\n')
      console.log(`  [OK] Phase ${file.phase}: ${file.name}`)
    } catch (err) {
      console.error(`  [SKIP] Phase ${file.phase}: ${file.name} - File not found`)
    }
  }

  // Add verification query at the end
  parts.push('\n-- ============================================================')
  parts.push('-- Verification: Check data counts')
  parts.push('-- ============================================================\n')
  parts.push(`SELECT 'question_banks' as tabela, COUNT(*) as registros FROM question_banks`)
  parts.push(`UNION ALL SELECT 'questions', COUNT(*) FROM questions`)
  parts.push(`UNION ALL SELECT 'achievements', COUNT(*) FROM achievements`)
  parts.push(`UNION ALL SELECT 'study_paths', COUNT(*) FROM study_paths`)
  parts.push(`UNION ALL SELECT 'study_modules', COUNT(*) FROM study_modules`)
  parts.push(`UNION ALL SELECT 'cip_diagnoses', COUNT(*) FROM cip_diagnoses`)
  parts.push(`UNION ALL SELECT 'cip_findings', COUNT(*) FROM cip_findings`)
  parts.push(`UNION ALL SELECT 'cip_puzzles', COUNT(*) FROM cip_puzzles`)
  parts.push(`UNION ALL SELECT 'cip_puzzle_grid', COUNT(*) FROM cip_puzzle_grid`)
  parts.push(`ORDER BY tabela;`)

  const combined = parts.join('\n')
  const outputPath = join(ROOT, 'scripts/populate-all.sql')
  writeFileSync(outputPath, combined, 'utf-8')

  console.log(`\n  Combined SQL written to: scripts/populate-all.sql`)
  console.log(`  Size: ${(combined.length / 1024).toFixed(1)} KB\n`)

  console.log('=== Next Steps ===\n')
  console.log('Option A: Supabase SQL Editor (recommended)')
  console.log('  1. Open: https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye/sql/new')
  console.log('  2. Paste the contents of scripts/populate-all.sql')
  console.log('  3. Click "Run"\n')
  console.log('Option B: psql (if you have direct DB access)')
  console.log('  psql $DATABASE_URL < scripts/populate-all.sql\n')
  console.log('After running, verify with:')
  console.log('  pnpm tsx scripts/populate-platform.ts verify\n')
}

async function verifyData() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in apps/web/.env.local')
    process.exit(1)
  }

  const { createClient } = await import('../apps/web/node_modules/@supabase/supabase-js/dist/index.mjs')
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\n=== Darwin Education - Data Verification ===\n')

  const tables = [
    { name: 'question_banks', expected: 13 },
    { name: 'questions', expected: 140 },
    { name: 'achievements', expected: 41 },
    { name: 'study_paths', expected: 6 },
    { name: 'study_modules', expected: 14 },
    { name: 'cip_diagnoses', expected: 10 },
    { name: 'cip_findings', expected: 63 },
    { name: 'cip_puzzles', expected: 9 },
    { name: 'cip_puzzle_grid', expected: 27 },
    { name: 'ddl_questions', expected: 5 },
  ]

  let allGood = true

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name as never)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`  [ ? ] ${table.name.padEnd(20)} Error: ${error.message}`)
        allGood = false
        continue
      }

      const actual = count ?? 0
      const status = actual >= table.expected ? 'OK' : 'LOW'
      const icon = status === 'OK' ? 'OK' : '!!'
      console.log(
        `  [${icon}] ${table.name.padEnd(20)} ${String(actual).padStart(4)} / ${String(table.expected).padStart(4)} expected`
      )
      if (status !== 'OK') allGood = false
    } catch (err) {
      console.log(`  [ ? ] ${table.name.padEnd(20)} Query failed`)
      allGood = false
    }
  }

  console.log('')
  if (allGood) {
    console.log('  All tables populated correctly!\n')
  } else {
    console.log('  Some tables need attention. Run the populate SQL first.\n')
  }
}

// Main
const command = process.argv[2] || 'generate'

if (command === 'generate') {
  generateCombinedSQL()
} else if (command === 'verify') {
  verifyData().catch(console.error)
} else {
  console.log('Usage:')
  console.log('  pnpm tsx scripts/populate-platform.ts generate  # Create combined SQL')
  console.log('  pnpm tsx scripts/populate-platform.ts verify    # Verify data counts')
}
