'use client';

import { useState, useEffect } from 'react';
import { QGenQuestionPreview } from './QGenQuestionPreview';

interface ReviewItem {
  id: string;
  question: {
    stem: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
  };
  area: string;
  topic?: string;
  validationScore: number;
  validationFlags: string[];
  generatedAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const PRIORITY_CONFIG = {
  HIGH: { label: 'Alta', color: 'text-red-400', bg: 'bg-red-900/30' },
  MEDIUM: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  LOW: { label: 'Baixa', color: 'text-green-400', bg: 'bg-green-900/30' },
};

const AREA_LABELS: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
};

export function QGenReviewTab() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [filter, setFilter] = useState<{ area?: string; priority?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviewQueue();
  }, [filter]);

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.area) params.set('area', filter.area);

      const response = await fetch(`/api/qgen/review?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch review queue');
      }

      let filteredItems = data.items;
      if (filter.priority) {
        filteredItems = filteredItems.filter(
          (item: ReviewItem) => item.priority === filter.priority
        );
      }

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: 'APPROVE' | 'REJECT' | 'REVISE') => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/qgen/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedItem.id,
          reviewerId: 'current-user', // Would come from auth
          decision,
          feedback: decision === 'REJECT' ? 'Rejected during review' : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Remove item from list and clear selection
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filter.area || ''}
          onChange={(e) => setFilter((prev) => ({ ...prev, area: e.target.value || undefined }))}
          className="bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary text-sm"
        >
          <option value="">Todas as Áreas</option>
          {Object.entries(AREA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filter.priority || ''}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, priority: e.target.value || undefined }))
          }
          className="bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary text-sm"
        >
          <option value="">Todas as Prioridades</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </select>

        <button
          onClick={fetchReviewQueue}
          className="text-emerald-400 hover:text-emerald-300 text-sm px-4 py-2"
        >
          ↻ Atualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Queue List */}
        <div>
          <h3 className="text-lg font-semibold text-label-primary mb-4">
            Fila de Revisão ({items.length})
          </h3>

          {items.length === 0 ? (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-8 text-center">
              <div className="text-label-tertiary text-6xl mb-4">✓</div>
              <p className="text-label-secondary">Nenhuma questão pendente de revisão</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {items.map((item) => {
                const priorityConfig = PRIORITY_CONFIG[item.priority];

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-emerald-900/30 border-emerald-600'
                        : 'bg-surface-1/50 border-surface-3 hover:border-surface-4'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-label-secondary text-sm">
                        {AREA_LABELS[item.area] || item.area}
                        {item.topic && ` / ${item.topic}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${priorityConfig.bg} ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>
                    </div>
                    <p className="text-label-primary text-sm line-clamp-2">
                      {item.question.stem.slice(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-label-tertiary">
                      <span>Score: {Math.round(item.validationScore * 100)}%</span>
                      <span>
                        {new Date(item.generatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Item Detail */}
        <div>
          <h3 className="text-lg font-semibold text-label-primary mb-4">Detalhes</h3>

          {selectedItem ? (
            <div className="space-y-4">
              <QGenQuestionPreview
                question={{
                  id: selectedItem.id,
                  stem: selectedItem.question.stem,
                  options: selectedItem.question.options.map((text, idx) => ({
                    text,
                    isCorrect: idx === selectedItem.question.correctAnswerIndex,
                  })),
                  correctAnswerIndex: selectedItem.question.correctAnswerIndex,
                  explanation: selectedItem.question.explanation,
                  area: selectedItem.area,
                  topic: selectedItem.topic,
                }}
              />

              {/* Validation Flags */}
              {selectedItem.validationFlags.length > 0 && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                  <h4 className="text-yellow-400 text-sm font-medium mb-2">
                    Alertas de Validação
                  </h4>
                  <ul className="space-y-1">
                    {selectedItem.validationFlags.map((flag, idx) => (
                      <li key={idx} className="text-yellow-200 text-sm flex items-start gap-2">
                        <span>⚠</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Review Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('APPROVE')}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-surface-4 text-white font-medium rounded-lg transition-colors"
                >
                  ✓ Aprovar
                </button>
                <button
                  onClick={() => handleReview('REVISE')}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-surface-4 text-white font-medium rounded-lg transition-colors"
                >
                  ✎ Revisar
                </button>
                <button
                  onClick={() => handleReview('REJECT')}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-surface-4 text-white font-medium rounded-lg transition-colors"
                >
                  ✕ Rejeitar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-8 text-center">
              <div className="text-label-tertiary text-6xl mb-4">👁️</div>
              <p className="text-label-secondary">
                Selecione uma questão para revisar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
