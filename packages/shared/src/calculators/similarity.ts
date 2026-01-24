/**
 * Darwin Education - Semantic Similarity Calculator
 * ==================================================
 *
 * Calculates semantic similarity between medical concepts using
 * ICD-10 and ATC hierarchies for CIP distractor generation.
 *
 * Based on Wu-Palmer similarity measure which is well-suited for
 * medical ontologies.
 */

import type {
  ICD10Tree,
  ICD10Node,
  ATCTree,
  ATCNode,
  MedicalConcept,
  SimilarityResult,
  SimilarityMatrix,
} from '../types/ontology';
import type { SimilarityWeights, DEFAULT_SIMILARITY_WEIGHTS } from '../types/cip';

// ============================================
// Constants
// ============================================

/** Maximum depth for ICD-10 tree (chapter=0, subcategory=3) */
const ICD10_MAX_DEPTH = 4;

/** Maximum depth for ATC tree (level 1-5, so max depth = 4) */
const ATC_MAX_DEPTH = 5;

// ============================================
// Path Finding Utilities
// ============================================

/**
 * Get path from a node to the root of the tree
 * Returns array of codes from the node up to root
 */
export function getPathToRoot(
  code: string,
  tree: ICD10Tree | ATCTree
): string[] {
  const path: string[] = [];
  let current: string | null = code;

  while (current) {
    path.push(current);
    const node: ICD10Node | ATCNode | undefined = tree.nodes.get(current);
    current = node?.parent ?? null;
  }

  return path;
}

/**
 * Find the Lowest Common Ancestor (LCA) of two codes
 * Uses path-to-root strategy: O(d1 + d2) where d1, d2 are depths
 */
export function findLCA(
  code1: string,
  code2: string,
  tree: ICD10Tree | ATCTree
): string | null {
  // Handle same code
  if (code1 === code2) return code1;

  // Get path from code1 to root
  const path1 = getPathToRoot(code1, tree);
  const path1Set = new Set(path1);

  // Walk up from code2, first intersection is LCA
  let current: string | null = code2;
  while (current) {
    if (path1Set.has(current)) {
      return current;
    }
    const node: ICD10Node | ATCNode | undefined = tree.nodes.get(current);
    current = node?.parent ?? null;
  }

  // No common ancestor found (shouldn't happen in valid tree)
  return path1.length > 0 ? path1[path1.length - 1] : null;
}

/**
 * Calculate shortest path length between two codes
 * Path goes up to LCA then down
 */
export function shortestPathLength(
  code1: string,
  code2: string,
  tree: ICD10Tree | ATCTree
): number {
  if (code1 === code2) return 0;

  const lca = findLCA(code1, code2, tree);
  if (!lca) return Infinity;

  const node1 = tree.nodes.get(code1);
  const node2 = tree.nodes.get(code2);
  const lcaNode = tree.nodes.get(lca);

  if (!node1 || !node2 || !lcaNode) return Infinity;

  // Get depths
  const depth1 = 'depth' in node1 ? node1.depth : (node1 as ATCNode).level - 1;
  const depth2 = 'depth' in node2 ? node2.depth : (node2 as ATCNode).level - 1;
  const lcaDepth = 'depth' in lcaNode ? lcaNode.depth : (lcaNode as ATCNode).level - 1;

  return (depth1 - lcaDepth) + (depth2 - lcaDepth);
}

// ============================================
// Wu-Palmer Similarity
// ============================================

/**
 * Calculate Wu-Palmer similarity between two ICD-10 codes
 *
 * Formula: sim(c1, c2) = 2 * depth(LCA) / (depth(c1) + depth(c2))
 *
 * Returns: 0.0 (completely different) to 1.0 (identical)
 *
 * Reference: Wu & Palmer (1994) - "Verb semantics and lexical selection"
 */
