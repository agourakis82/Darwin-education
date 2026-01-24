#!/usr/bin/env node
/**
 * Generate Supabase seed SQL from ENAMED 2025 microdata
 * IRT-only mode (no PDF content)
 *
 * Run: node generate-sql.mjs
 */

import { createReadStream, writeFileSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ITEM_PARAMS_FILE = path.resolve(
  __dirname,
  '../../../../microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt'
);

const OUTPUT_DIR = path.join(__dirname, 'outputs');
const SQL_FILE = path.join(OUTPUT_DIR, '05_enamed_2025_questions.sql');

// Configuration
const QUESTION_BANK_ID = 'enamed-2025-official';
const QUESTION_BANK_NAME = 'ENAMED 2025 Oficial';
const K_FACTOR = 3.0; // For discrimination estimation

// Area mapping
const AREA_MAP = {
  1: 'clinica_medica',
  2: 'cirurgia',
  3: 'pediatria',
  4: 'ginecologia_obstetricia',
  5: 'saude_coletiva',
};

function inferArea(itemNumber) {
  if (itemNumber <= 20) return 'clinica_medica';
  if (itemNumber <= 40) return 'cirurgia';
  if (itemNumber <= 60) return 'pediatria';
  if (itemNumber <= 80) return 'ginecologia_obstetricia';
  return 'saude_coletiva';
}

function estimateDiscrimination(biserial) {
  if (!biserial || biserial < 0.05) {
    return 1.0; // Rasch model fallback
  }
  const estimated = Math.abs(biserial) * K_FACTOR;
  return Math.max(0.3, Math.min(2.5, estimated));
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    const escaped = json.replace(/'/g, "''");
    return `'${escaped}'::jsonb`;
  }
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

console.log('\n╔════════════════════════════════════════════╗');
console.log('║ ENAMED 2025 SQL Generator                  ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log(`Reading: ${ITEM_PARAMS_FILE}`);
console.log(`Output: ${SQL_FILE}\n`);

// Ensure output directory
mkdirSync(OUTPUT_DIR, { recursive: true });

// Parse items
const items = [];
let lineCount = 0;
let isFirstLine = true;

const fileStream = createReadStream(ITEM_PARAMS_FILE, { encoding: 'utf-8' });
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  if (isFirstLine) {
    isFirstLine = false;
    return;
  }

  if (!line.trim()) return;

  lineCount++;
  const parts = line.split(';');

  if (parts.length >= 7) {
    const [nuItem1, nuItem2, itemMantido, paramB, corBis, infit, outfit] = parts;

    const itemNumber = parseInt(nuItem1, 10);
    const kept = parseInt(itemMantido, 10);
    const difficulty = paramB ? parseFloat(paramB) : null;
    const biserial = corBis ? parseFloat(corBis) : null;
    const infitVal = infit ? parseFloat(infit) : null;
    const outfitVal = outfit ? parseFloat(outfit) : null;

    if (kept === 1 && difficulty !== null) {
      const discrimination = estimateDiscrimination(biserial);
      const area = inferArea(itemNumber);

      items.push({
        id: `q-enamed-2025-${itemNumber.toString().padStart(3, '0')}`,
        itemNumber,
        difficulty,
        discrimination,
        guessing: 0.25,
        infit: infitVal,
        outfit: outfitVal,
        area,
      });
    }
  }
});

rl.on('close', () => {
  console.log(`✓ Parsed ${items.length} valid items\n`);

  // Generate SQL
  const timestamp = new Date().toISOString();
  const sql = [
    `-- ============================================================================`,
    `-- ENAMED 2025 Official Questions with IRT Parameters`,
    `-- Generated: ${timestamp}`,
    `-- Source: Microdados ENAMED 2025`,
    `-- Items: ${items.length} questions with IRT calibration`,
    `-- ============================================================================`,
    ``,
    `-- Insert question bank`,
    `INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`,
    `VALUES (`,
    `  '${QUESTION_BANK_ID}',`,
    `  '${QUESTION_BANK_NAME}',`,
    `  'Questões oficiais do ENAMED 2025 com parâmetros IRT calibrados',`,
    `  'official_enamed',`,
    `  2025,`,
    `  2025,`,
    `  FALSE`,
    `)`,
    `ON CONFLICT (id) DO UPDATE SET updated_at = NOW();`,
    ``,
    `-- Insert ${items.length} questions with IRT parameters`,
    `INSERT INTO questions (`,
    `  id,`,
    `  bank_id,`,
    `  stem,`,
    `  options,`,
    `  correct_index,`,
    `  area,`,
    `  irt_difficulty,`,
    `  irt_discrimination,`,
    `  irt_guessing,`,
    `  irt_infit,`,
    `  irt_outfit,`,
    `  year,`,
    `  validated_by`,
    `)`,
    `VALUES`,
  ];

  // Add question rows
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const placeholder = `[Questão ${item.itemNumber} - Conteúdo pendente de extração do PDF]`;
    const options = [
      { letter: 'A', text: '[Opção A]', feedback: '' },
      { letter: 'B', text: '[Opção B]', feedback: '' },
      { letter: 'C', text: '[Opção C]', feedback: '' },
      { letter: 'D', text: '[Opção D]', feedback: '' },
    ];

    const comma = i < items.length - 1 ? ',' : '';

    sql.push(
      `  (`,
      `    '${item.id}',`,
      `    '${QUESTION_BANK_ID}',`,
      `    ${sqlValue(placeholder)},`,
      `    ${sqlValue(options)},`,
      `    0,`,
      `    '${item.area}',`,
      `    ${item.difficulty},`,
      `    ${item.discrimination},`,
      `    ${item.guessing},`,
      `    ${sqlValue(item.infit)},`,
      `    ${sqlValue(item.outfit)},`,
      `    2025,`,
      `    'expert'`,
      `  )${comma}`
    );
  }

  sql.push(
    `ON CONFLICT (id) DO UPDATE SET`,
    `  irt_difficulty = EXCLUDED.irt_difficulty,`,
    `  irt_discrimination = EXCLUDED.irt_discrimination,`,
    `  irt_guessing = EXCLUDED.irt_guessing,`,
    `  irt_infit = EXCLUDED.irt_infit,`,
    `  irt_outfit = EXCLUDED.irt_outfit,`,
    `  updated_at = NOW();`,
    ``,
    `-- Update question count`,
    `UPDATE question_banks`,
    `SET question_count = (`,
    `  SELECT COUNT(*) FROM questions WHERE bank_id = '${QUESTION_BANK_ID}'`,
    `)`,
    `WHERE id = '${QUESTION_BANK_ID}';`,
    ``
  );

  const content = sql.join('\n');

  // Write file
  writeFileSync(SQL_FILE, content, 'utf-8');

  console.log(`📄 Generated SQL file:`);
  console.log(`   Path: ${SQL_FILE}`);
  console.log(`   Size: ${(content.length / 1024).toFixed(1)} KB`);
  console.log(`   Lines: ${content.split('\n').length}`);
  console.log(`   Questions: ${items.length}\n`);

  // Statistics
  const areas = {};
  let totalDifficulty = 0;
  let totalDiscrimination = 0;

  for (const item of items) {
    areas[item.area] = (areas[item.area] || 0) + 1;
    totalDifficulty += item.difficulty;
    totalDiscrimination += item.discrimination;
  }

  console.log(`📊 Statistics:`);
  console.log(`   Difficulty (b): ${(totalDifficulty / items.length).toFixed(3)} avg`);
  console.log(`   Discrimination (a): ${(totalDiscrimination / items.length).toFixed(3)} avg`);
  console.log(`   By area:`);
  for (const [area, count] of Object.entries(areas)) {
    console.log(`     - ${area}: ${count}`);
  }

  console.log(`\n✅ SQL generation completed!\n`);
  console.log(`📥 To import into Supabase:\n`);
  console.log(`   psql $DATABASE_URL < ${SQL_FILE}\n`);
});

rl.on('error', (error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
