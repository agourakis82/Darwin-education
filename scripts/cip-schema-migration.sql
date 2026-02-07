-- ============================================
-- CIP (Comprehensive Integrative Puzzle) Schema
-- ============================================
--
-- Run this in Supabase SQL Editor to create the CIP tables
--
-- Tables:
-- - cip_findings: Clinical findings (building blocks)
-- - cip_diagnoses: Diagnoses with ICD-10 codes
-- - cip_diagnosis_findings: Junction table
-- - cip_puzzles: Generated puzzles
-- - cip_puzzle_grid: Correct answers per cell
-- - cip_attempts: User attempts
-- ============================================

-- ============================================
-- CIP Findings Table
-- ============================================

CREATE TABLE IF NOT EXISTS cip_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content (multilingual)
  text_pt TEXT NOT NULL,
  text_en TEXT,

  -- Classification
  section TEXT NOT NULL CHECK (section IN (
    'medical_history',
    'physical_exam',
    'laboratory',
    'imaging',
    'pathology',
    'treatment'
  )),

  -- Medical ontology links
  icd10_codes TEXT[] DEFAULT '{}',
  atc_codes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for findings
CREATE INDEX IF NOT EXISTS idx_cip_findings_section ON cip_findings(section);
CREATE INDEX IF NOT EXISTS idx_cip_findings_icd10 ON cip_findings USING gin(icd10_codes);
CREATE INDEX IF NOT EXISTS idx_cip_findings_atc ON cip_findings USING gin(atc_codes);
CREATE INDEX IF NOT EXISTS idx_cip_findings_tags ON cip_findings USING gin(tags);

-- ============================================
-- CIP Diagnoses Table
-- ============================================

CREATE TABLE IF NOT EXISTS cip_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content (multilingual)
  name_pt TEXT NOT NULL,
  name_en TEXT,

  -- Medical classification
  icd10_code TEXT NOT NULL,
  icd10_codes_secondary TEXT[] DEFAULT '{}',

  -- ENAMED classification
  area TEXT NOT NULL CHECK (area IN (
    'clinica_medica',
    'cirurgia',
    'ginecologia_obstetricia',
    'pediatria',
    'saude_coletiva'
  )),
  subspecialty TEXT,

  -- Difficulty tier (1=very common/easy, 5=rare/hard)
  difficulty_tier INTEGER DEFAULT 3 CHECK (difficulty_tier >= 1 AND difficulty_tier <= 5),

  -- Keywords for similarity
  keywords TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for diagnoses
CREATE INDEX IF NOT EXISTS idx_cip_diagnoses_area ON cip_diagnoses(area);
CREATE INDEX IF NOT EXISTS idx_cip_diagnoses_icd10 ON cip_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_cip_diagnoses_active ON cip_diagnoses(is_active);

-- ============================================
-- Diagnosis-Finding Junction Table
-- ============================================

CREATE TABLE IF NOT EXISTS cip_diagnosis_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnosis_id UUID NOT NULL REFERENCES cip_diagnoses(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES cip_findings(id) ON DELETE CASCADE,

  -- Section this finding applies to for this diagnosis
  section TEXT NOT NULL CHECK (section IN (
    'medical_history',
    'physical_exam',
    'laboratory',
    'imaging',
    'pathology',
    'treatment'
  )),

  -- Priority within section (lower = more canonical)
  priority INTEGER DEFAULT 0,

  -- Is this the primary finding for this section?
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_diagnosis_finding UNIQUE (diagnosis_id, finding_id)
);

-- Indexes for junction table
CREATE INDEX IF NOT EXISTS idx_cip_diagnosis_findings_diagnosis ON cip_diagnosis_findings(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_cip_diagnosis_findings_finding ON cip_diagnosis_findings(finding_id);
CREATE INDEX IF NOT EXISTS idx_cip_diagnosis_findings_section ON cip_diagnosis_findings(section);

-- ============================================
-- CIP Puzzles Table
-- ============================================

CREATE TABLE IF NOT EXISTS cip_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Difficulty
  difficulty TEXT NOT NULL CHECK (difficulty IN (
    'muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil'
  )),

  -- Settings (JSON format)
  settings JSONB NOT NULL DEFAULT '{
    "diagnosisCount": 5,
    "sections": ["medical_history", "physical_exam", "laboratory", "treatment"],
    "distractorCount": 3,
    "allowReuse": false
  }',

  -- The diagnoses in order (array of UUIDs)
  diagnosis_ids UUID[] NOT NULL,

  -- Areas covered
  areas TEXT[] NOT NULL,

  -- Options per section (JSON: { section: [finding_ids] })
  options_per_section JSONB NOT NULL,

  -- IRT parameters (computed)
  irt_difficulty NUMERIC(5,3) DEFAULT 0,
  irt_discrimination NUMERIC(5,3) DEFAULT 1.2,
  irt_guessing NUMERIC(5,3) DEFAULT 0.1,

  -- Time limit
  time_limit_minutes INTEGER DEFAULT 30,

  -- Type and metadata
  type TEXT DEFAULT 'practice' CHECK (type IN ('practice', 'exam', 'custom')),
  is_public BOOLEAN DEFAULT TRUE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),

  -- Creator
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Stats
  times_attempted INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for puzzles
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_difficulty ON cip_puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_areas ON cip_puzzles USING gin(areas);
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_type ON cip_puzzles(type);
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_public ON cip_puzzles(is_public);

