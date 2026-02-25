// ============================================================
// TEMPORAL RISK TRAJECTORY MODELING (EREM Phase 3)
// Time-series analysis for risk trend detection and forecasting
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../supabase/types'
import {
  RiskScore,
  RiskTrajectory,
  createRiskScore,
  applyDecay,
  StudentRiskProfile,
} from './epistemicTypes'
import { computeCompositeRiskScore, RiskFusionConfig, DEFAULT_FUSION_CONFIG } from './riskFusion'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface RiskSnapshot {
  id?: string
  studentId: string
  timestamp: Date
  compositeRisk: number
  clinicalReasoningRisk: number
  engagementRisk: number
  wellbeingRisk: number
  academicRisk: number
  confidence: number
  metadata?: Record<string, unknown>
}

export interface TrajectoryAnalysis {
  trajectory: RiskTrajectory
  confidence: number
  slope: number
  volatility: number
  trendStrength: number
  forecast: RiskForecast
  changePoints: ChangePoint[]
}

export interface RiskForecast {
  predictedRisk30Days: number
  lowerBound: number
  upperBound: number
  confidence: number
  method: 'arima_approx' | 'linear' | 'exponential_smoothing'
}

export interface ChangePoint {
  timestamp: Date
  fromRisk: number
  toRisk: number
  magnitude: number
  direction: 'increase' | 'decrease'
}

export interface TrajectoryConfig {
  snapshotIntervalDays: number
  minSnapshotsForTrend: number
  maxSnapshotsHistory: number
  forecastHorizonDays: number
  volatilityThreshold: number
  trendThreshold: number
}

export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  snapshotIntervalDays: 1,
  minSnapshotsForTrend: 5,
  maxSnapshotsHistory: 90,
  forecastHorizonDays: 30,
  volatilityThreshold: 0.15,
  trendThreshold: 0.02,
}

// ============================================================
// SNAPSHOT MANAGEMENT
// ============================================================

export async function saveRiskSnapshot(
  supabase: SupabaseClient<Database>,
  snapshot: RiskSnapshot
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('student_risk_snapshots')
    .insert({
      student_id: snapshot.studentId,
      composite_risk: snapshot.compositeRisk,
      clinical_reasoning_risk: snapshot.clinicalReasoningRisk,
      engagement_risk: snapshot.engagementRisk,
      wellbeing_risk: snapshot.wellbeingRisk,
      academic_risk: snapshot.academicRisk,
      confidence: snapshot.confidence,
      metadata: (snapshot.metadata || {}) as Json,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving risk snapshot:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

export async function getRiskSnapshots(
  supabase: SupabaseClient<Database>,
  studentId: string,
  days: number = 90
): Promise<RiskSnapshot[]> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('student_risk_snapshots')
    .select('*')
    .eq('student_id', studentId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching risk snapshots:', error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    timestamp: new Date(row.created_at),
    compositeRisk: row.composite_risk,
    clinicalReasoningRisk: row.clinical_reasoning_risk,
    engagementRisk: row.engagement_risk,
    wellbeingRisk: row.wellbeing_risk,
    academicRisk: row.academic_risk,
    confidence: row.confidence,
    metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
  }))
}

export async function getLatestSnapshot(
  supabase: SupabaseClient<Database>,
  studentId: string
): Promise<RiskSnapshot | null> {
  const { data, error } = await supabase
    .from('student_risk_snapshots')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    studentId: data.student_id,
    timestamp: new Date(data.created_at),
    compositeRisk: data.composite_risk,
    clinicalReasoningRisk: data.clinical_reasoning_risk,
    engagementRisk: data.engagement_risk,
    wellbeingRisk: data.wellbeing_risk,
    academicRisk: data.academic_risk,
    confidence: data.confidence,
    metadata: (data.metadata ?? undefined) as Record<string, unknown> | undefined,
  }
}

// ============================================================
// TREND DETECTION
// ============================================================

export function detectTrend(values: number[], timestamps: Date[]): {
  slope: number
  rSquared: number
  trend: 'increasing' | 'decreasing' | 'stable'
} {
  if (values.length < 2) {
    return { slope: 0, rSquared: 0, trend: 'stable' }
  }

  const n = values.length

  // Convert timestamps to numeric (days since first observation)
  const firstTime = timestamps[0].getTime()
  const xValues = timestamps.map((t) => (t.getTime() - firstTime) / (1000 * 60 * 60 * 24))

  // Linear regression
  const xMean = xValues.reduce((a, b) => a + b, 0) / n
  const yMean = values.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean)
    denominator += Math.pow(xValues[i] - xMean, 2)
  }

  const slope = denominator !== 0 ? numerator / denominator : 0

  // Calculate R-squared
  const yHat = xValues.map((x) => yMean + slope * (x - xMean))
  const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - yHat[i], 2), 0)
  const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0

  // Determine trend direction (slope is risk change per day)
  const trend = slope > 0.005 ? 'increasing' : slope < -0.005 ? 'decreasing' : 'stable'

  return { slope, rSquared, trend }
}

