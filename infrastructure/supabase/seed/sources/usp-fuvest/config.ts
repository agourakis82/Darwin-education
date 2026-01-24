/**
 * USP/UNIFESP FUVEST Configuration
 * Residency exams from USP (FUVEST) and UNIFESP portals
 */

export const USP_CONFIG = {
  // FUVEST Portal URLs for USP residency exams
  fuvest: {
    baseUrl: 'https://www.fuvest.br/residencia-medica/',
    provasAnterioresPath: 'provas-anteriores/',
  },

  // Years covered (5 most recent)
  years: [2020, 2021, 2022, 2023, 2024],

  // Expected questions per year
  questionsPerYear: {
    2024: 100,
    2023: 100,
    2022: 100,
    2021: 100,
    2020: 100,
  },

  // USP metadata
  institution: 'USP/UNIFESP',
  institutionTier: 'TIER_1_NATIONAL' as const,
  examType: 'R1' as const, // Most are first-year residency
  optionCount: 5,

  // Area distribution (assumed equal distribution)
  areas: {
    clinica_medica: { start: 1, end: 20 },
    cirurgia: { start: 21, end: 40 },
    pediatria: { start: 41, end: 60 },
    ginecologia_obstetricia: { start: 61, end: 80 },
    saude_coletiva: { start: 81, end: 100 },
  },

  // Specialty-specific exams (entire exam maps to one area)
  // Format: yearPattern -> specialtyArea
  specialtyExams: {
    // Examples: "Cirurgia Geral 2023" -> "cirurgia"
    'cirurgia': 'cirurgia',
    'cirurgia geral': 'cirurgia',
    'surgery': 'cirurgia',
    'pediatria': 'pediatria',
    'pediatric': 'pediatria',
    'obstetricia': 'ginecologia_obstetricia',
    'obstetric': 'ginecologia_obstetricia',
    'ginecologia': 'ginecologia_obstetricia',
    'gynecology': 'ginecologia_obstetricia',
    'clinica medica': 'clinica_medica',
    'internal medicine': 'clinica_medica',
  },

  // PDF format variations by year (legacy formats are harder)
  formatVariations: {
    2024: 'modern', // Current standard format
    2023: 'modern',
    2022: 'standard', // Mostly standard with some variations
    2021: 'legacy', // Older format, may have images
    2020: 'legacy', // Older format, may have images
  },
};

/**
 * Map USP question position to Darwin medical area
 */
export function mapUSPAreaFromPosition(questionNumber: number, examTitle?: string): string {
  // Check if this is a specialty-specific exam
  if (examTitle) {
    const titleLower = examTitle.toLowerCase();
    for (const [pattern, area] of Object.entries(USP_CONFIG.specialtyExams)) {
      if (titleLower.includes(pattern)) {
        return area;
      }
    }
  }

  // Fall back to position-based mapping
  for (const [area, range] of Object.entries(USP_CONFIG.areas)) {
    if (questionNumber >= range.start && questionNumber <= range.end) {
      return area;
    }
  }

  return 'clinica_medica';
}

/**
 * Get PDF format for a given year
 */
export function getPDFFormatForYear(year: number): string {
  return USP_CONFIG.formatVariations[year as keyof typeof USP_CONFIG.formatVariations] ||
    'modern';
}
