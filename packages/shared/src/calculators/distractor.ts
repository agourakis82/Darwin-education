/**
 * Darwin Education - Distractor Selection
 * ========================================
 *
 * Algorithms for selecting appropriate distractors for CIP puzzles
 * based on semantic similarity and target difficulty level.
 */

import type { DifficultyLevel } from '../types/education';
import type { MedicalConcept, ICD10Tree, ATCTree, SimilarityMatrix } from '../types/ontology';
import type {
  CIPFinding,
  DistractorCandidate,
  SimilarityWeights,
  DEFAULT_SIMILARITY_WEIGHTS,
  DIFFICULTY_SIMILARITY_THRESHOLDS,
} from '../types/cip';
import {
  calculateMultiDimensionalSimilarity,
  findConceptsInSimilarityRange,
  getSimilarityFromMatrix,
} from './similarity';

// ============================================
// Difficulty Threshold Helpers
// ============================================

/**
 * Get target similarity range for a difficulty level
 */
export function getSimilarityRangeForDifficulty(
  difficulty: DifficultyLevel
): { min: number; max: number } {
  const thresholds: Record<DifficultyLevel, { min: number; max: number }> = {
    muito_facil: { min: 0.00, max: 0.30 },
    facil: { min: 0.25, max: 0.45 },
    medio: { min: 0.40, max: 0.60 },
    dificil: { min: 0.55, max: 0.75 },
    muito_dificil: { min: 0.70, max: 0.95 },
  };
  return thresholds[difficulty];
}

/**
 * Get target similarity midpoint for a difficulty level
 */
export function getTargetSimilarity(difficulty: DifficultyLevel): number {
  const range = getSimilarityRangeForDifficulty(difficulty);
  return (range.min + range.max) / 2;
}

/**
 * Calculate how well a similarity matches the target difficulty
 * Returns 0-1 where 1 = perfect match to target range
 */
export function calculateDifficultyMatch(
  similarity: number,
  targetDifficulty: DifficultyLevel
): number {
  const range = getSimilarityRangeForDifficulty(targetDifficulty);
  const target = getTargetSimilarity(targetDifficulty);

  // If within range, score based on distance from midpoint
  if (similarity >= range.min && similarity <= range.max) {
    const distanceFromTarget = Math.abs(similarity - target);
    const maxDistance = (range.max - range.min) / 2;
    return 1 - (distanceFromTarget / maxDistance);
  }

  // If outside range, penalize based on distance
  const distanceOutside = similarity < range.min
    ? range.min - similarity
    : similarity - range.max;

  return Math.max(0, 1 - distanceOutside * 2);
}

// ============================================
// Finding-Level Distractor Selection
// ============================================

/**
 * Options for selecting distractors for a finding
 */
export interface DistractorSelectionOptions {
  /** Target difficulty level */
  targetDifficulty: DifficultyLevel;
  /** Number of distractors to select */
  numDistractors: number;
  /** Finding IDs to exclude (e.g., correct answer) */
  excludeIds: Set<string>;
  /** Weight for diversity in selection (0-1) */
  diversityWeight?: number;
  /** Custom similarity weights */
  weights?: SimilarityWeights;
  /** Tolerance for extending similarity range */
  rangeTolerance?: number;
}

/**
 * Score a finding as a potential distractor
 */
function scoreFindingAsDistractor(
  candidateFinding: CIPFinding,
  correctFinding: CIPFinding,
  targetDifficulty: DifficultyLevel,
  icdTree: ICD10Tree,
  atcTree: ATCTree,
  weights?: SimilarityWeights
): DistractorCandidate {
  // Convert finding to concept for similarity calculation
  const correctConcept: MedicalConcept = {
    id: correctFinding.id,
    name: correctFinding.textPt,
    icd10Codes: correctFinding.icd10Codes,
    atcCodes: correctFinding.atcCodes,
    area: '',
    subspecialty: '',
    topic: '',
    keywords: correctFinding.tags,
  };

  const candidateConcept: MedicalConcept = {
    id: candidateFinding.id,
    name: candidateFinding.textPt,
    icd10Codes: candidateFinding.icd10Codes,
    atcCodes: candidateFinding.atcCodes,
    area: '',
    subspecialty: '',
    topic: '',
    keywords: candidateFinding.tags,
  };

  const similarity = calculateMultiDimensionalSimilarity(
    correctConcept,
    candidateConcept,
    icdTree,
    atcTree,
    weights
  );

  const difficultyMatch = calculateDifficultyMatch(similarity, targetDifficulty);

  return {
    finding: candidateFinding,
    similarity,
    difficultyMatch,
  };
}

/**
 * Select distractors for a specific finding based on semantic similarity
 *
 * Algorithm:
 * 1. Score all candidate findings by similarity to correct answer
 * 2. Filter to target difficulty range (with tolerance)
 * 3. Select diverse subset maximizing both difficulty match and diversity
 */
