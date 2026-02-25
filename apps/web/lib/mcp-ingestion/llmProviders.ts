import OpenAI from 'openai';
import { runMinimaxChat } from '../ai/minimax';
import { grokChat, extractJSON } from '../ddl/services/grok-client';
import { callWithRetry } from './extractor';
import type {
  IngestedQuestion,
  ClassificationLLMResult,
  QualityLLMResult,
  ENAMEDAreaClassification,
  LLMProviderName,
} from './types';

// ============================================================
// Shared Prompts
// ============================================================

const VALID_AREAS: ENAMEDAreaClassification[] = [
  'clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva',
];

const CLASSIFICATION_SYSTEM_PROMPT = `You are a medical exam classification specialist for the Brazilian ENAMED/ENARE exams.
Classify the multiple-choice question into exactly ONE of these 5 areas:

- clinica_medica: Internal Medicine (cardiology, pulmonology, nephrology, endocrinology, rheumatology, infectology, hematology, neurology, gastroenterology, geriatrics, emergency medicine, dermatology, psychiatry)
- cirurgia: Surgery (general surgery, orthopedics, urology, vascular surgery, head & neck, plastic surgery, transplant, trauma, anesthesiology)
- ginecologia_obstetricia: OB/GYN (prenatal care, labor & delivery, gynecologic cancers, contraception, menstrual disorders, infertility, menopause, breast diseases)
- pediatria: Pediatrics (neonatology, growth & development, pediatric infectious diseases, child nutrition, adolescent medicine, pediatric emergencies, immunization)
- saude_coletiva: Public Health (epidemiology, biostatistics, health policy, SUS, surveillance, occupational health, environmental health, family medicine, medical ethics, bioethics)

Rules:
1. Choose the SINGLE most specific area. Child with pneumonia → pediatria. Pregnant woman → ginecologia_obstetricia (unless purely surgical emergency).
2. Public health questions focus on populations, policies, epidemiology, or ethics — not individual clinical management.
3. Provide confidence 0-1 (1 = certain).
4. Provide up to 3 subtopic tags in Portuguese.

Respond with ONLY valid JSON: {"area": "one_of_five_areas", "tags": ["tag1", "tag2"], "confidence": 0.95}
No markdown, no explanation.`;

const QUALITY_CHECK_SYSTEM_PROMPT = `You are a medical exam quality auditor. Evaluate if this multiple-choice question meets minimum standards for a question bank.

Score 4 dimensions (each 0-25, total 0-100):
1. Stem completeness: Is the clinical vignette complete and self-contained?
2. Options quality: Are there 4+ distinct, plausible, non-overlapping options?
3. Correct answer validity: Is a correct answer marked and defensible?
4. Language & formatting: Clean Portuguese, no truncation, no OCR artifacts?

Respond with ONLY valid JSON:
{
  "qualityScore": 85,
  "isWellFormed": true,
  "isComplete": true,
  "hasCorrectAnswer": true,
  "issues": [{"type": "incomplete_stem|missing_options|no_correct_answer|duplicate_options|too_short|language_issues|ambiguous_stem|clinical_inaccuracy|weak_distractor", "severity": "critical|major|minor", "description": "..."}],
  "critique": "Brief assessment"
}
No markdown, no explanation.`;

// ============================================================
// Provider Interface
// ============================================================

export interface LLMProvider {
  name: LLMProviderName;
  classify(question: IngestedQuestion): Promise<ClassificationLLMResult>;
  qualityCheck(question: IngestedQuestion): Promise<QualityLLMResult>;
}

function buildQuestionText(q: IngestedQuestion): string {
  const optionsText = q.options
    .map(o => `${o.letter}) ${o.text}`)
    .join('\n');

  const correctLabel = q.correct_index !== null
    ? `\nCorrect answer: ${q.options[q.correct_index]?.letter || '?'}`
    : '\nCorrect answer: not available';

  return `Stem:\n${q.stem}\n\nOptions:\n${optionsText}${correctLabel}`;
}

function parseClassificationJSON(raw: string, model: string, latencyMs: number): ClassificationLLMResult {
  const jsonStr = extractJSON(raw);
  const parsed = JSON.parse(jsonStr);

  const area = VALID_AREAS.includes(parsed.area) ? parsed.area : 'unknown';
  const confidence = typeof parsed.confidence === 'number'
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0.5;

  return {
    area,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    confidence,
    rawResponse: raw.slice(0, 500),
    model,
    latencyMs,
  };
}

