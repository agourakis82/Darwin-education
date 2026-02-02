-- ============================================================
-- QGen-DDL DATABASE SCHEMA
-- Migration: 001_qgen_core_tables.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text similarity
CREATE EXTENSION IF NOT EXISTS "vector";   -- For embeddings

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE question_source AS ENUM (
    'ENAMED',
    'ENARE',
    'USP',
    'UNIFESP',
    'UNICAMP',
    'SANTA_CASA',
    'EINSTEIN',
    'SUS_SP',
    'MEDCURSO',
    'GENERATED',
    'OTHER'
);

CREATE TYPE question_type AS ENUM (
    'CLINICAL_CASE',      -- Caso clínico com vinheta
    'CONCEPTUAL',         -- Pergunta direta conceitual
    'IMAGE_BASED',        -- Baseada em imagem
    'CALCULATION',        -- Requer cálculo
    'INTERPRETATION',     -- Interpretação de exames
    'ETHICAL_LEGAL',      -- Ética/Bioética/Legal
    'EPIDEMIOLOGICAL',    -- Cálculos epidemiológicos
    'MIXED'               -- Combinação
);

CREATE TYPE bloom_level AS ENUM (
    'KNOWLEDGE',          -- Nível 1: Lembrar
    'COMPREHENSION',      -- Nível 2: Entender
    'APPLICATION',        -- Nível 3: Aplicar
    'ANALYSIS',           -- Nível 4: Analisar
    'SYNTHESIS',          -- Nível 5: Sintetizar
    'EVALUATION'          -- Nível 6: Avaliar
);

CREATE TYPE clinical_scenario AS ENUM (
    'EMERGENCY',          -- PS/Emergência
    'OUTPATIENT',         -- Ambulatório
    'INPATIENT',          -- Enfermaria
    'ICU',                -- UTI
    'PRIMARY_CARE',       -- UBS/APS
    'HOME_VISIT',         -- Visita domiciliar
    'SURGERY',            -- Centro cirúrgico
    'PRENATAL',           -- Pré-natal
    'CHILDBIRTH',         -- Sala de parto
    'VACCINATION',        -- Sala de vacina
    'OTHER'
);

CREATE TYPE distractor_type AS ENUM (
    'PLAUSIBLE_RELATED',    -- Condição relacionada, plausível
    'PARTIALLY_CORRECT',    -- Parcialmente correta
    'COMMON_MISCONCEPTION', -- Erro comum de estudantes
    'INVERTED',             -- Oposto da correta
    'INCOMPLETE',           -- Conduta incompleta
    'OUTDATED',             -- Conduta desatualizada
    'DIFFERENT_CONTEXT',    -- Correta em outro contexto
    'ABSOLUTE_TERM',        -- Usa termos absolutos
    'OBVIOUS_WRONG'         -- Claramente errada (facilitador)
);

CREATE TYPE validation_status AS ENUM (
    'DRAFT',              -- Rascunho
    'AUTO_VALIDATED',     -- Validado automaticamente
    'PENDING_REVIEW',     -- Aguardando revisão humana
    'UNDER_REVIEW',       -- Em revisão
    'APPROVED',           -- Aprovado
    'REJECTED',           -- Rejeitado
    'NEEDS_REVISION',     -- Precisa revisão
    'PUBLISHED'           -- Publicado/ativo
);

-- ============================================================
-- CORPUS TABLES (Questões de Referência)
-- ============================================================

