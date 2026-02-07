/**
 * LLM Client for Theory Generation
 *
 * Abstracts LLM calls for:
 * - Theory content generation (using Grok-4-fast-reasoning)
 * - Content validation
 * - Citation relevance scoring
 */

import { GeneratedTheoryTopic } from '@darwin-education/shared';
import { grokChat, extractJSON } from '@/lib/ddl/services/grok-client';

export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class LLMClient {
  private model: string = 'grok-4-1-fast-reasoning';
  private temperature: number = 0.7;

  constructor(model?: string) {
    if (model) {
      this.model = model;
    }
  }

  /**
   * Generate theory content using LLM
   */
  async generateTheoryContent(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<GeneratedTheoryTopic> {
    try {
      const responseText = await grokChat(
        [
          {
            role: 'system',
            content:
              'You are an expert medical educator for ENAMED preparation. Generate comprehensive, accurate medical theory content. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        {
          model: options?.model || this.model,
          maxTokens: options?.maxTokens || 4096,
          temperature: options?.temperature || this.temperature,
        }
      );

      const jsonStr = extractJSON(responseText);
      return JSON.parse(jsonStr) as GeneratedTheoryTopic;
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate theory content');
    }
  }

  /**
   * Validate generated content using LLM
   */
  async validateContent(
    content: string,
    criteria: string[]
  ): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
  }> {
    try {
      const prompt = `
Validate the following medical content against these criteria:
${criteria.map((c) => `- ${c}`).join('\n')}

Content to validate:
${content}

Provide a JSON response with:
{
  "isValid": boolean,
  "score": 0-1,
  "issues": ["issue1", "issue2"]
}
`;

      const responseText = await grokChat(
        [
          {
            role: 'system',
            content:
              'You are a medical content validator. Evaluate content accuracy and completeness. Respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        {
          model: this.model,
          maxTokens: 1024,
          temperature: 0.2,
        }
      );

      const jsonStr = extractJSON(responseText);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error validating content:', error);
      throw error;
    }
  }

  /**
   * Score citation relevance
   */
  async scoreRelevance(
    citation: string,
    topic: string
  ): Promise<number> {
    try {
      const prompt = `
On a scale of 0-1, how relevant is this citation to the medical topic "${topic}"?

Citation: ${citation}

Respond with just a number between 0 and 1.
`;

      const responseText = await grokChat(
        [
          {
            role: 'system',
            content: 'You are a medical literature expert. Rate citation relevance. Respond with only a number between 0 and 1.',
          },
          { role: 'user', content: prompt },
        ],
        {
          model: this.model,
          maxTokens: 32,
          temperature: 0.1,
        }
      );

      const score = parseFloat(responseText.trim());
      return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
    } catch (error) {
      console.error('Error scoring relevance:', error);
      return 0.5;
    }
  }
}

/**
 * Create configured LLM client
 */
export function createLLMClient(model?: string): LLMClient {
  return new LLMClient(model || process.env.THEORY_GEN_LLM_MODEL);
}

export const llmClient = createLLMClient();