export function selectDistractorsForFinding(
  correctFinding: CIPFinding,
  candidateFindings: CIPFinding[],
  options: DistractorSelectionOptions,
  icdTree: ICD10Tree,
  atcTree: ATCTree
): DistractorCandidate[] {
  const {
    targetDifficulty,
    numDistractors,
    excludeIds,
    diversityWeight = 0.3,
    weights,
    rangeTolerance = 0.1,
  } = options;

  const targetRange = getSimilarityRangeForDifficulty(targetDifficulty);

  // Step 1: Score all candidates
  const scored: DistractorCandidate[] = candidateFindings
    .filter(f => !excludeIds.has(f.id) && f.id !== correctFinding.id)
    .filter(f => f.section === correctFinding.section) // Same section only
    .map(candidate =>
      scoreFindingAsDistractor(
        candidate,
        correctFinding,
        targetDifficulty,
        icdTree,
        atcTree,
        weights
      )
    );

  // Step 2: Filter to acceptable range (with tolerance)
  const inRange = scored.filter(c =>
    c.similarity >= targetRange.min - rangeTolerance &&
    c.similarity <= targetRange.max + rangeTolerance
  );

  // If not enough candidates in range, expand search
  const candidates = inRange.length >= numDistractors
    ? inRange
    : scored.sort((a, b) => b.difficultyMatch - a.difficultyMatch);

  // Step 3: Select diverse subset
  return selectDiverseDistractors(
    candidates,
    numDistractors,
    diversityWeight,
    icdTree,
    atcTree,
    weights
  );
}

/**
 * Select a diverse subset of distractors
 * Balances difficulty match with inter-distractor diversity
 */
function selectDiverseDistractors(
  candidates: DistractorCandidate[],
  n: number,
  diversityWeight: number,
  icdTree: ICD10Tree,
  atcTree: ATCTree,
  weights?: SimilarityWeights
): DistractorCandidate[] {
  if (candidates.length <= n) {
    return candidates;
  }

  const selected: DistractorCandidate[] = [];
  const remaining = [...candidates];

  // Sort by difficulty match, pick best first
  remaining.sort((a, b) => b.difficultyMatch - a.difficultyMatch);
  selected.push(remaining.shift()!);

  // Greedily add most diverse remaining candidates
  while (selected.length < n && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];

      // Calculate minimum similarity to already selected distractors
      // (lower similarity = more diverse)
      let minSimilarityToSelected = 1.0;
      for (const s of selected) {
        const candidateConcept: MedicalConcept = {
          id: candidate.finding.id,
          name: candidate.finding.textPt,
          icd10Codes: candidate.finding.icd10Codes,
          atcCodes: candidate.finding.atcCodes,
          area: '',
          subspecialty: '',
          topic: '',
          keywords: candidate.finding.tags,
        };
        const selectedConcept: MedicalConcept = {
          id: s.finding.id,
          name: s.finding.textPt,
          icd10Codes: s.finding.icd10Codes,
          atcCodes: s.finding.atcCodes,
          area: '',
          subspecialty: '',
          topic: '',
          keywords: s.finding.tags,
        };

        const sim = calculateMultiDimensionalSimilarity(
          candidateConcept,
          selectedConcept,
          icdTree,
          atcTree,
          weights
        );
        minSimilarityToSelected = Math.min(minSimilarityToSelected, sim);
      }

      // Combined score: difficulty match + diversity
      const diversityScore = 1 - minSimilarityToSelected;
      const score =
        (1 - diversityWeight) * candidate.difficultyMatch +
        diversityWeight * diversityScore;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

// ============================================
// Matrix-Based Fast Selection
// ============================================

/**
 * Fast distractor selection using pre-computed similarity matrix
 */
export function selectDistractorsFast(
  correctId: string,
  simMatrix: SimilarityMatrix,
  options: DistractorSelectionOptions
): Array<{ conceptId: string; similarity: number; difficultyMatch: number }> {
  const correctIdx = simMatrix.conceptIndex.get(correctId);
  if (correctIdx === undefined) return [];

  const {
    targetDifficulty,
    numDistractors,
    excludeIds,
    rangeTolerance = 0.1,
  } = options;

  const targetRange = getSimilarityRangeForDifficulty(targetDifficulty);

  const candidates: Array<{
    conceptId: string;
    similarity: number;
    difficultyMatch: number;
  }> = [];

  // Scan matrix row for this concept
  for (let i = 0; i < simMatrix.size; i++) {
    if (i === correctIdx) continue;

    const concept = simMatrix.concepts[i];
    if (excludeIds.has(concept.id)) continue;

    const similarity = simMatrix.matrix[correctIdx * simMatrix.size + i];

    // Check if in acceptable range
    if (
      similarity >= targetRange.min - rangeTolerance &&
      similarity <= targetRange.max + rangeTolerance
    ) {
      const difficultyMatch = calculateDifficultyMatch(similarity, targetDifficulty);
      candidates.push({ conceptId: concept.id, similarity, difficultyMatch });
    }
  }

  // Sort by difficulty match and take top N
  return candidates
    .sort((a, b) => b.difficultyMatch - a.difficultyMatch)
    .slice(0, numDistractors);
}

// ============================================
// Fallback Random Selection
// ============================================

/**
 * Fallback: random distractor selection when semantic data is unavailable
 */
export function selectRandomDistractors<T extends { id: string }>(
  correctItem: T,
  candidates: T[],
  numDistractors: number,
  excludeIds?: Set<string>
): T[] {
  const available = candidates.filter(
    c => c.id !== correctItem.id && !excludeIds?.has(c.id)
  );

  // Fisher-Yates shuffle
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, numDistractors);
}

// ============================================
// Utility Exports
// ============================================

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Deduplicate array by ID
 */
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