export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0

  // Calculate coefficient of variation
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return stdDev / mean
}

export function detectChangePoints(
  values: number[],
  timestamps: Date[],
  threshold: number = 0.15
): ChangePoint[] {
  if (values.length < 3) return []

  const changePoints: ChangePoint[] = []

  // Use a simple rolling window approach
  const windowSize = Math.max(3, Math.floor(values.length / 5))

  for (let i = windowSize; i < values.length - windowSize; i++) {
    const beforeWindow = values.slice(i - windowSize, i)
    const afterWindow = values.slice(i, i + windowSize)

    const beforeMean = beforeWindow.reduce((a, b) => a + b, 0) / windowSize
    const afterMean = afterWindow.reduce((a, b) => a + b, 0) / windowSize

    const magnitude = Math.abs(afterMean - beforeMean)

    if (magnitude >= threshold) {
      changePoints.push({
        timestamp: timestamps[i],
        fromRisk: beforeMean,
        toRisk: afterMean,
        magnitude,
        direction: afterMean > beforeMean ? 'increase' : 'decrease',
      })
    }
  }

  return changePoints
}

// ============================================================
// FORECASTING
// ============================================================

export function forecastRisk(
  values: number[],
  timestamps: Date[],
  horizonDays: number = 30
): RiskForecast {
  if (values.length < 3) {
    // Not enough data - return neutral forecast with wide bounds
    return {
      predictedRisk30Days: 0.5,
      lowerBound: 0.1,
      upperBound: 0.9,
      confidence: 0.1,
      method: 'linear',
    }
  }

  // Determine which method to use based on data characteristics
  const volatility = calculateVolatility(values)
  const { slope, rSquared } = detectTrend(values, timestamps)

  let forecast: RiskForecast

  if (volatility > 0.4 || rSquared < 0.3) {
    // High volatility or poor fit - use exponential smoothing
    forecast = exponentialSmoothingForecast(values, horizonDays)
  } else if (values.length >= 10 && volatility < 0.2) {
    // Enough data with low volatility - ARIMA-like approximation
    forecast = arimaApproxForecast(values, timestamps, horizonDays)
  } else {
    // Default to linear projection
    forecast = linearForecast(values, timestamps, horizonDays)
  }

  return forecast
}

function linearForecast(
  values: number[],
  timestamps: Date[],
  horizonDays: number
): RiskForecast {
  const { slope, rSquared } = detectTrend(values, timestamps)
  const lastValue = values[values.length - 1]

  // Project forward
  const predictedRisk30Days = clamp(lastValue + slope * horizonDays, 0, 1)

  // Calculate prediction interval based on residual variance
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const residuals = values.map((v, i) => {
    const x = (timestamps[i].getTime() - timestamps[0].getTime()) / (1000 * 60 * 60 * 24)
    return v - (mean + slope * x)
  })

  const residualVariance = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
  const residualStdDev = Math.sqrt(residualVariance)

  // Widen interval for forecast horizon
  const horizonMultiplier = Math.sqrt(1 + horizonDays / values.length)
  const predictionInterval = 1.96 * residualStdDev * horizonMultiplier

  return {
    predictedRisk30Days,
    lowerBound: clamp(predictedRisk30Days - predictionInterval, 0, 1),
    upperBound: clamp(predictedRisk30Days + predictionInterval, 0, 1),
    confidence: clamp(rSquared * 0.7 + 0.2, 0.1, 0.9),
    method: 'linear',
  }
}

