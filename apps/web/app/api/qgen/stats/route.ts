/**
 * QGen Stats API Route
 * =====================
 *
 * GET /api/qgen/stats - Get generation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QGenStats {
  overview: {
    totalGenerated: number;
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    approvalRate: number;
    averageValidationScore: number;
  };
  byArea: Record<string, {
    generated: number;
    approved: number;
    rejected: number;
    averageScore: number;
  }>;
  byDifficulty: Record<number, {
    count: number;
    averageScore: number;
  }>;
  byBloomLevel: Record<string, {
    count: number;
    averageScore: number;
  }>;
  timeline: Array<{
    date: string;
    generated: number;
    approved: number;
    rejected: number;
  }>;
  qualityMetrics: {
    averageMedicalAccuracy: number;
    averageDistractorQuality: number;
    averageClarity: number;
    commonIssues: Array<{
      issue: string;
      count: number;
      percentage: number;
    }>;
  };
  costMetrics?: {
    totalTokensUsed: number;
    estimatedCost: number;
    averageTokensPerQuestion: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const area = searchParams.get('area');

    // Build base query conditions
    const dateFilter = startDate && endDate
      ? `and created_at >= '${startDate}' and created_at <= '${endDate}'`
      : '';
    const areaFilter = area ? `and area = '${area}'` : '';

    // Get overview stats
    const { data: overviewData, error: overviewError } = await supabase.rpc(
      'get_qgen_overview_stats',
      {}
    ).maybeSingle();

    // Fallback if RPC doesn't exist - use direct queries
    let overview: QGenStats['overview'];

    if (overviewError || !overviewData) {
      // Direct query fallback
      const { data: questions } = await supabase
        .from('qgen_generated_questions')
        .select('validation_status, validation_score');

      const totalGenerated = questions?.length || 0;
      const approved = questions?.filter(q => q.validation_status === 'approved').length || 0;
      const pending = questions?.filter(q => ['pending', 'pending_review'].includes(q.validation_status)).length || 0;
      const rejected = questions?.filter(q => q.validation_status === 'rejected').length || 0;
      const scores = questions?.map(q => q.validation_score).filter(s => s != null) || [];
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      overview = {
        totalGenerated,
        totalApproved: approved,
        totalPending: pending,
        totalRejected: rejected,
        approvalRate: totalGenerated > 0 ? approved / totalGenerated : 0,
        averageValidationScore: avgScore,
      };
    } else {
      overview = overviewData as QGenStats['overview'];
    }

    // Get stats by area
    const { data: areaData } = await supabase
      .from('qgen_generated_questions')
      .select('area, validation_status, validation_score');

    const byArea: QGenStats['byArea'] = {};
    if (areaData) {
      for (const q of areaData) {
        if (!q.area) continue;
        if (!byArea[q.area]) {
          byArea[q.area] = { generated: 0, approved: 0, rejected: 0, averageScore: 0 };
        }
        byArea[q.area].generated++;
        if (q.validation_status === 'approved') byArea[q.area].approved++;
        if (q.validation_status === 'rejected') byArea[q.area].rejected++;
      }

      // Calculate average scores per area
      for (const area of Object.keys(byArea)) {
        const areaQuestions = areaData.filter(q => q.area === area && q.validation_score != null);
        if (areaQuestions.length > 0) {
          byArea[area].averageScore =
            areaQuestions.reduce((sum, q) => sum + (q.validation_score || 0), 0) / areaQuestions.length;
        }
      }
    }

    // Get stats by difficulty
    const { data: difficultyData } = await supabase
      .from('qgen_generated_questions')
      .select('irt_parameters, validation_score');

    const byDifficulty: QGenStats['byDifficulty'] = {};
    if (difficultyData) {
      for (const q of difficultyData) {
        const diff = Math.round(q.irt_parameters?.estimated_difficulty || 3);
        if (!byDifficulty[diff]) {
          byDifficulty[diff] = { count: 0, averageScore: 0 };
        }
        byDifficulty[diff].count++;
      }

      // Calculate average scores per difficulty
      for (const diff of Object.keys(byDifficulty)) {
        const diffQuestions = difficultyData.filter(q =>
          Math.round(q.irt_parameters?.estimated_difficulty || 3) === parseInt(diff) &&
          q.validation_score != null
        );
        if (diffQuestions.length > 0) {
          byDifficulty[parseInt(diff)].averageScore =
            diffQuestions.reduce((sum, q) => sum + (q.validation_score || 0), 0) / diffQuestions.length;
        }
      }
    }

    // Get stats by Bloom level
    const { data: bloomData } = await supabase
      .from('qgen_generated_questions')
      .select('bloom_level, validation_score');

    const byBloomLevel: QGenStats['byBloomLevel'] = {};
    if (bloomData) {
      for (const q of bloomData) {
        const bloom = q.bloom_level || 'APPLICATION';
        if (!byBloomLevel[bloom]) {
          byBloomLevel[bloom] = { count: 0, averageScore: 0 };
        }
        byBloomLevel[bloom].count++;
      }

      // Calculate average scores per Bloom level
      for (const bloom of Object.keys(byBloomLevel)) {
        const bloomQuestions = bloomData.filter(q =>
          (q.bloom_level || 'APPLICATION') === bloom &&
          q.validation_score != null
        );
        if (bloomQuestions.length > 0) {
          byBloomLevel[bloom].averageScore =
            bloomQuestions.reduce((sum, q) => sum + (q.validation_score || 0), 0) / bloomQuestions.length;
        }
      }
    }

    // Get timeline data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: timelineData } = await supabase
      .from('qgen_generated_questions')
      .select('created_at, validation_status')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const timeline: QGenStats['timeline'] = [];
    if (timelineData) {
      const byDate: Record<string, { generated: number; approved: number; rejected: number }> = {};

      for (const q of timelineData) {
        const date = q.created_at.split('T')[0];
        if (!byDate[date]) {
          byDate[date] = { generated: 0, approved: 0, rejected: 0 };
        }
        byDate[date].generated++;
        if (q.validation_status === 'approved') byDate[date].approved++;
        if (q.validation_status === 'rejected') byDate[date].rejected++;
      }

      for (const [date, counts] of Object.entries(byDate).sort()) {
        timeline.push({ date, ...counts });
      }
    }

    // Get common validation issues
    const { data: issuesData } = await supabase
      .from('qgen_generated_questions')
      .select('validation_flags')
      .not('validation_flags', 'is', null);

    const issueCounts: Record<string, number> = {};
    let totalIssues = 0;
    if (issuesData) {
      for (const q of issuesData) {
        if (Array.isArray(q.validation_flags)) {
          for (const flag of q.validation_flags) {
            issueCounts[flag] = (issueCounts[flag] || 0) + 1;
            totalIssues++;
          }
        }
      }
    }

    const commonIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: totalIssues > 0 ? (count / totalIssues) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: QGenStats = {
      overview,
      byArea,
      byDifficulty,
      byBloomLevel,
      timeline,
      qualityMetrics: {
        averageMedicalAccuracy: 0, // Would need reviews data
        averageDistractorQuality: 0,
        averageClarity: 0,
        commonIssues,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('QGen stats error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
