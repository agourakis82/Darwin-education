# QGen-DDL: Sistema de Geração de Questões Médicas
## PARTE 5: FRONTEND DASHBOARD, ANALYTICS, ROADMAP E RESEARCH PAPER

---

## 1. QGen Dashboard (React Component)

```tsx
// ============================================================
// QGEN DASHBOARD
// src/app/qgen/page.tsx
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================
// TYPES
// ============================================================

interface GenerationConfig {
  area: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  bloomLevel: string;
  questionType: string;
  keyConcepts: string[];
  misconceptions: string[];
  numAlternatives: number;
  autoValidate: boolean;
  minQualityScore: number;
}

interface GeneratedQuestion {
  id: string;
  stem: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  area: string;
  topic: string;
  bloomLevel: string;
  estimatedDifficulty: number;
  qualityScores: {
    medicalAccuracy: number;
    linguisticQuality: number;
    distractorQuality: number;
    originality: number;
    overall: number;
  };
}

interface ValidationResult {
  decision: string;
  scores: Record<string, number>;
  issues: { stage: string; severity: string; message: string }[];
}

interface CorpusStats {
  totalQuestions: number;
  byArea: Record<string, number>;
  byBloomLevel: Record<string, number>;
  byDifficulty: { mean: number; std: number };
}

// ============================================================
// CONSTANTS
// ============================================================

const MEDICAL_AREAS = [
  'Clínica Médica',
  'Cirurgia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
  'Psiquiatria',
  'Ética e Bioética',
];

const BLOOM_LEVELS = [
  { value: 'KNOWLEDGE', label: 'Conhecimento (1)', color: '#94a3b8' },
  { value: 'COMPREHENSION', label: 'Compreensão (2)', color: '#60a5fa' },
  { value: 'APPLICATION', label: 'Aplicação (3)', color: '#34d399' },
  { value: 'ANALYSIS', label: 'Análise (4)', color: '#fbbf24' },
  { value: 'SYNTHESIS', label: 'Síntese (5)', color: '#f97316' },
  { value: 'EVALUATION', label: 'Avaliação (6)', color: '#ef4444' },
];

const QUESTION_TYPES = [
  { value: 'CLINICAL_CASE', label: 'Caso Clínico', icon: '🏥' },
  { value: 'CONCEPTUAL', label: 'Conceitual', icon: '📖' },
  { value: 'INTERPRETATION', label: 'Interpretação', icon: '🔬' },
  { value: 'ETHICAL_LEGAL', label: 'Ético/Legal', icon: '⚖️' },
  { value: 'EPIDEMIOLOGICAL', label: 'Epidemiológico', icon: '📊' },
];

const TOPICS_BY_AREA: Record<string, string[]> = {
  'Clínica Médica': [
    'Cardiologia', 'Pneumologia', 'Endocrinologia', 'Nefrologia',
    'Gastroenterologia', 'Reumatologia', 'Hematologia', 'Infectologia',
    'Neurologia', 'Dermatologia',
  ],
  'Cirurgia': [
    'Abdome Agudo', 'Trauma', 'Cirurgia do Trato Digestivo',
    'Cirurgia Vascular', 'Cirurgia Torácica', 'Hérnias',
    'Pré e Pós-Operatório',
  ],
  'Pediatria': [
    'Puericultura', 'Neonatologia', 'Infecções na Infância',
    'Distúrbios Nutricionais', 'Vacinação', 'Doenças Respiratórias',
    'Desenvolvimento Neuropsicomotor',
  ],
  'Ginecologia e Obstetrícia': [
    'Pré-Natal', 'Trabalho de Parto', 'Sangramentos na Gestação',
    'Síndromes Hipertensivas', 'Contracepção', 'Câncer Ginecológico',
    'Climatério',
  ],
  'Medicina Preventiva': [
    'Epidemiologia', 'Bioestatística', 'Vigilância Epidemiológica',
    'Atenção Primária', 'SUS', 'Saúde do Trabalhador',
  ],
  'Psiquiatria': [
    'Depressão', 'Transtornos de Ansiedade', 'Esquizofrenia',
    'Transtorno Bipolar', 'Dependência Química', 'Emergências Psiquiátricas',
  ],
  'Ética e Bioética': [
    'Código de Ética Médica', 'Consentimento Informado',
    'Sigilo Médico', 'Morte Encefálica', 'Eutanásia',
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function QGenDashboard() {
  // State
  const [activeTab, setActiveTab] = useState<'generate' | 'batch' | 'exam' | 'analytics'>('generate');
  const [config, setConfig] = useState<GenerationConfig>({
    area: 'Clínica Médica',
    topic: 'Cardiologia',
    subtopic: '',
    difficulty: 3,
    bloomLevel: 'APPLICATION',
    questionType: 'CLINICAL_CASE',
    keyConcepts: [],
    misconceptions: [],
    numAlternatives: 5,
    autoValidate: true,
    minQualityScore: 0.70,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    question: GeneratedQuestion | null;
    validation: ValidationResult | null;
  } | null>(null);
  const [history, setHistory] = useState<GeneratedQuestion[]>([]);
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [conceptInput, setConceptInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch('/api/qgen/stats');
      const data = await res.json();
      setStats(data.stats);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  // ============================================================
  // GENERATION HANDLER
  // ============================================================

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/qgen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult({
        question: data.question,
        validation: data.validation,
      });

      if (data.question) {
        setHistory(prev => [data.question, ...prev].slice(0, 20));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CONCEPT MANAGEMENT
  // ============================================================

  function addConcept() {
    if (conceptInput.trim() && !config.keyConcepts.includes(conceptInput.trim())) {
      setConfig(prev => ({
        ...prev,
        keyConcepts: [...prev.keyConcepts, conceptInput.trim()],
      }));
      setConceptInput('');
    }
  }

  function removeConcept(concept: string) {
    setConfig(prev => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter(c => c !== concept),
    }));
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          🧬 QGen-DDL
        </h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          Question Generation System for Medical Education
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'generate', label: '🎯 Gerar Questão', },
          { key: 'batch', label: '📦 Batch', },
          { key: 'exam', label: '📝 Simulado', },
          { key: 'analytics', label: '📊 Analytics', },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#3b82f6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#64748b',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* GENERATE TAB */}
      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
          {/* CONFIG PANEL */}
          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Configuração
            </h3>

            {/* Area */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Área</span>
              <select
                value={config.area}
                onChange={e => setConfig(prev => ({ ...prev, area: e.target.value, topic: '' }))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              >
                {MEDICAL_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>

            {/* Topic */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tema</span>
              <select
                value={config.topic}
                onChange={e => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              >
                <option value="">Selecione...</option>
                {(TOPICS_BY_AREA[config.area] || []).map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </label>

            {/* Subtopic */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Subtema (opcional)</span>
              <input
                type="text"
                value={config.subtopic}
                onChange={e => setConfig(prev => ({ ...prev, subtopic: e.target.value }))}
                placeholder="Ex: Insuficiência Cardíaca"
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              />
            </label>

            {/* Difficulty */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Dificuldade: {config.difficulty}/5
              </span>
              <input
                type="range"
                min={1}
                max={5}
                value={config.difficulty}
                onChange={e => setConfig(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                style={{ width: '100%', marginTop: 4 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                <span>Fácil</span><span>Médio</span><span>Difícil</span>
              </div>
            </label>

            {/* Bloom Level */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Nível de Bloom</span>
              <select
                value={config.bloomLevel}
                onChange={e => setConfig(prev => ({ ...prev, bloomLevel: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4 }}
              >
                {BLOOM_LEVELS.map(bl => (
                  <option key={bl.value} value={bl.value}>{bl.label}</option>
                ))}
              </select>
            </label>

            {/* Question Type */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tipo de Questão</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                {QUESTION_TYPES.map(qt => (
                  <button
                    key={qt.value}
                    onClick={() => setConfig(prev => ({ ...prev, questionType: qt.value }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: config.questionType === qt.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: config.questionType === qt.value ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                  >
                    {qt.icon} {qt.label}
                  </button>
                ))}
              </div>
            </label>

            {/* Key Concepts */}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Conceitos-Chave</span>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input
                  type="text"
                  value={conceptInput}
                  onChange={e => setConceptInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addConcept()}
                  placeholder="Adicionar conceito..."
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
                <button
                  onClick={addConcept}
                  style={{
                    padding: '8px 12px', borderRadius: 6,
                    border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {config.keyConcepts.map(concept => (
                  <span
                    key={concept}
                    style={{
                      padding: '4px 8px', borderRadius: 12,
                      background: '#dbeafe', fontSize: 11,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {concept}
                    <button
                      onClick={() => removeConcept(concept)}
                      style={{
                        border: 'none', background: 'none',
                        cursor: 'pointer', fontSize: 14, color: '#64748b',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </label>

            {/* Quality Settings */}
            <div style={{
              background: 'white',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              border: '1px solid #e2e8f0',
            }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Qualidade</span>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={config.autoValidate}
                    onChange={e => setConfig(prev => ({ ...prev, autoValidate: e.target.checked }))}
                  />
                  Auto-validação
                </label>
                <label style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  Score mínimo: {config.minQualityScore.toFixed(2)}
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={config.minQualityScore * 100}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      minQualityScore: parseInt(e.target.value) / 100,
                    }))}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
              onClick={handleGenerate}
              disabled={loading || !config.topic}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#94a3b8' : '#3b82f6',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? '⏳ Gerando...' : '🧬 Gerar Questão'}
            </button>
          </div>

          {/* RESULT PANEL */}
          <div>
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                color: '#dc2626',
              }}>
                ❌ {error}
              </div>
            )}

            {loading && (
              <div style={{
                background: '#f0f9ff',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
                border: '1px solid #bae6fd',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧬</div>
                <p style={{ fontWeight: 600, color: '#0369a1' }}>Gerando questão...</p>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                  Elaborando vinheta → Construindo distratores → Validando qualidade
                </p>
              </div>
            )}

            {result?.question && (
              <div>
                {/* Validation Badge */}
                {result.validation && (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      background: result.validation.decision === 'AUTO_APPROVE' ? '#dcfce7' :
                        result.validation.decision === 'PENDING_REVIEW' ? '#fef3c7' :
                        result.validation.decision === 'NEEDS_REVISION' ? '#fed7aa' : '#fecaca',
                      color: result.validation.decision === 'AUTO_APPROVE' ? '#166534' :
                        result.validation.decision === 'PENDING_REVIEW' ? '#92400e' :
                        result.validation.decision === 'NEEDS_REVISION' ? '#9a3412' : '#991b1b',
                    }}>
                      {result.validation.decision === 'AUTO_APPROVE' ? '✅' :
                       result.validation.decision === 'PENDING_REVIEW' ? '⏳' :
                       result.validation.decision === 'NEEDS_REVISION' ? '⚠️' : '❌'}
                      {' '}{result.validation.decision}
                    </span>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 13,
                      background: '#f1f5f9',
                    }}>
                      Score: {(result.validation.scores.weighted * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                {/* Question Card */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #e2e8f0',
                  marginBottom: 16,
                }}>
                  {/* Metadata */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 12, background: '#dbeafe', fontSize: 11 }}>
                      {result.question.area}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 12, background: '#e0e7ff', fontSize: 11 }}>
                      {result.question.topic}
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 12, background: '#fef3c7', fontSize: 11 }}>
                      Bloom: {result.question.bloomLevel}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11,
                      background: result.question.estimatedDifficulty > 0.5 ? '#fee2e2' :
                        result.question.estimatedDifficulty > 0 ? '#fef9c3' : '#dcfce7',
                    }}>
                      IRT: {result.question.estimatedDifficulty.toFixed(2)}
                    </span>
                  </div>

                  {/* Stem */}
                  <div style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    marginBottom: 20,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {result.question.stem}
                  </div>

                  {/* Alternatives */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(result.question.alternatives).map(([key, text]) => (
                      <div
                        key={key}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: key === result.question!.correctAnswer
                            ? '2px solid #22c55e'
                            : '1px solid #e2e8f0',
                          background: key === result.question!.correctAnswer
                            ? '#f0fdf4'
                            : '#fafafa',
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>{key})</strong> {text}
                        {key === result.question!.correctAnswer && (
                          <span style={{ marginLeft: 8, color: '#16a34a' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {result.question.explanation && (
                  <div style={{
                    background: '#fffbeb',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid #fde68a',
                    marginBottom: 16,
                  }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
                      📝 Comentário
                    </h4>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: '#78350f' }}>
                      {result.question.explanation}
                    </p>
                  </div>
                )}

                {/* Quality Scores */}
                {result.validation && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid #e2e8f0',
                  }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                      📊 Scores de Qualidade
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Acurácia Médica', key: 'medicalAccuracy', weight: '30%' },
                        { label: 'Distratores', key: 'distractorQuality', weight: '25%' },
                        { label: 'Linguística', key: 'linguistic', weight: '20%' },
                        { label: 'Originalidade', key: 'originality', weight: '15%' },
                        { label: 'Alinhamento IRT', key: 'irtAlignment', weight: '10%' },
                        { label: 'Score Final', key: 'weighted', weight: '—' },
                      ].map(metric => {
                        const score = result.validation!.scores[metric.key] || 0;
                        return (
                          <div
                            key={metric.key}
                            style={{
                              background: 'white',
                              borderRadius: 8,
                              padding: 12,
                              textAlign: 'center',
                              border: metric.key === 'weighted' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ fontSize: 11, color: '#64748b' }}>{metric.label}</div>
                            <div style={{
                              fontSize: 24,
                              fontWeight: 700,
                              color: score >= 0.85 ? '#16a34a' :
                                score >= 0.70 ? '#ca8a04' :
                                score >= 0.50 ? '#ea580c' : '#dc2626',
                              marginTop: 4,
                            }}>
                              {(score * 100).toFixed(0)}%
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>Peso: {metric.weight}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Issues */}
                    {result.validation.issues.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <h5 style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                          ⚠️ Issues ({result.validation.issues.length})
                        </h5>
                        {result.validation.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: issue.severity === 'CRITICAL' ? '#fef2f2' :
                                issue.severity === 'HIGH' ? '#fff7ed' : '#fefce8',
                              marginBottom: 4,
                              fontSize: 12,
                            }}
                          >
                            <strong>[{issue.stage}]</strong> {issue.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {history.length > 0 && !loading && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>
                  📋 Histórico ({history.length})
                </h4>
                {history.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      marginBottom: 6,
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                    onClick={() => setResult({ question: q, validation: null })}
                  >
                    <span>
                      <strong>{q.area}</strong> — {q.topic} — {q.bloomLevel}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      background: q.qualityScores.overall >= 0.8 ? '#dcfce7' : '#fef3c7',
                    }}>
                      {(q.qualityScores.overall * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {/* Total Questions */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'white',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#3b82f6' }}>
              {stats.totalQuestions.toLocaleString()}
            </div>
            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              Questões no Corpus
            </div>
          </div>

          {/* Area Distribution */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Distribuição por Área
            </h3>
            {Object.entries(stats.byArea)
              .sort(([, a], [, b]) => b - a)
              .map(([area, count]) => {
                const pct = (count / stats.totalQuestions * 100);
                return (
                  <div key={area} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{area}</span>
                      <span style={{ color: '#64748b' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{
                      height: 8,
                      background: '#f1f5f9',
                      borderRadius: 4,
                      marginTop: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: '#3b82f6',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bloom Distribution */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Distribuição por Bloom
            </h3>
            {BLOOM_LEVELS.map(bl => {
              const count = stats.byBloomLevel[bl.value] || 0;
              const pct = stats.totalQuestions > 0 ? (count / stats.totalQuestions * 100) : 0;
              return (
                <div key={bl.value} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{bl.label}</span>
                    <span style={{ color: '#64748b' }}>{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{
                    height: 8,
                    background: '#f1f5f9',
                    borderRadius: 4,
                    marginTop: 4,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: bl.color,
                      borderRadius: 4,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXAM TAB */}
      {activeTab === 'exam' && (
        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 64 }}>📝</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>
            Gerador de Simulados
          </h3>
          <p style={{ color: '#64748b', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
            Configure distribuição por área, dificuldade e tipo de questão para gerar
            um simulado completo (até 120 questões) com validação automática.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>
            🚧 Em implementação — disponível em breve
          </p>
        </div>
      )}

      {/* BATCH TAB */}
      {activeTab === 'batch' && (
        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 64 }}>📦</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>
            Geração em Lote
          </h3>
          <p style={{ color: '#64748b', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
            Gere múltiplas questões simultaneamente com configurações variadas.
            Upload de CSV com especificações ou configuração visual.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>
            🚧 Em implementação — disponível em breve
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Implementation Roadmap

```
══════════════════════════════════════════════════════════════════
                    QGen-DDL IMPLEMENTATION ROADMAP