export function wuPalmerSimilarityICD10(
  code1: string,
  code2: string,
  tree: ICD10Tree
): number {
  // Same code = perfect similarity
  if (code1 === code2) return 1.0;

  const node1 = tree.nodes.get(code1);
  const node2 = tree.nodes.get(code2);

  if (!node1 || !node2) return 0.0;

  const lca = findLCA(code1, code2, tree);
  if (!lca) return 0.0;

  const lcaNode = tree.nodes.get(lca);
  if (!lcaNode) return 0.0;

  // Add 1 to depths because root has depth 0 but conceptually is at level 1
  const lcaDepth = lcaNode.depth + 1;
  const depth1 = node1.depth + 1;
  const depth2 = node2.depth + 1;

  return (2 * lcaDepth) / (depth1 + depth2);
}

/**
 * Calculate Wu-Palmer similarity between two ATC codes
 */
export function wuPalmerSimilarityATC(
  code1: string,
  code2: string,
  tree: ATCTree
): number {
  // Same code = perfect similarity
  if (code1 === code2) return 1.0;

  const node1 = tree.nodes.get(code1);
  const node2 = tree.nodes.get(code2);

  if (!node1 || !node2) return 0.0;

  const lca = findLCA(code1, code2, tree);
  if (!lca) return 0.0;

  const lcaNode = tree.nodes.get(lca);
  if (!lcaNode) return 0.0;

  // ATC level is 1-indexed, use directly
  const lcaDepth = lcaNode.level;
  const depth1 = node1.level;
  const depth2 = node2.level;

  return (2 * lcaDepth) / (depth1 + depth2);
}

// ============================================
// Leacock-Chodorow Similarity (Alternative)
// ============================================

/**
 * Calculate Leacock-Chodorow similarity
 *
 * Formula: sim(c1, c2) = -log(path_length / (2 * max_depth))
 *
 * Better for distinguishing closely related concepts.
 * Normalized to 0-1 range for consistency.
 */
export function leacockChodorowSimilarity(
  code1: string,
  code2: string,
  tree: ICD10Tree | ATCTree,
  maxDepth: number
): number {
  const pathLength = shortestPathLength(code1, code2, tree);

  if (pathLength === 0) return 1.0;
  if (pathLength === Infinity) return 0.0;

  // Raw LC similarity (higher = more similar)
  const rawSim = -Math.log((pathLength + 1) / (2 * maxDepth + 1));

  // Maximum possible similarity (when path = 0, use 1 for log)
  const maxSim = -Math.log(1 / (2 * maxDepth + 1));

  // Normalize to 0-1
  return Math.max(0, Math.min(1, rawSim / maxSim));
}

// ============================================
// Multi-Code Similarity
// ============================================

/**
 * Calculate maximum pairwise similarity between two sets of codes
 * Used when concepts have multiple ICD-10 or ATC codes
 */
export function maxPairwiseSimilarity(
  codes1: string[],
  codes2: string[],
  simFn: (a: string, b: string) => number
): number {
  if (codes1.length === 0 || codes2.length === 0) return 0.0;

  let maxSim = 0;
  for (const c1 of codes1) {
    for (const c2 of codes2) {
      const sim = simFn(c1, c2);
      if (sim > maxSim) {
        maxSim = sim;
        if (maxSim === 1.0) return 1.0; // Early exit on perfect match
      }
    }
  }
  return maxSim;
}

/**
 * Calculate average pairwise similarity (alternative aggregation)
 */
export function avgPairwiseSimilarity(
  codes1: string[],
  codes2: string[],
  simFn: (a: string, b: string) => number
): number {
  if (codes1.length === 0 || codes2.length === 0) return 0.0;

  let sum = 0;
  let count = 0;

  for (const c1 of codes1) {
    for (const c2 of codes2) {
      sum += simFn(c1, c2);
      count++;
    }
  }

  return count > 0 ? sum / count : 0.0;
}

// ============================================
// Text-Based Similarity
// ============================================

