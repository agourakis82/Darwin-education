// ============================================================
// INTERVENTION RECOMMENDATION ENGINE (EREM Phase 5)
// Case-based reasoning for intervention recommendations
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { StudentRiskProfile, RiskScore, createRiskScore } from './epistemicTypes'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type InterventionType =
  | 'peer_tutoring'
  | 'study_skills_coaching'
  | 'counseling_support'
  | 'curriculum_adjustment'
  | 'remedial_content'
  | 'practice_intensification'
  | 'wellbeing_check'
  | 'faculty_consultation'

export type InterventionPriority = 'low' | 'medium' | 'high' | 'urgent'

export type InterventionStatus = 'suggested' | 'in_progress' | 'completed' | 'cancelled'

export interface Intervention {
  id?: string
  studentId: string
  type: InterventionType
  priority: InterventionPriority
  status: InterventionStatus
  title: string
  description: string
  rationale: string
  expectedImpact: number
  confidence: number
  basedOnCases: string[]
  suggestedAt: Date
  startedAt?: Date
  completedAt?: Date
  outcome?: 'success' | 'partial' | 'no_effect' | 'negative'
  metadata?: Record<string, unknown>
}

export interface InterventionCase {
  id: string
  studentId: string
  riskProfileSnapshot: {
    compositeRisk: number
    clinicalReasoningRisk: number
    engagementRisk: number
    wellbeingRisk: number
    academicRisk: number
    trajectory: string
  }
  intervention: InterventionType
  outcome: 'success' | 'partial' | 'no_effect' | 'negative'
  improvementDelta: number
  timeToImprovement: number
  createdAt: Date
}

export interface CaseMatch {
  case: InterventionCase
  similarity: number
  matchingFactors: string[]
}

export interface InterventionRecommendation {
  intervention: Intervention
  basedOnMatches: CaseMatch[]
  expectedSuccessRate: number
  confidence: number
  reasoning: string
}

export interface InterventionConfig {
  minSimilarityThreshold: number
  minCasesForRecommendation: number
  maxRecommendations: number
  successThreshold: number
}

export const DEFAULT_INTERVENTION_CONFIG: InterventionConfig = {
  minSimilarityThreshold: 0.6,
  minCasesForRecommendation: 3,
  maxRecommendations: 5,
  successThreshold: 0.1, // 10% improvement
}

// ============================================================
// INTERVENTION TEMPLATES
// ============================================================

const INTERVENTION_TEMPLATES: Record<InterventionType, {
  title: string
  description: string
  applicableRisks: string[]
  typicalDuration: string
}> = {
  peer_tutoring: {
    title: 'Tutoria por Pares',
    description: 'Emparelhamento com estudante com desempenho superior para mentoria em áreas específicas de dificuldade.',
    applicableRisks: ['clinicalReasoningRisk', 'academicRisk'],
    typicalDuration: '4-6 semanas',
  },
  study_skills_coaching: {
    title: 'Coaching de Habilidades de Estudo',
    description: 'Sessões estruturadas para desenvolvimento de técnicas de estudo, gestão de tempo e preparação para provas.',
    applicableRisks: ['engagementRisk', 'academicRisk'],
    typicalDuration: '3-4 semanas',
  },
  counseling_support: {
    title: 'Apoio Psicopedagógico',
    description: 'Acompanhamento com profissional de apoio para questões de bem-estar e ansiedade relacionada aos estudos.',
    applicableRisks: ['wellbeingRisk', 'engagementRisk'],
    typicalDuration: '6-8 semanas',
  },
  curriculum_adjustment: {
    title: 'Ajuste Curricular Personalizado',
    description: 'Modificação do plano de estudos com foco intensivo em áreas de lacuna identificada.',
    applicableRisks: ['clinicalReasoningRisk', 'academicRisk'],
    typicalDuration: '4-8 semanas',
  },
  remedial_content: {
    title: 'Conteúdo Remediativo Direcionado',
    description: 'Módulos de revisão focados em conceitos fundamentais identificados como lacuna.',
    applicableRisks: ['clinicalReasoningRisk', 'academicRisk'],
    typicalDuration: '2-4 semanas',
  },
  practice_intensification: {
    title: 'Intensificação de Prática',
    description: 'Aumento controlado do volume de questões com feedback adaptativo.',
    applicableRisks: ['academicRisk', 'engagementRisk'],
    typicalDuration: '2-3 semanas',
  },
  wellbeing_check: {
    title: 'Avaliação de Bem-estar',
    description: 'Verificação proativa de indicadores de burnout, ansiedade ou outros fatores de risco.',
    applicableRisks: ['wellbeingRisk'],
    typicalDuration: '1-2 semanas',
  },
  faculty_consultation: {
    title: 'Consulta com Docente',
    description: 'Reunião individual com professor da área de maior dificuldade para orientação personalizada.',
    applicableRisks: ['clinicalReasoningRisk', 'academicRisk'],
    typicalDuration: '1-2 sessões',
  },
}

