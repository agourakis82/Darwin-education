#!/usr/bin/env tsx
/**
 * Auditoria de Qualidade - Banco de Questões
 * Execute: pnpm tsx scripts/audit_questions.ts
 * Ou: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/audit_questions.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load environment variables from apps/web/.env.local
function loadEnvFile() {
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
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    }
  } catch {
    // .env.local not found - rely on shell environment
  }
}

loadEnvFile()

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Env vars não configuradas!')
  console.error('Configure: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function header(title: string) {
  log('\n' + '='.repeat(60), colors.cyan)
  log(title, colors.bright + colors.cyan)
  log('='.repeat(60), colors.cyan)
}

async function runQuery(sql: string, description?: string) {
  if (description) {
    log(`\n📊 ${description}`, colors.blue)
  }
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) {
    log(`❌ Erro: ${error.message}`, colors.red)
    return null
  }
  return data
}

async function main() {
  header('AUDITORIA DE QUALIDADE - BANCO DE QUESTÕES')
  log(`Data: ${new Date().toISOString().split('T')[0]}`, colors.cyan)

  // 1. Resumo Executivo
  header('1. RESUMO EXECUTIVO')

  const { data: totalData, error: totalError } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })

  if (!totalError) {
    const total = totalData || 0
    log(`Total de Questões: ${total}`, colors.bright)

    if (total === 0) {
      log('⚠️  BANCO VAZIO - Execute os seeds primeiro!', colors.yellow)
      return
    }
  }

  // 2. Distribuição por Área
  header('2. DISTRIBUIÇÃO POR ÁREA (Meta: 50 por área)')

  const { data: areaData } = await supabase
    .from('questions')
    .select('area')

  if (areaData) {
    const areaCounts = areaData.reduce((acc: Record<string, number>, q: any) => {
      acc[q.area] = (acc[q.area] || 0) + 1
      return acc
    }, {})

    const areaNames = {
      clinica_medica: 'Clínica Médica',
      cirurgia: 'Cirurgia',
      ginecologia_obstetricia: 'Ginecologia/Obstetrícia',
      pediatria: 'Pediatria',
      saude_coletiva: 'Saúde Coletiva',
    }

    const sorted = Object.entries(areaCounts).sort((a, b) => a[1] - b[1])

    log('\n' + 'Área'.padEnd(30) + 'Atual  Meta  Faltam  Status')
    log('-'.repeat(70))

    for (const [area, count] of sorted) {
      const name = areaNames[area as keyof typeof areaNames] || area
      const gap = Math.max(0, 50 - Number(count))
      const pct = Math.round((Number(count) / 50) * 100)

      let status = '🔴 CRÍTICO'
      let color = colors.red
      if (Number(count) >= 50) {
        status = '✅ META'
        color = colors.green
      } else if (Number(count) >= 40) {
        status = '🟡 PRÓXIMO'
        color = colors.yellow
      } else if (Number(count) >= 30) {
        status = '🟠 EXPANSÃO'
        color = colors.yellow
      }

      log(
        name.padEnd(30) +
        String(count).padStart(5) +
        '   50' +
        String(gap).padStart(7) +
        `  ${pct}%`.padStart(7) +
        `  ${status}`,
        color
      )
    }
  }

  // 3. Questões sem Explicação Completa
  header('3. QUESTÕES SEM EXPLICAÇÃO COMPLETA')

  const { data: noExplanation } = await supabase
    .from('questions')
    .select('id, area, explanation')
    .or('explanation.like.%em elaboração%,explanation.like.%Explicação em elaboração%')

  const shortExplanation = await supabase
    .from('questions')
    .select('id, area, explanation')
    .then(({ data }) =>
      data?.filter(q => q.explanation && q.explanation.trim().length < 100) || []
    )

  const allNoExplanation = [...(noExplanation || []), ...shortExplanation]

  if (allNoExplanation.length > 0) {
    const byArea = allNoExplanation.reduce((acc: Record<string, number>, q: any) => {
      acc[q.area] = (acc[q.area] || 0) + 1
      return acc
    }, {})

    log(`\n🔴 CRÍTICO: ${allNoExplanation.length} questões sem explicação completa`, colors.red)
    log('\nPor área:')
    for (const [area, count] of Object.entries(byArea)) {
      log(`  ${area}: ${count}`, colors.yellow)
    }
  } else {
    log('✅ Todas as questões têm explicação completa!', colors.green)
  }

  // 4. Questões sem Metadata
  header('4. QUESTÕES SEM METADATA (subspecialty/topic)')

  const { data: noMetadata } = await supabase
    .from('questions')
    .select('id, area, subspecialty, topic')
    .or('subspecialty.is.null,topic.is.null')

  if (noMetadata && noMetadata.length > 0) {
    const byArea = noMetadata.reduce((acc: Record<string, number>, q: any) => {
      acc[q.area] = (acc[q.area] || 0) + 1
      return acc
    }, {})

    log(`\n⚠️  ${noMetadata.length} questões sem metadata completa`, colors.yellow)
    log('\nPor área:')
    for (const [area, count] of Object.entries(byArea)) {
      log(`  ${area}: ${count}`)
    }
  } else {
    log('✅ Todas as questões têm metadata completa!', colors.green)
  }

  // 5. Parâmetros IRT Problemáticos
  header('5. PARÂMETROS IRT (Infit/Outfit)')

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('id, area, irt_infit, irt_outfit')

  if (allQuestions) {
    const problematicIRT = allQuestions.filter((q: any) =>
      (q.irt_infit !== null && (q.irt_infit < 0.7 || q.irt_infit > 1.3)) ||
      (q.irt_outfit !== null && (q.irt_outfit < 0.7 || q.irt_outfit > 1.3))
    )

    if (problematicIRT.length > 0) {
      const byArea = problematicIRT.reduce((acc: Record<string, number>, q: any) => {
        acc[q.area] = (acc[q.area] || 0) + 1
        return acc
      }, {})

      log(`\n⚠️  ${problematicIRT.length} questões com IRT problemático (infit/outfit fora de 0.7-1.3)`, colors.yellow)
      log('\nPor área:')
      for (const [area, count] of Object.entries(byArea)) {
        log(`  ${area}: ${count}`)
      }
    } else {
      log('✅ Todos os parâmetros IRT dentro do esperado!', colors.green)
    }
  }

  // 6. Cobertura de Subspecialidades (Top 5 por área)
  header('6. COBERTURA DE SUBSPECIALIDADES (Top 5 por área)')

  const { data: withSubspecialty } = await supabase
    .from('questions')
    .select('area, subspecialty')
    .not('subspecialty', 'is', null)

  if (withSubspecialty) {
    const areas = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva']

    for (const area of areas) {
      const areaQuestions = withSubspecialty.filter((q: any) => q.area === area)
      const subspecialtyCounts = areaQuestions.reduce((acc: Record<string, number>, q: any) => {
        acc[q.subspecialty] = (acc[q.subspecialty] || 0) + 1
        return acc
      }, {})

      const top5 = Object.entries(subspecialtyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      if (top5.length > 0) {
        log(`\n${area}:`, colors.cyan)
        for (const [sub, count] of top5) {
          log(`  ${sub}: ${count}`)
        }
      }
    }
  }

  // 7. Resumo Final
  header('7. RESUMO FINAL - PRIORIDADES')

  const summary = {
    total: allQuestions?.length || 0,
    semExplicacao: allNoExplanation.length,
    semMetadata: noMetadata?.length || 0,
    irtProblematico: allQuestions?.filter((q: any) =>
      (q.irt_infit !== null && (q.irt_infit < 0.7 || q.irt_infit > 1.3)) ||
      (q.irt_outfit !== null && (q.irt_outfit < 0.7 || q.irt_outfit > 1.3))
    ).length || 0,
  }

  log('\nMétricas Gerais:', colors.bright)
  log(`  Total de Questões: ${summary.total}`)
  log(`  Meta para Beta: 250`, colors.cyan)
  log(`  Gap: ${Math.max(0, 250 - summary.total)}`, summary.total >= 250 ? colors.green : colors.yellow)

  log('\nQualidade:', colors.bright)
  log(`  Sem Explicação: ${summary.semExplicacao}`, summary.semExplicacao === 0 ? colors.green : colors.red)
  log(`  Sem Metadata: ${summary.semMetadata}`, summary.semMetadata === 0 ? colors.green : colors.yellow)
  log(`  IRT Problemático: ${summary.irtProblematico}`, summary.irtProblematico < 20 ? colors.green : colors.yellow)

  // Salvar relatório em arquivo
  const reportPath = path.join(process.cwd(), 'QUESTIONS_AUDIT_REPORT.txt')
  const reportContent = `
AUDITORIA DE QUALIDADE - BANCO DE QUESTÕES
Data: ${new Date().toISOString()}

RESUMO:
- Total de Questões: ${summary.total} / Meta: 250
- Questões sem Explicação: ${summary.semExplicacao}
- Questões sem Metadata: ${summary.semMetadata}
- Questões com IRT Problemático: ${summary.irtProblematico}

PRÓXIMAS AÇÕES:
1. ${summary.semExplicacao > 0 ? `Curar ${summary.semExplicacao} questões sem explicação (CRÍTICO)` : '✅ Explicações completas'}
2. ${summary.semMetadata > 0 ? `Preencher metadata de ${summary.semMetadata} questões` : '✅ Metadata completa'}
3. ${summary.total < 250 ? `Criar ${250 - summary.total} novas questões (ver QUESTIONS_BLUEPRINT.md)` : '✅ Meta de questões atingida'}
4. ${summary.irtProblematico > 0 ? `Revisar ${summary.irtProblematico} questões com IRT problemático` : '✅ IRT calibrado'}

Veja QUESTIONS_CURATION_EXPANSION.md para plano detalhado.
`

  fs.writeFileSync(reportPath, reportContent)
  log(`\n📄 Relatório salvo em: ${reportPath}`, colors.green)

  log('\n' + '='.repeat(60), colors.cyan)
  log('AUDITORIA CONCLUÍDA', colors.bright + colors.green)
  log('='.repeat(60), colors.cyan)
}

main().catch(console.error)