-- Questões do corpus de análise
CREATE TABLE qgen_corpus_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificação
    source question_source NOT NULL,
    source_year INTEGER,
    source_exam VARCHAR(100),
    original_number INTEGER,
    external_id VARCHAR(100),

    -- Conteúdo
    full_text TEXT NOT NULL,
    stem TEXT NOT NULL,  -- Enunciado sem alternativas

    -- Alternativas (JSONB para flexibilidade)
    alternatives JSONB NOT NULL,
    -- Estrutura: {"A": "texto", "B": "texto", ...}

    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,

    -- Classificação primária
    question_type question_type NOT NULL,

    -- Área/Tema
    primary_area VARCHAR(100) NOT NULL,
    secondary_area VARCHAR(100),
    topic VARCHAR(200),
    subtopic VARCHAR(200),

    -- Features extraídas (ver seção 3)
    extracted_features JSONB,

    -- Embedding para similaridade
    embedding vector(1536),  -- OpenAI ada-002 ou similar

    -- Metadados
    has_image BOOLEAN DEFAULT FALSE,
    has_table BOOLEAN DEFAULT FALSE,
    has_lab_values BOOLEAN DEFAULT FALSE,
    word_count INTEGER,

    -- IRT Parameters (se disponíveis)
    irt_difficulty DECIMAL(4,3),
    irt_discrimination DECIMAL(4,3),
    irt_guessing DECIMAL(4,3),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices de busca
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(topic, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(stem, '')), 'B')
    ) STORED
);

-- Índices para corpus
CREATE INDEX idx_corpus_source ON qgen_corpus_questions(source);
CREATE INDEX idx_corpus_area ON qgen_corpus_questions(primary_area);
CREATE INDEX idx_corpus_topic ON qgen_corpus_questions(topic);
CREATE INDEX idx_corpus_type ON qgen_corpus_questions(question_type);
CREATE INDEX idx_corpus_year ON qgen_corpus_questions(source_year);
CREATE INDEX idx_corpus_embedding ON qgen_corpus_questions USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_corpus_search ON qgen_corpus_questions USING gin(search_vector);

-- ============================================================
-- FEATURE EXTRACTION TABLES
-- ============================================================

-- Features estruturais extraídas
CREATE TABLE qgen_structural_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES qgen_corpus_questions(id) ON DELETE CASCADE,

    -- Métricas de tamanho
    stem_word_count INTEGER,
    stem_sentence_count INTEGER,
    stem_char_count INTEGER,
    avg_words_per_sentence DECIMAL(5,2),

    -- Alternativas
    num_alternatives INTEGER,
    alternatives_word_counts JSONB,  -- {"A": 12, "B": 15, ...}
    alternatives_length_variance DECIMAL(5,2),
    longest_alternative CHAR(1),
    shortest_alternative CHAR(1),

    -- Componentes
    has_patient_demographics BOOLEAN,
    has_chief_complaint BOOLEAN,
    has_time_evolution BOOLEAN,
    has_physical_exam BOOLEAN,
    has_vital_signs BOOLEAN,
    has_lab_results BOOLEAN,
    has_imaging BOOLEAN,
    has_pathology BOOLEAN,
    has_medication_history BOOLEAN,
    has_family_history BOOLEAN,
    has_social_history BOOLEAN,

    -- Formato da pergunta
    question_format VARCHAR(50),  -- "Qual", "O que", "Como", etc.
    is_negative_stem BOOLEAN,     -- "EXCETO", "NÃO", "INCORRETA"
    asks_for_diagnosis BOOLEAN,
    asks_for_treatment BOOLEAN,
    asks_for_next_step BOOLEAN,
    asks_for_mechanism BOOLEAN,
    asks_for_prognosis BOOLEAN,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features clínicas (para casos clínicos)
CREATE TABLE qgen_clinical_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES qgen_corpus_questions(id) ON DELETE CASCADE,

    -- Demografia do paciente
    patient_sex VARCHAR(20),       -- Masculino, Feminino, Não especificado
    patient_age_value INTEGER,
    patient_age_unit VARCHAR(20),  -- anos, meses, dias
    patient_age_category VARCHAR(30),  -- Neonato, Lactente, Criança, Adolescente, Adulto, Idoso
    patient_occupation VARCHAR(100),
    patient_ethnicity VARCHAR(50),

    -- Cenário clínico
    clinical_scenario clinical_scenario,
    urgency_level VARCHAR(20),     -- Eletivo, Urgente, Emergente

    -- Queixa e evolução
    chief_complaint TEXT,
    time_evolution_value DECIMAL(10,2),
    time_evolution_unit VARCHAR(20),  -- minutos, horas, dias, semanas, meses, anos
    is_acute BOOLEAN,
    is_chronic BOOLEAN,
    is_recurrent BOOLEAN,

    -- Sinais vitais (se presentes)
    vital_signs JSONB,
    -- {"PA": "140x90", "FC": 88, "FR": 18, "Tax": 36.5, "SpO2": 98}

    -- Exame físico
    physical_exam_systems JSONB,  -- ["cardiovascular", "respiratório", ...]
    physical_exam_findings JSONB, -- {"cardiovascular": "sopro sistólico", ...}

    -- Exames complementares
    lab_tests JSONB,
    imaging_tests JSONB,
    other_tests JSONB,

    -- Diagnóstico
    primary_diagnosis VARCHAR(200),
    differential_diagnoses JSONB,
    icd10_codes JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features cognitivas
