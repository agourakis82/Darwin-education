-- ============================================================
-- DDL BATCH PROCESSING TABLES
-- Queue system for async DDL analysis after exam completion
-- ============================================================

-- Enum para status do batch
CREATE TYPE ddl_batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- TABELA: ddl_batch_jobs
-- Jobs de processamento em lote
-- ============================================================
CREATE TABLE ddl_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job metadata
    batch_name VARCHAR(100),
    created_by UUID REFERENCES auth.users(id),

    -- Source (exam, manual, scheduled)
    source_type VARCHAR(50) NOT NULL DEFAULT 'exam',
    source_id UUID, -- exam_attempt_id if from exam

    -- Processing status
    status ddl_batch_status DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,

    -- xAI Batch API tracking
    xai_batch_id VARCHAR(100),
    xai_batch_status VARCHAR(50),

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- ============================================================
-- TABELA: ddl_batch_items
-- Items individuais em um batch job
-- ============================================================
CREATE TABLE ddl_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_job_id UUID NOT NULL REFERENCES ddl_batch_jobs(id) ON DELETE CASCADE,

    -- Response reference
    response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,

    -- Processing status
    status ddl_batch_status DEFAULT 'pending',

    -- Results
    classification_id UUID REFERENCES ddl_classification(id),
    feedback_id UUID REFERENCES ddl_feedback(id),

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Error tracking
    error_message TEXT
);

-- ============================================================
-- TABELA: exam_ddl_responses
-- Link between exam attempts and DDL responses
-- ============================================================
CREATE TABLE exam_ddl_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links
    exam_attempt_id UUID NOT NULL, -- References exam_attempts but not enforced for flexibility
    ddl_response_id UUID NOT NULL REFERENCES ddl_responses(id) ON DELETE CASCADE,
    ddl_question_id UUID NOT NULL REFERENCES ddl_questions(id),

    -- Position in exam
    question_order INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(exam_attempt_id, ddl_question_id)
);

-- ============================================================
-- TABELA: exam_ddl_summary
-- Aggregated DDL results for an exam attempt
-- ============================================================
CREATE TABLE exam_ddl_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_attempt_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Batch processing
    batch_job_id UUID REFERENCES ddl_batch_jobs(id),

    -- Aggregated results
    total_ddl_questions INTEGER DEFAULT 0,
    analyzed_count INTEGER DEFAULT 0,

    -- Classification breakdown
    le_count INTEGER DEFAULT 0,
    lem_count INTEGER DEFAULT 0,
    lie_count INTEGER DEFAULT 0,
    none_count INTEGER DEFAULT 0,

    -- Aggregated scores
    avg_concept_coverage DECIMAL(5,4),
    avg_integration_score DECIMAL(5,4),
    avg_anxiety_score DECIMAL(5,4),

    -- Dominant pattern
    dominant_lacuna_type lacuna_type,
    overall_recommendation TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

-- ddl_batch_jobs
CREATE INDEX idx_ddl_batch_jobs_status ON ddl_batch_jobs(status);
CREATE INDEX idx_ddl_batch_jobs_source ON ddl_batch_jobs(source_type, source_id);
CREATE INDEX idx_ddl_batch_jobs_created ON ddl_batch_jobs(created_at DESC);

-- ddl_batch_items
CREATE INDEX idx_ddl_batch_items_job ON ddl_batch_items(batch_job_id);
CREATE INDEX idx_ddl_batch_items_response ON ddl_batch_items(response_id);
CREATE INDEX idx_ddl_batch_items_status ON ddl_batch_items(status);

-- exam_ddl_responses
CREATE INDEX idx_exam_ddl_responses_attempt ON exam_ddl_responses(exam_attempt_id);
CREATE INDEX idx_exam_ddl_responses_response ON exam_ddl_responses(ddl_response_id);

