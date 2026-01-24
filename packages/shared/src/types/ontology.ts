/**
 * Darwin Education - Medical Ontology Types
 * ==========================================
 *
 * Types for ICD-10 and ATC hierarchies used in semantic similarity
 * calculations for CIP distractor generation.
 */

// ============================================
// ICD-10 Hierarchy Types
// ============================================

/**
 * ICD-10 hierarchy levels
 *
 * Structure:
 * - Chapter (I-XXII): e.g., "IX - Diseases of the circulatory system"
 * - Block: e.g., "I10-I15" (Hypertensive diseases)
 * - Category: e.g., "I10" (Essential hypertension)
 * - Subcategory: e.g., "I10.0" (Benign essential hypertension)
 */
export type ICD10Level = 'chapter' | 'block' | 'category' | 'subcategory';

/**
 * A node in the ICD-10 hierarchy tree
 */
export interface ICD10Node {
  /** ICD-10 code (e.g., "I10", "I10-I15", "IX") */
  code: string;
  /** Human-readable name in Portuguese */
  namePt: string;
  /** Human-readable name in English */
  nameEn?: string;
  /** Hierarchy level */
  level: ICD10Level;
  /** Parent code (null for chapters) */
  parent: string | null;
  /** Child codes */
  children: string[];
  /** Depth in tree (0 for chapter, 1 for block, etc.) */
  depth: number;
}

/**
 * Complete ICD-10 tree structure
 */
export interface ICD10Tree {
  /** Map of code -> node */
  nodes: Map<string, ICD10Node>;
  /** Root chapter codes */
  chapters: string[];
  /** Total number of leaf nodes */
  leafCount: number;
}

/**
 * Pre-computed index for efficient ICD-10 lookups
 */
export interface ICD10Index {
  /** The full tree */
  tree: ICD10Tree;
  /** Category code -> Chapter code lookup */
  categoryToChapter: Map<string, string>;
  /** Category code -> Block code lookup */
  categoryToBlock: Map<string, string>;
  /** Cached LCA (Lowest Common Ancestor) computations */
  lcaCache: Map<string, string>;
}

/**
 * ICD-10 chapter definitions (22 chapters)
 */
export const ICD10_CHAPTERS: Record<string, { namePt: string; nameEn: string; range: string }> = {
  'I': { namePt: 'Doenças infecciosas e parasitárias', nameEn: 'Infectious and parasitic diseases', range: 'A00-B99' },
  'II': { namePt: 'Neoplasias', nameEn: 'Neoplasms', range: 'C00-D48' },
  'III': { namePt: 'Doenças do sangue e órgãos hematopoiéticos', nameEn: 'Diseases of blood and blood-forming organs', range: 'D50-D89' },
  'IV': { namePt: 'Doenças endócrinas, nutricionais e metabólicas', nameEn: 'Endocrine, nutritional and metabolic diseases', range: 'E00-E90' },
  'V': { namePt: 'Transtornos mentais e comportamentais', nameEn: 'Mental and behavioural disorders', range: 'F00-F99' },
  'VI': { namePt: 'Doenças do sistema nervoso', nameEn: 'Diseases of the nervous system', range: 'G00-G99' },
  'VII': { namePt: 'Doenças do olho e anexos', nameEn: 'Diseases of the eye and adnexa', range: 'H00-H59' },
  'VIII': { namePt: 'Doenças do ouvido e da apófise mastoide', nameEn: 'Diseases of the ear and mastoid process', range: 'H60-H95' },
  'IX': { namePt: 'Doenças do aparelho circulatório', nameEn: 'Diseases of the circulatory system', range: 'I00-I99' },
  'X': { namePt: 'Doenças do aparelho respiratório', nameEn: 'Diseases of the respiratory system', range: 'J00-J99' },
  'XI': { namePt: 'Doenças do aparelho digestivo', nameEn: 'Diseases of the digestive system', range: 'K00-K93' },
  'XII': { namePt: 'Doenças da pele e do tecido subcutâneo', nameEn: 'Diseases of the skin and subcutaneous tissue', range: 'L00-L99' },
  'XIII': { namePt: 'Doenças do sistema osteomuscular e do tecido conjuntivo', nameEn: 'Diseases of the musculoskeletal system', range: 'M00-M99' },
  'XIV': { namePt: 'Doenças do aparelho geniturinário', nameEn: 'Diseases of the genitourinary system', range: 'N00-N99' },
  'XV': { namePt: 'Gravidez, parto e puerpério', nameEn: 'Pregnancy, childbirth and the puerperium', range: 'O00-O99' },
  'XVI': { namePt: 'Afecções originadas no período perinatal', nameEn: 'Conditions originating in the perinatal period', range: 'P00-P96' },
  'XVII': { namePt: 'Malformações congênitas e anomalias cromossômicas', nameEn: 'Congenital malformations', range: 'Q00-Q99' },
  'XVIII': { namePt: 'Sintomas, sinais e achados anormais', nameEn: 'Symptoms, signs and abnormal findings', range: 'R00-R99' },
  'XIX': { namePt: 'Lesões, envenenamentos e causas externas', nameEn: 'Injury, poisoning and external causes', range: 'S00-T98' },
  'XX': { namePt: 'Causas externas de morbidade e mortalidade', nameEn: 'External causes of morbidity and mortality', range: 'V01-Y98' },
  'XXI': { namePt: 'Fatores que influenciam o estado de saúde', nameEn: 'Factors influencing health status', range: 'Z00-Z99' },
  'XXII': { namePt: 'Códigos para propósitos especiais', nameEn: 'Codes for special purposes', range: 'U00-U99' },
};

