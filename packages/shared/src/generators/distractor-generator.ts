/**
 * Distractor Generator
 * ====================
 *
 * Generates semantically appropriate distractors for questions using:
 * - Wu-Palmer similarity on ICD-10/ATC hierarchies
 * - Schema.org medical ontology relationships
 * - Target difficulty-based similarity ranges
 *
 * @module packages/shared/src/generators/distractor-generator
 */

import {
  MedicalCondition,
  Drug,
  MedicalOntology,
} from '../types/schema-medical';
import {
  ICD10Tree,
  ICD10Node,
  ATCTree,
  ATCNode,
  SimilarityResult,
} from '../types/ontology';
import {
  wuPalmerSimilarityICD10,
  wuPalmerSimilarityATC,
  findLCA,
  getPathToRoot,
} from '../calculators/similarity';

// ============================================
// Types
// ============================================

/**
 * Distractor configuration
 */
export interface DistractorConfig {
  correct: MedicalCondition | Drug;
  candidates: Array<MedicalCondition | Drug>;
  count: number; // Number of distractors to select
  targetSimilarity: [number, number]; // Min-max Wu-Palmer similarity range
  diversityWeight: number; // 0-1, higher = more diverse distractors
}

/**
 * Difficulty-based similarity ranges
 */
const DIFFICULTY_SIMILARITY_RANGES: Record<string, [number, number]> = {
  muito_facil: [0.0, 0.30], // Very different (different body systems)
  facil: [0.25, 0.45], // Same chapter, different block
  medio: [0.40, 0.60], // Same block, different category
  dificil: [0.55, 0.75], // Same category
  muito_dificil: [0.70, 0.95], // Same subcategory (very similar)
};

/**
 * Scored distractor candidate
 */
interface ScoredDistractor {
  entity: MedicalCondition | Drug;
  similarity: number;
  diversityScore: number;
  totalScore: number;
}

// ============================================
// Distractor Generator
// ============================================

/**
 * Main distractor generator class
 */
export class DistractorGenerator {
  private ontology: MedicalOntology;
  private icd10Tree?: ICD10Tree;
  private atcTree?: ATCTree;

  constructor(
    ontology: MedicalOntology,
    icd10Tree?: ICD10Tree,
    atcTree?: ATCTree
  ) {
    this.ontology = ontology;
    this.icd10Tree = icd10Tree;
    this.atcTree = atcTree;
  }

  /**
   * Generate distractors for a correct answer
   */
  generateDistractors(config: DistractorConfig): Array<MedicalCondition | Drug> {
    // Score all candidates
    const scored = config.candidates.map(candidate =>
      this.scoreDistractor(candidate, config)
    );

    // Filter by similarity range
    const inRange = scored.filter(
      s =>
        s.similarity >= config.targetSimilarity[0] &&
        s.similarity <= config.targetSimilarity[1]
    );

    // Sort by total score (similarity + diversity)
    inRange.sort((a, b) => b.totalScore - a.totalScore);

    // Select top N, ensuring diversity
    return this.selectDiverseSubset(inRange, config.count).map(s => s.entity);
  }

  /**
   * Generate distractors for target difficulty level
   */
  generateDistractorsByDifficulty(
    correct: MedicalCondition | Drug,
    candidates: Array<MedicalCondition | Drug>,
    difficulty: keyof typeof DIFFICULTY_SIMILARITY_RANGES,
    count: number = 3
  ): Array<MedicalCondition | Drug> {
    const targetSimilarity = DIFFICULTY_SIMILARITY_RANGES[difficulty];

    return this.generateDistractors({
      correct,
      candidates,
      count,
      targetSimilarity,
      diversityWeight: 0.3,
    });
  }

  /**
   * Score a distractor candidate
   */
  private scoreDistractor(
    candidate: MedicalCondition | Drug,
    config: DistractorConfig
  ): ScoredDistractor {
    // Calculate similarity to correct answer
    const similarity = this.calculateEntitySimilarity(config.correct, candidate);

    // Diversity score (placeholder - would use distance to other selected distractors)
    const diversityScore = Math.random(); // TODO: Implement actual diversity calculation

    // Combine scores
    const totalScore =
      similarity * (1 - config.diversityWeight) +
      diversityScore * config.diversityWeight;

    return {
      entity: candidate,
      similarity,
      diversityScore,
      totalScore,
    };
  }

