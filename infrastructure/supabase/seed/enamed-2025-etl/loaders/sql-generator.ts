/**
 * SQL Generator
 * Generates Supabase seed SQL from processed questions
 */

import { writeFileSync } from 'fs';
import path from 'path';
import { QUESTION_BANK_CONFIG, OUTPUT_DIR } from '../config';
import type { CompleteQuestion, StatisticsReport } from '../types';

/**
 * Escape single quotes for SQL strings
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Format a value for SQL (handles null, strings, numbers, JSON)
 */
function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'object') {
    return `'${escapeSql(JSON.stringify(value))}'::jsonb`;
  }
  return `'${escapeSql(String(value))}'`;
}

/**
 * Generate SQL for question bank insert
 */
function generateQuestionBankSQL(): string {
  const { id, name, description, source, year } = QUESTION_BANK_CONFIG;

  return `
-- Question bank for ENAMED 2025 official microdata
INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)
VALUES (
  '${id}',
  '${escapeSql(name)}',
  '${escapeSql(description)}',
  '${source}',
  ${year},
  ${year},
  FALSE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
`;
}

/**
 * Generate SQL for a single question insert
 */
function generateQuestionSQL(question: CompleteQuestion): string {
  const options = question.options.map((opt) => ({
    letter: opt.letter,
    text: opt.text,
    feedback: '',
  }));

  return `  (
    '${question.id}',
    '${question.bankId}',
    ${sqlValue(question.stem)},
    ${sqlValue(options)},
    ${question.correctIndex},
    ${sqlValue(question.explanation || null)},
    '${question.area}',
    NULL, -- subspecialty
    NULL, -- topic
    ${question.irt.difficulty},
    ${question.irt.discrimination},
    ${question.irt.guessing},
    ${sqlValue(question.irt.infit)},
    ${sqlValue(question.irt.outfit)},
    ${question.year},
    'expert'
  )`;
}

/**
 * Generate complete SQL file for all questions
 */
export function generateQuestionsSql(questions: CompleteQuestion[]): string {
  const header = `-- ============================================================================
-- ENAMED 2025 Official Questions with IRT Parameters
-- Generated: ${new Date().toISOString()}
-- Source: Microdados ENAMED 2025 + INEP Portal PDFs
-- ============================================================================

-- Ensure question_banks table exists (should be created by schema.sql)
`;

  const bankSql = generateQuestionBankSQL();

  const questionsHeader = `
-- Insert ${questions.length} questions from ENAMED 2025
-- IRT Parameters: difficulty (b), discrimination (a), guessing (c), infit, outfit
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  area,
  subspecialty,
  topic,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  irt_infit,
  irt_outfit,
  year,
  validated_by
)
VALUES
`;

  const questionValues = questions.map(generateQuestionSQL).join(',\n');

  const footer = `
ON CONFLICT (id) DO UPDATE SET
  stem = EXCLUDED.stem,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  irt_difficulty = EXCLUDED.irt_difficulty,
  irt_discrimination = EXCLUDED.irt_discrimination,
  irt_guessing = EXCLUDED.irt_guessing,
  irt_infit = EXCLUDED.irt_infit,
  irt_outfit = EXCLUDED.irt_outfit,
  updated_at = NOW();

-- Update question count in question_banks
UPDATE question_banks
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE bank_id = '${QUESTION_BANK_CONFIG.id}'
)
WHERE id = '${QUESTION_BANK_CONFIG.id}';
`;

  return header + bankSql + questionsHeader + questionValues + footer;
}

/**
 * Generate SQL for IRT-only questions (no content, just parameters)
 * Useful when PDF parsing fails
 */
