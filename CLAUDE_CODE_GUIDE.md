# DDL — Diagnóstico Diferencial de Lacunas
## Procedimento Técnico de Implementação Completa
### DARWIN/ENAMED Platform | Claude Code + Opus 4.5

**Autor:** Demetrios Chiuratto Agourakis  
**Data:** 2026-01-31  
**Versão:** 1.0.0  
**Stack:** Next.js 15 + Supabase + Claude API (Sonnet 4)

---

## SUMÁRIO EXECUTIVO

Este documento especifica o procedimento completo para implementação do sistema DDL (Diagnóstico Diferencial de Lacunas de Aprendizagem) na plataforma ENAMED. O sistema classifica respostas dissertativas curtas em três tipos de lacunas:

| Tipo | Código | Característica Principal | Intervenção |
|------|--------|--------------------------|-------------|
| **Lacuna Epistêmica** | LE | Ausência de conhecimento | Content-focused review |
| **Lacuna Emocional** | LEm | Conhecimento inacessível sob pressão | Metacognitive-regulatory |
| **Lacuna de Integração** | LIE | Conhecimento fragmentado | Integrative-structural |

---

## FASE 1: DATABASE SCHEMA (Supabase)

### 1.1 Executar no Claude Code

```bash
# Navegar para o repositório
cd ~/Darwin-education

# Criar branch de feature
git checkout -b feature/ddl-system

# Criar diretório para migrations DDL
mkdir -p supabase/migrations/ddl
```

### 1.2 Migration: Tabelas Core DDL

Criar arquivo `supabase/migrations/ddl/001_ddl_core_tables.sql`:

```sql
-- ============================================================
-- DDL SYSTEM - CORE TABLES
-- Diagnóstico Diferencial de Lacunas de Aprendizagem
-- ============================================================

-- Enum para tipos de lacuna
CREATE TYPE lacuna_type AS ENUM ('LE', 'LEm', 'LIE', 'MIXED', 'NONE');

-- Enum para níveis de confiança
CREATE TYPE confidence_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- ============================================================
-- TABELA: ddl_questions
-- Questões dissertativas curtas com metadados semânticos
-- ============================================================
CREATE TABLE ddl_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    question_code VARCHAR(20) UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    
    -- Metadados acadêmicos
    discipline VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    cognitive_level VARCHAR(50), -- Bloom's taxonomy
    
    -- Gabarito semântico
    reference_answer TEXT NOT NULL,
    key_concepts JSONB NOT NULL DEFAULT '[]',
    -- Estrutura: [{"concept": "...", "weight": 0.3, "synonyms": [...]}]
    
    required_integrations JSONB DEFAULT '[]',
    -- Estrutura: [{"from": "concept_a", "to": "concept_b", "relation": "causes"}]
    
    -- Parâmetros IRT (se disponíveis)
    irt_difficulty DECIMAL(5,3),
    irt_discrimination DECIMAL(5,3),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABELA: ddl_responses
-- Respostas dos estudantes com dados comportamentais
-- ============================================================
CREATE TABLE ddl_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ddl_questions(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    
    -- Resposta
    response_text TEXT NOT NULL,
    response_length INTEGER GENERATED ALWAYS AS (LENGTH(response_text)) STORED,
    word_count INTEGER GENERATED ALWAYS AS (
        array_length(regexp_split_to_array(trim(response_text), '\s+'), 1)
    ) STORED,
    
    -- Dados comportamentais (capturados pelo frontend)
    behavioral_data JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura esperada:
    {
        "start_timestamp": "ISO8601",
        "end_timestamp": "ISO8601",
        "total_time_ms": 45000,
        "time_to_first_keystroke_ms": 3200,
        "pause_count": 5,
        "pause_durations_ms": [2000, 1500, ...],
        "keystroke_dynamics": {
            "total_keystrokes": 234,
            "backspace_count": 12,
            "delete_count": 3,
            "avg_inter_key_interval_ms": 180
        },
        "revision_events": [
            {"timestamp": "...", "type": "delete_word", "position": 45},
            {"timestamp": "...", "type": "retype_section", "start": 20, "end": 35}
        ],
        "focus_events": [
            {"timestamp": "...", "type": "blur", "duration_ms": 5000},
            {"timestamp": "...", "type": "focus"}
        ],
        "scroll_events": 3,
        "copy_paste_events": 0
    }
    */
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- ============================================================
-- TABELA: ddl_semantic_analysis
-- Análise semântica via Claude API
-- ============================================================
CREATE TABLE ddl_semantic_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    
    -- Métricas semânticas
    semantic_similarity_score DECIMAL(5,4), -- 0.0000 a 1.0000
    concept_coverage JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "matched_concepts": ["concept_a", "concept_b"],
        "missing_concepts": ["concept_c"],
        "incorrect_concepts": ["wrong_concept"],
        "coverage_ratio": 0.67
    }
    */
    
    -- Métricas de integração
    integration_score DECIMAL(5,4),
    detected_integrations JSONB DEFAULT '[]',
    /*
    Estrutura:
    [
        {"from": "concept_a", "to": "concept_b", "detected": true, "quality": "partial"},
        {"from": "concept_a", "to": "concept_c", "detected": false}
    ]
    */
    
    -- Análise linguística
    linguistic_markers JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "hedging_markers": {
            "count": 5,
            "instances": ["talvez", "pode ser", "aparentemente"],
            "hedging_index": 0.045  -- hedges/total_words
        },
        "certainty_markers": {
            "count": 2,
            "instances": ["certamente", "sempre"]
        },
        "fragmentation_indicators": {
            "logical_jumps": 2,
            "incomplete_sentences": 1,
            "context_mismatches": 0
        },
        "coherence_score": 0.78,
        "lexical_diversity": 0.65  -- type-token ratio
    }
    */
    
    -- Entropia semântica (KEC framework extension)
    semantic_entropy DECIMAL(8,6),
    -- Baixa entropia = resposta consistente (correta ou incorretamente)
    -- Alta entropia = variabilidade/fragmentação
    
    -- Raw Claude response (for debugging/audit)
    claude_raw_response JSONB,
    claude_model_version VARCHAR(50),
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_behavioral_analysis
-- Análise de padrões comportamentais
-- ============================================================
CREATE TABLE ddl_behavioral_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    
    -- Métricas temporais
    response_time_ms INTEGER NOT NULL,
    time_per_word_ms DECIMAL(8,2),
    time_to_first_keystroke_ms INTEGER,
    
    -- Padrões de hesitação
    hesitation_pattern JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "total_pause_time_ms": 12000,
        "pause_ratio": 0.27,  -- pause_time/total_time
        "long_pauses_count": 3,  -- pauses > 3000ms
        "pause_positions": ["beginning", "middle"],  -- where pauses occurred
        "hesitation_index": 0.34
    }
    */
    
    -- Padrões de revisão
    revision_pattern JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "revision_count": 5,
        "revision_ratio": 0.12,  -- revisions/total_keystrokes
        "major_revisions": 1,  -- >10 characters changed
        "revision_positions": ["end"],
        "self_correction_index": 0.08
    }
    */
    
    -- Indicadores de ansiedade comportamental
    anxiety_indicators JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "erratic_typing": false,
        "focus_loss_events": 2,
        "rapid_deletion_bursts": 1,
        "time_pressure_indicator": false,  -- accelerating near end
        "behavioral_anxiety_score": 0.35
    }
    */
    
    -- Comparação com baseline do usuário
    deviation_from_baseline JSONB DEFAULT NULL,
    /*
    Estrutura (requer histórico):
    {
        "time_deviation_zscore": 1.2,
        "hesitation_deviation_zscore": 0.8,
        "revision_deviation_zscore": -0.3
    }
    */
    
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_classification
-- Classificação final do tipo de lacuna
-- ============================================================
CREATE TABLE ddl_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    semantic_analysis_id UUID REFERENCES ddl_semantic_analysis(id),
    behavioral_analysis_id UUID REFERENCES ddl_behavioral_analysis(id),
    
    -- Classificação primária
    primary_lacuna_type lacuna_type NOT NULL,
    primary_confidence confidence_level NOT NULL,
    primary_probability DECIMAL(5,4) NOT NULL,
    
    -- Classificações secundárias (se MIXED ou probabilidades próximas)
    secondary_lacuna_type lacuna_type,
    secondary_probability DECIMAL(5,4),
    
    -- Probabilidades completas
    probabilities JSONB NOT NULL,
    /*
    Estrutura:
    {
        "LE": 0.65,
        "LEm": 0.20,
        "LIE": 0.15,
        "fusion_method": "weighted_average",
        "semantic_weight": 0.6,
        "behavioral_weight": 0.4
    }
    */
    
    -- Evidências que suportam a classificação
    supporting_evidence JSONB NOT NULL DEFAULT '{}',
    /*
    Estrutura:
    {
        "for_LE": [
            "Low concept coverage (0.23)",
            "Consistent incorrect pattern across attempts"
        ],
        "for_LEm": [
            "High behavioral anxiety score (0.72)",
            "Significant deviation from baseline"
        ],
        "for_LIE": [
            "High semantic entropy (2.34)",
            "Partial concept matches with poor integration"
        ]
    }
    */
    
    -- Metadados do classificador
    classifier_version VARCHAR(20) NOT NULL,
    classification_method VARCHAR(50) DEFAULT 'fusion_probabilistic',
    
    -- Validação humana (para training data)
    human_validated BOOLEAN DEFAULT FALSE,
    human_classification lacuna_type,
    validator_id UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_feedback
-- Feedback personalizado gerado
-- ============================================================
CREATE TABLE ddl_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES ddl_classification(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Feedback estruturado
    feedback_type lacuna_type NOT NULL,
    feedback_content JSONB NOT NULL,
    /*
    Estrutura para LE (Lacuna Epistêmica):
    {
        "type": "LE",
        "title": "Revisão de Conteúdo Recomendada",
        "main_message": "Identificamos que alguns conceitos fundamentais precisam ser revisados.",
        "missing_concepts": ["conceito_a", "conceito_b"],
        "study_recommendations": [
            {"topic": "...", "resource_type": "video", "priority": "high"},
            {"topic": "...", "resource_type": "text", "priority": "medium"}
        ],
        "practice_questions": ["question_id_1", "question_id_2"],
        "tone": "encouraging"
    }
    
    Estrutura para LEm (Lacuna Emocional):
    {
        "type": "LEm",
        "title": "Estratégias de Gerenciamento",
        "main_message": "Percebemos que você pode ter o conhecimento, mas fatores emocionais podem estar interferindo.",
        "metacognitive_strategies": [
            "Técnica de respiração antes de questões difíceis",
            "Dividir a resposta em partes menores"
        ],
        "confidence_building": [
            "Pratique com questões similares em ambiente sem pressão",
            "Revise suas respostas anteriores corretas sobre este tema"
        ],
        "relaxation_techniques": true,
        "tone": "supportive"
    }
    
    Estrutura para LIE (Lacuna de Integração):
    {
        "type": "LIE",
        "title": "Conexões Conceituais",
        "main_message": "Você demonstra conhecimento dos conceitos individuais, mas a integração entre eles pode ser fortalecida.",
        "integration_gaps": [
            {"from": "conceito_a", "to": "conceito_b", "suggestion": "..."}
        ],
        "concept_mapping_exercise": true,
        "synthesis_questions": ["question_id_3"],
        "analogies": ["..."],
        "tone": "constructive"
    }
    */
    
    -- Delivery
    delivered_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    
    -- Feedback do usuário sobre o feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback_helpful BOOLEAN,
    user_comments TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_user_baseline
-- Baseline comportamental por usuário (para detecção de desvios)
-- ============================================================
CREATE TABLE ddl_user_baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Estatísticas agregadas
    total_responses INTEGER DEFAULT 0,
    
    -- Métricas temporais baseline
    avg_response_time_ms DECIMAL(10,2),
    std_response_time_ms DECIMAL(10,2),
    avg_time_per_word_ms DECIMAL(8,2),
    std_time_per_word_ms DECIMAL(8,2),
    
    -- Métricas de hesitação baseline
    avg_hesitation_index DECIMAL(5,4),
    std_hesitation_index DECIMAL(5,4),
    avg_pause_ratio DECIMAL(5,4),
    std_pause_ratio DECIMAL(5,4),
    
    -- Métricas de revisão baseline
    avg_revision_ratio DECIMAL(5,4),
    std_revision_ratio DECIMAL(5,4),
    
    -- Métricas semânticas baseline
    avg_semantic_similarity DECIMAL(5,4),
    avg_concept_coverage DECIMAL(5,4),
    avg_hedging_index DECIMAL(5,4),
    
    -- Window de cálculo
    calculated_from_responses INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,
    
    -- Segmentação por dificuldade
    baseline_by_difficulty JSONB DEFAULT '{}',
    /*
    Estrutura:
    {
        "1": {"avg_time_ms": ..., "std_time_ms": ...},
        "2": {...},
        ...
    }
    */
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- ddl_questions
CREATE INDEX idx_ddl_questions_discipline ON ddl_questions(discipline);
CREATE INDEX idx_ddl_questions_topic ON ddl_questions(topic);
CREATE INDEX idx_ddl_questions_active ON ddl_questions(is_active) WHERE is_active = TRUE;

-- ddl_responses
CREATE INDEX idx_ddl_responses_user ON ddl_responses(user_id);
CREATE INDEX idx_ddl_responses_question ON ddl_responses(question_id);
CREATE INDEX idx_ddl_responses_session ON ddl_responses(session_id);
CREATE INDEX idx_ddl_responses_created ON ddl_responses(created_at DESC);

-- ddl_semantic_analysis
CREATE INDEX idx_ddl_semantic_response ON ddl_semantic_analysis(response_id);
CREATE INDEX idx_ddl_semantic_similarity ON ddl_semantic_analysis(semantic_similarity_score);

-- ddl_behavioral_analysis
CREATE INDEX idx_ddl_behavioral_response ON ddl_behavioral_analysis(response_id);

-- ddl_classification
CREATE INDEX idx_ddl_classification_response ON ddl_classification(response_id);
CREATE INDEX idx_ddl_classification_type ON ddl_classification(primary_lacuna_type);
CREATE INDEX idx_ddl_classification_validated ON ddl_classification(human_validated) 
    WHERE human_validated = TRUE;

-- ddl_feedback
CREATE INDEX idx_ddl_feedback_user ON ddl_feedback(user_id);
CREATE INDEX idx_ddl_feedback_classification ON ddl_feedback(classification_id);

-- ddl_user_baseline
CREATE INDEX idx_ddl_baseline_user ON ddl_user_baseline(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ddl_questions_updated_at
    BEFORE UPDATE ON ddl_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ddl_user_baseline_updated_at
    BEFORE UPDATE ON ddl_user_baseline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ddl_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_semantic_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_user_baseline ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários só veem seus próprios dados
CREATE POLICY "Users can view own responses" ON ddl_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON ddl_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON ddl_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own baseline" ON ddl_user_baseline
    FOR SELECT USING (auth.uid() = user_id);

-- Service role bypassa RLS para processamento backend

-- ============================================================
-- VIEWS
-- ============================================================

-- View agregada para dashboard do usuário
CREATE VIEW ddl_user_summary AS
SELECT 
    u.id as user_id,
    COUNT(r.id) as total_responses,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LE' THEN 1 END) as le_count,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LEm' THEN 1 END) as lem_count,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LIE' THEN 1 END) as lie_count,
    COUNT(CASE WHEN c.primary_lacuna_type = 'NONE' THEN 1 END) as correct_count,
    AVG(sa.semantic_similarity_score) as avg_semantic_score,
    AVG(ba.response_time_ms) as avg_response_time
FROM auth.users u
LEFT JOIN ddl_responses r ON u.id = r.user_id
LEFT JOIN ddl_classification c ON r.id = c.response_id
LEFT JOIN ddl_semantic_analysis sa ON r.id = sa.response_id
LEFT JOIN ddl_behavioral_analysis ba ON r.id = ba.response_id
GROUP BY u.id;

-- View para questões com estatísticas
CREATE VIEW ddl_question_stats AS
SELECT 
    q.id,
    q.question_code,
    q.question_text,
    q.discipline,
    q.topic,
    COUNT(r.id) as response_count,
    AVG(sa.semantic_similarity_score) as avg_score,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LE' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(r.id), 0) as le_ratio,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LEm' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(r.id), 0) as lem_ratio,
    COUNT(CASE WHEN c.primary_lacuna_type = 'LIE' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(r.id), 0) as lie_ratio
FROM ddl_questions q
LEFT JOIN ddl_responses r ON q.id = r.question_id
LEFT JOIN ddl_semantic_analysis sa ON r.id = sa.response_id
LEFT JOIN ddl_classification c ON r.id = c.response_id
WHERE q.is_active = TRUE
GROUP BY q.id;
```