  /**
   * Calculate similarity between two medical entities
   */
  private calculateEntitySimilarity(
    entity1: MedicalCondition | Drug,
    entity2: MedicalCondition | Drug
  ): number {
    // Both are conditions - use ICD-10 similarity
    if (this.isCondition(entity1) && this.isCondition(entity2) && this.icd10Tree) {
      return this.calculateConditionSimilarity(entity1, entity2);
    }

    // Both are drugs - use ATC similarity
    if (this.isDrug(entity1) && this.isDrug(entity2) && this.atcTree) {
      return this.calculateDrugSimilarity(entity1, entity2);
    }

    // Different types - low similarity
    return 0.1;
  }

  /**
   * Calculate similarity between two conditions using ICD-10
   */
  private calculateConditionSimilarity(
    cond1: MedicalCondition,
    cond2: MedicalCondition
  ): number {
    if (!this.icd10Tree) return 0.5;

    const code1 = cond1.icd10Code;
    const code2 = cond2.icd10Code;

    if (!code1 || !code2) return 0.5;

    // Use Wu-Palmer similarity
    return wuPalmerSimilarityICD10(code1, code2, this.icd10Tree);
  }

  /**
   * Calculate similarity between two drugs using ATC
   */
  private calculateDrugSimilarity(drug1: Drug, drug2: Drug): number {
    if (!this.atcTree) return 0.5;

    const code1 = drug1.atcCode;
    const code2 = drug2.atcCode;

    if (!code1 || !code2) return 0.5;

    // Use Wu-Palmer similarity on ATC hierarchy
    const node1 = this.atcTree.nodes.get(code1);
    const node2 = this.atcTree.nodes.get(code2);

    if (!node1 || !node2) return 0.5;

    // Find LCA
    const lca = this.findATCLowestCommonAncestor(node1, node2);
    if (!lca) return 0.0;

    // Calculate Wu-Palmer similarity
    const depth1 = this.getATCDepth(node1);
    const depth2 = this.getATCDepth(node2);
    const lcaDepth = this.getATCDepth(lca);

    return (2 * lcaDepth) / (depth1 + depth2);
  }