// ============================================
// ATC Hierarchy Types
// ============================================

/**
 * ATC (Anatomical Therapeutic Chemical) hierarchy levels
 *
 * Structure (7 characters total):
 * - Level 1 (1 char): Anatomical main group (e.g., "C" = Cardiovascular)
 * - Level 2 (3 chars): Therapeutic subgroup (e.g., "C09" = RAAS agents)
 * - Level 3 (4 chars): Pharmacological subgroup (e.g., "C09A" = ACE inhibitors)
 * - Level 4 (5 chars): Chemical subgroup (e.g., "C09AA" = ACE inhibitors, plain)
 * - Level 5 (7 chars): Chemical substance (e.g., "C09AA01" = captopril)
 */
export type ATCLevel = 1 | 2 | 3 | 4 | 5;

/**
 * A node in the ATC hierarchy tree
 */
export interface ATCNode {
  /** ATC code (e.g., "C09AA01") */
  code: string;
  /** Human-readable name in Portuguese */
  namePt: string;
  /** Human-readable name in English */
  nameEn?: string;
  /** Hierarchy level (1-5) */
  level: ATCLevel;
  /** Parent code (null for level 1) */
  parent: string | null;
  /** Child codes */
  children: string[];
}

/**
 * Complete ATC tree structure
 */
export interface ATCTree {
  /** Map of code -> node */
  nodes: Map<string, ATCNode>;
  /** Root codes (level 1: A-V) */
  roots: string[];
  /** Total number of substances (level 5) */
  substanceCount: number;
}

/**
 * ATC Level 1 (Anatomical main groups)
 */
export const ATC_MAIN_GROUPS: Record<string, { namePt: string; nameEn: string }> = {
  'A': { namePt: 'Aparelho digestivo e metabolismo', nameEn: 'Alimentary tract and metabolism' },
  'B': { namePt: 'Sangue e órgãos hematopoiéticos', nameEn: 'Blood and blood forming organs' },
  'C': { namePt: 'Aparelho cardiovascular', nameEn: 'Cardiovascular system' },
  'D': { namePt: 'Medicamentos dermatológicos', nameEn: 'Dermatologicals' },
  'G': { namePt: 'Aparelho geniturinário e hormônios sexuais', nameEn: 'Genito-urinary system and sex hormones' },
  'H': { namePt: 'Hormônios sistêmicos, exceto sexuais', nameEn: 'Systemic hormonal preparations' },
  'J': { namePt: 'Anti-infecciosos gerais para uso sistêmico', nameEn: 'Antiinfectives for systemic use' },
  'L': { namePt: 'Agentes antineoplásicos e imunomoduladores', nameEn: 'Antineoplastic and immunomodulating agents' },
  'M': { namePt: 'Sistema musculoesquelético', nameEn: 'Musculo-skeletal system' },
  'N': { namePt: 'Sistema nervoso', nameEn: 'Nervous system' },
  'P': { namePt: 'Produtos antiparasitários', nameEn: 'Antiparasitic products' },
  'R': { namePt: 'Aparelho respiratório', nameEn: 'Respiratory system' },
  'S': { namePt: 'Órgãos sensoriais', nameEn: 'Sensory organs' },
  'V': { namePt: 'Vários', nameEn: 'Various' },
};

