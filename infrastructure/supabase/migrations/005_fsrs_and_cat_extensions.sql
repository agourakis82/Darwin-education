-- =====================================================
-- Migration 005: FSRS-6 and CAT Extensions
-- =====================================================
-- Date: 2026-01-30
-- Description: Add support for FSRS-6 algorithm and CAT
--
-- Changes:
-- 1. Rename flashcard_sm2_states → flashcard_review_states
-- 2. Add FSRS-6 columns to flashcard states
-- 3. Add user_fsrs_weights table for personalized weights
-- 4. Add CAT metadata to exam_attempts
-- 5. Add item exposure tracking
-- 6. Add IRT calibration pipeline tables
-- =====================================================

-- =====================================================
-- PART 1: FSRS-6 Extensions
-- =====================================================

-- Rename table to be algorithm-agnostic
ALTER TABLE IF EXISTS flashcard_sm2_states RENAME TO flashcard_review_states;

-- Add FSRS-6 columns
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS fsrs_difficulty NUMERIC(5,3);
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS fsrs_stability NUMERIC(8,3);
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS fsrs_reps INTEGER DEFAULT 0;
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS fsrs_lapses INTEGER DEFAULT 0;
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS fsrs_state TEXT DEFAULT 'new';
ALTER TABLE flashcard_review_states ADD COLUMN IF NOT EXISTS algorithm TEXT DEFAULT 'sm2';

-- Add check constraint for algorithm
ALTER TABLE flashcard_review_states DROP CONSTRAINT IF EXISTS check_algorithm;
ALTER TABLE flashcard_review_states ADD CONSTRAINT check_algorithm CHECK (algorithm IN ('sm2', 'fsrs'));

-- Add check constraint for fsrs_state
ALTER TABLE flashcard_review_states DROP CONSTRAINT IF EXISTS check_fsrs_state;
ALTER TABLE flashcard_review_states ADD CONSTRAINT check_fsrs_state CHECK (fsrs_state IN ('new', 'learning', 'review', 'relearning'));