══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: CORPUS & INFRASTRUCTURE (Q1 2026 — 6 weeks)      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Week 1-2: Database & Schema                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Run SQL migrations (all tables)                   │    │
│  │  □ Set up pgvector extension for embeddings          │    │
│  │  □ Create RLS policies                               │    │
│  │  □ Deploy misconceptions seed data                   │    │
│  │  □ Set up Supabase Edge Functions for heavy compute  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 3-4: Corpus Collection                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Collect ENAMED 2022-2025 questions (~400)         │    │
│  │  □ Collect ENARE historical questions (~1000)        │    │
│  │  □ Collect institutional provas (USP/UNIFESP/etc)    │    │
│  │  □ Build ingestion pipeline (OCR + parsing)          │    │
│  │  □ Manual annotation of 500 questions (gold standard)│    │
│  │  □ Generate embeddings for all questions             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 5-6: Feature Extraction Pipeline                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Implement CorpusAnalysisService                   │    │
│  │  □ Extract structural features (all questions)       │    │
│  │  □ Extract clinical features (clinical cases)        │    │
│  │  □ Extract cognitive features (Bloom classification) │    │
│  │  □ Extract linguistic features                       │    │
│  │  □ Classify distractor types                         │    │
│  │  □ Validate against gold standard annotations        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  DELIVERABLE: Annotated corpus with full feature extraction  │
│  KPI: ≥3000 questions ingested, ≥500 manually validated     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: GENERATION ENGINE (Q2 2026 — 6 weeks)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Week 7-8: Prompt Engineering                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Implement system prompt (QGEN_SYSTEM_PROMPT)      │    │
│  │  □ Implement clinical case generator prompt          │    │
│  │  □ Implement conceptual question prompt              │    │
│  │  □ Implement image-based prompt                      │    │
│  │  □ Create few-shot examples for each area            │    │
│  │  □ A/B test prompt variations (N=50 per variant)     │    │
│  │  □ Calibrate temperature and model selection         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 9-10: Generation Service                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Implement QGenGenerationService                   │    │
│  │  □ Implement distractor refinement pipeline          │    │
│  │  □ Implement batch generation                        │    │
│  │  □ Implement exam generation                         │    │
│  │  □ API routes (generate, batch, exam)                │    │
│  │  □ Rate limiting and error handling                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 11-12: Validation Pipeline                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Implement 6-stage validation pipeline             │    │
│  │  □ Structural validation (JSON schema)               │    │
│  │  □ Linguistic analysis (hedging, cues)               │    │
│  │  □ Medical accuracy check (LLM-based)                │    │
│  │  □ Distractor quality analysis                       │    │
│  │  □ Originality check (embedding similarity)          │    │
│  │  □ IRT estimation heuristic                          │    │
│  │  □ Aggregation and decision logic                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  DELIVERABLE: Working generation engine with validation     │
│  KPI: ≥70% auto-approval rate, <5% medical errors          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: DDL INTEGRATION & PILOT (Q3 2026 — 6 weeks)      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Week 13-14: DDL↔QGen Integration                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Implement adaptive strategy selector              │    │
│  │  □ LE → conceptual question generation               │    │
│  │  □ LEm → application question generation             │    │
│  │  □ LIE → integration question generation             │    │
│  │  □ Feedback loop implementation                      │    │
│  │  □ User progress tracking                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 15-16: Frontend Dashboard                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ QGen Dashboard (single generation)                │    │
│  │  □ Exam Generator UI                                 │    │
│  │  □ Analytics Dashboard (corpus stats)                │    │
│  │  □ Human Review Interface                            │    │
│  │  □ Student-facing adaptive question UI               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 17-18: Pilot Study                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Generate 500 questions (all areas)                │    │
│  │  □ Expert review (2 reviewers × 500 questions)       │    │
│  │  □ Pilot with 200 medical students                   │    │
│  │  □ Collect response data                             │    │
│  │  □ Calculate actual IRT parameters                   │    │
│  │  □ Compare estimated vs actual IRT                   │    │
│  │  □ Assess inter-rater reliability                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  DELIVERABLE: Validated system with pilot results           │
│  KPI: ICC >0.80, estimated-actual IRT r >0.70               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: PUBLICATION & SCALE (Q4 2026 — 6 weeks)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Week 19-20: Calibration & Optimization                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Calibrate IRT estimation model from pilot data    │    │
│  │  □ Refine prompts based on expert feedback           │    │
│  │  □ Update misconceptions database                    │    │
│  │  □ Optimize validation thresholds                    │    │
│  │  □ Implement CAT (Computerized Adaptive Testing)     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 21-22: Paper Writing                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Write methods section                             │    │
│  │  □ Statistical analysis of pilot results             │    │
│  │  □ Figures and tables                                │    │
│  │  □ Discussion and limitations                        │    │
│  │  □ Internal review (3 cycles minimum)                │    │
│  │  □ Submit to Medical Education journal               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Week 23-24: Scale & Deploy                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  □ Production deployment                             │    │
│  │  □ Multi-institution pilot                           │    │
│  │  □ Performance monitoring                            │    │
│  │  □ Usage analytics                                   │    │
│  │  □ Documentation and API docs                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  DELIVERABLE: Published paper + production system           │
│  KPI: Paper submitted to Q1 journal, >1000 students served  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Research Paper Outline