-- exam_ddl_summary
CREATE INDEX idx_exam_ddl_summary_attempt ON exam_ddl_summary(exam_attempt_id);
CREATE INDEX idx_exam_ddl_summary_user ON exam_ddl_summary(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_exam_ddl_summary_updated_at
    BEFORE UPDATE ON exam_ddl_summary
    FOR EACH ROW EXECUTE FUNCTION update_ddl_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ddl_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddl_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_ddl_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_ddl_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own batch jobs
CREATE POLICY "Users can view own batch jobs" ON ddl_batch_jobs
    FOR SELECT USING (auth.uid() = created_by);

-- Users can view their own exam DDL data
CREATE POLICY "Users can view own exam ddl summary" ON exam_ddl_summary
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: Process pending batch items
-- ============================================================
CREATE OR REPLACE FUNCTION get_pending_batch_items(p_batch_job_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    item_id UUID,
    response_id UUID,
    question_id UUID,
    response_text TEXT,
    behavioral_data JSONB,
    question_text TEXT,
    reference_answer TEXT,
    key_concepts JSONB,
    required_integrations JSONB,
    discipline VARCHAR,
    topic VARCHAR,
    difficulty_level INTEGER,
    cognitive_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bi.id as item_id,
        bi.response_id,
        r.question_id,
        r.response_text,
        r.behavioral_data,
        q.question_text,
        q.reference_answer,
        q.key_concepts,
        q.required_integrations,
        q.discipline,
        q.topic,
        q.difficulty_level,
        q.cognitive_level
    FROM ddl_batch_items bi
    JOIN ddl_responses r ON bi.response_id = r.id
    JOIN ddl_questions q ON r.question_id = q.id
    WHERE bi.batch_job_id = p_batch_job_id
      AND bi.status = 'pending'
    ORDER BY bi.created_at
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Update exam DDL summary after batch completion
-- ============================================================
CREATE OR REPLACE FUNCTION update_exam_ddl_summary(p_exam_attempt_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_total INTEGER;
    v_analyzed INTEGER;
    v_le INTEGER;
    v_lem INTEGER;
    v_lie INTEGER;
    v_none INTEGER;
    v_avg_coverage DECIMAL;
    v_avg_integration DECIMAL;
    v_avg_anxiety DECIMAL;
    v_dominant lacuna_type;
BEGIN
    -- Get user_id from exam_ddl_responses
    SELECT r.user_id INTO v_user_id
    FROM exam_ddl_responses edr
    JOIN ddl_responses r ON edr.ddl_response_id = r.id
    WHERE edr.exam_attempt_id = p_exam_attempt_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Count totals
    SELECT COUNT(*) INTO v_total
    FROM exam_ddl_responses
    WHERE exam_attempt_id = p_exam_attempt_id;

    -- Count analyzed with classifications
    SELECT
        COUNT(*),
        COUNT(CASE WHEN c.primary_lacuna_type = 'LE' THEN 1 END),
        COUNT(CASE WHEN c.primary_lacuna_type = 'LEm' THEN 1 END),
        COUNT(CASE WHEN c.primary_lacuna_type = 'LIE' THEN 1 END),
        COUNT(CASE WHEN c.primary_lacuna_type = 'NONE' THEN 1 END)
    INTO v_analyzed, v_le, v_lem, v_lie, v_none
    FROM exam_ddl_responses edr
    JOIN ddl_classification c ON edr.ddl_response_id = c.response_id
    WHERE edr.exam_attempt_id = p_exam_attempt_id;

    -- Calculate averages
    SELECT
        AVG(sa.concept_coverage->>'coverage_ratio')::DECIMAL,
        AVG(sa.integration_score),
        AVG((ba.anxiety_indicators->>'behavioral_anxiety_score')::DECIMAL)
    INTO v_avg_coverage, v_avg_integration, v_avg_anxiety
    FROM exam_ddl_responses edr
    JOIN ddl_semantic_analysis sa ON edr.ddl_response_id = sa.response_id
    JOIN ddl_behavioral_analysis ba ON edr.ddl_response_id = ba.response_id
    WHERE edr.exam_attempt_id = p_exam_attempt_id;

    -- Determine dominant type
    SELECT primary_lacuna_type INTO v_dominant
    FROM (
        SELECT c.primary_lacuna_type, COUNT(*) as cnt
        FROM exam_ddl_responses edr
        JOIN ddl_classification c ON edr.ddl_response_id = c.response_id
        WHERE edr.exam_attempt_id = p_exam_attempt_id
          AND c.primary_lacuna_type != 'NONE'
        GROUP BY c.primary_lacuna_type
        ORDER BY cnt DESC
        LIMIT 1
    ) sub;

    -- Upsert summary
    INSERT INTO exam_ddl_summary (
        exam_attempt_id, user_id, total_ddl_questions, analyzed_count,
        le_count, lem_count, lie_count, none_count,
        avg_concept_coverage, avg_integration_score, avg_anxiety_score,
        dominant_lacuna_type
    ) VALUES (
        p_exam_attempt_id, v_user_id, v_total, v_analyzed,
        v_le, v_lem, v_lie, v_none,
        v_avg_coverage, v_avg_integration, v_avg_anxiety,
        v_dominant
    )
    ON CONFLICT (exam_attempt_id) DO UPDATE SET
        analyzed_count = EXCLUDED.analyzed_count,
        le_count = EXCLUDED.le_count,
        lem_count = EXCLUDED.lem_count,
        lie_count = EXCLUDED.lie_count,
        none_count = EXCLUDED.none_count,
        avg_concept_coverage = EXCLUDED.avg_concept_coverage,
        avg_integration_score = EXCLUDED.avg_integration_score,
        avg_anxiety_score = EXCLUDED.avg_anxiety_score,
        dominant_lacuna_type = EXCLUDED.dominant_lacuna_type,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
