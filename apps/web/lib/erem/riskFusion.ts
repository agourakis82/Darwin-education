// ============================================================
// MULTI-MODAL RISK FUSION PIPELINE (EREM Phase 2)
// Extracts risk signals from multiple data sources and fuses them
// using inverse-variance weighting for uncertainty-aware aggregation
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/types'
import {
  RiskScore,
  createRiskScore,
  fuseRiskScores,
  applyDecay,
  ProvenanceEntry,
} from './epistemicTypes'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface ClinicalReasoningSignals {
  thetaTrend: RiskScore
  thetaVolatility: RiskScore
  semanticScore: RiskScore
  lacunaPattern: RiskScore
  conceptCoverage: RiskScore
}

export interface EngagementSignals {
  loginFrequency: RiskScore
  sessionDuration: RiskScore
  pausePattern: RiskScore
  streakConsistency: RiskScore
  responseTimePattern: RiskScore
}

export interface WellbeingSignals {
  hesitationPattern: RiskScore
  anxietyIndicators: RiskScore
  studyScheduleRegularity: RiskScore
  keystrokeDynamics: RiskScore
}

export interface AcademicSignals {
  areaPerformanceVariance: RiskScore
  recentPerformanceTrend: RiskScore
  difficultyProgression: RiskScore
  knowledgeRetention: RiskScore
}

export interface RiskFusionConfig {
  clinicalReasoningWeight: number
  engagementWeight: number
  wellbeingWeight: number
  academicWeight: number
  lookbackDays: number
  minDataPoints: number
}

export const DEFAULT_FUSION_CONFIG: RiskFusionConfig = {
  clinicalReasoningWeight: 0.35,
  engagementWeight: 0.25,
  wellbeingWeight: 0.20,
  academicWeight: 0.20,
  lookbackDays: 30,
  minDataPoints: 5,
}

// ============================================================
// CLINICAL REASONING SIGNAL EXTRACTORS
// ============================================================

