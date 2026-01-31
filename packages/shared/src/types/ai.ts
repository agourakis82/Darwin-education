/**
 * AI Integration Types
 *
 * Type definitions for Minimax API integration and AI-powered features.
 *
 * @module packages/shared/src/types/ai
 */

import type { ENAMEDArea, ENAMEDQuestion } from './education';

// ============================================
// Minimax API Types
// ============================================

/**
 * Minimax API configuration
 */
export interface MinimaxConfig {
  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Group ID for the API
   */
  groupId: string;

  /**
   * Model to use (default: abab6.5-chat for cost optimization)
   */
  model?: string;

  /**
   * Base URL for the API
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Chat message role
 */
export type ChatRole = 'system' | 'user' | 'assistant';

/**
 * Chat message
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Chat completion options
 */
export interface ChatOptions {
  /**
   * Temperature for randomness (0.0-1.0)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Top-p sampling
   */
  topP?: number;

  /**
   * Stop sequences
   */
  stop?: string[];

  /**
   * Whether to stream the response
   */
  stream?: boolean;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Chat completion response
 */
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finishReason: string;
  }[];
  usage: TokenUsage;
}

// ============================================
// Question Generation Types
// ============================================

/**
 * Parameters for AI question generation
 */
export interface QuestionGenerationParams {
  /**
   * ENAMED medical area
   */
  area: ENAMEDArea;

  /**
   * Specific topic within the area
   */
  topic?: string;

  /**
   * Desired difficulty level
   */
  difficulty?: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil';

  /**
   * ICD-10 codes to focus on
   */
  icd10Codes?: string[];

  /**
   * ATC medication codes to include
   */
  atcCodes?: string[];

  /**
   * Number of questions to generate
   */
  count?: number;

  /**
   * Additional context or constraints
   */
  context?: string;
}

/**
 * AI-generated question (before IRT parameter estimation)
 */
export interface AIGeneratedQuestion {
  /**
   * Question stem/text
   */
  stem: string;

  /**
   * Multiple choice options (A, B, C, D)
   */
  options: [string, string, string, string];

  /**
   * Correct answer index (0-3)
   */
  correctAnswer: number;

  /**
   * Explanation of the correct answer
   */
  explanation: string;

  /**
   * ENAMED area
   */
  area: ENAMEDArea;

  /**
   * Topic within the area
   */
  topic?: string;

  /**
   * Related ICD-10 codes
   */
  icd10Codes?: string[];

  /**
   * Related ATC codes
   */
  atcCodes?: string[];

  /**
   * Estimated difficulty (before empirical validation)
   */
  estimatedDifficulty?: number;

  /**
   * Metadata from generation
   */
  metadata?: {
    model: string;
    tokensUsed: number;
    generatedAt: string;
  };
}

// ============================================
// Explanation Types
// ============================================

/**
 * Parameters for personalized explanations
 */
export interface ExplainParams {
  /**
   * The original question
   */
  question: Pick<ENAMEDQuestion, 'stem' | 'options' | 'correctIndex'>;

  /**
   * User's selected answer
   */
  userAnswer: number;

  /**
   * User's current theta (ability estimate)
   */
  userTheta?: number;

  /**
   * Additional context about the user's learning history
   */
  userContext?: {
    weakAreas?: ENAMEDArea[];
    strengthAreas?: ENAMEDArea[];
    recentMistakes?: string[];
  };

  /**
   * Explanation style preference
   */
  style?: 'concise' | 'detailed' | 'visual';
}

/**
 * Generated explanation response
 */
export interface ExplanationResponse {
  /**
   * Personalized explanation text
   */
  explanation: string;

  /**
   * Why the user's answer was incorrect (if applicable)
   */
  misconceptionAnalysis?: string;

  /**
   * Key concepts to review
   */
  keyConceptsToReview?: string[];

  /**
   * Recommended study resources
   */
  recommendedResources?: {
    type: 'article' | 'video' | 'flashcard' | 'practice_question';
    title: string;
    url?: string;
  }[];
}

// ============================================
// Case Study Types
// ============================================

/**
 * Parameters for case study generation
 */
export interface CaseStudyParams {
  /**
   * Medical area for the case
   */
  area: ENAMEDArea;

  /**
   * Complexity level
   */
  complexity?: 'simple' | 'moderate' | 'complex';

  /**
   * Specific diagnosis to feature
   */
  targetDiagnosis?: string;

  /**
   * ICD-10 codes to include
   */
  icd10Codes?: string[];

