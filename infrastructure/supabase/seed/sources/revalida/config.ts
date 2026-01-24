/**
 * REVALIDA Configuration
 * Revalidação de Diplomas Médicos (foreign medical graduates exam)
 */

export const REVALIDA_CONFIG = {
  // INEP Direct download URLs
  urls: {
    2025: 'https://download.inep.gov.br/revalida/provas/2025/revalida_2025.pdf',
    2024: 'https://download.inep.gov.br/revalida/provas/2024/revalida_2024.pdf',
    2023: 'https://download.inep.gov.br/revalida/provas/2023/revalida_2023.pdf',
  },

  // Expected objective questions per year (REVALIDA has discursive portion too, but we skip it)
  questionsPerYear: {
    2025: 80,
    2024: 80,
    2023: 80,
  },

  // REVALIDA metadata
  institution: 'INEP',
  institutionTier: 'TIER_1_NATIONAL' as const,
  examType: 'national' as const,
  optionCount: 5,

  // Area distribution - REVALIDA doesn't follow 5-area structure
  // So we use position-based mapping as fallback with LOWER confidence
  areas: {
    clinica_medica: { start: 1, end: 16 },
    cirurgia: { start: 17, end: 32 },
    pediatria: { start: 33, end: 48 },
    ginecologia_obstetricia: { start: 49, end: 64 },
    saude_coletiva: { start: 65, end: 80 },
  },

  // REVALIDA objective portion typically: Q1-80
  // Phase 2 has discursive: Q81-100 (which we skip)
  objectiveQuestionLimit: 80,
};

/**
 * Map REVALIDA question position to Darwin area
 * Note: REVALIDA doesn't follow standard 5-area structure,
 * so this is a fallback estimation that needs manual review
 */
export function mapREVALIDAAreaFromPosition(questionNumber: number): string {
  for (const [area, range] of Object.entries(REVALIDA_CONFIG.areas)) {
    if (questionNumber >= range.start && questionNumber <= range.end) {
      return area;
    }
  }
  return 'clinica_medica';
}