### 1.3 Aplicar Migration

```bash
# No Claude Code, executar:
supabase db push

# Ou via SQL direto no Supabase Dashboard
```

---

## FASE 2: CLAUDE PROMPT ENGINEERING

### 2.1 System Prompt para Análise Semântica DDL

Criar arquivo `src/lib/ddl/prompts/semantic-analysis.ts`:

```typescript
// ============================================================
// DDL SEMANTIC ANALYSIS - CLAUDE PROMPT ENGINEERING
// ============================================================

export const DDL_SEMANTIC_ANALYSIS_SYSTEM_PROMPT = `You are an expert educational assessment system specialized in analyzing short-answer responses in medical education. Your task is to perform semantic analysis for the DDL (Differential Diagnosis of Learning Gaps) system.

## CONTEXT
You are analyzing student responses to identify patterns that differentiate between:
- **LE (Epistemic Gap)**: Absence of knowledge - student doesn't know the content
- **LEm (Emotional Gap)**: Knowledge exists but is inaccessible under pressure
- **LIE (Integration Gap)**: Fragmented knowledge - correct pieces poorly connected

## YOUR ANALYSIS MUST INCLUDE

### 1. CONCEPT COVERAGE ANALYSIS
- Identify which key concepts from the reference answer are present
- Identify missing concepts
- Identify incorrect or misconceived concepts
- Calculate coverage ratio

### 2. INTEGRATION ANALYSIS
- Detect logical connections between concepts
- Identify if required integrations are present
- Assess quality of integrations (complete, partial, incorrect)

### 3. LINGUISTIC MARKER ANALYSIS
Detect and quantify:
- **Hedging markers**: "talvez", "pode ser", "aparentemente", "provavelmente", "parece que", "possivelmente", "em geral", "normalmente"
- **Certainty markers**: "certamente", "definitivamente", "sempre", "nunca", "claramente"
- **Fragmentation indicators**: 
  - Logical jumps (non-sequiturs)
  - Incomplete sentences
  - Correct terms in wrong context
  - Disconnected concept mentions

### 4. COHERENCE ASSESSMENT
- Evaluate overall text coherence (0-1 scale)
- Identify specific coherence breaks
- Assess argumentative flow

### 5. SEMANTIC ENTROPY ESTIMATION
- Low entropy: Consistent response (whether correct or incorrect)
- High entropy: Variable/fragmented response indicating uncertainty

## OUTPUT FORMAT
You MUST respond with a valid JSON object matching this exact structure:

