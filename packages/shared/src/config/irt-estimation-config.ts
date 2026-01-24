/**
 * IRT Parameter Estimation Configuration
 * Metadata-based heuristics for estimating IRT parameters
 */

export const IRT_ESTIMATION_CONFIG = {
  difficulty: {
    baseValue: 0.0,
    minValue: -2.5,
    maxValue: 2.5,

    // Institution prestige adjustment
    institutionAdjustment: {
      TIER_1_NATIONAL: 0.4, // USP, UNIFESP, ENAMED, ENARE → harder
      TIER_2_REGIONAL_STRONG: 0.0, // Strong state programs
      TIER_3_REGIONAL: -0.25, // Smaller regional exams
    },

    // Year drift (older exams easier due to curriculum changes)
    // Example: 2020 exam (4 years ago) would be +0.4 difficulty
    // 2024 exam would be 0.0
    yearDriftPerYear: 0.1,

    // Exam type adjustment
    examTypeAdjustment: {
      R1: 0.3, // First-year residency harder
      R2: 0.0, // Baseline
      R3: -0.1, // More specialized, narrower
      national: 0.2, // National exams harder
      concurso: 0.05, // Public service exams
    },

    // Position-based adjustment (early questions easier)
    // Q1: -0.3, middle: 0, Q100: +0.3
    positionMaxAdjustment: 0.3,

    // Area-specific adjustment
    areaAdjustment: {
      clinica_medica: 0.0, // Baseline
      cirurgia: 0.15, // Surgery questions harder
      ginecologia_obstetricia: 0.1,
      pediatria: 0.05,
      saude_coletiva: -0.15, // Public health easier
    },
  },

  discrimination: {
    baseValue: 1.0,
    minValue: 0.7,
    maxValue: 1.4,

    // Institution multiplier (better-written questions discriminate better)
    institutionMultiplier: {
      TIER_1_NATIONAL: 1.2,
      TIER_2_REGIONAL_STRONG: 1.05,
      TIER_3_REGIONAL: 0.9,
    },

    // Exam type multiplier
    examTypeMultiplier: {
      R1: 1.1,
      R2: 1.0,
      R3: 1.0,
      national: 1.15,
      concurso: 1.05,
    },
  },

  guessing: {
    // Based on option count
    optionCountMap: {
      4: 0.25, // Standard 4-option MC: 1/4 chance
      5: 0.2, // 5-option MC: 1/5 chance
    },
  },
};

/**
 * Institution prestige tier classification
 * Used to determine institution adjustment and confidence levels
 */
export const INSTITUTION_TIERS = {
  // TIER 1: National-level, highly competitive exams
  TIER_1_NATIONAL: [
    'ENAMED',
    'ENARE',
    'USP',
    'UNIFESP',
    'REVALIDA',
    'UFRJ',
    'UFMG',
    'UNIRIO',
  ],

  // TIER 2: Strong regional programs with competitive selection
  TIER_2_REGIONAL_STRONG: [
    'AMRIGS', // Rio Grande do Sul
    'SURCE', // Ceará
    'UFBA', // Bahia
    'UECE', // Ceará state
    'UFPE', // Pernambuco
  ],

  // TIER 3: Smaller regional programs or less competitive exams
  TIER_3_REGIONAL: [
    'SUS-SP', // Quadrix regional
    'Small_regional_hospitals',
    'Private_institutions',
  ],
};

/**
 * Exam type classifications
 * Maps exam names to types for adjustment application
 */
export const EXAM_TYPE_MAP: Record<string, 'R1' | 'R2' | 'R3' | 'national' | 'concurso'> = {
  // R1 (first year)
  'R1': 'R1',
  'Primeiro_Ano': 'R1',
  'First_Year': 'R1',

  // R2 (second year)
  'R2': 'R2',
  'Segundo_Ano': 'R2',
  'Second_Year': 'R2',

  // R3 (third year)
  'R3': 'R3',
  'Terceiro_Ano': 'R3',
  'Third_Year': 'R3',

  // National
  'National': 'national',
  'ENAMED': 'national',
  'ENARE': 'national',
  'REVALIDA': 'national',

  // Public service (concurso)
  'Concurso': 'concurso',
  'Public_Service': 'concurso',
  'SUS': 'concurso',
};

/**
 * Medical area mappings
 * Darwin uses 5 areas, but sources may have different structures
 */
export const AREA_NAMES = {
  clinica_medica: [
    'Clínica Médica',
    'Internal Medicine',
    'Medicina Interna',
    'Clínica',
  ],
  cirurgia: ['Cirurgia', 'Surgery', 'Cirugía'],
  pediatria: ['Pediatria', 'Pediatrics', 'Pediatría'],
  ginecologia_obstetricia: [
    'Ginecologia e Obstetrícia',
    'Obstetrics and Gynecology',
    'OB/GYN',
    'Gyn',
  ],
  saude_coletiva: [
    'Saúde Coletiva',
    'Public Health',
    'Medicina Coletiva',
    'Salud Pública',
  ],
};
