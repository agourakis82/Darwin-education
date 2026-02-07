'use client';

import { useState } from 'react';
import { QGenConfigPanel } from './QGenConfigPanel';
import { QGenQuestionPreview } from './QGenQuestionPreview';
import { QGenValidationScore } from './QGenValidationScore';

interface GeneratedQuestion {
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
}

interface ValidationResult {
  overallScore: number;
  decision: string;
  stageResults: Record<string, { score: number; passed: boolean; flags: string[] }>;
}

export function QGenGenerateTab() {
  const [config, setConfig] = useState({
    targetArea: 'clinica_medica',
    targetTopic: '',
    targetDifficulty: 3,
    targetBloomLevel: 'APPLICATION',
    targetQuestionType: 'CLINICAL_CASE',
    requireClinicalCase: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedQuestion(null);
    setValidationResult(null);

    try {
      const response = await fetch('/api/qgen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            targetArea: config.targetArea,
            targetTopic: config.targetTopic || undefined,
            targetDifficulty: config.targetDifficulty,
            targetBloomLevel: config.targetBloomLevel,
            targetQuestionType: config.targetQuestionType,
            requireClinicalCase: config.requireClinicalCase,
          },
          validateAfterGeneration: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate question');
      }

      setGeneratedQuestion(data.question);
      setValidationResult(data.validationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div>
          <h2 className="text-lg font-semibold text-label-primary mb-4">Configuração</h2>
          <QGenConfigPanel config={config} onChange={setConfig} />

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-elevation-1 hover:bg-emerald-700 disabled:bg-surface-4 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Gerando...
              </>
            ) : (
              <>
                <span>✨</span>
                Gerar Questão
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div>
          <h2 className="text-lg font-semibold text-label-primary mb-4">Prévia</h2>
          {generatedQuestion ? (
            <div className="space-y-4">
              <QGenQuestionPreview question={generatedQuestion} />
              {validationResult && (
                <QGenValidationScore result={validationResult} />
              )}
            </div>
          ) : (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-8 text-center">
              <div className="text-label-tertiary text-6xl mb-4">📝</div>
              <p className="text-label-secondary">
                Configure os parâmetros e clique em &quot;Gerar Questão&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
