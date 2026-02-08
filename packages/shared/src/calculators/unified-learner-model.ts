/**
 * Unified Learner Model Calculator
 * ==================================
 *
 * Cross-feature aggregation that combines all psychometric signals into
 * a single learner profile. Produces composite scores, pass predictions,
 * and prioritized study recommendations.
 *
 * Inputs: IRT theta, MIRT 5D profile, FCR calibration, BKT mastery,
 *         HLR retention, engagement metrics.
 *
 * Competency per area = 0.30*MIRT + 0.25*BKT + 0.20*FCR + 0.15*IRT + 0.10*HLR
 */

import type { ENAMEDArea } from '../types/education';
import type { MIRTAbilityProfile } from '../types/mirt';
import type { MasteryHeatmapData } from '../types/bkt';
import type {
  UnifiedModelInputs,
  UnifiedLearnerProfile,
  AreaCompetency,
  StrengthWeakness,
  StudyRecommendation,
  RecommendationType,
  DataCompleteness,
  LearnerTrajectoryPoint,
  LearnerTrajectory,
  CompetencySource,
  COMPETENCY_WEIGHTS,
} from '../types/unified-learner';
import { MIRT_DIMENSIONS, MIRT_DIMENSION_LABELS_PT } from '../types/mirt';

// Local reference to weights
const WEIGHTS = {
  mirt: 0.30,
  bkt: 0.25,
  fcr: 0.20,
  irt: 0.15,
  hlr: 0.10,
};

const ALL_AREAS: ENAMEDArea[] = [
  'clinica_medica', 'cirurgia', 'ginecologia_obstetricia',
  'pediatria', 'saude_coletiva',
];

const AREA_LABELS_PT: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clinica Medica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetricia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saude Coletiva',
};

// ============================================
// Normalization Helpers
// ============================================

/** Normalize IRT theta from [-4,4] to [0,1] */
function normalizeTheta(theta: number): number {
  return Math.max(0, Math.min(1, (theta + 4) / 8));
}

/** Normalize FCR calibration from [0,100] to [0,1] */
function normalizeCalibration(calibration: number): number {
  return Math.max(0, Math.min(1, calibration / 100));
}

// ============================================
// Core Profile Builder
// ============================================

/**
 * Build a unified learner profile from all available signals.
 */
export function buildUnifiedProfile(
  inputs: UnifiedModelInputs
): UnifiedLearnerProfile {
  const completeness = assessDataCompleteness(inputs);

  // Compute per-area competency
  const areaCompetency: Record<ENAMEDArea, AreaCompetency> = {} as Record<ENAMEDArea, AreaCompetency>;

  for (const area of ALL_AREAS) {
    areaCompetency[area] = computeAreaCompetency(area, inputs);
  }

  // Overall competency (weighted average across areas)
  const areaScores = ALL_AREAS.map((a) => areaCompetency[a].composite);
  const overallCompetency = areaScores.length > 0
    ? areaScores.reduce((s, v) => s + v, 0) / areaScores.length
    : 0;

  // Pass probability
  const passProb = predictUnifiedPassProbability(inputs, overallCompetency);

  // Strengths and weaknesses
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(areaCompetency, inputs);

  // Recommendations
  const recommendations = generateRecommendations(areaCompetency, inputs, weaknesses);

  return {
    areaCompetency,
    overallCompetency,
    passProbability: passProb,
    passCI: [
      Math.max(0, passProb - 0.10),
      Math.min(1, passProb + 0.10),
    ],
    strengths,
    weaknesses,
    recommendations,
    dataCompleteness: completeness,
    snapshotAt: new Date(),
  };
}

// ============================================
// Per-Area Competency
// ============================================

/**
 * Compute competency for a single area.
 * Weighted: 0.30*MIRT + 0.25*BKT + 0.20*FCR + 0.15*IRT + 0.10*HLR
 */
