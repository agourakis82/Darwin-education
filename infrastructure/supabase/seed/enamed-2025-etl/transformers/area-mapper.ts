/**
 * Area Mapper
 * Maps area indices from microdata to ENAMEDArea types
 */

import { AREA_INDEX_MAP } from '../config';
import type { ENAMEDArea } from '../types';

/**
 * Map numeric area index to ENAMEDArea type
 */
export function mapAreaIndex(index: number): ENAMEDArea {
  const area = AREA_INDEX_MAP[index];
  if (!area) {
    throw new Error(`Unknown area index: ${index}`);
  }
  return area as ENAMEDArea;
}

/**
 * Map ENAMEDArea to numeric index
 */
export function areaToIndex(area: ENAMEDArea): number {
  const entries = Object.entries(AREA_INDEX_MAP);
  const entry = entries.find(([_, value]) => value === area);
  if (!entry) {
    throw new Error(`Unknown area: ${area}`);
  }
  return parseInt(entry[0], 10);
}

/**
 * Get area display name in Portuguese
 */
export function getAreaDisplayName(area: ENAMEDArea): string {
  const names: Record<ENAMEDArea, string> = {
    clinica_medica: 'Clínica Médica',
    cirurgia: 'Cirurgia',
    pediatria: 'Pediatria',
    ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
    saude_coletiva: 'Saúde Coletiva',
  };
  return names[area];
}

/**
 * Get all ENAMED areas
 */
export function getAllAreas(): ENAMEDArea[] {
  return [
    'clinica_medica',
    'cirurgia',
    'pediatria',
    'ginecologia_obstetricia',
    'saude_coletiva',
  ];
}

/**
 * Infer area from question position
 * ENAMED typically has 20 questions per area (100 questions / 5 areas)
 *
 * Default mapping (may vary by year):
 * - Questions 1-20: Clínica Médica
 * - Questions 21-40: Cirurgia
 * - Questions 41-60: Pediatria
 * - Questions 61-80: Ginecologia e Obstetrícia
 * - Questions 81-100: Saúde Coletiva
 */
export function inferAreaFromPosition(questionNumber: number): ENAMEDArea {
  if (questionNumber < 1 || questionNumber > 100) {
    throw new Error(`Invalid question number: ${questionNumber}`);
  }

  if (questionNumber <= 20) return 'clinica_medica';
  if (questionNumber <= 40) return 'cirurgia';
  if (questionNumber <= 60) return 'pediatria';
  if (questionNumber <= 80) return 'ginecologia_obstetricia';
  return 'saude_coletiva';
}

/**
 * Get question range for an area
 */
export function getQuestionRangeForArea(area: ENAMEDArea): { start: number; end: number } {
  const ranges: Record<ENAMEDArea, { start: number; end: number }> = {
    clinica_medica: { start: 1, end: 20 },
    cirurgia: { start: 21, end: 40 },
    pediatria: { start: 41, end: 60 },
    ginecologia_obstetricia: { start: 61, end: 80 },
    saude_coletiva: { start: 81, end: 100 },
  };
  return ranges[area];
}

/**
 * Validate area assignment based on participant data
 * Compares expected question counts with actual area correct counts
 */
export function validateAreaAssignment(
  areaCorrects: Record<number, number>
): {
  valid: boolean;
  expectedTotal: number;
  actualTotal: number;
  discrepancy: number;
} {
  const actualTotal = Object.values(areaCorrects).reduce((a, b) => a + b, 0);
  const expectedTotal = 100; // Total questions

  return {
    valid: actualTotal <= expectedTotal,
    expectedTotal,
    actualTotal,
    discrepancy: Math.abs(expectedTotal - actualTotal),
  };
}