CREATE TABLE qgen_cognitive_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES qgen_corpus_questions(id) ON DELETE CASCADE,

    -- Nível de Bloom
    bloom_level bloom_level,
    bloom_confidence DECIMAL(3,2),

    -- Tipo de raciocínio requerido
    requires_recall BOOLEAN,
    requires_understanding BOOLEAN,
    requires_application BOOLEAN,
    requires_analysis BOOLEAN,
    requires_synthesis BOOLEAN,
    requires_evaluation BOOLEAN,

    -- Domínios cognitivos
    tests_factual_knowledge BOOLEAN,
    tests_conceptual_knowledge BOOLEAN,
    tests_procedural_knowledge BOOLEAN,
    tests_metacognitive_knowledge BOOLEAN,

    -- Habilidades específicas
    requires_calculation BOOLEAN,
    requires_interpretation BOOLEAN,
    requires_clinical_reasoning BOOLEAN,
    requires_ethical_reasoning BOOLEAN,
    requires_integration BOOLEAN,

    -- Conceitos-chave
    key_concepts JSONB,
    -- [{"concept": "IECA", "weight": 0.3, "required": true}, ...]

    -- Integrações requeridas
    required_integrations JSONB,
    -- [{"from": "concept_a", "to": "concept_b", "type": "causal"}, ...]

    -- Pré-requisitos
    prerequisite_concepts JSONB,

    -- Complexidade
    concept_count INTEGER,
    integration_count INTEGER,
    cognitive_load_estimate DECIMAL(3,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features linguísticas
CREATE TABLE qgen_linguistic_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES qgen_corpus_questions(id) ON DELETE CASCADE,

    -- Marcadores de hedging no enunciado
    stem_hedging_count INTEGER,
    stem_hedging_markers JSONB,  -- ["pode", "geralmente", "frequentemente"]

    -- Termos absolutos
    stem_absolute_count INTEGER,
    stem_absolute_markers JSONB,  -- ["sempre", "nunca", "único"]

    -- Conectivos lógicos
    logical_connectives JSONB,  -- ["portanto", "entretanto", "além disso"]

    -- Análise por alternativa
    alternatives_linguistic JSONB,
    /* {
        "A": {"hedging": 2, "absolute": 0, "length": 15},
        "B": {"hedging": 0, "absolute": 1, "length": 12},
        ...
    } */

    -- Pistas linguísticas (problemas)
    grammatical_cues JSONB,  -- Concordância que revela resposta
    length_cue_present BOOLEAN,  -- Alternativa correta muito maior/menor
    absolute_term_in_correct BOOLEAN,  -- Termo absoluto na correta (problema)

    -- Complexidade linguística
    flesch_reading_ease DECIMAL(5,2),
    gunning_fog_index DECIMAL(5,2),
    avg_syllables_per_word DECIMAL(4,2),
    technical_term_density DECIMAL(4,3),

    -- Vocabulário médico
    medical_terms JSONB,
    abbreviations JSONB,
    eponyms JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features dos distratores
CREATE TABLE qgen_distractor_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES qgen_corpus_questions(id) ON DELETE CASCADE,

    alternative CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,

    -- Classificação do distrator
    distractor_type distractor_type,
    distractor_type_confidence DECIMAL(3,2),

    -- Plausibilidade
    plausibility_score DECIMAL(3,2),  -- 0-1

    -- Relação com resposta correta
    semantic_similarity_to_correct DECIMAL(4,3),
    shares_key_concepts BOOLEAN,
    concept_overlap_count INTEGER,

    -- Misconception associada
    targets_misconception BOOLEAN,
    misconception_id UUID,  -- FK para tabela de misconceptions
    misconception_description TEXT,

    -- Se for conduta
    is_valid_but_not_best BOOLEAN,
    is_contraindicated BOOLEAN,
    is_outdated BOOLEAN,
    is_incomplete BOOLEAN,

    -- Métricas empíricas (se disponíveis)
    selection_rate DECIMAL(4,3),  -- % que escolheu esta alternativa
    discrimination_index DECIMAL(4,3),
    point_biserial DECIMAL(4,3),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(question_id, alternative)
);

