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
  const { count: total } = await s.from('questions').select('*', { count: 'exact', head: true })

  // Fetch all questions in pages of 1000
  let allQ: any[] = []
  let offset = 0
  const PAGE = 1000
  while (true) {
    const { data } = await s.from('questions').select('area, explanation').range(offset, offset + PAGE - 1)
    if (!data || data.length === 0) break
    allQ = allQ.concat(data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  let good = 0
  const areaStats: Record<string, { total: number; curated: number }> = {}
  for (const q of allQ) {
    if (!areaStats[q.area]) areaStats[q.area] = { total: 0, curated: 0 }
    areaStats[q.area].total++
    if (q.explanation && q.explanation.length > 50 && !q.explanation.includes('em elaboração')) {
      areaStats[q.area].curated++
      good++
    }
  }

  console.log('=== DATABASE STATUS ===')
  console.log('Total questions:', total)
  console.log('With quality explanations:', good)
  console.log('Missing explanations:', (total || 0) - good)
  console.log('')
  console.log('=== BY AREA ===')
  for (const [area, stats] of Object.entries(areaStats)) {
    const pct = Math.round((stats.curated / stats.total) * 100)
    console.log(`${area}: ${stats.curated}/${stats.total} curated (${pct}%)`)
  }
}

main()
