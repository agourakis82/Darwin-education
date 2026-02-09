/**
 * Darwin Education - CIP Puzzle Generator
 * ========================================
 *
 * Generates Comprehensive Integrative Puzzle (CIP) assessments
 * using semantic similarity for distractor selection.
 */

import type { DifficultyLevel, IRTParameters } from '../types/education';
import type { ICD10Tree, ATCTree, MedicalConcept } from '../types/ontology';
import type {
  CIPSection,
  CIPFinding,
  CIPDiagnosis,
  CIPPuzzle,
  CIPCell,
  CIPDifficultySettings,
  CIPGenerationOptions,
  SimilarityWeights,
} from '../types/cip';
import { CIP_DIFFICULTY_PRESETS } from '../types/cip';
import {
  selectDistractorsForFinding,
  shuffleArray,
  deduplicateById,
} from './distractor';
import { calculateMultiDimensionalSimilarity } from './similarity';

// ============================================
// Puzzle Generation
// ============================================

/**
 * Generate a complete CIP puzzle
 *
 * @param availableDiagnoses - Pool of diagnoses to choose from
 * @param availableFindings - Pool of findings for distractors
 * @param options - Generation options (difficulty, areas, etc.)
 * @param icdTree - ICD-10 hierarchy for similarity
 * @param atcTree - ATC hierarchy for similarity
 * @returns Generated CIP puzzle
 */
export function generateCIPPuzzle(
  availableDiagnoses: CIPDiagnosis[],
  availableFindings: CIPFinding[],
  options: CIPGenerationOptions,
  icdTree: ICD10Tree,
  atcTree: ATCTree
): CIPPuzzle {
  const {
    difficulty,
    customSettings,
    areas,
    timeLimitMinutes,
    title,
    similarityWeights,
  } = options;

  // Get base settings from preset, apply custom overrides
  const baseSettings = CIP_DIFFICULTY_PRESETS[difficulty];
  const settings: CIPDifficultySettings = {
    ...baseSettings,
    ...customSettings,
  };

  // Step 1: Select diagnoses
  const selectedDiagnoses = selectDiagnoses(
    availableDiagnoses,
    settings.diagnosisCount,
    areas,
    icdTree,
    atcTree,
    similarityWeights
  );

  // Step 2: Build the grid and collect correct findings
  const grid: CIPCell[][] = [];
  const correctFindingsBySection: Record<CIPSection, CIPFinding[]> = {
    medical_history: [],
    physical_exam: [],
    laboratory: [],
    imaging: [],
    pathology: [],
    treatment: [],
  };

  for (let rowIndex = 0; rowIndex < selectedDiagnoses.length; rowIndex++) {
    const diagnosis = selectedDiagnoses[rowIndex];
    const row: CIPCell[] = [];

    for (const section of settings.sections) {
      const diagnosisFindings = diagnosis.findings[section];

      if (!diagnosisFindings || diagnosisFindings.length === 0) {
        throw new Error(
          `Diagnosis "${diagnosis.namePt}" is missing findings for section "${section}"`
        );
      }

      // Use the first (primary) finding as the correct answer
      const correctFinding = diagnosisFindings[0];
      correctFindingsBySection[section].push(correctFinding);

      row.push({
        row: rowIndex,
        column: section,
        correctFindingId: correctFinding.id,
        selectedFindingId: null,
      });
    }

    grid.push(row);
  }

  // Step 3: Select distractors and build options for each section
  const optionsPerSection: Record<CIPSection, CIPFinding[]> = {
    medical_history: [],
    physical_exam: [],
    laboratory: [],
    imaging: [],
    pathology: [],
    treatment: [],
  };

  for (const section of settings.sections) {
    const correctFindings = correctFindingsBySection[section];
    const sectionFindings = availableFindings.filter(f => f.section === section);

    // Collect distractors for all correct findings in this section
    const allDistractors: CIPFinding[] = [];
    const excludeIds = new Set(correctFindings.map(f => f.id));

    for (const correct of correctFindings) {
      const distractorCandidates = selectDistractorsForFinding(
        correct,
        sectionFindings,
        {
          targetDifficulty: difficulty,
          numDistractors: Math.ceil(settings.distractorCount / correctFindings.length) + 1,
          excludeIds,
          diversityWeight: 0.3,
          weights: similarityWeights,
        },
        icdTree,
        atcTree
      );

      for (const dc of distractorCandidates) {
        if (!excludeIds.has(dc.finding.id)) {
          allDistractors.push(dc.finding);
          excludeIds.add(dc.finding.id);
        }
      }
    }

    // Combine correct + distractors, limit to target count, shuffle
    const uniqueDistractors = deduplicateById(allDistractors).slice(
      0,
      settings.distractorCount
    );
    const allOptions = [...correctFindings, ...uniqueDistractors];
    optionsPerSection[section] = shuffleArray(deduplicateById(allOptions));
  }

  // Step 4: Calculate puzzle IRT parameters
  const irt = calculatePuzzleIRT(selectedDiagnoses, settings);

  // Step 5: Calculate time limit
  const calculatedTimeLimit =
    timeLimitMinutes || calculateTimeLimit(settings);

  // Step 6: Build puzzle object
  const puzzleId = generateId();
  const puzzleTitle =
    title ||
    `Quebra-Cabeça Clínico - ${settings.diagnosisCount} Diagnósticos`;

  const puzzleAreas = areas || [
    ...new Set(selectedDiagnoses.map(d => d.area)),
  ];

  return {
    id: puzzleId,
    title: puzzleTitle,
    description: generateDescription(settings, difficulty),
    areas: puzzleAreas,
    difficulty,
    settings,
    diagnoses: selectedDiagnoses,
    grid,
    optionsPerSection,
    timeLimitMinutes: calculatedTimeLimit,
    irt,
    type: 'practice',
    isAIGenerated: true,
    createdBy: 'system',
    createdAt: new Date(),
  };
}