/**
 * Calculate Jaccard similarity between two sets
 * Used for keyword overlap
 */
export function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  if (set1.size === 0 && set2.size === 0) return 0.0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0.0;
}

/**
 * Calculate keyword overlap similarity between two concepts
 */
export function keywordSimilarity(
  keywords1: string[],
  keywords2: string[]
): number {
  // Normalize keywords: lowercase, trim
  const set1 = new Set(keywords1.map(k => k.toLowerCase().trim()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase().trim()));

  return jaccardSimilarity(set1, set2);
}

// ============================================
// Multi-Dimensional Similarity
// ============================================

/**
 * Calculate multi-dimensional similarity between two medical concepts
 *
 * Combines:
 * - ICD-10 hierarchy similarity (40% default)
 * - ATC hierarchy similarity (20% default)
 * - ENAMED area match (15% default)
 * - Subspecialty match (15% default)
 * - Keyword overlap (10% default)
 */
export function calculateMultiDimensionalSimilarity(
  concept1: MedicalConcept,
  concept2: MedicalConcept,
  icdTree: ICD10Tree,
  atcTree: ATCTree,
  weights: SimilarityWeights = {
    icd10: 0.40,
    atc: 0.20,
    area: 0.15,
    subspecialty: 0.15,
    keyword: 0.10,
  }
): number {
  // 1. ICD-10 similarity (max over all code pairs)
  const icdSim = maxPairwiseSimilarity(
    concept1.icd10Codes,
    concept2.icd10Codes,
    (a, b) => wuPalmerSimilarityICD10(a, b, icdTree)
  );

  // 2. ATC similarity (max over all code pairs)
  const atcSim = maxPairwiseSimilarity(
    concept1.atcCodes,
    concept2.atcCodes,
    (a, b) => wuPalmerSimilarityATC(a, b, atcTree)
  );

  // 3. Area match (binary)
  const areaSim = concept1.area === concept2.area ? 1.0 : 0.0;

  // 4. Subspecialty match (binary, but only if same area)
  const subspecialtySim =
    concept1.area === concept2.area &&
    concept1.subspecialty === concept2.subspecialty
      ? 1.0
      : 0.0;

  // 5. Keyword overlap (Jaccard)
  const kwSim = keywordSimilarity(concept1.keywords, concept2.keywords);

  // Weighted combination
  return (
    weights.icd10 * icdSim +
    weights.atc * atcSim +
    weights.area * areaSim +
    weights.subspecialty * subspecialtySim +
    weights.keyword * kwSim
  );
}

/**
 * Calculate detailed similarity result with all components
 */
export function calculateSimilarityDetailed(
  concept1: MedicalConcept,
  concept2: MedicalConcept,
  icdTree: ICD10Tree,
  atcTree: ATCTree,
  weights: SimilarityWeights = {
    icd10: 0.40,
    atc: 0.20,
    area: 0.15,
    subspecialty: 0.15,
    keyword: 0.10,
  }
): {
  overall: number;
  icd10: number;
  atc: number;
  area: number;
  subspecialty: number;
  keyword: number;
  weights: SimilarityWeights;
} {
  const icd10 = maxPairwiseSimilarity(
    concept1.icd10Codes,
    concept2.icd10Codes,
    (a, b) => wuPalmerSimilarityICD10(a, b, icdTree)
  );

  const atc = maxPairwiseSimilarity(
    concept1.atcCodes,
    concept2.atcCodes,
    (a, b) => wuPalmerSimilarityATC(a, b, atcTree)
  );

  const area = concept1.area === concept2.area ? 1.0 : 0.0;

  const subspecialty =
    concept1.area === concept2.area &&
    concept1.subspecialty === concept2.subspecialty
      ? 1.0
      : 0.0;

  const keyword = keywordSimilarity(concept1.keywords, concept2.keywords);

  const overall =
    weights.icd10 * icd10 +
    weights.atc * atc +
    weights.area * area +
    weights.subspecialty * subspecialty +
    weights.keyword * keyword;

  return { overall, icd10, atc, area, subspecialty, keyword, weights };
}

