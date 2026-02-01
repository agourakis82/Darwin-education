#!/usr/bin/env npx tsx
/**
 * CLI do Question Harvester
 *
 * Uso:
 *   pnpm harvest                     # Mostrar ajuda
 *   pnpm harvest --source fmusp      # Coletar de fonte específica
 *   pnpm harvest --search "ENARE"    # Buscar por termo
 *   pnpm harvest --all               # Coletar de todas as fontes
 *   pnpm harvest --test              # Executar testes
 */

import { createHarvesterPipeline } from './pipeline';
import {
  RESIDENCIA_SOURCES,
  createSearchScraper,
  createBraveSearchScraper,
  KNOWN_EXAM_URLS,
  getKnownUrlsCount,
} from './scrapers/residencia-scraper';
import { LLMQuestionParser, classifyArea } from './parsers/llm-question-parser';
import { createOCR, needsOCR } from './ocr/tesseract-ocr';
import {
  BatchDownloader,
  createProgressDisplay,
  downloadAllExams,
  downloadFromSource,
  listAvailableExams,
} from './batch-downloader';
import type { HarvestJob } from './types';

// ============================================
// Cores para output
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(msg: string, color = colors.reset): void {
  console.log(`${color}${msg}${colors.reset}`);
}

function logSuccess(msg: string): void {
  log(`✅ ${msg}`, colors.green);
}

function logWarning(msg: string): void {
  log(`⚠️  ${msg}`, colors.yellow);
}

function logError(msg: string): void {
  log(`❌ ${msg}`, colors.red);
}

function logInfo(msg: string): void {
  log(`ℹ️  ${msg}`, colors.cyan);
}

// ============================================
// Comandos
// ============================================

async function showHelp(): Promise<void> {
  console.log(`
${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════════╗
║            DARWIN EDUCATION - QUESTION HARVESTER            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}DESCRIÇÃO${colors.reset}
  Sistema automatizado de coleta e parsing de questões médicas
  de provas de residência brasileiras.

${colors.bright}USO${colors.reset}
  pnpm harvest [comando] [opções]

${colors.bright}COMANDOS${colors.reset}
  --help, -h          Mostrar esta ajuda
  --sources           Listar fontes disponíveis
  --source <id>       Coletar de fonte específica (ex: fmusp, enare)
  --search <termo>    Buscar provas por termo (ex: "FMUSP 2024")
  --all               Coletar de todas as fontes
  --test              Executar testes do sistema
  --parse <arquivo>   Parsear arquivo PDF/texto local

${colors.bright}DOWNLOAD MASSIVO${colors.reset}
  --batch             Download massivo de todas as provas conhecidas
  --batch <fonte>     Download massivo de fonte específica
  --list-urls         Listar todas as URLs disponíveis para download

${colors.bright}PROCESSAMENTO${colors.reset}
  --process [dir]     Processar PDFs baixados e extrair questões (padrão: ./provas-downloaded)
                      Gera JSON e SQL prontos para importação

${colors.bright}OPÇÕES${colors.reset}
  --year <ano>        Filtrar por ano (ex: 2024)
  --max <n>           Máximo de documentos (padrão: 10)
  --ocr               Forçar OCR mesmo em PDFs com texto
  --output <dir>      Diretório para salvar resultados
  --concurrency <n>   Número de downloads paralelos (padrão: 5)
  --skip-existing     Pular arquivos já baixados (padrão: true)

${colors.bright}VARIÁVEIS DE AMBIENTE${colors.reset}
  GROK_API_KEY        API key do Grok (para parsing LLM)
  MINIMAX_API_KEY     API key do Minimax (alternativa)
  MINIMAX_GROUP_ID    Group ID do Minimax
  BRAVE_API_KEY       API key do Brave Search (opcional)

${colors.bright}EXEMPLOS${colors.reset}
  pnpm harvest --sources
  pnpm harvest --source enare --year 2024
  pnpm harvest --search "UNIFESP residência 2024" --max 5
  pnpm harvest --test

  ${colors.bright}Download Massivo:${colors.reset}
  pnpm harvest --batch --output ./provas
  pnpm harvest --batch fmusp --output ./provas/usp
  pnpm harvest --batch enare --concurrency 10
  pnpm harvest --list-urls

  ${colors.bright}Processamento de PDFs:${colors.reset}
  pnpm harvest --process ./provas --output ./questoes
  pnpm harvest --process --ocr --output ./questoes

${colors.bright}FONTES SUPORTADAS${colors.reset}
${RESIDENCIA_SOURCES.map((s) => `  - ${s.id.padEnd(12)} ${s.name}`).join('\n')}
`);
}