export async function extractThetaTrendSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: responses, error } = await supabase
    .from('irt_response_log')
    .select('user_theta, created_at')
    .eq('user_id', userId)
    .not('user_theta', 'is', null)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !responses || responses.length < 3) {
    return createRiskScore(0.5, 0.1, 'theta_trend_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
      metadata: { reason: 'insufficient_data', dataPoints: responses?.length ?? 0 },
    })
  }

  const thetas = responses
    .map((r) => r.user_theta)
    .filter((t): t is number => t !== null)

  if (thetas.length < 3) {
    return createRiskScore(0.5, 0.1, 'theta_trend_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Linear regression for trend detection
  const n = thetas.length
  const xMean = (n - 1) / 2
  const yMean = thetas.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (thetas[i] - yMean)
    denominator += Math.pow(i - xMean, 2)
  }

  const slope = denominator !== 0 ? numerator / denominator : 0

  // Convert slope to risk: positive slope = improving (lower risk)
  // Theta typically ranges from -3 to +3, slope units are theta/day
  // Negative slope means declining performance = higher risk
  const riskValue = clamp(0.5 - slope * 0.15, 0, 1)

  // Confidence based on R-squared
  const yHat = thetas.map((_, i) => yMean + slope * (i - xMean))
  const ssRes = thetas.reduce((sum, y, i) => sum + Math.pow(y - yHat[i], 2), 0)
  const ssTot = thetas.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0

  // More data points = higher confidence
  const dataQualityFactor = Math.min(n / 20, 1)

  const confidence = clamp(rSquared * dataQualityFactor * 0.8 + 0.1, 0.1, 0.95)

  return createRiskScore(riskValue, confidence, 'theta_trend_analysis', {
    spread: 0.15,
    metadata: { slope, rSquared, dataPoints: n, trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable' },
  })
}

export async function extractThetaVolatilitySignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: responses, error } = await supabase
    .from('irt_response_log')
    .select('user_theta, created_at')
    .eq('user_id', userId)
    .not('user_theta', 'is', null)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !responses || responses.length < 5) {
    return createRiskScore(0.5, 0.1, 'theta_volatility_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const thetas = responses
    .map((r) => r.user_theta)
    .filter((t): t is number => t !== null)

  if (thetas.length < 5) {
    return createRiskScore(0.5, 0.1, 'theta_volatility_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Calculate standard deviation of theta
  const mean = thetas.reduce((a, b) => a + b, 0) / thetas.length
  const variance = thetas.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / thetas.length
  const stdDev = Math.sqrt(variance)

  // High volatility (stdDev > 0.8) indicates inconsistent performance = higher risk
  // Low volatility (stdDev < 0.3) indicates stable performance = lower risk
  const riskValue = clamp(stdDev / 1.5, 0, 1)

  // Confidence based on number of observations and time span
  const confidence = clamp(Math.min(thetas.length / 30, 1) * 0.7 + 0.2, 0.2, 0.9)

  return createRiskScore(riskValue, confidence, 'theta_volatility_analysis', {
    spread: 0.12,
    metadata: { stdDev, mean, dataPoints: thetas.length },
  })
}

export async function extractSemanticScoreSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: analyses, error } = await supabase
    .from('ddl_semantic_analysis')
    .select('semantic_similarity_score, concept_coverage, analyzed_at')
    .eq('response_id', (supabase as any).rpc('get_user_response_ids', { user_id_param: userId }))
    .gte('analyzed_at', cutoffDate.toISOString())

  if (error || !analyses || analyses.length === 0) {
    return createRiskScore(0.5, 0.1, 'semantic_score_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Average semantic similarity score (higher = better = lower risk)
  const scores = analyses
    .map((a) => a.semantic_similarity_score)
    .filter((s): s is number => s !== null)

  if (scores.length === 0) {
    return createRiskScore(0.5, 0.1, 'semantic_score_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

  // Invert: high semantic score = low risk
  const riskValue = clamp(1 - avgScore, 0, 1)
  const confidence = clamp(Math.min(scores.length / 10, 1) * 0.6 + 0.3, 0.3, 0.85)

  return createRiskScore(riskValue, confidence, 'semantic_analysis', {
    spread: 0.1,
    metadata: { avgScore, dataPoints: scores.length },
  })
}

export async function extractLacunaPatternSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  // Query DDL classifications through responses
  const { data: classifications, error } = await supabase
    .from('ddl_classification')
    .select('primary_lacuna_type, primary_probability, created_at')
    .gte('created_at', cutoffDate.toISOString())
    .limit(100)

  if (error || !classifications || classifications.length === 0) {
    return createRiskScore(0.5, 0.1, 'lacuna_pattern_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Count lacuna types - LIE (integration) is most concerning
  const lacunaCounts: Record<string, number> = {
    LE: 0,
    LEm: 0,
    LIE: 0,
    MIXED: 0,
    NONE: 0,
  }

  const weights: Record<string, number> = {
    LE: 0.3,    // Factual gap
    LEm: 0.4,   // Methodological gap
    LIE: 0.9,   // Integration gap - most critical
    MIXED: 0.6,
    NONE: 0,
  }

  let totalWeightedRisk = 0
  classifications.forEach((c) => {
    const type = c.primary_lacuna_type
    lacunaCounts[type] = (lacunaCounts[type] || 0) + 1
    totalWeightedRisk += (weights[type] || 0.5) * (c.primary_probability || 0.5)
  })

  const riskValue = clamp(totalWeightedRisk / classifications.length, 0, 1)
  const confidence = clamp(Math.min(classifications.length / 15, 1) * 0.7 + 0.2, 0.2, 0.85)

  return createRiskScore(riskValue, confidence, 'lacuna_pattern_analysis', {
    spread: 0.13,
    metadata: { lacunaCounts, dataPoints: classifications.length },
  })
}

export async function extractConceptCoverageSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: analyses, error } = await supabase
    .from('ddl_semantic_analysis')
    .select('concept_coverage, analyzed_at')
    .gte('analyzed_at', cutoffDate.toISOString())

  if (error || !analyses || analyses.length === 0) {
    return createRiskScore(0.5, 0.1, 'concept_coverage_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Calculate average concept coverage
  const coverages: number[] = []

  analyses.forEach((a) => {
    if (a.concept_coverage && typeof a.concept_coverage === 'object') {
      const coverage = a.concept_coverage as Record<string, number>
      const values = Object.values(coverage).filter((v) => typeof v === 'number')
      if (values.length > 0) {
        coverages.push(values.reduce((sum, v) => sum + v, 0) / values.length)
      }
    }
  })

  if (coverages.length === 0) {
    return createRiskScore(0.5, 0.1, 'concept_coverage_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const avgCoverage = coverages.reduce((a, b) => a + b, 0) / coverages.length

  // Low coverage = high risk
  const riskValue = clamp(1 - avgCoverage, 0, 1)
  const confidence = clamp(Math.min(coverages.length / 10, 1) * 0.6 + 0.25, 0.25, 0.8)

  return createRiskScore(riskValue, confidence, 'concept_coverage_analysis', {
    spread: 0.11,
    metadata: { avgCoverage, dataPoints: coverages.length },
  })
}

// ============================================================
// ENGAGEMENT SIGNAL EXTRACTORS
// ============================================================

export async function extractLoginFrequencySignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('last_activity_at, streak_days')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return createRiskScore(0.5, 0.1, 'login_frequency_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Calculate days since last activity
  const lastActivity = profile.last_activity_at ? new Date(profile.last_activity_at) : null
  const daysSinceActivity = lastActivity
    ? (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : lookbackDays

  // Streak analysis
  const streak = profile.streak_days || 0

  // High risk if many days since activity or no streak
  const activityRisk = clamp(daysSinceActivity / 14, 0, 1)
  const streakRisk = clamp(1 - streak / 30, 0, 1)

  const riskValue = clamp((activityRisk * 0.6 + streakRisk * 0.4), 0, 1)
  const confidence = clamp(streak > 0 ? 0.7 : 0.3, 0.2, 0.8)

  return createRiskScore(riskValue, confidence, 'login_frequency_analysis', {
    spread: 0.15,
    metadata: { daysSinceActivity, streakDays: streak },
  })
}

export async function extractSessionDurationSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select('total_time_seconds, started_at, completed_at')
    .eq('user_id', userId)
    .gte('started_at', cutoffDate.toISOString())
    .not('completed_at', 'is', null)

  if (error || !attempts || attempts.length === 0) {
    return createRiskScore(0.5, 0.1, 'session_duration_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Calculate average session duration
  const durations = attempts
    .filter((a) => a.total_time_seconds && a.total_time_seconds > 0)
    .map((a) => a.total_time_seconds as number)

  if (durations.length === 0) {
    return createRiskScore(0.5, 0.1, 'session_duration_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length

  // Optimal study sessions are 20-60 minutes (1200-3600 seconds)
  // Too short (<10 min) or too long (>90 min) may indicate issues
  const optimalMin = 600   // 10 minutes
  const optimalMax = 5400  // 90 minutes
  const idealMid = 2400    // 40 minutes

  let riskValue: number
  if (avgDuration >= optimalMin && avgDuration <= optimalMax) {
    // In optimal range - distance from ideal affects risk
    riskValue = Math.abs(avgDuration - idealMid) / idealMid * 0.3
  } else if (avgDuration < optimalMin) {
    // Too short - high risk
    riskValue = clamp(0.6 + (optimalMin - avgDuration) / optimalMin * 0.3, 0.5, 1)
  } else {
    // Too long - moderate risk (could indicate struggle)
    riskValue = clamp(0.4 + (avgDuration - optimalMax) / optimalMax * 0.2, 0.3, 0.7)
  }

  const confidence = clamp(Math.min(durations.length / 10, 1) * 0.5 + 0.35, 0.35, 0.75)

  return createRiskScore(riskValue, confidence, 'session_duration_analysis', {
    spread: 0.12,
    metadata: { avgDurationMinutes: avgDuration / 60, dataPoints: durations.length },
  })
}

export async function extractPausePatternSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  // Get telemetry events for pause analysis
  const { data: telemetry, error } = await supabase
    .from('cat_telemetry')
    .select('event_type, metadata, event_timestamp')
    .eq('user_id', userId)
    .gte('event_timestamp', cutoffDate.toISOString())
    .in('event_type', ['item_rendered', 'answer_submitted'])

  if (error || !telemetry || telemetry.length < 4) {
    return createRiskScore(0.5, 0.1, 'pause_pattern_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Calculate inter-event intervals
  const intervals: number[] = []
  for (let i = 1; i < telemetry.length; i++) {
    const prev = new Date(telemetry[i - 1].event_timestamp)
    const curr = new Date(telemetry[i].event_timestamp)
    const intervalMs = curr.getTime() - prev.getTime()
    if (intervalMs > 0 && intervalMs < 600000) { // Ignore intervals > 10 min
      intervals.push(intervalMs)
    }
  }

  if (intervals.length < 3) {
    return createRiskScore(0.5, 0.1, 'pause_pattern_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Analyze pause patterns
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)

  // Coefficient of variation (CV) indicates consistency
  const cv = avgInterval > 0 ? stdDev / avgInterval : 1

  // High CV = erratic response patterns = higher risk
  const riskValue = clamp(cv / 2, 0, 1)
  const confidence = clamp(Math.min(intervals.length / 20, 1) * 0.5 + 0.3, 0.3, 0.7)

  return createRiskScore(riskValue, confidence, 'pause_pattern_analysis', {
    spread: 0.14,
    metadata: { avgIntervalSeconds: avgInterval / 1000, cv, dataPoints: intervals.length },
  })
}

export async function extractResponseTimePatternSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: responses, error } = await supabase
    .from('irt_response_log')
    .select('response_time_ms, correct')
    .eq('user_id', userId)
    .not('response_time_ms', 'is', null)
    .gte('created_at', cutoffDate.toISOString())

  if (error || !responses || responses.length < 5) {
    return createRiskScore(0.5, 0.1, 'response_time_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const times = responses
    .filter((r) => r.response_time_ms && r.response_time_ms > 0)
    .map((r) => ({ time: r.response_time_ms as number, correct: r.correct }))

  if (times.length < 5) {
    return createRiskScore(0.5, 0.1, 'response_time_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Analyze correlation between response time and correctness
  // Fast wrong answers or slow correct answers may indicate issues
  const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length
  const correctTimes = times.filter((t) => t.correct).map((t) => t.time)
  const wrongTimes = times.filter((t) => !t.correct).map((t) => t.time)

  const avgCorrectTime = correctTimes.length > 0
    ? correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length
    : avgTime
  const avgWrongTime = wrongTimes.length > 0
    ? wrongTimes.reduce((a, b) => a + b, 0) / wrongTimes.length
    : avgTime

  // Risk indicators:
  // 1. Very fast wrong answers (guessing)
  // 2. Very slow correct answers (struggling even when correct)
  const guessingRisk = avgWrongTime < 20000 ? 0.4 : 0.1  // < 20 seconds for wrong
  const strugglingRisk = avgCorrectTime > 120000 ? 0.3 : 0.1  // > 2 minutes for correct

  // High variance in response times also indicates inconsistency
  const variance = times.reduce((sum, t) => sum + Math.pow(t.time - avgTime, 2), 0) / times.length
  const cv = avgTime > 0 ? Math.sqrt(variance) / avgTime : 1
  const varianceRisk = clamp(cv / 3, 0, 0.4)

  const riskValue = clamp(guessingRisk + strugglingRisk + varianceRisk, 0, 1)
  const confidence = clamp(Math.min(times.length / 20, 1) * 0.5 + 0.35, 0.35, 0.75)

  return createRiskScore(riskValue, confidence, 'response_time_pattern_analysis', {
    spread: 0.13,
    metadata: {
      avgTimeSeconds: avgTime / 1000,
      avgCorrectTimeSeconds: avgCorrectTime / 1000,
      avgWrongTimeSeconds: avgWrongTime / 1000,
      dataPoints: times.length,
    },
  })
}

// ============================================================
// WELLBEING SIGNAL EXTRACTORS
// ============================================================

export async function extractHesitationPatternSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: behavioral, error } = await supabase
    .from('ddl_behavioral_analysis')
    .select('hesitation_pattern, deviation_from_baseline, analyzed_at')
    .gte('analyzed_at', cutoffDate.toISOString())

  if (error || !behavioral || behavioral.length === 0) {
    return createRiskScore(0.5, 0.1, 'hesitation_pattern_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Extract hesitation metrics
  const hesitationScores: number[] = []

  behavioral.forEach((b) => {
    if (b.hesitation_pattern && typeof b.hesitation_pattern === 'object') {
      const pattern = b.hesitation_pattern as Record<string, unknown>
      // Common hesitation metrics
      if (typeof pattern.pauseCount === 'number') {
        hesitationScores.push(clamp(pattern.pauseCount / 10, 0, 1))
      }
      if (typeof pattern.backspaceRate === 'number') {
        hesitationScores.push(clamp(pattern.backspaceRate, 0, 1))
      }
    }
    if (b.deviation_from_baseline && typeof b.deviation_from_baseline === 'object') {
      const deviation = b.deviation_from_baseline as Record<string, unknown>
      if (typeof deviation.hesitationScore === 'number') {
        hesitationScores.push(clamp(deviation.hesitationScore, 0, 1))
      }
    }
  })

  if (hesitationScores.length === 0) {
    return createRiskScore(0.5, 0.15, 'hesitation_pattern_no_metrics', {
      distribution: 'uniform',
      spread: 0.35,
    })
  }

  const avgHesitation = hesitationScores.reduce((a, b) => a + b, 0) / hesitationScores.length
  const confidence = clamp(Math.min(behavioral.length / 8, 1) * 0.5 + 0.3, 0.3, 0.7)

  return createRiskScore(avgHesitation, confidence, 'hesitation_pattern_analysis', {
    spread: 0.12,
    metadata: { avgHesitation, dataPoints: behavioral.length, metricsFound: hesitationScores.length },
  })
}

export async function extractAnxietyIndicatorsSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: behavioral, error } = await supabase
    .from('ddl_behavioral_analysis')
    .select('anxiety_indicators, deviation_from_baseline, analyzed_at')
    .gte('analyzed_at', cutoffDate.toISOString())

  if (error || !behavioral || behavioral.length === 0) {
    return createRiskScore(0.5, 0.1, 'anxiety_indicators_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const anxietyScores: number[] = []

  behavioral.forEach((b) => {
    if (b.anxiety_indicators && typeof b.anxiety_indicators === 'object') {
      const indicators = b.anxiety_indicators as Record<string, unknown>
      // Common anxiety metrics
      if (typeof indicators.overallScore === 'number') {
        anxietyScores.push(clamp(indicators.overallScore, 0, 1))
      }
      if (typeof indicators.rushedResponses === 'number') {
        anxietyScores.push(clamp(indicators.rushedResponses, 0, 1))
      }
    }
  })

  if (anxietyScores.length === 0) {
    return createRiskScore(0.5, 0.15, 'anxiety_indicators_no_metrics', {
      distribution: 'uniform',
      spread: 0.35,
    })
  }

  const avgAnxiety = anxietyScores.reduce((a, b) => a + b, 0) / anxietyScores.length
  const confidence = clamp(Math.min(behavioral.length / 8, 1) * 0.4 + 0.25, 0.25, 0.65)

  return createRiskScore(avgAnxiety, confidence, 'anxiety_indicators_analysis', {
    spread: 0.15,
    metadata: { avgAnxiety, dataPoints: behavioral.length },
  })
}

export async function extractStudyScheduleRegularitySignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select('started_at')
    .eq('user_id', userId)
    .gte('started_at', cutoffDate.toISOString())
    .order('started_at', { ascending: true })

  if (error || !attempts || attempts.length < 3) {
    return createRiskScore(0.5, 0.1, 'study_schedule_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Analyze time-of-day and day-of-week patterns
  const hours = attempts.map((a) => new Date(a.started_at).getHours())
  const daysOfWeek = attempts.map((a) => new Date(a.started_at).getDay())

  // Calculate hour consistency (lower std dev = more regular)
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length
  const hourVariance = hours.reduce((sum, h) => sum + Math.pow(h - avgHour, 2), 0) / hours.length
  const hourStdDev = Math.sqrt(hourVariance)

  // Regular study times should have low std dev (< 3 hours)
  const hourRegularityRisk = clamp(hourStdDev / 8, 0, 1)

  // Analyze gaps between sessions
  const dates = attempts.map((a) => new Date(a.started_at).toDateString())
  const uniqueDays = new Set(dates).size
  const expectedDays = lookbackDays * 0.5 // Expect activity on ~50% of days
  const consistencyRisk = clamp(1 - uniqueDays / expectedDays, 0, 1)

  const riskValue = clamp((hourRegularityRisk * 0.4 + consistencyRisk * 0.6), 0, 1)
  const confidence = clamp(Math.min(attempts.length / 15, 1) * 0.5 + 0.3, 0.3, 0.7)

  return createRiskScore(riskValue, confidence, 'study_schedule_regularity_analysis', {
    spread: 0.14,
    metadata: { hourStdDev, uniqueActiveDays: uniqueDays, sessions: attempts.length },
  })
}

export async function extractKeystrokeDynamicsSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: behavioral, error } = await supabase
    .from('ddl_behavioral_analysis')
    .select('deviation_from_baseline, analyzed_at')
    .gte('analyzed_at', cutoffDate.toISOString())

  if (error || !behavioral || behavioral.length === 0) {
    return createRiskScore(0.5, 0.1, 'keystroke_dynamics_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const deviationScores: number[] = []

  behavioral.forEach((b) => {
    if (b.deviation_from_baseline && typeof b.deviation_from_baseline === 'object') {
      const deviation = b.deviation_from_baseline as Record<string, unknown>
      if (typeof deviation.keystrokeDynamicsScore === 'number') {
        deviationScores.push(clamp(deviation.keystrokeDynamicsScore, 0, 1))
      }
      if (typeof deviation.typingSpeedDeviation === 'number') {
        deviationScores.push(clamp(Math.abs(deviation.typingSpeedDeviation), 0, 1))
      }
    }
  })

  if (deviationScores.length === 0) {
    return createRiskScore(0.5, 0.15, 'keystroke_dynamics_no_metrics', {
      distribution: 'uniform',
      spread: 0.35,
    })
  }

  const avgDeviation = deviationScores.reduce((a, b) => a + b, 0) / deviationScores.length
  const confidence = clamp(Math.min(behavioral.length / 6, 1) * 0.35 + 0.2, 0.2, 0.6)

  return createRiskScore(avgDeviation, confidence, 'keystroke_dynamics_analysis', {
    spread: 0.18,
    metadata: { avgDeviation, dataPoints: behavioral.length },
  })
}

// ============================================================
// ACADEMIC SIGNAL EXTRACTORS
// ============================================================

export async function extractAreaPerformanceVarianceSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select('area_breakdown, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .gte('completed_at', cutoffDate.toISOString())

  if (error || !attempts || attempts.length === 0) {
    return createRiskScore(0.5, 0.1, 'area_variance_no_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Aggregate area performance
  const areaScores: Record<string, number[]> = {}

  attempts.forEach((attempt) => {
    if (attempt.area_breakdown && typeof attempt.area_breakdown === 'object') {
      const breakdown = attempt.area_breakdown as Record<string, number>
      Object.entries(breakdown).forEach(([area, score]) => {
        if (typeof score === 'number') {
          if (!areaScores[area]) areaScores[area] = []
          areaScores[area].push(score)
        }
      })
    }
  })

  const areas = Object.keys(areaScores)
  if (areas.length < 2) {
    return createRiskScore(0.5, 0.15, 'area_variance_insufficient_areas', {
      distribution: 'uniform',
      spread: 0.35,
    })
  }

  // Calculate variance across areas
  const areaAverages = areas.map((area) => {
    const scores = areaScores[area]
    return scores.reduce((a, b) => a + b, 0) / scores.length
  })

  const avgAreaScore = areaAverages.reduce((a, b) => a + b, 0) / areaAverages.length
  const variance = areaAverages.reduce((sum, s) => sum + Math.pow(s - avgAreaScore, 2), 0) / areaAverages.length
  const stdDev = Math.sqrt(variance)

  // High variance = imbalanced knowledge = higher risk
  const riskValue = clamp(stdDev / 0.3, 0, 1) // 0.3 is significant variance
  const confidence = clamp(Math.min(attempts.length / 5, 1) * 0.5 + 0.35, 0.35, 0.75)

  return createRiskScore(riskValue, confidence, 'area_performance_variance_analysis', {
    spread: 0.11,
    metadata: { stdDev, areaCount: areas.length, attemptCount: attempts.length },
  })
}

export async function extractRecentPerformanceTrendSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select('theta, completed_at, correct_count')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .not('theta', 'is', null)
    .gte('completed_at', cutoffDate.toISOString())
    .order('completed_at', { ascending: true })

  if (error || !attempts || attempts.length < 3) {
    return createRiskScore(0.5, 0.1, 'performance_trend_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  const thetas = attempts
    .filter((a) => a.theta !== null)
    .map((a) => a.theta as number)

  if (thetas.length < 3) {
    return createRiskScore(0.5, 0.1, 'performance_trend_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Linear regression for recent trend
  const n = thetas.length
  const xMean = (n - 1) / 2
  const yMean = thetas.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (thetas[i] - yMean)
    denominator += Math.pow(i - xMean, 2)
  }

  const slope = denominator !== 0 ? numerator / denominator : 0

  // Negative slope = declining performance = higher risk
  const riskValue = clamp(0.5 - slope * 0.2, 0, 1)

  // R-squared for confidence
  const yHat = thetas.map((_, i) => yMean + slope * (i - xMean))
  const ssRes = thetas.reduce((sum, y, i) => sum + Math.pow(y - yHat[i], 2), 0)
  const ssTot = thetas.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0

  const confidence = clamp(rSquared * 0.7 + 0.2, 0.2, 0.85)

  return createRiskScore(riskValue, confidence, 'recent_performance_trend_analysis', {
    spread: 0.12,
    metadata: { slope, rSquared, dataPoints: n, trend: slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable' },
  })
}

export async function extractDifficultyProgressionSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const { data: responses, error } = await (supabase as any)
    .from('irt_response_log')
    .select(`
      correct,
      created_at,
      questions!inner(irt_difficulty)
    `)
    .eq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !responses || (responses as any[]).length < 10) {
    return createRiskScore(0.5, 0.1, 'difficulty_progression_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Track accuracy by difficulty buckets
  const buckets = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } }

  ;(responses as any[]).forEach((r: any) => {
    const difficulty = (r.questions as { irt_difficulty: number }).irt_difficulty
    let bucket: 'easy' | 'medium' | 'hard'
    if (difficulty < -0.5) bucket = 'easy'
    else if (difficulty < 0.5) bucket = 'medium'
    else bucket = 'hard'

    buckets[bucket].total++
    if (r.correct) buckets[bucket].correct++
  })

  // Calculate expected vs actual difficulty progression
  const easyAcc = buckets.easy.total > 0 ? buckets.easy.correct / buckets.easy.total : 0.5
  const mediumAcc = buckets.medium.total > 0 ? buckets.medium.correct / buckets.medium.total : 0.5
  const hardAcc = buckets.hard.total > 0 ? buckets.hard.correct / buckets.hard.total : 0.5

  // Risk if struggling on easy/medium (foundational issues)
  // Or if no exposure to harder questions (lack of progress)
  const easyRisk = buckets.easy.total > 3 && easyAcc < 0.7 ? (0.7 - easyAcc) * 2 : 0
  const mediumRisk = buckets.medium.total > 3 && mediumAcc < 0.5 ? (0.5 - mediumAcc) * 2 : 0
  const noProgressionRisk = buckets.hard.total < 3 ? 0.3 : 0

  const riskValue = clamp(easyRisk * 0.4 + mediumRisk * 0.4 + noProgressionRisk * 0.2, 0, 1)
  const confidence = clamp(Math.min(responses.length / 20, 1) * 0.5 + 0.3, 0.3, 0.7)

  return createRiskScore(riskValue, confidence, 'difficulty_progression_analysis', {
    spread: 0.13,
    metadata: { easyAcc, mediumAcc, hardAcc, buckets },
  })
}

export async function extractKnowledgeRetentionSignal(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays: number = 30
): Promise<RiskScore> {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  // Get flashcard review history for retention analysis
  const { data: flashcards, error } = await supabase
    .from('flashcards')
    .select('ease_factor, interval, repetitions, next_review')
    .gte('next_review', cutoffDate.toISOString())

  if (error || !flashcards || flashcards.length < 5) {
    return createRiskScore(0.5, 0.1, 'retention_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Analyze FSRS-based retention indicators
  const easeFactors = flashcards.filter((f) => f.ease_factor).map((f) => f.ease_factor)
  const intervals = flashcards.filter((f) => f.interval).map((f) => f.interval)

  if (easeFactors.length < 3) {
    return createRiskScore(0.5, 0.1, 'retention_insufficient_data', {
      distribution: 'uniform',
      spread: 0.4,
    })
  }

  // Low ease factor indicates struggling with retention
  const avgEaseFactor = easeFactors.reduce((a, b) => a + b, 0) / easeFactors.length
  const easeRisk = avgEaseFactor < 2.0 ? clamp((2.5 - avgEaseFactor) / 1.5, 0, 1) : 0

  // Short intervals indicate poor retention
  const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
  const intervalRisk = avgInterval < 3 ? clamp((7 - avgInterval) / 7, 0, 1) : 0

  const riskValue = clamp((easeRisk * 0.5 + intervalRisk * 0.5), 0, 1)
  const confidence = clamp(Math.min(flashcards.length / 20, 1) * 0.4 + 0.3, 0.3, 0.7)

  return createRiskScore(riskValue, confidence, 'knowledge_retention_analysis', {
    spread: 0.14,
    metadata: { avgEaseFactor, avgIntervalDays: avgInterval, cardCount: flashcards.length },
  })
}

// ============================================================
// SIGNAL FUSION FUNCTIONS
// ============================================================

export async function extractClinicalReasoningRisk(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<RiskScore> {
  const [thetaTrend, thetaVolatility, semanticScore, lacunaPattern, conceptCoverage] = await Promise.all([
    extractThetaTrendSignal(supabase, userId, config.lookbackDays),
    extractThetaVolatilitySignal(supabase, userId, config.lookbackDays),
    extractSemanticScoreSignal(supabase, userId, config.lookbackDays),
    extractLacunaPatternSignal(supabase, userId, config.lookbackDays),
    extractConceptCoverageSignal(supabase, userId, config.lookbackDays),
  ])

  // Weight signals by their clinical relevance
  const weights = [0.25, 0.15, 0.25, 0.20, 0.15] // thetaTrend, volatility, semantic, lacuna, concept

  return fuseRiskScores(
    [thetaTrend, thetaVolatility, semanticScore, lacunaPattern, conceptCoverage],
    weights,
    'clinical_reasoning_fusion'
  )
}

export async function extractEngagementRisk(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<RiskScore> {
  const [loginFrequency, sessionDuration, pausePattern, responseTime] = await Promise.all([
    extractLoginFrequencySignal(supabase, userId, config.lookbackDays),
    extractSessionDurationSignal(supabase, userId, config.lookbackDays),
    extractPausePatternSignal(supabase, userId, config.lookbackDays),
    extractResponseTimePatternSignal(supabase, userId, config.lookbackDays),
  ])

  const weights = [0.3, 0.25, 0.2, 0.25]

  return fuseRiskScores(
    [loginFrequency, sessionDuration, pausePattern, responseTime],
    weights,
    'engagement_fusion'
  )
}

export async function extractWellbeingRisk(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<RiskScore> {
  const [hesitation, anxiety, studySchedule, keystroke] = await Promise.all([
    extractHesitationPatternSignal(supabase, userId, config.lookbackDays),
    extractAnxietyIndicatorsSignal(supabase, userId, config.lookbackDays),
    extractStudyScheduleRegularitySignal(supabase, userId, config.lookbackDays),
    extractKeystrokeDynamicsSignal(supabase, userId, config.lookbackDays),
  ])

  const weights = [0.25, 0.35, 0.25, 0.15]

  return fuseRiskScores(
    [hesitation, anxiety, studySchedule, keystroke],
    weights,
    'wellbeing_fusion'
  )
}

export async function extractAcademicRisk(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<RiskScore> {
  const [areaVariance, recentTrend, difficultyProgression, retention] = await Promise.all([
    extractAreaPerformanceVarianceSignal(supabase, userId, config.lookbackDays),
    extractRecentPerformanceTrendSignal(supabase, userId, config.lookbackDays),
    extractDifficultyProgressionSignal(supabase, userId, config.lookbackDays),
    extractKnowledgeRetentionSignal(supabase, userId, config.lookbackDays),
  ])

  const weights = [0.2, 0.3, 0.25, 0.25]

  return fuseRiskScores(
    [areaVariance, recentTrend, difficultyProgression, retention],
    weights,
    'academic_fusion'
  )
}

export async function computeCompositeRiskScore(
  supabase: SupabaseClient<Database>,
  userId: string,
  config: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<{
  composite: RiskScore
  clinicalReasoning: RiskScore
  engagement: RiskScore
  wellbeing: RiskScore
  academic: RiskScore
}> {
  const [clinicalReasoning, engagement, wellbeing, academic] = await Promise.all([
    extractClinicalReasoningRisk(supabase, userId, config),
    extractEngagementRisk(supabase, userId, config),
    extractWellbeingRisk(supabase, userId, config),
    extractAcademicRisk(supabase, userId, config),
  ])

  // Fuse dimension risks with configured weights
  const composite = fuseRiskScores(
    [clinicalReasoning, engagement, wellbeing, academic],
    [config.clinicalReasoningWeight, config.engagementWeight, config.wellbeingWeight, config.academicWeight],
    'composite_risk_fusion'
  )

  return { composite, clinicalReasoning, engagement, wellbeing, academic }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