\`\`\`json
{
  "concept_analysis": {
    "matched_concepts": ["concept1", "concept2"],
    "missing_concepts": ["concept3"],
    "incorrect_concepts": ["wrong_concept"],
    "coverage_ratio": 0.67,
    "concept_details": [
      {
        "concept": "concept1",
        "status": "present|missing|incorrect|partial",
        "evidence": "quote from student response",
        "quality": "accurate|imprecise|misconceived"
      }
    ]
  },
  "integration_analysis": {
    "detected_integrations": [
      {
        "from": "concept_a",
        "to": "concept_b",
        "expected_relation": "causes",
        "detected": true,
        "quality": "complete|partial|incorrect|missing",
        "evidence": "quote showing integration"
      }
    ],
    "integration_score": 0.45,
    "integration_gaps": ["concept_a -> concept_c not connected"]
  },
  "linguistic_markers": {
    "hedging": {
      "count": 3,
      "instances": ["talvez", "pode ser"],
      "index": 0.034
    },
    "certainty": {
      "count": 1,
      "instances": ["sempre"],
      "index": 0.011
    },
    "fragmentation": {
      "logical_jumps": 2,
      "incomplete_sentences": 0,
      "context_mismatches": 1,
      "examples": ["jumped from X to Y without connection"]
    }
  },
  "coherence": {
    "score": 0.65,
    "flow_assessment": "moderate",
    "breaks": ["between sentence 2 and 3"],
    "lexical_diversity": 0.72
  },
  "semantic_entropy": {
    "value": 1.45,
    "interpretation": "moderate_fragmentation",
    "contributing_factors": ["multiple unconnected concepts", "hedging language"]
  },
  "overall_semantic_similarity": 0.58,
  "preliminary_gap_indicators": {
    "LE_signals": ["missing core concept X", "fundamental misconception about Y"],
    "LEm_signals": ["high hedging despite correct concepts"],
    "LIE_signals": ["concepts present but poorly integrated", "high semantic entropy"]
  }
}
\`\`\`

## IMPORTANT GUIDELINES
1. Be precise and evidence-based - cite specific parts of the response
2. Consider domain-specific terminology (medical/biomedical)
3. Portuguese language analysis - use appropriate linguistic markers for PT-BR
4. Do not make assumptions about the student's emotional state from text alone
5. Focus on observable textual patterns
6. Maintain objectivity - avoid value judgments about the student`;

export const DDL_SEMANTIC_ANALYSIS_USER_PROMPT_TEMPLATE = `
## QUESTION INFORMATION
**Question Code**: {{question_code}}
**Question Text**: {{question_text}}
**Discipline**: {{discipline}}
**Topic**: {{topic}}
**Cognitive Level**: {{cognitive_level}}

## REFERENCE ANSWER
{{reference_answer}}

## KEY CONCEPTS (with weights)
{{key_concepts_json}}

## REQUIRED INTEGRATIONS
{{required_integrations_json}}

## STUDENT RESPONSE TO ANALYZE
{{student_response}}

---

Analyze this response according to the DDL semantic analysis protocol. Return ONLY the JSON object, no additional text.`;
```

### 2.2 Prompt para Classificação Final (Fusion Layer)

Criar arquivo `src/lib/ddl/prompts/classification.ts`:

```typescript
// ============================================================
// DDL CLASSIFICATION - FUSION LAYER PROMPT
// ============================================================

export const DDL_CLASSIFICATION_SYSTEM_PROMPT = `You are the classification layer of the DDL (Differential Diagnosis of Learning Gaps) system. You receive semantic analysis and behavioral analysis data and must determine the most likely type of learning gap.

## GAP TYPES AND THEIR SIGNATURES

### LE (EPISTEMIC GAP) - Knowledge Absence
**Semantic signatures:**
- Low concept coverage (<40%)
- Missing fundamental concepts
- Consistent incorrectness (low semantic entropy with wrong content)
- Few hedging markers (confident but wrong)
- Possible misconceptions present

**Behavioral signatures:**
- Response time may be normal or quick (doesn't know they don't know)
- Low revision count
- Consistent typing pattern
- No significant anxiety indicators

**Typical pattern:** Student confidently provides incorrect or incomplete answer

### LEm (EMOTIONAL GAP) - Knowledge Inaccessible Under Pressure
**Semantic signatures:**
- Moderate to high concept coverage potential (some correct elements)
- HIGH hedging marker index (>0.04)
- Coherence breaks despite correct concepts
- Variable response quality across similar questions
- Semantic entropy elevated but with recognizable correct fragments

**Behavioral signatures:**
- Elevated response time
- High pause ratio (>0.3)
- Multiple long pauses
- Elevated revision count
- Anxiety indicators present (erratic typing, focus loss)
- Significant deviation from user baseline

**Typical pattern:** Student knows the content but struggles to express it under test conditions

### LIE (INTEGRATION GAP) - Fragmented Knowledge
**Semantic signatures:**
- Moderate concept coverage (40-70%)
- LOW integration score despite present concepts
- High semantic entropy
- Concepts mentioned but not connected
- Correct terms in isolation
- Fragmentation indicators high

**Behavioral signatures:**
- Normal to elevated response time
- Moderate revision pattern
- Possible multiple attempts to structure response
- Less anxiety than LEm

**Typical pattern:** Student knows individual pieces but cannot synthesize them

### NONE - Adequate Response
**Semantic signatures:**
- High concept coverage (>70%)
- Good integration score (>0.6)
- Low semantic entropy
- Good coherence
- Minimal hedging

**Behavioral signatures:**
- Response time within normal range
- Low anxiety indicators
- Consistent with baseline

## CLASSIFICATION RULES

1. **Primary classification** = type with highest probability
2. **Confidence level** based on probability margin:
   - VERY_HIGH: primary > 0.75 AND gap to second > 0.30
   - HIGH: primary > 0.60 AND gap to second > 0.20
   - MODERATE: primary > 0.45 AND gap to second > 0.10
   - LOW: otherwise

3. **MIXED classification** when:
   - Top two types within 0.10 probability of each other
   - Clear evidence for multiple gap types

4. **Fusion weights** (default):
   - Semantic analysis: 0.60
   - Behavioral analysis: 0.40
   - Adjust based on data quality/availability

## OUTPUT FORMAT
Return a valid JSON object:

\`\`\`json
{
  "classification": {
    "primary_type": "LE|LEm|LIE|MIXED|NONE",
    "primary_probability": 0.72,
    "primary_confidence": "HIGH",
    "secondary_type": "LEm|null",
    "secondary_probability": 0.18
  },
  "probabilities": {
    "LE": 0.72,
    "LEm": 0.18,
    "LIE": 0.08,
    "NONE": 0.02
  },
  "fusion_details": {
    "semantic_contribution": {
      "LE": 0.80,
      "LEm": 0.10,
      "LIE": 0.08,
      "NONE": 0.02
    },
    "behavioral_contribution": {
      "LE": 0.60,
      "LEm": 0.30,
      "LIE": 0.08,
      "NONE": 0.02
    },
    "weights_used": {
      "semantic": 0.60,
      "behavioral": 0.40
    }
  },
  "supporting_evidence": {
    "for_primary": [
      "Low concept coverage (0.32)",
      "Missing fundamental concept: X",
      "Confident response despite errors"
    ],
    "against_alternatives": [
      "Low hedging rules out LEm",
      "Concepts not present, so integration not testable (rules out LIE)"
    ]
  },
  "reasoning_chain": "Student demonstrates low concept coverage with confident expression. The absence of hedging markers and normal behavioral patterns suggest this is not anxiety-related. The low coverage prevents assessment of integration. Classification: LE with high confidence."
}
\`\`\``;

export const DDL_CLASSIFICATION_USER_PROMPT_TEMPLATE = `
## SEMANTIC ANALYSIS RESULTS
{{semantic_analysis_json}}

## BEHAVIORAL ANALYSIS RESULTS
{{behavioral_analysis_json}}

## USER BASELINE (if available)
{{user_baseline_json}}

## QUESTION METADATA
- Difficulty Level: {{difficulty_level}}
- Cognitive Level: {{cognitive_level}}
- Topic: {{topic}}

---

Based on the semantic and behavioral analyses provided, classify the learning gap type. Consider the signatures and rules defined in the protocol. Return ONLY the JSON object.`;
```

### 2.3 Prompt para Geração de Feedback

Criar arquivo `src/lib/ddl/prompts/feedback.ts`:

```typescript
// ============================================================
// DDL FEEDBACK GENERATION PROMPT
// ============================================================

export const DDL_FEEDBACK_SYSTEM_PROMPT = `You are a compassionate and effective educational feedback generator for the DDL system. Your role is to provide personalized, actionable feedback based on the diagnosed learning gap type.

## FEEDBACK PRINCIPLES

1. **Encouraging tone** - Never discouraging or judgmental
2. **Specific and actionable** - Concrete steps, not vague advice
3. **Evidence-based** - Reference specific aspects of the student's response
4. **Growth mindset** - Emphasize that gaps are addressable
5. **Culturally appropriate** - PT-BR context, formal but warm

## FEEDBACK BY GAP TYPE

### LE (EPISTEMIC GAP) - Content-Focused Feedback
Focus: Building missing knowledge
Tone: Informative, encouraging
Structure:
- Acknowledge what was attempted
- Identify specific knowledge gaps
- Provide targeted study recommendations
- Suggest practice questions on missing concepts
- Offer resources (avoid overwhelming)

### LEm (EMOTIONAL GAP) - Metacognitive-Regulatory Feedback
Focus: Managing test anxiety and building confidence
Tone: Supportive, validating
Structure:
- Acknowledge the challenge of testing situations
- Validate that knowledge is present (cite evidence)
- Suggest metacognitive strategies
- Recommend anxiety management techniques
- Encourage low-stakes practice
- Build confidence by referencing past successes

### LIE (INTEGRATION GAP) - Integrative-Structural Feedback
Focus: Connecting existing knowledge
Tone: Constructive, scaffolding
Structure:
- Acknowledge individual concept mastery
- Identify specific integration gaps
- Suggest concept mapping exercises
- Provide analogies or frameworks for connection
- Recommend synthesis-focused practice
- Show examples of integrated explanations

## OUTPUT FORMAT
Return a valid JSON object:

\`\`\`json
{
  "feedback": {
    "type": "LE|LEm|LIE",
    "title": "Título do Feedback",
    "greeting": "Olá! Analisei sua resposta sobre [topic]...",
    "main_message": "Mensagem principal personalizada...",
    "strengths": [
      "O que você fez bem..."
    ],
    "areas_for_growth": [
      {
        "area": "Conceito X",
        "explanation": "Por que é importante...",
        "suggestion": "Como melhorar..."
      }
    ],
    "action_items": [
      {
        "priority": "high|medium|low",
        "action": "Ação específica",
        "rationale": "Por que fazer isso",
        "estimated_time": "15 minutos"
      }
    ],
    "resources": [
      {
        "type": "concept_review|practice|technique",
        "topic": "Topic name",
        "description": "Brief description"
      }
    ],
    "encouragement": "Mensagem final de encorajamento...",
    "next_steps": "Sugestão de próximo passo imediato"
  },
  "metadata": {
    "tone": "encouraging|supportive|constructive",
    "complexity_level": "basic|intermediate|advanced",
    "estimated_reading_time_seconds": 60
  }
}
\`\`\`

## LANGUAGE
- Use Portuguese (PT-BR)
- Formal but warm register
- Avoid jargon unless explaining it
- Use "você" (not "tu" or overly formal constructions)`;