-- ============================================================
-- KNOWLEDGE BASE TABLES
-- ============================================================

-- Áreas e temas médicos
CREATE TABLE qgen_medical_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES qgen_medical_areas(id),

    -- Distribuição esperada em provas
    enamed_weight DECIMAL(4,3),
    enare_weight DECIMAL(4,3),

    -- Metadados
    dcn_reference TEXT,  -- Referência nas DCN
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tópicos específicos
CREATE TABLE qgen_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    area_id UUID NOT NULL REFERENCES qgen_medical_areas(id),
    name VARCHAR(200) NOT NULL,

    -- Conceitos associados
    key_concepts JSONB,

    -- Frequência em provas
    frequency_score DECIMAL(3,2),  -- 0-1, baseado em corpus

    -- Dificuldade típica
    typical_difficulty DECIMAL(4,3),

    -- Integrações comuns
    common_integrations JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(area_id, name)
);

-- Misconceptions médicas conhecidas
CREATE TABLE qgen_misconceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificação
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,

    -- Área/Tema
    area_id UUID REFERENCES qgen_medical_areas(id),
    topic_id UUID REFERENCES qgen_topics(id),

    -- Descrição
    incorrect_belief TEXT NOT NULL,
    correct_understanding TEXT NOT NULL,
    why_common TEXT,  -- Por que é um erro comum

    -- Conceitos envolvidos
    concepts_involved JSONB,

    -- Frequência
    prevalence_estimate DECIMAL(3,2),  -- % de estudantes que têm

    -- Fontes de evidência
    source_studies JSONB,

    -- Estratégias de correção
    correction_strategies JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates de vinheta clínica
CREATE TABLE qgen_vignette_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,

    -- Cenário
    clinical_scenario clinical_scenario NOT NULL,

    -- Template com placeholders
    template_text TEXT NOT NULL,

    -- Campos obrigatórios e opcionais
    required_fields JSONB,
    optional_fields JSONB,

    -- Áreas/especialidades que usam este template
    applicable_areas JSONB,

    -- Exemplos de uso
    examples JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATED QUESTIONS TABLES
-- ============================================================

-- Questões geradas pelo sistema
CREATE TABLE qgen_generated_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Configuração de geração
    generation_config_id UUID,  -- FK para config usada
    generation_timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Conteúdo
    stem TEXT NOT NULL,
    alternatives JSONB NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,

    -- Metadados de geração
    target_area VARCHAR(100),
    target_topic VARCHAR(200),
    target_difficulty DECIMAL(4,3),
    target_bloom_level bloom_level,

    -- Features geradas (mesma estrutura do corpus)
    generated_features JSONB,

    -- Embedding
    embedding vector(1536),

    -- Validação
    validation_status validation_status DEFAULT 'DRAFT',

    -- Scores de qualidade automática
    quality_scores JSONB,
    /* {
        "medical_accuracy": 0.95,
        "linguistic_quality": 0.88,
        "distractor_quality": 0.82,
        "originality": 0.91,
        "difficulty_match": 0.85
    } */

    -- Similaridade com corpus
    max_corpus_similarity DECIMAL(4,3),
    most_similar_corpus_id UUID,

    -- IRT estimado
    estimated_difficulty DECIMAL(4,3),
    estimated_discrimination DECIMAL(4,3),

    -- Revisão humana
    reviewer_id UUID,
    review_timestamp TIMESTAMPTZ,
    review_notes TEXT,
    review_score INTEGER,  -- 1-5

    -- LLM info
    llm_model VARCHAR(100),
    llm_prompt_version VARCHAR(50),
    llm_raw_response JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para questões geradas