  /**
   * Select diverse subset of distractors
   */
  private selectDiverseSubset(
    scored: ScoredDistractor[],
    count: number
  ): ScoredDistractor[] {
    const selected: ScoredDistractor[] = [];

    // Always select the best candidate first
    if (scored.length > 0) {
      selected.push(scored[0]);
    }

    // Select remaining distractors to maximize diversity
    while (selected.length < count && selected.length < scored.length) {
      let bestCandidate: ScoredDistractor | null = null;
      let bestDiversityScore = -1;

      for (const candidate of scored) {
        if (selected.includes(candidate)) continue;

        // Calculate average distance to already selected distractors
        let totalDistance = 0;
        for (const sel of selected) {
          const distance = 1 - this.calculateEntitySimilarity(candidate.entity, sel.entity);
          totalDistance += distance;
        }
        const avgDistance = totalDistance / selected.length;

        // Combined score: original score + diversity bonus
        const diversityBonus = avgDistance * 0.5;
        const combinedScore = candidate.totalScore + diversityBonus;

        if (combinedScore > bestDiversityScore) {
          bestDiversityScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        selected.push(bestCandidate);
      } else {
        break;
      }
    }

    return selected;
  }

  /**
   * Find lowest common ancestor in ATC tree
   */
  private findATCLowestCommonAncestor(
    node1: ATCNode,
    node2: ATCNode
  ): ATCNode | null {
    if (!this.atcTree) return null;

    // Get paths to root
    const path1 = this.getATCPathToRoot(node1);
    const path2 = this.getATCPathToRoot(node2);

    // Find LCA
    for (let i = 0; i < path1.length; i++) {
      if (path2.includes(path1[i])) {
        return this.atcTree.nodes.get(path1[i]) || null;
      }
    }

    return null;
  }

  /**
   * Get path from ATC node to root
   */
  private getATCPathToRoot(node: ATCNode): string[] {
    const path: string[] = [node.code];
    let current = node;

    while (current.parent) {
      const parent = this.atcTree?.nodes.get(current.parent);
      if (!parent) break;
      path.push(parent.code);
      current = parent;
    }

    return path;
  }

  /**
   * Get ATC node depth
   */
  private getATCDepth(node: ATCNode): number {
    return node.level;
  }

  /**
   * Type guards
   */
  private isCondition(entity: unknown): entity is MedicalCondition {
    return (entity as MedicalCondition)['@type'] === 'MedicalCondition';
  }

  private isDrug(entity: unknown): entity is Drug {
    return (entity as Drug)['@type'] === 'Drug';
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate distractors for a condition
 */
export function generateConditionDistractors(
  correct: MedicalCondition,
  ontology: MedicalOntology,
  icd10Tree: ICD10Tree,
  difficulty: keyof typeof DIFFICULTY_SIMILARITY_RANGES,
  count: number = 3
): MedicalCondition[] {
  const generator = new DistractorGenerator(ontology, icd10Tree);

  // Get all conditions except the correct one
  const candidates = Array.from(ontology.conditions.values()).filter(
    c => c.id !== correct.id
  );

  const distractors = generator.generateDistractorsByDifficulty(
    correct,
    candidates,
    difficulty,
    count
  );

  return distractors as MedicalCondition[];
}

/**
 * Generate distractors for a drug
 */
export function generateDrugDistractors(
  correct: Drug,
  ontology: MedicalOntology,
  atcTree: ATCTree,
  difficulty: keyof typeof DIFFICULTY_SIMILARITY_RANGES,
  count: number = 3
): Drug[] {
  const generator = new DistractorGenerator(ontology, undefined, atcTree);

  // Get all drugs except the correct one
  const candidates = Array.from(ontology.drugs.values()).filter(
    d => d.id !== correct.id
  );

  const distractors = generator.generateDistractorsByDifficulty(
    correct,
    candidates,
    difficulty,
    count
  );

  return distractors as Drug[];
}

/**
 * Validate distractor quality
 */
export function validateDistractors(
  correct: MedicalCondition | Drug,
  distractors: Array<MedicalCondition | Drug>,
  targetDifficulty: keyof typeof DIFFICULTY_SIMILARITY_RANGES,
  ontology: MedicalOntology,
  icd10Tree?: ICD10Tree,
  atcTree?: ATCTree
): {
  valid: boolean;
  issues: string[];
  averageSimilarity: number;
} {
  const generator = new DistractorGenerator(ontology, icd10Tree, atcTree);
  const issues: string[] = [];

  // Check count
  if (distractors.length < 3) {
    issues.push('Insufficient distractors (need at least 3)');
  }

  // Calculate similarities
  const similarities = distractors.map(d =>
    generator['calculateEntitySimilarity'](correct, d)
  );

  const averageSimilarity =
    similarities.reduce((sum, s) => sum + s, 0) / similarities.length;

  // Check similarity range
  const targetRange = DIFFICULTY_SIMILARITY_RANGES[targetDifficulty];
  if (
    averageSimilarity < targetRange[0] ||
    averageSimilarity > targetRange[1]
  ) {
    issues.push(
      `Average similarity ${averageSimilarity.toFixed(2)} outside target range [${targetRange[0]}, ${targetRange[1]}]`
    );
  }

  // Check for duplicates
  const names = new Set(distractors.map(d => d.name));
  if (names.size < distractors.length) {
    issues.push('Duplicate distractors detected');
  }

  // Check if any distractor is the correct answer
  if (distractors.some(d => d.id === correct.id)) {
    issues.push('Correct answer included in distractors');
  }

  return {
    valid: issues.length === 0,
    issues,
    averageSimilarity,
  };
}

/**
 * Export difficulty ranges for external use
 */
export { DIFFICULTY_SIMILARITY_RANGES };
