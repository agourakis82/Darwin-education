'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FeatureState } from '@/components/ui/FeatureState';

interface ExamConfig {
  examName: string;
  totalQuestions: number;
  areaDistribution: Record<string, number>;
  useDefaultDistribution: boolean;
}

interface ExamResult {
  success: boolean;
  examId?: string;
  questions?: Array<{
    id: string;
    area: string;
    topic?: string;
    difficulty: number;
    bloomLevel: string;
    validationScore?: number;
  }>;
  metadata?: {
    totalQuestions: number;
    areaBreakdown: Record<string, number>;
    difficultyBreakdown: Record<number, number>;
    averageValidationScore: number;
    generationDuration_ms: number;
  };
}

const AREAS = [
  { value: 'clinica_medica', label: 'Clínica Médica', defaultPct: 30 },
  { value: 'cirurgia', label: 'Cirurgia', defaultPct: 20 },
  { value: 'ginecologia_obstetricia', label: 'GO', defaultPct: 15 },
  { value: 'pediatria', label: 'Pediatria', defaultPct: 15 },
  { value: 'saude_coletiva', label: 'Saúde Coletiva', defaultPct: 20 },
];

export function QGenExamTab() {
  const [config, setConfig] = useState<ExamConfig>({
    examName: 'Simulado ENAMED',
    totalQuestions: 100,
    areaDistribution: Object.fromEntries(AREAS.map((a) => [a.value, a.defaultPct / 100])),
    useDefaultDistribution: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 90));
      }, 1000);

      const response = await fetch('/api/qgen/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: config.examName,
          totalQuestions: config.totalQuestions,
          areaDistribution: config.useDefaultDistribution ? undefined : config.areaDistribution,
          requireClinicalCase: true,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Falha ao gerar prova');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateAreaDistribution = (area: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      areaDistribution: {
        ...prev.areaDistribution,
        [area]: value / 100,
      },
    }));
  };

  const totalPercentage = Object.values(config.areaDistribution).reduce(
    (sum, v) => sum + v * 100,
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-label-primary">Configuração da Prova</h2>

          {/* Exam Name */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Nome da Prova
            </label>
            <input
              type="text"
              value={config.examName}
              onChange={(e) => setConfig((prev) => ({ ...prev, examName: e.target.value }))}
              className="darwin-focus-ring w-full rounded-lg border border-separator/80 bg-surface-1 px-4 py-2 text-label-primary"
              placeholder="Simulado ENAMED"
            />
          </div>

          {/* Total Questions */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Total de Questões: {config.totalQuestions}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={config.totalQuestions}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, totalQuestions: parseInt(e.target.value) }))
              }
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-label-tertiary mt-1">
              <span>10</span>
              <span>100</span>
              <span>200</span>
            </div>
          </div>

          {/* Distribution Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-label-primary">
              Usar Distribuição ENAMED Padrão
            </label>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  useDefaultDistribution: !prev.useDefaultDistribution,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.useDefaultDistribution ? 'bg-emerald-600' : 'bg-surface-4'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.useDefaultDistribution ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Custom Distribution */}
          {!config.useDefaultDistribution && (
            <div className="space-y-3 p-4 bg-surface-1/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-label-secondary">Total:</span>
                <span
                  className={
                    Math.abs(totalPercentage - 100) < 1
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {totalPercentage.toFixed(0)}%
                </span>
              </div>

              {AREAS.map((area) => (
                <div key={area.value}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-label-secondary">{area.label}</span>
                    <span className="text-label-primary">
                      {Math.round(config.areaDistribution[area.value] * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={config.areaDistribution[area.value] * 100}
                    onChange={(e) =>
                      updateAreaDistribution(area.value, parseInt(e.target.value))
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (!config.useDefaultDistribution && Math.abs(totalPercentage - 100) >= 1)
            }
            loading={isGenerating}
            fullWidth
            size="lg"
            className="mt-4"
          >
            {isGenerating
              ? `Gerando... ${progress}%`
              : `Gerar Prova com ${config.totalQuestions} Questões`}
          </Button>

          {error && (
            <FeatureState
              kind="error"
              title="Falha na geração da prova"
              description={error}
              action={{ label: 'Tentar novamente', onClick: handleGenerate, variant: 'secondary' }}
              compact
            />
          )}
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold text-label-primary mb-4">Resultados</h2>

          {isGenerating && (
            <div className="darwin-panel rounded-2xl p-6">
              <div className="mb-4">
                <div className="w-full bg-surface-3 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-label-secondary text-center">
                Gerando {config.totalQuestions} questões...
              </p>
              <p className="text-label-tertiary text-xs text-center mt-2">
                Isso pode levar alguns minutos
              </p>
            </div>
          )}

          {!isGenerating && !result && !error && (
            <FeatureState
              kind="empty"
              title="Pronto para gerar uma prova completa"
              description="Configure nome, volume e distribuição para criar um simulado com rastreabilidade de qualidade."
              icon={<ClipboardList className="h-6 w-6" />}
              compact
            />
          )}

          {result && result.metadata && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="darwin-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-label-primary font-medium">
                    {result.examId}
                  </h3>
                  <span className="text-green-400 text-sm">
                    {result.metadata.totalQuestions} questões
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {(result.metadata.averageValidationScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-label-tertiary">Score Médio</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-label-primary">
                      {(result.metadata.generationDuration_ms / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-label-tertiary">Tempo</div>
                  </div>
                </div>
              </div>

              {/* Area Breakdown */}
              <div className="darwin-panel rounded-2xl p-4">
                <h4 className="text-sm font-medium text-label-secondary mb-3">
                  Distribuição por Área
                </h4>
                <div className="space-y-2">
                  {Object.entries(result.metadata.areaBreakdown).map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-label-secondary text-sm">
                        {AREAS.find((a) => a.value === area)?.label || area}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-surface-3 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{
                              width: `${(count / result.metadata!.totalQuestions) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-label-primary text-sm w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="darwin-panel rounded-2xl p-4">
                <h4 className="text-sm font-medium text-label-secondary mb-3">
                  Distribuição por Dificuldade
                </h4>
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5].map((diff) => (
                    <div key={diff} className="text-center">
                      <div className="text-xl font-bold text-label-primary">
                        {result.metadata?.difficultyBreakdown[diff] || 0}
                      </div>
                      <div className="text-xs text-label-tertiary">Nível {diff}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isGenerating && !result && (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-label-tertiary" />
              </div>
              <p className="text-label-secondary">
                Configure e gere uma prova completa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