```
══════════════════════════════════════════════════════════════════
  PAPER: "Reverse Engineering Medical Residency Examinations:
  An AI-Driven Approach to Automated Question Generation with
  Differential Diagnosis of Learning Gaps"
══════════════════════════════════════════════════════════════════

Target Journal: Medical Education (Wiley) or Academic Medicine (AAMC)
Impact Factor: ~6.0-7.0

ABSTRACT (250 words)
─────────────────────
Background: Medical residency examinations follow implicit but
consistent patterns. Large language models offer potential for
automated question generation but lack systematic validation.

Objective: To develop and validate QGen-DDL, an AI-driven system
that (1) extracts psychometric patterns from a corpus of Brazilian
medical exam questions, (2) generates novel questions calibrated
to specific difficulty and cognitive levels, and (3) integrates
with a Differential Diagnosis of Learning Gaps (DDL) framework
for adaptive assessment.

Methods: We analyzed N=X questions from ENAMED, ENARE, and
institutional exams, extracting structural, clinical, cognitive,
and linguistic features. Questions were generated using
Claude API with specialized prompts, validated through a
6-stage automated pipeline, and piloted with N=200 medical
students. Inter-rater reliability, IRT parameters, and
DDL classification accuracy were assessed.

Results: [To be filled with pilot data]

Conclusions: [To be filled]

SECTIONS
─────────────────────

1. INTRODUCTION
   1.1 Medical examination question quality challenges
   1.2 Current approaches to automated question generation
   1.3 The need for psychometric-aware generation
   1.4 Integration with adaptive learning systems
   1.5 Study objectives

2. METHODS
   2.1 Study Design
       - Corpus analysis + generation + validation study
       - IRB approval (CEP)
   
   2.2 Corpus Collection and Analysis
       - Sources (ENAMED, ENARE, institutional)
       - Feature extraction methodology
       - Inter-rater reliability for annotations
   
   2.3 QGen-DDL System Architecture
       2.3.1 Feature Schema (5 categories)
       2.3.2 Prompt Engineering (system prompt, templates)
       2.3.3 Generation Pipeline
       2.3.4 Validation Pipeline (6 stages)
   
   2.4 DDL Integration
       - Classification taxonomy (LE, LEm, LIE)
       - Adaptive strategy mapping
       - Feedback loop
   
   2.5 Pilot Study
       - Participants (N=200 medical students)
       - Protocol (500 generated questions)
       - Expert review (2 reviewers, blinded)
       - Student application (timed)
   
   2.6 Statistical Analysis
       - IRT (3PL model, ltm package in R)
       - Inter-rater reliability (ICC, Cohen's κ)
       - Correlation: estimated vs actual difficulty
       - DIF analysis (gender, year of study)

3. RESULTS
   3.1 Corpus Analysis
       - Distribution statistics (area, bloom, difficulty)
       - Pattern characterization
   
   3.2 Generation Performance
       - Auto-approval rate
       - Quality score distribution
       - Time and cost per question
   
   3.3 Expert Validation
       - Medical accuracy agreement
       - Distractor quality ratings
       - Comparison with human-written questions
   
   3.4 Psychometric Properties
       - IRT parameters (a, b, c)
       - Estimated vs actual IRT correlation
       - Test information curves
   
   3.5 DDL Integration Results
       - Classification accuracy
       - Adaptive question effectiveness

4. DISCUSSION
   4.1 Principal findings
   4.2 Comparison with existing systems
   4.3 Implications for medical education
   4.4 Limitations
   4.5 Future directions

5. CONCLUSIONS

TABLES
─────────────────────
Table 1: Corpus characteristics by source
Table 2: Feature distribution across exam sources
Table 3: Generation quality scores by area and difficulty
Table 4: Expert validation results (agreement statistics)
Table 5: IRT parameters: generated vs human-written questions
Table 6: DDL classification accuracy by lacuna type

FIGURES
─────────────────────
Figure 1: QGen-DDL system architecture (flowchart)
Figure 2: Feature extraction pipeline
Figure 3: Corpus analysis — difficulty and Bloom distributions
Figure 4: Quality score distributions (violin plots)
Figure 5: Estimated vs actual IRT difficulty (scatter + regression)
Figure 6: Test information curves (generated vs corpus)
Figure 7: DDL adaptive loop performance over time

SUPPLEMENTARY MATERIAL
─────────────────────
S1: Complete feature schema (TypeScript interfaces)
S2: System prompt text
S3: Example generated questions (5 per area)
S4: Validation pipeline technical details
S5: Misconceptions database (full)
S6: Statistical analysis code (R)
```

