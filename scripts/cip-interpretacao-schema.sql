-- ============================================
-- CIP Image Interpretation Module Schema
-- ============================================
-- Medical image interpretation cases for ENAMED prep.
-- Supports: X-ray, CT, EKG, Ultrasound, MRI
--
-- Safe re-runnable using EXECUTE dynamic SQL in DO blocks.
-- Run in Supabase SQL Editor.
--
-- Tables:
--   cip_image_cases    - Image case definitions
--   cip_image_attempts - User attempts at image interpretation
--
-- Also:
--   - Leaderboard integration (entry_type column)
--   - New achievements for image interpretation
--   - Trigger for case stats updates
--   - Trigger for leaderboard population
-- ============================================


-- ============================================
-- Step 1: Clean up previous objects safely
-- ============================================

DO $$
BEGIN
  -- Drop views that may depend on tables
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_stats CASCADE';
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_weekly CASCADE';
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_global CASCADE';

  -- Drop triggers on cip_image_attempts (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cip_image_attempts') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS cip_image_attempts_update_stats ON cip_image_attempts';
    EXECUTE 'DROP TRIGGER IF EXISTS cip_image_attempts_populate_leaderboard ON cip_image_attempts';
  END IF;

  -- Drop functions
  EXECUTE 'DROP FUNCTION IF EXISTS update_cip_image_case_stats() CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS populate_cip_image_leaderboard() CASCADE';

  -- Drop tables
  EXECUTE 'DROP TABLE IF EXISTS cip_image_attempts CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS cip_image_cases CASCADE';
END $$;


-- ============================================
-- Step 2: Create cip_image_cases table
-- ============================================

CREATE TABLE cip_image_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Display info (bilingual)
  title_pt TEXT NOT NULL,
  title_en TEXT,

  -- Clinical scenario
  clinical_context_pt TEXT NOT NULL,
  clinical_context_en TEXT,

  -- Imaging modality
  modality TEXT NOT NULL CHECK (modality IN ('xray', 'ct', 'ekg', 'ultrasound', 'mri')),

  -- Image content
  image_description_pt TEXT NOT NULL,
  image_description_en TEXT,
  ascii_art TEXT,
  image_url TEXT,

  -- Classification
  area TEXT NOT NULL CHECK (area IN (
    'clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'
  )),
  subspecialty TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN (
    'muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil'
  )),

  -- Correct answers
  correct_findings TEXT[] NOT NULL,
  correct_diagnosis TEXT NOT NULL,
  correct_next_step TEXT NOT NULL,

  -- Multiple-choice options (JSONB arrays of {id, text_pt, is_correct})
  modality_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  findings_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnosis_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_step_options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Explanations
  explanation_pt TEXT,
  explanation_en TEXT,

  -- IRT parameters
  irt_difficulty NUMERIC(5,3) DEFAULT 0,
  irt_discrimination NUMERIC(5,3) DEFAULT 1.2,
  irt_guessing NUMERIC(5,3) DEFAULT 0.25,

  -- Metadata flags
  is_public BOOLEAN DEFAULT TRUE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),

  -- Aggregate stats (updated by trigger)
  times_attempted INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- Step 3: Create cip_image_attempts table
-- ============================================

CREATE TABLE cip_image_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  case_id UUID NOT NULL REFERENCES cip_image_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- User selections per step
  selected_modality TEXT,
  selected_findings TEXT[],
  selected_diagnosis TEXT,
  selected_next_step TEXT,

  -- Correctness per step
  modality_correct BOOLEAN,
  findings_correct_count INTEGER,
  findings_total_count INTEGER,
  diagnosis_correct BOOLEAN,
  next_step_correct BOOLEAN,

  -- Scoring
  total_score NUMERIC(5,2),
  scaled_score INTEGER,
  theta NUMERIC(5,3),
  standard_error NUMERIC(5,3),

  -- Timing
  total_time_seconds INTEGER,
  step_times JSONB DEFAULT '{}'::jsonb,

  -- Progress tracking
  current_step TEXT DEFAULT 'modality' CHECK (current_step IN (
    'modality', 'findings', 'diagnosis', 'next_step', 'completed'
  )),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Only one active (incomplete) attempt per user per case
  CONSTRAINT unique_active_image_attempt UNIQUE (case_id, user_id, completed_at)
);