CREATE INDEX idx_generated_status ON qgen_generated_questions(validation_status);
CREATE INDEX idx_generated_area ON qgen_generated_questions(target_area);
CREATE INDEX idx_generated_difficulty ON qgen_generated_questions(target_difficulty);
CREATE INDEX idx_generated_embedding ON qgen_generated_questions USING ivfflat (embedding vector_cosine_ops);

-- Log de geração
CREATE TABLE qgen_generation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_id UUID REFERENCES qgen_generated_questions(id),

    -- Request
    request_params JSONB,
    prompt_used TEXT,

    -- Response
    llm_response TEXT,
    response_time_ms INTEGER,
    tokens_used INTEGER,

    -- Resultado
    success BOOLEAN,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VALIDATION TABLES
-- ============================================================

-- Revisões humanas
CREATE TABLE qgen_human_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_id UUID NOT NULL REFERENCES qgen_generated_questions(id),
    reviewer_id UUID NOT NULL,

    -- Scores (1-5)
    medical_accuracy_score INTEGER CHECK (medical_accuracy_score BETWEEN 1 AND 5),
    clinical_relevance_score INTEGER CHECK (clinical_relevance_score BETWEEN 1 AND 5),
    linguistic_clarity_score INTEGER CHECK (linguistic_clarity_score BETWEEN 1 AND 5),
    distractor_quality_score INTEGER CHECK (distractor_quality_score BETWEEN 1 AND 5),
    difficulty_appropriate_score INTEGER CHECK (difficulty_appropriate_score BETWEEN 1 AND 5),
    overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 5),

    -- Feedback detalhado
    medical_issues TEXT,
    linguistic_issues TEXT,
    suggested_changes TEXT,

    -- Decisão
    decision VARCHAR(20),  -- approve, reject, revise

    -- Tempo
    review_duration_seconds INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resultados de aplicação piloto
CREATE TABLE qgen_pilot_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_id UUID NOT NULL REFERENCES qgen_generated_questions(id),
    pilot_session_id UUID,

    -- Estatísticas agregadas
    total_responses INTEGER,
    correct_responses INTEGER,

    -- Distribuição por alternativa
    response_distribution JSONB,  -- {"A": 0.15, "B": 0.25, "C": 0.45, "D": 0.15}

    -- IRT calculado
    irt_difficulty DECIMAL(4,3),
    irt_discrimination DECIMAL(4,3),
    irt_guessing DECIMAL(4,3),

    -- Métricas por alternativa
    distractor_analysis JSONB,
    /* {
        "A": {"selection_rate": 0.15, "point_biserial": -0.12},
        "B": {"selection_rate": 0.25, "point_biserial": -0.18},
        ...
    } */

    -- Tempo médio
    avg_response_time_seconds DECIMAL(6,2),
    median_response_time_seconds DECIMAL(6,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATION CONFIG TABLE
-- ============================================================

CREATE TABLE qgen_generation_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Target parameters
    target_area VARCHAR(100),
    target_topic VARCHAR(200),
    target_difficulty DECIMAL(4,3),
    target_bloom_level bloom_level,
    target_question_type question_type,

    -- LLM settings
    llm_model VARCHAR(100) DEFAULT 'grok-3',
    llm_temperature DECIMAL(3,2) DEFAULT 0.7,
    llm_max_tokens INTEGER DEFAULT 2048,

    -- Prompt settings
    prompt_version VARCHAR(50),
    use_few_shot BOOLEAN DEFAULT TRUE,
    few_shot_count INTEGER DEFAULT 3,

    -- Validation settings
    min_quality_score DECIMAL(3,2) DEFAULT 0.70,
    max_corpus_similarity DECIMAL(3,2) DEFAULT 0.85,
    require_human_review BOOLEAN DEFAULT FALSE,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Vista consolidada de features do corpus
CREATE OR REPLACE VIEW v_corpus_full_features AS
SELECT
    q.id,
    q.source,
    q.source_year,
    q.question_type,
    q.primary_area,
    q.topic,
    q.correct_answer,
    q.word_count,
    q.irt_difficulty,
    q.irt_discrimination,

    -- Structural
    sf.stem_word_count,
    sf.num_alternatives,
    sf.has_patient_demographics,
    sf.is_negative_stem,
    sf.asks_for_diagnosis,
    sf.asks_for_treatment,

    -- Clinical
    cf.patient_sex,
    cf.patient_age_category,
    cf.clinical_scenario,
    cf.chief_complaint,
    cf.is_acute,

    -- Cognitive
    cog.bloom_level,
    cog.key_concepts,
    cog.required_integrations,
    cog.cognitive_load_estimate,

    -- Linguistic
    lf.stem_hedging_count,
    lf.stem_absolute_count,
    lf.technical_term_density,
    lf.flesch_reading_ease

FROM qgen_corpus_questions q
LEFT JOIN qgen_structural_features sf ON q.id = sf.question_id
LEFT JOIN qgen_clinical_features cf ON q.id = cf.question_id
LEFT JOIN qgen_cognitive_features cog ON q.id = cog.question_id
LEFT JOIN qgen_linguistic_features lf ON q.id = lf.question_id;

-- Vista de distribuição por área
CREATE OR REPLACE VIEW v_area_distribution AS
SELECT
    source,
    source_year,
    primary_area,
    COUNT(*) as question_count,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY source, source_year) * 100, 2) as percentage,
    AVG(irt_difficulty) as avg_difficulty,
    AVG(word_count) as avg_word_count
