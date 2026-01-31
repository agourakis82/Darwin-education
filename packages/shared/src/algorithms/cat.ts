/**
 * Computerized Adaptive Testing (CAT)
 * ====================================
 *
 * Implementation of CAT algorithms for efficient, adaptive exams.
 * Reduces test length by ~50% while maintaining measurement precision.
 *
 * Research:
 * - PMC10624130: CAT for health professionals (SE < 0.35 with half the items)
 * - Maximum Fisher Information (MFI) is standard selection method
 *
 * Key Components:
 * 1. Item selection (MFI + content balancing)
 * 2. Theta estimation (EAP/MLE/MAP)
 * 3. Stopping rules (SE threshold + min/max length)
 * 4. Exposure control (Sympson-Hetter)
 */

import type { ENAMEDQuestion, ENAMEDArea, IRTParameters } from '../types/education';
import {
  probability3PL,
  itemInformation,
  standardError,
  estimateThetaEAP,
  estimateThetaMLE,
} from '../calculators/tri';

export interface CATConfig {
  minItems: number;
  maxItems: number;
  seThreshold: number;
  contentBalancing: boolean;
  areaTargets: Record<ENAMEDArea, number>;
  maxExposureRate: number;
  estimationMethod: 'EAP' | 'MLE' | 'MAP';
  selectionMethod: 'MFI' | 'KL' | 'RANDOM';
}

export const DEFAULT_CAT_CONFIG: CATConfig = {
  minItems: 30,
  maxItems: 80,
  seThreshold: 0.30,
  contentBalancing: true,
  areaTargets: {
    clinica_medica: 0.2,
    cirurgia: 0.2,
    ginecologia_obstetricia: 0.2,
    pediatria: 0.2,
    saude_coletiva: 0.2,
  },
  maxExposureRate: 0.25,
  estimationMethod: 'EAP',
  selectionMethod: 'MFI',
};

export interface CATSession {
  theta: number;
  se: number;
  itemsAdministered: string[];
  responses: boolean[];
  itemAreas: ENAMEDArea[];
  thetaHistory: { itemNum: number; theta: number; se: number }[];
  isComplete: boolean;
  stoppingReason?: 'se_threshold' | 'max_items';
}

export function initCATSession(): CATSession {
  return {
    theta: 0,
    se: Infinity,
    itemsAdministered: [],
    responses: [],
    itemAreas: [],
    thetaHistory: [],
    isComplete: false,
  };
}

export function selectNextItem(
  session: CATSession,
  itemBank: ENAMEDQuestion[],
  exposureRates: Map<string, number>,
  config: CATConfig = DEFAULT_CAT_CONFIG
): ENAMEDQuestion | null {
  const remainingItems = itemBank.filter(
    item => !session.itemsAdministered.includes(item.id)
  );

  if (remainingItems.length === 0) return null;

  // Apply exposure control
  const exposureFiltered = remainingItems.filter(
    item => (exposureRates.get(item.id) || 0) < config.maxExposureRate
  );

  const eligibleItems = exposureFiltered.length > 0 ? exposureFiltered : remainingItems;

  // Apply content balancing
  let finalEligible = eligibleItems;
  if (config.contentBalancing && session.itemsAdministered.length > 0) {
    const targetArea = getTargetArea(session, config.areaTargets);
    const areaItems = eligibleItems.filter(item => item.ontology.area === targetArea);

    // If we have items in target area, use them; otherwise fall back to all eligible
    if (areaItems.length > 0) {
      finalEligible = areaItems;
    }
  }

  // Select item based on selection method
  switch (config.selectionMethod) {
    case 'MFI':
      return selectByMFI(session.theta, finalEligible);
    case 'KL':
      return selectByKL(session, finalEligible);
    case 'RANDOM':
      return selectRandom(finalEligible);
    default:
      return selectByMFI(session.theta, finalEligible);
  }
}

/**
 * Update CAT session after receiving response
 */
