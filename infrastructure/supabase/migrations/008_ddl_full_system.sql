-- ============================================================
-- DDL SYSTEM - FULL MIGRATION
-- Diagnostico Diferencial de Lacunas de Aprendizagem
-- Combined: Core Tables + Batch Processing
-- ============================================================

-- Enum para tipos de lacuna
DO $$ BEGIN
    CREATE TYPE lacuna_type AS ENUM ('LE', 'LEm', 'LIE', 'MIXED', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para niveis de confianca
DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status do batch
DO $$ BEGIN
    CREATE TYPE ddl_batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- ddl_questions: Questoes dissertativas curtas com metadados semanticos
CREATE TABLE IF NOT EXISTS ddl_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code VARCHAR(20) UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    discipline VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    cognitive_level VARCHAR(50),
    reference_answer TEXT NOT NULL,
    key_concepts JSONB NOT NULL DEFAULT '[]',
    required_integrations JSONB DEFAULT '[]',
    irt_difficulty DECIMAL(5,3),
    irt_discrimination DECIMAL(5,3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ddl_responses: Respostas dos estudantes com dados comportamentais
CREATE TABLE IF NOT EXISTS ddl_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ddl_questions(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    response_text TEXT NOT NULL,
    behavioral_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- ddl_semantic_analysis: Analise semantica via LLM API
CREATE TABLE IF NOT EXISTS ddl_semantic_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    semantic_similarity_score DECIMAL(5,4),
    concept_coverage JSONB NOT NULL DEFAULT '{}',
    integration_score DECIMAL(5,4),
    detected_integrations JSONB DEFAULT '[]',
    linguistic_markers JSONB NOT NULL DEFAULT '{}',
    semantic_entropy DECIMAL(8,6),
    llm_raw_response JSONB,
    llm_model_version VARCHAR(50),
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ddl_behavioral_analysis: Analise de padroes comportamentais
CREATE TABLE IF NOT EXISTS ddl_behavioral_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    response_time_ms INTEGER NOT NULL,
    time_per_word_ms DECIMAL(8,2),
    time_to_first_keystroke_ms INTEGER,
    hesitation_pattern JSONB NOT NULL DEFAULT '{}',
    revision_pattern JSONB NOT NULL DEFAULT '{}',
    anxiety_indicators JSONB NOT NULL DEFAULT '{}',
    deviation_from_baseline JSONB DEFAULT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ddl_classification: Classificacao final do tipo de lacuna
CREATE TABLE IF NOT EXISTS ddl_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    semantic_analysis_id UUID REFERENCES ddl_semantic_analysis(id),
    behavioral_analysis_id UUID REFERENCES ddl_behavioral_analysis(id),
    primary_lacuna_type lacuna_type NOT NULL,
    primary_confidence confidence_level NOT NULL,
    primary_probability DECIMAL(5,4) NOT NULL,
    secondary_lacuna_type lacuna_type,
    secondary_probability DECIMAL(5,4),
    probabilities JSONB NOT NULL,
    supporting_evidence JSONB NOT NULL DEFAULT '{}',
    classifier_version VARCHAR(20) NOT NULL,
    classification_method VARCHAR(50) DEFAULT 'fusion_probabilistic',
    human_validated BOOLEAN DEFAULT FALSE,
    human_classification lacuna_type,
    validator_id UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ddl_feedback: Feedback personalizado gerado
CREATE TABLE IF NOT EXISTS ddl_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES ddl_classification(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    feedback_type lacuna_type NOT NULL,
    feedback_content JSONB NOT NULL,
    delivered_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback_helpful BOOLEAN,
    user_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ddl_user_baseline: Baseline comportamental por usuario
CREATE TABLE IF NOT EXISTS ddl_user_baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_responses INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    std_response_time_ms DECIMAL(10,2),
    avg_time_per_word_ms DECIMAL(8,2),
    std_time_per_word_ms DECIMAL(8,2),
    avg_hesitation_index DECIMAL(5,4),
    std_hesitation_index DECIMAL(5,4),
    avg_pause_ratio DECIMAL(5,4),
    std_pause_ratio DECIMAL(5,4),
    avg_revision_ratio DECIMAL(5,4),
    std_revision_ratio DECIMAL(5,4),
    avg_semantic_similarity DECIMAL(5,4),
    avg_concept_coverage DECIMAL(5,4),
    avg_hedging_index DECIMAL(5,4),
    calculated_from_responses INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,
    baseline_by_difficulty JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BATCH PROCESSING TABLES
-- ============================================================

-- ddl_batch_jobs: Jobs de processamento em lote
CREATE TABLE IF NOT EXISTS ddl_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100),
    created_by UUID REFERENCES auth.users(id),
    source_type VARCHAR(50) NOT NULL DEFAULT 'exam',
    source_id UUID,
    status ddl_batch_status DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    xai_batch_id VARCHAR(100),
    xai_batch_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- ddl_batch_items: Items individuais em um batch job
CREATE TABLE IF NOT EXISTS ddl_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_job_id UUID NOT NULL REFERENCES ddl_batch_jobs(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    status ddl_batch_status DEFAULT 'pending',
    classification_id UUID REFERENCES ddl_classification(id),
    feedback_id UUID REFERENCES ddl_feedback(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_message TEXT
);

-- exam_ddl_responses: Link between exam attempts and DDL responses
CREATE TABLE IF NOT EXISTS exam_ddl_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_attempt_id UUID NOT NULL,
    ddl_response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    ddl_question_id UUID NOT NULL REFERENCES ddl_questions(id),
    question_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_attempt_id, ddl_question_id)
);

-- exam_ddl_summary: Aggregated DDL results for an exam attempt
CREATE TABLE IF NOT EXISTS exam_ddl_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_attempt_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    batch_job_id UUID REFERENCES ddl_batch_jobs(id),
    total_ddl_questions INTEGER DEFAULT 0,
    analyzed_count INTEGER DEFAULT 0,
    le_count INTEGER DEFAULT 0,
    lem_count INTEGER DEFAULT 0,
    lie_count INTEGER DEFAULT 0,
    none_count INTEGER DEFAULT 0,
    avg_concept_coverage DECIMAL(5,4),
    avg_integration_score DECIMAL(5,4),
    avg_anxiety_score DECIMAL(5,4),
    dominant_lacuna_type lacuna_type,
    overall_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ddl_questions_discipline ON ddl_questions(discipline);
CREATE INDEX IF NOT EXISTS idx_ddl_questions_topic ON ddl_questions(topic);
CREATE INDEX IF NOT EXISTS idx_ddl_questions_active ON ddl_questions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ddl_responses_user ON ddl_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ddl_responses_question ON ddl_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_ddl_responses_session ON ddl_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_ddl_responses_created ON ddl_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ddl_semantic_response ON ddl_semantic_analysis(response_id);
CREATE INDEX IF NOT EXISTS idx_ddl_semantic_similarity ON ddl_semantic_analysis(semantic_similarity_score);
CREATE INDEX IF NOT EXISTS idx_ddl_behavioral_response ON ddl_behavioral_analysis(response_id);
CREATE INDEX IF NOT EXISTS idx_ddl_classification_response ON ddl_classification(response_id);
CREATE INDEX IF NOT EXISTS idx_ddl_classification_type ON ddl_classification(primary_lacuna_type);
CREATE INDEX IF NOT EXISTS idx_ddl_classification_validated ON ddl_classification(human_validated) WHERE human_validated = TRUE;
CREATE INDEX IF NOT EXISTS idx_ddl_feedback_user ON ddl_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ddl_feedback_classification ON ddl_feedback(classification_id);
CREATE INDEX IF NOT EXISTS idx_ddl_baseline_user ON ddl_user_baseline(user_id);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_jobs_status ON ddl_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_jobs_source ON ddl_batch_jobs(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_jobs_created ON ddl_batch_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_items_job ON ddl_batch_items(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_items_response ON ddl_batch_items(response_id);
CREATE INDEX IF NOT EXISTS idx_ddl_batch_items_status ON ddl_batch_items(status);
CREATE INDEX IF NOT EXISTS idx_exam_ddl_responses_attempt ON exam_ddl_responses(exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_ddl_responses_response ON exam_ddl_responses(ddl_response_id);
CREATE INDEX IF NOT EXISTS idx_exam_ddl_summary_attempt ON exam_ddl_summary(exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_ddl_summary_user ON exam_ddl_summary(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_ddl_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ddl_questions_updated_at ON ddl_questions;
CREATE TRIGGER update_ddl_questions_updated_at
    BEFORE UPDATE ON ddl_questions
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

DROP TRIGGER IF EXISTS update_ddl_user_baseline_updated_at ON ddl_user_baseline;
CREATE TRIGGER update_ddl_user_baseline_updated_at
    BEFORE UPDATE ON ddl_user_baseline
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_ddl_summary_updated_at ON exam_ddl_summary;
CREATE TRIGGER update_exam_ddl_summary_updated_at
    BEFORE UPDATE ON exam_ddl_summary
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ddl_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_semantic_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_user_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_ddl_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_ddl_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "DDL questions are readable" ON ddl_questions;
DROP POLICY IF EXISTS "Users can view own responses" ON ddl_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON ddl_responses;
DROP POLICY IF EXISTS "Users can view own semantic analysis" ON ddl_semantic_analysis;
DROP POLICY IF EXISTS "Users can view own behavioral analysis" ON ddl_behavioral_analysis;
DROP POLICY IF EXISTS "Users can view own classification" ON ddl_classification;
DROP POLICY IF EXISTS "Users can view own feedback" ON ddl_feedback;
DROP POLICY IF EXISTS "Users can view own baseline" ON ddl_user_baseline;
DROP POLICY IF EXISTS "Users can view own batch jobs" ON ddl_batch_jobs;
DROP POLICY IF EXISTS "Users can view own exam ddl summary" ON exam_ddl_summary;
DROP POLICY IF EXISTS "Service can manage all ddl_responses" ON ddl_responses;
DROP POLICY IF EXISTS "Service can manage all semantic analysis" ON ddl_semantic_analysis;
DROP POLICY IF EXISTS "Service can manage all behavioral analysis" ON ddl_behavioral_analysis;
DROP POLICY IF EXISTS "Service can manage all classification" ON ddl_classification;
DROP POLICY IF EXISTS "Service can manage all feedback" ON ddl_feedback;
DROP POLICY IF EXISTS "Service can manage all baselines" ON ddl_user_baseline;
DROP POLICY IF EXISTS "Service can manage all batch jobs" ON ddl_batch_jobs;
DROP POLICY IF EXISTS "Service can manage all batch items" ON ddl_batch_items;
DROP POLICY IF EXISTS "Service can manage exam ddl responses" ON exam_ddl_responses;
DROP POLICY IF EXISTS "Service can manage exam ddl summary" ON exam_ddl_summary;

-- Public read for questions
CREATE POLICY "DDL questions are readable" ON ddl_questions
    FOR SELECT USING (is_active = true);

-- Users can view and insert own responses
CREATE POLICY "Users can view own responses" ON ddl_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON ddl_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view own analysis
CREATE POLICY "Users can view own semantic analysis" ON ddl_semantic_analysis
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ddl_responses r WHERE r.id = response_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can view own behavioral analysis" ON ddl_behavioral_analysis
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ddl_responses r WHERE r.id = response_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can view own classification" ON ddl_classification
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ddl_responses r WHERE r.id = response_id AND r.user_id = auth.uid()
    ));

-- Users can view own feedback
CREATE POLICY "Users can view own feedback" ON ddl_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view own baseline
CREATE POLICY "Users can view own baseline" ON ddl_user_baseline
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view own batch jobs
CREATE POLICY "Users can view own batch jobs" ON ddl_batch_jobs
    FOR SELECT USING (auth.uid() = created_by);

-- Users can view own exam DDL summary
CREATE POLICY "Users can view own exam ddl summary" ON exam_ddl_summary
    FOR SELECT USING (auth.uid() = user_id);

-- Service role policies for backend processing
CREATE POLICY "Service can manage all ddl_responses" ON ddl_responses
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all semantic analysis" ON ddl_semantic_analysis
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all behavioral analysis" ON ddl_behavioral_analysis
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all classification" ON ddl_classification
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all feedback" ON ddl_feedback
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all baselines" ON ddl_user_baseline
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all batch jobs" ON ddl_batch_jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all batch items" ON ddl_batch_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage exam ddl responses" ON exam_ddl_responses
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage exam ddl summary" ON exam_ddl_summary
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
