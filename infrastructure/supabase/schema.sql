-- Darwin Education Database Schema
-- =================================
-- PostgreSQL / Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- USERS & AUTH
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Learning stats
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'institutional')),
  subscription_expires_at TIMESTAMPTZ,

  -- Preferences
  preferences JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTION BANKS
-- ============================================

CREATE TABLE question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL CHECK (source IN ('official_enamed', 'residencia', 'concurso', 'ai_generated', 'community')),
  year_start INTEGER,
  year_end INTEGER,
  question_count INTEGER DEFAULT 0,
  areas TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTIONS
-- ============================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,

  -- Content
  stem TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {letter, text, feedback}
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 4),
  explanation TEXT NOT NULL,

  -- IRT Parameters
  irt_difficulty NUMERIC(5,3) DEFAULT 0,     -- b parameter
  irt_discrimination NUMERIC(5,3) DEFAULT 1, -- a parameter
  irt_guessing NUMERIC(5,3) DEFAULT 0.25,    -- c parameter
  irt_infit NUMERIC(5,3),
  irt_outfit NUMERIC(5,3),

  -- Ontology
  area TEXT NOT NULL CHECK (area IN ('clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva')),
  subspecialty TEXT,
  topic TEXT,
  icd10_codes TEXT[] DEFAULT '{}',
  atc_codes TEXT[] DEFAULT '{}',

  -- Metadata
  year INTEGER,
  difficulty TEXT CHECK (difficulty IN ('muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil')),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  validated_by TEXT CHECK (validated_by IN ('community', 'expert', 'both')),
  reference_list TEXT[] DEFAULT '{}',

  -- Stats
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for question search
CREATE INDEX idx_questions_bank ON questions(bank_id);
CREATE INDEX idx_questions_area ON questions(area);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_irt_difficulty ON questions(irt_difficulty);
CREATE INDEX idx_questions_stem_trgm ON questions USING gin(stem gin_trgm_ops);

-- ============================================
-- EXAMS
-- ============================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  question_count INTEGER NOT NULL,
  time_limit_minutes INTEGER NOT NULL DEFAULT 300, -- 5 hours for ENAMED
  question_ids UUID[] NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('official_simulation', 'custom', 'practice', 'review')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exams_type ON exams(type);
CREATE INDEX idx_exams_created_by ON exams(created_by);

-- ============================================
-- EXAM ATTEMPTS
-- ============================================

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Answers: question_id -> selected_index (-1 for unanswered)
  answers JSONB NOT NULL DEFAULT '{}',
  marked_for_review UUID[] DEFAULT '{}',
  time_per_question JSONB DEFAULT '{}', -- question_id -> seconds
  total_time_seconds INTEGER,

  -- TRI Score (calculated after completion)
  theta NUMERIC(5,3),
  standard_error NUMERIC(5,3),
  scaled_score INTEGER,
  passed BOOLEAN,
  correct_count INTEGER,
  area_breakdown JSONB,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT unique_active_attempt UNIQUE (exam_id, user_id, completed_at)
);

CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_completed ON exam_attempts(completed_at);

-- ============================================
-- FLASHCARDS
-- ============================================

CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,

  front TEXT NOT NULL,
  back TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,

  area TEXT,
  subspecialty TEXT,
  topic TEXT,
  tags TEXT[] DEFAULT '{}',

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_tags ON flashcards USING gin(tags);

-- SM-2 state for each user-card pair
CREATE TABLE flashcard_sm2_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,

  ease_factor NUMERIC(4,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_review_at TIMESTAMPTZ,

  UNIQUE(user_id, card_id)
);

CREATE INDEX idx_sm2_states_user ON flashcard_sm2_states(user_id);
CREATE INDEX idx_sm2_states_next_review ON flashcard_sm2_states(next_review_at);

-- ============================================
-- STUDY PATHS
-- ============================================

CREATE TABLE study_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  areas TEXT[] NOT NULL,
  estimated_hours NUMERIC(5,1),
  difficulty TEXT CHECK (difficulty IN ('muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil')),
  prerequisites UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID REFERENCES study_paths(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reading', 'video', 'quiz', 'flashcards', 'case_study')),
  content TEXT,
  estimated_minutes INTEGER,
  question_ids UUID[] DEFAULT '{}',
  flashcard_ids UUID[] DEFAULT '{}',
  order_index INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_modules_path ON study_modules(path_id);

-- User progress on study paths
CREATE TABLE user_path_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  path_id UUID REFERENCES study_paths(id) ON DELETE CASCADE,

  completed_modules UUID[] DEFAULT '{}',
  current_module_id UUID REFERENCES study_modules(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, path_id)
);

-- ============================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  category TEXT CHECK (category IN ('learning', 'streak', 'exam', 'social', 'milestone'))
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_question_banks_updated_at
  BEFORE UPDATE ON question_banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update question count in banks
CREATE OR REPLACE FUNCTION update_bank_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE question_banks SET question_count = question_count + 1 WHERE id = NEW.bank_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE question_banks SET question_count = question_count - 1 WHERE id = OLD.bank_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_count
  AFTER INSERT OR DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_bank_question_count();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sm2_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Exam attempts: users can only see their own
CREATE POLICY exam_attempts_select ON exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY exam_attempts_insert ON exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY exam_attempts_update ON exam_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Flashcard decks: public or own
CREATE POLICY flashcard_decks_select ON flashcard_decks
  FOR SELECT USING (is_public OR auth.uid() = user_id);

CREATE POLICY flashcard_decks_insert ON flashcard_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY flashcard_decks_update ON flashcard_decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY flashcard_decks_delete ON flashcard_decks
  FOR DELETE USING (auth.uid() = user_id);

-- SM2 states: users own their states
CREATE POLICY sm2_states_all ON flashcard_sm2_states
  FOR ALL USING (auth.uid() = user_id);

-- Path progress: users own their progress
CREATE POLICY path_progress_all ON user_path_progress
  FOR ALL USING (auth.uid() = user_id);

-- Achievements: users see their own
CREATE POLICY user_achievements_select ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
