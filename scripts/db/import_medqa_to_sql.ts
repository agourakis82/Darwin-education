/**
 * Import MedQA-style JSONL into Supabase SQL seeds.
 *
 * Usage:
 *   pnpm exec tsx scripts/db/import_medqa_to_sql.ts \
 *     --input /path/to/medqa.jsonl \
 *     --output infrastructure/supabase/seed/expansion/medqa_import.sql \
 *     --limit 500 \
 *     --bank-name "MedQA (import)" \
 *     --bank-source community \
 *     --enrich
 *
 * Notes:
 * - This script does NOT download datasets. Provide your own JSONL export.
 * - IDs are deterministic UUIDv5 (idempotent seeds).
 * - If `--enrich` is enabled, missing/weak explanations will be generated via Grok-compatible API.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

type EnamedArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'ginecologia_obstetricia'
  | 'pediatria'
  | 'saude_coletiva';

type AnyJson = Record<string, unknown>;

type ParsedArgs = {
  input: string;
  output: string;
  limit: number;
  bankName: string;
  bankDescription: string;
  bankSource: 'community' | 'residencia' | 'concurso' | 'ai_generated' | 'official_enamed';
  enrich: boolean;
  model: string;
  baseUrl: string;
};

const NAMESPACE_UUID = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace

function parseArgs(argv: string[]): ParsedArgs {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
    } else {
      args[key] = next;
      i++;
    }
  }

  const input = args.input;
  if (!input) throw new Error('Missing --input');

  const output =
    args.output ||
    path.join('infrastructure', 'supabase', 'seed', 'expansion', 'medqa_import.sql');

  const limit = Math.max(0, Number(args.limit || 500) || 500);

  const bankName = args['bank-name'] || 'MedQA (import)';
  const bankDescription =
    args['bank-description'] ||
    'Banco importado a partir de dataset externo (ver docs/CONTENT_EXPANSION.md para notas de licenciamento/proveniência).';

  const bankSource = (args['bank-source'] || 'community') as ParsedArgs['bankSource'];
  if (!['community', 'residencia', 'concurso', 'ai_generated', 'official_enamed'].includes(bankSource)) {
    throw new Error('Invalid --bank-source (use community|residencia|concurso|ai_generated|official_enamed)');
  }

  const enrich = args.enrich === 'true';
  const model = args.model || 'grok-4-1-fast';
  const baseUrl = args['base-url'] || 'https://api.x.ai/v1';

  return { input, output, limit, bankName, bankDescription, bankSource, enrich, model, baseUrl };
}

function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) throw new Error(`Invalid UUID: ${uuid}`);
  return Buffer.from(hex, 'hex');
}

function bytesToUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

function uuidv5(name: string, namespace: string): string {
  const nsBytes = uuidToBytes(namespace);
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest();

  // Set version 5 (0101)
  hash[6] = (hash[6] & 0x0f) | 0x50;
  // Set variant RFC4122 (10xx)
  hash[8] = (hash[8] & 0x3f) | 0x80;

  return bytesToUuid(hash.subarray(0, 16));
}

function sqlLiteral(value: string): string {
  return `'${(value || '').replace(/'/g, "''")}'`;
}

function sqlTextArray(values: string[]): string {
  if (!values || values.length === 0) return `'{}'::text[]`;
  const items = values.map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `'{${items.join(',')}}'::text[]`;
}

function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  return matches.map((u) => u.replace(/[.,;]+$/, '')).filter(Boolean);
}

const AUTHORITATIVE_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'doi.org',
  'who.int',
  'cdc.gov',
  'nih.gov',
  'clinicaltrials.gov',
  'anvisa.gov.br',
  'saude.gov.br',
  'gov.br',
  'sbcardiologia.org.br',
  'febrasgo.org.br',
  'sbp.com.br',
  'sbpd.org.br',
  'sbim.org.br',
  'amb.org.br',
  'nejm.org',
  'thelancet.com',
  'bmj.com',
  'jama.com',
  'acpjournals.org',
  'uptodate.com',
] as const;

function isAuthoritativeUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AUTHORITATIVE_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return false;
  }
}

function mapSubjectToArea(subject: string | undefined): EnamedArea {
  const s = (subject || '').toLowerCase();
  if (/(obst|gyn|ginec|gynec|ob\/gyn|obg)/i.test(subject || '')) return 'ginecologia_obstetricia';
  if (s.includes('pediat')) return 'pediatria';
  if (s.includes('surgery') || s.includes('cirurg') || s.includes('orthop') || s.includes('ortho')) return 'cirurgia';
  if (s.includes('community') || s.includes('preventive') || s.includes('public health') || s.includes('epidemi')) {
    return 'saude_coletiva';
  }
  return 'clinica_medica';
}

function normalizeOptionText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function getOptions(row: AnyJson): string[] {
  const fromArray = (row.options || row.choices || row.alternatives) as unknown;
  if (Array.isArray(fromArray)) {
    const out = fromArray.map(normalizeOptionText).filter(Boolean) as string[];
    return out.slice(0, 5);
  }

  const fromObject = (row.options || row.choices || row.alternatives) as unknown;
  if (fromObject && typeof fromObject === 'object' && !Array.isArray(fromObject)) {
    const obj = fromObject as Record<string, unknown>;
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const out: string[] = [];
    for (const letter of letters) {
      const v = normalizeOptionText(obj[letter] ?? obj[letter.toLowerCase()]);
      if (v) out.push(v);
    }
    if (out.length >= 4) return out;
  }

  // Fallback: opa/opb/opc...
  const out: string[] = [];
  for (const key of ['opa', 'opb', 'opc', 'opd', 'ope']) {
    const v = normalizeOptionText(row[key]);
    if (v) out.push(v);
  }
  return out.slice(0, 5);
}

function parseCorrectIndex(row: AnyJson, optionCount: number): number | null {
  const candidates: unknown[] = [
    row.correct_index,
    row.answer_idx,
    row.answer_index,
    row.correctIndex,
    row.cop,
    row.answer,
    row.correct,
    row.label,
  ];

  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) {
      if (c >= 0 && c < optionCount) return c;
      if (c >= 1 && c <= optionCount) return c - 1;
    }
  }

  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const s = c.trim().toLowerCase();
    const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
    if (s in letterToIndex) return Math.min(optionCount - 1, Math.max(0, letterToIndex[s]));
    const match = s.match(/[a-e]/);
    if (match && match[0] in letterToIndex) {
      return Math.min(optionCount - 1, Math.max(0, letterToIndex[match[0]]));
    }
  }

  return null;
}

function buildOptionsJson(options: string[]): Array<{ letter: string; text: string; feedback: string }> {
  const letters = ['A', 'B', 'C', 'D', 'E'] as const;
  return options.slice(0, 5).map((text, idx) => ({
    letter: letters[idx],
    text,
    feedback: '',
  }));
}

async function readJsonLines(filePath: string, limit: number): Promise<AnyJson[]> {
  const rows: AnyJson[] = [];
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(JSON.parse(trimmed) as AnyJson);
    if (limit > 0 && rows.length >= limit) break;
  }

  return rows;
}

async function callGrokChat(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const response = await fetch(`${params.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxTokens ?? 900,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as any;
  return String(data?.choices?.[0]?.message?.content || '');
}

async function buildExplanationWithReferences(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  stem: string;
  options: string[];
  correctIndex: number;
}): Promise<string> {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const correctLetter = letters[params.correctIndex] || 'A';

  const system =
    'Você é um médico tutor e revisor de questões. Responda em pt-BR, sem markdown, com precisão clínica. ' +
    'A explicação deve estar de acordo com consensos de sociedades médicas e literatura de alto impacto. ' +
    'Não invente referências: cite apenas URLs plausíveis e verificáveis.';

  const user =
    [
      `Enunciado: ${params.stem}`,
      `Alternativas: ${params.options.map((t, i) => `${letters[i]}. ${t}`).join(' | ')}`,
      `Gabarito: ${correctLetter}`,
      '',
      'Tarefa:',
      '- Explique por que a alternativa correta está certa.',
      '- Explique por que cada distrator está errado (A–D/E).',
      '- Termine com "Referências:" e liste 2–3 fontes com URL (sociedades médicas, PubMed/NCBI, periódicos Q1 quando aplicável).',
    ].join('\n');

  const first = await callGrokChat({
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    model: params.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const urls = extractUrls(first);
  if (urls.length > 0 && urls.some(isAuthoritativeUrl)) return first.trim();

  const second = await callGrokChat({
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    model: params.model,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content:
          user +
          '\n\nIMPORTANTE: Refaça e inclua 2–3 URLs explícitas e autoritativas nas Referências (preferir PubMed/NCBI, sociedades médicas, periódicos de alto impacto).',
      },
    ],
  });

  const urls2 = extractUrls(second);
  if (urls2.length === 0) {
    throw new Error('Enrichment failed: no URLs produced in explanation');
  }
  if (!urls2.some(isAuthoritativeUrl)) {
    throw new Error('Enrichment failed: no authoritative URLs produced in explanation');
  }

  return second.trim();
}

async function main() {
  const args = parseArgs(process.argv);

  const inputPath = path.resolve(process.cwd(), args.input);
  const outputPath = path.resolve(process.cwd(), args.output);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const bankId = uuidv5(`darwin-education:question-bank:${args.bankName}`, NAMESPACE_UUID);
  const nowIso = new Date().toISOString();

  const rows = await readJsonLines(inputPath, args.limit);

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
  if (args.enrich && !apiKey) {
    throw new Error('Missing GROK_API_KEY / XAI_API_KEY for --enrich');
  }

  const inserts: string[] = [];
  let accepted = 0;
  let enriched = 0;

  for (const row of rows) {
    const stem = typeof row.question === 'string' ? row.question.trim() : typeof row.stem === 'string' ? row.stem.trim() : '';
    if (!stem) continue;

    const optionsText = getOptions(row);
    if (optionsText.length < 4) continue;

    const correctIndex = parseCorrectIndex(row, optionsText.length);
    if (correctIndex === null) continue;

    const optionsJson = buildOptionsJson(optionsText);

    const subject =
      (typeof row.subject === 'string' ? row.subject : typeof row.subject_name === 'string' ? row.subject_name : undefined) ||
      (typeof row.category === 'string' ? row.category : undefined);
    const topic =
      (typeof row.topic === 'string' ? row.topic : typeof row.topic_name === 'string' ? row.topic_name : undefined) || undefined;

    const area = mapSubjectToArea(subject);

    const externalId =
      row.id !== undefined
        ? String(row.id)
        : crypto.createHash('sha1').update(stem).digest('hex').slice(0, 16);
    const questionId = uuidv5(`darwin-education:medqa:${externalId}`, NAMESPACE_UUID);

    let explanation =
      (typeof row.explanation === 'string' ? row.explanation : typeof row.rationale === 'string' ? row.rationale : '')?.trim();

    const urls = extractUrls(explanation);
    const needsEnrichment = !explanation || urls.length === 0 || !urls.some(isAuthoritativeUrl);
    if (needsEnrichment) {
      if (!args.enrich) continue;
      explanation = await buildExplanationWithReferences({
        apiKey,
        baseUrl: args.baseUrl,
        model: args.model,
        stem,
        options: optionsText,
        correctIndex,
      });
      enriched++;
    }

    const referenceList = Array.from(new Set(extractUrls(explanation))).slice(0, 6);

    inserts.push(
      `(\n` +
        `  ${sqlLiteral(questionId)},\n` +
        `  ${sqlLiteral(bankId)},\n` +
        `  ${sqlLiteral(stem)},\n` +
        `  ${sqlLiteral(JSON.stringify(optionsJson))}::jsonb,\n` +
        `  ${correctIndex},\n` +
        `  ${sqlLiteral(explanation)},\n` +
        `  ${sqlLiteral(area)},\n` +
        `  ${subject ? sqlLiteral(subject) : 'NULL'},\n` +
        `  ${topic ? sqlLiteral(topic) : 'NULL'},\n` +
        `  NULL,\n` +
        `  'community',\n` +
        `  ${sqlTextArray(referenceList)}\n` +
        `)`
    );

    accepted++;
  }

  const header = [
    '-- =====================================================',
    '-- Import: MedQA → question_banks/questions',
    '-- =====================================================',
    `-- Generated: ${nowIso}`,
    `-- Input: ${args.input}`,
    `-- Limit (read): ${args.limit}`,
    `-- Rows accepted: ${accepted}`,
    `-- Rows enriched: ${enriched}`,
    '--',
    '-- WARNING:',
    '-- - Confirm dataset license/provenance before shipping.',
    '-- - Do not publish copyrighted exam items without permission.',
    '',
  ].join('\n');

  const bankSql =
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS reference_list TEXT[] DEFAULT '{}'::text[];\n` +
    `INSERT INTO question_banks (id, name, description, source, is_premium, is_active, created_at, updated_at)\n` +
    `VALUES (\n` +
    `  ${sqlLiteral(bankId)},\n` +
    `  ${sqlLiteral(args.bankName)},\n` +
    `  ${sqlLiteral(args.bankDescription)},\n` +
    `  ${sqlLiteral(args.bankSource)},\n` +
    `  FALSE,\n` +
    `  TRUE,\n` +
    `  NOW(),\n` +
    `  NOW()\n` +
    `)\n` +
    `ON CONFLICT (id) DO UPDATE SET\n` +
    `  name = EXCLUDED.name,\n` +
    `  description = EXCLUDED.description,\n` +
    `  source = EXCLUDED.source,\n` +
    `  updated_at = NOW();\n`;

  const questionSqlHeader =
    `INSERT INTO questions (\n` +
    `  id,\n` +
    `  bank_id,\n` +
    `  stem,\n` +
    `  options,\n` +
    `  correct_index,\n` +
    `  explanation,\n` +
    `  area,\n` +
    `  subspecialty,\n` +
    `  topic,\n` +
    `  year,\n` +
    `  validated_by,\n` +
    `  reference_list\n` +
    `)\n` +
    `VALUES\n`;

  const chunks: string[] = [];
  const chunkSize = 200;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    chunks.push(questionSqlHeader + chunk.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, header + bankSql + '\n' + chunks.join('\n'), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote: ${path.relative(process.cwd(), outputPath)}`);
  // eslint-disable-next-line no-console
  console.log(`Bank id: ${bankId}`);
  // eslint-disable-next-line no-console
  console.log(`Questions: ${accepted}`);
  // eslint-disable-next-line no-console
  console.log(`Enriched: ${enriched}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
