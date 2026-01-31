/**
 * Database Migration: ML Feature Store
 * Adds knowledge tracking, predictions, experiments, and feature views.
 */

-- Knowledge state tracking (Bayesian Knowledge Tracing)
CREATE TABLE IF NOT EXISTS knowledge_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastery_probability NUMERIC(4,3) DEFAULT 0.1,
  response_count INTEGER DEFAULT 0,
  last_correct_at TIMESTAMPTZ,
  last_incorrect_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_states_user ON knowledge_states(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_states_topic ON knowledge_states(topic);

-- User-level predictions (pass probability, optimal difficulty, etc.)
CREATE TABLE IF NOT EXISTS user_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  prediction_value NUMERIC(5,3),
  confidence_interval JSONB,
  model_version TEXT,
  features_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_predictions_user ON user_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_type ON user_predictions(prediction_type);

-- Experiment tracking for ML features
CREATE TABLE IF NOT EXISTS ml_feature_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  variant TEXT NOT NULL,
  outcome_metric TEXT,
  outcome_value NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_experiments_user ON ml_feature_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_feature ON ml_feature_experiments(feature);

-- RLS policies
ALTER TABLE knowledge_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_feature_experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_states_all ON knowledge_states;
CREATE POLICY knowledge_states_all ON knowledge_states
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_predictions_all ON user_predictions;
CREATE POLICY user_predictions_all ON user_predictions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ml_feature_experiments_all ON ml_feature_experiments;
CREATE POLICY ml_feature_experiments_all ON ml_feature_experiments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Feature engineering view for pass prediction
CREATE OR REPLACE VIEW ml_pass_prediction_features AS
SELECT
  ea.id AS attempt_id,
  ea.user_id,
  ea.theta,
  ea.standard_error,
  ea.scaled_score,
  (ea.theta - LAG(ea.theta) OVER (PARTITION BY ea.user_id ORDER BY ea.started_at)) AS theta_delta,
  (ea.area_breakdown->'clinica_medica'->>'percentage')::float AS clinica_medica_pct,
  (ea.area_breakdown->'cirurgia'->>'percentage')::float AS cirurgia_pct,
  (ea.area_breakdown->'ginecologia_obstetricia'->>'percentage')::float AS gine_pct,
  (ea.area_breakdown->'pediatria'->>'percentage')::float AS pediatria_pct,
  (ea.area_breakdown->'saude_coletiva'->>'percentage')::float AS saude_pct,
  p.streak_days,
  p.xp,
  ea.passed AS target
FROM exam_attempts ea
JOIN profiles p ON ea.user_id = p.id
WHERE ea.completed_at IS NOT NULL;

-- Feature engineering view for IRT item calibration
CREATE OR REPLACE VIEW ml_irt_item_features AS
SELECT
  q.id AS question_id,
  q.ontology->>'area' AS area,
  q.difficulty,
  q.discrimination,
  q.guessing,
  q.question_bank,
  COUNT(DISTINCT ea.user_id) AS response_count,
  AVG(CASE WHEN (ea.responses->q.id::text->>'correct')::boolean THEN 1.0 ELSE 0.0 END) AS p_correct,
  AVG((ea.responses->q.id::text->>'time_ms')::numeric) AS avg_response_time_ms,
  STDDEV((ea.responses->q.id::text->>'time_ms')::numeric) AS std_response_time_ms
FROM questions q
LEFT JOIN exam_attempts ea ON ea.responses ? q.id::text
WHERE ea.completed_at IS NOT NULL
GROUP BY q.id, q.ontology, q.difficulty, q.discrimination, q.guessing, q.question_bank;

-- Feature engineering view for user engagement
CREATE OR REPLACE VIEW ml_user_engagement_features AS
SELECT
  p.id AS user_id,
  p.subscription_tier,
  p.streak_days,
  p.xp,
  COUNT(DISTINCT ea.id) AS total_exams,
  COUNT(DISTINCT DATE(ea.started_at)) AS active_days,
  AVG(ea.time_taken_seconds) AS avg_exam_duration_sec,
  AVG(ea.scaled_score) AS avg_scaled_score,
  MAX(ea.scaled_score) AS max_scaled_score,
  COUNT(CASE WHEN ea.passed THEN 1 END) AS exams_passed,
  COUNT(DISTINCT fr.id) AS flashcard_reviews,
  AVG(fr.quality) AS avg_flashcard_quality
FROM profiles p
LEFT JOIN exam_attempts ea ON ea.user_id = p.id AND ea.completed_at IS NOT NULL
LEFT JOIN flashcard_reviews fr ON fr.user_id = p.id
GROUP BY p.id, p.subscription_tier, p.streak_days, p.xp;

-- Feature engineering view for flashcard retention
CREATE OR REPLACE VIEW ml_flashcard_retention_features AS
SELECT
  fr.flashcard_id,
  f.topic,
  f.difficulty,
  COUNT(fr.id) AS review_count,
  AVG(fr.quality) AS avg_quality,
  AVG(fr.ease_factor_after) AS final_ease_factor,
  AVG(fr.interval_after) AS avg_interval_days,
  MAX(fr.interval_after) AS max_interval_days,
  COUNT(CASE WHEN fr.quality < 3 THEN 1 END)::float / NULLIF(COUNT(fr.id), 0) AS lapse_rate
FROM flashcard_reviews fr
JOIN flashcards f ON fr.flashcard_id = f.id
GROUP BY fr.flashcard_id, f.topic, f.difficulty;

-- Stored function to get pass prediction features (for RPC call)
CREATE OR REPLACE FUNCTION get_pass_prediction_features()
RETURNS TABLE (
  attempt_id UUID,
  user_id UUID,
  theta NUMERIC,
  standard_error NUMERIC,
  scaled_score INTEGER,
  theta_delta NUMERIC,
  clinica_medica_pct FLOAT,
  cirurgia_pct FLOAT,
  gine_pct FLOAT,
  pediatria_pct FLOAT,
  saude_pct FLOAT,
  streak_days INTEGER,
  xp INTEGER,
  target BOOLEAN
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM ml_pass_prediction_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
