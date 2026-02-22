// ============================================================
// EPISTEMIC RISK TYPES SYSTEM (EREM)
// Uncertainty-aware type system for medical education risk prediction
// ============================================================

export type DistributionType = 'gaussian' | 'beta' | 'empirical' | 'uniform'

export interface ProvenanceEntry {
  source: string
  timestamp: Date
  confidence: number
  metadata?: Record<string, unknown>
}

export interface EpistemicValue<T> {
  value: T
  confidence: number
  provenance: ProvenanceEntry[]
  timestamp: Date
  decayRate: number
}

export interface RiskScore extends EpistemicValue<number> {
  distribution: DistributionType
  lowerBound: number
  upperBound: number
  spread: number
}

export type RiskTrajectory = 'improving' | 'stable' | 'declining' | 'volatile'

export interface StudentRiskProfile {
  studentId: string
  timestamp: Date
  compositeRisk: RiskScore
  clinicalReasoningRisk: RiskScore
  engagementRisk: RiskScore
  wellbeingRisk: RiskScore
  academicRisk: RiskScore
  trajectory: RiskTrajectory
  trajectoryConfidence: number
  daysOfData: number
  shapValues: Map<string, number>
  lastActivityAt: Date
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface EpistemicConfig {
  defaultDecayRate: number
  confidenceThreshold: number
  maxProvenanceDepth: number
}

export const DEFAULT_EPISTEMIC_CONFIG: EpistemicConfig = {
  defaultDecayRate: 0.05,
  confidenceThreshold: 0.7,
  maxProvenanceDepth: 10,
}

export function createEpistemicValue<T>(
  value: T,
  confidence: number,
  source: string,
  options?: {
    decayRate?: number
    metadata?: Record<string, unknown>
    timestamp?: Date
  }
): EpistemicValue<T> {
  const timestamp = options?.timestamp ?? new Date()
  return {
    value,
    confidence: clamp(confidence, 0, 1),
    provenance: [{ source, timestamp, confidence, metadata: options?.metadata }],
    timestamp,
    decayRate: options?.decayRate ?? DEFAULT_EPISTEMIC_CONFIG.defaultDecayRate,
  }
}

export function createRiskScore(
  value: number,
  confidence: number,
  source: string,
  options?: {
    distribution?: DistributionType
    spread?: number
    decayRate?: number
    metadata?: Record<string, unknown>
  }
): RiskScore {
  const distribution = options?.distribution ?? 'gaussian'
  const spread = options?.spread ?? (1 - confidence) * 0.5
  const { lowerBound, upperBound } = calculateConfidenceBounds(value, spread, distribution)
  const base = createEpistemicValue(value, confidence, source, options)
  return { ...base, distribution, lowerBound, upperBound, spread }
}

function calculateConfidenceBounds(
  value: number,
  spread: number,
  distribution: DistributionType
): { lowerBound: number; upperBound: number } {
  switch (distribution) {
    case 'gaussian':
      return {
        lowerBound: clamp(value - 1.96 * spread, 0, 1),
        upperBound: clamp(value + 1.96 * spread, 0, 1),
      }
    case 'beta':
    case 'uniform':
    case 'empirical':
      return {
        lowerBound: clamp(value - spread, 0, 1),
        upperBound: clamp(value + spread, 0, 1),
      }
    default:
      return { lowerBound: 0, upperBound: 1 }
  }
}

export function applyDecay<T>(
  epistemic: EpistemicValue<T>,
  referenceTime?: Date
): EpistemicValue<T> {
  const now = referenceTime ?? new Date()
  const daysElapsed = (now.getTime() - epistemic.timestamp.getTime()) / (1000 * 60 * 60 * 24)
  if (daysElapsed <= 0 || epistemic.decayRate <= 0) return epistemic
  const decayFactor = Math.exp(-epistemic.decayRate * daysElapsed)
  return { ...epistemic, confidence: clamp(epistemic.confidence * decayFactor, 0, 1) }
}

export function combineEpistemicValues<T extends number>(
  a: EpistemicValue<T>,
  b: EpistemicValue<T>,
  resultSource: string
): EpistemicValue<T> {
  const decayedA = applyDecay(a)
  const decayedB = applyDecay(b)
  const varA = Math.pow(1 - decayedA.confidence, 2) || 0.0001
  const varB = Math.pow(1 - decayedB.confidence, 2) || 0.0001
  const weightA = 1 / varA
  const weightB = 1 / varB
  const totalWeight = weightA + weightB
  const combinedValue = ((decayedA.value as number) * weightA + (decayedB.value as number) * weightB) / totalWeight
  const combinedConfidence = Math.max(decayedA.confidence, decayedB.confidence) * (1 - Math.abs(decayedA.confidence - decayedB.confidence) / 2)
  const mergedProvenance = [...decayedA.provenance, ...decayedB.provenance].slice(-DEFAULT_EPISTEMIC_CONFIG.maxProvenanceDepth)
  return {
    value: combinedValue as T,
    confidence: clamp(combinedConfidence, 0, 1),
    provenance: mergedProvenance,
    timestamp: new Date(),
    decayRate: Math.min(decayedA.decayRate, decayedB.decayRate),
  }
}

export function fuseRiskScores(
  scores: RiskScore[],
  weights?: number[],
  resultSource: string = 'risk_fusion'
): RiskScore {
  if (scores.length === 0) throw new Error('Cannot fuse empty array')
  if (scores.length === 1) return applyDecay(scores[0]) as RiskScore
  const effectiveWeights = weights ?? scores.map(s => s.confidence)
  const totalWeight = effectiveWeights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) throw new Error('Total weight cannot be zero')
  const weightedSum = scores.reduce((sum, score, i) => sum + (applyDecay(score).value * effectiveWeights[i]), 0)
  const fusedValue = weightedSum / totalWeight
  const confidenceSum = scores.reduce((sum, score, i) => sum + (applyDecay(score).confidence * effectiveWeights[i]), 0)
  const fusedConfidence = confidenceSum / totalWeight
  const spreadSum = scores.reduce((sum, score, i) => sum + (score.spread * effectiveWeights[i]), 0)
  const fusedSpread = spreadSum / totalWeight
  const mergedProvenance = scores.flatMap(s => s.provenance).slice(-DEFAULT_EPISTEMIC_CONFIG.maxProvenanceDepth)
  const { lowerBound, upperBound } = calculateConfidenceBounds(fusedValue, fusedSpread, 'gaussian')
  return {
    value: clamp(fusedValue, 0, 1),
    confidence: clamp(fusedConfidence, 0, 1),
    provenance: mergedProvenance,
    timestamp: new Date(),
    decayRate: Math.min(...scores.map(s => s.decayRate)),
    distribution: 'gaussian',
    lowerBound,
    upperBound,
    spread: fusedSpread,
  }
}

export function isReliable<T>(epistemic: EpistemicValue<T>, threshold?: number): boolean {
  return applyDecay(epistemic).confidence >= (threshold ?? DEFAULT_EPISTEMIC_CONFIG.confidenceThreshold)
}

export function formatRiskScore(score: RiskScore): string {
  const decayed = applyDecay(score)
  return `${Math.round(decayed.value * 100)}% risk (CI: ${Math.round(decayed.lowerBound * 100)}-${Math.round(decayed.upperBound * 100)}%, confidence: ${Math.round(decayed.confidence * 100)}%)`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function createUnknownRisk(source: string): RiskScore {
  return createRiskScore(0.5, 0, source, { distribution: 'uniform', spread: 0.5 })
}