-- ============================================
-- Step 4: Indexes on cip_image_cases
-- ============================================

CREATE INDEX idx_cip_image_cases_modality ON cip_image_cases(modality);
CREATE INDEX idx_cip_image_cases_difficulty ON cip_image_cases(difficulty);
CREATE INDEX idx_cip_image_cases_area ON cip_image_cases(area);
CREATE INDEX idx_cip_image_cases_public ON cip_image_cases(is_public);
CREATE INDEX idx_cip_image_cases_created ON cip_image_cases(created_at DESC);

-- Indexes on cip_image_attempts
CREATE INDEX idx_cip_image_attempts_case ON cip_image_attempts(case_id);
CREATE INDEX idx_cip_image_attempts_user ON cip_image_attempts(user_id);
CREATE INDEX idx_cip_image_attempts_completed ON cip_image_attempts(completed_at DESC);
CREATE INDEX idx_cip_image_attempts_user_completed ON cip_image_attempts(user_id, completed_at DESC);


-- ============================================
-- Step 5: Row Level Security - cip_image_cases
-- ============================================

ALTER TABLE cip_image_cases ENABLE ROW LEVEL SECURITY;

-- Anyone can read public cases
CREATE POLICY cip_image_cases_select ON cip_image_cases
  FOR SELECT USING (is_public = true);


-- ============================================
-- Step 6: Row Level Security - cip_image_attempts
-- ============================================

ALTER TABLE cip_image_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own attempts
CREATE POLICY cip_image_attempts_select ON cip_image_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY cip_image_attempts_insert ON cip_image_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts
CREATE POLICY cip_image_attempts_update ON cip_image_attempts
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================
-- Step 7: Trigger - Update case stats on attempt
-- ============================================

CREATE OR REPLACE FUNCTION update_cip_image_case_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stats when an attempt is completed
  IF NEW.completed_at IS NOT NULL AND (OLD IS NULL OR OLD.completed_at IS NULL) THEN
    UPDATE cip_image_cases
    SET
      times_attempted = times_attempted + 1,
      times_completed = times_completed + 1,
      avg_score = (
        SELECT AVG(total_score)
        FROM cip_image_attempts
        WHERE case_id = NEW.case_id
          AND completed_at IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.case_id;
  ELSIF TG_OP = 'INSERT' AND NEW.completed_at IS NULL THEN
    -- New attempt started (not yet completed)
    UPDATE cip_image_cases
    SET
      times_attempted = times_attempted + 1,
      updated_at = NOW()
    WHERE id = NEW.case_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cip_image_attempts_update_stats
  AFTER INSERT OR UPDATE ON cip_image_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_cip_image_case_stats();


-- ============================================
-- Step 8: Leaderboard integration
-- ============================================

-- Add entry_type column to distinguish puzzle vs image entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cip_leaderboard_entries' AND column_name = 'entry_type'
  ) THEN
    ALTER TABLE cip_leaderboard_entries ADD COLUMN entry_type TEXT DEFAULT 'puzzle';
  END IF;
END $$;

-- Make puzzle_id nullable so image entries can use case_id reference
DO $$
BEGIN
  -- Check if the NOT NULL constraint exists on puzzle_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cip_leaderboard_entries'
      AND column_name = 'puzzle_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE cip_leaderboard_entries ALTER COLUMN puzzle_id DROP NOT NULL;
  END IF;
END $$;

-- Add case_id column for image interpretation entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cip_leaderboard_entries' AND column_name = 'case_id'
  ) THEN
    ALTER TABLE cip_leaderboard_entries ADD COLUMN case_id UUID REFERENCES cip_image_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index on entry_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lb_entry_type'
  ) THEN
    CREATE INDEX idx_lb_entry_type ON cip_leaderboard_entries(entry_type);
  END IF;
END $$;


-- ============================================
-- Step 9: Recreate leaderboard views with entry_type
-- ============================================

