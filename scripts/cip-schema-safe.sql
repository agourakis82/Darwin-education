-- ============================================
-- CIP Schema - Safe Migration (Idempotent)
-- ============================================
-- This version can be run multiple times safely

-- Drop existing policies if they exist
DROP POLICY IF EXISTS cip_findings_select ON cip_findings;
DROP POLICY IF EXISTS cip_findings_insert ON cip_findings;
DROP POLICY IF EXISTS cip_diagnoses_select ON cip_diagnoses;
DROP POLICY IF EXISTS cip_diagnosis_findings_select ON cip_diagnosis_findings;
DROP POLICY IF EXISTS cip_puzzles_select ON cip_puzzles;
DROP POLICY IF EXISTS cip_puzzles_insert ON cip_puzzles;
DROP POLICY IF EXISTS cip_puzzle_grid_select ON cip_puzzle_grid;
DROP POLICY IF EXISTS cip_attempts_select ON cip_attempts;
DROP POLICY IF EXISTS cip_attempts_insert ON cip_attempts;
DROP POLICY IF EXISTS cip_attempts_update ON cip_attempts;

-- Create tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS cip_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_pt TEXT NOT NULL,
  text_en TEXT,
  section TEXT NOT NULL CHECK (section IN ('medical_history', 'physical_exam', 'laboratory', 'imaging', 'pathology', 'treatment')),
  icd10_codes TEXT[] DEFAULT '{}',
  atc_codes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cip_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_pt TEXT NOT NULL,
  name_en TEXT,
  icd10_code TEXT NOT NULL,
  icd10_codes_secondary TEXT[] DEFAULT '{}',
  area TEXT NOT NULL CHECK (area IN ('clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva')),
  subspecialty TEXT,
  difficulty_tier INTEGER DEFAULT 3 CHECK (difficulty_tier >= 1 AND difficulty_tier <= 5),
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cip_diagnosis_findings (
  diagnosis_id UUID NOT NULL REFERENCES cip_diagnoses(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES cip_findings(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  is_pathognomonic BOOLEAN DEFAULT FALSE,
  frequency_percentage INTEGER CHECK (frequency_percentage >= 0 AND frequency_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (diagnosis_id, finding_id)
);

CREATE TABLE IF NOT EXISTS cip_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  areas TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil')),
  settings JSONB DEFAULT '{}',
  diagnosis_ids UUID[] NOT NULL,
  options_per_section JSONB NOT NULL DEFAULT '{}',
  time_limit_minutes INTEGER DEFAULT 30,
  irt_difficulty NUMERIC DEFAULT 0,
  irt_discrimination NUMERIC DEFAULT 1.2,
  irt_guessing NUMERIC DEFAULT 0.1,
  type TEXT DEFAULT 'practice' CHECK (type IN ('practice', 'exam', 'custom')),
  is_public BOOLEAN DEFAULT TRUE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cip_puzzle_grid (
  puzzle_id UUID NOT NULL REFERENCES cip_puzzles(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  section TEXT NOT NULL,
  correct_finding_id UUID NOT NULL REFERENCES cip_findings(id),
  irt_difficulty NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (puzzle_id, row_index, section)
);

CREATE TABLE IF NOT EXISTS cip_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_id UUID NOT NULL REFERENCES cip_puzzles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grid_state JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  theta NUMERIC,
  standard_error NUMERIC,
  scaled_score INTEGER,
  passed BOOLEAN,
  correct_count INTEGER,
  total_cells INTEGER,
  total_time_seconds INTEGER,
  section_breakdown JSONB,
  diagnosis_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_cip_findings_section ON cip_findings(section);
CREATE INDEX IF NOT EXISTS idx_cip_findings_icd10 ON cip_findings USING GIN(icd10_codes);
CREATE INDEX IF NOT EXISTS idx_cip_diagnoses_area ON cip_diagnoses(area);
CREATE INDEX IF NOT EXISTS idx_cip_diagnoses_icd10 ON cip_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_cip_diagnosis_findings_diagnosis ON cip_diagnosis_findings(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_cip_diagnosis_findings_finding ON cip_diagnosis_findings(finding_id);
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_difficulty ON cip_puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_cip_puzzles_public ON cip_puzzles(is_public);
CREATE INDEX IF NOT EXISTS idx_cip_puzzle_grid_puzzle ON cip_puzzle_grid(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_cip_attempts_user ON cip_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cip_attempts_puzzle ON cip_attempts(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_cip_attempts_completed ON cip_attempts(completed_at);

-- Enable RLS
ALTER TABLE cip_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_diagnosis_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_puzzle_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE cip_attempts ENABLE ROW LEVEL SECURITY;

-- Recreate policies (fresh)
CREATE POLICY cip_findings_select ON cip_findings FOR SELECT USING (true);
CREATE POLICY cip_findings_insert ON cip_findings FOR INSERT WITH CHECK (true);

CREATE POLICY cip_diagnoses_select ON cip_diagnoses FOR SELECT USING (true);

CREATE POLICY cip_diagnosis_findings_select ON cip_diagnosis_findings FOR SELECT USING (true);

CREATE POLICY cip_puzzles_select ON cip_puzzles FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY cip_puzzles_insert ON cip_puzzles FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY cip_puzzle_grid_select ON cip_puzzle_grid FOR SELECT USING (true);

CREATE POLICY cip_attempts_select ON cip_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cip_attempts_insert ON cip_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cip_attempts_update ON cip_attempts FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- Complete! ✅
-- ============================================