// ============================================================
// SIMILARITY COMPUTATION
// ============================================================

export function computeCaseSimilarity(
  profile: StudentRiskProfile,
  caseData: InterventionCase
): { similarity: number; matchingFactors: string[] } {
  const matchingFactors: string[] = []
  let totalSimilarity = 0
  let factorCount = 0

  // Compare risk dimensions
  const dimensions = [
    { name: 'compositeRisk', profile: profile.compositeRisk.value, case: caseData.riskProfileSnapshot.compositeRisk },
    { name: 'clinicalReasoningRisk', profile: profile.clinicalReasoningRisk.value, case: caseData.riskProfileSnapshot.clinicalReasoningRisk },
    { name: 'engagementRisk', profile: profile.engagementRisk.value, case: caseData.riskProfileSnapshot.engagementRisk },
    { name: 'wellbeingRisk', profile: profile.wellbeingRisk.value, case: caseData.riskProfileSnapshot.wellbeingRisk },
    { name: 'academicRisk', profile: profile.academicRisk.value, case: caseData.riskProfileSnapshot.academicRisk },
  ]

  dimensions.forEach((dim) => {
    const distance = Math.abs(dim.profile - dim.case)
    const similarity = 1 - distance // Higher similarity for lower distance
    totalSimilarity += similarity
    factorCount++

    if (similarity > 0.7) {
      matchingFactors.push(`Similar ${dim.name} level`)
    }
  })

  // Compare trajectory
  if (profile.trajectory === caseData.riskProfileSnapshot.trajectory) {
    totalSimilarity += 0.8
    factorCount++
    matchingFactors.push(`Same trajectory pattern: ${profile.trajectory}`)
  } else {
    totalSimilarity += 0.3
    factorCount++
  }

  const avgSimilarity = totalSimilarity / factorCount

  return { similarity: avgSimilarity, matchingFactors }
}

// ============================================================
// CASE RETRIEVAL
// ============================================================

export async function getSimilarCases(
  supabase: ReturnType<typeof createClient>,
  profile: StudentRiskProfile,
  config: InterventionConfig = DEFAULT_INTERVENTION_CONFIG
): Promise<CaseMatch[]> {
  // Get historical intervention cases
  const { data: cases, error } = await supabase
    .from('intervention_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error || !cases) {
    console.error('Error fetching intervention cases:', error)
    return []
  }

  // Compute similarity for each case
  const matches: CaseMatch[] = cases.map((caseRow) => {
    const caseData: InterventionCase = {
      id: caseRow.id,
      studentId: caseRow.student_id,
      riskProfileSnapshot: caseRow.risk_profile_snapshot,
      intervention: caseRow.intervention_type,
      outcome: caseRow.outcome,
      improvementDelta: caseRow.improvement_delta,
      timeToImprovement: caseRow.time_to_improvement,
      createdAt: new Date(caseRow.created_at),
    }

    const { similarity, matchingFactors } = computeCaseSimilarity(profile, caseData)

    return { case: caseData, similarity, matchingFactors }
  })

  // Filter by threshold and sort
  return matches
    .filter((m) => m.similarity >= config.minSimilarityThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20)
}

// ============================================================
// INTERVENTION RECOMMENDATION
// ============================================================

