'use client';

import { useState, useEffect } from 'react';
import { AREA_LABELS } from '@/lib/area-colors';

interface QGenStats {
  overview: {
    totalGenerated: number;
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    approvalRate: number;
    averageValidationScore: number;
  };
  byArea: Record<
    string,
    {
      generated: number;
      approved: number;
      rejected: number;
      averageScore: number;
    }
  >;
  byDifficulty: Record<
    number,
    {
      count: number;
      averageScore: number;
    }
  >;
  byBloomLevel: Record<
    string,
    {
      count: number;
      averageScore: number;
    }
  >;
  timeline: Array<{
    date: string;
    generated: number;
    approved: number;
    rejected: number;
  }>;
  qualityMetrics: {
    commonIssues: Array<{
      issue: string;
      count: number;
      percentage: number;
    }>;
  };
}


const BLOOM_LABELS: Record<string, string> = {
  KNOWLEDGE: 'Conhecimento',
  COMPREHENSION: 'Compreensão',
  APPLICATION: 'Aplicação',
  ANALYSIS: 'Análise',
  SYNTHESIS: 'Síntese',
  EVALUATION: 'Avaliação',
};

export function QGenAnalyticsTab() {
  const [stats, setStats] = useState<QGenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/qgen/stats');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
        {error}
        <button
          onClick={fetchStats}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Geradas"
          value={stats.overview.totalGenerated}
          color="white"
        />
        <StatCard
          label="Aprovadas"
          value={stats.overview.totalApproved}
          color="green"
          percentage={
            stats.overview.totalGenerated > 0
              ? (stats.overview.totalApproved / stats.overview.totalGenerated) * 100
              : 0
          }
        />
        <StatCard
          label="Pendentes"
          value={stats.overview.totalPending}
          color="yellow"
        />
        <StatCard
          label="Rejeitadas"
          value={stats.overview.totalRejected}
          color="red"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Area */}
        <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Por Área</h3>
          <div className="space-y-4">
            {Object.entries(stats.byArea).map(([area, data]) => (
              <div key={area}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-label-secondary">
                    {AREA_LABELS[area] || area}
                  </span>
                  <span className="text-label-primary">{data.generated} questões</span>
                </div>
                <div className="flex gap-1 h-3">
                  <div
                    className="bg-green-500 rounded-l"
                    style={{
                      width: `${
                        data.generated > 0
                          ? (data.approved / data.generated) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-red-500 rounded-r"
                    style={{
                      width: `${
                        data.generated > 0
                          ? (data.rejected / data.generated) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-label-tertiary mt-1">
                  <span>Score: {(data.averageScore * 100).toFixed(0)}%</span>
                  <span>
                    {data.approved} aprovadas / {data.rejected} rejeitadas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Difficulty */}
        <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Por Dificuldade</h3>
          <div className="flex justify-between items-end h-40">
            {[1, 2, 3, 4, 5].map((diff) => {
              const data = stats.byDifficulty[diff] || { count: 0, averageScore: 0 };
              const maxCount = Math.max(
                ...Object.values(stats.byDifficulty).map((d) => d.count),
                1
              );
              const height = (data.count / maxCount) * 100;

              return (
                <div key={diff} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex justify-center">
                    <div
                      className="w-8 bg-emerald-500 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: data.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-label-primary font-medium">{data.count}</div>
                    <div className="text-xs text-label-tertiary">Nível {diff}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Bloom Level */}
        <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Por Nível de Bloom</h3>
          <div className="space-y-3">
            {Object.entries(stats.byBloomLevel).map(([bloom, data]) => {
              const maxCount = Math.max(
                ...Object.values(stats.byBloomLevel).map((d) => d.count),
                1
              );

              return (
                <div key={bloom} className="flex items-center gap-3">
                  <span className="text-label-secondary text-sm w-24 truncate">
                    {BLOOM_LABELS[bloom] || bloom}
                  </span>
                  <div className="flex-1 bg-surface-3 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full"
                      style={{ width: `${(data.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-label-primary text-sm w-8 text-right">{data.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Problemas Comuns</h3>
          {stats.qualityMetrics.commonIssues.length > 0 ? (
            <div className="space-y-3">
              {stats.qualityMetrics.commonIssues.slice(0, 5).map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-label-secondary text-sm truncate flex-1">
                    {issue.issue}
                  </span>
                  <span className="text-yellow-400 text-sm ml-2">
                    {issue.count} ({issue.percentage.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-label-tertiary text-sm">Nenhum problema registrado</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchStats}
          className="text-emerald-400 hover:text-emerald-300 text-sm"
        >
          ↻ Atualizar estatísticas
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  percentage,
}: {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}) {
  const colorClasses: Record<string, string> = {
    white: 'text-label-primary',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-4">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-label-tertiary">{label}</div>
      {percentage !== undefined && (
        <div className="text-xs text-surface-4 mt-1">{percentage.toFixed(1)}%</div>
      )}
    </div>
  );
}
