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

export async function POST(request: NextRequest) {
  try {
    // Get user and check authorization
    const user = await getUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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
        { error: 'Missing required fields: topicTitle, area' },
        { status: 400 }
      );
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
async function getUser(request: NextRequest) {
  // TODO: Implement actual auth check
  // For now, assume authentication is handled upstream
  return { id: 'user-123', role: 'admin' };
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
