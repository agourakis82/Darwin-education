#!/usr/bin/env tsx
/**
 * Curadoria Automatizada de Questões com IA
 *
 * Usa GLM-5 (Z.ai) ou Grok (xAI) para gerar explicações de alta qualidade
 * para questões sem explicação completa.
 *
 * Usage:
 *   pnpm tsx scripts/curate_questions_ai.ts --area cirurgia --limit 10 --dry-run
 *   pnpm tsx scripts/curate_questions_ai.ts --area saude_coletiva --limit 50
 *   pnpm tsx scripts/curate_questions_ai.ts --batch-id <uuid> --apply
 *
 * Flags:
 *   --area <area>        Área ENAMED (cirurgia, saude_coletiva, etc.)
 *   --limit <n>          Número de questões a processar (default: 10)
 *   --dry-run            Gera explicações mas não salva no banco
 *   --apply              Aplica explicações geradas (após review)
 *   --model <name>       Modelo IA: glm-5, grok (default: glm-5)
 *   --batch-id <id>      ID do batch para aplicar
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
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
          if (!process.env[key]) {  // Don't override existing env vars
            process.env[key] = value
          }
        }
      }
    }
  } catch {
    // .env.local not found - rely on shell environment
    console.warn('⚠️  apps/web/.env.local not found, using shell environment variables')
  }
}

// Call it immediately
loadEnvFile()

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROK_API_KEY = process.env.XAI_API_KEY!

// Suporte para MiniMax (Anthropic-compatible), GLM-5 ou Grok
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY!
const AI_CONFIG = {
  'minimax': {
    apiUrl: 'https://api.minimax.io/anthropic/v1/messages',
    apiKey: MINIMAX_API_KEY,
    model: 'MiniMax-M2.5-highspeed', // 100 tps, super rápido!
    isAnthropicFormat: true, // Usa formato Anthropic SDK
  },
  'glm-5': {
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKey: process.env.GLM_API_KEY || GROK_API_KEY,
    model: 'glm-4-plus',
    isAnthropicFormat: false,
  },
  'grok': {
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    apiKey: GROK_API_KEY,
    model: 'grok-4-1-fast-reasoning',
    isAnthropicFormat: false,
  },
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(msg: string, color = c.reset) {
  console.log(`${color}${msg}${c.reset}`)
}

// Parse args
function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: any = {
    area: null,
    limit: 10,
    dryRun: false,
    apply: false,
    model: 'minimax', // Default: MiniMax M2.5-highspeed (100 tps!)
    batchId: null,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--area') parsed.area = args[++i]
    else if (arg === '--limit') parsed.limit = parseInt(args[++i])
    else if (arg === '--dry-run') parsed.dryRun = true
    else if (arg === '--apply') parsed.apply = true
    else if (arg === '--model') parsed.model = args[++i]
    else if (arg === '--batch-id') parsed.batchId = args[++i]
  }

  return parsed
}

// Prompt template para gerar explicações
function buildPrompt(question: any): string {
  const optionsText = question.options
    .map((opt: any, i: number) => `${opt.letter}) ${opt.text}`)
    .join('\n')

  const correctLetter = question.options[question.correct_index]?.letter || 'A'

  return `Você é um especialista em educação médica e preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica) brasileiro.

Sua tarefa é escrever uma EXPLICAÇÃO COMPLETA e DIDÁTICA para a questão abaixo, ajudando estudantes de medicina a entenderem o raciocínio clínico correto.

# QUESTÃO:

${question.stem}

**Alternativas:**
${optionsText}

**Gabarito Correto:** ${correctLetter}

---

# INSTRUÇÕES PARA A EXPLICAÇÃO:

1. **Identificar dados-chave do caso clínico:**
   - Idade, gênero, queixa principal
   - Achados de exame físico relevantes
   - Exames complementares (se houver)

2. **Explicar o raciocínio para a resposta CORRETA:**
   - Por que a alternativa ${correctLetter} é a MELHOR resposta?
   - Que guideline, consenso ou evidência suporta isso?
   - Qual o raciocínio fisiopatológico ou clínico?

3. **Explicar por que CADA alternativa INCORRETA está errada:**
   - Alternativa A (se incorreta): [razão específica]
   - Alternativa B (se incorreta): [razão específica]
   - Alternativa C (se incorreta): [razão específica]
   - Alternativa D (se incorreta): [razão específica]

4. **Adicionar dicas práticas:**
   - Palavras-chave do enunciado que ajudam a chegar na resposta
   - Armadilhas comuns (erros que estudantes cometem)

5. **Referências (se aplicável):**
   - Guideline, consenso ou protocolo relevante (ex: ESC 2021, ACOG 2020, MS 2019)

---

# FORMATO DA EXPLICAÇÃO (MARKDOWN):

**Resposta Correta: ${correctLetter}**

[Explicação do raciocínio clínico: 150-200 palavras sobre POR QUE a alternativa correta está certa, baseado em dados do caso e guideline/evidência]

**Por que as outras alternativas estão incorretas:**

- **[Letra A/B/C/D]**: [30-50 palavras explicando por que está errada - erro conceitual, não se aplica ao caso, conduta subótima, etc.]
- **[Letra A/B/C/D]**: [30-50 palavras]
- **[Letra A/B/C/D]**: [30-50 palavras]

**Dica Clínica:** [20-30 palavras com palavra-chave ou armadilha comum]

**Referência:** [Guideline ou consenso, se aplicável]

---

IMPORTANTE:
- Use linguagem clara e didática (como se estivesse explicando para um colega)
- Seja objetivo e conciso (250-350 palavras TOTAL)
- Foque no raciocínio clínico, não apenas em decorar a resposta
- Use markdown para estruturar (**, -, etc.)
- NÃO repita o enunciado da questão na explicação
- NÃO use emojis

Gere APENAS a explicação no formato solicitado, sem introdução ou conclusão extra.`
}

// Chamar API de IA (MiniMax, GLM-5 ou Grok)
async function generateExplanation(question: any, modelName: string): Promise<string | null> {
  const config = AI_CONFIG[modelName as keyof typeof AI_CONFIG]
  if (!config) {
    log(`❌ Modelo desconhecido: ${modelName}`, c.red)
    return null
  }

  const prompt = buildPrompt(question)

  try {
    // MiniMax usa formato Anthropic Messages API
    if (config.isAnthropicFormat) {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1000,
          temperature: 0.3,
          system: 'Você é um especialista em educação médica e preparação para o ENAMED.',
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: prompt }],
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        log(`❌ Erro na API (${response.status}): ${error}`, c.red)
        return null
      }

      const data = await response.json()

      // Extrair texto de content blocks (pode ter thinking + text)
      let explanation = ''
      for (const block of data.content || []) {
        if (block.type === 'text') {
          explanation += block.text
        }
      }

      if (!explanation) {
        log('❌ Resposta vazia da API', c.red)
        return null
      }

      return explanation.trim()
    }
    // OpenAI-compatible format (GLM-5, Grok)
    else {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em educação médica e preparação para o ENAMED.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        log(`❌ Erro na API (${response.status}): ${error}`, c.red)
        return null
      }

      const data = await response.json()
      const explanation = data.choices?.[0]?.message?.content

      if (!explanation) {
        log('❌ Resposta vazia da API', c.red)
        return null
      }

      return explanation.trim()
    }
  } catch (error: any) {
    log(`❌ Erro ao chamar API: ${error.message}`, c.red)
    return null
  }
}

// Buscar questões sem explicação
async function fetchQuestionsToProcess(area: string | null, limit: number) {
  // Fetch all questions for the area, then filter locally for missing/placeholder explanations
  // This catches: null, empty, "em elaboração", "pendente de revisão", or very short (<100 chars)
  const fetchLimit = 1000
  let query = supabase
    .from('questions')
    .select('*')
    .limit(fetchLimit)

  if (area) {
    query = query.eq('area', area)
  }

  const { data, error } = await query

  if (error) {
    log(`❌ Erro ao buscar questões: ${error.message}`, c.red)
    return []
  }

  // Filter locally for questions needing curation
  const needsCuration = (data || []).filter((q: any) =>
    !q.explanation ||
    q.explanation.length < 100 ||
    q.explanation.includes('em elaboração') ||
    q.explanation.includes('pendente de revisão')
  )

  return needsCuration.slice(0, limit)
}

// Processar batch
async function processBatch(questions: any[], modelName: string, dryRun: boolean) {
  const batchId = randomUUID()
  const batchDir = path.join(process.cwd(), '.curate_batches', batchId)
  fs.mkdirSync(batchDir, { recursive: true })

  log(`\n🤖 Processando batch: ${batchId}`, c.cyan)
  log(`📦 Modelo: ${modelName}`, c.cyan)
  log(`📄 Questões: ${questions.length}`, c.cyan)
  log(`💾 Salvando em: ${batchDir}\n`, c.cyan)

  const results = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const progress = `[${i + 1}/${questions.length}]`

    log(`${progress} Processando questão ${q.id.substring(0, 8)}...`, c.blue)
    log(`   Área: ${q.area}`, c.blue)
    log(`   Stem: ${q.stem.substring(0, 80)}...`, c.blue)

    const explanation = await generateExplanation(q, modelName)

    if (!explanation) {
      log(`${progress} ❌ Falha ao gerar explicação`, c.red)
      results.push({ questionId: q.id, status: 'failed', explanation: null })
      continue
    }

    log(`${progress} ✅ Explicação gerada (${explanation.length} chars)`, c.green)

    // Salvar JSON individual
    const questionFile = path.join(batchDir, `${q.id}.json`)
    fs.writeFileSync(
      questionFile,
      JSON.stringify(
        {
          questionId: q.id,
          area: q.area,
          stem: q.stem,
          options: q.options,
          correct_index: q.correct_index,
          old_explanation: q.explanation,
          new_explanation: explanation,
          generated_at: new Date().toISOString(),
          model: modelName,
        },
        null,
        2
      )
    )

    results.push({
      questionId: q.id,
      area: q.area,
      status: 'success',
      explanation,
    })

    // Rate limiting (evitar throttle)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 1s entre requests
  }

  // Salvar resumo do batch
  const summary = {
    batchId,
    modelName,
    processedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    successful: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    dryRun,
    results,
  }

  const summaryFile = path.join(batchDir, 'summary.json')
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

  log(`\n✅ Batch completo!`, c.green)
  log(`📊 Sucesso: ${summary.successful}/${summary.totalQuestions}`, c.green)
  log(`📁 Arquivos salvos em: ${batchDir}`, c.cyan)

  if (dryRun) {
    log(`\n⚠️  DRY RUN - Explicações NÃO foram aplicadas ao banco`, c.yellow)
    log(`   Para aplicar: pnpm tsx scripts/curate_questions_ai.ts --batch-id ${batchId} --apply`, c.yellow)
  }

  return { batchId, summary }
}

// Aplicar batch ao banco
async function applyBatch(batchId: string) {
  const batchDir = path.join(process.cwd(), '.curate_batches', batchId)

  if (!fs.existsSync(batchDir)) {
    log(`❌ Batch não encontrado: ${batchId}`, c.red)
    return
  }

  const summaryFile = path.join(batchDir, 'summary.json')
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'))

  log(`\n🚀 Aplicando batch ${batchId} ao banco...`, c.cyan)
  log(`📦 ${summary.successful} questões para atualizar\n`, c.cyan)

  let updated = 0
  let failed = 0

  for (const result of summary.results) {
    if (result.status !== 'success') continue

    const questionFile = path.join(batchDir, `${result.questionId}.json`)
    const questionData = JSON.parse(fs.readFileSync(questionFile, 'utf8'))

    const { error } = await supabase
      .from('questions')
      .update({ explanation: questionData.new_explanation })
      .eq('id', result.questionId)

    if (error) {
      log(`❌ Erro ao atualizar ${result.questionId}: ${error.message}`, c.red)
      failed++
    } else {
      log(`✅ Atualizado: ${result.questionId} (${result.area})`, c.green)
      updated++
    }
  }

  log(`\n✅ Aplicação completa!`, c.green)
  log(`📊 Atualizadas: ${updated}`, c.green)
  log(`❌ Falharam: ${failed}`, failed > 0 ? c.red : c.green)

  // Marcar batch como aplicado
  summary.appliedAt = new Date().toISOString()
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
}

// Main
async function main() {
  const args = parseArgs()

  log('\n🤖 CURADORIA AUTOMATIZADA DE QUESTÕES COM IA', c.bright + c.cyan)
  log('='.repeat(60), c.cyan)

  // Modo: aplicar batch existente
  if (args.apply && args.batchId) {
    await applyBatch(args.batchId)
    return
  }

  // Validar área
  if (!args.area && !args.apply) {
    log('\n❌ Erro: --area é obrigatório', c.red)
    log('Áreas válidas: cirurgia, saude_coletiva, pediatria, ginecologia_obstetricia, clinica_medica\n', c.yellow)
    process.exit(1)
  }

  // Buscar questões
  log(`\n🔍 Buscando questões sem explicação...`, c.blue)
  log(`   Área: ${args.area || 'todas'}`, c.blue)
  log(`   Limite: ${args.limit}\n`, c.blue)

  const questions = await fetchQuestionsToProcess(args.area, args.limit)

  if (questions.length === 0) {
    log('✅ Nenhuma questão encontrada sem explicação!', c.green)
    return
  }

  log(`📦 ${questions.length} questões encontradas\n`, c.cyan)

  // Processar
  const { batchId } = await processBatch(questions, args.model, args.dryRun)

  // Se não for dry-run, perguntar se quer aplicar
  if (!args.dryRun) {
    log(`\n⚠️  Batch gerado mas não aplicado. Revise os arquivos em:`, c.yellow)
    log(`   .curate_batches/${batchId}/`, c.yellow)
    log(`\n   Para aplicar: pnpm tsx scripts/curate_questions_ai.ts --batch-id ${batchId} --apply\n`, c.yellow)
  }
}

main().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, c.red)
  console.error(error)
  process.exit(1)
})
