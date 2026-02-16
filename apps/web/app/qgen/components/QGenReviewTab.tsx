'use client';

import { useState, useEffect } from 'react';
import { Eye, Check, Pencil, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FeatureState } from '@/components/ui/FeatureState';
import { QGenQuestionPreview } from './QGenQuestionPreview';
import { AREA_LABELS } from '@/lib/area-colors';

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
        throw new Error(data.message || data.error || 'Falha ao buscar fila de revisão');
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
        throw new Error(data.message || data.error || 'Falha ao enviar revisão');
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
      <FeatureState
        kind="loading"
        title="Carregando fila de revisão"
        description="Buscando questões pendentes para validação manual."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filter.area || ''}
          onChange={(e) => setFilter((prev) => ({ ...prev, area: e.target.value || undefined }))}
          className="darwin-focus-ring rounded-lg border border-separator/80 bg-surface-1 px-4 py-2 text-sm text-label-primary"
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
          className="darwin-focus-ring rounded-lg border border-separator/80 bg-surface-1 px-4 py-2 text-sm text-label-primary"
        >
          <option value="">Todas as Prioridades</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </select>

        <Button
          onClick={fetchReviewQueue}
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Atualizar
        </Button>
      </div>

      {error && (
        <FeatureState
          kind="error"
          title="Erro na fila de revisão"
          description={error}
          action={{ label: 'Tentar novamente', onClick: fetchReviewQueue, variant: 'secondary' }}
          compact
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Queue List */}
        <div>
          <h3 className="text-lg font-semibold text-label-primary mb-4">
            Fila de Revisão ({items.length})
          </h3>

          {items.length === 0 ? (
            <FeatureState
              kind="empty"
              title="Nenhuma questão pendente"
              description="A fila está limpa. Novas questões aparecerão aqui quando precisarem de revisão."
              compact
              icon={<Check className="h-6 w-6" />}
            />
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
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-separator/80 bg-surface-1/55 hover:border-separator'
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
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Review Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReview('APPROVE')}
                  disabled={submitting}
                  leftIcon={<Check className="w-4 h-4" />}
                  fullWidth
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 from-green-600 to-green-600"
                >
                  Aprovar
                </Button>
                <Button
                  onClick={() => handleReview('REVISE')}
                  disabled={submitting}
                  leftIcon={<Pencil className="w-4 h-4" />}
                  fullWidth
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 from-yellow-600 to-yellow-600"
                >
                  Revisar
                </Button>
                <Button
                  onClick={() => handleReview('REJECT')}
                  disabled={submitting}
                  leftIcon={<X className="w-4 h-4" />}
                  fullWidth
                  size="lg"
                  variant="danger"
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          ) : (
            <FeatureState
              kind="empty"
              title="Selecione uma questão para revisar"
              description="Ao escolher um item na fila você verá o enunciado completo, flags e ações de decisão."
              icon={<Eye className="h-6 w-6" />}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}