export function updateCATSession(
  session: CATSession,
  questionId: string,
  correct: boolean,
  area: ENAMEDArea,
  itemParams: IRTParameters,
  allItemParams: Map<string, IRTParameters>,
  config: CATConfig = DEFAULT_CAT_CONFIG
): CATSession {
  // Update responses
  const newResponses = [...session.responses, correct];
  const newItemsAdministered = [...session.itemsAdministered, questionId];
  const newItemAreas = [...session.itemAreas, area];

  // Build IRT parameters array for all administered items
  const itemParamsArray: IRTParameters[] = newItemsAdministered.map(id => {
    const params = allItemParams.get(id);
    if (!params) {
      throw new Error(`IRT parameters not found for question ${id}`);
    }
    return params;
  });

  // Estimate new theta
  let newTheta: number;
  if (config.estimationMethod === 'EAP') {
    newTheta = estimateThetaEAP(newResponses, itemParamsArray);
  } else if (config.estimationMethod === 'MLE') {
    newTheta = estimateThetaMLE(newResponses, itemParamsArray);
  } else {
    // MAP (Maximum A Posteriori) - use EAP for now (same implementation)
    newTheta = estimateThetaEAP(newResponses, itemParamsArray);
  }

  // Calculate SE
  const newSE = standardError(newTheta, itemParamsArray);

  // Update theta history
  const newThetaHistory = [
    ...session.thetaHistory,
    { itemNum: newItemsAdministered.length, theta: newTheta, se: newSE }
  ];

  // Check stopping rules
  const { isComplete, stoppingReason } = checkStoppingRules(
    newItemsAdministered.length,
    newSE,
    config
  );

  return {
    theta: newTheta,
    se: newSE,
    itemsAdministered: newItemsAdministered,
    responses: newResponses,
    itemAreas: newItemAreas,
    thetaHistory: newThetaHistory,
    isComplete,
    stoppingReason,
  };
}

// ============================================
// Item Selection Algorithms
// ============================================

/**
 * Maximum Fisher Information (MFI) selection
 * Select item with highest information at current theta estimate
 */
function selectByMFI(theta: number, items: ENAMEDQuestion[]): ENAMEDQuestion {
  const itemsWithInfo = items.map(item => ({
    item,
    info: itemInformation(theta, item.irt)
  }));

  // Sort by information (descending)
  itemsWithInfo.sort((a, b) => b.info - a.info);

  // Select from top 5 randomly (reduce predictability)
  const topK = Math.min(5, itemsWithInfo.length);
  const randomIndex = Math.floor(Math.random() * topK);

  return itemsWithInfo[randomIndex].item;
}

/**
 * Kullback-Leibler (KL) Information selection
 * Select item that minimizes KL divergence between prior and posterior
 */
function selectByKL(session: CATSession, items: ENAMEDQuestion[]): ENAMEDQuestion {
  const currentTheta = session.theta;

  const itemsWithKL = items.map(item => {
    // Expected information gain (simplified as item information)
    const pCorrect = probability3PL(currentTheta, item.irt);
    const info = itemInformation(currentTheta, item.irt);

    // Weight by probability to get expected KL
    const expectedKL = pCorrect * info + (1 - pCorrect) * info;

    return { item, kl: expectedKL };
  });

  // Select item with maximum expected KL (most informative)
  itemsWithKL.sort((a, b) => b.kl - a.kl);

  return itemsWithKL[0].item;
}

/**
 * Random selection (baseline / debugging)
 */
