-- =====================================================
-- Beta Web Required Tables (Darwin Education)
-- =====================================================
-- Date: 2026-02-12
-- Goal: Ensure the production Supabase project has the minimum schema
-- required for the current web beta (content, AI cache, study activity,
-- flashcard logs, and research-grade psychometrics).
--
-- This migration is written to be safe to apply to a non-empty database:
-- use IF NOT EXISTS, DROP POLICY IF EXISTS, and idempotent helpers.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 1) Medical content (Darwin-MFC) tables
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_diseases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  enamed_area TEXT NOT NULL CHECK (enamed_area IN ('clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia', 'saude_coletiva')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  cid10 TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  search_terms TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_medications (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT[] NOT NULL DEFAULT '{}',
  atc_code TEXT,
  drug_class TEXT NOT NULL,
  subclass TEXT,
  summary TEXT,
  search_terms TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_diseases_enamed_area
  ON medical_diseases (enamed_area);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_categoria
  ON medical_diseases (categoria);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_title
  ON medical_diseases (title);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_search_terms_trgm
  ON medical_diseases USING GIN (search_terms gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_search_terms_fts
  ON medical_diseases USING GIN (to_tsvector('portuguese', search_terms));

CREATE INDEX IF NOT EXISTS idx_medical_medications_drug_class
  ON medical_medications (drug_class);
CREATE INDEX IF NOT EXISTS idx_medical_medications_generic_name
  ON medical_medications (generic_name);
CREATE INDEX IF NOT EXISTS idx_medical_medications_atc_code
  ON medical_medications (atc_code);
CREATE INDEX IF NOT EXISTS idx_medical_medications_search_terms_trgm
  ON medical_medications USING GIN (search_terms gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medical_medications_search_terms_fts
  ON medical_medications USING GIN (to_tsvector('portuguese', search_terms));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at'
      AND pg_function_is_visible(oid)
  ) THEN
    CREATE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_medical_diseases_updated_at ON medical_diseases;
CREATE TRIGGER update_medical_diseases_updated_at
  BEFORE UPDATE ON medical_diseases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_medical_medications_updated_at ON medical_medications;
CREATE TRIGGER update_medical_medications_updated_at
  BEFORE UPDATE ON medical_medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE medical_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medical_diseases_public_select ON medical_diseases;
CREATE POLICY medical_diseases_public_select
  ON medical_diseases
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS medical_medications_public_select ON medical_medications;
CREATE POLICY medical_medications_public_select
  ON medical_medications
  FOR SELECT
  USING (true);

-- =====================================================
-- 2) AI integration: cache + metadata columns
-- =====================================================

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS ai_generation_cost NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'minimax',
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validation_score INTEGER CHECK (validation_score BETWEEN 1 AND 5);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  request_hash TEXT UNIQUE NOT NULL,
  response_text TEXT NOT NULL,
  tokens_used INTEGER,
  cost_brl NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hits INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_response_cache(request_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_response_cache(expires_at);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day';

ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_cache_no_access ON ai_response_cache;
CREATE POLICY ai_cache_no_access ON ai_response_cache
  FOR ALL USING (false);

-- =====================================================
-- 3) Study activity (streaks + engagement) + RPCs
-- =====================================================

CREATE TABLE IF NOT EXISTS study_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  exams_completed INTEGER DEFAULT 0,
  flashcards_reviewed INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_study_activity_user_date ON study_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_study_activity_date ON study_activity(activity_date);

ALTER TABLE study_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own study activity" ON study_activity;
CREATE POLICY "Users can view own study activity"
  ON study_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own study activity" ON study_activity;
CREATE POLICY "Users can upsert own study activity"
  ON study_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own study activity" ON study_activity;
CREATE POLICY "Users can update own study activity"
  ON study_activity
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_study_activity(
  p_user_id UUID,
  p_exams INTEGER DEFAULT 0,
  p_flashcards INTEGER DEFAULT 0,
  p_questions INTEGER DEFAULT 0,
  p_time_seconds INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO study_activity (user_id, activity_date, exams_completed, flashcards_reviewed, questions_answered, time_spent_seconds)
  VALUES (p_user_id, CURRENT_DATE, p_exams, p_flashcards, p_questions, p_time_seconds)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    exams_completed = study_activity.exams_completed + EXCLUDED.exams_completed,
    flashcards_reviewed = study_activity.flashcards_reviewed + EXCLUDED.flashcards_reviewed,
    questions_answered = study_activity.questions_answered + EXCLUDED.questions_answered,
    time_spent_seconds = study_activity.time_spent_seconds + EXCLUDED.time_spent_seconds,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION track_study_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_item_id UUID DEFAULT NULL,
  p_area TEXT DEFAULT NULL,
  p_correct BOOLEAN DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_confidence NUMERIC DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep the signature flexible for future expansion. Today we only need
  -- the daily counters for streaks.
  PERFORM update_study_activity(
    p_user_id,
    CASE WHEN p_activity_type = 'exam_question' THEN 0 ELSE 0 END,
    CASE WHEN p_activity_type = 'flashcard_review' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'exam_question' THEN 1 ELSE 0 END,
    0
  );
END;
$$;

CREATE OR REPLACE FUNCTION calculate_study_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_activity_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM study_activity
    WHERE user_id = p_user_id
      AND activity_date = v_current_date
      AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
  ) INTO v_activity_exists;

  IF NOT v_activity_exists THEN
    v_current_date := v_current_date - 1;
    SELECT EXISTS(
      SELECT 1
      FROM study_activity
      WHERE user_id = p_user_id
        AND activity_date = v_current_date
        AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
    ) INTO v_activity_exists;

    IF NOT v_activity_exists THEN
      RETURN 0;
    END IF;
  END IF;

  LOOP
    SELECT EXISTS(
      SELECT 1
      FROM study_activity
      WHERE user_id = p_user_id
        AND activity_date = v_current_date
        AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
    ) INTO v_activity_exists;

    EXIT WHEN NOT v_activity_exists;

    v_streak := v_streak + 1;
    v_current_date := v_current_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$$;

REVOKE ALL ON FUNCTION update_study_activity(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION track_study_activity(UUID, TEXT, UUID, TEXT, BOOLEAN, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION calculate_study_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_study_activity(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION track_study_activity(UUID, TEXT, UUID, TEXT, BOOLEAN, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_study_streak(UUID) TO authenticated;

-- =====================================================
-- 4) Flashcards: review logs + FSRS weights
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4),
  state TEXT NOT NULL CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  elapsed_days NUMERIC(8, 2) DEFAULT 0,
  stability_after NUMERIC(8, 3),
  difficulty_after NUMERIC(5, 3),
  scheduled_days INTEGER,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_logs_user
  ON flashcard_review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_time
  ON flashcard_review_logs(card_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_card_time
  ON flashcard_review_logs(user_id, card_id, reviewed_at);

CREATE TABLE IF NOT EXISTS user_fsrs_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weights JSONB NOT NULL,
  optimizer_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_fsrs_weights_user
  ON user_fsrs_weights(user_id);

ALTER TABLE flashcard_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fsrs_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_logs_select ON flashcard_review_logs;
CREATE POLICY review_logs_select ON flashcard_review_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS review_logs_insert ON flashcard_review_logs;
CREATE POLICY review_logs_insert ON flashcard_review_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fsrs_weights_select ON user_fsrs_weights;
CREATE POLICY fsrs_weights_select ON user_fsrs_weights
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS fsrs_weights_insert ON user_fsrs_weights;
CREATE POLICY fsrs_weights_insert ON user_fsrs_weights
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fsrs_weights_update ON user_fsrs_weights;
CREATE POLICY fsrs_weights_update ON user_fsrs_weights
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5) Research-grade psychometrics tables (DIF / unified / HLR)
-- =====================================================

CREATE TABLE IF NOT EXISTS dif_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'question',
  group_variable TEXT NOT NULL,
  focal_group TEXT NOT NULL,
  reference_group TEXT NOT NULL,
  mh_alpha NUMERIC(8,4),
  mh_delta NUMERIC(8,4),
  mh_chi_square NUMERIC(10,4),
  mh_p_value NUMERIC(8,6),
  lord_chi_square NUMERIC(10,4),
  lord_p_value NUMERIC(8,6),
  ets_classification TEXT NOT NULL DEFAULT 'A',
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  direction TEXT,
  sample_size_focal INTEGER NOT NULL DEFAULT 0,
  sample_size_reference INTEGER NOT NULL DEFAULT 0,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dif_item_id ON dif_analysis_results(item_id);
CREATE INDEX IF NOT EXISTS idx_dif_group_variable ON dif_analysis_results(group_variable);
CREATE INDEX IF NOT EXISTS idx_dif_flagged ON dif_analysis_results(flagged) WHERE flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_dif_ets ON dif_analysis_results(ets_classification);

CREATE TABLE IF NOT EXISTS learner_model_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  irt_theta NUMERIC(6,4) DEFAULT 0,
  irt_se NUMERIC(6,4),
  mirt_profile JSONB,
  rt_irt_theta NUMERIC(6,4),
  rt_irt_tau NUMERIC(6,4),
  rt_irt_classification TEXT,
  bkt_mastery JSONB,
  bkt_overall_mastery NUMERIC(5,4),
  hlr_average_retention NUMERIC(5,4),
  hlr_weights JSONB,
  fcr_calibration_score NUMERIC(5,2),
  fcr_overconfidence_index NUMERIC(5,4),
  overall_competency NUMERIC(5,4),
  pass_probability NUMERIC(5,4),
  area_competency JSONB,
  strengths JSONB,
  weaknesses JSONB,
  recommendations JSONB,
  engagement_score NUMERIC(5,4),
  study_streak INTEGER DEFAULT 0,
  weekly_hours NUMERIC(5,2) DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learner_snapshots_user ON learner_model_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_snapshots_time ON learner_model_snapshots(user_id, snapshot_at DESC);

CREATE TABLE IF NOT EXISTS study_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  item_id UUID,
  area TEXT,
  correct BOOLEAN,
  response_time_ms INTEGER,
  confidence NUMERIC(3,2),
  knowledge_component TEXT,
  difficulty NUMERIC(5,3),
  elapsed_days_since_last NUMERIC(8,2),
  review_count INTEGER DEFAULT 0,
  correct_streak INTEGER DEFAULT 0,
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON study_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON study_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_item ON study_activity_log(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON study_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_kc ON study_activity_log(knowledge_component) WHERE knowledge_component IS NOT NULL;

ALTER TABLE dif_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_model_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dif_select_authenticated ON dif_analysis_results;
CREATE POLICY dif_select_authenticated ON dif_analysis_results
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS dif_insert_service ON dif_analysis_results;
CREATE POLICY dif_insert_service ON dif_analysis_results
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS learner_snapshots_select_own ON learner_model_snapshots;
CREATE POLICY learner_snapshots_select_own ON learner_model_snapshots
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS learner_snapshots_insert_own ON learner_model_snapshots;
CREATE POLICY learner_snapshots_insert_own ON learner_model_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS activity_log_select_own ON study_activity_log;
CREATE POLICY activity_log_select_own ON study_activity_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS activity_log_insert_own ON study_activity_log;
CREATE POLICY activity_log_insert_own ON study_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

