/**
 * Question Template Engine
 * =========================
 *
 * Portuguese clinical vignette templates for automatic question generation
 * Uses Schema.org medical ontology data to fill in variables
 *
 * @module packages/shared/src/generators/template-engine
 */

import {
  MedicalCondition,
  Drug,
  MedicalSignOrSymptom,
  MedicalTest,
  QuestionPatternType,
} from '../types/schema-medical';
import { ENAMEDArea } from '../types/education';

// ============================================
// Template Context Types
// ============================================

/**
 * Variables available for template rendering
 */
export interface TemplateContext {
  // Demographics
  age?: number;
  sex?: 'masculino' | 'feminino';
  occupation?: string;

  // Condition
  condition?: MedicalCondition;
  conditionName?: string;

  // Symptoms/Signs
  chiefComplaint?: string;
  symptoms?: string[];
  physicalFindings?: string[];
  duration?: string;

  // Tests
  labFindings?: string[];
  imagingFindings?: string[];
  testResults?: string[];

  // Treatment
  medication?: Drug;
  medicationName?: string;
  dose?: string;
  route?: string;

  // Additional context
  additionalContext?: string;
  pastHistory?: string;
  familyHistory?: string;

  // Custom variables
  [key: string]: unknown;
}

// ============================================
// Template Definitions
// ============================================

/**
 * Diagnostic vignette templates
 */
export const DIAGNOSIS_TEMPLATES = {
  basic: [
    'Paciente de {age} anos, {sex}, apresenta-se com {chiefComplaint} há {duration}. ' +
    'Ao exame físico: {physicalFindings}. {labFindings}. ' +
    'Qual o diagnóstico mais provável?',

    'Paciente {sex}, {age} anos, procura atendimento por {chiefComplaint}. ' +
    'História: {pastHistory}. ' +
    'Exame físico revela {physicalFindings}. ' +
    'A hipótese diagnóstica é:',

    '{sex}, {age} anos, com queixa de {chiefComplaint} há {duration}. ' +
    'Ao exame: {physicalFindings}. ' +
    'Exames mostram: {labFindings}. ' +
    'O diagnóstico mais provável é:',
  ],

  detailed: [
    'Paciente de {age} anos, {sex}, {occupation}, apresenta quadro de {chiefComplaint} ' +
    'com início há {duration}. ' +
    'História patológica pregressa: {pastHistory}. ' +
    'História familiar: {familyHistory}. ' +
    'Ao exame físico: {physicalFindings}. ' +
    'Exames laboratoriais: {labFindings}. ' +
    'Exames de imagem: {imagingFindings}. ' +
    'Qual o diagnóstico mais compatível com o quadro clínico?',

    'Paciente {sex}, {age} anos, procura atendimento com história de {chiefComplaint} ' +
    'há {duration}. ' +
    'Relata também: {symptoms}. ' +
    'Antecedentes: {pastHistory}. ' +
    'Ao exame físico, apresenta {physicalFindings}. ' +
    'Exames complementares mostram: {testResults}. ' +
    'Qual o diagnóstico mais provável?',
  ],

  pediatric: [
    'Lactente de {age} meses, levado ao pronto-socorro por {chiefComplaint} há {duration}. ' +
    'Antecedentes: {pastHistory}. ' +
    'Ao exame: {physicalFindings}. ' +
    'O diagnóstico mais provável é:',

    'Criança de {age} anos apresenta {chiefComplaint} há {duration}. ' +
    'Mãe relata {symptoms}. ' +
    'Exame físico: {physicalFindings}. ' +
    'Qual a hipótese diagnóstica?',
  ],

  obstetric: [
    'Gestante de {age} anos, G{gravida}P{para}, idade gestacional de {gestationalAge} semanas, ' +
    'apresenta {chiefComplaint}. ' +
    'Exame físico: {physicalFindings}. ' +
    'Qual o diagnóstico mais provável?',

    'Paciente de {age} anos, em pós-parto de {postpartumDays} dias, ' +
    'apresenta {chiefComplaint}. ' +
    'Ao exame: {physicalFindings}. ' +
    'A hipótese diagnóstica é:',
  ],
};

/**
 * Treatment vignette templates
 */
