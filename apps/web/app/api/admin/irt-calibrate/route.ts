// ============================================================
// ADMIN IRT CALIBRATION ROUTE
// POST /api/admin/irt-calibrate — Bayesian warm-start difficulty update
// Protected by x-admin-key header matching ADMIN_SECRET env var
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN_RESPONSES = 30
const PRIOR_SIGMA2 = 0.25
const NR_ITERATIONS = 8

/** Bayesian Newton-Raphson update for 3PL difficulty parameter */
function updateDifficulty(
  responses: Array<{ theta: number; correct: boolean }>,
  priorB: number,
  a: number,
  c: number,
): number {
  let b = priorB
  for (let iter = 0; iter < NR_ITERATIONS; iter++) {
    let grad = -(b - priorB) / PRIOR_SIGMA2
    let hess = -1.0 / PRIOR_SIGMA2
    for (const { theta, correct } of responses) {
      const z = a * (theta - b)
      const sig = 1 / (1 + Math.exp(-z))
      const P = Math.max(c + (1 - c) * sig, 1e-8)
      const Q = Math.max(1 - P, 1e-8)
      const dP = -(1 - c) * a * sig * (1 - sig)
      grad += (correct ? 1 / P : -1 / Q) * dP
      hess -= (dP * dP) / (P * Q)
    }
    if (Math.abs(hess) < 1e-10) break
    b = Math.max(-4, Math.min(4, b - grad / hess))
  }
  return b
}

export async function POST(request: NextRequest) {
  // Auth: admin key check
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()

  try {
    // Load all IRT responses with associated question params
    const { data: logs, error: logsError } = await (supabase as any)
      .from('irt_response_log')
      .select('question_id, correct, user_theta, questions!inner(irt_difficulty, irt_discrimination, irt_guessing)')
      .not('user_theta', 'is', null)

    if (logsError) throw logsError

    // Group responses by question
    const byQuestion = new Map<string, {
      responses: Array<{ theta: number; correct: boolean }>
      a: number; b0: number; c: number
    }>()

    for (const row of (logs as any[])) {
      const qid = row.question_id
      if (!byQuestion.has(qid)) {
        byQuestion.set(qid, {
          responses: [],
          a: row.questions.irt_discrimination ?? 1.0,
          b0: row.questions.irt_difficulty ?? 0.0,
          c: row.questions.irt_guessing ?? 0.25,
        })
      }
      byQuestion.get(qid)!.responses.push({
        theta: row.user_theta,
        correct: row.correct,
      })
    }

    // Collect eligible questions (≥ MIN_RESPONSES)
    const updates: Array<{ question_id: string; b_new: number; b_old: number; a: number; c: number }> = []
    for (const [qid, { responses, a, b0, c }] of byQuestion) {
      if (responses.length < MIN_RESPONSES) continue
      const b_new = updateDifficulty(responses, b0, a, c)
      updates.push({ question_id: qid, b_new, b_old: b0, a, c })
    }

    if (updates.length === 0) {
      return NextResponse.json({
        calibrated: 0,
        message: `No questions met the minimum ${MIN_RESPONSES} responses threshold`,
        totalResponses: (logs as any[]).length,
      })
    }

    // Create calibration batch record
    const { data: batch, error: batchError } = await (supabase as any)
      .from('irt_calibration_batches')
      .insert({
        batch_name: `auto_${new Date().toISOString().slice(0, 10)}`,
        responses_count: (logs as any[]).length,
        questions_calibrated: updates.length,
        model_type: '3PL',
        estimation_method: 'bayesian_newton_raphson',
        convergence_criterion: 1e-8,
        iterations: NR_ITERATIONS,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (batchError) throw batchError

    // Bulk-insert parameter history (trigger auto-updates questions table)
    const historyRows = updates.map(({ question_id, b_new, b_old, a, c }) => ({
      question_id,
      calibration_batch_id: batch.id,
      difficulty: b_new,
      discrimination: a,
      guessing: c,
      difficulty_delta: b_new - b_old,
      discrimination_delta: 0,
    }))

    const { error: histError } = await (supabase as any)
      .from('irt_parameter_history')
      .insert(historyRows)

    if (histError) throw histError

    return NextResponse.json({
      calibrated: updates.length,
      batchId: batch.id,
      totalResponses: (logs as any[]).length,
      completedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[irt-calibrate] error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}

