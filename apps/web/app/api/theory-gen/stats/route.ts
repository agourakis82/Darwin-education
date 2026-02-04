/**
 * API Endpoint: GET /api/theory-gen/stats
 *
 * Get generation statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/theory-gen/services/storage-service';

const storageService = new StorageService();

export async function GET(request: NextRequest) {
  try {
    const stats = await storageService.getStatistics();

    if (!stats) {
      return NextResponse.json(
        {
          success: true,
          message: 'No data yet',
          stats: {
            totalTopicsGenerated: 0,
            topicsInStatus: {
              draft: 0,
              review: 0,
              approved: 0,
              published: 0,
            },
            topicsByDifficulty: {
              basico: 0,
              intermediario: 0,
              avancado: 0,
            },
            topicsByArea: {
              clinica_medica: 0,
              cirurgia: 0,
              pediatria: 0,
              ginecologia_obstetricia: 0,
              saude_coletiva: 0,
            },
            averageValidationScore: 0,
            autoApprovalRate: 0,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      stats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