export function computeAreaCompetency(
  area: ENAMEDArea,
  inputs: UnifiedModelInputs
): AreaCompetency {
  const signals = {
    mirt: null as number | null,
    bkt: null as number | null,
    fcr: null as number | null,
    irt: null as number | null,
    hlr: null as number | null,
  };

  // MIRT signal (area-specific theta)
  if (inputs.mirtProfile) {
    signals.mirt = normalizeTheta(inputs.mirtProfile.theta[area] || 0);
  }

  // BKT signal (area mastery)
  if (inputs.bktMastery) {
    signals.bkt = inputs.bktMastery.areaMastery[area] ?? null;
  }

  // FCR signal (global calibration, normalized)
  if (inputs.fcrCalibrationScore !== null) {
    signals.fcr = normalizeCalibration(inputs.fcrCalibrationScore);
  }

  // IRT signal (global theta, same for all areas in unidimensional model)
  if (inputs.irtTheta !== null) {
    signals.irt = normalizeTheta(inputs.irtTheta);
  }

  // HLR signal (global retention)
  if (inputs.hlrAverageRetention !== null) {
    signals.hlr = inputs.hlrAverageRetention;
  }

  // Weighted composite (only from available signals)
  let composite = 0;
  let totalWeight = 0;

  for (const [source, weight] of Object.entries(WEIGHTS) as [CompetencySource, number][]) {
    const val = signals[source];
    if (val !== null) {
      composite += weight * val;
      totalWeight += weight;
    }
  }

  // Re-normalize to [0,1] accounting for missing signals
  composite = totalWeight > 0 ? composite / totalWeight : 0;

  // Confidence based on data availability
  const availableCount = Object.values(signals).filter((v) => v !== null).length;
  const confidence = availableCount / 5;

  return {
    area,
    composite,
    signals,
    confidence,
    trend: 'insufficient_data', // Would need historical data
  };
}

// ============================================
// Pass Probability
// ============================================

/**
 * Predict pass probability using logistic regression on available signals.
 * P(pass) = sigmoid(w0 + w1*theta + w2*mirt_min + w3*calibration + w4*mastery + w5*retention)
 */
export function predictUnifiedPassProbability(
  inputs: UnifiedModelInputs,
  overallCompetency: number
): number {
  // Logistic regression weights (hand-tuned, would be trained on real data)
  const intercept = -2.0;
  let logit = intercept;

  if (inputs.irtTheta !== null) {
    logit += 1.5 * inputs.irtTheta; // Strong predictor
  }

  if (inputs.mirtProfile) {
    const minTheta = Math.min(...ALL_AREAS.map((a) => inputs.mirtProfile!.theta[a] || 0));
    logit += 0.8 * minTheta; // Weakest area matters most
  }

  if (inputs.fcrCalibrationScore !== null) {
    logit += 0.5 * normalizeCalibration(inputs.fcrCalibrationScore);
  }

  if (inputs.bktMastery) {
    logit += 1.0 * inputs.bktMastery.overallMastery;
  }

  if (inputs.hlrAverageRetention !== null) {
    logit += 0.3 * inputs.hlrAverageRetention;
  }

  // Fallback: use overall competency
  logit += 1.0 * overallCompetency;

  // Sigmoid
  const p = 1 / (1 + Math.exp(-logit));
  return Math.max(0, Math.min(1, p));
}

// ============================================
// Strength/Weakness Analysis
// ============================================

