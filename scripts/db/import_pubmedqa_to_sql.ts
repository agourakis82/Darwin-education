/**
 * Import PubMedQA-style JSONL into Supabase SQL seeds.
 *
 * PubMedQA is typically a 3-way QA task (yes/no/maybe). This importer converts it
 * into a 4-option MCQ for internal training/evaluation:
 *   A) Sim (suporta)
 *   B) Não (não suporta)
 *   C) Talvez / inconclusivo
 *   D) Evidência insuficiente / não descrita no abstract
 *
 * Usage:
 *   pnpm exec tsx scripts/db/import_pubmedqa_to_sql.ts \
 *     --input /path/to/pubmedqa.jsonl \
 *     --output infrastructure/supabase/seed/expansion/pubmedqa_import.sql \
 *     --limit 500 \
 *     --bank-name "PubMedQA (import)" \
 *     --bank-source community
 *
 * Notes:
 * - This script does NOT download datasets. Provide your own JSONL export.
 * - IDs are deterministic UUIDv5 (idempotent seeds).
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
    path.join('infrastructure', 'supabase', 'seed', 'expansion', 'pubmedqa_import.sql');

  const limit = Math.max(0, Number(args.limit || 500) || 500);

  const bankName = args['bank-name'] || 'PubMedQA (import)';
  const bankDescription =
    args['bank-description'] ||
    'Banco importado a partir do PubMedQA (convertido para MCQ). Ver docs/CONTENT_EXPANSION.md para notas de licenciamento/proveniência.';

  const bankSource = (args['bank-source'] || 'community') as ParsedArgs['bankSource'];
  if (!['community', 'residencia', 'concurso', 'ai_generated', 'official_enamed'].includes(bankSource)) {
    throw new Error('Invalid --bank-source (use community|residencia|concurso|ai_generated|official_enamed)');
  }

  return { input, output, limit, bankName, bankDescription, bankSource };
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

function parseFinalDecision(decision: unknown): 'yes' | 'no' | 'maybe' | null {
  if (typeof decision !== 'string') return null;
  const s = decision.trim().toLowerCase();
  if (s === 'yes' || s === 'y') return 'yes';
  if (s === 'no' || s === 'n') return 'no';
  if (s === 'maybe' || s === 'unclear') return 'maybe';
  return null;
}

function getPubmedId(row: AnyJson): string | null {
  const candidates: unknown[] = [row.pubid, row.pmid, row.pubmed_id, row.pubmedId, row.id];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c) && c > 0) return String(Math.trunc(c));
    if (typeof c === 'string' && /^\d+$/.test(c.trim())) return c.trim();
  }
  return null;
}

function getQuestionText(row: AnyJson): string {
  const q =
    (typeof row.question === 'string' ? row.question : '') ||
    (typeof row.query === 'string' ? row.query : '') ||
    (typeof row.stem === 'string' ? row.stem : '');
  return q.trim();
}

function getLongAnswer(row: AnyJson): string {
  const a =
    (typeof row.long_answer === 'string' ? row.long_answer : '') ||
    (typeof row.longAnswer === 'string' ? row.longAnswer : '') ||
    (typeof row.answer === 'string' ? row.answer : '') ||
    (typeof row.explanation === 'string' ? row.explanation : '');
  return a.trim();
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

  const inserts: string[] = [];
  let accepted = 0;

  for (const row of rows) {
    const stem = getQuestionText(row);
    if (!stem) continue;

    const finalDecision = parseFinalDecision(row.final_decision ?? row.finalDecision ?? row.label);
    if (!finalDecision) continue;

    const pmid = getPubmedId(row);
    const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;

    const options = [
      { letter: 'A', text: 'Sim — o abstract suporta a afirmação.', feedback: '' },
      { letter: 'B', text: 'Não — o abstract não suporta a afirmação.', feedback: '' },
      { letter: 'C', text: 'Talvez — evidência inconclusiva/resultado misto.', feedback: '' },
      { letter: 'D', text: 'Evidência insuficiente — o abstract não descreve dados suficientes.', feedback: '' },
    ];

    const correctIndex = finalDecision === 'yes' ? 0 : finalDecision === 'no' ? 1 : 2;

    const rawLong = getLongAnswer(row);
    const explanationParts: string[] = [];
    if (rawLong) explanationParts.push(rawLong);
    explanationParts.push('');
    explanationParts.push('Referências:');
    if (pubmedUrl) explanationParts.push(pubmedUrl);
    const explanation = explanationParts.join('\n').trim();

    const subject =
      typeof row.subject_name === 'string'
        ? row.subject_name
        : typeof row.subject === 'string'
        ? row.subject
        : typeof row.category === 'string'
        ? row.category
        : undefined;
    const topic =
      typeof row.topic_name === 'string'
        ? row.topic_name
        : typeof row.topic === 'string'
        ? row.topic
        : undefined;

    const area = mapSubjectToArea(subject);

    const externalId = pmid || crypto.createHash('sha1').update(stem).digest('hex').slice(0, 16);
    const questionId = uuidv5(`darwin-education:pubmedqa:${externalId}`, NAMESPACE_UUID);

    const referenceList = pubmedUrl ? [pubmedUrl] : [];

    inserts.push(
      `(\n` +
        `  ${sqlLiteral(questionId)},\n` +
        `  ${sqlLiteral(bankId)},\n` +
        `  ${sqlLiteral(stem)},\n` +
        `  ${sqlLiteral(JSON.stringify(options))}::jsonb,\n` +
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
    '-- Import: PubMedQA → question_banks/questions',
    '-- =====================================================',
    `-- Generated: ${nowIso}`,
    `-- Input: ${args.input}`,
    `-- Limit (read): ${args.limit}`,
    `-- Rows accepted: ${accepted}`,
    '--',
    '-- WARNING:',
    '-- - Confirm dataset license/provenance before shipping.',
    '-- - PubMedQA is not a traditional MCQ exam dataset; items are converted for internal use.',
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
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
