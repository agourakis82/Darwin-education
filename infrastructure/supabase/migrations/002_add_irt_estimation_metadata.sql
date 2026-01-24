/**
 * Database Migration: Add IRT Estimation Metadata
 * Adds columns for tracking IRT parameter estimation sources and confidence
 * Enables low-confidence question review queue
 */

-- Add IRT estimation tracking columns to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS institution_tier TEXT CHECK (institution_tier IN ('TIER_1_NATIONAL', 'TIER_2_REGIONAL_STRONG', 'TIER_3_REGIONAL')),
ADD COLUMN IF NOT EXISTS exam_type TEXT CHECK (exam_type IN ('R1', 'R2', 'R3', 'national', 'concurso')),
ADD COLUMN IF NOT EXISTS question_position INTEGER,
ADD COLUMN IF NOT EXISTS total_questions_in_exam INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS option_count INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS irt_estimated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS irt_confidence NUMERIC(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS irt_estimation_method TEXT CHECK (irt_estimation_method IN ('metadata', 'expert', 'empirical')),
ADD COLUMN IF NOT EXISTS irt_last_calibrated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS empirical_biserial NUMERIC(5,3),
ADD COLUMN IF NOT EXISTS needs_recalibration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_manual_area_classification BOOLEAN DEFAULT FALSE;

-- Create index for filtering low-confidence questions
CREATE INDEX IF NOT EXISTS idx_questions_low_confidence
ON questions (irt_confidence)
WHERE irt_confidence < 0.6;

-- Create index for questions needing manual review
CREATE INDEX IF NOT EXISTS idx_questions_needs_review
ON questions (needs_manual_area_classification)
WHERE needs_manual_area_classification = true;

-- Create index on institution tier for analysis
CREATE INDEX IF NOT EXISTS idx_questions_institution_tier
ON questions (institution_tier)
WHERE institution_tier IS NOT NULL;

-- Create index on exam type for analysis
CREATE INDEX IF NOT EXISTS idx_questions_exam_type
ON questions (exam_type)
WHERE exam_type IS NOT NULL;

-- Create view for admin review queue
-- Identifies questions that need manual verification
CREATE OR REPLACE VIEW questions_pending_review AS
SELECT
  q.id,
  q.bank_id,
  q.stem,
  q.area,
  q.irt_confidence,
  q.institution,
  q.exam_type,
  q.year,
  q.needs_manual_area_classification,
  qb.name as bank_name,
  qb.source
FROM questions q
LEFT JOIN question_banks qb ON q.bank_id = qb.id
WHERE q.irt_confidence < 0.6
   OR q.needs_manual_area_classification = true
ORDER BY q.irt_confidence ASC, q.year DESC;

-- Create view for IRT calibration statistics by source
CREATE OR REPLACE VIEW irt_calibration_stats AS
SELECT
  qb.source,
  qb.name,
  COUNT(q.id) as total_questions,
  COUNT(CASE WHEN q.irt_estimated = true THEN 1 END) as estimated_count,
  COUNT(CASE WHEN q.irt_estimation_method = 'empirical' THEN 1 END) as empirical_count,
  ROUND(AVG(q.irt_confidence)::numeric, 2) as avg_confidence,
  COUNT(CASE WHEN q.irt_confidence < 0.6 THEN 1 END) as low_confidence_count,
  COUNT(CASE WHEN q.needs_manual_area_classification = true THEN 1 END) as needs_area_review,
  ROUND(AVG(q.irt_difficulty)::numeric, 2) as avg_difficulty,
  ROUND(AVG(q.irt_discrimination)::numeric, 2) as avg_discrimination,
  MIN(q.irt_last_calibrated_at) as oldest_calibration,
  MAX(q.irt_last_calibrated_at) as newest_calibration
FROM questions q
LEFT JOIN question_banks qb ON q.bank_id = qb.id
GROUP BY qb.source, qb.name
ORDER BY total_questions DESC;

-- Create view for comparison of estimated vs empirical IRT (for bootstrap validation)
-- Used to tune IRT_ESTIMATION_CONFIG coefficients
CREATE OR REPLACE VIEW irt_estimation_validation AS
SELECT
  q.id,
  q.bank_id,
  q.institution,
  q.institution_tier,
  q.exam_type,
  q.question_position,
  q.year,
  q.irt_difficulty as estimated_difficulty,
  q.empirical_biserial,
  q.irt_discrimination as estimated_discrimination,
  q.irt_confidence,
  ABS(q.irt_difficulty)::numeric as abs_estimated_difficulty,
  CASE
    WHEN q.empirical_biserial IS NOT NULL
    THEN ROUND((ABS(q.empirical_biserial) * 3.0)::numeric, 3)
    ELSE NULL
  END as empirical_discrimination_est,
  CASE
    WHEN q.empirical_biserial IS NOT NULL
    THEN ROUND((q.irt_difficulty - ABS(q.empirical_biserial * 0.5))::numeric, 3)
    ELSE NULL
  END as difficulty_error
FROM questions q
WHERE q.irt_estimated = true AND q.irt_estimation_method IN ('empirical', 'metadata')
ORDER BY q.year, q.irt_confidence DESC;

-- Commit timestamp
-- Migration completed at: implementation time
-- All existing questions will have NULL values for new columns
-- New questions loaded via ETL plugins will populate these fields
