/**
 * ENARE Configuration
 * Unified National Residency Exam via FGV portal
 */

export const ENARE_CONFIG = {
  // URLs for ENARE exams by year
  urls: {
    2024: 'https://conhecimento.fgv.br/concursos/enare24',
    2023: 'https://conhecimento.fgv.br/concursos/enare23',
    2022: 'https://conhecimento.fgv.br/concursos/enare22',
    2021: 'https://conhecimento.fgv.br/concursos/enare21',
  },

  // Expected questions per year
  questionsPerYear: {
    2024: 100,
    2023: 100,
    2022: 100,
    2021: 100,
  },

  // ENARE metadata
  institution: 'ENARE',
  institutionTier: 'TIER_1_NATIONAL' as const,
  examType: 'national' as const,
  optionCount: 5, // FGV typically uses 5 options

  // Area distribution (assumed equal distribution across 5 areas)
  // Each area gets ~20 questions per exam
  areas: {
    clinica_medica: { start: 1, end: 20 },
    cirurgia: { start: 21, end: 40 },
    pediatria: { start: 41, end: 60 },
    ginecologia_obstetricia: { start: 61, end: 80 },
    saude_coletiva: { start: 81, end: 100 },
  },

  // FGV HTML patterns for question extraction
  patterns: {
    // Pattern 1: Standard question format "Questão XX" or "Question XX"
    questionNumber: /[Qq]uestão\s+(\d+)|[Qq]uestion\s+(\d+)/g,

    // Pattern 2: Answer key format "Questão XX: A" or similar
    answerKey: /[Qq]uestão\s+(\d+)[:\s]+([A-E])/g,

    // Pattern 3: Table-based questions (FGV common format)
    tableQuestion: /\|\s*(\d+)\s*\|([^|]+)\|([A-E])\s*\|/g,
  },
};

/**
 * Map ENARE area names to Darwin canonical areas
 */
export function mapENAREAreaFromPosition(questionNumber: number): string {
  for (const [area, range] of Object.entries(ENARE_CONFIG.areas)) {
    if (questionNumber >= range.start && questionNumber <= range.end) {
      return area;
    }
  }
  return 'clinica_medica'; // Default fallback
}
