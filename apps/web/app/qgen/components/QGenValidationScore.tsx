'use client';

interface ValidationResult {
  overallScore: number;
  decision: string;
  stageResults: Record<string, { score: number; passed: boolean; flags: string[] }>;
}

interface QGenValidationScoreProps {
  result: ValidationResult;
}

const STAGE_LABELS: Record<string, string> = {
  structural: 'Estrutural',
  linguistic: 'Linguística',
  medicalAccuracy: 'Precisão Médica',
  distractorQuality: 'Distratores',
  originality: 'Originalidade',
  irtEstimation: 'Estimativa IRT',
};

const DECISION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  AUTO_APPROVE: {
    label: 'Aprovado Automaticamente',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
  },
  PENDING_REVIEW: {
    label: 'Pendente de Revisão',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
  },
  NEEDS_REVISION: {
    label: 'Precisa de Revisão',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
  },
  REJECT: {
    label: 'Rejeitado',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
  },
};

export function QGenValidationScore({ result }: QGenValidationScoreProps) {
  const decisionConfig = DECISION_CONFIG[result.decision] || DECISION_CONFIG.PENDING_REVIEW;
  const scorePercent = Math.round(result.overallScore * 100);

  return (
    <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-label-primary mb-4">Validação</h3>

      {/* Overall Score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-bold text-label-primary">{scorePercent}%</div>
          <div className={`text-sm ${decisionConfig.color}`}>{decisionConfig.label}</div>
        </div>
        <div className="w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#374151"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={getScoreColor(result.overallScore)}
              strokeWidth="3"
              strokeDasharray={`${scorePercent}, 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Stage Results */}
      <div className="space-y-3">
        {Object.entries(result.stageResults).map(([stage, stageResult]) => (
          <div key={stage} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  stageResult.passed ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-label-secondary text-sm">
                {STAGE_LABELS[stage] || stage}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 bg-surface-3 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${stageResult.score * 100}%`,
                    backgroundColor: getScoreColor(stageResult.score),
                  }}
                />
              </div>
              <span className="text-label-primary text-sm w-12 text-right">
                {Math.round(stageResult.score * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Flags */}
      {Object.entries(result.stageResults).some(([, s]) => s.flags.length > 0) && (
        <div className="mt-6 pt-4 border-t border-surface-3">
          <h4 className="text-sm font-medium text-label-secondary mb-3">Alertas:</h4>
          <div className="space-y-2">
            {Object.entries(result.stageResults)
              .filter(([, s]) => s.flags.length > 0)
              .flatMap(([stage, s]) =>
                s.flags.map((flag, idx) => (
                  <div
                    key={`${stage}-${idx}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-yellow-500">⚠</span>
                    <span className="text-label-secondary">
                      <strong className="text-label-primary">
                        {STAGE_LABELS[stage] || stage}:
                      </strong>{' '}
                      {flag}
                    </span>
                  </div>
                ))
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 0.85) return '#22c55e'; // green
  if (score >= 0.70) return '#eab308'; // yellow
  if (score >= 0.50) return '#f97316'; // orange
  return '#ef4444'; // red
}
