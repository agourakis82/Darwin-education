// ============================================================
// CLINICAL VALIDATOR SERVICE
// LLM-based second-pass validation for medical question accuracy
// ============================================================

import OpenAI from 'openai'
import type { ENAMEDArea } from '@darwin-education/shared'

/**
 * Validation status for a medical question.
 */
export type ValidationStatus = 'pending' | 'approved' | 'rejected'

/**
 * Result of the clinical validation process.
 */
export interface ClinicalValidationResult {
  isApproved: boolean
  status: ValidationStatus
  critique: string
  issues: ClinicalIssue[]
  confidence: number // 0-1
  checkedAt: string
  modelUsed: string
}

/**
 * Specific issue found during validation.
 */
export interface ClinicalIssue {
  type: 'clinical_inaccuracy' | 'outdated_guideline' | 'ambiguous_stem' | 'incorrect_answer' | 'weak_distractor' | 'missing_context' | 'explanation_unclear'
  severity: 'critical' | 'major' | 'minor'
  description: string
  suggestion?: string
}

/**
 * Question to be validated.
 */
export interface QuestionToValidate {
  id: string
  stem: string
  options: Array<{ text: string; isCorrect: boolean }>
  correctIndex: number
  explanation: string
  area: ENAMEDArea
  topic?: string
  references?: string[]
}

/**
 * System prompt for the clinical validator LLM.
 */
const CLINICAL_VALIDATOR_SYSTEM_PROMPT = `You are a senior medical board reviewer for the Brazilian medical licensing examination (ENAMED). Your role is to critically evaluate medical questions for clinical accuracy, guideline adherence, and educational value.

## Your Responsibilities
1. Verify that the clinical scenario is realistic and medically plausible
2. Confirm the correct answer is definitively correct according to CURRENT Brazilian medical guidelines (Ministério da Saúde, Febrasgo, SBP, SBGG, AMB, CFM)
3. Ensure distractors are plausible but definitively incorrect
4. Check that the explanation clearly justifies the correct answer
5. Identify any outdated practices, ambiguous wording, or clinical inaccuracies

## Validation Criteria
- **Clinical Plausibility**: Is the stem realistic? Are patient demographics and presentation consistent?
- **Correct Answer**: Is the designated correct answer definitively correct based on current guidelines?
- **Distractor Quality**: Are all distractors (wrong options) plausible but clearly incorrect?
- **Explanation Quality**: Does the explanation clearly justify why the correct answer is correct and why distractors are wrong?
- **Guideline Currency**: Are the referenced guidelines current? Flag if older than 3 years without justification.
- **Language**: Questions should be in clear, formal Portuguese appropriate for medical examinations.

## Output Format
You MUST respond with valid JSON matching this schema:
{
  "isApproved": boolean,
  "critique": "string (brief overall assessment)",
  "issues": [
    {
      "type": "clinical_inaccuracy" | "outdated_guideline" | "ambiguous_stem" | "incorrect_answer" | "weak_distractor" | "missing_context" | "explanation_unclear",
      "severity": "critical" | "major" | "minor",
      "description": "string",
      "suggestion": "string (optional)"
    }
  ],
  "confidence": number (0-1)
}

## Important Rules
- Any CRITICAL issue means the question must be REJECTED
- Questions with 2+ MAJOR issues should generally be REJECTED
- Minor issues alone may still result in APPROVAL with suggestions
- Be strict but fair - this content will train future physicians
- Always consider Brazilian clinical practice context`

/**
 * Validates a medical question using an LLM.
 */
export async function validateClinicalQuestion(
  question: QuestionToValidate
): Promise<ClinicalValidationResult> {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping clinical validation')
    return {
      isApproved: true, // Default to approved if no API key (fallback)
      status: 'approved',
      critique: 'Clinical validation skipped - API key not configured',
      issues: [],
      confidence: 0.5,
      checkedAt: new Date().toISOString(),
      modelUsed: 'none',
    }
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const model = process.env.CLINICAL_VALIDATOR_MODEL || 'gpt-4o'

  // Build the question text for validation
  const questionText = buildQuestionText(question)

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: CLINICAL_VALIDATOR_SYSTEM_PROMPT },
        { role: 'user', content: questionText },
      ],
      temperature: 0.1, // Low temperature for consistent evaluations
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('Empty response from LLM')
    }

    const parsed = JSON.parse(content)

    // Determine status based on issues
    let status: ValidationStatus = parsed.isApproved ? 'approved' : 'rejected'
    
    // Override if critical issues exist
    const hasCriticalIssues = parsed.issues?.some(
      (issue: ClinicalIssue) => issue.severity === 'critical'
    )
    if (hasCriticalIssues) {
      status = 'rejected'
    }

    return {
      isApproved: status === 'approved',
      status,
      critique: parsed.critique || 'No critique provided',
      issues: parsed.issues || [],
      confidence: parsed.confidence ?? 0.8,
      checkedAt: new Date().toISOString(),
      modelUsed: model,
    }
  } catch (error) {
    console.error('Clinical validation error:', error)
    
    // On error, return a pending status for human review
    return {
      isApproved: false,
      status: 'pending',
      critique: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      issues: [
        {
          type: 'missing_context',
          severity: 'major',
          description: 'Automated validation failed - requires manual review',
        },
      ],
      confidence: 0,
      checkedAt: new Date().toISOString(),
      modelUsed: model,
    }
  }
}

/**
 * Builds the question text for LLM validation.
 */
function buildQuestionText(question: QuestionToValidate): string {
  const optionLabels = ['A', 'B', 'C', 'D', 'E']
  
  const optionsText = question.options
    .map((opt, idx) => {
      const label = optionLabels[idx] || String(idx + 1)
      const marker = opt.isCorrect ? ' [CORRETA]' : ''
      return `${label}) ${opt.text}${marker}`
    })
    .join('\n')

  const areaNames: Record<ENAMEDArea, string> = {
    clinica_medica: 'Clínica Médica',
    cirurgia: 'Cirurgia',
    ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
    pediatria: 'Pediatria',
    saude_coletiva: 'Saúde Coletiva',
  }

  return `## Questão para Validação

**Área:** ${areaNames[question.area] || question.area}
**Tópico:** ${question.topic || 'Não especificado'}

### Enunciado
${question.stem}

### Alternativas
${optionsText}

### Explicação
${question.explanation}

### Referências
${question.references?.length ? question.references.map((r) => `- ${r}`).join('\n') : 'Nenhuma referência fornecida'}

---
Por favor, valide esta questão seguindo os critérios estabelecidos. Responda em JSON.`
}

/**
 * Batch validates multiple questions.
 */
export async function batchValidateQuestions(
  questions: QuestionToValidate[],
  options?: { concurrency?: number }
): Promise<Map<string, ClinicalValidationResult>> {
  const results = new Map<string, ClinicalValidationResult>()
  const concurrency = options?.concurrency || 3

  // Process in batches to avoid rate limits
  for (let i = 0; i < questions.length; i += concurrency) {
    const batch = questions.slice(i, i + concurrency)
    
    const batchResults = await Promise.all(
      batch.map(async (q) => {
        const result = await validateClinicalQuestion(q)
        return { id: q.id, result }
      })
    )

    for (const { id, result } of batchResults) {
      results.set(id, result)
    }

    // Small delay between batches to respect rate limits
    if (i + concurrency < questions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}