export const TREATMENT_TEMPLATES = {
  basic: [
    'Paciente com diagnóstico de {conditionName}. ' +
    '{additionalContext}. ' +
    'Qual a conduta mais adequada?',

    'Paciente apresenta {conditionName}. ' +
    'Considerando as diretrizes atuais, o tratamento de primeira linha é:',

    'Diante de um paciente com {conditionName}, ' +
    '{additionalContext}, ' +
    'a melhor opção terapêutica é:',
  ],

  detailed: [
    'Paciente de {age} anos com diagnóstico estabelecido de {conditionName}. ' +
    'Exame físico: {physicalFindings}. ' +
    'Exames complementares: {labFindings}. ' +
    '{additionalContext}. ' +
    'Qual a melhor conduta terapêutica?',

    'Paciente {sex}, {age} anos, portador de {conditionName}, ' +
    'em acompanhamento regular. ' +
    'Evolui com {chiefComplaint}. ' +
    '{additionalContext}. ' +
    'A conduta mais apropriada é:',
  ],

  pharmacological: [
    'Para o tratamento de {conditionName} em um paciente {sex} de {age} anos, ' +
    '{additionalContext}, ' +
    'o medicamento de escolha é:',

    'Paciente com {conditionName} necessita de tratamento farmacológico. ' +
    '{additionalContext}. ' +
    'Qual a medicação mais indicada?',
  ],

  surgical: [
    'Paciente de {age} anos com diagnóstico de {conditionName}. ' +
    '{additionalContext}. ' +
    'Indicação cirúrgica. Qual o procedimento mais adequado?',

    'Diante de um quadro de {conditionName}, ' +
    '{additionalContext}, ' +
    'a intervenção cirúrgica indicada é:',
  ],
};

/**
 * Workup/Diagnostic test templates
 */
export const WORKUP_TEMPLATES = {
  basic: [
    'Paciente apresenta quadro sugestivo de {conditionName}. ' +
    'Qual exame é mais indicado para confirmação diagnóstica?',

    'Para investigação de {conditionName}, o exame de escolha é:',

    'Na suspeita de {conditionName}, qual exame complementar deve ser solicitado inicialmente?',
  ],

  detailed: [
    'Paciente de {age} anos com {chiefComplaint}. ' +
    'Hipótese diagnóstica: {conditionName}. ' +
    '{additionalContext}. ' +
    'Qual exame é mais específico para confirmar o diagnóstico?',

    'Paciente apresenta {symptoms}. ' +
    'Suspeita clínica de {conditionName}. ' +
    'O exame mais sensível e específico para este caso é:',
  ],
};

/**
 * Mechanism of action templates
 */
export const MECHANISM_TEMPLATES = {
  basic: [
    'Qual o mecanismo de ação de {medicationName}?',

    'O {medicationName} atua principalmente por meio de:',

    'A ação farmacológica do {medicationName} baseia-se em:',
  ],

  detailed: [
    'O {medicationName}, medicamento utilizado no tratamento de {conditionName}, ' +
    'atua por meio de qual mecanismo?',

    'No tratamento de {conditionName}, prescreve-se {medicationName}. ' +
    'Qual o seu mecanismo de ação?',
  ],
};

/**
 * Differential diagnosis templates
 */
export const DIFFERENTIAL_TEMPLATES = {
  basic: [
    'Paciente apresenta {chiefComplaint}. ' +
    'Qual achado ajuda a distinguir entre {conditionA} e {conditionB}?',

    'No diagnóstico diferencial entre {conditionA} e {conditionB}, ' +
    'qual achado é mais específico para {conditionA}?',
  ],

  detailed: [
    'Paciente de {age} anos com {chiefComplaint}. ' +
    'Principais hipóteses: {conditionA} e {conditionB}. ' +
    'Qual achado clínico ou laboratorial é mais útil para diferenciá-las?',

    'Diante de um quadro de {symptoms}, ' +
    'considerando as hipóteses de {conditionA} e {conditionB}, ' +
    'qual o achado mais específico de {conditionA}?',
  ],
};

/**
 * Epidemiology templates
 */
export const EPIDEMIOLOGY_TEMPLATES = {
  riskFactor: [
    'Qual o principal fator de risco para {conditionName}?',

    'Entre os fatores de risco para {conditionName}, o mais importante é:',

    'A associação mais forte com {conditionName} é observada em pacientes com:',
  ],

  prevalence: [
    'Qual a faixa etária mais acometida por {conditionName}?',

    'O {conditionName} é mais prevalente em qual grupo?',
  ],

  prognosis: [
    'Em relação ao prognóstico de {conditionName}, é correto afirmar:',

    'O principal fator prognóstico em {conditionName} é:',
  ],
};