function exponentialSmoothingForecast(
  values: number[],
  horizonDays: number
): RiskForecast {
  // Simple exponential smoothing with alpha = 0.3
  const alpha = 0.3
  let smoothed = values[0]

  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed
  }

  // Forecast is the last smoothed value (flat projection)
  const predictedRisk30Days = clamp(smoothed, 0, 1)

  // Calculate prediction interval based on smoothed variance
  const variance = values.reduce((sum, v) => sum + Math.pow(v - smoothed, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return {
    predictedRisk30Days,
    lowerBound: clamp(predictedRisk30Days - 1.96 * stdDev, 0, 1),
    upperBound: clamp(predictedRisk30Days + 1.96 * stdDev, 0, 1),
    confidence: clamp(0.4 - calculateVolatility(values) * 0.3, 0.1, 0.6),
    method: 'exponential_smoothing',
  }
}

function arimaApproxForecast(
  values: number[],
  timestamps: Date[],
  horizonDays: number
): RiskForecast {
  // ARIMA(1,0,1) approximation for stationary series
  // This is a simplified version without proper parameter estimation

  // Differencing for stationarity check
  const diff = values.slice(1).map((v, i) => v - values[i])
  const diffMean = diff.reduce((a, b) => a + b, 0) / diff.length
  const isStationary = Math.abs(diffMean) < 0.01

  // Autoregressive coefficient estimation (lag-1)
  const valuesMean = values.reduce((a, b) => a + b, 0) / values.length
  let autocorr = 0
  let variance = 0

  for (let i = 1; i < values.length; i++) {
    autocorr += (values[i] - valuesMean) * (values[i - 1] - valuesMean)
    variance += Math.pow(values[i] - valuesMean, 2)
  }

  const ar1 = variance > 0 ? autocorr / variance : 0.5

  // Simple AR(1) forecast
  const lastValue = values[values.length - 1]
  const predictedRisk30Days = clamp(valuesMean + ar1 * (lastValue - valuesMean), 0, 1)

  // Prediction interval based on AR(1) variance
  const residualVariance = values.reduce((sum, v) => {
    const predicted = valuesMean + ar1 * (v - valuesMean)
    return sum + Math.pow(v - predicted, 2)
  }, 0) / values.length

  const forecastVariance = residualVariance * (1 + horizonDays * 0.1) // Simplified variance growth
  const predictionInterval = 1.96 * Math.sqrt(forecastVariance)

  return {
    predictedRisk30Days,
    lowerBound: clamp(predictedRisk30Days - predictionInterval, 0, 1),
    upperBound: clamp(predictedRisk30Days + predictionInterval, 0, 1),
    confidence: clamp(0.5 + (isStationary ? 0.2 : 0) + (values.length / 30) * 0.2, 0.2, 0.85),
    method: 'arima_approx',
  }
}

// ============================================================
// TRAJECTORY CLASSIFICATION
// ============================================================

export function classifyTrajectory(
  snapshots: RiskSnapshot[],
  config: TrajectoryConfig = DEFAULT_TRAJECTORY_CONFIG
): TrajectoryAnalysis {
  if (snapshots.length < config.minSnapshotsForTrend) {
    return {
      trajectory: 'stable',
      confidence: 0.1,
      slope: 0,
      volatility: 0,
      trendStrength: 0,
      forecast: {
        predictedRisk30Days: snapshots.length > 0 ? snapshots[snapshots.length - 1].compositeRisk : 0.5,
        lowerBound: 0.1,
        upperBound: 0.9,
        confidence: 0.1,
        method: 'linear',
      },
      changePoints: [],
    }
  }

  const values = snapshots.map((s) => s.compositeRisk)
  const timestamps = snapshots.map((s) => s.timestamp)

  const { slope, rSquared, trend } = detectTrend(values, timestamps)
  const volatility = calculateVolatility(values)
  const changePoints = detectChangePoints(values, timestamps, config.volatilityThreshold)

  // Calculate trend strength (combination of slope magnitude and R-squared)
  const trendStrength = Math.abs(slope) * rSquared * 100

  // Forecast
  const forecast = forecastRisk(values, timestamps, config.forecastHorizonDays)

  // Determine trajectory classification
  let trajectory: RiskTrajectory
  let confidence: number

  if (volatility > config.volatilityThreshold) {
    // High volatility overrides trend
    trajectory = 'volatile'
    confidence = clamp(0.3 + volatility * 0.5, 0.3, 0.7)
  } else if (Math.abs(slope) < config.trendThreshold) {
    // No significant trend
    trajectory = 'stable'
    confidence = clamp(rSquared * 0.6 + 0.3, 0.3, 0.8)
  } else if (slope < -config.trendThreshold) {
    // Risk decreasing = improving
    trajectory = 'improving'
    confidence = clamp(rSquared * 0.7 + 0.2, 0.2, 0.9)
  } else {
    // Risk increasing = declining
    trajectory = 'declining'
    confidence = clamp(rSquared * 0.7 + 0.2, 0.2, 0.9)
  }

  // Adjust confidence based on number of data points
  const dataQualityFactor = Math.min(snapshots.length / 30, 1)
  confidence = confidence * (0.5 + dataQualityFactor * 0.5)

  return {
    trajectory,
    confidence,
    slope,
    volatility,
    trendStrength,
    forecast,
    changePoints,
  }
}

// ============================================================
// MAIN ORCHESTRATION FUNCTIONS
// ============================================================

export async function computeAndSaveSnapshot(
  supabase: SupabaseClient<Database>,
  studentId: string,
  fusionConfig: RiskFusionConfig = DEFAULT_FUSION_CONFIG
): Promise<RiskSnapshot | null> {
  try {
    const risks = await computeCompositeRiskScore(supabase, studentId, fusionConfig)

    const snapshot: RiskSnapshot = {
      studentId,
      timestamp: new Date(),
      compositeRisk: risks.composite.value,
      clinicalReasoningRisk: risks.clinicalReasoning.value,
      engagementRisk: risks.engagement.value,
      wellbeingRisk: risks.wellbeing.value,
      academicRisk: risks.academic.value,
      confidence: risks.composite.confidence,
      metadata: {
        provenance: risks.composite.provenance,
        fusionWeights: {
          clinicalReasoning: fusionConfig.clinicalReasoningWeight,
          engagement: fusionConfig.engagementWeight,
          wellbeing: fusionConfig.wellbeingWeight,
          academic: fusionConfig.academicWeight,
        },
      },
    }

    const result = await saveRiskSnapshot(supabase, snapshot)

    if (result.success && result.id) {
      snapshot.id = result.id
      return snapshot
    }

    return null
  } catch (error) {
    console.error('Error computing risk snapshot:', error)
    return null
  }
}

export async function getStudentTrajectoryAnalysis(
  supabase: SupabaseClient<Database>,
  studentId: string,
  days: number = 90,
  config: TrajectoryConfig = DEFAULT_TRAJECTORY_CONFIG
): Promise<TrajectoryAnalysis> {
  const snapshots = await getRiskSnapshots(supabase, studentId, days)
  return classifyTrajectory(snapshots, config)
}

export async function getStudentRiskProfile(
  supabase: SupabaseClient<Database>,
  studentId: string,
  fusionConfig: RiskFusionConfig = DEFAULT_FUSION_CONFIG,
  trajectoryConfig: TrajectoryConfig = DEFAULT_TRAJECTORY_CONFIG
): Promise<StudentRiskProfile | null> {
  // Get or create current snapshot
  let latestSnapshot = await getLatestSnapshot(supabase, studentId)
  const snapshotAge = latestSnapshot
    ? (Date.now() - latestSnapshot.timestamp.getTime()) / (1000 * 60 * 60)
    : Infinity

  // Recompute if snapshot is older than 6 hours
  if (!latestSnapshot || snapshotAge > 6) {
    latestSnapshot = await computeAndSaveSnapshot(supabase, studentId, fusionConfig)
  }

  if (!latestSnapshot) {
    return null
  }

  // Get trajectory analysis
  const trajectoryAnalysis = await getStudentTrajectoryAnalysis(
    supabase,
    studentId,
    trajectoryConfig.maxSnapshotsHistory,
    trajectoryConfig
  )

  // Get total days of data
  const snapshots = await getRiskSnapshots(supabase, studentId, trajectoryConfig.maxSnapshotsHistory)
  const daysOfData = snapshots.length > 0
    ? Math.ceil((Date.now() - snapshots[0].timestamp.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Determine data quality
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
  if (snapshots.length >= 30 && daysOfData >= 30) {
    dataQuality = 'excellent'
  } else if (snapshots.length >= 14 && daysOfData >= 14) {
    dataQuality = 'good'
  } else if (snapshots.length >= 7 && daysOfData >= 7) {
    dataQuality = 'fair'
  } else {
    dataQuality = 'poor'
  }

  // Build risk scores
  const createRiskFromSnapshot = (value: number, confidence: number, dimension: string): RiskScore => {
    return createRiskScore(value, confidence, dimension, { spread: 0.15 })
  }

  const profile: StudentRiskProfile = {
    studentId,
    timestamp: latestSnapshot.timestamp,
    compositeRisk: createRiskFromSnapshot(latestSnapshot.compositeRisk, latestSnapshot.confidence, 'composite'),
    clinicalReasoningRisk: createRiskFromSnapshot(latestSnapshot.clinicalReasoningRisk, latestSnapshot.confidence * 0.9, 'clinical_reasoning'),
    engagementRisk: createRiskFromSnapshot(latestSnapshot.engagementRisk, latestSnapshot.confidence * 0.85, 'engagement'),
    wellbeingRisk: createRiskFromSnapshot(latestSnapshot.wellbeingRisk, latestSnapshot.confidence * 0.7, 'wellbeing'),
    academicRisk: createRiskFromSnapshot(latestSnapshot.academicRisk, latestSnapshot.confidence * 0.8, 'academic'),
    trajectory: trajectoryAnalysis.trajectory,
    trajectoryConfidence: trajectoryAnalysis.confidence,
    daysOfData,
    shapValues: new Map(), // Will be populated by SHAP explainer in Phase 4
    lastActivityAt: latestSnapshot.timestamp,
    dataQuality,
  }

  return profile
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
