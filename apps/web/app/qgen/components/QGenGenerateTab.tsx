'use client';

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FeatureState } from '@/components/ui/FeatureState';
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
        throw new Error(data.message || data.error || 'Falha ao gerar questão');
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

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            loading={isGenerating}
            leftIcon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
            fullWidth
            size="lg"
            className="mt-6"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Questão'}
          </Button>

          {error && (
            <FeatureState
              kind="error"
              title="Falha na geração de questão"
              description={error}
              action={{ label: 'Tentar novamente', onClick: handleGenerate, variant: 'secondary' }}
              compact
              className="mt-4"
            />
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
            <FeatureState
              kind="empty"
              title="Prévia aguardando geração"
              description="Configure os parâmetros e clique em “Gerar Questão” para visualizar o resultado com validação."
              icon={<FileText className="h-6 w-6" />}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}
