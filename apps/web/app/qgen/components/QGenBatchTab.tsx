'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BatchConfig {
  count: number;
  area: string;
  difficultyRange: { min: number; max: number };
  bloomLevels: string[];
  concurrency: number;
}

interface BatchResult {
  success: boolean;
  results: Array<{
    success: boolean;
    question?: {
      id: string;
      stem: string;
    };
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration_ms: number;
  };
}

const AREAS = [
  { value: 'clinica_medica', label: 'Clínica Médica' },
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'ginecologia_obstetricia', label: 'Ginecologia e Obstetrícia' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'saude_coletiva', label: 'Saúde Coletiva' },
];

const BLOOM_LEVELS = [
  'KNOWLEDGE',
  'COMPREHENSION',
  'APPLICATION',
  'ANALYSIS',
  'SYNTHESIS',
  'EVALUATION',
];

export function QGenBatchTab() {
  const [config, setConfig] = useState<BatchConfig>({
    count: 10,
    area: 'clinica_medica',
    difficultyRange: { min: 2, max: 4 },
    bloomLevels: ['APPLICATION', 'ANALYSIS'],
    concurrency: 3,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Build configs array
      const configs = Array.from({ length: config.count }, (_, i) => ({
        targetArea: config.area,
        targetDifficulty: Math.floor(
          config.difficultyRange.min +
            Math.random() * (config.difficultyRange.max - config.difficultyRange.min + 1)
        ),
        targetBloomLevel:
          config.bloomLevels[Math.floor(Math.random() * config.bloomLevels.length)],
        requireClinicalCase: true,
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('/api/qgen/generate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs,
          options: {
            concurrency: config.concurrency,
            retryAttempts: 2,
            validateAfterGeneration: true,
          },
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate batch');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleBloomLevel = (level: string) => {
    setConfig((prev) => ({
      ...prev,
      bloomLevels: prev.bloomLevels.includes(level)
        ? prev.bloomLevels.filter((l) => l !== level)
        : [...prev.bloomLevels, level],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-label-primary">Configuração do Lote</h2>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Quantidade: {config.count}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={config.count}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, count: parseInt(e.target.value) }))
              }
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-label-tertiary mt-1">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">Área</label>
            <select
              value={config.area}
              onChange={(e) => setConfig((prev) => ({ ...prev, area: e.target.value }))}
              className="w-full bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary"
            >
              {AREAS.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Range */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Faixa de Dificuldade: {config.difficultyRange.min} - {config.difficultyRange.max}
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="1"
                max="5"
                value={config.difficultyRange.min}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    difficultyRange: {
                      ...prev.difficultyRange,
                      min: Math.min(parseInt(e.target.value), prev.difficultyRange.max),
                    },
                  }))
                }
                className="flex-1 accent-emerald-500"
              />
              <input
                type="range"
                min="1"
                max="5"
                value={config.difficultyRange.max}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    difficultyRange: {
                      ...prev.difficultyRange,
                      max: Math.max(parseInt(e.target.value), prev.difficultyRange.min),
                    },
                  }))
                }
                className="flex-1 accent-emerald-500"
              />
            </div>
          </div>

          {/* Bloom Levels */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Níveis de Bloom
            </label>
            <div className="flex flex-wrap gap-2">
              {BLOOM_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleBloomLevel(level)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    config.bloomLevels.includes(level)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-3 text-label-secondary hover:bg-surface-4'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Concurrency */}
          <div>
            <label className="block text-sm font-medium text-label-primary mb-2">
              Concorrência: {config.concurrency}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={config.concurrency}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, concurrency: parseInt(e.target.value) }))
              }
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || config.bloomLevels.length === 0}
            loading={isGenerating}
            fullWidth
            size="lg"
            className="mt-4"
          >
            {isGenerating ? `Gerando... ${progress}%` : `Gerar ${config.count} Questões`}
          </Button>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold text-label-primary mb-4">Resultados</h2>

          {isGenerating && (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
              <div className="mb-4">
                <div className="w-full bg-surface-3 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-label-secondary text-center">Gerando questões...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-label-primary">
                      {result.summary.total}
                    </div>
                    <div className="text-xs text-label-tertiary">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {result.summary.successful}
                    </div>
                    <div className="text-xs text-label-tertiary">Sucesso</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {result.summary.failed}
                    </div>
                    <div className="text-xs text-label-tertiary">Falhas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {(result.summary.duration_ms / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-label-tertiary">Tempo</div>
                  </div>
                </div>
              </div>

              {/* Individual Results */}
              <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-4 max-h-80 overflow-y-auto">
                {result.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-2 ${
                      idx > 0 ? 'border-t border-surface-3' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.success ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-label-secondary text-sm">Questão {idx + 1}</span>
                    </div>
                    <span className="text-label-tertiary text-xs truncate max-w-xs">
                      {r.success
                        ? r.question?.stem.slice(0, 50) + '...'
                        : r.error || 'Erro'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGenerating && !result && (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-label-tertiary" />
              </div>
              <p className="text-label-secondary">
                Configure e gere um lote de questões
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