// ============================================
// Diagnosis Selection
// ============================================

/**
 * Select diagnoses for a puzzle, maximizing semantic diversity
 */
export function selectDiagnoses(
  available: CIPDiagnosis[],
  count: number,
  areas?: string[],
  icdTree?: ICD10Tree,
  atcTree?: ATCTree,
  weights?: SimilarityWeights
): CIPDiagnosis[] {
  // Filter by areas if specified
  let candidates = available;
  if (areas && areas.length > 0) {
    candidates = available.filter(d => areas.includes(d.area));
  }

  if (candidates.length < count) {
    throw new Error(
      `Not enough diagnoses available. Need ${count}, have ${candidates.length}`
    );
  }

  // If no trees provided, use random selection
  if (!icdTree || !atcTree) {
    return shuffleArray(candidates).slice(0, count);
  }

  // Greedy selection: maximize minimum distance between selected diagnoses
  const selected: CIPDiagnosis[] = [];
  const remaining = [...candidates];

  // Start with a random diagnosis
  const firstIdx = Math.floor(Math.random() * remaining.length);
  selected.push(remaining.splice(firstIdx, 1)[0]);

  // Greedily add most different diagnoses
  while (selected.length < count && remaining.length > 0) {
    let bestIdx = 0;
    let bestMinDistance = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let minDistance = Infinity;

      // Find minimum distance to any selected diagnosis
      for (const s of selected) {
        const candidateConcept = diagnosisToMedicalConcept(candidate);
        const selectedConcept = diagnosisToMedicalConcept(s);

        const similarity = calculateMultiDimensionalSimilarity(
          candidateConcept,
          selectedConcept,
          icdTree,
          atcTree,
          weights
        );

        const distance = 1 - similarity;
        if (distance < minDistance) {
          minDistance = distance;
        }
      }

      // We want the candidate with the maximum minimum distance
      if (minDistance > bestMinDistance) {
        bestMinDistance = minDistance;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

/**
 * Convert CIPDiagnosis to MedicalConcept for similarity calculation
 */
function diagnosisToMedicalConcept(diagnosis: CIPDiagnosis): MedicalConcept {
  return {
    id: diagnosis.id,
    name: diagnosis.namePt,
    icd10Codes: [diagnosis.icd10Code, ...diagnosis.icd10CodesSecondary],
    atcCodes: extractATCFromFindings(diagnosis.findings),
    area: diagnosis.area,
    subspecialty: diagnosis.subspecialty,
    topic: diagnosis.namePt,
    keywords: diagnosis.keywords,
  };
}

/**
 * Extract ATC codes from treatment findings
 */
function extractATCFromFindings(
  findings: Record<CIPSection, CIPFinding[]>
): string[] {
  const treatmentFindings = findings.treatment || [];
  const atcCodes: string[] = [];

  for (const finding of treatmentFindings) {
    atcCodes.push(...finding.atcCodes);
  }

  return [...new Set(atcCodes)];
}

// ============================================
// IRT Calculation
// ============================================

/**
 * Calculate overall IRT parameters for a puzzle
 */
export function calculatePuzzleIRT(
  diagnoses: CIPDiagnosis[],
  settings: CIPDifficultySettings
): IRTParameters {
  // Base difficulty from number of diagnoses (4-7)
  // 4 diagnoses = 0, 7 diagnoses = 1.5
  let difficulty = (settings.diagnosisCount - 4) * 0.5;

  // Adjust for number of sections
  // More sections = harder
  difficulty += (settings.sections.length - 3) * 0.2;

  // Adjust for distractor count
  difficulty += (settings.distractorCount - 2) * 0.25;

  // Adjust for reuse policy (not allowing reuse is harder)
  if (!settings.allowReuse) {
    difficulty += 0.3;
  }

  // Adjust for diagnosis difficulty tiers
  const avgTier =
    diagnoses.reduce((sum, d) => sum + d.difficultyTier, 0) / diagnoses.length;
  difficulty += (avgTier - 3) * 0.3;

  // Clamp to reasonable range
  difficulty = Math.max(-2, Math.min(2, difficulty));

  // CIP typically has good discrimination (multi-dimensional assessment)
  const discrimination = 1.2;

  // Guessing is lower than MCQ because matching is harder
  // Probability of randomly matching all cells correctly is very low
  const cellCount = settings.diagnosisCount * settings.sections.length;
  const optionsPerCell = settings.diagnosisCount + settings.distractorCount;
  const guessing = Math.pow(1 / optionsPerCell, cellCount);

  return {
    difficulty,
    discrimination,
    guessing: Math.max(0.01, Math.min(0.1, guessing)), // Clamp to reasonable range
  };
}

// ============================================
// Time Calculation
// ============================================

/**
 * Calculate recommended time limit in minutes
 */
export function calculateTimeLimit(settings: CIPDifficultySettings): number {
  // Base: 2 minutes per cell
  const cellCount = settings.diagnosisCount * settings.sections.length;
  const baseTime = cellCount * 2;

  // Add buffer for reading and review
  const buffer = Math.ceil(cellCount * 0.5);

  return baseTime + buffer;
}

// ============================================
// Description Generation
// ============================================

/**
 * Generate puzzle description based on settings
 */
export function generateDescription(
  settings: CIPDifficultySettings,
  difficulty: DifficultyLevel
): string {
  const difficultyLabels: Record<DifficultyLevel, string> = {
    muito_facil: 'Muito Fácil',
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
    muito_dificil: 'Muito Difícil',
  };

  const sectionNames = settings.sections.map(s => {
    const labels: Record<CIPSection, string> = {
      medical_history: 'Anamnese',
      physical_exam: 'Exame Físico',
      laboratory: 'Laboratório',
      imaging: 'Imagem/ECG',
      pathology: 'Patologia',
      treatment: 'Tratamento',
    };
    return labels[s];
  });

  const reuseText = settings.allowReuse
    ? 'Cada opção pode ser usada mais de uma vez.'
    : 'Cada opção só pode ser usada uma vez.';

  return (
    `Nível: ${difficultyLabels[difficulty]}. ` +
    `Associe cada diagnóstico às opções corretas de ${sectionNames.join(', ')}. ` +
    reuseText
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return 'cip_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate a puzzle structure
 */
export function validatePuzzle(puzzle: CIPPuzzle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check diagnosis count
  if (puzzle.diagnoses.length !== puzzle.settings.diagnosisCount) {
    errors.push(
      `Expected ${puzzle.settings.diagnosisCount} diagnoses, got ${puzzle.diagnoses.length}`
    );
  }

  // Check grid dimensions
  if (puzzle.grid.length !== puzzle.diagnoses.length) {
    errors.push('Grid row count does not match diagnosis count');
  }

  for (let i = 0; i < puzzle.grid.length; i++) {
    if (puzzle.grid[i].length !== puzzle.settings.sections.length) {
      errors.push(`Row ${i} has wrong number of cells`);
    }
  }

  // Check that all correct findings exist in options
  for (const row of puzzle.grid) {
    for (const cell of row) {
      const options = puzzle.optionsPerSection[cell.column];
      const correctExists = options.some(f => f.id === cell.correctFindingId);
      if (!correctExists) {
        errors.push(
          `Correct finding ${cell.correctFindingId} not in options for section ${cell.column}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get cell key for state management
 */
export function getCellKey(row: number, section: CIPSection): string {
  return `${row}_${section}`;
}

/**
 * Parse cell key back to row and section
 */
export function parseCellKey(key: string): { row: number; section: CIPSection } {
  const underscoreIndex = key.indexOf('_');
  const rowStr = key.substring(0, underscoreIndex);
  const section = key.substring(underscoreIndex + 1);
  return {
    row: parseInt(rowStr, 10),
    section: section as CIPSection,
  };
}