function parseQualityJSON(raw: string, model: string): QualityLLMResult {
  const jsonStr = extractJSON(raw);
  const parsed = JSON.parse(jsonStr);

  return {
    qualityScore: typeof parsed.qualityScore === 'number' ? parsed.qualityScore : 0,
    isWellFormed: Boolean(parsed.isWellFormed),
    isComplete: Boolean(parsed.isComplete),
    hasCorrectAnswer: Boolean(parsed.hasCorrectAnswer),
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    critique: parsed.critique || '',
    model,
  };
}

// ============================================================
// Grok Fast Provider (non-reasoning, cheapest)
// ============================================================

class GrokFastProvider implements LLMProvider {
  name: LLMProviderName = 'grok-fast';
  private model = 'grok-4-1-fast-non-reasoning';

  async classify(question: IngestedQuestion): Promise<ClassificationLLMResult> {
    const start = Date.now();
    const response = await callWithRetry(() =>
      runMinimaxChat({
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        temperature: 0.1,
        model: this.model,
      })
    );
    return parseClassificationJSON(response.text, this.model, Date.now() - start);
  }

  async qualityCheck(question: IngestedQuestion): Promise<QualityLLMResult> {
    const response = await callWithRetry(() =>
      runMinimaxChat({
        messages: [
          { role: 'system', content: QUALITY_CHECK_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        temperature: 0.1,
        model: this.model,
      })
    );
    return parseQualityJSON(response.text, this.model);
  }
}

// ============================================================
// Grok Reasoning Provider (chain-of-thought)
// ============================================================

class GrokReasoningProvider implements LLMProvider {
  name: LLMProviderName = 'grok-reasoning';
  private model = 'grok-4-1-fast-reasoning';

  async classify(question: IngestedQuestion): Promise<ClassificationLLMResult> {
    const start = Date.now();
    const response = await callWithRetry(() =>
      grokChat(
        [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        { model: this.model, temperature: 0.1, maxTokens: 500 }
      )
    );
    return parseClassificationJSON(response, this.model, Date.now() - start);
  }

  async qualityCheck(question: IngestedQuestion): Promise<QualityLLMResult> {
    const response = await callWithRetry(() =>
      grokChat(
        [
          { role: 'system', content: QUALITY_CHECK_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        { model: this.model, temperature: 0.1, maxTokens: 800 }
      )
    );
    return parseQualityJSON(response, this.model);
  }
}

// ============================================================
// GPT-4o Provider (cross-vendor diversity)
// ============================================================

class GPT4oProvider implements LLMProvider {
  name: LLMProviderName = 'gpt-4o';
  private model: string;
  private temperature: number;

  constructor(temperature = 0.1) {
    this.model = process.env.CLINICAL_VALIDATOR_MODEL || 'gpt-4o';
    this.temperature = temperature;
  }

  private getClient(): OpenAI {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async classify(question: IngestedQuestion): Promise<ClassificationLLMResult> {
    const start = Date.now();
    const client = this.getClient();
    const response = await callWithRetry(async () => {
      const result = await client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        temperature: this.temperature,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
      return result.choices[0]?.message?.content || '';
    });
    return parseClassificationJSON(response, this.model, Date.now() - start);
  }

  async qualityCheck(question: IngestedQuestion): Promise<QualityLLMResult> {
    const client = this.getClient();
    const response = await callWithRetry(async () => {
      const result = await client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: QUALITY_CHECK_SYSTEM_PROMPT },
          { role: 'user', content: buildQuestionText(question) },
        ],
        temperature: this.temperature,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });
      return result.choices[0]?.message?.content || '';
    });
    return parseQualityJSON(response, this.model);
  }
}

// ============================================================
// Provider Selection
// ============================================================

export function selectProviderPair(): [LLMProvider, LLMProvider] {
  const hasGrok = Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (hasGrok && hasOpenAI) {
    console.log('[Providers] Using GrokFast + GPT-4o (cross-vendor)');
    return [new GrokFastProvider(), new GPT4oProvider()];
  }
  if (hasGrok) {
    console.log('[Providers] Using GrokFast + GrokReasoning (dual-model)');
    return [new GrokFastProvider(), new GrokReasoningProvider()];
  }
  if (hasOpenAI) {
    console.log('[Providers] Using GPT-4o(temp=0.1) + GPT-4o(temp=0.4)');
    return [new GPT4oProvider(0.1), new GPT4oProvider(0.4)];
  }
  throw new Error('No LLM API keys configured. Set XAI_API_KEY or OPENAI_API_KEY.');
}

export function getRateLimitDelay(providerA: LLMProvider, providerB: LLMProvider): number {
  const bothGrok = providerA.name.startsWith('grok') && providerB.name.startsWith('grok');
  return bothGrok ? 500 : 200;
}