export function computeInterventionSuccessRate(
  matches: CaseMatch[],
  interventionType: InterventionType,
  config: InterventionConfig = DEFAULT_INTERVENTION_CONFIG
): { rate: number; confidence: number; sampleSize: number } {
  const relevantCases = matches
    .filter((m) => m.case.intervention === interventionType)
    .map((m) => ({
      outcome: m.case.outcome,
      improvement: m.case.improvementDelta,
      similarity: m.similarity,
    }))

  if (relevantCases.length < config.minCasesForRecommendation) {
    return { rate: 0.5, confidence: 0.2, sampleSize: relevantCases.length }
  }

  // Weight outcomes by similarity
  const weightedSuccess = relevantCases.reduce((sum, c) => {
    const successValue = c.outcome === 'success' ? 1 : c.outcome === 'partial' ? 0.5 : 0
    return sum + successValue * c.similarity
  }, 0)

  const totalWeight = relevantCases.reduce((sum, c) => sum + c.similarity, 0)

  const rate = totalWeight > 0 ? weightedSuccess / totalWeight : 0.5
  const confidence = clamp(relevantCases.length / 10 * 0.5 + 0.3, 0.3, 0.85)

  return { rate, confidence, sampleSize: relevantCases.length }
}

export function determinePriority(
  profile: StudentRiskProfile,
  successRate: number
): InterventionPriority {
  const risk = profile.compositeRisk.value

  if (risk >= 0.8 || (risk >= 0.7 && profile.trajectory === 'declining')) {
    return 'urgent'
  } else if (risk >= 0.6 || (risk >= 0.5 && profile.trajectory === 'declining')) {
    return 'high'
  } else if (risk >= 0.4 || successRate > 0.7) {
    return 'medium'
  }
  return 'low'
}

export async function generateInterventionRecommendations(
  supabase: ReturnType<typeof createClient>,
  profile: StudentRiskProfile,
  config: InterventionConfig = DEFAULT_INTERVENTION_CONFIG
): Promise<InterventionRecommendation[]> {
  // Get similar cases
  const matches = await getSimilarCases(supabase, profile, config)

  // Identify which intervention types are applicable based on risk dimensions
  const applicableTypes = new Set<InterventionType>()

  const riskDimensions: Array<{ risk: RiskScore; name: string }> = [
    { risk: profile.clinicalReasoningRisk, name: 'clinicalReasoningRisk' },
    { risk: profile.engagementRisk, name: 'engagementRisk' },
    { risk: profile.wellbeingRisk, name: 'wellbeingRisk' },
    { risk: profile.academicRisk, name: 'academicRisk' },
  ]

  // Find highest risk dimensions
  const sortedRisks = riskDimensions.sort((a, b) => b.risk.value - a.risk.value)

  sortedRisks.forEach((dim, index) => {
    if (dim.risk.value > 0.4 || index < 2) {
      // High risk or top 2 dimensions
      Object.entries(INTERVENTION_TEMPLATES).forEach(([type, template]) => {
        if (template.applicableRisks.includes(dim.name)) {
          applicableTypes.add(type as InterventionType)
        }
      })
    }
  })

  // Compute recommendations for each applicable intervention type
  const recommendations: InterventionRecommendation[] = []

  for (const type of applicableTypes) {
    const { rate, confidence, sampleSize } = computeInterventionSuccessRate(matches, type, config)

    if (sampleSize >= config.minCasesForRecommendation || rate > 0.5) {
      const template = INTERVENTION_TEMPLATES[type]
      const priority = determinePriority(profile, rate)

      const basedOnMatches = matches
        .filter((m) => m.case.intervention === type)
        .slice(0, 5)

      const intervention: Intervention = {
        studentId: profile.studentId,
        type,
        priority,
        status: 'suggested',
        title: template.title,
        description: template.description,
        rationale: generateRationale(profile, type, basedOnMatches),
        expectedImpact: rate,
        confidence,
        basedOnCases: basedOnMatches.map((m) => m.case.id),
        suggestedAt: new Date(),
      }

      recommendations.push({
        intervention,
        basedOnMatches,
        expectedSuccessRate: rate,
        confidence,
        reasoning: generateReasoningText(type, rate, confidence, basedOnMatches),
      })
    }
  }

  // Sort by expected impact and priority
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.intervention.priority] - priorityOrder[a.intervention.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.expectedSuccessRate - a.expectedSuccessRate
    })
    .slice(0, config.maxRecommendations)
}