/**
 * Complication templates
 */
export const COMPLICATION_TEMPLATES = {
  basic: [
    'Qual a complicação mais comum de {conditionName}?',

    'Paciente com {conditionName} não tratado pode evoluir com:',

    'A principal complicação do {conditionName} é:',
  ],

  detailed: [
    'Paciente de {age} anos com {conditionName} em tratamento há {duration}. ' +
    '{additionalContext}. ' +
    'Qual complicação deve ser suspeitada?',
  ],
};

// ============================================
// Template Engine
// ============================================

/**
 * Main template engine class
 */
export class TemplateEngine {
  /**
   * Render a template with given context
   */
  render(template: string, context: TemplateContext): string {
    let rendered = template;

    // Replace all {variable} placeholders
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        const stringValue = this.formatValue(value);
        rendered = rendered.replace(placeholder, stringValue);
      }
    }

    // Clean up any remaining unreplaced placeholders
    rendered = rendered.replace(/\{[^}]+\}/g, '[...]');

    // Clean up spacing
    rendered = rendered.replace(/\s+/g, ' ').trim();
    rendered = rendered.replace(/\s+\./g, '.');
    rendered = rendered.replace(/\.\s*\./g, '.');

    return rendered;
  }

  /**
   * Format value for template rendering
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      if ('name' in value && typeof value.name === 'string') {
        return value.name;
      }
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Select template by pattern type
   */
  selectTemplate(
    patternType: QuestionPatternType,
    variant: 'basic' | 'detailed' = 'basic'
  ): string | null {
    let templates: string[] = [];

    switch (patternType) {
      case 'clinical_vignette_diagnosis':
        templates = DIAGNOSIS_TEMPLATES[variant] || DIAGNOSIS_TEMPLATES.basic;
        break;
      case 'clinical_vignette_treatment':
        templates = TREATMENT_TEMPLATES[variant] || TREATMENT_TEMPLATES.basic;
        break;
      case 'clinical_vignette_workup':
        templates = WORKUP_TEMPLATES[variant] || WORKUP_TEMPLATES.basic;
        break;
      case 'mechanism_action':
        templates = MECHANISM_TEMPLATES[variant] || MECHANISM_TEMPLATES.basic;
        break;
      case 'differential_diagnosis':
        templates = DIFFERENTIAL_TEMPLATES[variant] || DIFFERENTIAL_TEMPLATES.basic;
        break;
      case 'epidemiology':
        templates = EPIDEMIOLOGY_TEMPLATES.riskFactor;
        break;
      case 'adverse_effect':
      case 'anatomy_function':
      case 'protocol_guideline':
        // Use basic diagnosis template as fallback
        templates = DIAGNOSIS_TEMPLATES.basic;
        break;
      default:
        return null;
    }

    // Randomly select a template
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate question stem from pattern and context
   */
  generateStem(
    patternType: QuestionPatternType,
    context: TemplateContext,
    variant: 'basic' | 'detailed' = 'basic'
  ): string | null {
    const template = this.selectTemplate(patternType, variant);
    if (!template) return null;

    return this.render(template, context);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate random age based on area
 */
export function generateAge(area: ENAMEDArea): number {
  switch (area) {
    case 'pediatria':
      return Math.floor(Math.random() * 18); // 0-17 years
    case 'ginecologia_obstetricia':
      return 15 + Math.floor(Math.random() * 35); // 15-49 years
    default:
      return 18 + Math.floor(Math.random() * 72); // 18-89 years
  }
}

/**
 * Generate random sex
 */
export function generateSex(): 'masculino' | 'feminino' {
  return Math.random() < 0.5 ? 'masculino' : 'feminino';
}

/**
 * Generate duration string
 */
export function generateDuration(): string {
  const durations = [
    '2 horas',
    '6 horas',
    '1 dia',
    '3 dias',
    '1 semana',
    '2 semanas',
    '1 mês',
    '3 meses',
    '6 meses',
  ];
  return durations[Math.floor(Math.random() * durations.length)];
}

/**
 * Export singleton instance
 */
export const templateEngine = new TemplateEngine();
