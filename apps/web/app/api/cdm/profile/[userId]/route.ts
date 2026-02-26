// ============================================================
// CDM PROFILE API ROUTE
// GET /api/cdm/profile/[userId] — attribute mastery profile + history
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError } from '@/lib/supabase/errors'
import { CDM_ATTRIBUTES, CDM_ATTRIBUTE_LABELS_PT } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/cdm/profile/[userId]
 *
 * Returns the latest CDM snapshot for a user plus historical snapshots
 * for trajectory visualization.
 *
 * Users can only view their own profile. Institutional tier can view others.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Access control: own profile only (unless institutional)
    const targetUserId = userId === 'me' ? user.id : userId
    if (targetUserId !== user.id) {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()
      if (profile?.subscription_tier !== 'institutional') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Latest snapshot
    const { data: latestSnap, error: snapError } = await (supabase as any)
      .from('cdm_snapshots')
      .select('*')
      .eq('user_id', targetUserId)
      .order('snapshot_at', { ascending: false })
      .limit(1)

    if (snapError) {
      if (isMissingTableError(snapError)) {
        return NextResponse.json({
          profile: null,
          history: [],
          warning: 'Tabelas CDM ainda não migradas (execute migração 022).',
        })
      }
      throw snapError
    }

    // Historical snapshots for trajectory (last 30)
    const { data: history } = await (supabase as any)
      .from('cdm_snapshots')
      .select('snapshot_at, eap_estimate, latent_class, posterior_entropy, mastered_attributes')
      .eq('user_id', targetUserId)
      .order('snapshot_at', { ascending: true })
      .limit(30)

    const latest = latestSnap?.[0] ?? null

    // Build annotated profile with attribute labels
    const annotatedProfile = latest
      ? {
          ...latest,
          attributeBreakdown: CDM_ATTRIBUTES.map((attr, k) => ({
            id: attr,
            labelPt: CDM_ATTRIBUTE_LABELS_PT[attr],
            eap: latest.eap_estimate?.[k] ?? 0,
            mastered: latest.map_estimate?.[k] ?? false,
          })),
        }
      : null

    return NextResponse.json({
      profile: annotatedProfile,
      history: history ?? [],
      summary: latest
        ? {
            masteredCount: (latest.mastered_attributes ?? []).length,
            unmasteredCount: (latest.unmastered_attributes ?? []).length,
            posteriorEntropy: latest.posterior_entropy,
            classificationConfidence: latest.classification_confidence,
            snapshotAt: latest.snapshot_at,
          }
        : null,
    })
  } catch (error) {
    console.error('CDM Profile Error:', error)
    return NextResponse.json(
      { error: 'Falha ao carregar perfil CDM', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
