/**
 * Import MedMCQA-style JSONL into Supabase SQL seeds.
 *
 * Usage:
 *   pnpm exec tsx scripts/db/import_medmcqa_to_sql.ts \
 *     --input /path/to/medmcqa.jsonl \
 *     --output infrastructure/supabase/seed/expansion/medmcqa_import.sql \
 *     --limit 500
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

type MedMcqaRow = {
  id?: string | number;
  question?: string;
  subject_name?: string;
  topic_name?: string;
  choice_type?: string;
  exp?: string;
  opa?: string;
  opb?: string;
  opc?: string;
  opd?: string;
  ope?: string;
  cop?: string | number; // often 0..3 (or 1..4) or "a".."d"
};

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
    path.join('infrastructure', 'supabase', 'seed', 'expansion', 'medmcqa_import.sql');

  const limit = Math.max(0, Number(args.limit || 500) || 500);

  const bankName = args['bank-name'] || 'MedMCQA (import)';
  const bankDescription =
    args['bank-description'] ||
    'Banco importado a partir de dataset externo (ver docs/CONTENT_EXPANSION.md para notas de licenciamento/proveniência).';

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

function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  return matches.map((u) => u.replace(/[.,;]+$/, '')).filter(Boolean);
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

function parseCorrectIndex(cop: MedMcqaRow['cop'], optionCount: number): number {
  if (typeof cop === 'number' && Number.isFinite(cop)) {
    if (cop >= 0 && cop < optionCount) return cop;
    if (cop >= 1 && cop <= optionCount) return cop - 1;
  }

  const s = String(cop || '').trim().toLowerCase();
  const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
  if (s in letterToIndex) return Math.min(optionCount - 1, Math.max(0, letterToIndex[s]));

  // Some exports store "A".."D" in strings or "optionA"
  const match = s.match(/[a-e]/);
  if (match && match[0] in letterToIndex) {
    return Math.min(optionCount - 1, Math.max(0, letterToIndex[match[0]]));
  }

  return 0;
}

function buildOptions(row: MedMcqaRow): Array<{ letter: string; text: string; feedback: string }> {
  const letters = ['A', 'B', 'C', 'D', 'E'] as const;
  const raw = [row.opa, row.opb, row.opc, row.opd, row.ope].filter((v) => typeof v === 'string' && v.trim().length > 0) as string[];
  const count = Math.max(4, Math.min(5, raw.length || 4));
  const out: Array<{ letter: string; text: string; feedback: string }> = [];

  for (let i = 0; i < count; i++) {
    const text = (raw[i] || '').trim();
    out.push({ letter: letters[i], text, feedback: '' });
  }
  return out;
}

async function readJsonLines(filePath: string, limit: number): Promise<MedMcqaRow[]> {
  const rows: MedMcqaRow[] = [];
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(JSON.parse(trimmed) as MedMcqaRow);
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
    if ((row.choice_type || '').toLowerCase() === 'multiple') continue;
    if (!row.question) continue;

    const options = buildOptions(row);
    if (options.length < 4 || options.some((o) => !o.text || o.text.trim().length === 0)) continue;
    const correctIndex = parseCorrectIndex(row.cop, options.length);
    const subject = (row.subject_name || '').trim() || null;
    const topic = (row.topic_name || '').trim() || null;
    const area = mapSubjectToArea(row.subject_name);

    const externalId =
      row.id !== undefined
        ? String(row.id)
        : crypto.createHash('sha1').update(row.question.trim()).digest('hex').slice(0, 16);
    const questionId = uuidv5(`darwin-education:medmcqa:${externalId}`, NAMESPACE_UUID);

    const explanation =
      (row.exp && row.exp.trim()) ||
      `Fonte: MedMCQA (id=${externalId}). Explicação não fornecida no export atual.`;

    const referenceList = Array.from(new Set(extractUrls(explanation))).slice(0, 6);
    const optionsJson = JSON.stringify(options);

    inserts.push(
      `(\n` +
        `  ${sqlLiteral(questionId)},\n` +
        `  ${sqlLiteral(bankId)},\n` +
        `  ${sqlLiteral(row.question.trim())},\n` +
        `  ${sqlLiteral(optionsJson)}::jsonb,\n` +
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
    '-- Import: MedMCQA → question_banks/questions',
    '-- =====================================================',
    `-- Generated: ${nowIso}`,
    `-- Input: ${args.input}`,
    `-- Limit (read): ${args.limit}`,
    `-- Rows accepted: ${accepted}`,
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
  const chunkSize = 250;
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
