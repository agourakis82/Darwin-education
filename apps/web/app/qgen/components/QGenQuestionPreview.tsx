'use client';

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

const AREA_LABELS: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
};

export function QGenQuestionPreview({ question, showAnswer = true }: QuestionPreviewProps) {
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="bg-surface-1/50 shadow-elevation-1 rounded-lg p-6">
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
              <span className="text-green-400 text-sm">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Explanation */}
      {showAnswer && question.explanation && (
        <div className="mt-6 pt-4 border-t border-surface-3">
          <h4 className="text-sm font-medium text-label-secondary mb-2">Explicação:</h4>
          <p className="text-label-primary text-sm leading-relaxed">{question.explanation}</p>
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
