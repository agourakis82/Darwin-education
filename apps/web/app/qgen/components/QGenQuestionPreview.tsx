'use client';

import { Check } from 'lucide-react'
import { AREA_LABELS } from '@/lib/area-colors'

interface QuestionPreviewProps {
  question: {
    id: string;
    stem: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
    explanation?: string;
    area?: string;
    topic?: string;
    bloomLevel?: string;
    irt_parameters?: {
      estimated_difficulty: number;
      estimated_discrimination: number;
      estimated_guessing: number;
    };
  };
  showAnswer?: boolean;
}

const BLOOM_LABELS: Record<string, string> = {
  KNOWLEDGE: 'Conhecimento',
  COMPREHENSION: 'Compreensão',
  APPLICATION: 'Aplicação',
  ANALYSIS: 'Análise',
  SYNTHESIS: 'Síntese',
  EVALUATION: 'Avaliação',
};

export function QGenQuestionPreview({ question, showAnswer = true }: QuestionPreviewProps) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const references = extractUrls(question.explanation || '').slice(0, 6);
  const jsonLd = buildQuestionJsonLd(question, showAnswer, references);

  return (
    <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      {/* Metadata Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {question.area && (
          <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs rounded">
            {AREA_LABELS[question.area] || question.area}
          </span>
        )}
        {question.topic && (
          <span className="px-2 py-1 bg-surface-3 text-label-primary text-xs rounded">
            {question.topic}
          </span>
        )}
        {question.bloomLevel && (
          <span className="px-2 py-1 bg-purple-900/50 text-purple-400 text-xs rounded">
            {BLOOM_LABELS[question.bloomLevel] || question.bloomLevel}
          </span>
        )}
        {question.irt_parameters && (
          <span className="px-2 py-1 bg-cyan-900/50 text-cyan-400 text-xs rounded">
            Dif: {question.irt_parameters.estimated_difficulty.toFixed(1)}
          </span>
        )}
      </div>

      {/* Question Stem */}
      <div className="text-label-primary mb-6 leading-relaxed whitespace-pre-wrap">
        {question.stem}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              showAnswer && option.isCorrect
                ? 'bg-green-900/30 border-green-700'
                : 'bg-surface-2/50 border-surface-3'
            }`}
          >
            <span
              className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${
                showAnswer && option.isCorrect
                  ? 'bg-green-600 text-white'
                  : 'bg-surface-3 text-label-primary'
              }`}
            >
              {letters[index]}
            </span>
            <span
              className={`flex-1 ${
                showAnswer && option.isCorrect ? 'text-green-300' : 'text-label-primary'
              }`}
            >
              {option.text}
            </span>
            {showAnswer && option.isCorrect && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Explanation */}
      {showAnswer && question.explanation && (
        <div className="mt-6 pt-4 border-t border-surface-3">
          <h4 className="text-sm font-medium text-label-secondary mb-2">Explicação:</h4>
          <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">
            {question.explanation}
          </p>
          {references.length > 0 ? (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-label-tertiary mb-1">Referências:</h5>
              <ul className="space-y-1 text-xs">
                {references.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="darwin-focus-ring text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* IRT Parameters */}
      {question.irt_parameters && (
        <div className="mt-4 pt-4 border-t border-surface-3">
          <h4 className="text-sm font-medium text-label-secondary mb-2">Parâmetros IRT:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-label-tertiary">Dificuldade (b):</span>
              <span className="text-label-primary ml-2">
                {question.irt_parameters.estimated_difficulty.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-label-tertiary">Discriminação (a):</span>
              <span className="text-label-primary ml-2">
                {question.irt_parameters.estimated_discrimination.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-label-tertiary">Acerto ao acaso (c):</span>
              <span className="text-label-primary ml-2">
                {question.irt_parameters.estimated_guessing.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  return matches.map((u) => u.replace(/[.,;]+$/, '')).filter(Boolean);
}

function buildQuestionJsonLd(
  question: QuestionPreviewProps['question'],
  showAnswer: boolean,
  references: string[]
): Record<string, unknown> | null {
  if (!question?.stem) return null;

  const about = [
    question.area ? { '@type': 'Thing', name: question.area } : null,
    question.topic ? { '@type': 'Thing', name: question.topic } : null,
    question.bloomLevel ? { '@type': 'Thing', name: `Bloom:${question.bloomLevel}` } : null,
  ].filter(Boolean);

  const suggestedAnswer = (question.options || []).map((opt, idx) => ({
    '@type': 'Answer',
    position: idx + 1,
    text: opt.text,
  }));

  const accepted = showAnswer
    ? (question.options || []).find((o) => o.isCorrect)?.text || null
    : null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    text: question.stem,
    answerCount: suggestedAnswer.length,
    suggestedAnswer,
    ...(accepted ? { acceptedAnswer: { '@type': 'Answer', text: accepted } } : {}),
    ...(about.length > 0 ? { about } : {}),
    ...(references.length > 0
      ? {
          citation: references.map((url) => ({
            '@type': 'CreativeWork',
            url,
          })),
        }
      : {}),
  };

  return jsonLd;
}