-- Global leaderboard (all types)
CREATE VIEW cip_leaderboard_global AS
SELECT
  l.id,
  l.user_id,
  COALESCE(p.full_name, 'Anonimo') AS display_name,
  p.avatar_url,
  l.scaled_score,
  l.percentage_correct,
  l.total_time_seconds,
  l.difficulty,
  l.entry_type,
  l.completed_at,
  ROW_NUMBER() OVER (ORDER BY l.scaled_score DESC, l.completed_at ASC) as rank,
  COUNT(*) OVER () as total_entries
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
ORDER BY l.scaled_score DESC, l.completed_at ASC
LIMIT 100;

-- Weekly leaderboard
CREATE VIEW cip_leaderboard_weekly AS
SELECT
  l.id,
  l.user_id,
  COALESCE(p.full_name, 'Anonimo') AS display_name,
  p.avatar_url,
  l.scaled_score,
  l.percentage_correct,
  l.total_time_seconds,
  l.difficulty,
  l.entry_type,
  l.completed_at,
  ROW_NUMBER() OVER (ORDER BY l.scaled_score DESC, l.completed_at ASC) as rank,
  COUNT(*) OVER () as total_entries
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
WHERE l.completed_at >= NOW() - INTERVAL '7 days'
ORDER BY l.scaled_score DESC, l.completed_at ASC
LIMIT 50;

-- Stats view (aggregated per user, includes entry_type breakdown)
CREATE VIEW cip_leaderboard_stats AS
SELECT
  l.user_id,
  COALESCE(p.full_name, 'Anonimo') AS display_name,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE l.entry_type = 'puzzle') as total_puzzles,
  COUNT(*) FILTER (WHERE l.entry_type = 'image') as total_images,
  AVG(l.scaled_score)::INTEGER as avg_score,
  MAX(l.scaled_score) as best_score,
  AVG(l.percentage_correct)::NUMERIC(5,2) as avg_percentage
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
GROUP BY l.user_id, p.full_name;


-- ============================================
-- Step 10: Trigger - Populate leaderboard from image attempts
-- ============================================

CREATE OR REPLACE FUNCTION populate_cip_image_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD IS NULL OR OLD.completed_at IS NULL) THEN
    INSERT INTO cip_leaderboard_entries (
      user_id, case_id, attempt_id, scaled_score,
      percentage_correct, total_time_seconds, difficulty, areas,
      entry_type, completed_at
    )
    SELECT
      NEW.user_id,
      NEW.case_id,
      NEW.id,
      COALESCE(NEW.scaled_score, 0),
      COALESCE(NEW.total_score, 0),
      NEW.total_time_seconds,
      COALESCE(c.difficulty, 'facil'),
      ARRAY[c.area],
      'image',
      NEW.completed_at
    FROM cip_image_cases c
    WHERE c.id = NEW.case_id
    ON CONFLICT (attempt_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cip_image_attempts_populate_leaderboard
  AFTER INSERT OR UPDATE ON cip_image_attempts
  FOR EACH ROW
  EXECUTE FUNCTION populate_cip_image_leaderboard();


-- ============================================
-- Step 11: New achievement types for image interpretation
-- ============================================

-- First, extend the achievement_type CHECK constraint to allow new types
-- We need to drop and recreate the constraint safely
DO $$
BEGIN
  -- Drop the existing CHECK constraint on achievement_type if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'cip_achievements'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'achievement_type'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE cip_achievements DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'cip_achievements'
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%achievement_type%'
      LIMIT 1
    );
  END IF;
END $$;

