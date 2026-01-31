/**
 * Question Pattern Analyzer
 * ==========================
 *
 * Extracts and analyzes question construction patterns from ENAMED corpus
 * Identifies common templates, distractor strategies, and IRT characteristics
 *
 * @module packages/shared/src/analyzers/question-patterns
 */

import { QuestionPatternType, OntologyRelationship } from '../types/schema-medical';
import { ENAMEDArea } from '../types/education';

// ============================================
// Types
// ============================================

/**
 * Question stem template with variable placeholders
 */
export interface StemTemplate {
  pattern: QuestionPatternType;
  template: string; // Template with {variable} placeholders
  variables: TemplateVariable[];
  examples: string[];
  frequency: number; // How often this template appears
}

/**
 * Template variable
 */
export interface TemplateVariable {
  name: string; // e.g., "age", "sex", "chief_complaint"
  type: 'demographic' | 'symptom' | 'finding' | 'test' | 'medication';
  required: boolean;
  examples: string[];
}

/**
 * Distractor selection strategy
 */
export interface DistractorStrategy {
  name: string;
  description: string;

  // Semantic similarity requirements
  targetSimilarity: [number, number]; // Min-max Wu-Palmer similarity
  diversityWeight: number; // 0-1, higher = more diverse

  // Ontology relationship types to consider
  relationshipTypes: string[]; // e.g., ['similar_to', 'same_system', 'differential_dx']

  // Examples
  examples: Array<{
    correct: string;
    distractors: string[];
    similarity: number[];
  }>;
}

/**
 * Complete question pattern
 */
export interface QuestionPattern {
  id: string;
  name: string;
  pattern: QuestionPatternType;
  frequency: number; // Proportion of questions using this pattern

  // Template structure
  stemTemplate: StemTemplate;
  distractorStrategy: DistractorStrategy;

  // IRT characteristics
  typicalDifficulty: [number, number]; // Range [min, max]
  typicalDiscrimination: [number, number];

  // Ontology requirements
  requiredRelationships: OntologyRelationship[];

  // Area distribution
  areaDistribution: Record<ENAMEDArea, number>; // Proportion per area

  // Examples from corpus
  examples: string[];
}

// ============================================
// Pattern Definitions
// ============================================

/**
 * Clinical vignette diagnosis pattern
 */
export const CLINICAL_VIGNETTE_DIAGNOSIS: QuestionPattern = {
  id: 'clinical-vignette-diagnosis',
  name: 'Vinheta Clínica - Diagnóstico',
  pattern: 'clinical_vignette_diagnosis',
  frequency: 0.45, // 45% of ENAMED questions

  stemTemplate: {
    pattern: 'clinical_vignette_diagnosis',
    template:
      'Paciente de {age} anos, {sex}, apresenta-se com {chief_complaint} há {duration}. ' +
      'Ao exame físico: {physical_findings}. {lab_findings}. ' +
      'Qual o diagnóstico mais provável?',
    variables: [
      {
        name: 'age',
        type: 'demographic',
        required: true,
        examples: ['35', '62', '8', '45'],
      },
      {
        name: 'sex',
        type: 'demographic',
        required: true,
        examples: ['masculino', 'feminino'],
      },
      {
        name: 'chief_complaint',
        type: 'symptom',
        required: true,
        examples: [
          'dor torácica',
          'dispneia',
          'febre e tosse',
          'dor abdominal',
        ],
      },
      {
        name: 'duration',
        type: 'demographic',
        required: true,
        examples: ['3 dias', '1 semana', '2 meses', '6 horas'],
      },
      {
        name: 'physical_findings',
        type: 'finding',
        required: true,
        examples: [
          'estertores bibasais',
          'abdome distendido e doloroso',
          'edema de membros inferiores',
        ],
      },
      {
        name: 'lab_findings',
        type: 'test',
        required: false,
        examples: [
          'Hemoglobina: 8 g/dL',
          'Leucócitos: 18.000/mm³',
          'Creatinina: 3.2 mg/dL',
        ],
      },
    ],
    examples: [
      'Paciente de 65 anos, masculino, apresenta-se com dispneia progressiva há 2 semanas. ' +
      'Ao exame físico: estertores bibasais, edema de MMII 3+/4+. ' +
      'Radiografia de tórax: cardiomegalia e congestão pulmonar. ' +
      'Qual o diagnóstico mais provável?',
    ],
    frequency: 0.45,
  },

  distractorStrategy: {
    name: 'Similar Presentation',
    description:
      'Selecionar condições com apresentação clínica semelhante, usando hierarquia ICD-10',
    targetSimilarity: [0.55, 0.75], // Moderately similar
    diversityWeight: 0.3,
    relationshipTypes: ['similar_to', 'differential_diagnosis'],
    examples: [
      {
        correct: 'Insuficiência Cardíaca Congestiva',
        distractors: [
          'Embolia Pulmonar',
          'Doença Pulmonar Obstrutiva Crônica',
          'Pneumonia',
        ],
        similarity: [0.65, 0.58, 0.52],
      },
    ],
  },

  typicalDifficulty: [-0.5, 1.5],
  typicalDiscrimination: [1.0, 1.8],

  requiredRelationships: [
    {
      source: 'symptom',
      target: 'condition',
      type: 'is_symptom_of',
    },
    {
      source: 'test',
      target: 'condition',
      type: 'diagnoses',
    },
  ],

  areaDistribution: {
    clinica_medica: 0.35,
    cirurgia: 0.20,
    ginecologia_obstetricia: 0.15,
    pediatria: 0.20,
    saude_coletiva: 0.10,
  },

  examples: [],
};