-- User-level FSRS weights (personalized)
CREATE TABLE IF NOT EXISTS user_fsrs_weights (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  weights JSONB NOT NULL,
  training_reviews INTEGER DEFAULT 0,
  last_optimized_at TIMESTAMPTZ,
  log_loss NUMERIC(6,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_fsrs_weights_user_id ON user_fsrs_weights(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_fsrs_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_fsrs_weights_updated_at ON user_fsrs_weights;
CREATE TRIGGER trigger_user_fsrs_weights_updated_at
BEFORE UPDATE ON user_fsrs_weights
FOR EACH ROW
EXECUTE FUNCTION update_user_fsrs_weights_updated_at();

-- =====================================================
-- PART 2: CAT Extensions
-- =====================================================

-- Add CAT-specific columns to exam_attempts
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS is_adaptive BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS stopping_reason TEXT;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS theta_trajectory JSONB;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS items_administered UUID[];

-- Add check constraint for stopping_reason
ALTER TABLE exam_attempts DROP CONSTRAINT IF EXISTS check_stopping_reason;
ALTER TABLE exam_attempts ADD CONSTRAINT check_stopping_reason
  CHECK (stopping_reason IS NULL OR stopping_reason IN ('se_threshold', 'max_items', 'min_items'));

-- Item exposure tracking
CREATE TABLE IF NOT EXISTS item_exposure_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  administered_at TIMESTAMPTZ DEFAULT NOW(),
  user_theta NUMERIC(5,3),
  exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE SET NULL
);

-- Indexes for exposure tracking
CREATE INDEX IF NOT EXISTS idx_item_exposure_question ON item_exposure_log(question_id);
CREATE INDEX IF NOT EXISTS idx_item_exposure_administered ON item_exposure_log(administered_at);

-- View: Current exposure rates (for last 1000 sessions)
CREATE OR REPLACE VIEW v_item_exposure_rates AS
SELECT
  question_id,
  COUNT(*) AS administrations,
  (SELECT COUNT(DISTINCT exam_attempt_id) FROM item_exposure_log) AS total_sessions,
  CASE
    WHEN (SELECT COUNT(DISTINCT exam_attempt_id) FROM item_exposure_log) > 0
    THEN COUNT(*)::NUMERIC / (SELECT COUNT(DISTINCT exam_attempt_id) FROM item_exposure_log)
    ELSE 0
  END AS exposure_rate
FROM item_exposure_log
WHERE exam_attempt_id IN (
  SELECT id FROM exam_attempts ORDER BY started_at DESC LIMIT 1000
)
GROUP BY question_id;

-- =====================================================
-- PART 3: IRT Calibration Pipeline
-- =====================================================

-- Store raw responses for calibration
CREATE TABLE IF NOT EXISTS irt_response_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  user_theta NUMERIC(5,3),
  response_time_ms INTEGER,
  exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_irt_response_log_question ON irt_response_log(question_id);
CREATE INDEX IF NOT EXISTS idx_irt_response_log_user ON irt_response_log(user_id);
CREATE INDEX IF NOT EXISTS idx_irt_response_log_created ON irt_response_log(created_at);

-- IRT calibration batches
CREATE TABLE IF NOT EXISTS irt_calibration_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  responses_count INTEGER NOT NULL,
  questions_calibrated INTEGER NOT NULL,
  model_type TEXT DEFAULT '3PL',
  estimation_method TEXT DEFAULT 'marginal_ml',
  convergence_criterion NUMERIC(8,6),
  iterations INTEGER,
  log_likelihood NUMERIC,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add check constraints
ALTER TABLE irt_calibration_batches DROP CONSTRAINT IF EXISTS check_model_type;
ALTER TABLE irt_calibration_batches ADD CONSTRAINT check_model_type
  CHECK (model_type IN ('1PL', '2PL', '3PL', '4PL'));

ALTER TABLE irt_calibration_batches DROP CONSTRAINT IF EXISTS check_estimation_method;
ALTER TABLE irt_calibration_batches ADD CONSTRAINT check_estimation_method
  CHECK (estimation_method IN ('marginal_ml', 'joint_ml', 'bayesian', 'warm_start'));

-- Track parameter updates
CREATE TABLE IF NOT EXISTS irt_parameter_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  calibration_batch_id UUID REFERENCES irt_calibration_batches(id) ON DELETE CASCADE,

  -- New parameters
  difficulty NUMERIC(5,3),
  discrimination NUMERIC(5,3),
  guessing NUMERIC(5,3),
  infit NUMERIC(5,3),
  outfit NUMERIC(5,3),

  -- Change from previous
  difficulty_delta NUMERIC(5,3),
  discrimination_delta NUMERIC(5,3),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_irt_param_history_question ON irt_parameter_history(question_id);
CREATE INDEX IF NOT EXISTS idx_irt_param_history_batch ON irt_parameter_history(calibration_batch_id);

-- Trigger to update questions table with new IRT parameters
CREATE OR REPLACE FUNCTION update_question_irt_params()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET
    irt_difficulty = NEW.difficulty,
    irt_discrimination = NEW.discrimination,
    irt_guessing = NEW.guessing,
    irt_infit = NEW.infit,
    irt_outfit = NEW.outfit,
    updated_at = NOW()
  WHERE id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_irt_params ON irt_parameter_history;
CREATE TRIGGER trigger_update_question_irt_params
AFTER INSERT ON irt_parameter_history
FOR EACH ROW
EXECUTE FUNCTION update_question_irt_params();

-- =====================================================
-- PART 4: Analytics Views
-- =====================================================

-- View: FSRS vs SM-2 performance comparison
CREATE OR REPLACE VIEW v_algorithm_performance AS
SELECT
  algorithm,
  COUNT(*) AS total_cards,
  AVG(interval) AS avg_interval,
  AVG(CASE WHEN algorithm = 'sm2' THEN ease_factor ELSE NULL END) AS avg_ease_factor_sm2,
  AVG(CASE WHEN algorithm = 'fsrs' THEN fsrs_stability ELSE NULL END) AS avg_stability_fsrs,
  AVG(CASE WHEN algorithm = 'fsrs' THEN fsrs_difficulty ELSE NULL END) AS avg_difficulty_fsrs
FROM flashcard_review_states
GROUP BY algorithm;

-- View: CAT session summary
CREATE OR REPLACE VIEW v_cat_session_summary AS
SELECT
  id,
  user_id,
  is_adaptive,
  COALESCE(array_length(items_administered, 1), 0) AS items_administered_count,
  theta,
  standard_error,
  scaled_score,
  stopping_reason,
  completed_at
FROM exam_attempts
WHERE is_adaptive = TRUE AND completed_at IS NOT NULL;

-- View: Item statistics for calibration
CREATE OR REPLACE VIEW v_item_statistics AS
SELECT
  q.id,
  q.irt_difficulty,
  q.irt_discrimination,
  q.irt_guessing,
  COUNT(irl.id) AS response_count,
  AVG(CASE WHEN irl.correct THEN 1.0 ELSE 0.0 END) AS p_correct,
  AVG(irl.user_theta) AS avg_user_theta,
  STDDEV(irl.user_theta) AS stddev_user_theta
FROM questions q
LEFT JOIN irt_response_log irl ON q.id = irl.question_id
GROUP BY q.id, q.irt_difficulty, q.irt_discrimination, q.irt_guessing;

-- =====================================================
-- PART 5: RLS Policies (Row Level Security)
-- =====================================================

-- user_fsrs_weights policies
ALTER TABLE user_fsrs_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own FSRS weights" ON user_fsrs_weights;
CREATE POLICY "Users can view their own FSRS weights"
  ON user_fsrs_weights FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own FSRS weights" ON user_fsrs_weights;
CREATE POLICY "Users can update their own FSRS weights"
  ON user_fsrs_weights FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own FSRS weights" ON user_fsrs_weights;
CREATE POLICY "Users can insert their own FSRS weights"
  ON user_fsrs_weights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- item_exposure_log policies (admin-only for now)
ALTER TABLE item_exposure_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access exposure logs" ON item_exposure_log;
CREATE POLICY "Only admins can access exposure logs"
  ON item_exposure_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- irt_response_log policies
ALTER TABLE irt_response_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own response logs" ON irt_response_log;
CREATE POLICY "Users can view their own response logs"
  ON irt_response_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert response logs" ON irt_response_log;
CREATE POLICY "System can insert response logs"
  ON irt_response_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- PART 6: Helper Functions
-- =====================================================

-- Function: Migrate SM-2 card to FSRS
CREATE OR REPLACE FUNCTION migrate_card_to_fsrs(p_card_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ease_factor NUMERIC;
  v_interval INTEGER;
  v_repetitions INTEGER;
  v_difficulty NUMERIC;
  v_stability NUMERIC;
BEGIN
  -- Get current SM-2 state
  SELECT ease_factor, interval, repetitions
  INTO v_ease_factor, v_interval, v_repetitions
  FROM flashcard_review_states
  WHERE id = p_card_id;

  -- Calculate FSRS parameters
  -- Difficulty: inverted ease factor (SM-2 EF 1.3-3.0 → FSRS D 1-10)
  v_difficulty := GREATEST(1, LEAST(10, 11 - (v_ease_factor * 4)));

  -- Stability: from current interval
  v_stability := GREATEST(0.1, v_interval);

  -- Update to FSRS
  UPDATE flashcard_review_states
  SET
    algorithm = 'fsrs',
    fsrs_difficulty = v_difficulty,
    fsrs_stability = v_stability,
    fsrs_reps = v_repetitions,
    fsrs_lapses = 0,
    fsrs_state = CASE
      WHEN v_repetitions = 0 THEN 'new'
      WHEN v_interval < 21 THEN 'learning'
      ELSE 'review'
    END
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Bulk migrate user's cards to FSRS
CREATE OR REPLACE FUNCTION migrate_user_cards_to_fsrs(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  -- Migrate all SM-2 cards for user
  WITH migrated AS (
    SELECT id FROM flashcard_review_states
    WHERE user_id = p_user_id AND algorithm = 'sm2'
  )
  SELECT COUNT(*) INTO v_migrated_count FROM migrated;

  -- Perform migration
  PERFORM migrate_card_to_fsrs(id)
  FROM flashcard_review_states
  WHERE user_id = p_user_id AND algorithm = 'sm2';

  RETURN v_migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 7: Seed Data (Optional)
-- =====================================================

-- Insert default FSRS weights for all existing users
INSERT INTO user_fsrs_weights (user_id, weights)
SELECT
  id,
  '[0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0, 1.0]'::jsonb
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON TABLE flashcard_review_states IS 'Flashcard review states supporting both SM-2 and FSRS-6 algorithms';
COMMENT ON TABLE user_fsrs_weights IS 'User-specific FSRS-6 parameter weights (21 parameters)';
COMMENT ON TABLE item_exposure_log IS 'Tracks item exposure for CAT sessions';
COMMENT ON TABLE irt_response_log IS 'Raw response data for IRT calibration';
COMMENT ON TABLE irt_calibration_batches IS 'Batch calibration runs';
COMMENT ON TABLE irt_parameter_history IS 'Historical IRT parameter updates';
