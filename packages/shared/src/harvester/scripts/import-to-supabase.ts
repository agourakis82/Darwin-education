#!/usr/bin/env tsx
/**
 * Import Questions to Supabase
 *
 * Reads extracted questions JSON and imports directly to Supabase
 * using the service role key for full access.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { ParsedQuestion } from '../types';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpzkjkwcoudaxscrukye.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('Set it in your environment or .env.local file');
  process.exit(1);
}

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

// Valid ENAMED areas (from schema constraint)
const VALID_AREAS = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'];

// Area normalization
const AREA_MAP: Record<string, string> = {
  'obstetricia': 'ginecologia_obstetricia',
  'ginecologia': 'ginecologia_obstetricia',
  'medicina_interna': 'clinica_medica',
  'clinica': 'clinica_medica',
  'saude_publica': 'saude_coletiva',
  'epidemiologia': 'saude_coletiva',
};

function normalizeArea(area: string | undefined): string {
  if (!area) return 'clinica_medica';
  const normalized = AREA_MAP[area] || area;
  return VALID_AREAS.includes(normalized) ? normalized : 'clinica_medica';
}

interface QuestionWithNumber extends ParsedQuestion {
  number?: number;
}

interface QuestionInsert {
  bank_id: string;
  stem: string;
  options: Array<{ letter: string; text: string; feedback?: string | null }>;
  correct_index: number;
  explanation: string;
  area: string;
  subspecialty: string | null;
  topic: string | null;
  icd10_codes: string[];
  atc_codes: string[];
  year: number;
  difficulty: string;
  irt_difficulty: number;
  irt_discrimination: number;
  irt_guessing: number;
}

async function main() {
  const questionsPath = process.argv[2] || './questoes-vision/questions-1769914860203.json';
  const batchSize = parseInt(process.argv[3] || '50', 10);

  console.log('🚀 Darwin Education - Supabase Question Import');
  console.log('='.repeat(50));

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false }
  });

  // Load questions
  console.log(`\n📂 Loading questions from ${questionsPath}...`);
  const questionsJson = fs.readFileSync(questionsPath, 'utf-8');
  const questions: QuestionWithNumber[] = JSON.parse(questionsJson);
  console.log(`   Loaded ${questions.length} questions`);

  // Check/create question bank
  console.log('\n📦 Checking question bank...');
  let { data: existingBank } = await supabase
    .from('question_banks')
    .select('id')
    .eq('name', 'Harvested Exams')
    .single();

  let bankId: string;

  if (existingBank) {
    bankId = existingBank.id;
    console.log(`   Found existing bank: ${bankId}`);
  } else {
    console.log('   Creating new question bank...');
    const { data: newBank, error } = await supabase
      .from('question_banks')
      .insert({
        name: 'Harvested Exams',
        description: 'Questions extracted from Brazilian medical residency exams using Vision AI',
        source: 'residencia',
        year_start: 2024,
        year_end: 2026,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to create bank:', error.message);
      process.exit(1);
    }
    bankId = newBank!.id;
    console.log(`   Created new bank: ${bankId}`);
  }

  // Get existing stems to avoid duplicates
  console.log('\n🔍 Checking for existing questions...');
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('stem')
    .eq('bank_id', bankId);

  const existingStems = new Set(existingQuestions?.map((q: { stem: string }) => q.stem) || []);
  console.log(`   Found ${existingStems.size} existing questions`);

  // Filter out duplicates
  const newQuestions = questions.filter(q => !existingStems.has(q.stem));
  console.log(`   ${newQuestions.length} new questions to import`);

  if (newQuestions.length === 0) {
    console.log('\n✅ No new questions to import. Database is up to date.');
    return;
  }

  // Prepare questions for insert
  // Note: correct_index defaults to 0 if unknown (will be updated via gabarito matching)
  const questionsToInsert: QuestionInsert[] = newQuestions.map(q => {
    const correctIndex = q.correctAnswer ? LETTER_TO_INDEX[q.correctAnswer] ?? 0 : 0;
    const difficulty = q.difficulty ? (DIFFICULTY_MAP[q.difficulty] || 'medio') : 'medio';
    const hasCorrectAnswer = q.correctAnswer !== undefined && q.correctAnswer !== null;

    return {
      bank_id: bankId,
      stem: q.stem,
      options: q.options.map((opt, idx) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: hasCorrectAnswer && correctIndex === idx ? 'Resposta correta.' : null,
      })),
      correct_index: correctIndex, // Defaults to 0, needs gabarito matching
      explanation: q.explanation || 'Explicação pendente de revisão.',
      area: normalizeArea(q.area),
      subspecialty: q.subspecialty || null,
      topic: q.topics?.[0] || null,
      icd10_codes: q.icd10Codes || [],
      atc_codes: q.atcCodes || [],
      year: q.parsedAt ? new Date(q.parsedAt).getFullYear() : 2025,
      difficulty,
      irt_difficulty: 0.0,
      irt_discrimination: 1.2,
      irt_guessing: 0.25,
    };
  });

  // Import in batches
  console.log(`\n📥 Importing ${questionsToInsert.length} questions in batches of ${batchSize}...`);

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < questionsToInsert.length; i += batchSize) {
    const batch = questionsToInsert.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(questionsToInsert.length / batchSize);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches}... `);

    const { data, error } = await supabase
      .from('questions')
      .insert(batch)
      .select('id');

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      errors.push(`Batch ${batchNum}: ${error.message}`);
      failed += batch.length;
    } else {
      console.log(`✅ ${data?.length || 0} inserted`);
      imported += data?.length || 0;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  // Update question count
  console.log('\n📊 Updating question count...');
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('bank_id', bankId);

  await supabase
    .from('question_banks')
    .update({ question_count: count })
    .eq('id', bankId);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Total processed: ${questionsToInsert.length}`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Bank total: ${count} questions`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✅ Import complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
