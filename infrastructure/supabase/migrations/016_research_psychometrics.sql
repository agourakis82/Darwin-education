-- =====================================================
-- Migration 016: Research-Grade Psychometrics
-- =====================================================
-- Date: 2026-02-08
-- Description: Tables for research-grade psychometric
--   algorithms (MIRT, RT-IRT, DIF, BKT, HLR, Unified).
--   Three tables:
--   1. dif_analysis_results — cached DIF per item
--   2. learner_model_snapshots — unified profile time series
--   3. study_activity_log — granular activity for HLR features
-- =====================================================

-- =====================================================
-- PART 1: DIF Analysis Results
-- =====================================================

CREATE TABLE IF NOT EXISTS dif_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Item identification
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'question',  -- question | fcr_case

  -- Group variable for DIF comparison
  group_variable TEXT NOT NULL,  -- 'area' | 'institution_tier' | 'gender' | 'region'
  focal_group TEXT NOT NULL,
  reference_group TEXT NOT NULL,

  -- Mantel-Haenszel results
  mh_alpha NUMERIC(8,4),
  mh_delta NUMERIC(8,4),
  mh_chi_square NUMERIC(10,4),
  mh_p_value NUMERIC(8,6),

  -- Lord's Chi-Square (IRT-based)
  lord_chi_square NUMERIC(10,4),
  lord_p_value NUMERIC(8,6),

  -- ETS Classification
  ets_classification TEXT NOT NULL DEFAULT 'A',  -- A | B | C
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  direction TEXT,  -- 'favors_focal' | 'favors_reference' | 'none'

  -- Sample sizes
  sample_size_focal INTEGER NOT NULL DEFAULT 0,
  sample_size_reference INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for DIF queries
CREATE INDEX IF NOT EXISTS idx_dif_item_id ON dif_analysis_results(item_id);
CREATE INDEX IF NOT EXISTS idx_dif_group_variable ON dif_analysis_results(group_variable);
CREATE INDEX IF NOT EXISTS idx_dif_flagged ON dif_analysis_results(flagged) WHERE flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_dif_ets ON dif_analysis_results(ets_classification);

-- =====================================================
-- PART 2: Learner Model Snapshots
-- =====================================================

CREATE TABLE IF NOT EXISTS learner_model_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- IRT (unidimensional)
  irt_theta NUMERIC(6,4) DEFAULT 0,
  irt_se NUMERIC(6,4),

  -- MIRT (5D profile)
  mirt_profile JSONB,  -- { theta: Record<area, number>, ses: Record<area, number>, compositeTheta: number }

  -- Speed-Accuracy (RT-IRT)
  rt_irt_theta NUMERIC(6,4),
  rt_irt_tau NUMERIC(6,4),
  rt_irt_classification TEXT,  -- 'fast_accurate' | 'slow_accurate' | 'fast_inaccurate' | 'slow_inaccurate'

  -- BKT Mastery
  bkt_mastery JSONB,  -- Record<kcId, { mastery: number, classification: string }>
  bkt_overall_mastery NUMERIC(5,4),

  -- HLR Retention
  hlr_average_retention NUMERIC(5,4),
  hlr_weights JSONB,  -- number[] — learned weight vector

  -- FCR Calibration (from existing fcr system)
  fcr_calibration_score NUMERIC(5,2),
  fcr_overconfidence_index NUMERIC(5,4),

  -- Unified Model Outputs
  overall_competency NUMERIC(5,4),
  pass_probability NUMERIC(5,4),
  area_competency JSONB,  -- Record<area, number>
  strengths JSONB,         -- string[]
  weaknesses JSONB,        -- string[]
  recommendations JSONB,   -- StudyRecommendation[]

  -- Engagement metrics
  engagement_score NUMERIC(5,4),
  study_streak INTEGER DEFAULT 0,
  weekly_hours NUMERIC(5,2) DEFAULT 0,

  -- Metadata
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for learner model queries
CREATE INDEX IF NOT EXISTS idx_learner_snapshots_user ON learner_model_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_snapshots_time ON learner_model_snapshots(user_id, snapshot_at DESC);

-- =====================================================
-- PART 3: Study Activity Log
-- =====================================================

CREATE TABLE IF NOT EXISTS study_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity classification
  activity_type TEXT NOT NULL,  -- 'exam_question' | 'flashcard_review' | 'fcr_case' | 'study_session'
  item_id UUID,
  area TEXT,

  -- Response data
  correct BOOLEAN,
  response_time_ms INTEGER,
  confidence NUMERIC(3,2),  -- 0.0 to 1.0

  -- Context
  knowledge_component TEXT,  -- KC identifier for BKT
  difficulty NUMERIC(5,3),   -- Item difficulty at time of response

  -- HLR-specific features
  elapsed_days_since_last NUMERIC(8,2),  -- Days since last review of this item
  review_count INTEGER DEFAULT 0,         -- Total prior reviews of this item
  correct_streak INTEGER DEFAULT 0,       -- Current consecutive correct count

  -- Metadata
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_user ON study_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON study_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_item ON study_activity_log(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON study_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_kc ON study_activity_log(knowledge_component) WHERE knowledge_component IS NOT NULL;

-- =====================================================
-- PART 4: Row Level Security
-- =====================================================

-- DIF results: readable by all authenticated users (research data)
ALTER TABLE dif_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dif_select_authenticated" ON dif_analysis_results
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "dif_insert_service" ON dif_analysis_results
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Learner model snapshots: users read/insert own data
ALTER TABLE learner_model_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learner_snapshots_select_own" ON learner_model_snapshots
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "learner_snapshots_insert_own" ON learner_model_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Study activity log: users read/insert own data
ALTER TABLE study_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own" ON study_activity_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "activity_log_insert_own" ON study_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