function analyzeStrengthsWeaknesses(
  areaCompetency: Record<ENAMEDArea, AreaCompetency>,
  inputs: UnifiedModelInputs
): { strengths: StrengthWeakness[]; weaknesses: StrengthWeakness[] } {
  const items: { area: ENAMEDArea; score: number; source: CompetencySource; desc: string }[] = [];

  for (const area of ALL_AREAS) {
    const ac = areaCompetency[area];
    const label = AREA_LABELS_PT[area];

    for (const [source, val] of Object.entries(ac.signals) as [CompetencySource, number | null][]) {
      if (val === null) continue;

      let desc = '';
      switch (source) {
        case 'mirt': desc = `Habilidade em ${label} (MIRT)`; break;
        case 'bkt': desc = `Dominio de conteudo em ${label}`; break;
        case 'fcr': desc = `Calibracao metacognitiva`; break;
        case 'irt': desc = `Proficiencia geral (IRT)`; break;
        case 'hlr': desc = `Retencao de conhecimento`; break;
      }

      items.push({ area, score: val, source, desc });
    }
  }

  // Sort by score
  items.sort((a, b) => b.score - a.score);

  const strengths: StrengthWeakness[] = items.slice(0, 3).map((item) => ({
    area: item.area,
    description: item.desc,
    source: item.source,
    score: item.score,
    severity: 1 - item.score,
  }));

  const weaknesses: StrengthWeakness[] = items.slice(-3).reverse().map((item) => ({
    area: item.area,
    description: item.desc,
    source: item.source,
    score: item.score,
    severity: 1 - item.score,
  }));

  return { strengths, weaknesses };
}

// ============================================
// Recommendations
// ============================================

/**
 * Generate prioritized study recommendations.
 */
export function generateRecommendations(
  areaCompetency: Record<ENAMEDArea, AreaCompetency>,
  inputs: UnifiedModelInputs,
  weaknesses: StrengthWeakness[]
): StudyRecommendation[] {
  const recs: StudyRecommendation[] = [];

  // 1. Fill lacunas from weakest areas
  for (const weakness of weaknesses) {
    if (weakness.score < 0.5) {
      recs.push({
        priority: 0,
        type: 'fill_lacuna',
        area: weakness.area,
        descriptionPt: `Reforcar ${AREA_LABELS_PT[weakness.area]}`,
        reasonPt: `${weakness.description} esta abaixo do esperado (${(weakness.score * 100).toFixed(0)}%)`,
        priorityScore: (1 - weakness.score) * 0.9,
        action: {
          feature: 'cat',
          href: '/cat',
          labelPt: 'Teste Adaptativo',
        },
      });
    }
  }

  // 2. Calibration improvement
  if (inputs.fcrCalibrationScore !== null && inputs.fcrCalibrationScore < 70) {
    recs.push({
      priority: 0,
      type: 'calibrate',
      area: 'clinica_medica', // Default
      descriptionPt: 'Melhorar calibracao metacognitiva',
      reasonPt: `Score de calibracao: ${inputs.fcrCalibrationScore.toFixed(0)}%. Risco de ilusao de saber.`,
      priorityScore: (100 - inputs.fcrCalibrationScore) / 100 * 0.85,
      action: {
        feature: 'fcr',
        href: '/fcr',
        labelPt: 'Raciocinio Clinico Fractal',
      },
    });
  }

  // 3. Overconfidence alert
  if (inputs.fcrOverconfidenceIndex !== null && inputs.fcrOverconfidenceIndex > 0.3) {
    recs.push({
      priority: 0,
      type: 'calibrate',
      area: 'clinica_medica',
      descriptionPt: 'Reduzir excesso de confianca',
      reasonPt: `Indice de excesso de confianca: ${(inputs.fcrOverconfidenceIndex * 100).toFixed(0)}%`,
      priorityScore: inputs.fcrOverconfidenceIndex * 0.80,
      action: {
        feature: 'fcr',
        href: '/fcr',
        labelPt: 'Casos com Calibracao',
      },
    });
  }

  // 4. Forgetting risk
  if (inputs.hlrAverageRetention !== null && inputs.hlrAverageRetention < 0.7) {
    recs.push({
      priority: 0,
      type: 'reduce_forgetting',
      area: 'clinica_medica',
      descriptionPt: 'Revisar conteudos em risco de esquecimento',
      reasonPt: `Retencao media: ${(inputs.hlrAverageRetention * 100).toFixed(0)}%. Revisar flashcards pendentes.`,
      priorityScore: (1 - inputs.hlrAverageRetention) * 0.75,
      action: {
        feature: 'flashcard',
        href: '/flashcards',
        labelPt: 'Revisar Flashcards',
      },
    });
  }

  // 5. Near-mastery areas (push to mastery)
  for (const area of ALL_AREAS) {
    const ac = areaCompetency[area];
    if (ac.composite >= 0.7 && ac.composite < 0.9) {
      recs.push({
        priority: 0,
        type: 'deepen_mastery',
        area,
        descriptionPt: `Aprofundar ${AREA_LABELS_PT[area]}`,
        reasonPt: `Proximo de dominio (${(ac.composite * 100).toFixed(0)}%). Mais pratica pode consolidar.`,
        priorityScore: ac.composite * 0.5,
        action: {
          feature: 'exam',
          href: '/simulado',
          labelPt: 'Simulado Focado',
        },
      });
    }
  }

  // 6. Coverage gaps
  for (const area of ALL_AREAS) {
    const ac = areaCompetency[area];
    if (ac.confidence < 0.4) {
      recs.push({
        priority: 0,
        type: 'broaden_coverage',
        area,
        descriptionPt: `Explorar ${AREA_LABELS_PT[area]}`,
        reasonPt: `Poucos dados disponiveis para avaliar esta area. Pratique mais.`,
        priorityScore: (1 - ac.confidence) * 0.60,
        action: {
          feature: 'study_path',
          href: '/trilhas',
          labelPt: 'Trilha de Estudo',
        },
      });
    }
  }

  // Sort by priority score and assign ranks
  recs.sort((a, b) => b.priorityScore - a.priorityScore);
  recs.forEach((r, i) => { r.priority = i + 1; });

  return recs.slice(0, 8); // Top 8
}