export const DDL_FEEDBACK_USER_PROMPT_TEMPLATE = `
## CLASSIFICATION RESULT
{{classification_json}}

## STUDENT RESPONSE
{{student_response}}

## QUESTION CONTEXT
- Question: {{question_text}}
- Topic: {{topic}}
- Discipline: {{discipline}}

## SEMANTIC ANALYSIS HIGHLIGHTS
- Matched concepts: {{matched_concepts}}
- Missing concepts: {{missing_concepts}}
- Integration score: {{integration_score}}
- Key issues: {{key_issues}}

## STUDENT PROFILE (if available)
- Previous interactions: {{interaction_count}}
- Common gap pattern: {{common_pattern}}
- Preferred learning style: {{learning_style}}

---

Generate personalized feedback in Portuguese (PT-BR) for this student based on their diagnosed gap type. Return ONLY the JSON object.`;
```

---

## FASE 3: BACKEND SERVICES

### 3.1 DDL Service Principal

Criar arquivo `src/lib/ddl/services/ddl-service.ts`:

```typescript
// ============================================================
// DDL SERVICE - MAIN ORCHESTRATOR
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import {
  DDL_SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
  DDL_SEMANTIC_ANALYSIS_USER_PROMPT_TEMPLATE,
} from '../prompts/semantic-analysis';
import {
  DDL_CLASSIFICATION_SYSTEM_PROMPT,
  DDL_CLASSIFICATION_USER_PROMPT_TEMPLATE,
} from '../prompts/classification';
import {
  DDL_FEEDBACK_SYSTEM_PROMPT,
  DDL_FEEDBACK_USER_PROMPT_TEMPLATE,
} from '../prompts/feedback';

// Types
interface DDLQuestion {
  id: string;
  question_code: string;
  question_text: string;
  discipline: string;
  topic: string;
  subtopic?: string;
  difficulty_level: number;
  cognitive_level: string;
  reference_answer: string;
  key_concepts: KeyConcept[];
  required_integrations: Integration[];
}

interface KeyConcept {
  concept: string;
  weight: number;
  synonyms: string[];
}

interface Integration {
  from: string;
  to: string;
  relation: string;
}

interface BehavioralData {
  start_timestamp: string;
  end_timestamp: string;
  total_time_ms: number;
  time_to_first_keystroke_ms: number;
  pause_count: number;
  pause_durations_ms: number[];
  keystroke_dynamics: {
    total_keystrokes: number;
    backspace_count: number;
    delete_count: number;
    avg_inter_key_interval_ms: number;
  };
  revision_events: RevisionEvent[];
  focus_events: FocusEvent[];
}

interface RevisionEvent {
  timestamp: string;
  type: string;
  position?: number;
  start?: number;
  end?: number;
}

interface FocusEvent {
  timestamp: string;
  type: 'blur' | 'focus';
  duration_ms?: number;
}

interface DDLResponse {
  id: string;
  user_id: string;
  question_id: string;
  session_id: string;
  response_text: string;
  behavioral_data: BehavioralData;
}

type LacunaType = 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE';
type ConfidenceLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

interface SemanticAnalysisResult {
  concept_analysis: {
    matched_concepts: string[];
    missing_concepts: string[];
    incorrect_concepts: string[];
    coverage_ratio: number;
  };
  integration_analysis: {
    detected_integrations: any[];
    integration_score: number;
  };
  linguistic_markers: {
    hedging: { count: number; instances: string[]; index: number };
    certainty: { count: number; instances: string[]; index: number };
    fragmentation: {
      logical_jumps: number;
      incomplete_sentences: number;
      context_mismatches: number;
    };
  };
  coherence: { score: number };
  semantic_entropy: { value: number };
  overall_semantic_similarity: number;
}

interface BehavioralAnalysisResult {
  response_time_ms: number;
  time_per_word_ms: number;
  hesitation_pattern: {
    total_pause_time_ms: number;
    pause_ratio: number;
    long_pauses_count: number;
    hesitation_index: number;
  };
  revision_pattern: {
    revision_count: number;
    revision_ratio: number;
    self_correction_index: number;
  };
  anxiety_indicators: {
    erratic_typing: boolean;
    focus_loss_events: number;
    behavioral_anxiety_score: number;
  };
}

interface ClassificationResult {
  primary_type: LacunaType;
  primary_probability: number;
  primary_confidence: ConfidenceLevel;
  secondary_type?: LacunaType;
  secondary_probability?: number;
  probabilities: Record<string, number>;
  supporting_evidence: Record<string, string[]>;
}

// ============================================================
// DDL SERVICE CLASS
// ============================================================

