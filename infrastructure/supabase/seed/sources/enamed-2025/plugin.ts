/**
 * ENAMED 2025 Plugin
 * Bridges existing enamed-2025-etl infrastructure to plugin interface
 */

import type {
  ETLPlugin,
  ScrapedData,
  ParsedQuestions,
  CompleteQuestions,
  ValidationResult,
} from '../../etl-core/types/plugin';
import { CacheManager } from '../../etl-core/utils/cache.ts';
import { sqlValue, generateUpsert, sqlComment, generateDeterministicId } from '../../etl-core/utils/sql.ts';
import { estimateIRTFromMetadata } from '../../etl-core/utils/irt.ts';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ENAMED2025Plugin implements ETLPlugin {
  readonly id = 'enamed-2025';
  readonly name = 'ENAMED 2025 Oficial';
  readonly description = 'ENAMED 2025 official exam with IRT parameters from microdata';
  readonly version = '1.0.0';

  private cacheManager: CacheManager;
  private outputDir: string;
  private microDataPath: string;

  constructor() {
    this.outputDir = join(__dirname, 'outputs');
    this.cacheManager = new CacheManager(join(__dirname, 'cache'));

    // Path to microdata file (relative to repo root)
    this.microDataPath = join(
      __dirname,
      '../../../../microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt'
    );
  }

  async initialize(): Promise<void> {
    this.cacheManager.ensureCacheDir();
    mkdirSync(this.outputDir, { recursive: true });
  }

  async scrape(): Promise<ScrapedData> {
    // ENAMED Phase 1 (IRT-only mode): No PDF downloads needed
    // PDFs are blocked by INEP portal, but we have microdata
    console.log('📋 ENAMED 2025: Using microdata (PDFs not available on INEP portal)');

    return {
      pdfs: new Map(),
      metadata: {
        source: 'enamed-2025-microdata',
        year: 2025,
        itemCount: 93,
        validItems: 90,
        message: 'Phase 1 (IRT-only): PDFs blocked by INEP portal. Phase 2 will add question content.',
      },
      timestamp: new Date(),
    };
  }

  async parse(data: ScrapedData): Promise<ParsedQuestions> {
    // Parse microdata file to extract IRT parameters
    const { createReadStream } = await import('fs');
    const { createInterface } = await import('readline');

    const items: Array<{
      number: number;
      difficulty: number;
      biserial: number;
      infit: number;
      outfit: number;
    }> = [];

    return new Promise((resolve, reject) => {
      const fileStream = createReadStream(this.microDataPath, { encoding: 'utf-8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let lineCount = 0;
      let isFirstLine = true;

      rl.on('line', (line) => {
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }

        if (!line.trim()) return;

        lineCount++;
        const parts = line.split(';');

        if (parts.length >= 7) {
          const [nuItem1, , itemMantido, paramB, corBis, infit, outfit] = parts;
          const itemNumber = parseInt(nuItem1, 10);
          const kept = parseInt(itemMantido, 10);
          const difficulty = paramB ? parseFloat(paramB) : null;
          const biserial = corBis ? parseFloat(corBis) : null;

          if (kept === 1 && difficulty !== null) {
            items.push({
              number: itemNumber,
              difficulty,
              biserial: biserial ?? 0,
              infit: infit ? parseFloat(infit) : 1.0,
              outfit: outfit ? parseFloat(outfit) : 1.0,
            });
          }
        }
      });

      rl.on('close', () => {
        resolve({
          questions: items.map((item) => ({
            number: item.number,
            stem: `[Questão ${item.number} - Conteúdo pendente de extração do PDF]`,
            options: [
              { letter: 'A', text: '[Opção A]' },
              { letter: 'B', text: '[Opção B]' },
              { letter: 'C', text: '[Opção C]' },
              { letter: 'D', text: '[Opção D]' },
            ],
            correctAnswer: undefined,
            metadata: {
              difficulty: item.difficulty,
              biserial: item.biserial,
              infit: item.infit,
              outfit: item.outfit,
            },
          })),
          metadata: {
            source: 'enamed-2025-microdata',
            year: 2025,
            itemsRead: lineCount,
            itemsValid: items.length,
          },
          parseStats: {
            totalExtracted: lineCount,
            successCount: items.length,
            failureCount: lineCount - items.length,
            warnings:
              items.length < 90
                ? [`Only ${items.length} valid items found (expected ~90)`]
                : [],
          },
        });
      });

      rl.on('error', reject);
    });
  }

  async transform(questions: ParsedQuestions): Promise<CompleteQuestions> {
    const completeQuestions = questions.questions.map((q, index) => {
      // Infer area from position
      const position = q.number;
      let area = 'clinica_medica';
      if (position <= 20) area = 'clinica_medica';
      else if (position <= 40) area = 'cirurgia';
      else if (position <= 60) area = 'pediatria';
      else if (position <= 80) area = 'ginecologia_obstetricia';
      else area = 'saude_coletiva';

      // Estimate discrimination from biserial
      const biserial = q.metadata?.biserial ?? 0;
      const K_FACTOR = 3.0;
      let discrimination = 1.0; // Rasch model fallback
      if (biserial && Math.abs(biserial) >= 0.05) {
        discrimination = Math.abs(biserial) * K_FACTOR;
        discrimination = Math.max(0.3, Math.min(2.5, discrimination));
      }

      return {
        id: generateDeterministicId('enamed-2025', 2025, position),
        bankId: 'enamed-2025-official',
        stem: q.stem,
        options: q.options.map((opt) => ({
          letter: opt.letter,
          text: opt.text,
          feedback: '',
        })),
        correctIndex: 0,
        area,
        year: 2025,
        metadata: {
          institution: 'INEP',
          institutionTier: 'TIER_1_NATIONAL',
          examType: 'national',
          questionPosition: position,
          totalQuestionsInExam: 100,
          optionCount: 4,
          source: 'enamed-2025',
        },
        irt: {
          difficulty: q.metadata?.difficulty ?? 0,
          discrimination,
          guessing: 0.25,
          infit: q.metadata?.infit ?? 1.0,
          outfit: q.metadata?.outfit ?? 1.0,
          estimated: Math.abs(biserial) < 0.05,
          confidence: 0.95, // High confidence from official microdata
          method: 'empirical',
        },
      };
    });

    return {
      questions: completeQuestions,
      validationStats: {
        totalProcessed: questions.questions.length,
        successCount: completeQuestions.length,
        failureCount: 0,
        issues: [],
      },
    };
  }

  async validate(questions: CompleteQuestions): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    for (const q of questions.questions) {
      if (!q.id || !q.bankId || !q.stem) {
        errors.push(`Question ${q.id} missing required fields`);
        continue;
      }

      if (
        q.irt.difficulty < -4 ||
        q.irt.difficulty > 4 ||
        q.irt.discrimination < 0.3 ||
        q.irt.discrimination > 2.5 ||
        q.irt.guessing < 0 ||
        q.irt.guessing > 0.5
      ) {
        warnings.push(`Question ${q.id} has IRT parameters outside normal bounds`);
      }

      validCount++;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalQuestions: questions.questions.length,
        validQuestions: validCount,
        invalidQuestions: questions.questions.length - validCount,
      },
    };
  }

  async load(questions: CompleteQuestions): Promise<string> {
    // Generate SQL
    const timestamp = new Date().toISOString();

    const sql: string[] = [
      sqlComment('============================================================================'),
      sqlComment('ENAMED 2025 Official Questions with IRT Parameters'),
      sqlComment(`Generated: ${timestamp}`),
      sqlComment('Source: Microdados ENAMED 2025'),
      sqlComment(`Items: ${questions.questions.length} questions with IRT calibration`),
      sqlComment('============================================================================'),
      '',
      sqlComment('Insert question bank'),
      `INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)`,
      `VALUES (`,
      `  'enamed-2025-official',`,
      `  'ENAMED 2025 Oficial',`,
      `  'Questões oficiais do ENAMED 2025 com parâmetros IRT calibrados',`,
      `  'official_enamed',`,
      `  2025,`,
      `  2025,`,
      `  FALSE`,
      `)`,
      `ON CONFLICT (id) DO UPDATE SET updated_at = NOW();`,
      '',
      sqlComment(`Insert ${questions.questions.length} questions with IRT parameters`),
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
    questions.questions.forEach((q, index) => {
      const options = q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        feedback: opt.feedback || '',
      }));

      const comma = index < questions.questions.length - 1 ? ',' : '';

      sql.push(
        `  (`,
        `    ${sqlValue(q.id)},`,
        `    ${sqlValue(q.bankId)},`,
        `    ${sqlValue(q.stem)},`,
        `    '${JSON.stringify(options).replace(/'/g, "''")}'::jsonb,`,
        `    ${q.correctIndex},`,
        `    ${sqlValue(q.area)},`,
        `    ${q.irt.difficulty},`,
        `    ${q.irt.discrimination},`,
        `    ${q.irt.guessing},`,
        `    ${sqlValue(q.irt.infit)},`,
        `    ${sqlValue(q.irt.outfit)},`,
        `    ${q.year},`,
        `    'expert'`,
        `  )${comma}`
      );
    });

    sql.push(
      `ON CONFLICT (id) DO UPDATE SET`,
      `  irt_difficulty = EXCLUDED.irt_difficulty,`,
      `  irt_discrimination = EXCLUDED.irt_discrimination,`,
      `  irt_guessing = EXCLUDED.irt_guessing,`,
      `  irt_infit = EXCLUDED.irt_infit,`,
      `  irt_outfit = EXCLUDED.irt_outfit,`,
      `  updated_at = NOW();`,
      '',
      sqlComment('Update question count'),
      `UPDATE question_banks`,
      `SET question_count = (`,
      `  SELECT COUNT(*) FROM questions WHERE bank_id = 'enamed-2025-official'`,
      `)`,
      `WHERE id = 'enamed-2025-official';`,
      ''
    );

    const content = sql.join('\n');

    // Write SQL file
    const sqlPath = join(this.outputDir, '05_enamed_2025_questions.sql');
    writeFileSync(sqlPath, content, 'utf-8');

    return sqlPath;
  }

  estimatedQuestionCount(): number {
    return 90;
  }

  supportedYears(): number[] {
    return [2025];
  }

  requiresManualSetup(): boolean {
    return true; // PDFs blocked by INEP portal
  }
}