-- ============================================
-- CIP Puzzle Grid (Correct Answers)
-- ============================================

CREATE TABLE IF NOT EXISTS cip_puzzle_grid (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_id UUID NOT NULL REFERENCES cip_puzzles(id) ON DELETE CASCADE,

  -- Position in grid
  row_index INTEGER NOT NULL,
  section TEXT NOT NULL CHECK (section IN (
    'medical_history',
    'physical_exam',
    'laboratory',
    'imaging',
    'pathology',
    'treatment'
  )),

  -- Correct answer
  correct_finding_id UUID NOT NULL REFERENCES cip_findings(id),

  -- Optional per-cell IRT
  irt_difficulty NUMERIC(5,3),

  CONSTRAINT unique_puzzle_cell UNIQUE (puzzle_id, row_index, section)
);

-- Indexes for puzzle grid
CREATE INDEX IF NOT EXISTS idx_cip_puzzle_grid_puzzle ON cip_puzzle_grid(puzzle_id);

-- ============================================
-- CIP Attempts Table
-- ============================================

CREATE TABLE IF NOT EXISTS cip_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_id UUID NOT NULL REFERENCES cip_puzzles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Current state (JSON: { "row_section": finding_id })
  grid_state JSONB NOT NULL DEFAULT '{}',

  -- Time tracking (JSON: { "row_section": seconds })
  time_per_cell JSONB DEFAULT '{}',
  total_time_seconds INTEGER,

  -- Scoring (calculated after completion)
  theta NUMERIC(5,3),
  standard_error NUMERIC(5,3),
  scaled_score INTEGER,
  passed BOOLEAN,
  correct_count INTEGER,
  total_cells INTEGER,

  -- Breakdowns (JSON)
  section_breakdown JSONB,
  diagnosis_breakdown JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Prevent duplicate active attempts
  CONSTRAINT unique_active_cip_attempt UNIQUE (puzzle_id, user_id, completed_at)
);

-- Indexes for attempts
CREATE INDEX IF NOT EXISTS idx_cip_attempts_user ON cip_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cip_attempts_puzzle ON cip_attempts(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_cip_attempts_completed ON cip_attempts(completed_at);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE cip_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_diagnosis_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_puzzle_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_attempts ENABLE ROW LEVEL SECURITY;

-- Public read for findings and diagnoses (reference data)
CREATE POLICY cip_findings_select ON cip_findings
  FOR SELECT USING (true);

CREATE POLICY cip_diagnoses_select ON cip_diagnoses
  FOR SELECT USING (is_active = true);

CREATE POLICY cip_diagnosis_findings_select ON cip_diagnosis_findings
  FOR SELECT USING (true);

-- Public read for public puzzles
CREATE POLICY cip_puzzles_select ON cip_puzzles
  FOR SELECT USING (is_public = true);

CREATE POLICY cip_puzzle_grid_select ON cip_puzzle_grid
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cip_puzzles
      WHERE id = cip_puzzle_grid.puzzle_id
      AND is_public = true
    )
  );

-- User-owned attempts (read/insert/update)
CREATE POLICY cip_attempts_select ON cip_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cip_attempts_insert ON cip_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cip_attempts_update ON cip_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Triggers for Updated Timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables with updated_at
CREATE TRIGGER cip_findings_updated_at
  BEFORE UPDATE ON cip_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_cip_updated_at();

CREATE TRIGGER cip_diagnoses_updated_at
  BEFORE UPDATE ON cip_diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION update_cip_updated_at();

-- ============================================
-- Trigger to Update Puzzle Stats
-- ============================================

CREATE OR REPLACE FUNCTION update_cip_puzzle_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE cip_puzzles
    SET
      times_completed = times_completed + 1,
      avg_score = (
        SELECT AVG(scaled_score)::NUMERIC(5,2)
        FROM cip_attempts
        WHERE puzzle_id = NEW.puzzle_id
        AND completed_at IS NOT NULL
      )
    WHERE id = NEW.puzzle_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE cip_puzzles
    SET times_attempted = times_attempted + 1
    WHERE id = NEW.puzzle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cip_attempts_stats
  AFTER INSERT OR UPDATE ON cip_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_cip_puzzle_stats();
