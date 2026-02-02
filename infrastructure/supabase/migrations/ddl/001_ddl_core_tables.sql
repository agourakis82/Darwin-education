-- ============================================================
-- DDL SYSTEM - CORE TABLES
-- Diagnostico Diferencial de Lacunas de Aprendizagem
-- ============================================================

-- Enum para tipos de lacuna
CREATE TYPE lacuna_type AS ENUM ('LE', 'LEm', 'LIE', 'MIXED', 'NONE');

-- Enum para niveis de confianca
CREATE TYPE confidence_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- ============================================================
-- TABELA: ddl_questions
-- Questoes dissertativas curtas com metadados semanticos
-- ============================================================
CREATE TABLE ddl_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao
    question_code VARCHAR(20) UNIQUE NOT NULL,
    question_text TEXT NOT NULL,

    -- Metadados academicos
    discipline VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    cognitive_level VARCHAR(50),

    -- Gabarito semantico
    reference_answer TEXT NOT NULL,
    key_concepts JSONB NOT NULL DEFAULT '[]',
    required_integrations JSONB DEFAULT '[]',

    -- Parametros IRT (se disponiveis)
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

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- ============================================================
-- TABELA: ddl_semantic_analysis
-- Analise semantica via LLM API
-- ============================================================
CREATE TABLE ddl_semantic_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,

    -- Metricas semanticas
    semantic_similarity_score DECIMAL(5,4),
    concept_coverage JSONB NOT NULL DEFAULT '{}',

    -- Metricas de integracao
    integration_score DECIMAL(5,4),
    detected_integrations JSONB DEFAULT '[]',

    -- Analise linguistica
    linguistic_markers JSONB NOT NULL DEFAULT '{}',

    -- Entropia semantica (KEC framework extension)
    semantic_entropy DECIMAL(8,6),

    -- Raw LLM response (for debugging/audit)
    llm_raw_response JSONB,
    llm_model_version VARCHAR(50),

    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_behavioral_analysis
-- Analise de padroes comportamentais
-- ============================================================
CREATE TABLE ddl_behavioral_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,

    -- Metricas temporais
    response_time_ms INTEGER NOT NULL,
    time_per_word_ms DECIMAL(8,2),
    time_to_first_keystroke_ms INTEGER,

    -- Padroes de hesitacao
    hesitation_pattern JSONB NOT NULL DEFAULT '{}',

    -- Padroes de revisao
    revision_pattern JSONB NOT NULL DEFAULT '{}',

    -- Indicadores de ansiedade comportamental
    anxiety_indicators JSONB NOT NULL DEFAULT '{}',

    -- Comparacao com baseline do usuario
    deviation_from_baseline JSONB DEFAULT NULL,

    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_classification
-- Classificacao final do tipo de lacuna
-- ============================================================
CREATE TABLE ddl_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    semantic_analysis_id UUID REFERENCES ddl_semantic_analysis(id),
    behavioral_analysis_id UUID REFERENCES ddl_behavioral_analysis(id),

    -- Classificacao primaria
    primary_lacuna_type lacuna_type NOT NULL,
    primary_confidence confidence_level NOT NULL,
    primary_probability DECIMAL(5,4) NOT NULL,

    -- Classificacoes secundarias (se MIXED ou probabilidades proximas)
    secondary_lacuna_type lacuna_type,
    secondary_probability DECIMAL(5,4),

    -- Probabilidades completas
    probabilities JSONB NOT NULL,

    -- Evidencias que suportam a classificacao
    supporting_evidence JSONB NOT NULL DEFAULT '{}',

    -- Metadados do classificador
    classifier_version VARCHAR(20) NOT NULL,
    classification_method VARCHAR(50) DEFAULT 'fusion_probabilistic',

    -- Validacao humana (para training data)
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

    -- Delivery
    delivered_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,

    -- Feedback do usuario sobre o feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback_helpful BOOLEAN,
    user_comments TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ddl_user_baseline
-- Baseline comportamental por usuario (para deteccao de desvios)
-- ============================================================
CREATE TABLE ddl_user_baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Estatisticas agregadas
    total_responses INTEGER DEFAULT 0,

    -- Metricas temporais baseline
    avg_response_time_ms DECIMAL(10,2),
    std_response_time_ms DECIMAL(10,2),
    avg_time_per_word_ms DECIMAL(8,2),
    std_time_per_word_ms DECIMAL(8,2),

    -- Metricas de hesitacao baseline
    avg_hesitation_index DECIMAL(5,4),
    std_hesitation_index DECIMAL(5,4),
    avg_pause_ratio DECIMAL(5,4),
    std_pause_ratio DECIMAL(5,4),

    -- Metricas de revisao baseline
    avg_revision_ratio DECIMAL(5,4),
    std_revision_ratio DECIMAL(5,4),

    -- Metricas semanticas baseline
    avg_semantic_similarity DECIMAL(5,4),
    avg_concept_coverage DECIMAL(5,4),
    avg_hedging_index DECIMAL(5,4),

    -- Window de calculo
    calculated_from_responses INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,

    -- Segmentacao por dificuldade
    baseline_by_difficulty JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================
-- INDICES
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
CREATE OR REPLACE FUNCTION update_ddl_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ddl_questions_updated_at
    BEFORE UPDATE ON ddl_questions
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

CREATE TRIGGER update_ddl_user_baseline_updated_at
    BEFORE UPDATE ON ddl_user_baseline
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ddl_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_semantic_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_user_baseline ENABLE ROW LEVEL SECURITY;

-- Politicas: usuarios so veem seus proprios dados
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

-- View agregada para dashboard do usuario
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

-- View para questoes com estatisticas
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
