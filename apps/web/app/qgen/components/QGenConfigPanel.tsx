'use client';

interface QGenConfig {
  targetArea: string;
  targetTopic: string;
  targetDifficulty: number;
  targetBloomLevel: string;
  targetQuestionType: string;
  requireClinicalCase: boolean;
}

interface QGenConfigPanelProps {
  config: QGenConfig;
  onChange: (config: QGenConfig) => void;
}

const AREAS = [
  { value: 'clinica_medica', label: 'Clínica Médica' },
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'ginecologia_obstetricia', label: 'Ginecologia e Obstetrícia' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'saude_coletiva', label: 'Saúde Coletiva' },
];

const BLOOM_LEVELS = [
  { value: 'KNOWLEDGE', label: 'Conhecimento' },
  { value: 'COMPREHENSION', label: 'Compreensão' },
  { value: 'APPLICATION', label: 'Aplicação' },
  { value: 'ANALYSIS', label: 'Análise' },
  { value: 'SYNTHESIS', label: 'Síntese' },
  { value: 'EVALUATION', label: 'Avaliação' },
];

const QUESTION_TYPES = [
  { value: 'CLINICAL_CASE', label: 'Caso Clínico' },
  { value: 'CONCEPTUAL', label: 'Conceitual' },
  { value: 'INTERPRETATION', label: 'Interpretação' },
  { value: 'CALCULATION', label: 'Cálculo' },
];

const TOPICS_BY_AREA: Record<string, string[]> = {
  clinica_medica: [
    'Cardiologia',
    'Pneumologia',
    'Endocrinologia',
    'Nefrologia',
    'Gastroenterologia',
    'Neurologia',
    'Reumatologia',
    'Infectologia',
    'Hematologia',
  ],
  cirurgia: [
    'Cirurgia Geral',
    'Trauma',
    'Cirurgia Vascular',
    'Urologia',
    'Ortopedia',
    'Neurocirurgia',
  ],
  ginecologia_obstetricia: [
    'Pré-natal',
    'Parto',
    'Puerpério',
    'Ginecologia Geral',
    'Oncologia Ginecológica',
    'Infertilidade',
  ],
  pediatria: [
    'Neonatologia',
    'Puericultura',
    'Pediatria Geral',
    'Infectologia Pediátrica',
    'Pneumologia Pediátrica',
  ],
  saude_coletiva: [
    'Epidemiologia',
    'Vigilância em Saúde',
    'Atenção Primária',
    'Políticas de Saúde',
    'SUS',
  ],
};

export function QGenConfigPanel({ config, onChange }: QGenConfigPanelProps) {
  const topics = TOPICS_BY_AREA[config.targetArea] || [];

  const updateConfig = (key: keyof QGenConfig, value: string | number | boolean) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Area Select */}
      <div>
        <label className="block text-sm font-medium text-label-primary mb-2">
          Área
        </label>
        <select
          value={config.targetArea}
          onChange={(e) => {
            updateConfig('targetArea', e.target.value);
            updateConfig('targetTopic', '');
          }}
          className="w-full bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Select */}
      <div>
        <label className="block text-sm font-medium text-label-primary mb-2">
          Tópico (opcional)
        </label>
        <select
          value={config.targetTopic}
          onChange={(e) => updateConfig('targetTopic', e.target.value)}
          className="w-full bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Qualquer tópico</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Slider */}
      <div>
        <label className="block text-sm font-medium text-label-primary mb-2">
          Dificuldade: {config.targetDifficulty}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={config.targetDifficulty}
          onChange={(e) => updateConfig('targetDifficulty', parseInt(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-label-tertiary mt-1">
          <span>Fácil</span>
          <span>Médio</span>
          <span>Difícil</span>
        </div>
      </div>

      {/* Bloom Level */}
      <div>
        <label className="block text-sm font-medium text-label-primary mb-2">
          Nível de Bloom
        </label>
        <select
          value={config.targetBloomLevel}
          onChange={(e) => updateConfig('targetBloomLevel', e.target.value)}
          className="w-full bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {BLOOM_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-label-primary mb-2">
          Tipo de Questão
        </label>
        <select
          value={config.targetQuestionType}
          onChange={(e) => updateConfig('targetQuestionType', e.target.value)}
          className="w-full bg-surface-1 border border-surface-4 rounded-lg px-4 py-2 text-label-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clinical Case Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-label-primary">
          Exigir Caso Clínico
        </label>
        <button
          type="button"
          onClick={() => updateConfig('requireClinicalCase', !config.requireClinicalCase)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.requireClinicalCase ? 'bg-emerald-600' : 'bg-surface-4'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.requireClinicalCase ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
