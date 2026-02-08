-- =====================================================
-- Migration 011: Fractal Clinical Reasoning (FCR)
-- =====================================================
-- Date: 2026-02-08
-- Description: Tables for the FCR + Confidence
--   Calibration system. Three tables:
--   1. fcr_cases — case definitions with 4-level options
--   2. fcr_attempts — user attempts with per-level
--      selections, confidence, and computed results
--   3. fcr_calibration_history — aggregate calibration
--      tracking per user over time
-- =====================================================

-- =====================================================
-- PART 1: FCR Cases
-- =====================================================

CREATE TABLE IF NOT EXISTS fcr_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pt TEXT NOT NULL,
  clinical_presentation_pt TEXT NOT NULL,
  area TEXT NOT NULL,
  difficulty TEXT NOT NULL,

  -- Per-level options (JSONB arrays of FCROption)
  dados_options JSONB NOT NULL,
  padrao_options JSONB NOT NULL,
  hipotese_options JSONB NOT NULL,
  conduta_options JSONB NOT NULL,

  -- Correct answers
  correct_dados TEXT[] NOT NULL,       -- multiple correct findings
  correct_padrao TEXT NOT NULL,
  correct_hipotese TEXT NOT NULL,
  correct_conduta TEXT NOT NULL,

  -- Teaching
  structured_explanation JSONB,

  -- IRT parameters
  irt_difficulty NUMERIC(5,3) DEFAULT 0,
  irt_discrimination NUMERIC(5,3) DEFAULT 1.2,
  irt_guessing NUMERIC(5,3) DEFAULT 0.25,

  -- Metadata
  is_public BOOLEAN DEFAULT TRUE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  times_attempted INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  avg_score NUMERIC(5,1),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fcr_cases_area ON fcr_cases(area);
CREATE INDEX IF NOT EXISTS idx_fcr_cases_difficulty ON fcr_cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_fcr_cases_public ON fcr_cases(is_public);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_fcr_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fcr_cases_updated_at ON fcr_cases;
CREATE TRIGGER trigger_fcr_cases_updated_at
BEFORE UPDATE ON fcr_cases
FOR EACH ROW
EXECUTE FUNCTION update_fcr_cases_updated_at();

-- =====================================================
-- PART 2: FCR Attempts
-- =====================================================

CREATE TABLE IF NOT EXISTS fcr_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES fcr_cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Per-level selections
  selected_dados TEXT[],
  selected_padrao TEXT,
  selected_hipotese TEXT,
  selected_conduta TEXT,

  -- Per-level confidence (1-5)
  confidence_dados INTEGER,
  confidence_padrao INTEGER,
  confidence_hipotese INTEGER,
  confidence_conduta INTEGER,

  -- Computed results (filled on submit)
  level_results JSONB,                -- FCRLevelResult[]
  theta NUMERIC(5,3),
  scaled_score INTEGER,
  calibration_score NUMERIC(5,1),     -- 0-100
  overconfidence_index NUMERIC(5,3),  -- -1 to +1
  detected_lacunas JSONB,             -- FCRDetectedLacuna[]

  -- Timing
  step_times JSONB,                   -- { dados: ms, padrao: ms, ... }
  total_time_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fcr_attempts_user ON fcr_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_fcr_attempts_case ON fcr_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_fcr_attempts_completed ON fcr_attempts(completed_at);

-- Confidence check constraints
ALTER TABLE fcr_attempts ADD CONSTRAINT check_confidence_dados
  CHECK (confidence_dados IS NULL OR confidence_dados BETWEEN 1 AND 5);
ALTER TABLE fcr_attempts ADD CONSTRAINT check_confidence_padrao
  CHECK (confidence_padrao IS NULL OR confidence_padrao BETWEEN 1 AND 5);
ALTER TABLE fcr_attempts ADD CONSTRAINT check_confidence_hipotese
  CHECK (confidence_hipotese IS NULL OR confidence_hipotese BETWEEN 1 AND 5);
ALTER TABLE fcr_attempts ADD CONSTRAINT check_confidence_conduta
  CHECK (confidence_conduta IS NULL OR confidence_conduta BETWEEN 1 AND 5);

-- =====================================================
-- PART 3: Calibration History
-- =====================================================

CREATE TABLE IF NOT EXISTS fcr_calibration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  calibration_score NUMERIC(5,1),
  overconfidence_index NUMERIC(5,3),
  illusion_count INTEGER DEFAULT 0,   -- high conf + wrong count
  total_levels INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fcr_cal_history_user ON fcr_calibration_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fcr_cal_history_area ON fcr_calibration_history(area);
CREATE INDEX IF NOT EXISTS idx_fcr_cal_history_recorded ON fcr_calibration_history(recorded_at);

-- =====================================================
-- PART 4: RLS Policies
-- =====================================================

-- fcr_cases: public read, admin write
ALTER TABLE fcr_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public FCR cases" ON fcr_cases;
CREATE POLICY "Anyone can view public FCR cases"
  ON fcr_cases FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "Service role can manage FCR cases" ON fcr_cases;
CREATE POLICY "Service role can manage FCR cases"
  ON fcr_cases FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- fcr_attempts: users own data
ALTER TABLE fcr_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own FCR attempts" ON fcr_attempts;
CREATE POLICY "Users can view their own FCR attempts"
  ON fcr_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own FCR attempts" ON fcr_attempts;
CREATE POLICY "Users can insert their own FCR attempts"
  ON fcr_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own FCR attempts" ON fcr_attempts;
CREATE POLICY "Users can update their own FCR attempts"
  ON fcr_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- fcr_calibration_history: users own data
ALTER TABLE fcr_calibration_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calibration history" ON fcr_calibration_history;
CREATE POLICY "Users can view their own calibration history"
  ON fcr_calibration_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own calibration history" ON fcr_calibration_history;
CREATE POLICY "Users can insert their own calibration history"
  ON fcr_calibration_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 5: Analytics Views
-- =====================================================

-- View: FCR performance by area
CREATE OR REPLACE VIEW v_fcr_performance_by_area AS
SELECT
  user_id,
  fc.area,
  COUNT(*) AS attempts,
  AVG(fa.scaled_score) AS avg_score,
  AVG(fa.calibration_score) AS avg_calibration,
  AVG(fa.overconfidence_index) AS avg_overconfidence
FROM fcr_attempts fa
JOIN fcr_cases fc ON fa.case_id = fc.id
WHERE fa.completed_at IS NOT NULL
GROUP BY user_id, fc.area;

-- View: Calibration trend
CREATE OR REPLACE VIEW v_fcr_calibration_trend AS
SELECT
  user_id,
  area,
  calibration_score,
  overconfidence_index,
  illusion_count,
  total_levels,
  recorded_at
FROM fcr_calibration_history
ORDER BY recorded_at DESC;

-- =====================================================
-- PART 6: Table Comments
-- =====================================================

COMMENT ON TABLE fcr_cases IS 'Fractal Clinical Reasoning case definitions with 4-level options and IRT parameters';
COMMENT ON TABLE fcr_attempts IS 'User attempts at FCR cases with per-level selections, confidence ratings, and computed scores';
COMMENT ON TABLE fcr_calibration_history IS 'Aggregate calibration tracking per user per area over time';