// ============================================
// Data Completeness
// ============================================

function assessDataCompleteness(inputs: UnifiedModelInputs): DataCompleteness {
  const hasIRT = inputs.irtTheta !== null;
  const hasMIRT = inputs.mirtProfile !== null;
  const hasFCR = inputs.fcrCalibrationScore !== null;
  const hasBKT = inputs.bktMastery !== null;
  const hasHLR = inputs.hlrAverageRetention !== null;
  const hasEngagement = inputs.engagement !== null;

  const count = [hasIRT, hasMIRT, hasFCR, hasBKT, hasHLR, hasEngagement]
    .filter(Boolean).length;

  return {
    hasIRT,
    hasMIRT,
    hasFCR,
    hasBKT,
    hasHLR,
    hasEngagement,
    overallCompleteness: count / 6,
    isReliable: count >= 3,
  };
}

// ============================================
// Trajectory Analysis
// ============================================

/**
 * Compute learner trajectory statistics from a series of snapshots.
 */
export function analyzeLearnerTrajectory(
  points: LearnerTrajectoryPoint[]
): LearnerTrajectory {
  if (points.length < 2) {
    return {
      points,
      growthRate: 0,
      hasPlateaued: false,
      estimatedDaysToTarget: null,
    };
  }

  // Linear regression on overall competency
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const startTime = points[0].date.getTime();

  for (let i = 0; i < n; i++) {
    const x = (points[i].date.getTime() - startTime) / (1000 * 60 * 60 * 24); // days
    const y = points[i].overallCompetency;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  const growthRate = denom > 0 ? (n * sumXY - sumX * sumY) / denom : 0;

  // Plateau detection: growth rate near zero in last 5 points
  const recentPoints = points.slice(-5);
  const recentVariance = recentPoints.length > 1
    ? recentPoints.reduce((s, p) => s + (p.overallCompetency - recentPoints[0].overallCompetency) ** 2, 0) / recentPoints.length
    : 0;
  const hasPlateaued = recentVariance < 0.001 && points.length >= 5;

  // Estimated days to target (0.85 competency)
  const target = 0.85;
  const currentCompetency = points[points.length - 1].overallCompetency;
  let estimatedDays: number | null = null;
  if (growthRate > 0 && currentCompetency < target) {
    estimatedDays = Math.ceil((target - currentCompetency) / growthRate);
  }

  return {
    points,
    growthRate,
    hasPlateaued,
    estimatedDaysToTarget: estimatedDays,
  };
}