// ============================================
// Pre-computed Similarity Matrix
// ============================================

/**
 * Build a pre-computed similarity matrix for fast lookup
 * O(n^2) computation, O(1) lookup afterwards
 *
 * For 368 diseases: 368^2 = 135,424 pairs = ~530KB in Float32
 */
export function buildSimilarityMatrix(
  concepts: MedicalConcept[],
  icdTree: ICD10Tree,
  atcTree: ATCTree,
  weights?: SimilarityWeights
): SimilarityMatrix {
  const n = concepts.length;
  const matrix = new Float32Array(n * n);
  const conceptIndex = new Map<string, number>();

  // Build index
  concepts.forEach((c, i) => conceptIndex.set(c.id, i));

  // Compute upper triangle (matrix is symmetric)
  for (let i = 0; i < n; i++) {
    matrix[i * n + i] = 1.0; // Self-similarity

    for (let j = i + 1; j < n; j++) {
      const sim = calculateMultiDimensionalSimilarity(
        concepts[i],
        concepts[j],
        icdTree,
        atcTree,
        weights
      );
      matrix[i * n + j] = sim;
      matrix[j * n + i] = sim; // Symmetric
    }
  }

  return { concepts, conceptIndex, matrix, size: n };
}

/**
 * Get similarity from pre-computed matrix
 * O(1) lookup
 */
export function getSimilarityFromMatrix(
  id1: string,
  id2: string,
  simMatrix: SimilarityMatrix
): number {
  const i = simMatrix.conceptIndex.get(id1);
  const j = simMatrix.conceptIndex.get(id2);

  if (i === undefined || j === undefined) return 0;

  return simMatrix.matrix[i * simMatrix.size + j];
}

/**
 * Find concepts within a similarity range from a target concept
 * Returns sorted by similarity (descending)
 */
export function findConceptsInSimilarityRange(
  targetId: string,
  simMatrix: SimilarityMatrix,
  minSim: number,
  maxSim: number,
  excludeIds?: Set<string>
): Array<{ concept: MedicalConcept; similarity: number }> {
  const targetIdx = simMatrix.conceptIndex.get(targetId);
  if (targetIdx === undefined) return [];

  const results: Array<{ concept: MedicalConcept; similarity: number }> = [];

  for (let i = 0; i < simMatrix.size; i++) {
    if (i === targetIdx) continue;

    const concept = simMatrix.concepts[i];
    if (excludeIds?.has(concept.id)) continue;

    const similarity = simMatrix.matrix[targetIdx * simMatrix.size + i];

    if (similarity >= minSim && similarity <= maxSim) {
      results.push({ concept, similarity });
    }
  }

  // Sort by similarity descending (higher similarity first)
  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Find the N most similar concepts to a target
 */
export function findMostSimilar(
  targetId: string,
  simMatrix: SimilarityMatrix,
  n: number,
  excludeIds?: Set<string>
): Array<{ concept: MedicalConcept; similarity: number }> {
  const targetIdx = simMatrix.conceptIndex.get(targetId);
  if (targetIdx === undefined) return [];

  const scored: Array<{ concept: MedicalConcept; similarity: number }> = [];

  for (let i = 0; i < simMatrix.size; i++) {
    if (i === targetIdx) continue;

    const concept = simMatrix.concepts[i];
    if (excludeIds?.has(concept.id)) continue;

    const similarity = simMatrix.matrix[targetIdx * simMatrix.size + i];
    scored.push({ concept, similarity });
  }

  // Sort and take top N
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n);
}

// ============================================
// Exports
// ============================================

export {
  ICD10_MAX_DEPTH,
  ATC_MAX_DEPTH,
};