// ============================================
// Ontology Utility Types
// ============================================

/**
 * Result of a similarity calculation
 */
export interface SimilarityResult {
  /** Similarity score (0-1) */
  similarity: number;
  /** Path length between concepts */
  pathLength: number;
  /** Lowest Common Ancestor code */
  lca: string;
  /** Depth of LCA in hierarchy */
  lcaDepth: number;
}

/**
 * Medical concept for similarity calculations
 */
export interface MedicalConcept {
  /** Unique identifier */
  id: string;
  /** Concept name */
  name: string;
  /** Primary ICD-10 codes */
  icd10Codes: string[];
  /** Associated ATC medication codes */
  atcCodes: string[];
  /** ENAMED specialty area */
  area: string;
  /** Subspecialty */
  subspecialty: string;
  /** Topic/condition */
  topic: string;
  /** Keywords for text-based similarity */
  keywords: string[];
}

/**
 * Pre-computed similarity matrix for fast lookup
 */
export interface SimilarityMatrix {
  /** Concepts in order */
  concepts: MedicalConcept[];
  /** Concept ID -> index lookup */
  conceptIndex: Map<string, number>;
  /** Flattened n x n matrix (Float32Array for memory efficiency) */
  matrix: Float32Array;
  /** Matrix dimension */
  size: number;
}

// ============================================
// Tree Construction Helpers
// ============================================

/**
 * Parse ICD-10 code to determine its level
 */
export function getICD10Level(code: string): ICD10Level {
  // Roman numeral = chapter
  if (/^[IVX]+$/.test(code)) return 'chapter';
  // Range like "I10-I15" = block
  if (code.includes('-')) return 'block';
  // Has decimal = subcategory
  if (code.includes('.')) return 'subcategory';
  // Otherwise = category
  return 'category';
}

/**
 * Get depth for ICD-10 level
 */
export function getICD10Depth(level: ICD10Level): number {
  switch (level) {
    case 'chapter': return 0;
    case 'block': return 1;
    case 'category': return 2;
    case 'subcategory': return 3;
  }
}

/**
 * Parse ATC code to determine its level
 */
export function getATCLevel(code: string): ATCLevel {
  const len = code.length;
  if (len === 1) return 1;
  if (len === 3) return 2;
  if (len === 4) return 3;
  if (len === 5) return 4;
  return 5; // 7 characters
}

/**
 * Get parent ATC code
 */
export function getATCParent(code: string): string | null {
  const level = getATCLevel(code);
  switch (level) {
    case 1: return null;
    case 2: return code.substring(0, 1);
    case 3: return code.substring(0, 3);
    case 4: return code.substring(0, 4);
    case 5: return code.substring(0, 5);
    default: return null;
  }
}

/**
 * Extract letter prefix from ICD-10 category (e.g., "I10" -> "I")
 */
export function getICD10LetterPrefix(code: string): string {
  const match = code.match(/^[A-Z]+/);
  return match ? match[0] : '';
}

/**
 * Determine which ICD-10 chapter a category belongs to based on letter
 */
export function getICD10ChapterForLetter(letter: string): string | null {
  const chapterMap: Record<string, string> = {
    'A': 'I', 'B': 'I',           // Infectious diseases
    'C': 'II', 'D': 'II',         // Neoplasms (D00-D48), Blood (D50-D89)
    'E': 'IV',                     // Endocrine
    'F': 'V',                      // Mental
    'G': 'VI',                     // Nervous system
    'H': 'VII',                    // Eye (H00-H59), Ear (H60-H95) - simplified
    'I': 'IX',                     // Circulatory
    'J': 'X',                      // Respiratory
    'K': 'XI',                     // Digestive
    'L': 'XII',                    // Skin
    'M': 'XIII',                   // Musculoskeletal
    'N': 'XIV',                    // Genitourinary
    'O': 'XV',                     // Pregnancy
    'P': 'XVI',                    // Perinatal
    'Q': 'XVII',                   // Congenital
    'R': 'XVIII',                  // Symptoms
    'S': 'XIX', 'T': 'XIX',        // Injury
    'V': 'XX', 'W': 'XX', 'X': 'XX', 'Y': 'XX', // External causes
    'Z': 'XXI',                    // Factors influencing health
    'U': 'XXII',                   // Special purposes
  };
  return chapterMap[letter] || null;
}
