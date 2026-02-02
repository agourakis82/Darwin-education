/**
 * QGen Corpus API Route
 * ======================
 *
 * GET /api/qgen/corpus/stats - Get corpus analysis statistics
 * POST /api/qgen/corpus/analyze - Analyze new questions and add to corpus
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CorpusAnalysisService } from '@/lib/qgen';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const corpusAnalysisService = new CorpusAnalysisService();

interface CorpusStats {
  totalQuestions: number;
  byArea: Record<string, number>;
  bySource: Record<string, number>;
  byDifficulty: Record<number, number>;
  byBloomLevel: Record<string, number>;
  featureDistributions: {
    avgStemLength: number;
    avgOptionLength: number;
    clinicalCasePercentage: number;
    negativeQuestionPercentage: number;
  };
  qualityMetrics: {
    avgHedgingScore: number;
    avgAbsoluteTermScore: number;
    avgReadabilityScore: number;
  };
}

interface AnalyzeRequest {
  questions: Array<{
    id?: string;
    stem: string;
    options: string[];
    correctAnswerIndex: number;
    source?: string;
    area?: string;
    topic?: string;
    year?: number;
    examName?: string;
  }>;
  saveToCorpus?: boolean;
}

/**
 * GET - Get corpus statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const area = searchParams.get('area');
    const source = searchParams.get('source');

    // Build query
    let query = supabase
      .from('qgen_corpus_questions')
      .select(`
        id,
        area,
        source,
        structural_features,
        clinical_features,
        cognitive_features,
        linguistic_features
      `);

    if (area) {
      query = query.eq('area', area);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching corpus stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch corpus statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats: CorpusStats = {
      totalQuestions: data?.length || 0,
      byArea: {},
      bySource: {},
      byDifficulty: {},
      byBloomLevel: {},
      featureDistributions: {
        avgStemLength: 0,
        avgOptionLength: 0,
        clinicalCasePercentage: 0,
        negativeQuestionPercentage: 0,
      },
      qualityMetrics: {
        avgHedgingScore: 0,
        avgAbsoluteTermScore: 0,
        avgReadabilityScore: 0,
      },
    };

    if (data && data.length > 0) {
      // Count by area
      for (const q of data) {
        if (q.area) {
          stats.byArea[q.area] = (stats.byArea[q.area] || 0) + 1;
        }
        if (q.source) {
          stats.bySource[q.source] = (stats.bySource[q.source] || 0) + 1;
        }
      }

      // Calculate averages from structural features
      let totalStemLength = 0;
      let totalOptionLength = 0;
      let clinicalCaseCount = 0;
      let negativeCount = 0;
      let structuralCount = 0;

      for (const q of data) {
        if (q.structural_features) {
          structuralCount++;
          totalStemLength += q.structural_features.stemLength || 0;
          totalOptionLength += q.structural_features.avgOptionLength || 0;
          if (q.structural_features.hasClinicalCase) clinicalCaseCount++;
          if (q.structural_features.hasNegation) negativeCount++;

          // Difficulty distribution
          const diff = Math.round(q.structural_features.estimatedDifficulty || 3);
          stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + 1;
        }

        // Bloom level distribution
        if (q.cognitive_features?.bloomLevel) {
          const bloom = q.cognitive_features.bloomLevel;
          stats.byBloomLevel[bloom] = (stats.byBloomLevel[bloom] || 0) + 1;
        }
      }

      if (structuralCount > 0) {
        stats.featureDistributions.avgStemLength = totalStemLength / structuralCount;
        stats.featureDistributions.avgOptionLength = totalOptionLength / structuralCount;
        stats.featureDistributions.clinicalCasePercentage = (clinicalCaseCount / structuralCount) * 100;
        stats.featureDistributions.negativeQuestionPercentage = (negativeCount / structuralCount) * 100;
      }

      // Calculate linguistic quality metrics
      let totalHedging = 0;
      let totalAbsolute = 0;
      let totalReadability = 0;
      let linguisticCount = 0;

      for (const q of data) {
        if (q.linguistic_features) {
          linguisticCount++;
          totalHedging += q.linguistic_features.hedgingScore || 0;
          totalAbsolute += q.linguistic_features.absoluteTermCount || 0;
          totalReadability += q.linguistic_features.readabilityScore || 0;
        }
      }

      if (linguisticCount > 0) {
        stats.qualityMetrics.avgHedgingScore = totalHedging / linguisticCount;
        stats.qualityMetrics.avgAbsoluteTermScore = totalAbsolute / linguisticCount;
        stats.qualityMetrics.avgReadabilityScore = totalReadability / linguisticCount;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Corpus stats error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Analyze questions and optionally save to corpus
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty questions array' },
        { status: 400 }
      );
    }

    if (body.questions.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum batch size is 100 questions' },
        { status: 400 }
      );
    }

    const results = [];

    for (const question of body.questions) {
      // Convert options array to Record<string, string>
      const alternatives: Record<string, string> = {};
      const letters = ['A', 'B', 'C', 'D', 'E'];
      question.options.forEach((text: string, idx: number) => {
        alternatives[letters[idx]] = text;
      });

      // Get correct answer letter
      const correctAnswer = letters[question.correctAnswerIndex] || 'A';

      // Generate question ID if not provided
      const questionId = question.id || `analyzed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Extract features using the proper method signature
      const features = await corpusAnalysisService.analyzeQuestion(
        questionId,
        question.stem,
        alternatives,
        correctAnswer
      );

      const result = {
        id: questionId,
        features,
        savedToCorpus: false,
      };

      // Optionally save to corpus
      if (body.saveToCorpus) {
        try {
          const { error } = await supabase
            .from('qgen_corpus_questions')
            .insert({
              original_id: question.id,
              stem: question.stem,
              alternatives: question.options.map((text, idx) => ({
                text,
                is_correct: idx === question.correctAnswerIndex,
              })),
              correct_answer_index: question.correctAnswerIndex,
              source: question.source || 'imported',
              area: question.area,
              topic: question.topic,
              exam_year: question.year,
              exam_name: question.examName,
              structural_features: features.structural,
              clinical_features: features.clinical,
              cognitive_features: features.cognitive,
              linguistic_features: features.linguistic,
              distractor_features: features.distractors,
              created_at: new Date().toISOString(),
            });

          if (!error) {
            result.savedToCorpus = true;
          } else {
            console.error('Error saving to corpus:', error);
          }
        } catch (saveError) {
          console.error('Error saving to corpus:', saveError);
        }
      }

      results.push(result);
    }

    const savedCount = results.filter(r => r.savedToCorpus).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        analyzed: results.length,
        savedToCorpus: savedCount,
      },
    });
  } catch (error) {
    console.error('Corpus analyze error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
