#!/usr/bin/env tsx
/**
 * Import Questions with Gabarito Matching
 *
 * Reads extracted questions, fetches gabaritos, and generates
 * proper SQL matching the database schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createVisionParser, type GabaritoEntry } from '../parsers/vision-question-parser';
import type { ParsedQuestion } from '../types';

// Known gabarito URLs for each source
const GABARITO_URLS: Record<string, string> = {
  sussp: 'https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/01/1_SES-SP_RM_2024_gabarito_definitivo.pdf',
  enare: 'https://www.gov.br/ebserh/pt-br/acesso-a-informacao/agentes-publicos/concursos-e-processos-seletivos/residencias/enare/enare-2025/gabarito-preliminar-enare-2025.pdf',
  fmusp: 'https://www.fm.usp.br/fmusp/conteudo/Gabarito_RM2026.pdf',
  unifesp: 'https://vestibular.unifesp.br/arquivos/provas-anteriores/residencia-medica/2025/gabarito-rm-2025.pdf',
};

// Letter to index mapping
const LETTER_TO_INDEX: Record<string, number> = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4,
};

// Difficulty mapping
const DIFFICULTY_MAP: Record<string, string> = {
  'easy': 'facil',
  'medium': 'medio',
  'hard': 'dificil',
};

interface QuestionWithNumber extends ParsedQuestion {
  number?: number;
}

async function extractGabaritoFromPDF(
  pdfPath: string,
  provider: 'grok' | 'claude' | 'openai' | 'meta' = 'grok'
): Promise<GabaritoEntry[]> {
  const apiKey = process.env.GROK_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('No API key for gabarito extraction');
    return [];
  }

  const parser = createVisionParser(provider, apiKey);
  const buffer = fs.readFileSync(pdfPath);

  // Convert PDF to images
  const pdfToImgModule = await import('pdf-to-img');
  const pdf = pdfToImgModule.pdf;

  const allAnswers: GabaritoEntry[] = [];

  console.log(`Extracting gabarito from ${path.basename(pdfPath)}...`);

  for await (const image of await pdf(buffer, { scale: 2.0 })) {
    const pageImage = {
      pageNumber: allAnswers.length + 1,
      base64: image.toString('base64'),
      mimeType: 'image/png' as const,
    };

    try {
      const answers = await parser.parseGabaritoPage(pageImage);
      allAnswers.push(...answers);
      console.log(`  Page ${pageImage.pageNumber}: ${answers.length} answers`);
    } catch (error) {
      console.warn(`  Page ${pageImage.pageNumber}: Error - ${error}`);
    }
  }

  return allAnswers;
}

function matchGabaritoToQuestions(
  questions: QuestionWithNumber[],
  gabarito: GabaritoEntry[],
  sourceId: string
): Map<string, string> {
  const matches = new Map<string, string>();

  // Create lookup by question number
  const gabaritoByNumber = new Map<number, string>();
  for (const entry of gabarito) {
    gabaritoByNumber.set(entry.questionNumber, entry.correctAnswer);
  }

  // Match questions by their number
  for (const q of questions) {
    if (q.sourceId === sourceId && q.number) {
      const answer = gabaritoByNumber.get(q.number);
      if (answer) {
        matches.set(q.id, answer);
      }
    }
  }

  return matches;
}

function generateSchemaCompliantSQL(
  questions: QuestionWithNumber[],
  gabaritoMatches: Map<string, string>
): string {
  const lines: string[] = [
    '-- Darwin Education Question Import',
    '-- Generated: ' + new Date().toISOString(),
    `-- Total: ${questions.length} questions`,
    '',
    '-- Create harvested question bank if not exists',
    `INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_active)`,
    `SELECT uuid_generate_v4(), 'Harvested Exams', 'Questions extracted from Brazilian medical residency exams', 'residencia', 2024, 2026, true`,
    `WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = 'Harvested Exams');`,
    '',
    '-- Insert questions',
  ];

  for (const q of questions) {
    const correctAnswer = gabaritoMatches.get(q.id) || q.correctAnswer;
    const correctIndex = correctAnswer ? LETTER_TO_INDEX[correctAnswer] ?? -1 : -1;

    // Map difficulty
    const difficulty = q.difficulty ? (DIFFICULTY_MAP[q.difficulty] || 'medio') : 'medio';

    // Escape strings for SQL
    const escapeSql = (str: string | undefined): string => {
      if (!str) return 'NULL';
      return `'${str.replace(/'/g, "''")}'`;
    };

    // Format options as JSONB
    const optionsJson = JSON.stringify(
      q.options.map((opt, idx) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: correctIndex === idx ? 'Resposta correta.' : null,
      }))
    ).replace(/'/g, "''");

    // ICD-10 and ATC codes
    const icd10Array = q.icd10Codes?.length
      ? `ARRAY[${q.icd10Codes.map(c => `'${c}'`).join(',')}]`
      : "'{}'";
    const atcArray = q.atcCodes?.length
      ? `ARRAY[${q.atcCodes.map(c => `'${c}'`).join(',')}]`
      : "'{}'";

    lines.push(`
INSERT INTO questions (
  bank_id, stem, options, correct_index, explanation,
  area, subspecialty, topic, icd10_codes, atc_codes,
  year, difficulty, irt_difficulty, irt_discrimination, irt_guessing
)
SELECT
  (SELECT id FROM question_banks WHERE name = 'Harvested Exams' LIMIT 1),
  ${escapeSql(q.stem)},
  '${optionsJson}'::jsonb,
  ${correctIndex >= 0 ? correctIndex : 'NULL'},
  ${escapeSql(q.explanation || 'Explicação pendente de revisão.')},
  '${q.area || 'clinica_medica'}',
  ${escapeSql(q.subspecialty)},
  ${escapeSql(q.topics?.[0])},
  ${icd10Array},
  ${atcArray},
  ${q.parsedAt ? new Date(q.parsedAt).getFullYear() : 2025},
  '${difficulty}',
  0.0,
  1.2,
  0.25
WHERE NOT EXISTS (
  SELECT 1 FROM questions
  WHERE stem = ${escapeSql(q.stem)}
  AND bank_id = (SELECT id FROM question_banks WHERE name = 'Harvested Exams' LIMIT 1)
);`);
  }

  // Add summary
  lines.push('');
  lines.push('-- Update question count');
  lines.push(`UPDATE question_banks SET question_count = (SELECT COUNT(*) FROM questions WHERE bank_id = question_banks.id) WHERE name = 'Harvested Exams';`);
  lines.push('');
  lines.push(`-- Import complete: ${questions.length} questions processed`);

  return lines.join('\n');
}

async function main() {
  const questionsPath = process.argv[2] || './questoes-vision/questions-1769914860203.json';
  const outputPath = process.argv[3] || './questoes-vision/import-schema-compliant.sql';

  console.log('Darwin Education Question Import Tool');
  console.log('=====================================\n');

  // Load questions
  console.log(`Loading questions from ${questionsPath}...`);
  const questionsJson = fs.readFileSync(questionsPath, 'utf-8');
  const questions: QuestionWithNumber[] = JSON.parse(questionsJson);
  console.log(`  Loaded ${questions.length} questions\n`);

  // Extract gabaritos from local PDF
  const allGabaritos = new Map<string, string>();

  const gabaritoPdfPath = './provas-downloaded/sussp-1_SES-SP_RM_2024_gabarito_definitivo.pdf';
  if (fs.existsSync(gabaritoPdfPath)) {
    console.log('Extracting gabarito from local PDF...');
    try {
      const gabarito = await extractGabaritoFromPDF(gabaritoPdfPath);
      console.log(`  Found ${gabarito.length} answers`);

      // Match to SUS-SP questions
      const matches = matchGabaritoToQuestions(questions, gabarito, 'sussp');
      for (const [id, answer] of matches) {
        allGabaritos.set(id, answer);
      }
      console.log(`  Matched ${matches.size} questions\n`);
    } catch (error) {
      console.warn(`  Gabarito extraction failed: ${error}\n`);
    }
  }

  // Count questions with correct answers
  let withAnswers = 0;
  for (const q of questions) {
    if (allGabaritos.has(q.id) || q.correctAnswer) {
      withAnswers++;
    }
  }
  console.log(`Questions with correct answers: ${withAnswers}/${questions.length}\n`);

  // Generate SQL
  console.log('Generating schema-compliant SQL...');
  const sql = generateSchemaCompliantSQL(questions, allGabaritos);

  fs.writeFileSync(outputPath, sql);
  console.log(`  Written to ${outputPath}`);
  console.log(`  Size: ${(sql.length / 1024).toFixed(1)} KB\n`);

  console.log('Done! Import with:');
  console.log(`  psql $DATABASE_URL < ${outputPath}`);
}

main().catch(console.error);