export function generateIRTOnlySql(
  items: Array<{
    itemNumber: number;
    difficulty: number;
    discrimination: number;
    guessing: number;
    infit: number | null;
    outfit: number | null;
    area: string;
  }>
): string {
  const header = `-- ============================================================================
-- ENAMED 2025 IRT Parameters Only (No Question Content)
-- Generated: ${new Date().toISOString()}
-- Source: Microdados ENAMED 2025
-- ============================================================================

`;

  const bankSql = generateQuestionBankSQL();

  const questionsHeader = `
-- Insert ${items.length} questions with IRT parameters only
-- Content should be added manually or via PDF parsing
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  area,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  irt_infit,
  irt_outfit,
  year,
  validated_by
)
VALUES
`;

  const values = items.map((item, i) => {
    const id = `q-enamed-2025-${item.itemNumber.toString().padStart(3, '0')}`;
    const placeholder = `[Questão ${item.itemNumber} - Conteúdo pendente]`;
    const options = [
      { letter: 'A', text: '[A]', feedback: '' },
      { letter: 'B', text: '[B]', feedback: '' },
      { letter: 'C', text: '[C]', feedback: '' },
      { letter: 'D', text: '[D]', feedback: '' },
    ];

    return `  (
    '${id}',
    '${QUESTION_BANK_CONFIG.id}',
    ${sqlValue(placeholder)},
    ${sqlValue(options)},
    0,
    '${item.area}',
    ${item.difficulty},
    ${item.discrimination},
    ${item.guessing},
    ${sqlValue(item.infit)},
    ${sqlValue(item.outfit)},
    2025,
    'expert'
  )`;
  });

  const footer = `
ON CONFLICT (id) DO UPDATE SET
  irt_difficulty = EXCLUDED.irt_difficulty,
  irt_discrimination = EXCLUDED.irt_discrimination,
  irt_guessing = EXCLUDED.irt_guessing,
  irt_infit = EXCLUDED.irt_infit,
  irt_outfit = EXCLUDED.irt_outfit,
  updated_at = NOW();

-- Update question count
UPDATE question_banks
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE bank_id = '${QUESTION_BANK_CONFIG.id}'
)
WHERE id = '${QUESTION_BANK_CONFIG.id}';
`;

  return header + bankSql + questionsHeader + values.join(',\n') + footer;
}

/**
 * Generate SQL for statistics table
 */
export function generateStatisticsSql(stats: StatisticsReport): string {
  return `-- ============================================================================
-- ENAMED 2025 Statistics
-- Generated: ${stats.generatedAt}
-- ============================================================================

-- Create statistics table if not exists
CREATE TABLE IF NOT EXISTS enamed_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, metric_name)
);

-- Insert statistics
INSERT INTO enamed_statistics (year, metric_name, metric_value)
VALUES
  (2025, 'participant_counts', ${sqlValue({
    total: stats.totalRecords,
    valid: stats.validCompletions,
  })}),
  (2025, 'theta_distribution', ${sqlValue(stats.thetaDistribution)}),
  (2025, 'scaled_score_distribution', ${sqlValue(stats.scaledScoreDistribution)}),
  (2025, 'area_statistics', ${sqlValue(stats.areaStatistics)}),
  (2025, 'item_parameters', ${sqlValue({
    difficultyRange: stats.itemDifficultyRange,
    discriminationRange: stats.itemDiscriminationRange,
    excludedItems: stats.excludedItems,
  })})
ON CONFLICT (year, metric_name) DO UPDATE SET
  metric_value = EXCLUDED.metric_value,
  created_at = NOW();
`;
}

/**
 * Write SQL file to output directory
 */
export function writeSqlFile(
  filename: string,
  content: string,
  outputDir?: string
): string {
  const dir = outputDir || path.join(OUTPUT_DIR, '..');
  const filePath = path.join(dir, filename);

  writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${filePath} (${content.length} bytes)`);

  return filePath;
}

/**
 * Generate all SQL files
 */
export function generateAllSql(
  questions: CompleteQuestion[],
  stats?: StatisticsReport
): { questionsFile: string; statsFile?: string } {
  // Main questions file
  const questionsSql = generateQuestionsSql(questions);
  const questionsFile = writeSqlFile('05_enamed_2025_questions.sql', questionsSql);

  // Statistics file (optional)
  let statsFile: string | undefined;
  if (stats) {
    const statsSql = generateStatisticsSql(stats);
    statsFile = writeSqlFile('06_enamed_2025_statistics.sql', statsSql);
  }

  return { questionsFile, statsFile };
}
