/**
 * API Endpoint: GET/PATCH /api/theory-gen/review
 *
 * Manage review queue for topics with 0.70-0.89 validation scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/theory-gen/services/storage-service';
import type { TopicStatus } from '@darwin-education/shared';

const storageService = new StorageService();

/**
 * GET /api/theory-gen/review - Get topics pending review
 */
export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '10';
    const topics = await storageService.getReviewQueue(parseInt(limit));

    return NextResponse.json({
      success: true,
      count: topics.length,
      topics,
    });
  } catch (error) {
    console.error('Error fetching review queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/theory-gen/review/:id
 *
 * Update topic status (approve, reject, request changes)
 *
 * Request body:
 * {
 *   "topicId": "topic-id",
 *   "status": "approved" | "published" | "draft",
 *   "feedback": "Additional comments"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, status, feedback } = body;

    if (!topicId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: topicId, status' },
        { status: 400 }
      );
    }

    const validStatuses: TopicStatus[] = ['draft', 'review', 'approved', 'published'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update topic status
    await storageService.updateStatus(topicId, status);

    return NextResponse.json({
      success: true,
      message: `Topic status updated to ${status}`,
      topicId,
      status,
      feedback,
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