FROM qgen_corpus_questions
GROUP BY source, source_year, primary_area
ORDER BY source, source_year, question_count DESC;

-- Vista de qualidade de questões geradas
CREATE OR REPLACE VIEW v_generated_quality AS
SELECT
    gq.id,
    gq.target_area,
    gq.target_topic,
    gq.validation_status,
    gq.quality_scores->>'medical_accuracy' as medical_accuracy,
    gq.quality_scores->>'linguistic_quality' as linguistic_quality,
    gq.quality_scores->>'distractor_quality' as distractor_quality,
    gq.quality_scores->>'originality' as originality,
    gq.max_corpus_similarity,
    gq.estimated_difficulty,
    AVG(hr.overall_score) as avg_human_score,
    COUNT(hr.id) as review_count
FROM qgen_generated_questions gq
LEFT JOIN qgen_human_reviews hr ON gq.id = hr.question_id
GROUP BY gq.id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Função para calcular similaridade com corpus
CREATE OR REPLACE FUNCTION check_corpus_similarity(
    p_embedding vector(1536),
    p_threshold DECIMAL DEFAULT 0.85
)
RETURNS TABLE (
    question_id UUID,
    similarity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        1 - (q.embedding <=> p_embedding)::DECIMAL as sim
    FROM qgen_corpus_questions q
    WHERE q.embedding IS NOT NULL
    AND 1 - (q.embedding <=> p_embedding) > p_threshold
    ORDER BY sim DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de área
CREATE OR REPLACE FUNCTION get_area_stats(p_source question_source)
RETURNS TABLE (
    area VARCHAR,
    count BIGINT,
    pct DECIMAL,
    avg_diff DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.primary_area::VARCHAR,
        COUNT(*)::BIGINT,
        ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 2),
        ROUND(AVG(q.irt_difficulty)::DECIMAL, 3)
    FROM qgen_corpus_questions q
    WHERE q.source = p_source
    GROUP BY q.primary_area;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE qgen_generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qgen_human_reviews ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role full access to generated" ON qgen_generated_questions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to reviews" ON qgen_human_reviews
    FOR ALL USING (auth.role() = 'service_role');

-- Reviewers can see questions pending review
CREATE POLICY "Reviewers see pending questions" ON qgen_generated_questions
    FOR SELECT USING (
        validation_status IN ('PENDING_REVIEW', 'UNDER_REVIEW')
        AND auth.role() = 'authenticated'
    );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_corpus_updated
    BEFORE UPDATE ON qgen_corpus_questions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_generated_updated
    BEFORE UPDATE ON qgen_generated_questions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_config_updated
    BEFORE UPDATE ON qgen_generation_config
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