-- Add updated CHECK constraint that includes image interpretation types
DO $$
BEGIN
  ALTER TABLE cip_achievements ADD CONSTRAINT cip_achievements_achievement_type_check
    CHECK (achievement_type IN (
      'first_puzzle',
      'perfect_score',
      'high_score',
      'speed',
      'area_specialist',
      'difficulty_master',
      'streak',
      'puzzle_count',
      'first_image',
      'image_count',
      'image_modality',
      'perfect_interpretation'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- Step 12: Insert image interpretation achievements
-- ============================================

INSERT INTO cip_achievements (id, title_pt, description_pt, icon, tier, achievement_type, criteria, xp_reward, sort_order) VALUES
  -- First image interpretation
  (
    'first_image',
    'Olhar Clinico',
    'Complete sua primeira interpretacao de imagem',
    'eye',
    'bronze',
    'first_image',
    '{"images_completed": 1}',
    50,
    50
  ),

  -- 10 image interpretations
  (
    'image_10',
    'Observador Atento',
    'Complete 10 interpretacoes de imagem',
    'microscope',
    'silver',
    'image_count',
    '{"images_completed": 10}',
    100,
    51
  ),

  -- 25 image interpretations (expert)
  (
    'image_expert',
    'Especialista em Imagens',
    'Complete 25 interpretacoes de imagem',
    'award',
    'gold',
    'image_count',
    '{"images_completed": 25}',
    200,
    52
  ),

  -- EKG specialist
  (
    'ekg_specialist',
    'Especialista em ECG',
    'Complete 10 interpretacoes de eletrocardiograma',
    'activity',
    'silver',
    'image_modality',
    '{"modality": "ekg", "count": 10}',
    150,
    53
  ),

  -- Radiology master (10 X-ray + 10 CT)
  (
    'radiology_master',
    'Mestre da Radiologia',
    'Complete 10 interpretacoes de Raio-X e 10 de Tomografia',
    'radio',
    'gold',
    'image_modality',
    '{"modalities": {"xray": 10, "ct": 10}}',
    200,
    54
  ),

  -- Perfect interpretation (all 4 steps correct)
  (
    'perfect_interpretation',
    'Interpretacao Perfeita',
    'Acerte todas as 4 etapas em uma interpretacao de imagem',
    'check-circle',
    'silver',
    'perfect_interpretation',
    '{"all_steps_correct": true}',
    150,
    55
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- Step 13: Trigger - Check image achievements on attempt completion
-- ============================================

CREATE OR REPLACE FUNCTION check_cip_image_achievements(p_user_id UUID, p_attempt_id UUID)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_title TEXT,
  achievement_icon TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_attempt RECORD;
  v_image_stats RECORD;
  v_modality_counts RECORD;
  v_already_has BOOLEAN;
BEGIN
  -- Get attempt details
  SELECT
    a.*,
    c.modality AS case_modality,
    c.area AS case_area,
    c.difficulty AS case_difficulty
  INTO v_attempt
  FROM cip_image_attempts a
  JOIN cip_image_cases c ON c.id = a.case_id
  WHERE a.id = p_attempt_id;

  -- Get user image stats
  SELECT
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_images,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND modality_correct = true
      AND diagnosis_correct = true AND next_step_correct = true
      AND findings_correct_count = findings_total_count) as perfect_images
  INTO v_image_stats
  FROM cip_image_attempts ia
  JOIN cip_image_cases ic ON ic.id = ia.case_id
  WHERE ia.user_id = p_user_id;

  -- Get modality counts
  SELECT
    COUNT(*) FILTER (WHERE ic.modality = 'ekg' AND ia.completed_at IS NOT NULL) as ekg_count,
    COUNT(*) FILTER (WHERE ic.modality = 'xray' AND ia.completed_at IS NOT NULL) as xray_count,
    COUNT(*) FILTER (WHERE ic.modality = 'ct' AND ia.completed_at IS NOT NULL) as ct_count,
    COUNT(*) FILTER (WHERE ic.modality = 'ultrasound' AND ia.completed_at IS NOT NULL) as ultrasound_count,
    COUNT(*) FILTER (WHERE ic.modality = 'mri' AND ia.completed_at IS NOT NULL) as mri_count
  INTO v_modality_counts
  FROM cip_image_attempts ia
  JOIN cip_image_cases ic ON ic.id = ia.case_id
  WHERE ia.user_id = p_user_id;

  -- Check: first_image
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'first_image'
  ) INTO v_already_has;
  IF NOT v_already_has AND v_image_stats.completed_images >= 1 THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'first_image', p_attempt_id, jsonb_build_object('images_completed', v_image_stats.completed_images))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'first_image'::TEXT, 'Olhar Clinico'::TEXT, 'eye'::TEXT, true;
  END IF;

  -- Check: image_10
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'image_10'
  ) INTO v_already_has;
  IF NOT v_already_has AND v_image_stats.completed_images >= 10 THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'image_10', p_attempt_id, jsonb_build_object('images_completed', v_image_stats.completed_images))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'image_10'::TEXT, 'Observador Atento'::TEXT, 'microscope'::TEXT, true;
  END IF;

  -- Check: image_expert
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'image_expert'
  ) INTO v_already_has;
  IF NOT v_already_has AND v_image_stats.completed_images >= 25 THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'image_expert', p_attempt_id, jsonb_build_object('images_completed', v_image_stats.completed_images))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'image_expert'::TEXT, 'Especialista em Imagens'::TEXT, 'award'::TEXT, true;
  END IF;

  -- Check: ekg_specialist
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'ekg_specialist'
  ) INTO v_already_has;
  IF NOT v_already_has AND v_modality_counts.ekg_count >= 10 THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'ekg_specialist', p_attempt_id, jsonb_build_object('ekg_count', v_modality_counts.ekg_count))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'ekg_specialist'::TEXT, 'Especialista em ECG'::TEXT, 'activity'::TEXT, true;
  END IF;

  -- Check: radiology_master (10 xray + 10 ct)
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'radiology_master'
  ) INTO v_already_has;
  IF NOT v_already_has AND v_modality_counts.xray_count >= 10 AND v_modality_counts.ct_count >= 10 THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'radiology_master', p_attempt_id, jsonb_build_object(
      'xray_count', v_modality_counts.xray_count,
      'ct_count', v_modality_counts.ct_count
    ))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'radiology_master'::TEXT, 'Mestre da Radiologia'::TEXT, 'radio'::TEXT, true;
  END IF;

  -- Check: perfect_interpretation (all 4 steps correct in current attempt)
  SELECT EXISTS(
    SELECT 1 FROM user_cip_achievements WHERE user_id = p_user_id AND achievement_id = 'perfect_interpretation'
  ) INTO v_already_has;
  IF NOT v_already_has
    AND v_attempt.modality_correct = true
    AND v_attempt.diagnosis_correct = true
    AND v_attempt.next_step_correct = true
    AND v_attempt.findings_correct_count IS NOT NULL
    AND v_attempt.findings_total_count IS NOT NULL
    AND v_attempt.findings_correct_count = v_attempt.findings_total_count
  THEN
    INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
    VALUES (p_user_id, 'perfect_interpretation', p_attempt_id, jsonb_build_object(
      'case_id', v_attempt.case_id,
      'modality', v_attempt.case_modality
    ))
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    RETURN QUERY SELECT 'perfect_interpretation'::TEXT, 'Interpretacao Perfeita'::TEXT, 'check-circle'::TEXT, true;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger to call achievement checker on image attempt completion
CREATE OR REPLACE FUNCTION trigger_check_cip_image_achievements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD IS NULL OR OLD.completed_at IS NULL) THEN
    PERFORM check_cip_image_achievements(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS cip_image_attempts_check_achievements ON cip_image_attempts';
END $$;

CREATE TRIGGER cip_image_attempts_check_achievements
  AFTER UPDATE ON cip_image_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_cip_image_achievements();


-- ============================================
-- Step 14: updated_at auto-update trigger for cases
-- ============================================

CREATE OR REPLACE FUNCTION update_cip_image_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS cip_image_cases_updated_at ON cip_image_cases';
END $$;

CREATE TRIGGER cip_image_cases_updated_at
  BEFORE UPDATE ON cip_image_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_cip_image_cases_updated_at();


-- ============================================
-- Complete!
-- ============================================

SELECT 'CIP Image Interpretation schema created!' as status,
  (SELECT COUNT(*) FROM cip_image_cases) as cases,
  (SELECT COUNT(*) FROM cip_image_attempts) as attempts,
  (SELECT COUNT(*) FROM cip_achievements WHERE achievement_type IN (
    'first_image', 'image_count', 'image_modality', 'perfect_interpretation'
  )) as image_achievements;