function selectRandom(items: ENAMEDQuestion[]): ENAMEDQuestion {
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

// ============================================
// Content Balancing
// ============================================

/**
 * Determine which area should be targeted next for content balancing
 */
function getTargetArea(
  session: CATSession,
  areaTargets: Record<ENAMEDArea, number>
): ENAMEDArea {
  // Count items per area so far
  const areaCounts: Record<ENAMEDArea, number> = {
    clinica_medica: 0,
    cirurgia: 0,
    ginecologia_obstetricia: 0,
    pediatria: 0,
    saude_coletiva: 0,
  };

  for (const area of session.itemAreas) {
    areaCounts[area]++;
  }

  const totalItems = session.itemsAdministered.length;

  // Calculate deviation from target for each area
  const areas = Object.keys(areaTargets) as ENAMEDArea[];
  const deviations = areas.map(area => {
    const currentPct = totalItems > 0 ? areaCounts[area] / totalItems : 0;
    const targetPct = areaTargets[area];
    return {
      area,
      deviation: targetPct - currentPct
    };
  });

  // Return area with largest positive deviation (most underrepresented)
  deviations.sort((a, b) => b.deviation - a.deviation);
  return deviations[0].area;
}

/**
 * Check if content is balanced
 */
export function isContentBalanced(
  session: CATSession,
  areaTargets: Record<ENAMEDArea, number>,
  tolerance: number = 0.05
): boolean {
  if (session.itemsAdministered.length === 0) return false;

  const areaCounts: Record<ENAMEDArea, number> = {
    clinica_medica: 0,
    cirurgia: 0,
    ginecologia_obstetricia: 0,
    pediatria: 0,
    saude_coletiva: 0,
  };

  for (const area of session.itemAreas) {
    areaCounts[area]++;
  }

  const totalItems = session.itemsAdministered.length;

  for (const area of Object.keys(areaTargets) as ENAMEDArea[]) {
    const currentPct = areaCounts[area] / totalItems;
    const targetPct = areaTargets[area];
    if (Math.abs(currentPct - targetPct) > tolerance) {
      return false;
    }
  }

  return true;
}

// ============================================
// Stopping Rules
// ============================================

/**
 * Check if CAT should stop based on stopping rules
 */
function checkStoppingRules(
  itemsAdministered: number,
  se: number,
  config: CATConfig
): { isComplete: boolean; stoppingReason?: CATSession['stoppingReason'] } {
  // Maximum items reached
  if (itemsAdministered >= config.maxItems) {
    return { isComplete: true, stoppingReason: 'max_items' };
  }

  // SE threshold reached (but only after minimum items)
  if (itemsAdministered >= config.minItems && se < config.seThreshold) {
    return { isComplete: true, stoppingReason: 'se_threshold' };
  }

  // Not complete yet
  return { isComplete: false };
}

// ============================================
// Exposure Control (Sympson-Hetter)
// ============================================

/**
 * Calculate current exposure rate for an item
 */
export function calculateExposureRate(
  questionId: string,
  administrations: number,
  totalSessions: number
): number {
  if (totalSessions === 0) return 0;
  return administrations / totalSessions;
}

/**
 * Update exposure rates after CAT session
 */
export function updateExposureRates(
  exposureRates: Map<string, number>,
  session: CATSession,
  totalSessions: number
): Map<string, number> {
  const updated = new Map(exposureRates);

  for (const questionId of session.itemsAdministered) {
    const currentRate = updated.get(questionId) || 0;
    // Simplified update (in practice, use moving average)
    const newRate = (currentRate * (totalSessions - 1) + 1) / totalSessions;
    updated.set(questionId, newRate);
  }

  return updated;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get area coverage statistics
 */
export function getAreaCoverage(session: CATSession): Record<ENAMEDArea, number> {
  const areaCounts: Record<ENAMEDArea, number> = {
    clinica_medica: 0,
    cirurgia: 0,
    ginecologia_obstetricia: 0,
    pediatria: 0,
    saude_coletiva: 0,
  };

  for (const area of session.itemAreas) {
    areaCounts[area]++;
  }

  return areaCounts;
}

/**
 * Calculate precision percentage (inverse of SE, capped at 100%)
 */
export function getPrecisionPercentage(se: number): number {
  if (se === Infinity) return 0;
  // Precision increases as SE decreases
  // SE = 0.3 → 90% precision (rough mapping)
  const precision = Math.max(0, 100 - se * 300);
  return Math.min(100, precision);
}

/**
 * Generate CAT summary report
 */
export function generateCATReport(session: CATSession, config: CATConfig): string {
  const areaCoverage = getAreaCoverage(session);
  const totalItems = session.itemsAdministered.length;
  const correctCount = session.responses.filter(r => r).length;

  return `
CAT Session Report
==================

Items Administered: ${totalItems}
Correct Answers: ${correctCount} / ${totalItems} (${Math.round(correctCount/totalItems*100)}%)

Final Theta: ${session.theta.toFixed(3)}
Standard Error: ${session.se.toFixed(3)}
Precision: ${getPrecisionPercentage(session.se).toFixed(1)}%

Stopping Reason: ${session.stoppingReason || 'N/A'}

Area Coverage:
- Clínica Médica: ${areaCoverage.clinica_medica} (${(areaCoverage.clinica_medica/totalItems*100).toFixed(1)}%)
- Cirurgia: ${areaCoverage.cirurgia} (${(areaCoverage.cirurgia/totalItems*100).toFixed(1)}%)
- GO: ${areaCoverage.ginecologia_obstetricia} (${(areaCoverage.ginecologia_obstetricia/totalItems*100).toFixed(1)}%)
- Pediatria: ${areaCoverage.pediatria} (${(areaCoverage.pediatria/totalItems*100).toFixed(1)}%)
- Saúde Coletiva: ${areaCoverage.saude_coletiva} (${(areaCoverage.saude_coletiva/totalItems*100).toFixed(1)}%)
  `.trim();
}