---

## 4. Cost Estimation

```
══════════════════════════════════════════════════════════════════
                      COST ANALYSIS
══════════════════════════════════════════════════════════════════

Per-Question Generation Cost (Claude Sonnet 4):
────────────────────────────────────────────────
  System prompt tokens:  ~3,000 tokens
  User prompt tokens:    ~2,000 tokens
  Output tokens:         ~1,500 tokens
  Validation call:       ~1,500 tokens (input) + ~500 tokens (output)
  Distractor refine:     ~1,500 tokens (if needed, ~30% of time)
  ────────────────────────────────
  Total per question:    ~8,000 input + ~2,500 output tokens
  
  Cost per question:
    Input:  8,000 × $3/1M = $0.024
    Output: 2,500 × $15/1M = $0.038
    ─────────────────────────────
    Total:                  ~$0.06 per question
    With retries (avg 1.3): ~$0.08 per question

Batch Generation Costs:
────────────────────────────────────────────────
  500 questions (pilot):    ~$40
  1000 questions (exam bank): ~$80
  100-question exam:        ~$8
  
Infrastructure:
────────────────────────────────────────────────
  Supabase Pro:             $25/month
  pgvector compute:         $0 (included)
  Vercel hosting:           $20/month
  ─────────────────────────────
  Monthly infra:            ~$45/month

Total Pilot Study Budget:
────────────────────────────────────────────────
  Question generation (500):        $40
  Validation calls:                 $20
  Infrastructure (3 months):        $135
  Embeddings (OpenAI):              $5
  ─────────────────────────────────────
  Total pilot:                      ~$200
  
  EXTREMELY cost-effective vs manual question writing
  (estimated $50-100 per question by expert)
```

