/**
 * API Endpoint: POST /api/theory-gen/generate
 *
 * Generates a single theory topic based on request parameters
 *
 * Request body:
 * {
 *   "source": "darwin-mfc" | "manual",
 *   "sourceId": "disease-id",
 *   "topicTitle": "Topic Title",
 *   "area": "clinica_medica",
 *   "targetDifficulty": "intermediario",
 *   "includeWebResearch": true
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "topic": { GeneratedTheoryTopic },
 *   "validation": { score: 0.85, status: "approved" },
 *   "estimatedCost": 0.08
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationRequest } from '@darwin-education/shared';
import GenerationService from '@/lib/theory-gen/services/generation-service';
import { createServerClient } from '@/lib/supabase/server';
import { getSessionUserSummary } from '@/lib/auth/session';
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors';
import { hasGrokCompatibleApiKey, grokServiceUnavailable } from '@/lib/ai/key-availability';

export async function POST(request: NextRequest) {
  try {
    // Get user and check authorization
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado — somente administradores' },
        { status: user ? 403 : 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const generationRequest: GenerationRequest = {
      source: body.source || 'manual',
      sourceId: body.sourceId,
      topicTitle: body.topicTitle,
      area: body.area,
      targetDifficulty: body.targetDifficulty,
      includeWebResearch: body.includeWebResearch !== false,
    };

    if (!generationRequest.topicTitle || !generationRequest.area) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: topicTitle, area' },
        { status: 400 }
      );
    }

    if (!hasGrokCompatibleApiKey()) {
      return grokServiceUnavailable('de geração de teoria')
    }

    // Initialize generation service
    const generationService = new GenerationService();

    // Generate topic
    const topic = await generationService.generateSingle(generationRequest);

    return NextResponse.json({
      success: true,
      topic,
      validation: {
        score: topic.generationMetadata.validationScore,
        status: topic.generationMetadata.status,
      },
      estimatedCost: 0.08,
    });
  } catch (error) {
    console.error('Error generating topic:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get authenticated user from request
 * This would use Supabase or your auth provider
 */
async function getUser() {
  const supabase = await createServerClient()
  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profileError) {
    if (isMissingTableError(profileError) || isSchemaDriftError(profileError)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Admin check skipped due to schema drift:', profileError)
      }
      return { id: user.id, role: 'user' as const }
    }

    console.error('Error loading profile for admin check:', profileError)
    return { id: user.id, role: 'user' as const }
  }

  if (!profile || profile.subscription_tier !== 'institutional') {
    return { id: user.id, role: 'user' as const }
  }

  return { id: user.id, role: 'admin' as const }
}

/**
 * GET /api/theory-gen/generate - Get status or history
 * (Optional enhancement)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to generate a theory topic',
    endpoint: 'POST /api/theory-gen/generate',
    example: {
      source: 'darwin-mfc',
      topicTitle: 'Hipertensão Arterial',
      area: 'clinica_medica',
      targetDifficulty: 'intermediario',
    },
  });
}
