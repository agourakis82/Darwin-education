#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load env
const ROOT = join(__dirname, '..')
try {
  const envFile = readFileSync(join(ROOT, 'apps/web/.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx)
        const value = trimmed.slice(eqIdx + 1)
        if (!process.env[key]) process.env[key] = value
      }
    }
  }
} catch { /* ignore */ }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  // Sample explanations that are short or low quality
  let allQ: any[] = []
  let offset = 0
  const PAGE = 1000
  while (true) {
    const { data } = await s.from('questions').select('id, area, explanation').range(offset, offset + PAGE - 1)
    if (!data || data.length === 0) break
    allQ = allQ.concat(data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  // Categorize explanations
  let nullCount = 0
  let emptyCount = 0
  let emElaboracaoCount = 0
  let shortCount = 0 // <50 chars but not null/empty/em elaboração
  let goodCount = 0
  const shortSamples: string[] = []

  for (const q of allQ) {
    if (q.explanation === null) {
      nullCount++
    } else if (q.explanation === '') {
      emptyCount++
    } else if (q.explanation.includes('em elaboração')) {
      emElaboracaoCount++
    } else if (q.explanation.length <= 50) {
      shortCount++
      if (shortSamples.length < 5) {
        shortSamples.push(`[${q.area}] "${q.explanation}" (${q.explanation.length} chars)`)
      }
    } else {
      goodCount++
    }
  }

  console.log('=== EXPLANATION ANALYSIS ===')
  console.log(`Total: ${allQ.length}`)
  console.log(`NULL: ${nullCount}`)
  console.log(`Empty string: ${emptyCount}`)
  console.log(`"em elaboração": ${emElaboracaoCount}`)
  console.log(`Short (<50 chars): ${shortCount}`)
  console.log(`Good (>50 chars): ${goodCount}`)
  console.log('')
  console.log('=== SHORT SAMPLES ===')
  for (const s of shortSamples) {
    console.log(s)
  }

  // Check a few "good" ones from our curation vs existing
  const { data: sample } = await s.from('questions')
    .select('id, area, explanation')
    .not('explanation', 'is', null)
    .gt('explanation', '')
    .limit(3)
    .order('id', { ascending: true })

  console.log('')
  console.log('=== SAMPLE EXISTING EXPLANATIONS ===')
  for (const q of sample || []) {
    if (q.explanation && !q.explanation.includes('em elaboração')) {
      console.log(`[${q.area}] ${q.id}: ${q.explanation.substring(0, 100)}... (${q.explanation.length} chars)`)
    }
  }
}

main()
