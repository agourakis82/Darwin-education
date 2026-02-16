#!/usr/bin/env tsx
/**
 * Review visual de batches de curadoria
 * Usage: pnpm tsx scripts/review_batch.ts <batch-id>
 */

import fs from 'node:fs'
import path from 'node:path'

const batchId = process.argv[2]

if (!batchId) {
  console.log('❌ Uso: pnpm tsx scripts/review_batch.ts <batch-id>')
  process.exit(1)
}

const batchDir = path.join(process.cwd(), '.curate_batches', batchId)

if (!fs.existsSync(batchDir)) {
  console.log(`❌ Batch não encontrado: ${batchId}`)
  console.log(`   Batches disponíveis:`)
  const batches = fs.readdirSync(path.join(process.cwd(), '.curate_batches'))
  batches.forEach(b => console.log(`   - ${b}`))
  process.exit(1)
}

// Ler summary
const summaryFile = path.join(batchDir, 'summary.json')
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'))

console.log('\n📊 RESUMO DO BATCH')
console.log('='.repeat(70))
console.log(`Batch ID:       ${summary.batchId}`)
console.log(`Modelo:         ${summary.modelName}`)
console.log(`Processado em:  ${summary.processedAt}`)
console.log(`Total:          ${summary.totalQuestions} questões`)
console.log(`Sucesso:        ${summary.successful}`)
console.log(`Falhas:         ${summary.failed}`)
console.log(`Aplicado:       ${summary.appliedAt || 'Não'}`)
console.log('='.repeat(70))

// Pegar amostra de 5 questões
const successful = summary.results.filter((r: any) => r.status === 'success')
const sample = successful.slice(0, 5)

console.log(`\n📄 AMOSTRA (5 primeiras questões):\n`)

for (let i = 0; i < sample.length; i++) {
  const result = sample[i]
  const questionFile = path.join(batchDir, `${result.questionId}.json`)
  const questionData = JSON.parse(fs.readFileSync(questionFile, 'utf8'))

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`QUESTÃO ${i + 1} - ${result.area.toUpperCase()}`)
  console.log(`ID: ${result.questionId}`)
  console.log(`${'─'.repeat(70)}`)

  console.log(`\n📝 ENUNCIADO:`)
  console.log(questionData.stem.substring(0, 200) + (questionData.stem.length > 200 ? '...' : ''))

  console.log(`\n✅ GABARITO: ${questionData.options[questionData.correct_index]?.letter}`)

  console.log(`\n📖 EXPLICAÇÃO GERADA:`)
  console.log(questionData.new_explanation)

  const wordCount = questionData.new_explanation.split(/\s+/).length
  console.log(`\n📊 Palavras: ${wordCount} (ideal: 250-350)`)
}

console.log(`\n\n${'='.repeat(70)}`)
console.log('✅ REVIEW COMPLETO')
console.log('='.repeat(70))
console.log(`\n💡 Para aplicar este batch:`)
console.log(`   pnpm tsx scripts/curate_questions_ai.ts --batch-id ${batchId} --apply\n`)
