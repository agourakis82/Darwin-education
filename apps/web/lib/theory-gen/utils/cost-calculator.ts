/**
 * Cost Calculator for Theory Generation
 *
 * Tracks costs for:
 * - WebSearch calls: ~5K tokens = $0.01
 * - LLM generation: ~18K tokens = $0.06
 * - LLM validation: ~1K tokens = $0.01
 * Total per topic: ~$0.08
 */

export interface CostEstimate {
  research: number;
  generation: number;
  validation: number;
  total: number;
}

export class CostCalculator {
  private readonly RESEARCH_COST = 0.01;  // Per research call
  private readonly GENERATION_COST = 0.06;  // Per generation
  private readonly VALIDATION_COST = 0.01;  // Per validation

  /**
   * Calculate estimated cost for single topic generation
   */
  estimateSingleTopic(includeWebResearch = true): CostEstimate {
    const research = includeWebResearch ? this.RESEARCH_COST : 0;
    const generation = this.GENERATION_COST;
    const validation = this.VALIDATION_COST;

    return {
      research,
      generation,
      validation,
      total: research + generation + validation,
    };
  }

  /**
   * Calculate estimated cost for batch generation
   */
  estimateBatch(count: number, includeWebResearch = true): CostEstimate {
    const single = this.estimateSingleTopic(includeWebResearch);
    return {
      research: single.research * count,
      generation: single.generation * count,
      validation: single.validation * count,
      total: single.total * count,
    };
  }

  /**
   * Check if cost would exceed limit
   */
  wouldExceedLimit(
    currentCost: number,
    additionalTopics: number,
    limit: number,
    includeWebResearch = true
  ): boolean {
    const additional = this.estimateBatch(additionalTopics, includeWebResearch);
    return currentCost + additional.total > limit;
  }

  /**
   * Get remaining budget for topics
   */
  remainingTopicsForBudget(currentCost: number, limit: number): number {
    const costPerTopic = this.estimateSingleTopic().total;
    const remaining = limit - currentCost;
    return Math.floor(remaining / costPerTopic);
  }
}

export const costCalculator = new CostCalculator();