---

## 5. Checklist de Implementação Imediata

```
════════════════════════════════════════════════
  IMMEDIATE NEXT STEPS (This Week)
════════════════════════════════════════════════

□ 1. Run SQL migrations
      - Copy PART 1 schema → Supabase SQL editor
      - Execute misconceptions seed (PART 4)
      - Verify all tables created

□ 2. Create file structure
      apps/web/src/lib/qgen/
      ├── types/features.ts
      ├── prompts/
      │   ├── system-prompt.ts
      │   ├── clinical-case.ts
      │   ├── conceptual.ts
      │   ├── image-based.ts
      │   ├── distractor-generator.ts
      │   ├── quality-validator.ts
      │   ├── complete-template.ts
      │   └── few-shot-examples.ts
      └── services/
          ├── generation-service.ts
          ├── validation-service.ts
          └── corpus-analysis-service.ts

□ 3. Implement API routes
      apps/web/src/app/api/qgen/
      ├── generate/route.ts
      ├── adaptive/route.ts
      ├── misconceptions/route.ts
      └── stats/route.ts

□ 4. Deploy Dashboard
      apps/web/src/app/qgen/page.tsx

□ 5. Test single question generation
      POST /api/qgen/generate
      {
        area: "Clínica Médica",
        topic: "Cardiologia",
        difficulty: 3,
        bloomLevel: "APPLICATION",
        questionType: "CLINICAL_CASE"
      }

□ 6. Validate end-to-end flow
      Generate → Validate → Display → Review
```