/**
 * Clinical vignette treatment pattern
 */
export const CLINICAL_VIGNETTE_TREATMENT: QuestionPattern = {
  id: 'clinical-vignette-treatment',
  name: 'Vinheta Clínica - Tratamento',
  pattern: 'clinical_vignette_treatment',
  frequency: 0.25,

  stemTemplate: {
    pattern: 'clinical_vignette_treatment',
    template:
      'Paciente com diagnóstico de {condition}. {additional_context}. ' +
      'Qual a conduta mais adequada?',
    variables: [
      {
        name: 'condition',
        type: 'symptom',
        required: true,
        examples: [
          'hipertensão arterial sistêmica',
          'diabetes mellitus tipo 2',
          'pneumonia adquirida na comunidade',
        ],
      },
      {
        name: 'additional_context',
        type: 'finding',
        required: false,
        examples: [
          'PA: 160/100 mmHg',
          'Glicemia de jejum: 180 mg/dL',
          'Saturação de O2: 88% em ar ambiente',
        ],
      },
    ],
    examples: [
      'Paciente com diagnóstico de hipertensão arterial sistêmica, PA: 160/100 mmHg. ' +
      'Sem outras comorbidades. Qual a conduta inicial mais adequada?',
    ],
    frequency: 0.25,
  },

  distractorStrategy: {
    name: 'Alternative Treatments',
    description:
      'Selecionar tratamentos para condições relacionadas ou classes farmacológicas similares',
    targetSimilarity: [0.45, 0.65],
    diversityWeight: 0.4,
    relationshipTypes: ['treats', 'same_drug_class'],
    examples: [
      {
        correct: 'Iniciar IECA (enalapril)',
        distractors: [
          'Iniciar betabloqueador (propranolol)',
          'Iniciar diurético (hidroclorotiazida)',
          'Encaminhar para nefrologista',
        ],
        similarity: [0.55, 0.48, 0.35],
      },
    ],
  },

  typicalDifficulty: [0.0, 1.8],
  typicalDiscrimination: [1.1, 2.0],

  requiredRelationships: [
    {
      source: 'drug',
      target: 'condition',
      type: 'treats',
    },
  ],

  areaDistribution: {
    clinica_medica: 0.30,
    cirurgia: 0.25,
    ginecologia_obstetricia: 0.15,
    pediatria: 0.20,
    saude_coletiva: 0.10,
  },

  examples: [],
};

/**
 * Mechanism of action pattern
 */
export const MECHANISM_ACTION: QuestionPattern = {
  id: 'mechanism-action',
  name: 'Mecanismo de Ação',
  pattern: 'mechanism_action',
  frequency: 0.08,

  stemTemplate: {
    pattern: 'mechanism_action',
    template: 'Qual o mecanismo de ação de {drug}?',
    variables: [
      {
        name: 'drug',
        type: 'medication',
        required: true,
        examples: ['omeprazol', 'enalapril', 'metformina'],
      },
    ],
    examples: ['Qual o mecanismo de ação do omeprazol?'],
    frequency: 0.08,
  },

  distractorStrategy: {
    name: 'Similar Mechanisms',
    description: 'Mecanismos de ação de drogas da mesma classe ou similar',
    targetSimilarity: [0.60, 0.80],
    diversityWeight: 0.25,
    relationshipTypes: ['same_drug_class'],
    examples: [
      {
        correct: 'Inibidor da bomba de prótons',
        distractors: [
          'Antagonista H2',
          'Antiácido',
          'Agente protetor de mucosa',
        ],
        similarity: [0.72, 0.65, 0.58],
      },
    ],
  },

  typicalDifficulty: [-0.8, 0.5],
  typicalDiscrimination: [0.9, 1.5],

  requiredRelationships: [],

  areaDistribution: {
    clinica_medica: 0.40,
    cirurgia: 0.15,
    ginecologia_obstetricia: 0.10,
    pediatria: 0.20,
    saude_coletiva: 0.15,
  },

  examples: [],
};

/**
 * Differential diagnosis pattern
 */
