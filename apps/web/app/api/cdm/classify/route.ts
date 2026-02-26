// ============================================================
// CDM CLASSIFY API ROUTE
// POST /api/cdm/classify — run DINA classification for a student
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError } from '@/lib/supabase/errors'
import {
  classifyStudentDINA,
  classifyStudentGDINA,
  buildQMatrixFromRows,
  CDM_ATTRIBUTES,
} from '@darwin-education/shared'
import type { DINAParameters, GDINAParameters } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN_RESPONSES = 20

/**
 * POST /api/cdm/classify
 *
 * Classifies a student's cognitive attribute mastery using the DINA or
 * G-DINA model against their exam response history.
 *
 * Body (optional): { modelType?: 'dina' | 'gdina' }
 *
 * Returns: CDMClassification with AttributeProfile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const modelType: 'dina' | 'gdina' = body?.modelType === 'gdina' ? 'gdina' : 'dina'

    // 1. Load last 10 exam attempts (flatten individual question responses)
    const { data: attempts, error: attemptsError } = await (supabase as any)
      .from('exam_attempts')
      .select('responses')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10)

    if (attemptsError) {
      if (isMissingTableError(attemptsError)) {
        return NextResponse.json({
          profile: null,
          warning: 'Tabelas CDM ainda não migradas (execute migração 022).',
        })
      }
      throw attemptsError
    }

    // Flatten to { questionId → correct }
    const responsesMap: Record<string, boolean> = {}
    const questionIds: string[] = []

    for (const attempt of attempts || []) {
      for (const resp of attempt.responses || []) {
        if (resp.questionId) {
          responsesMap[resp.questionId] = !!resp.correct
          if (!questionIds.includes(resp.questionId)) {
            questionIds.push(resp.questionId)
          }
        }
      }
    }

    if (questionIds.length < MIN_RESPONSES) {
      return NextResponse.json(
        {
          profile: null,
          summary: {
            responsesFound: questionIds.length,
            minRequired: MIN_RESPONSES,
            message: `Complete pelo menos ${MIN_RESPONSES} questões para classificação CDM.`,
          },
        },
        { status: 422 }
      )
    }

    // 2. Load Q-matrix for these questions
    const { data: qRows, error: qError } = await (supabase as any)
      .from('question_q_matrix')
      .select('question_id, attribute_id')
      .in('question_id', questionIds)

    if (qError) {
      if (isMissingTableError(qError)) {
        return NextResponse.json({
          profile: null,
          warning: 'Q-matrix não encontrada. Execute migração 022 e aguarde o seed.',
        })
      }
      throw qError
    }

    const qMatrix = buildQMatrixFromRows(qRows || [])

    // Filter to only questions that have Q-matrix entries
    const mappedQuestionIds = Object.keys(qMatrix)
    if (mappedQuestionIds.length < 10) {
      return NextResponse.json({
        profile: null,
        summary: {
          message: 'Q-matrix insuficiente para classificação (< 10 questões mapeadas).',
          mappedQuestions: mappedQuestionIds.length,
        },
      })
    }

    // 3. Load latest CDM parameters
    const { data: paramRows, error: paramError } = await (supabase as any)
      .from('cdm_parameters')
      .select('*')
      .eq('model_type', modelType)
      .order('estimated_at', { ascending: false })
      .limit(1)

    // If no parameters are calibrated yet, use fallback uniform priors
    // (suitable for initial deployment before EM calibration runs)
    let params: DINAParameters | GDINAParameters
    if (!paramRows || paramRows.length === 0 || paramError) {
      // Construct stub DINA params: slip=0.15, guess=0.20, uniform priors
      const items = mappedQuestionIds.map(itemId => ({
        itemId,
        slip: 0.15,
        guessing: 0.20,
        requiredAttributes: (qMatrix[itemId] || [0,0,0,0,0,0])
          .map((v, k) => (v === 1 ? k : -1))
          .filter(k => k >= 0),
      }))
      params = {
        items,
        classPriors: new Array(64).fill(1 / 64),
      } as DINAParameters
    } else {
      params = {
        items: paramRows[0].item_parameters,
        classPriors: paramRows[0].class_priors,
        ...(modelType === 'gdina' ? { linkFunction: paramRows[0].link_function ?? 'identity' } : {}),
      } as DINAParameters | GDINAParameters
    }

    // 4. Classify
    const profile = modelType === 'gdina'
      ? classifyStudentGDINA(responsesMap, qMatrix, params as GDINAParameters, user.id)
      : classifyStudentDINA(responsesMap, qMatrix, params as DINAParameters, user.id)

    // 5. Save snapshot
    const confidenceRaw = profile.posteriorEntropy !== undefined
      ? Math.max(0, 1 - profile.posteriorEntropy / Math.log2(64))
      : null

    await (supabase as any)
      .from('cdm_snapshots')
      .insert({
        user_id: user.id,
        cdm_parameters_id: paramRows?.[0]?.id ?? null,
        latent_class: profile.latentClass,
        eap_estimate: profile.eapEstimate,
        map_estimate: profile.mapEstimate,
        posterior_probabilities: profile.posteriorProbabilities,
        posterior_entropy: profile.posteriorEntropy,
        model_type: modelType,
        mastered_attributes: profile.masteredAttributes,
        unmastered_attributes: profile.unmasteredAttributes,
        classification_confidence: confidenceRaw,
        items_used: mappedQuestionIds.length,
        snapshot_at: new Date().toISOString(),
      })
      .throwOnError()

    return NextResponse.json({
      profile,
      modelType,
      summary: {
        masteredAttributes: profile.masteredAttributes,
        unmasteredAttributes: profile.unmasteredAttributes,
        classificationConfidence: confidenceRaw,
        posteriorEntropy: profile.posteriorEntropy,
        itemsUsed: mappedQuestionIds.length,
        attributeLabels: Object.fromEntries(
          CDM_ATTRIBUTES.map((a, k) => [a, profile.eapEstimate[k]])
        ),
      },
    })
  } catch (error) {
    console.error('CDM Classify Error:', error)
    return NextResponse.json(
      { error: 'Falha na classificação CDM', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