  /**
   * Case format
   */
  format?: 'clinical_vignette' | 'progressive_disclosure' | 'interactive';
}

/**
 * Interactive patient case
 */
export interface CaseStudy {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Case title
   */
  title: string;

  /**
   * Initial patient presentation
   */
  initialPresentation: string;

  /**
   * Progressive stages of the case
   */
  stages: CaseStage[];

  /**
   * Correct diagnosis
   */
  correctDiagnosis: string;

  /**
   * ICD-10 code for diagnosis
   */
  icd10Code?: string;

  /**
   * Learning objectives
   */
  learningObjectives: string[];

  /**
   * Metadata
   */
  metadata: {
    area: ENAMEDArea;
    complexity: string;
    estimatedTimeMinutes: number;
    createdAt: string;
  };
}

/**
 * Stage in a progressive case study
 */
export interface CaseStage {
  /**
   * Stage number
   */
  stage: number;

  /**
   * Stage title
   */
  title: string;

  /**
   * Information revealed at this stage
   */
  information: string;

  /**
   * Question to answer at this stage
   */
  question?: string;

  /**
   * Possible actions/answers
   */
  options?: string[];

  /**
   * Correct action/answer index
   */
  correctOption?: number;

  /**
   * Feedback for this stage
   */
  feedback?: string;
}

// ============================================
// Content Summarization Types
// ============================================

/**
 * Parameters for content summarization
 */
export interface SummarizeParams {
  /**
   * Content to summarize
   */
  content: string;

  /**
   * Content type
   */
  type: 'disease' | 'medication' | 'protocol' | 'guideline';

  /**
   * Target length
   */
  targetLength?: 'brief' | 'moderate' | 'comprehensive';

  /**
   * Focus areas
   */
  focus?: string[];

  /**
   * Format for output
   */
  format?: 'paragraph' | 'bullet_points' | 'flashcard';
}

/**
 * Summary response
 */
export interface SummaryResponse {
  /**
   * Summary text
   */
  summary: string;

  /**
   * Key points extracted
   */
  keyPoints?: string[];

  /**
   * Clinical pearls
   */
  clinicalPearls?: string[];

  /**
   * Estimated reading time in seconds
   */
  estimatedReadingTime?: number;
}

// ============================================
// Caching Types
// ============================================

/**
 * Cache entry type
 */
export type CacheRequestType = 'explain' | 'generate' | 'case_study' | 'summarize';

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * TTL in seconds (7 days for explanations, permanent for questions)
   */
  ttl: number;

  /**
   * Whether caching is enabled
   */
  enabled: boolean;
}

/**
 * Cached response entry
 */
export interface CacheEntry {
  /**
   * Unique cache key (hash of request params)
   */
  key: string;

  /**
   * Request type
   */
  requestType: CacheRequestType;

  /**
   * Cached response
   */
  response: string;

  /**
   * Tokens used in original request
   */
  tokensUsed: number;

  /**
   * Cost in BRL
   */
  costBrl: number;

  /**
   * Number of times this cache entry was hit
   */
  hits: number;

  /**
   * When the entry was created
   */
  createdAt: Date;

  /**
   * When the entry expires
   */
  expiresAt: Date;
}

// ============================================
// Rate Limiting Types
// ============================================

/**
 * User subscription tier
 */
export type SubscriptionTier = 'free' | 'premium' | 'institutional';

/**
 * Rate limit configuration per tier
 */
export interface RateLimitConfig {
  /**
   * Maximum requests per day
   */
  maxRequestsPerDay: number;

  /**
   * Maximum tokens per request
   */
  maxTokensPerRequest?: number;

  /**
   * Cost limit per month in BRL
   */
  monthlyCostLimitBrl?: number;
}

/**
 * Rate limit status for a user
 */
export interface RateLimitStatus {
  /**
   * User's subscription tier
   */
  tier: SubscriptionTier;

  /**
   * Requests remaining today
   */
  remainingRequests: number;

  /**
   * When the limit resets
   */
  resetsAt: Date;

  /**
   * Whether the user is currently rate limited
   */
  isLimited: boolean;

  /**
   * Cost spent this month in BRL
   */
  monthlySpendBrl?: number;
}

// ============================================
// Error Types
// ============================================

/**
 * AI API error
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AIError {
  constructor(
    public retryAfter: Date,
    public tier: SubscriptionTier
  ) {
    super(
      `Rate limit exceeded for ${tier} tier. Retry after ${retryAfter.toISOString()}`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Cache error
 */
export class CacheError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'CacheError';
  }
}
