// ============================================================
// HLR CURVES API ROUTE
// GET /api/learner/hlr-curves — Personalized forgetting curves
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  extractFeatures,
  normalizeDifficulty,
  predictItem,
  generateLabeledCurve,
  initializeWeights,
  trainWeights,
  type HLRTrainingObservation,
  type PersonalizedForgettingCurve,
} from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/learner/hlr-curves
 *
 * Generates personalized forgetting curves using Half-Life Regression.
 * Trains on user's flashcard review history to predict retention.
 *
 * Returns: Per-area forgetting curves, review schedule, retention predictions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load flashcard review history
    const { data: reviewRows, error: revError } = await (supabase as any)
      .from('study_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_type', 'flashcard_review')
      .order('created_at', { ascending: true })

    if (revError) {
      console.error('Error loading review data:', revError)
      return NextResponse.json(
        { error: 'Failed to load review history' },
        { status: 500 }
      )
    }

    const rows = reviewRows || []

    if (rows.length < 10) {
      return NextResponse.json({
        curves: [],
        predictions: [],
        summary: {
          totalReviews: rows.length,
          minRequired: 10,
          message: 'Complete pelo menos 10 revisoes de flashcard para curvas de esquecimento personalizadas.',
        },
      })
    }

    // Build training observations
    const trainingObs: HLRTrainingObservation[] = rows
      .filter((r: any) => r.elapsed_days_since_last !== null && r.elapsed_days_since_last !== undefined)
      .map((r: any) => ({
        features: extractFeatures(
          r.review_count || 0,
          r.elapsed_days_since_last || 0,
          r.correct_streak || 0,
          normalizeDifficulty(r.difficulty || 0),
          (r.review_count || 0) - (r.correct_streak || 0)
        ),
        recalled: !!r.correct,
        deltaDays: r.elapsed_days_since_last || 1,
      }))

    // Train personalized weights
    const hlrWeights = trainWeights(trainingObs)

    // Group by area and generate curves
    const areaReviews = new Map<string, any[]>()
    for (const r of rows) {
      const area = r.area || 'clinica_medica'
      if (!areaReviews.has(area)) areaReviews.set(area, [])
      areaReviews.get(area)!.push(r)
    }

    const AREA_LABELS: Record<string, string> = {
      clinica_medica: 'Clinica Medica',
      cirurgia: 'Cirurgia',
      ginecologia_obstetricia: 'Ginecologia e Obstetricia',
      pediatria: 'Pediatria',
      saude_coletiva: 'Saude Coletiva',
    }

    const curves: PersonalizedForgettingCurve[] = []
    const predictions: any[] = []

    for (const [area, areaRows] of areaReviews) {
      const lastRow = areaRows[areaRows.length - 1]
      const features = extractFeatures(
        lastRow.review_count || 0,
        lastRow.elapsed_days_since_last || 0,
        lastRow.correct_streak || 0,
        normalizeDifficulty(lastRow.difficulty || 0),
        (lastRow.review_count || 0) - (lastRow.correct_streak || 0)
      )

      const reviewHistory = areaRows.map((r: any, i: number) => ({
        day: i,
        correct: !!r.correct,
      }))

      const curve = generateLabeledCurve(
        area,
        AREA_LABELS[area] || area,
        features,
        hlrWeights.values,
        reviewHistory,
        90
      )
      curves.push(curve)

      const elapsed = lastRow.elapsed_days_since_last || 0
      const pred = predictItem(features, hlrWeights.values, elapsed)
      predictions.push({
        area,
        label: AREA_LABELS[area] || area,
        ...pred,
      })
    }

    // Average retention
    const avgRetention = predictions.length > 0
      ? predictions.reduce((s, p) => s + p.predictedRetention, 0) / predictions.length
      : 0

    return NextResponse.json({
      curves,
      predictions,
      weights: {
        values: hlrWeights.values,
        trainingCount: hlrWeights.trainingCount,
        trainingLoss: Math.round(hlrWeights.trainingLoss * 10000) / 10000,
      },
      summary: {
        totalReviews: rows.length,
        areasTracked: curves.length,
        averageRetention: Math.round(avgRetention * 1000) / 1000,
        overdueAreas: predictions.filter(p => p.isOverdue).map(p => p.area),
      },
    })
  } catch (error) {
    console.error('HLR Curves Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute forgetting curves',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