function generateRationale(
  profile: StudentRiskProfile,
  type: InterventionType,
  matches: CaseMatch[]
): string {
  const template = INTERVENTION_TEMPLATES[type]
  const riskFactors: string[] = []

  if (profile.clinicalReasoningRisk.value > 0.5) {
    riskFactors.push('lacunas de raciocínio clínico')
  }
  if (profile.engagementRisk.value > 0.5) {
    riskFactors.push('sinais de desengajamento')
  }
  if (profile.wellbeingRisk.value > 0.5) {
    riskFactors.push('indicadores de bem-estar preocupantes')
  }
  if (profile.academicRisk.value > 0.5) {
    riskFactors.push('desempenho acadêmico abaixo do esperado')
  }

  const caseText = matches.length > 0
    ? ` Baseado em ${matches.length} casos similares.`
    : ''

  return `Recomendado devido a ${riskFactors.join(', ')}.${caseText}`
}

function generateReasoningText(
  type: InterventionType,
  successRate: number,
  confidence: number,
  matches: CaseMatch[]
): string {
  const template = INTERVENTION_TEMPLATES[type]
  const successPercent = Math.round(successRate * 100)
  const confidencePercent = Math.round(confidence * 100)

  let text = `${template.title} apresenta taxa de sucesso de ${successPercent}% ` +
    `(confiança: ${confidencePercent}%) em casos similares. `

  if (matches.length > 0) {
    const topMatch = matches[0]
    text += `Caso mais similar (${Math.round(topMatch.similarity * 100)}% de similaridade) ` +
      `teve resultado "${topMatch.case.outcome}" com melhoria de ` +
      `${Math.round(topMatch.case.improvementDelta * 100)}%.`
  }

  return text
}

// ============================================================
// INTERVENTION PERSISTENCE
// ============================================================

export async function saveIntervention(
  supabase: ReturnType<typeof createClient>,
  intervention: Intervention
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('intervention_recommendations')
    .insert({
      student_id: intervention.studentId,
      intervention_type: intervention.type,
      priority: intervention.priority,
      status: intervention.status,
      title: intervention.title,
      description: intervention.description,
      rationale: intervention.rationale,
      expected_impact: intervention.expectedImpact,
      confidence: intervention.confidence,
      based_on_cases: intervention.basedOnCases,
      metadata: intervention.metadata || {},
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving intervention:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}

export async function updateInterventionStatus(
  supabase: ReturnType<typeof createClient>,
  interventionId: string,
  status: InterventionStatus,
  outcome?: 'success' | 'partial' | 'no_effect' | 'negative'
): Promise<boolean> {
  const updateData: Record<string, unknown> = { status }

  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    if (outcome) {
      updateData.outcome = outcome
    }
  }

  const { error } = await supabase
    .from('intervention_recommendations')
    .update(updateData)
    .eq('id', interventionId)

  return !error
}

export async function recordInterventionCase(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  riskProfileSnapshot: InterventionCase['riskProfileSnapshot'],
  interventionType: InterventionType,
  outcome: 'success' | 'partial' | 'no_effect' | 'negative',
  improvementDelta: number,
  timeToImprovement: number
): Promise<void> {
  await supabase.from('intervention_cases').insert({
    student_id: studentId,
    risk_profile_snapshot: riskProfileSnapshot,
    intervention_type: interventionType,
    outcome,
    improvement_delta: improvementDelta,
    time_to_improvement: timeToImprovement,
  })
}

// ============================================================
// BATCH PROCESSING
// ============================================================

export async function processStudentInterventions(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  config: InterventionConfig = DEFAULT_INTERVENTION_CONFIG
): Promise<InterventionRecommendation[]> {
  // Get fresh risk profile
  const { getStudentRiskProfile } = await import('./trajectoryAnalyzer')
  const profile = await getStudentRiskProfile(supabase, studentId)

  if (!profile) {
    console.warn(`No risk profile available for student ${studentId}`)
    return []
  }

  // Generate recommendations
  const recommendations = await generateInterventionRecommendations(supabase, profile, config)

  // Save recommendations
  for (const rec of recommendations) {
    await saveIntervention(supabase, rec.intervention)
  }

  return recommendations
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
