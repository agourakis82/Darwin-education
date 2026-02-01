/**
 * Configuration constants for ENAMED 2025 ETL Pipeline
 */

import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
export const MICRODATA_BASE_PATH = path.resolve(
  __dirname,
  '../../../../microdados_enamed_2025_19-01-26'
);

export const ITEM_PARAMS_FILE = path.join(
  MICRODATA_BASE_PATH,
  'DADOS/microdados2025_parametros_itens.txt'
);

export const ENADE_DATA_DIR = path.join(MICRODATA_BASE_PATH, 'DADOS/Enade');
export const DEMAIS_DATA_DIR = path.join(
  MICRODATA_BASE_PATH,
  'DADOS/Demais Participantes'
);

export const OUTPUT_DIR = path.join(__dirname, 'outputs');

// INEP Portal URLs
export const INEP_BASE_URL =
  'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed';
export const INEP_PROVAS_URL = `${INEP_BASE_URL}/provas-e-gabaritos`;

// IRT Parameter Estimation
export const IRT_CONFIG = {
  // K factor for converting biserial correlation to discrimination
  // Higher K = stronger discrimination from same biserial
  K_FACTOR: 3.0,

  // Discrimination bounds
  MIN_DISCRIMINATION: 0.3,
  MAX_DISCRIMINATION: 2.5,
  DEFAULT_DISCRIMINATION: 1.0, // Rasch model fallback

  // Guessing parameter for 4-option multiple choice
  DEFAULT_GUESSING: 0.25,

  // Theta bounds
  THETA_MIN: -4,
  THETA_MAX: 4,
} as const;

// Validation thresholds
export const VALIDATION_THRESHOLDS = {
  MIN_CORRELATION: 0.9, // Pearson r between Darwin and official scores
  MAX_MAE: 0.3, // Mean Absolute Error in theta
  MAX_RMSE: 0.4, // Root Mean Square Error
  PERCENT_WITHIN_025: 0.7, // 70% of estimates within 0.25 theta
} as const;

// Data file delimiters
export const FILE_DELIMITER = ';';

// Participant data codes
export const PARTICIPANT_CODES = {
  VALID_COMPLETION: 222, // TP_PR_GER code for valid exam completion
  INVALID_ENROLLMENT: 555,
  UNANSWERED: '9',
  INVALID_MARK: '8',
  NOT_APPLICABLE: '.',
} as const;

// Area mapping (1-indexed from microdata to ENAMEDArea)
export const AREA_INDEX_MAP: Record<number, string> = {
  1: 'clinica_medica',
  2: 'cirurgia',
  3: 'pediatria',
  4: 'ginecologia_obstetricia',
  5: 'saude_coletiva',
} as const;

// Question bank configuration
export const QUESTION_BANK_CONFIG = {
  id: 'enamed-2025-official',
  name: 'ENAMED 2025 Oficial',
  description: 'Questões oficiais do ENAMED 2025 com parâmetros IRT calibrados',
  source: 'official_enamed',
  year: 2025,
  questionCount: 100,
  validItems: 90, // Items with ITEM_MANTIDO=1
} as const;
