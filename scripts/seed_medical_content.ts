#!/usr/bin/env tsx
/**
 * Seed medical content from darwin-MFC into Supabase medical_diseases table.
 * Upserts on title+cid10 to avoid duplicates.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/seed_medical_content.ts
 */

import { createClient } from '@supabase/supabase-js'
import path from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// categoria → enamed_area mapping derived from existing data
const CATEGORIA_TO_AREA: Record<string, string> = {
  cardiovascular: 'clinica_medica',
  dermatologico: 'clinica_medica',
  endocrino: 'clinica_medica',
  gastrointestinal: 'cirurgia',
  ginecologico: 'ginecologia_obstetricia',
  obstetrico: 'ginecologia_obstetricia',
  hematologico: 'clinica_medica',
  infecciosas: 'clinica_medica',
  metabolico: 'clinica_medica',
  musculoesqueletico: 'clinica_medica',
  neurologico: 'clinica_medica',
  pediatrico: 'pediatria',
  respiratorio: 'clinica_medica',
  saude_mental: 'clinica_medica',
  urologico: 'cirurgia',
  nefrologico: 'clinica_medica',
  reumatologico: 'clinica_medica',
  oftalmologico: 'clinica_medica',
  otorrinolaringologico: 'clinica_medica',
  outros: 'saude_coletiva',
}

function toEnamedArea(categoria?: string): string {
  if (!categoria) return 'clinica_medica'
  const normalized = categoria.toLowerCase().replace(/[^a-z_]/g, '_')
  return CATEGORIA_TO_AREA[normalized] ?? 'clinica_medica'
}

function buildSearchTerms(d: any): string {
  const parts: string[] = []
  if (d.titulo) parts.push(d.titulo)
  if (d.sinonimos?.length) parts.push(...d.sinonimos)
  if (d.cid10?.length) parts.push(...d.cid10)
  if (d.ciap2?.length) parts.push(...d.ciap2)
  if (d.categoria) parts.push(d.categoria)
  if (d.tags?.length) parts.push(...d.tags)
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function buildSummary(d: any): string {
  // Try quickView.definicao first
  const def = d.quickView?.definicao || d.fullContent?.epidemiologia?.prevalencia
  if (def && typeof def === 'string' && def.length > 20) {
    return def.length > 500 ? def.slice(0, 497) + '...' : def
  }
  return `${d.titulo} — doença com relevância clínica no contexto ENAMED.`
}

async function main() {
  console.log('🔬 Seeding medical diseases from darwin-MFC...\n')

  // Dynamically import darwin-MFC data
  const darwinMFCPath = path.resolve(__dirname, '../darwin-MFC/lib/data/doencas/index')
  let doencasConsolidadas: any[]
  try {
    const mod = await import(darwinMFCPath)
    doencasConsolidadas = mod.doencasConsolidadas ?? mod.default ?? []
  } catch (err) {
    console.error('❌ Failed to import darwin-MFC data:', err)
    process.exit(1)
  }

  console.log(`📦 darwin-MFC total: ${doencasConsolidadas.length} diseases`)

  // Get existing titles from DB to skip
  const { data: existing } = await supabase
    .from('medical_diseases')
    .select('title')
    .limit(2000)

  const existingTitles = new Set((existing ?? []).map((r: any) => r.title.toLowerCase().trim()))
  console.log(`📊 Already in DB: ${existingTitles.size}`)

  // Build rows to insert
  const rows = doencasConsolidadas
    .filter((d: any) => d?.id && d?.titulo)
    .filter((d: any) => !existingTitles.has(d.titulo.toLowerCase().trim()))
    .map((d: any) => ({
      title: d.titulo,
      enamed_area: toEnamedArea(d.categoria),
      categoria: d.categoria ?? 'outros',
      subcategoria: d.subcategoria ?? null,
      cid10: Array.isArray(d.cid10) ? d.cid10 : d.cid10 ? [d.cid10] : [],
      summary: buildSummary(d),
      search_terms: buildSearchTerms(d),
      payload: d,
    }))

  console.log(`🆕 New diseases to insert: ${rows.length}\n`)

  if (rows.length === 0) {
    console.log('✅ Nothing to seed — all diseases already present.')
    return
  }

  // Insert in batches of 50
  const BATCH = 50
  let inserted = 0
  let errors = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('medical_diseases')
      .insert(batch)

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
      errors++
    } else {
      inserted += batch.length
      process.stdout.write(`\r  Inserted: ${inserted}/${rows.length}`)
    }
  }

  console.log(`\n\n✅ Done. Inserted: ${inserted}, Errors: ${errors}`)

  // Final count
  const { count } = await supabase
    .from('medical_diseases')
    .select('id', { count: 'exact', head: true })
  console.log(`📊 Total diseases in DB: ${count}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
