/**
 * API Endpoint: GET /api/theory-gen/audit
 *
 * Retrieve citation verification and hallucination detection audit trails
 * for quality assurance and compliance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/theory-gen/audit?topicId=xxx&type=citations|hallucinations|all
 *
 * Query parameters:
 * - topicId: (optional) Filter by topic ID
 * - type: (optional) 'citations', 'hallucinations', or 'all' (default: 'all')
 * - limit: (optional) Default 50, max 500
 * - offset: (optional) For pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    const results: any = {};

    // Fetch citation verification audit data
    if (type === 'citations' || type === 'all') {
      let query = supabase
        .from('citation_verification_audit')
        .select('*')
        .order('verified_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data: citations, error: citError } = await query;
      if (citError) {
        return NextResponse.json(
          { error: `Citations fetch error: ${citError.message}` },
          { status: 500 }
        );
      }

      // Calculate citation statistics
      const totalAccessible = citations?.filter(c => c.is_accessible).length || 0;
      const avgScore = citations && citations.length > 0
        ? citations.reduce((sum, c) => sum + (c.verification_score || 0), 0) / citations.length
        : 0;

      results.citations = {
        total: citations?.length || 0,
        accessible: totalAccessible,
        inaccessible: (citations?.length || 0) - totalAccessible,
        averageVerificationScore: Math.round(avgScore * 100) / 100,
        data: citations || [],
      };
    }

    // Fetch hallucination audit data
    if (type === 'hallucinations' || type === 'all') {
      let query = supabase
        .from('hallucination_audit')
        .select('*')
        .order('checked_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data: hallucinations, error: hallError } = await query;
      if (hallError) {
        return NextResponse.json(
          { error: `Hallucinations fetch error: ${hallError.message}` },
          { status: 500 }
        );
      }

      // Categorize by risk level
      const byRisk = {
        critical: hallucinations?.filter(h => h.risk_level === 'critical') || [],
        high: hallucinations?.filter(h => h.risk_level === 'high') || [],
        medium: hallucinations?.filter(h => h.risk_level === 'medium') || [],
        low: hallucinations?.filter(h => h.risk_level === 'low') || [],
      };

      const unsupported = hallucinations?.filter(h => !h.claim_supported) || [];

      results.hallucinations = {
        total: hallucinations?.length || 0,
        unsupported: unsupported.length,
        byRisk: {
          critical: byRisk.critical.length,
          high: byRisk.high.length,
          medium: byRisk.medium.length,
          low: byRisk.low.length,
        },
        criticalUnsupported: byRisk.critical.filter(h => !h.claim_supported).length,
        data: hallucinations || [],
      };
    }

    // Generate comprehensive report if topicId provided
    let report = null;
    if (topicId) {
      const citCount = results.citations?.total || 0;
      const hallCount = results.hallucinations?.total || 0;
      const unsupportedCount = results.hallucinations?.unsupported || 0;
      const criticalCount = results.hallucinations?.byRisk?.critical || 0;

      report = {
        topicId,
        timestamp: new Date().toISOString(),
        citationVerificationScore: results.citations?.averageVerificationScore || 0,
        hallucinationRiskLevel:
          criticalCount > 0
            ? 'CRITICAL'
            : unsupportedCount > 0
              ? 'HIGH'
              : hallCount > (citCount * 0.5)
                ? 'MEDIUM'
                : 'LOW',
        summary: {
          totalClaimsChecked: hallCount,
          unsupportedClaims: unsupportedCount,
          citationsVerified: citCount,
          citationsAccessible: results.citations?.accessible || 0,
          criticalIssues: criticalCount,
        },
        recommendations: generateRecommendations(
          citCount,
          unsupportedCount,
          results.citations?.accessible || 0,
          criticalCount
        ),
      };
    }

    return NextResponse.json({
      success: true,
      type,
      topicId,
      pagination: { limit, offset },
      report,
      data: results,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/theory-gen/audit/:id/review
 *
 * Mark a hallucination claim as reviewed
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { hallucinationId, status, reviewedBy, notes } = body;

    if (!hallucinationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: hallucinationId, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['approved', 'disputed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('hallucination_audit')
      .update({
        review_status: status,
        reviewed_by: reviewedBy || 'admin',
        reviewed_at: new Date(),
      })
      .eq('id', hallucinationId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Hallucination marked as ${status}`,
      hallucinationId,
      status,
    });
  } catch (error) {
    console.error('Error updating hallucination review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on audit data
 */
function generateRecommendations(
  citationCount: number,
  unsupportedClaims: number,
  accessibleCitations: number,
  criticalIssues: number
): string[] {
  const recommendations: string[] = [];

  if (criticalIssues > 0) {
    recommendations.push(
      `⚠️ CRITICAL: ${criticalIssues} critical unsupported claims detected. Require immediate human review before publication.`
    );
  }

  if (citationCount < 5) {
    recommendations.push(
      `📚 Add at least ${5 - citationCount} more citations. Current: ${citationCount}, Required: 5+`
    );
  }

  if (accessibleCitations < citationCount * 0.8) {
    recommendations.push(
      `🔗 ${citationCount - accessibleCitations} citations are inaccessible. Consider replacing with verified sources.`
    );
  }

  if (unsupportedClaims > 0) {
    recommendations.push(
      `❓ ${unsupportedClaims} claims lack proper citation support. Either add citations or revise claims to match sources.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed. Topic is ready for human review.');
  }

  return recommendations;
}
