'use client'

import { useCallback, useEffect, useState } from 'react'
import type { StudentRiskProfile, RiskTrajectory } from '@/lib/erem/epistemicTypes'

interface UseStudentRiskProfileOptions {
  studentId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseStudentRiskProfileReturn {
  profile: StudentRiskProfile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useStudentRiskProfile(
  options: UseStudentRiskProfileOptions = {}
): UseStudentRiskProfileReturn {
  const { studentId, autoRefresh = false, refreshInterval = 300000 } = options

  const [profile, setProfile] = useState<StudentRiskProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!studentId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/erem/predict?studentId=${studentId}`)
      const data = await res.json()

      if (data.success && data.profile) {
        setProfile({
          studentId: data.profile.studentId,
          timestamp: new Date(data.profile.timestamp),
          compositeRisk: {
            value: data.profile.compositeRisk.value,
            confidence: data.profile.compositeRisk.confidence,
            provenance: [],
            timestamp: new Date(),
            decayRate: 0.05,
            distribution: 'gaussian',
            lowerBound: data.profile.compositeRisk.lowerBound,
            upperBound: data.profile.compositeRisk.upperBound,
            spread: 0.15,
          },
          clinicalReasoningRisk: {
            value: data.profile.dimensionRisks.clinicalReasoning.value,
            confidence: data.profile.dimensionRisks.clinicalReasoning.confidence,
            provenance: [],
            timestamp: new Date(),
            decayRate: 0.05,
            distribution: 'gaussian',
            lowerBound: 0,
            upperBound: 1,
            spread: 0.15,
          },
          engagementRisk: {
            value: data.profile.dimensionRisks.engagement.value,
            confidence: data.profile.dimensionRisks.engagement.confidence,
            provenance: [],
            timestamp: new Date(),
            decayRate: 0.05,
            distribution: 'gaussian',
            lowerBound: 0,
            upperBound: 1,
            spread: 0.15,
          },
          wellbeingRisk: {
            value: data.profile.dimensionRisks.wellbeing.value,
            confidence: data.profile.dimensionRisks.wellbeing.confidence,
            provenance: [],
            timestamp: new Date(),
            decayRate: 0.05,
            distribution: 'gaussian',
            lowerBound: 0,
            upperBound: 1,
            spread: 0.15,
          },
          academicRisk: {
            value: data.profile.dimensionRisks.academic.value,
            confidence: data.profile.dimensionRisks.academic.confidence,
            provenance: [],
            timestamp: new Date(),
            decayRate: 0.05,
            distribution: 'gaussian',
            lowerBound: 0,
            upperBound: 1,
            spread: 0.15,
          },
          trajectory: data.profile.trajectory as RiskTrajectory,
          trajectoryConfidence: data.profile.trajectoryConfidence,
          daysOfData: data.profile.daysOfData,
          shapValues: new Map(Object.entries(data.profile.shapValues || {})),
          lastActivityAt: new Date(data.profile.timestamp),
          dataQuality: data.profile.dataQuality,
        })
      } else {
        setError(data.error || 'Failed to load risk profile')
      }
    } catch (e) {
      setError('Network error while fetching risk profile')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!autoRefresh || !studentId) return

    const interval = setInterval(fetchProfile, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchProfile, studentId])

  return { profile, loading, error, refresh: fetchProfile }
}

interface RiskSnapshot {
  id: string
  timestamp: Date
  compositeRisk: number
  clinicalReasoningRisk: number
  engagementRisk: number
  wellbeingRisk: number
  academicRisk: number
  confidence: number
}

interface UseRiskSnapshotsOptions {
  studentId?: string
  days?: number
}

interface UseRiskSnapshotsReturn {
  snapshots: RiskSnapshot[]
  loading: boolean
  error: string | null
}

export function useRiskSnapshots(
  options: UseRiskSnapshotsOptions = {}
): UseRiskSnapshotsReturn {
  const { studentId, days = 90 } = options

  const [snapshots, setSnapshots] = useState<RiskSnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return

    setLoading(true)

    fetch(`/api/erem/snapshots?studentId=${studentId}&days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.snapshots) {
          setSnapshots(
            data.snapshots.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              timestamp: new Date(s.timestamp as string),
              compositeRisk: s.compositeRisk as number,
              clinicalReasoningRisk: s.clinicalReasoningRisk as number,
              engagementRisk: s.engagementRisk as number,
              wellbeingRisk: s.wellbeingRisk as number,
              academicRisk: s.academicRisk as number,
              confidence: s.confidence as number,
            }))
          )
        } else {
          setError(data.error || 'Failed to load snapshots')
        }
      })
      .catch((e) => {
        setError('Network error')
        console.error(e)
      })
      .finally(() => setLoading(false))
  }, [studentId, days])

  return { snapshots, loading, error }
}

interface Intervention {
  id: string
  type: string
  priority: string
  title: string
  description: string
  rationale: string
  expectedImpact: number
  confidence: number
  status: string
  suggestedAt: Date
  startedAt?: Date
  completedAt?: Date
  outcome?: string
}

interface UseInterventionsOptions {
  studentId?: string
  status?: string
}

interface UseInterventionsReturn {
  interventions: Intervention[]
  loading: boolean
  error: string | null
  generateRecommendations: () => Promise<void>
  updateStatus: (interventionId: string, status: string, outcome?: string) => Promise<void>
}

export function useInterventions(
  options: UseInterventionsOptions = {}
): UseInterventionsReturn {
  const { studentId, status } = options

  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInterventions = useCallback(async () => {
    if (!studentId) return

    setLoading(true)

    try {
      const params = new URLSearchParams({ studentId })
      if (status) params.set('status', status)

      const res = await fetch(`/api/erem/interventions?${params}`)
      const data = await res.json()

      if (data.success && data.interventions) {
        setInterventions(
          data.interventions.map((i: Record<string, unknown>) => ({
            id: i.id as string,
            type: i.type as string,
            priority: i.priority as string,
            title: i.title as string,
            description: i.description as string,
            rationale: i.rationale as string,
            expectedImpact: i.expectedImpact as number,
            confidence: i.confidence as number,
            status: i.status as string,
            suggestedAt: new Date(i.suggestedAt as string),
            startedAt: i.startedAt ? new Date(i.startedAt as string) : undefined,
            completedAt: i.completedAt ? new Date(i.completedAt as string) : undefined,
            outcome: i.outcome as string | undefined,
          }))
        )
      }
    } catch (e) {
      setError('Failed to load interventions')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [studentId, status])

  useEffect(() => {
    fetchInterventions()
  }, [fetchInterventions])

  const generateRecommendations = useCallback(async () => {
    if (!studentId) return

    setLoading(true)
    try {
      await fetch('/api/erem/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      await fetchInterventions()
    } catch (e) {
      setError('Failed to generate recommendations')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [studentId, fetchInterventions])

  const updateStatus = useCallback(
    async (interventionId: string, newStatus: string, outcome?: string) => {
      try {
        await fetch('/api/erem/interventions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interventionId,
            status: newStatus,
            outcome,
          }),
        })
        await fetchInterventions()
      } catch (e) {
        setError('Failed to update intervention status')
        console.error(e)
      }
    },
    [fetchInterventions]
  )

  return {
    interventions,
    loading,
    error,
    generateRecommendations,
    updateStatus,
  }
}