export class DDLService {
  private anthropic: Anthropic;
  private supabase: ReturnType<typeof createClient>;
  private modelId: string = 'claude-sonnet-4-20250514';

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for backend operations
    );
  }

  // ============================================================
  // MAIN ANALYSIS PIPELINE
  // ============================================================
  
  async analyzeResponse(
    responseId: string
  ): Promise<{
    semantic: SemanticAnalysisResult;
    behavioral: BehavioralAnalysisResult;
    classification: ClassificationResult;
    feedbackId: string;
  }> {
    // 1. Fetch response and question data
    const { response, question } = await this.fetchResponseData(responseId);
    
    // 2. Fetch user baseline (if exists)
    const baseline = await this.fetchUserBaseline(response.user_id);
    
    // 3. Run semantic analysis (Claude API)
    const semanticResult = await this.runSemanticAnalysis(response, question);
    
    // 4. Run behavioral analysis (local computation)
    const behavioralResult = this.runBehavioralAnalysis(
      response.behavioral_data,
      response.response_text,
      baseline
    );
    
    // 5. Run classification (Claude API - Fusion Layer)
    const classificationResult = await this.runClassification(
      semanticResult,
      behavioralResult,
      question,
      baseline
    );
    
    // 6. Generate and store feedback
    const feedbackId = await this.generateAndStoreFeedback(
      responseId,
      response,
      question,
      semanticResult,
      classificationResult
    );
    
    // 7. Store all analysis results
    await this.storeAnalysisResults(
      responseId,
      semanticResult,
      behavioralResult,
      classificationResult
    );
    
    // 8. Update user baseline (async, non-blocking)
    this.updateUserBaseline(response.user_id, behavioralResult, semanticResult)
      .catch(err => console.error('Baseline update failed:', err));
    
    return {
      semantic: semanticResult,
      behavioral: behavioralResult,
      classification: classificationResult,
      feedbackId,
    };
  }

  // ============================================================
  // SEMANTIC ANALYSIS
  // ============================================================
  
  private async runSemanticAnalysis(
    response: DDLResponse,
    question: DDLQuestion
  ): Promise<SemanticAnalysisResult> {
    const userPrompt = this.interpolateTemplate(
      DDL_SEMANTIC_ANALYSIS_USER_PROMPT_TEMPLATE,
      {
        question_code: question.question_code,
        question_text: question.question_text,
        discipline: question.discipline,
        topic: question.topic,
        cognitive_level: question.cognitive_level,
        reference_answer: question.reference_answer,
        key_concepts_json: JSON.stringify(question.key_concepts, null, 2),
        required_integrations_json: JSON.stringify(question.required_integrations, null, 2),
        student_response: response.response_text,
      }
    );

    const message = await this.anthropic.messages.create({
      model: this.modelId,
      max_tokens: 4096,
      system: DDL_SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonStr = this.extractJSON(content.text);
      return JSON.parse(jsonStr) as SemanticAnalysisResult;
    } catch (error) {
      console.error('Failed to parse semantic analysis:', content.text);
      throw new Error('Failed to parse semantic analysis response');
    }
  }

  // ============================================================
  // BEHAVIORAL ANALYSIS (Local Computation)
  // ============================================================
  
  private runBehavioralAnalysis(
    behavioralData: BehavioralData,
    responseText: string,
    baseline?: any
  ): BehavioralAnalysisResult {
    const wordCount = responseText.trim().split(/\s+/).length;
    const totalTime = behavioralData.total_time_ms;
    
    // Calculate pause metrics
    const longPauseThreshold = 3000; // 3 seconds
    const longPauses = behavioralData.pause_durations_ms.filter(
      d => d > longPauseThreshold
    );
    const totalPauseTime = behavioralData.pause_durations_ms.reduce(
      (a, b) => a + b, 0
    );
    const pauseRatio = totalPauseTime / totalTime;
    
    // Calculate revision metrics
    const totalKeystrokes = behavioralData.keystroke_dynamics.total_keystrokes;
    const revisionKeystrokes = 
      behavioralData.keystroke_dynamics.backspace_count +
      behavioralData.keystroke_dynamics.delete_count;
    const revisionRatio = totalKeystrokes > 0 
      ? revisionKeystrokes / totalKeystrokes 
      : 0;
    
    // Calculate hesitation index
    // Higher when: many pauses, long pauses, pauses at beginning
    const hesitationIndex = this.calculateHesitationIndex(
      behavioralData,
      totalTime
    );
    
    // Detect erratic typing (high variance in inter-key intervals)
    const avgIKI = behavioralData.keystroke_dynamics.avg_inter_key_interval_ms;
    const erraticTyping = avgIKI > 400; // Threshold for irregular typing
    
    // Focus loss events
    const focusLossEvents = behavioralData.focus_events.filter(
      e => e.type === 'blur'
    ).length;
    
    // Calculate behavioral anxiety score (0-1)
    const anxietyScore = this.calculateAnxietyScore({
      pauseRatio,
      longPausesCount: longPauses.length,
      revisionRatio,
      erraticTyping,
      focusLossEvents,
      hesitationIndex,
    });
    
    return {
      response_time_ms: totalTime,
      time_per_word_ms: wordCount > 0 ? totalTime / wordCount : 0,
      hesitation_pattern: {
        total_pause_time_ms: totalPauseTime,
        pause_ratio: pauseRatio,
        long_pauses_count: longPauses.length,
        hesitation_index: hesitationIndex,
      },
      revision_pattern: {
        revision_count: behavioralData.revision_events.length,
        revision_ratio: revisionRatio,
        self_correction_index: this.calculateSelfCorrectionIndex(
          behavioralData.revision_events
        ),
      },
      anxiety_indicators: {
        erratic_typing: erraticTyping,
        focus_loss_events: focusLossEvents,
        behavioral_anxiety_score: anxietyScore,
      },
    };
  }
  
  private calculateHesitationIndex(
    data: BehavioralData,
    totalTime: number
  ): number {
    const pauseWeight = 0.4;
    const firstKeystrokeWeight = 0.3;
    const longPauseWeight = 0.3;
    
    const pauseRatio = data.pause_durations_ms.reduce((a, b) => a + b, 0) / totalTime;
    const firstKeystrokeRatio = Math.min(
      data.time_to_first_keystroke_ms / 10000, 
      1
    ); // Normalize to 10s max
    const longPauseRatio = data.pause_durations_ms.filter(d => d > 3000).length / 
      Math.max(data.pause_count, 1);
    
    return (
      pauseWeight * pauseRatio +
      firstKeystrokeWeight * firstKeystrokeRatio +
      longPauseWeight * longPauseRatio
    );
  }
  
  private calculateAnxietyScore(metrics: {
    pauseRatio: number;
    longPausesCount: number;
    revisionRatio: number;
    erraticTyping: boolean;
    focusLossEvents: number;
    hesitationIndex: number;
  }): number {
    let score = 0;
    
    // Pause ratio contribution (0-0.25)
    score += Math.min(metrics.pauseRatio, 0.5) * 0.5;
    
    // Long pauses contribution (0-0.2)
    score += Math.min(metrics.longPausesCount / 5, 1) * 0.2;
    
    // Revision ratio contribution (0-0.15)
    score += Math.min(metrics.revisionRatio, 0.3) * 0.5;
    
    // Erratic typing (0 or 0.15)
    if (metrics.erraticTyping) score += 0.15;
    
    // Focus loss (0-0.15)
    score += Math.min(metrics.focusLossEvents / 3, 1) * 0.15;
    
    // Hesitation index (0-0.1)
    score += metrics.hesitationIndex * 0.1;
    
    return Math.min(score, 1); // Cap at 1
  }
  
  private calculateSelfCorrectionIndex(events: RevisionEvent[]): number {
    if (events.length === 0) return 0;
    
    const majorRevisions = events.filter(
      e => e.type === 'retype_section' || 
           (e.end && e.start && (e.end - e.start) > 10)
    ).length;
    
    return majorRevisions / events.length;
  }

  // ============================================================
  // CLASSIFICATION (Fusion Layer)
  // ============================================================
  
  private async runClassification(
    semantic: SemanticAnalysisResult,
    behavioral: BehavioralAnalysisResult,
    question: DDLQuestion,
    baseline?: any
  ): Promise<ClassificationResult> {
    const userPrompt = this.interpolateTemplate(
      DDL_CLASSIFICATION_USER_PROMPT_TEMPLATE,
      {
        semantic_analysis_json: JSON.stringify(semantic, null, 2),
        behavioral_analysis_json: JSON.stringify(behavioral, null, 2),
        user_baseline_json: baseline 
          ? JSON.stringify(baseline, null, 2) 
          : 'Not available',
        difficulty_level: question.difficulty_level.toString(),
        cognitive_level: question.cognitive_level,
        topic: question.topic,
      }
    );

    const message = await this.anthropic.messages.create({
      model: this.modelId,
      max_tokens: 2048,
      system: DDL_CLASSIFICATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      const jsonStr = this.extractJSON(content.text);
      const parsed = JSON.parse(jsonStr);
      
      return {
        primary_type: parsed.classification.primary_type,
        primary_probability: parsed.classification.primary_probability,
        primary_confidence: parsed.classification.primary_confidence,
        secondary_type: parsed.classification.secondary_type,
        secondary_probability: parsed.classification.secondary_probability,
        probabilities: parsed.probabilities,
        supporting_evidence: parsed.supporting_evidence,
      };
    } catch (error) {
      console.error('Failed to parse classification:', content.text);
      throw new Error('Failed to parse classification response');
    }
  }

  // ============================================================
  // FEEDBACK GENERATION
  // ============================================================
  
  private async generateAndStoreFeedback(
    responseId: string,
    response: DDLResponse,
    question: DDLQuestion,
    semantic: SemanticAnalysisResult,
    classification: ClassificationResult
  ): Promise<string> {
    const userPrompt = this.interpolateTemplate(
      DDL_FEEDBACK_USER_PROMPT_TEMPLATE,
      {
        classification_json: JSON.stringify(classification, null, 2),
        student_response: response.response_text,
        question_text: question.question_text,
        topic: question.topic,
        discipline: question.discipline,
        matched_concepts: semantic.concept_analysis.matched_concepts.join(', '),
        missing_concepts: semantic.concept_analysis.missing_concepts.join(', '),
        integration_score: semantic.integration_analysis.integration_score.toString(),
        key_issues: this.summarizeKeyIssues(semantic, classification),
        interaction_count: 'N/A', // TODO: Implement user history lookup
        common_pattern: 'N/A',
        learning_style: 'N/A',
      }
    );

    const message = await this.anthropic.messages.create({
      model: this.modelId,
      max_tokens: 2048,
      system: DDL_FEEDBACK_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonStr = this.extractJSON(content.text);
    const feedbackData = JSON.parse(jsonStr);

    // Store feedback
    const { data, error } = await this.supabase
      .from('ddl_feedback')
      .insert({
        classification_id: null, // Will be linked after classification is stored
        user_id: response.user_id,
        feedback_type: classification.primary_type,
        feedback_content: feedbackData.feedback,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }
  
  private summarizeKeyIssues(
    semantic: SemanticAnalysisResult,
    classification: ClassificationResult
  ): string {
    const issues: string[] = [];
    
    if (semantic.concept_analysis.coverage_ratio < 0.5) {
      issues.push(`Low concept coverage (${(semantic.concept_analysis.coverage_ratio * 100).toFixed(0)}%)`);
    }
    
    if (semantic.integration_analysis.integration_score < 0.5) {
      issues.push(`Weak concept integration (${(semantic.integration_analysis.integration_score * 100).toFixed(0)}%)`);
    }
    
    if (semantic.linguistic_markers.hedging.index > 0.04) {
      issues.push('High uncertainty markers in response');
    }
    
    if (semantic.semantic_entropy.value > 2.0) {
      issues.push('High semantic fragmentation');
    }
    
    return issues.join('; ') || 'No major issues identified';
  }

  // ============================================================
  // DATA PERSISTENCE
  // ============================================================
  
  private async fetchResponseData(responseId: string): Promise<{
    response: DDLResponse;
    question: DDLQuestion;
  }> {
    const { data: response, error: respError } = await this.supabase
      .from('ddl_responses')
      .select('*')
      .eq('id', responseId)
      .single();
    
    if (respError) throw respError;
    
    const { data: question, error: questError } = await this.supabase
      .from('ddl_questions')
      .select('*')
      .eq('id', response.question_id)
      .single();
    
    if (questError) throw questError;
    
    return { response, question };
  }
  
  private async fetchUserBaseline(userId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('ddl_user_baseline')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }
    
    return data;
  }
  
  private async storeAnalysisResults(
    responseId: string,
    semantic: SemanticAnalysisResult,
    behavioral: BehavioralAnalysisResult,
    classification: ClassificationResult
  ): Promise<void> {
    // Store semantic analysis
    const { data: semData, error: semError } = await this.supabase
      .from('ddl_semantic_analysis')
      .insert({
        response_id: responseId,
        semantic_similarity_score: semantic.overall_semantic_similarity,
        concept_coverage: semantic.concept_analysis,
        integration_score: semantic.integration_analysis.integration_score,
        detected_integrations: semantic.integration_analysis.detected_integrations,
        linguistic_markers: semantic.linguistic_markers,
        semantic_entropy: semantic.semantic_entropy.value,
        claude_model_version: this.modelId,
      })
      .select('id')
      .single();
    
    if (semError) throw semError;
    
    // Store behavioral analysis
    const { data: behData, error: behError } = await this.supabase
      .from('ddl_behavioral_analysis')
      .insert({
        response_id: responseId,
        response_time_ms: behavioral.response_time_ms,
        time_per_word_ms: behavioral.time_per_word_ms,
        time_to_first_keystroke_ms: 0, // TODO: Add to behavioral result
        hesitation_pattern: behavioral.hesitation_pattern,
        revision_pattern: behavioral.revision_pattern,
        anxiety_indicators: behavioral.anxiety_indicators,
      })
      .select('id')
      .single();
    
    if (behError) throw behError;
    
    // Store classification
    const { error: classError } = await this.supabase
      .from('ddl_classification')
      .insert({
        response_id: responseId,
        semantic_analysis_id: semData.id,
        behavioral_analysis_id: behData.id,
        primary_lacuna_type: classification.primary_type,
        primary_confidence: classification.primary_confidence,
        primary_probability: classification.primary_probability,
        secondary_lacuna_type: classification.secondary_type,
        secondary_probability: classification.secondary_probability,
        probabilities: classification.probabilities,
        supporting_evidence: classification.supporting_evidence,
        classifier_version: '1.0.0',
      });
    
    if (classError) throw classError;
  }
  
  private async updateUserBaseline(
    userId: string,
    behavioral: BehavioralAnalysisResult,
    semantic: SemanticAnalysisResult
  ): Promise<void> {
    // Simplified baseline update - in production, use proper moving averages
    const { data: existing } = await this.supabase
      .from('ddl_user_baseline')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!existing) {
      // Create initial baseline
      await this.supabase
        .from('ddl_user_baseline')
        .insert({
          user_id: userId,
          total_responses: 1,
          avg_response_time_ms: behavioral.response_time_ms,
          std_response_time_ms: 0,
          avg_hesitation_index: behavioral.hesitation_pattern.hesitation_index,
          std_hesitation_index: 0,
          avg_semantic_similarity: semantic.overall_semantic_similarity,
          calculated_from_responses: 1,
          last_calculated_at: new Date().toISOString(),
        });
    } else {
      // Update with exponential moving average (alpha = 0.1)
      const alpha = 0.1;
      const newAvgTime = alpha * behavioral.response_time_ms + 
        (1 - alpha) * existing.avg_response_time_ms;
      
      await this.supabase
        .from('ddl_user_baseline')
        .update({
          total_responses: existing.total_responses + 1,
          avg_response_time_ms: newAvgTime,
          avg_hesitation_index: alpha * behavioral.hesitation_pattern.hesitation_index +
            (1 - alpha) * existing.avg_hesitation_index,
          avg_semantic_similarity: alpha * semantic.overall_semantic_similarity +
            (1 - alpha) * existing.avg_semantic_similarity,
          calculated_from_responses: existing.calculated_from_responses + 1,
          last_calculated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================
  
  private interpolateTemplate(
    template: string, 
    values: Record<string, string>
  ): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => values[key] || ''
    );
  }
  
  private extractJSON(text: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // Try to find JSON object directly
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }
    
    return text;
  }
}

// Export singleton
export const ddlService = new DDLService();
```

### 3.2 API Route Handler

Criar arquivo `src/app/api/ddl/analyze/route.ts`:

```typescript
// ============================================================
// DDL ANALYSIS API ROUTE
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ddlService } from '@/lib/ddl/services/ddl-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { responseId } = body;
    
    if (!responseId) {
      return NextResponse.json(
        { error: 'responseId is required' },
        { status: 400 }
      );
    }
    
    // Run DDL analysis pipeline
    const result = await ddlService.analyzeResponse(responseId);
    
    return NextResponse.json({
      success: true,
      data: {
        classification: {
          type: result.classification.primary_type,
          confidence: result.classification.primary_confidence,
          probability: result.classification.primary_probability,
        },
        feedbackId: result.feedbackId,
        summary: {
          conceptCoverage: result.semantic.concept_analysis.coverage_ratio,
          integrationScore: result.semantic.integration_analysis.integration_score,
          anxietyScore: result.behavioral.anxiety_indicators.behavioral_anxiety_score,
        },
      },
    });
  } catch (error) {
    console.error('DDL Analysis Error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

---

## FASE 4: FRONTEND COMPONENTS

### 4.1 Behavioral Data Capture Hook

Criar arquivo `src/hooks/useBehavioralCapture.ts`:

```typescript
// ============================================================
// BEHAVIORAL DATA CAPTURE HOOK
// ============================================================

import { useCallback, useRef, useState } from 'react';

interface BehavioralData {
  start_timestamp: string;
  end_timestamp: string;
  total_time_ms: number;
  time_to_first_keystroke_ms: number;
  pause_count: number;
  pause_durations_ms: number[];
  keystroke_dynamics: {
    total_keystrokes: number;
    backspace_count: number;
    delete_count: number;
    avg_inter_key_interval_ms: number;
  };
  revision_events: Array<{
    timestamp: string;
    type: string;
    position?: number;
  }>;
  focus_events: Array<{
    timestamp: string;
    type: 'blur' | 'focus';
    duration_ms?: number;
  }>;
  scroll_events: number;
  copy_paste_events: number;
}

const PAUSE_THRESHOLD_MS = 2000; // 2 seconds = pause

export function useBehavioralCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Refs to avoid re-renders during capture
  const startTimeRef = useRef<number>(0);
  const lastKeystrokeTimeRef = useRef<number>(0);
  const firstKeystrokeTimeRef = useRef<number | null>(null);
  const keystrokeIntervalsRef = useRef<number[]>([]);
  const pauseDurationsRef = useRef<number[]>([]);
  const keystrokeCountRef = useRef({
    total: 0,
    backspace: 0,
    delete: 0,
  });
  const revisionEventsRef = useRef<BehavioralData['revision_events']>([]);
  const focusEventsRef = useRef<BehavioralData['focus_events']>([]);
  const scrollCountRef = useRef(0);
  const copyPasteCountRef = useRef(0);
  const blurStartRef = useRef<number | null>(null);
  
  const startCapture = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastKeystrokeTimeRef.current = now;
    firstKeystrokeTimeRef.current = null;
    keystrokeIntervalsRef.current = [];
    pauseDurationsRef.current = [];
    keystrokeCountRef.current = { total: 0, backspace: 0, delete: 0 };
    revisionEventsRef.current = [];
    focusEventsRef.current = [];
    scrollCountRef.current = 0;
    copyPasteCountRef.current = 0;
    blurStartRef.current = null;
    setIsCapturing(true);
  }, []);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isCapturing) return;
    
    const now = Date.now();
    
    // Track first keystroke
    if (firstKeystrokeTimeRef.current === null) {
      firstKeystrokeTimeRef.current = now;
    }
    
    // Calculate inter-keystroke interval
    const interval = now - lastKeystrokeTimeRef.current;
    
    // Check for pause (gap > threshold)
    if (interval > PAUSE_THRESHOLD_MS) {
      pauseDurationsRef.current.push(interval);
    } else {
      keystrokeIntervalsRef.current.push(interval);
    }
    
    lastKeystrokeTimeRef.current = now;
    keystrokeCountRef.current.total++;
    
    // Track deletion keys
    if (e.key === 'Backspace') {
      keystrokeCountRef.current.backspace++;
      revisionEventsRef.current.push({
        timestamp: new Date(now).toISOString(),
        type: 'backspace',
      });
    } else if (e.key === 'Delete') {
      keystrokeCountRef.current.delete++;
      revisionEventsRef.current.push({
        timestamp: new Date(now).toISOString(),
        type: 'delete',
      });
    }
  }, [isCapturing]);
  
  const handleFocus = useCallback(() => {
    if (!isCapturing) return;
    
    const now = Date.now();
    
    if (blurStartRef.current !== null) {
      const blurDuration = now - blurStartRef.current;
      // Update last focus event with duration
      const lastEvent = focusEventsRef.current[focusEventsRef.current.length - 1];
      if (lastEvent && lastEvent.type === 'blur') {
        lastEvent.duration_ms = blurDuration;
      }
    }
    
    focusEventsRef.current.push({
      timestamp: new Date(now).toISOString(),
      type: 'focus',
    });
    blurStartRef.current = null;
  }, [isCapturing]);
  
  const handleBlur = useCallback(() => {
    if (!isCapturing) return;
    
    const now = Date.now();
    blurStartRef.current = now;
    
    focusEventsRef.current.push({
      timestamp: new Date(now).toISOString(),
      type: 'blur',
    });
  }, [isCapturing]);
  
  const handleScroll = useCallback(() => {
    if (!isCapturing) return;
    scrollCountRef.current++;
  }, [isCapturing]);
  
  const handlePaste = useCallback(() => {
    if (!isCapturing) return;
    copyPasteCountRef.current++;
  }, [isCapturing]);
  
  const stopCapture = useCallback((): BehavioralData => {
    const endTime = Date.now();
    setIsCapturing(false);
    
    const intervals = keystrokeIntervalsRef.current;
    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;
    
    return {
      start_timestamp: new Date(startTimeRef.current).toISOString(),
      end_timestamp: new Date(endTime).toISOString(),
      total_time_ms: endTime - startTimeRef.current,
      time_to_first_keystroke_ms: firstKeystrokeTimeRef.current
        ? firstKeystrokeTimeRef.current - startTimeRef.current
        : 0,
      pause_count: pauseDurationsRef.current.length,
      pause_durations_ms: pauseDurationsRef.current,
      keystroke_dynamics: {
        total_keystrokes: keystrokeCountRef.current.total,
        backspace_count: keystrokeCountRef.current.backspace,
        delete_count: keystrokeCountRef.current.delete,
        avg_inter_key_interval_ms: avgInterval,
      },
      revision_events: revisionEventsRef.current,
      focus_events: focusEventsRef.current,
      scroll_events: scrollCountRef.current,
      copy_paste_events: copyPasteCountRef.current,
    };
  }, []);
  
  return {
    isCapturing,
    startCapture,
    stopCapture,
    handlers: {
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onScroll: handleScroll,
      onPaste: handlePaste,
    },
  };
}
```

### 4.2 DDL Question Component

Criar arquivo `src/components/ddl/DDLQuestion.tsx`:

```typescript
'use client';

// ============================================================
// DDL QUESTION COMPONENT
// ============================================================

import { useState, useCallback } from 'react';
import { useBehavioralCapture } from '@/hooks/useBehavioralCapture';

interface DDLQuestionProps {
  questionId: string;
  questionText: string;
  discipline: string;
  topic: string;
  onSubmit: (data: {
    responseText: string;
    behavioralData: any;
  }) => Promise<void>;
}

export function DDLQuestion({
  questionId,
  questionText,
  discipline,
  topic,
  onSubmit,
}: DDLQuestionProps) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const {
    isCapturing,
    startCapture,
    stopCapture,
    handlers,
  } = useBehavioralCapture();
  
  const handleTextareaFocus = useCallback(() => {
    if (!hasStarted) {
      startCapture();
      setHasStarted(true);
    }
    handlers.onFocus();
  }, [hasStarted, startCapture, handlers]);
  
  const handleSubmit = async () => {
    if (response.trim().length < 10) {
      alert('Por favor, forneça uma resposta mais completa.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const behavioralData = stopCapture();
      
      await onSubmit({
        responseText: response,
        behavioralData,
      });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="ddl-question p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">{discipline} • {topic}</span>
        <h2 className="text-xl font-semibold mt-1">{questionText}</h2>
      </div>
      
      {/* Response Area */}
      <div className="mb-4">
        <label 
          htmlFor="response" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Sua Resposta
        </label>
        <textarea
          id="response"
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Digite sua resposta aqui..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onFocus={handleTextareaFocus}
          onBlur={handlers.onBlur}
          onKeyDown={handlers.onKeyDown}
          onScroll={handlers.onScroll}
          onPaste={handlers.onPaste}
          disabled={isSubmitting}
        />
        <p className="text-sm text-gray-500 mt-1">
          {response.trim().split(/\s+/).filter(Boolean).length} palavras
        </p>
      </div>
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || response.trim().length < 10}
        className={`
          w-full py-3 px-4 rounded-md font-medium transition-colors
          ${isSubmitting || response.trim().length < 10
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isSubmitting ? 'Analisando...' : 'Enviar Resposta'}
      </button>
      
      {/* Status Indicator */}
      {isCapturing && (
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          Capturando dados comportamentais
        </div>
      )}
    </div>
  );
}
```

### 4.3 Feedback Display Component

Criar arquivo `src/components/ddl/DDLFeedback.tsx`:

```typescript
'use client';

// ============================================================
// DDL FEEDBACK DISPLAY COMPONENT
// ============================================================

import { useEffect, useState } from 'react';

interface FeedbackContent {
  type: 'LE' | 'LEm' | 'LIE';
  title: string;
  greeting: string;
  main_message: string;
  strengths: string[];
  areas_for_growth: Array<{
    area: string;
    explanation: string;
    suggestion: string;
  }>;
  action_items: Array<{
    priority: string;
    action: string;
    rationale: string;
    estimated_time: string;
  }>;
  resources: Array<{
    type: string;
    topic: string;
    description: string;
  }>;
  encouragement: string;
  next_steps: string;
}

interface DDLFeedbackProps {
  feedbackId: string;
  classification: {
    type: string;
    confidence: string;
    probability: number;
  };
}

const TYPE_COLORS = {
  LE: 'blue',
  LEm: 'purple',
  LIE: 'orange',
};

const TYPE_LABELS = {
  LE: 'Lacuna Epistêmica',
  LEm: 'Lacuna Emocional',
  LIE: 'Lacuna de Integração',
};

const TYPE_ICONS = {
  LE: '📚',
  LEm: '💭',
  LIE: '🔗',
};

export function DDLFeedback({ feedbackId, classification }: DDLFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    async function loadFeedback() {
      try {
        const res = await fetch(`/api/ddl/feedback/${feedbackId}`);
        const data = await res.json();
        setFeedback(data.feedback_content);
      } catch (error) {
        console.error('Failed to load feedback:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadFeedback();
  }, [feedbackId]);
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }
  
  if (!feedback) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-500">Não foi possível carregar o feedback.</p>
      </div>
    );
  }
  
  const type = classification.type as keyof typeof TYPE_COLORS;
  const color = TYPE_COLORS[type] || 'gray';
  
  return (
    <div className="ddl-feedback bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`p-4 bg-${color}-50 border-b border-${color}-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[type]}</span>
            <div>
              <h3 className={`font-semibold text-${color}-800`}>
                {feedback.title}
              </h3>
              <span className={`text-sm text-${color}-600`}>
                {TYPE_LABELS[type]} • {(classification.probability * 100).toFixed(0)}% de confiança
              </span>
            </div>
          </div>
          <span className={`
            px-2 py-1 text-xs font-medium rounded
            bg-${color}-100 text-${color}-800
          `}>
            {classification.confidence}
          </span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Greeting & Main Message */}
        <div>
          <p className="text-gray-700">{feedback.greeting}</p>
          <p className="mt-2 text-gray-800 font-medium">{feedback.main_message}</p>
        </div>
        
        {/* Strengths */}
        {feedback.strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-700 mb-2">
              ✓ Pontos Fortes
            </h4>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Areas for Growth */}
        {feedback.areas_for_growth.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-700 mb-2">
              ↑ Áreas para Desenvolvimento
            </h4>
            <div className="space-y-3">
              {feedback.areas_for_growth.map((area, i) => (
                <div 
                  key={i}
                  className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <button
                    onClick={() => setExpanded(prev => ({
                      ...prev,
                      [`growth-${i}`]: !prev[`growth-${i}`]
                    }))}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-amber-800">
                      {area.area}
                    </span>
                    <span className="text-amber-600">
                      {expanded[`growth-${i}`] ? '−' : '+'}
                    </span>
                  </button>
                  {expanded[`growth-${i}`] && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{area.explanation}</p>
                      <p className="mt-2 text-amber-700">
                        <strong>Sugestão:</strong> {area.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Items */}
        <div>
          <h4 className="font-medium text-blue-700 mb-2">
            📋 Próximos Passos
          </h4>
          <div className="space-y-2">
            {feedback.action_items.map((item, i) => (
              <div 
                key={i}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <span className={`
                  px-2 py-0.5 text-xs font-medium rounded
                  ${item.priority === 'high' 
                    ? 'bg-red-100 text-red-700'
                    : item.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  }
                `}>
                  {item.priority}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.rationale}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ⏱ {item.estimated_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Resources */}
        {feedback.resources.length > 0 && (
          <div>
            <h4 className="font-medium text-purple-700 mb-2">
              📖 Recursos Recomendados
            </h4>
            <div className="grid gap-2">
              {feedback.resources.map((resource, i) => (
                <div 
                  key={i}
                  className="p-3 bg-purple-50 rounded-lg flex items-center gap-3"
                >
                  <span className="text-purple-600">
                    {resource.type === 'concept_review' ? '📖' :
                     resource.type === 'practice' ? '✏️' : '🧘'}
                  </span>
                  <div>
                    <p className="font-medium text-purple-800">{resource.topic}</p>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Encouragement */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-green-800">{feedback.encouragement}</p>
          <p className="mt-2 font-medium text-green-700">
            {feedback.next_steps}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## FASE 5: QUESTÕES PILOTO

### 5.1 Banco de Questões Inicial

Criar arquivo `supabase/seed/ddl_questions_pilot.sql`:

```sql
-- ============================================================
-- DDL PILOT QUESTIONS - MEDICAL EDUCATION
-- ============================================================

INSERT INTO ddl_questions (
    question_code,
    question_text,
    discipline,
    topic,
    subtopic,
    difficulty_level,
    cognitive_level,
    reference_answer,
    key_concepts,
    required_integrations
) VALUES

-- QUESTÃO 1: Farmacologia - Mecanismo de Ação
(
    'DDL-FARM-001',
    'Explique o mecanismo de ação dos inibidores da ECA (Enzima Conversora de Angiotensina) no tratamento da hipertensão arterial.',
    'Farmacologia',
    'Anti-hipertensivos',
    'IECA',
    3,
    'Compreensão/Aplicação',
    'Os inibidores da ECA bloqueiam a enzima conversora de angiotensina, impedindo a conversão de angiotensina I em angiotensina II. Isso resulta em vasodilatação (pela redução da angiotensina II, um potente vasoconstritor) e redução da retenção de sódio e água (pela diminuição da liberação de aldosterona). Adicionalmente, há acúmulo de bradicinina, que contribui para a vasodilatação e também para efeitos colaterais como a tosse seca.',
    '[
        {"concept": "bloqueio da ECA", "weight": 0.25, "synonyms": ["inibição da enzima conversora", "bloqueia ECA"]},
        {"concept": "angiotensina II reduzida", "weight": 0.20, "synonyms": ["diminuição de angiotensina II", "menos angiotensina 2"]},
        {"concept": "vasodilatação", "weight": 0.20, "synonyms": ["dilatação dos vasos", "relaxamento vascular"]},
        {"concept": "aldosterona diminuída", "weight": 0.15, "synonyms": ["redução de aldosterona", "menos aldosterona"]},
        {"concept": "acúmulo de bradicinina", "weight": 0.10, "synonyms": ["bradicinina aumentada", "elevação de bradicinina"]},
        {"concept": "tosse seca como efeito colateral", "weight": 0.10, "synonyms": ["tosse como reação adversa"]}
    ]'::jsonb,
    '[
        {"from": "bloqueio da ECA", "to": "angiotensina II reduzida", "relation": "causa"},
        {"from": "angiotensina II reduzida", "to": "vasodilatação", "relation": "resulta_em"},
        {"from": "angiotensina II reduzida", "to": "aldosterona diminuída", "relation": "causa"},
        {"from": "bloqueio da ECA", "to": "acúmulo de bradicinina", "relation": "causa"},
        {"from": "acúmulo de bradicinina", "to": "tosse seca como efeito colateral", "relation": "causa"}
    ]'::jsonb
),

-- QUESTÃO 2: Fisiologia - Integração de Sistemas
(
    'DDL-FISIO-001',
    'Descreva como o sistema nervoso autônomo e o sistema renina-angiotensina-aldosterona atuam de forma integrada na regulação da pressão arterial.',
    'Fisiologia',
    'Regulação Cardiovascular',
    'Integração Neuro-Humoral',
    4,
    'Análise/Síntese',
    'O sistema nervoso autônomo regula a pressão arterial de forma rápida através do simpático (aumenta FC, contratilidade e vasoconstrição) e parassimpático (reduz FC). Já o sistema RAA atua de forma mais lenta: a queda de pressão estimula liberação de renina, que converte angiotensinogênio em angiotensina I, depois em angiotensina II pela ECA. A angiotensina II causa vasoconstrição direta e estimula aldosterona, retendo sódio e água. Esses sistemas se integram: o simpático estimula diretamente a liberação de renina, criando um loop de amplificação na resposta à hipotensão.',
    '[
        {"concept": "simpático aumenta FC e vasoconstrição", "weight": 0.15, "synonyms": ["sistema simpático eleva frequência cardíaca"]},
        {"concept": "parassimpático reduz FC", "weight": 0.10, "synonyms": ["vagal diminui frequência"]},
        {"concept": "renina liberada por queda de pressão", "weight": 0.15, "synonyms": ["hipotensão estimula renina"]},
        {"concept": "cascata angiotensinogênio-angiotensina", "weight": 0.15, "synonyms": ["conversão de angiotensina"]},
        {"concept": "angiotensina II vasoconstrição", "weight": 0.15, "synonyms": ["ang II contrai vasos"]},
        {"concept": "aldosterona retém sódio e água", "weight": 0.10, "synonyms": ["aldosterona aumenta volemia"]},
        {"concept": "simpático estimula renina", "weight": 0.20, "synonyms": ["integração simpático-RAA", "loop neuro-humoral"]}
    ]'::jsonb,
    '[
        {"from": "simpático aumenta FC e vasoconstrição", "to": "simpático estimula renina", "relation": "integra_com"},
        {"from": "renina liberada por queda de pressão", "to": "cascata angiotensinogênio-angiotensina", "relation": "inicia"},
        {"from": "cascata angiotensinogênio-angiotensina", "to": "angiotensina II vasoconstrição", "relation": "produz"},
        {"from": "angiotensina II vasoconstrição", "to": "aldosterona retém sódio e água", "relation": "estimula"},
        {"from": "simpático estimula renina", "to": "cascata angiotensinogênio-angiotensina", "relation": "amplifica"}
    ]'::jsonb
),

-- QUESTÃO 3: Clínica Médica - Raciocínio Diagnóstico
(
    'DDL-CLIN-001',
    'Um paciente de 55 anos apresenta dor torácica retroesternal que piora ao esforço e melhora ao repouso. Quais são os principais diagnósticos diferenciais e que exame você solicitaria primeiro?',
    'Clínica Médica',
    'Dor Torácica',
    'Síndrome Coronariana',
    3,
    'Aplicação/Análise',
    'A dor torácica típica (retroesternal, aos esforços, alivia com repouso) sugere angina estável como principal hipótese. Os diagnósticos diferenciais incluem: síndrome coronariana aguda (se há piora recente do padrão), espasmo esofágico (dor pode ser similar), doença do refluxo gastroesofágico, e causas musculoesqueléticas. O primeiro exame a solicitar é o eletrocardiograma (ECG), que é rápido, acessível e pode mostrar alterações isquêmicas. Se normal e a suspeita persiste, seguir com teste ergométrico ou outros exames funcionais.',
    '[
        {"concept": "angina estável como principal hipótese", "weight": 0.25, "synonyms": ["angina de esforço", "DAC estável"]},
        {"concept": "síndrome coronariana aguda no diferencial", "weight": 0.15, "synonyms": ["SCA", "infarto"]},
        {"concept": "causas esofágicas", "weight": 0.10, "synonyms": ["DRGE", "espasmo esofágico"]},
        {"concept": "ECG como primeiro exame", "weight": 0.25, "synonyms": ["eletrocardiograma inicial", "ECG de repouso"]},
        {"concept": "teste ergométrico se ECG normal", "weight": 0.15, "synonyms": ["prova de esforço", "teste funcional"]},
        {"concept": "características típicas da angina", "weight": 0.10, "synonyms": ["dor típica", "padrão anginoso"]}
    ]'::jsonb,
    '[
        {"from": "características típicas da angina", "to": "angina estável como principal hipótese", "relation": "sugere"},
        {"from": "angina estável como principal hipótese", "to": "síndrome coronariana aguda no diferencial", "relation": "diferencia_de"},
        {"from": "angina estável como principal hipótese", "to": "ECG como primeiro exame", "relation": "requer"},
        {"from": "ECG como primeiro exame", "to": "teste ergométrico se ECG normal", "relation": "seguido_por"}
    ]'::jsonb
),

-- QUESTÃO 4: Patologia - Conceitos Fundamentais
(
    'DDL-PAT-001',
    'Diferencie necrose de apoptose quanto aos mecanismos celulares e consequências teciduais.',
    'Patologia',
    'Lesão Celular',
    'Morte Celular',
    2,
    'Compreensão',
    'A necrose é morte celular patológica causada por injúria irreversível (isquemia, toxinas). Caracteriza-se por tumefação celular, ruptura de membrana, liberação de conteúdo intracelular e inflamação subsequente. Já a apoptose é morte celular programada, fisiológica ou patológica, mediada por caspases. Caracteriza-se por condensação celular, fragmentação do núcleo (cariorrexe), formação de corpos apoptóticos que são fagocitados, sem inflamação. A necrose é sempre patológica; a apoptose pode ser fisiológica (desenvolvimento, renovação tecidual) ou patológica.',
    '[
        {"concept": "necrose por injúria irreversível", "weight": 0.15, "synonyms": ["necrose por isquemia", "morte por dano"]},
        {"concept": "tumefação e ruptura de membrana na necrose", "weight": 0.15, "synonyms": ["edema celular", "lise celular"]},
        {"concept": "inflamação na necrose", "weight": 0.15, "synonyms": ["resposta inflamatória", "necrose causa inflamação"]},
        {"concept": "apoptose mediada por caspases", "weight": 0.15, "synonyms": ["via das caspases", "execução apoptótica"]},
        {"concept": "condensação e fragmentação na apoptose", "weight": 0.15, "synonyms": ["cariorrexe", "corpos apoptóticos"]},
        {"concept": "apoptose sem inflamação", "weight": 0.15, "synonyms": ["morte silenciosa", "fagocitose sem inflamação"]},
        {"concept": "apoptose pode ser fisiológica", "weight": 0.10, "synonyms": ["apoptose no desenvolvimento", "renovação tecidual"]}
    ]'::jsonb,
    '[
        {"from": "necrose por injúria irreversível", "to": "tumefação e ruptura de membrana na necrose", "relation": "causa"},
        {"from": "tumefação e ruptura de membrana na necrose", "to": "inflamação na necrose", "relation": "resulta_em"},
        {"from": "apoptose mediada por caspases", "to": "condensação e fragmentação na apoptose", "relation": "produz"},
        {"from": "condensação e fragmentação na apoptose", "to": "apoptose sem inflamação", "relation": "resulta_em"}
    ]'::jsonb
),

-- QUESTÃO 5: Neurologia - Caso Clínico Simples
(
    'DDL-NEURO-001',
    'Um paciente apresenta hemiparesia direita e afasia. Em qual hemisfério e território vascular você localiza a lesão?',
    'Neurologia',
    'AVC',
    'Localização de Lesões',
    2,
    'Aplicação',
    'A hemiparesia direita indica lesão no hemisfério cerebral esquerdo (cruzamento das vias piramidais). A afasia (distúrbio de linguagem) confirma lesão no hemisfério dominante, que na maioria dos destros e em grande parte dos canhotos é o esquerdo. O território vascular mais provável é o da artéria cerebral média esquerda, que irriga as áreas motoras para face e membro superior (região perisylviana) e as áreas de linguagem (Broca e Wernicke).',
    '[
        {"concept": "lesão no hemisfério esquerdo", "weight": 0.30, "synonyms": ["hemisfério cerebral esquerdo", "lado esquerdo do cérebro"]},
        {"concept": "cruzamento das vias piramidais", "weight": 0.15, "synonyms": ["decussação piramidal", "vias cruzam na medula"]},
        {"concept": "hemisfério dominante para linguagem", "weight": 0.20, "synonyms": ["dominância para fala", "hemisfério da linguagem"]},
        {"concept": "artéria cerebral média", "weight": 0.25, "synonyms": ["ACM", "território da média"]},
        {"concept": "áreas de Broca e Wernicke", "weight": 0.10, "synonyms": ["áreas de linguagem", "córtex perisylviano"]}
    ]'::jsonb,
    '[
        {"from": "cruzamento das vias piramidais", "to": "lesão no hemisfério esquerdo", "relation": "explica"},
        {"from": "lesão no hemisfério esquerdo", "to": "hemisfério dominante para linguagem", "relation": "corresponde_a"},
        {"from": "hemisfério dominante para linguagem", "to": "artéria cerebral média", "relation": "irrigado_por"},
        {"from": "artéria cerebral média", "to": "áreas de Broca e Wernicke", "relation": "supre"}
    ]'::jsonb
);
```

---

## FASE 6: COMANDOS DE EXECUÇÃO

### 6.1 Script de Setup Completo

```bash
#!/bin/bash
# ============================================================
# DDL SYSTEM SETUP SCRIPT
# Execute no Claude Code com Opus 4.5
# ============================================================

echo "🚀 Iniciando setup do sistema DDL..."

# 1. Verificar se está no diretório correto
if [ ! -d ".git" ]; then
    echo "❌ Execute este script na raiz do repositório Darwin-education"
    exit 1
fi

# 2. Criar branch de feature
git checkout -b feature/ddl-system 2>/dev/null || git checkout feature/ddl-system

# 3. Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p src/lib/ddl/prompts
mkdir -p src/lib/ddl/services
mkdir -p src/components/ddl
mkdir -p src/hooks
mkdir -p src/app/api/ddl/analyze
mkdir -p src/app/api/ddl/feedback
mkdir -p supabase/migrations/ddl
mkdir -p supabase/seed

# 4. Verificar dependências
echo "📦 Verificando dependências..."
npm list @anthropic-ai/sdk || npm install @anthropic-ai/sdk

# 5. Feedback
echo "✅ Estrutura criada!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copiar os arquivos SQL para supabase/migrations/ddl/"
echo "2. Copiar os arquivos TypeScript para src/"
echo "3. Executar: supabase db push"
echo "4. Configurar variáveis de ambiente:"
echo "   - ANTHROPIC_API_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "🎯 Sistema DDL pronto para implementação!"
```

### 6.2 Variáveis de Ambiente Necessárias

Adicionar ao `.env.local`:

```env
# DDL System
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## FASE 7: VALIDAÇÃO E TESTES

### 7.1 Checklist de Validação

```markdown
## DDL Implementation Checklist

### Database
- [ ] Migration executada sem erros
- [ ] Tabelas criadas corretamente
- [ ] Índices criados
- [ ] RLS policies ativas
- [ ] Views funcionando

### Backend
- [ ] DDL Service instancia corretamente
- [ ] Conexão com Claude API funciona
- [ ] Conexão com Supabase funciona
- [ ] Análise semântica retorna JSON válido
- [ ] Análise comportamental calcula métricas
- [ ] Classificação funciona
- [ ] Feedback é gerado em português

### Frontend
- [ ] Hook de captura comportamental funciona
- [ ] Componente de questão renderiza
- [ ] Dados comportamentais são capturados
- [ ] Submissão funciona
- [ ] Feedback é exibido corretamente

### Integration
- [ ] Pipeline completo funciona end-to-end
- [ ] Dados persistem corretamente
- [ ] Baseline do usuário é atualizado
```

### 7.2 Comando de Teste End-to-End

```bash
# No Claude Code, após implementação:
npm run dev

# Em outro terminal, testar API:
curl -X POST http://localhost:3000/api/ddl/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"responseId": "test-response-uuid"}'
```

---

## REFERÊNCIAS TÉCNICAS

1. **ALIGNAgent** (arXiv 2025) - Adaptive learning diagnostic loops
2. **Theobald et al. 2022** - Test anxiety não interfere em retrieval
3. **BioBERT/Clinical BERT** - Domain-specific embeddings
4. **Hyland 1998-2005** - Hedging markers in academic writing
5. **Linn 2006** - Knowledge Integration Perspective
6. **BMC Medical Education 2024** - LLM-based ASAG (GPT-4, Gemini)
7. **MDPI 2025** - Claude 2 performance (ICC=0.927)

---

**Documento gerado para implementação no Claude Code com Opus 4.5**
**Iterative Convergence: Versão 1.0.0 - Ready for Implementation**