async function listSources(): Promise<void> {
  log('\n📚 Fontes de Residência Configuradas:\n', colors.bright);

  for (const source of RESIDENCIA_SOURCES) {
    const knownUrls = KNOWN_EXAM_URLS[source.id.toLowerCase()] || [];
    const urlCount = knownUrls.length > 0 ? ` (${knownUrls.length} PDFs conhecidos)` : '';

    console.log(`  ${colors.cyan}${source.id.padEnd(12)}${colors.reset} ${source.name}${colors.green}${urlCount}${colors.reset}`);
    console.log(`             ${colors.blue}${source.url}${colors.reset}`);
    console.log();
  }

  console.log(`Total: ${RESIDENCIA_SOURCES.length} fontes, ${getKnownUrlsCount()} PDFs conhecidos`);
  log(`\nUse: pnpm harvest --batch para baixar todos os PDFs`, colors.yellow);
}

async function harvestFromSource(
  sourceId: string,
  options: CLIOptions
): Promise<void> {
  const source = RESIDENCIA_SOURCES.find((s) => s.id === sourceId);

  if (!source) {
    logError(`Fonte "${sourceId}" não encontrada.`);
    log('\nFontes disponíveis:');
    RESIDENCIA_SOURCES.forEach((s) => log(`  - ${s.id}`));
    return;
  }

  log(`\n🔍 Coletando questões de ${source.name}...`, colors.bright);

  const apiKey = process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    logWarning('Nenhuma API key configurada. O parsing será limitado.');
  }

  const pipeline = createHarvesterPipeline({
    llmProvider: process.env.GROK_API_KEY ? 'grok' : 'minimax',
    maxDocumentsPerJob: options.max || 10,
  });

  if (apiKey) {
    pipeline.initialize(apiKey, process.env.MINIMAX_GROUP_ID);
  }

  const job = pipeline.createJob(sourceId);
  logInfo(`Job criado: ${job.id}`);

  try {
    const result = await pipeline.runJob(job.id);
    printJobResult(result);
  } catch (error) {
    logError(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function searchAndHarvest(
  term: string,
  options: CLIOptions
): Promise<void> {
  log(`\n🌐 Buscando provas: "${term}"...`, colors.bright);

  const years = options.year ? [options.year] : [2024, 2023, 2022];
  const braveKey = process.env.BRAVE_API_KEY;

  let scraper;

  if (braveKey) {
    logInfo('Usando Brave Search API');
    scraper = createBraveSearchScraper(term, years, braveKey, {
      maxDocuments: options.max || 10,
      delayMs: 2000,
    });
  } else {
    logInfo('Usando busca direta em páginas institucionais');
    scraper = createSearchScraper(term, years, {
      maxDocuments: options.max || 10,
      delayMs: 2000,
    });
  }

  try {
    const result = await scraper.scrape();

    log(`\n📄 Documentos encontrados: ${result.documents.length}`);

    if (result.documents.length > 0) {
      for (const doc of result.documents) {
        console.log(`  - ${doc.filename || doc.url.split('/').pop()}`);
        console.log(`    ${colors.blue}${doc.url}${colors.reset}`);
        console.log(`    ${(doc.content as Buffer).length} bytes`);
      }
    }

    if (result.errors.length > 0) {
      logWarning(`\n${result.errors.length} erros:`);
      result.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
    }

    // Parsear documentos se tiver API key
    const apiKey = process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY;
    if (apiKey && result.documents.length > 0) {
      await parseDocuments(result.documents, apiKey, options);
    }
  } catch (error) {
    logError(`Erro na busca: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function parseDocuments(
  documents: Array<{ content: Buffer | string; url: string }>,
  apiKey: string,
  options: CLIOptions
): Promise<void> {
  log('\n🤖 Iniciando parsing com LLM...', colors.bright);

  const parser = new LLMQuestionParser({
    provider: process.env.GROK_API_KEY ? 'grok' : 'minimax',
    apiKey,
    groupId: process.env.MINIMAX_GROUP_ID,
  });

  const ocr = options.ocr ? createOCR() : null;
  let totalQuestions = 0;

  for (const doc of documents) {
    try {
      let text: string;

      if (Buffer.isBuffer(doc.content)) {
        // Verificar se precisa OCR
        const requiresOCR = options.ocr || (await needsOCR(doc.content));

        if (requiresOCR && ocr) {
          logInfo(`Executando OCR em ${doc.url.split('/').pop()}...`);
          const ocrResult = await ocr.processPDF(doc.content);
          text = ocrResult.text;
          log(`  OCR: ${ocrResult.pages.length} páginas, ${(ocrResult.confidence * 100).toFixed(0)}% confiança`);
        } else {
          // Extrair texto diretamente
          const pdfParse = await (Function('return import("pdf-parse")')() as Promise<{
            default: (buf: Buffer) => Promise<{ text: string }>;
          }>);
          const data = await pdfParse.default(doc.content);
          text = data.text;
        }
      } else {
        text = doc.content;
      }

      if (text.length < 100) {
        logWarning(`Documento muito curto: ${doc.url.split('/').pop()}`);
        continue;
      }

      log(`📝 Parseando ${doc.url.split('/').pop()}...`);
      const result = await parser.parseText(text, doc.url);

      if (result.success) {
        logSuccess(`${result.questions.length} questões extraídas`);
        totalQuestions += result.questions.length;

        for (const q of result.questions.slice(0, 3)) {
          console.log(`    • ${q.stem.substring(0, 60)}...`);
          console.log(`      Área: ${q.area || 'N/A'}, Confiança: ${(q.confidence * 100).toFixed(0)}%`);
        }

        if (result.questions.length > 3) {
          console.log(`    ... e mais ${result.questions.length - 3} questões`);
        }
      } else {
        logError(`Falha no parsing: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      logError(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (ocr) {
    await ocr.terminate();
  }

  log(`\n📊 Total: ${totalQuestions} questões extraídas`, colors.bright);
}

async function runTests(): Promise<void> {
  log('\n🧪 Executando testes do Question Harvester...', colors.bright);

  // Teste 1: Classificação de áreas
  log('\n📊 Teste 1: Classificação de área médica');
  const testCases = [
    { text: 'paciente com infarto agudo do miocárdio', expected: 'Clínica Médica' },
    { text: 'gestante com pré-eclâmpsia', expected: 'Ginecologia e Obstetrícia' },
    { text: 'criança com bronquiolite viral', expected: 'Pediatria' },
    { text: 'apendicite aguda cirurgia', expected: 'Cirurgia' },
    { text: 'vigilância epidemiológica SUS', expected: 'Saúde Coletiva' },
  ];

  let passed = 0;
  for (const { text, expected } of testCases) {
    const result = classifyArea(text);
    const ok = result === expected;
    if (ok) passed++;
    console.log(`  ${ok ? '✅' : '❌'} "${text.substring(0, 30)}..." → ${result || 'N/A'}`);
  }
  log(`  Resultado: ${passed}/${testCases.length} testes passaram`);

  // Teste 2: Parser LLM
  log('\n🤖 Teste 2: Parser LLM');
  const apiKey = process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    logWarning('Pule o teste de LLM (nenhuma API key configurada)');
    logInfo('Configure GROK_API_KEY ou MINIMAX_API_KEY para testar');
  } else {
    const sampleText = `
QUESTÃO 1
Paciente de 65 anos, hipertenso e diabético, chega ao pronto-socorro com dor
torácica típica há 2 horas. ECG mostra supradesnivelamento de ST em V1-V4.

Qual a conduta imediata mais adequada?

(A) Solicitar troponina e aguardar resultado
(B) Iniciar terapia de reperfusão imediata
(C) Realizar ecocardiograma de urgência
(D) Transferir para UTI coronariana
`;

    const parser = new LLMQuestionParser({
      provider: process.env.GROK_API_KEY ? 'grok' : 'minimax',
      apiKey,
      groupId: process.env.MINIMAX_GROUP_ID,
    });

    try {
      const result = await parser.parseText(sampleText, 'test');

      if (result.success && result.questions.length > 0) {
        logSuccess(`Parsing OK: ${result.questions.length} questão(ões)`);
        console.log(`  Tokens: ${result.tokensUsed}, Tempo: ${result.processingTimeMs}ms`);
      } else {
        logError(`Parsing falhou: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      logError(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Teste 3: Scraper (fontes diretas)
  log('\n🌐 Teste 3: Scraper (páginas institucionais)');

  const scraper = createSearchScraper('ENARE', [2024], {
    maxDocuments: 1,
    delayMs: 1000,
  });

  try {
    const result = await scraper.scrape();
    if (result.documents.length > 0) {
      logSuccess(`${result.documents.length} documento(s) encontrado(s)`);
    } else {
      logWarning('Nenhum documento encontrado (normal se não houver acesso)');
    }
    if (result.errors.length > 0) {
      logWarning(`${result.errors.length} erro(s): ${result.errors[0]}`);
    }
  } catch (error) {
    logError(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  }

  log('\n✨ Testes concluídos!', colors.bright);
}

async function parseLocalFile(filePath: string, options: CLIOptions): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(filePath)) {
    logError(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  const apiKey = process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    logError('API key necessária para parsing. Configure GROK_API_KEY ou MINIMAX_API_KEY');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  let text: string;

  log(`\n📄 Parseando arquivo: ${filePath}`, colors.bright);

  if (ext === '.pdf') {
    // Ler PDF
    const buffer = fs.readFileSync(filePath);
    const requiresOCR = options.ocr || (await needsOCR(buffer));

    if (requiresOCR) {
      logInfo('Executando OCR...');
      const ocr = createOCR();
      await ocr.initialize();
      const result = await ocr.processPDF(buffer);
      await ocr.terminate();
      text = result.text;
      log(`OCR: ${result.pages.length} páginas, ${(result.confidence * 100).toFixed(0)}% confiança`);
    } else {
      const pdfParse = await (Function('return import("pdf-parse")')() as Promise<{
        default: (buf: Buffer) => Promise<{ text: string }>;
      }>);
      const data = await pdfParse.default(buffer);
      text = data.text;
    }
  } else {
    // Ler arquivo de texto
    text = fs.readFileSync(filePath, 'utf-8');
  }

  if (text.length < 50) {
    logError('Arquivo muito curto ou vazio');
    return;
  }

  log(`Texto extraído: ${text.length} caracteres`);

  // Parser LLM
  const parser = new LLMQuestionParser({
    provider: process.env.GROK_API_KEY ? 'grok' : 'minimax',
    apiKey,
    groupId: process.env.MINIMAX_GROUP_ID,
  });

  const result = await parser.parseText(text, filePath);

  if (result.success) {
    logSuccess(`${result.questions.length} questões extraídas`);
    log(`Tokens: ${result.tokensUsed}, Tempo: ${result.processingTimeMs}ms`);

    console.log('\n📝 Questões encontradas:');
    for (const q of result.questions) {
      console.log(`\n${colors.cyan}[Questão ${q.id}]${colors.reset}`);
      console.log(`  Área: ${q.area || 'N/A'}`);
      console.log(`  Stem: ${q.stem.substring(0, 100)}${q.stem.length > 100 ? '...' : ''}`);
      console.log(`  Opções: ${q.options.length}`);
      console.log(`  Resposta: ${q.correctAnswer || 'N/A'}`);
      console.log(`  Confiança: ${(q.confidence * 100).toFixed(0)}%`);
      console.log(`  Dificuldade: ${q.difficulty || 'N/A'}`);
    }

    // Salvar resultado se output especificado
    if (options.output) {
      const outputPath = path.join(options.output, `parsed-${Date.now()}.json`);
      fs.mkdirSync(options.output, { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(result.questions, null, 2));
      logSuccess(`Salvo em: ${outputPath}`);
    }
  } else {
    logError(`Parsing falhou: ${result.errors?.join(', ')}`);
  }
}

// ============================================
// Batch Download Commands
// ============================================

async function runBatchDownload(options: CLIOptions): Promise<void> {
  const outputDir = options.output || './provas-downloaded';
  const source = typeof options.batch === 'string' ? options.batch : undefined;

  log('\n📥 DOWNLOAD MASSIVO DE PROVAS', colors.bright);
  console.log('═'.repeat(50));

  if (source) {
    log(`Fonte: ${source.toUpperCase()}`, colors.cyan);
    const urls = KNOWN_EXAM_URLS[source.toLowerCase()];
    if (!urls || urls.length === 0) {
      logError(`Fonte "${source}" não encontrada.`);
      log('\nFontes disponíveis:');
      for (const [key, urls] of Object.entries(KNOWN_EXAM_URLS)) {
        console.log(`  - ${key.padEnd(15)} (${urls.length} provas)`);
      }
      return;
    }
    log(`URLs disponíveis: ${urls.length}`);
  } else {
    log(`Total de URLs: ${getKnownUrlsCount()}`, colors.cyan);
  }

  log(`Diretório de saída: ${outputDir}`);
  log(`Concorrência: ${options.concurrency || 5}`);
  console.log('═'.repeat(50) + '\n');

  const downloader = new BatchDownloader({
    outputDir,
    sources: source ? [source] : [],
    concurrency: options.concurrency || 5,
    skipExisting: options.skipExisting ?? true,
    onProgress: createProgressDisplay(),
  });

  try {
    const summary = await downloader.downloadAll();

    console.log('\n' + '═'.repeat(50));
    log('📊 RESUMO DO DOWNLOAD', colors.bright);
    console.log('═'.repeat(50));
    logSuccess(`Sucesso: ${summary.successful} arquivos`);
    if (summary.failed > 0) {
      logError(`Falhas: ${summary.failed} arquivos`);
    }
    if (summary.skipped > 0) {
      logInfo(`Pulados (já existentes): ${summary.skipped} arquivos`);
    }
    log(`Total baixado: ${(summary.totalBytes / 1024 / 1024).toFixed(1)} MB`);
    log(`Tempo total: ${(summary.durationMs / 1000).toFixed(1)}s`);

    // Mostrar falhas
    const failures = summary.results.filter((r) => !r.success && r.error !== 'SKIPPED');
    if (failures.length > 0) {
      console.log('\n❌ Downloads que falharam:');
      for (const f of failures.slice(0, 10)) {
        console.log(`  - ${f.url.split('/').pop()}`);
        console.log(`    ${colors.red}${f.error}${colors.reset}`);
      }
      if (failures.length > 10) {
        console.log(`  ... e mais ${failures.length - 10} falhas`);
      }
    }

    console.log('═'.repeat(50));
  } catch (error) {
    logError(`Erro no download: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listUrlsCommand(): Promise<void> {
  log('\n📋 URLs DISPONÍVEIS PARA DOWNLOAD\n', colors.bright);

  let total = 0;
  for (const [source, urls] of Object.entries(KNOWN_EXAM_URLS)) {
    console.log(`${colors.cyan}${source.toUpperCase()}${colors.reset} (${urls.length} provas)`);
    for (const url of urls) {
      const filename = decodeURIComponent(url.split('/').pop() || '');
      console.log(`  • ${filename.substring(0, 60)}${filename.length > 60 ? '...' : ''}`);
    }
    console.log();
    total += urls.length;
  }

  log(`Total: ${total} PDFs disponíveis para download`, colors.bright);
  log('\nUse: pnpm harvest --batch --output ./provas', colors.cyan);
}

// ============================================
// Process Downloaded PDFs
// ============================================

interface ProcessedPDF {
  filename: string;
  source: string;
  questionsFound: number;
  success: boolean;
  error?: string;
}

interface ProcessingSummary {
  totalFiles: number;
  processed: number;
  failed: number;
  totalQuestions: number;
  questions: import('./types').ParsedQuestion[];
  files: ProcessedPDF[];
}

async function processDownloadedPDFs(options: CLIOptions): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const inputDir = typeof options.process === 'string' ? options.process : './provas-downloaded';
  const outputDir = options.output || './parsed-questions';

  log('\n🔬 PROCESSAMENTO DE PDFs BAIXADOS', colors.bright);
  console.log('═'.repeat(50));

  // Check API key
  const apiKey = process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    logError('API key necessária. Configure GROK_API_KEY ou MINIMAX_API_KEY');
    return;
  }

  // Check input directory
  if (!fs.existsSync(inputDir)) {
    logError(`Diretório não encontrado: ${inputDir}`);
    logInfo('Use --batch para baixar PDFs primeiro');
    return;
  }

  // Find all PDFs
  const pdfFiles = fs.readdirSync(inputDir).filter((f: string) => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    logError(`Nenhum PDF encontrado em: ${inputDir}`);
    return;
  }

  log(`Diretório de entrada: ${inputDir}`, colors.cyan);
  log(`PDFs encontrados: ${pdfFiles.length}`);
  log(`Diretório de saída: ${outputDir}`);
  console.log('═'.repeat(50) + '\n');

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Initialize parser
  const parser = new LLMQuestionParser({
    provider: process.env.GROK_API_KEY ? 'grok' : 'minimax',
    apiKey,
    groupId: process.env.MINIMAX_GROUP_ID,
  });

  // Initialize OCR if needed
  let ocr: import('./ocr/tesseract-ocr').TesseractOCR | null = null;

  const summary: ProcessingSummary = {
    totalFiles: pdfFiles.length,
    processed: 0,
    failed: 0,
    totalQuestions: 0,
    questions: [],
    files: [],
  };

  // Process each PDF
  for (let i = 0; i < pdfFiles.length; i++) {
    const filename = pdfFiles[i];
    const filePath = path.join(inputDir, filename);

    log(`\n[${i + 1}/${pdfFiles.length}] 📄 ${filename}`, colors.cyan);

    try {
      const buffer = fs.readFileSync(filePath);
      let text: string;

      // Check if needs OCR
      const requiresOCR = options.ocr || (await needsOCR(buffer));

      if (requiresOCR) {
        logInfo('  Executando OCR...');
        if (!ocr) {
          ocr = createOCR();
          await ocr.initialize();
        }
        const ocrResult = await ocr.processPDF(buffer);
        text = ocrResult.text;
        log(`  OCR: ${ocrResult.pages.length} páginas, ${(ocrResult.confidence * 100).toFixed(0)}% confiança`);
      } else {
        // Extract text directly
        try {
          const pdfParse = await (Function('return import("pdf-parse")')() as Promise<{
            default: (buf: Buffer) => Promise<{ text: string }>;
          }>);
          const data = await pdfParse.default(buffer);
          text = data.text;
          log(`  Texto extraído: ${text.length} caracteres`);
        } catch {
          logWarning('  pdf-parse falhou, tentando OCR...');
          if (!ocr) {
            ocr = createOCR();
            await ocr.initialize();
          }
          const ocrResult = await ocr.processPDF(buffer);
          text = ocrResult.text;
        }
      }

      if (text.length < 100) {
        logWarning('  Texto muito curto, pulando...');
        summary.files.push({
          filename,
          source: inferSourceFromFilename(filename),
          questionsFound: 0,
          success: false,
          error: 'Texto muito curto',
        });
        summary.failed++;
        continue;
      }

      // Parse with LLM (split into chunks if needed)
      log('  🤖 Parseando com LLM...');
      const chunks = splitTextIntoChunks(text, 12000);
      let fileQuestions: import('./types').ParsedQuestion[] = [];

      for (let c = 0; c < chunks.length; c++) {
        if (chunks.length > 1) {
          log(`    Chunk ${c + 1}/${chunks.length}...`);
        }

        const result = await parser.parseText(chunks[c], filename);

        if (result.success && result.questions.length > 0) {
          // Enrich with source info
          const enriched = result.questions.map((q) => ({
            ...q,
            sourceId: inferSourceFromFilename(filename),
            documentId: filename,
          }));
          fileQuestions.push(...enriched);
        }

        // Rate limiting
        if (c < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (fileQuestions.length > 0) {
        logSuccess(`  ${fileQuestions.length} questões extraídas`);
        summary.questions.push(...fileQuestions);
        summary.totalQuestions += fileQuestions.length;
        summary.processed++;

        summary.files.push({
          filename,
          source: inferSourceFromFilename(filename),
          questionsFound: fileQuestions.length,
          success: true,
        });
      } else {
        logWarning('  Nenhuma questão encontrada');
        summary.files.push({
          filename,
          source: inferSourceFromFilename(filename),
          questionsFound: 0,
          success: false,
          error: 'Nenhuma questão extraída',
        });
        summary.failed++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logError(`  Erro: ${msg}`);
      summary.files.push({
        filename,
        source: inferSourceFromFilename(filename),
        questionsFound: 0,
        success: false,
        error: msg,
      });
      summary.failed++;
    }

    // Rate limiting between files
    if (i < pdfFiles.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Cleanup OCR
  if (ocr) {
    await ocr.terminate();
  }

  // Save results
  console.log('\n' + '═'.repeat(50));
  log('💾 SALVANDO RESULTADOS', colors.bright);
  console.log('═'.repeat(50));

  // Save JSON
  const jsonPath = path.join(outputDir, `questions-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary.questions, null, 2));
  logSuccess(`JSON: ${jsonPath}`);

  // Generate SQL
  const sqlPath = path.join(outputDir, `questions-${Date.now()}.sql`);
  const sql = generateQuestionsSQL(summary.questions);
  fs.writeFileSync(sqlPath, sql);
  logSuccess(`SQL: ${sqlPath}`);

  // Save summary
  const summaryPath = path.join(outputDir, `summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    ...summary,
    questions: undefined, // Don't duplicate
    generatedAt: new Date().toISOString(),
  }, null, 2));
  logSuccess(`Summary: ${summaryPath}`);

  // Print summary
  console.log('\n' + '═'.repeat(50));
  log('📊 RESUMO DO PROCESSAMENTO', colors.bright);
  console.log('═'.repeat(50));
  log(`Total de arquivos: ${summary.totalFiles}`);
  logSuccess(`Processados com sucesso: ${summary.processed}`);
  if (summary.failed > 0) {
    logError(`Falhas: ${summary.failed}`);
  }
  log(`${colors.bright}Total de questões extraídas: ${summary.totalQuestions}${colors.reset}`);
  console.log('═'.repeat(50));
}

function inferSourceFromFilename(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('enare')) return 'enare';
  if (lower.includes('usp') || lower.includes('fmusp') || lower.includes('fuvest') || lower.includes('rm202')) return 'fmusp';
  if (lower.includes('unifesp')) return 'unifesp';
  if (lower.includes('unicamp')) return 'unicamp';
  if (lower.includes('santa') || lower.includes('scmsp') || lower.includes('iscmsp')) return 'santacasa';
  if (lower.includes('sus-sp') || lower.includes('ses-sp') || lower.includes('sussp')) return 'sussp';
  if (lower.includes('ufrj')) return 'ufrj';
  if (lower.includes('uel')) return 'uel';
  if (lower.includes('cermam')) return 'cermam';
  if (lower.includes('simulado')) return 'simulados';

  return 'unknown';
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  // Split by question markers
  const questionPattern = /(?=QUEST[ÃA]O\s+\d+|^\d+[\.\)]\s)/gim;
  const parts = text.split(questionPattern);

  let currentChunk = '';

  for (const part of parts) {
    if (currentChunk.length + part.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function generateQuestionsSQL(questions: import('./types').ParsedQuestion[]): string {
  const lines: string[] = [
    '-- Generated by Darwin Education Question Harvester',
    `-- ${new Date().toISOString()}`,
    `-- Total: ${questions.length} questions`,
    '',
    '-- Insert into questions table',
    'INSERT INTO questions (id, bank_id, stem, options, correct_answer, explanation, area, subspecialty, topics, difficulty, irt_discrimination, irt_difficulty, irt_guessing, source_exam, source_year, metadata)',
    'VALUES',
  ];

  const values: string[] = [];

  for (const q of questions) {
    const id = `gen()`;
    const bankId = `(SELECT id FROM question_banks WHERE code = 'harvested' LIMIT 1)`;

    const optionsJson = JSON.stringify(
      q.options.map((o) => ({
        letter: o.letter,
        text: o.text,
      }))
    ).replace(/'/g, "''");

    const topicsJson = q.topics ? JSON.stringify(q.topics).replace(/'/g, "''") : 'NULL';

    const metadataJson = JSON.stringify({
      icd10Codes: q.icd10Codes || [],
      atcCodes: q.atcCodes || [],
      confidence: q.confidence,
      parsedAt: q.parsedAt,
      sourceFile: q.documentId,
    }).replace(/'/g, "''");

    // Map area to ENAMED format
    const areaMap: Record<string, string> = {
      'Clínica Médica': 'clinica_medica',
      'Cirurgia': 'cirurgia',
      'Pediatria': 'pediatria',
      'Ginecologia e Obstetrícia': 'ginecologia_obstetricia',
      'Saúde Coletiva': 'saude_coletiva',
    };
    const area = q.area ? areaMap[q.area] || 'clinica_medica' : 'clinica_medica';

    // Map difficulty to IRT parameters
    const difficultyMap: Record<string, { discrimination: number; difficulty: number }> = {
      easy: { discrimination: 1.0, difficulty: -1.0 },
      medium: { discrimination: 1.2, difficulty: 0.0 },
      hard: { discrimination: 1.5, difficulty: 1.0 },
    };
    const irtParams = difficultyMap[q.difficulty || 'medium'] || difficultyMap.medium;

    values.push(
      `  (${id}, ${bankId}, '${q.stem.replace(/'/g, "''")}', '${optionsJson}', ${q.correctAnswer ? `'${q.correctAnswer}'` : 'NULL'}, ${q.explanation ? `'${q.explanation.replace(/'/g, "''")}'` : 'NULL'}, '${area}', ${q.subspecialty ? `'${q.subspecialty.replace(/'/g, "''")}'` : 'NULL'}, ${topicsJson !== 'NULL' ? `'${topicsJson}'` : 'NULL'}, '${q.difficulty || 'medium'}', ${irtParams.discrimination}, ${irtParams.difficulty}, 0.25, '${q.sourceId || 'harvested'}', ${new Date().getFullYear()}, '${metadataJson}')`
    );
  }

  if (values.length === 0) {
    return '-- No questions to insert';
  }

  lines.push(values.join(',\n') + ';');

  // Add harvested bank if not exists
  const header = `
-- Create harvested question bank if not exists
INSERT INTO question_banks (id, code, name, description, source_type, is_official)
SELECT gen_random_uuid(), 'harvested', 'Harvested Questions', 'Questions extracted from PDF exams', 'harvested', false
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE code = 'harvested');

`;

  return header + lines.join('\n');
}

function printJobResult(job: HarvestJob): void {
  console.log('\n' + '='.repeat(60));
  log(`📊 Resultado do Job: ${job.id}`, colors.bright);
  console.log('='.repeat(60));

  console.log(`Status: ${job.status}`);
  console.log(`Documentos encontrados: ${job.documentsFound}`);
  console.log(`Documentos processados: ${job.documentsProcessed}`);
  console.log(`Questões extraídas: ${job.questionsExtracted}`);
  console.log(`Questões válidas: ${job.questionsValid}`);

  if (job.errors.length > 0) {
    logWarning(`\n${job.errors.length} erros:`);
    job.errors.slice(0, 5).forEach((e) => {
      console.log(`  - [${e.stage}] ${e.message}`);
    });
  }

  if (job.completedAt && job.startedAt) {
    const duration = job.completedAt.getTime() - job.startedAt.getTime();
    console.log(`\nDuração: ${(duration / 1000).toFixed(1)}s`);
  }

  console.log('='.repeat(60));
}

// ============================================
// CLI Options Parser
// ============================================

interface CLIOptions {
  help?: boolean;
  sources?: boolean;
  source?: string;
  search?: string;
  all?: boolean;
  test?: boolean;
  parse?: string;
  year?: number;
  max?: number;
  ocr?: boolean;
  output?: string;
  // Batch download options
  batch?: boolean | string;
  listUrls?: boolean;
  concurrency?: number;
  skipExisting?: boolean;
  // Processing options
  process?: boolean | string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--sources':
        options.sources = true;
        break;
      case '--source':
        options.source = args[++i];
        break;
      case '--search':
        options.search = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--test':
        options.test = true;
        break;
      case '--parse':
        options.parse = args[++i];
        break;
      case '--year':
        options.year = parseInt(args[++i], 10);
        break;
      case '--max':
        options.max = parseInt(args[++i], 10);
        break;
      case '--ocr':
        options.ocr = true;
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--batch':
        // Check if next arg is a source name or another flag
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.batch = args[++i];
        } else {
          options.batch = true;
        }
        break;
      case '--list-urls':
        options.listUrls = true;
        break;
      case '--concurrency':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--no-skip-existing':
        options.skipExisting = false;
        break;
      case '--process':
        // Check if next arg is a directory or another flag
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.process = args[++i];
        } else {
          options.process = true;
        }
        break;
    }
  }

  return options;
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help || Object.keys(options).length === 0) {
    await showHelp();
    return;
  }

  if (options.sources) {
    await listSources();
    return;
  }

  if (options.listUrls) {
    await listUrlsCommand();
    return;
  }

  if (options.batch) {
    await runBatchDownload(options);
    return;
  }

  if (options.process) {
    await processDownloadedPDFs(options);
    return;
  }

  if (options.test) {
    await runTests();
    return;
  }

  if (options.parse) {
    await parseLocalFile(options.parse, options);
    return;
  }

  if (options.source) {
    await harvestFromSource(options.source, options);
    return;
  }

  if (options.search) {
    await searchAndHarvest(options.search, options);
    return;
  }

  if (options.all) {
    log('Coletando de todas as fontes...', colors.bright);
    for (const source of RESIDENCIA_SOURCES) {
      await harvestFromSource(source.id, options);
    }
    return;
  }

  await showHelp();
}

main().catch((error) => {
  logError(`Erro fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