export const DIFFERENTIAL_DIAGNOSIS: QuestionPattern = {
  id: 'differential-diagnosis',
  name: 'Diagnóstico Diferencial',
  pattern: 'differential_diagnosis',
  frequency: 0.12,

  stemTemplate: {
    pattern: 'differential_diagnosis',
    template:
      'Paciente apresenta {symptoms}. Qual achado ajuda a distinguir entre {condition_a} e {condition_b}?',
    variables: [
      {
        name: 'symptoms',
        type: 'symptom',
        required: true,
        examples: [
          'dor torácica e dispneia',
          'febre e tosse produtiva',
        ],
      },
      {
        name: 'condition_a',
        type: 'symptom',
        required: true,
        examples: ['infarto agudo do miocárdio', 'pneumonia'],
      },
      {
        name: 'condition_b',
        type: 'symptom',
        required: true,
        examples: ['angina instável', 'tuberculose pulmonar'],
      },
    ],
    examples: [
      'Paciente apresenta dor torácica e dispneia. Qual achado ajuda a distinguir entre infarto agudo do miocárdio e embolia pulmonar?',
    ],
    frequency: 0.12,
  },

  distractorStrategy: {
    name: 'Non-Discriminatory Findings',
    description: 'Achados que não ajudam a distinguir as condições',
    targetSimilarity: [0.40, 0.60],
    diversityWeight: 0.5,
    relationshipTypes: ['is_symptom_of'],
    examples: [
      {
        correct: 'Elevação de troponina',
        distractors: [
          'Dor torácica',
          'Dispneia',
          'Sudorese',
        ],
        similarity: [0.52, 0.48, 0.45],
      },
    ],
  },

  typicalDifficulty: [0.5, 2.0],
  typicalDiscrimination: [1.2, 2.2],

  requiredRelationships: [
    {
      source: 'finding',
      target: 'condition',
      type: 'is_sign_of',
    },
  ],

  areaDistribution: {
    clinica_medica: 0.40,
    cirurgia: 0.20,
    ginecologia_obstetricia: 0.10,
    pediatria: 0.20,
    saude_coletiva: 0.10,
  },

  examples: [],
};

/**
 * Epidemiology pattern
 */
export const EPIDEMIOLOGY: QuestionPattern = {
  id: 'epidemiology',
  name: 'Epidemiologia',
  pattern: 'epidemiology',
  frequency: 0.10,

  stemTemplate: {
    pattern: 'epidemiology',
    template: 'Qual o principal fator de risco para {condition}?',
    variables: [
      {
        name: 'condition',
        type: 'symptom',
        required: true,
        examples: [
          'câncer de pulmão',
          'diabetes mellitus tipo 2',
          'hipertensão arterial',
        ],
      },
    ],
    examples: ['Qual o principal fator de risco para câncer de pulmão?'],
    frequency: 0.10,
  },

  distractorStrategy: {
    name: 'Related Risk Factors',
    description: 'Fatores de risco para condições relacionadas',
    targetSimilarity: [0.35, 0.55],
    diversityWeight: 0.6,
    relationshipTypes: ['is_risk_factor_for'],
    examples: [
      {
        correct: 'Tabagismo',
        distractors: [
          'Obesidade',
          'Hipertensão arterial',
          'Diabetes mellitus',
        ],
        similarity: [0.45, 0.40, 0.38],
      },
    ],
  },

  typicalDifficulty: [-1.0, 0.8],
  typicalDiscrimination: [0.8, 1.4],

  requiredRelationships: [
    {
      source: 'risk_factor',
      target: 'condition',
      type: 'is_risk_factor_for',
    },
  ],

  areaDistribution: {
    clinica_medica: 0.25,
    cirurgia: 0.15,
    ginecologia_obstetricia: 0.15,
    pediatria: 0.15,
    saude_coletiva: 0.30,
  },

  examples: [],
};

// ============================================
// Pattern Registry
// ============================================

/**
 * All available question patterns
 */
export const QUESTION_PATTERNS: QuestionPattern[] = [
  CLINICAL_VIGNETTE_DIAGNOSIS,
  CLINICAL_VIGNETTE_TREATMENT,
  MECHANISM_ACTION,
  DIFFERENTIAL_DIAGNOSIS,
  EPIDEMIOLOGY,
];

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): QuestionPattern | undefined {
  return QUESTION_PATTERNS.find(p => p.id === id);
}

/**
 * Get patterns by type
 */
export function getPatternsByType(
  type: QuestionPatternType
): QuestionPattern[] {
  return QUESTION_PATTERNS.filter(p => p.pattern === type);
}

/**
 * Get patterns by area
 */
export function getPatternsByArea(area: ENAMEDArea): QuestionPattern[] {
  return QUESTION_PATTERNS.filter(p => p.areaDistribution[area] > 0).sort(
    (a, b) => b.areaDistribution[area] - a.areaDistribution[area]
  );
}

/**
 * Select pattern based on area and difficulty
 */
export function selectPattern(
  area: ENAMEDArea,
  targetDifficulty: number
): QuestionPattern | null {
  const areaPatterns = getPatternsByArea(area);

  // Filter patterns whose typical difficulty range includes target
  const suitable = areaPatterns.filter(
    p =>
      targetDifficulty >= p.typicalDifficulty[0] &&
      targetDifficulty <= p.typicalDifficulty[1]
  );

  if (suitable.length === 0) return null;

  // Weight by area frequency
  const weights = suitable.map(p => p.areaDistribution[area]);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Randomly select based on weights
  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (let i = 0; i < suitable.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return suitable[i];
    }
  }

  return suitable[0];
}
