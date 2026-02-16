-- =====================================================
-- Beta Web Learning Content Schema (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Ensure flashcards + study tracks work end-to-end in the linked
-- Supabase project (tables + RLS policies + system-deck support).

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) Flashcards (decks, cards, SM-2 state)
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  area TEXT,
  subspecialty TEXT,
  topic TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING gin(tags);

CREATE TABLE IF NOT EXISTS flashcard_sm2_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor NUMERIC(4,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_review_at TIMESTAMPTZ,
  UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_sm2_states_user ON flashcard_sm2_states(user_id);
CREATE INDEX IF NOT EXISTS idx_sm2_states_next_review ON flashcard_sm2_states(next_review_at);

-- Ensure system decks are supported even if older schema had NOT NULL user_id
ALTER TABLE flashcard_decks
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE flashcard_decks
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

ALTER TABLE flashcard_decks
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

ALTER TABLE flashcard_decks
  ADD COLUMN IF NOT EXISTS card_count INTEGER DEFAULT 0;

-- RLS + policies
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sm2_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flashcard_decks_select_visible ON flashcard_decks;
CREATE POLICY flashcard_decks_select_visible
  ON flashcard_decks
  FOR SELECT TO authenticated
  USING (is_public OR is_system OR auth.uid() = user_id);

DROP POLICY IF EXISTS flashcard_decks_insert_own ON flashcard_decks;
CREATE POLICY flashcard_decks_insert_own
  ON flashcard_decks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(is_system, false) = false);

DROP POLICY IF EXISTS flashcard_decks_update_own ON flashcard_decks;
CREATE POLICY flashcard_decks_update_own
  ON flashcard_decks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND COALESCE(is_system, false) = false)
  WITH CHECK (auth.uid() = user_id AND COALESCE(is_system, false) = false);

DROP POLICY IF EXISTS flashcard_decks_delete_own ON flashcard_decks;
CREATE POLICY flashcard_decks_delete_own
  ON flashcard_decks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE(is_system, false) = false);

DROP POLICY IF EXISTS flashcards_select_visible ON flashcards;
CREATE POLICY flashcards_select_visible
  ON flashcards
  FOR SELECT TO authenticated
  USING (
    deck_id IN (
      SELECT d.id
      FROM flashcard_decks d
      WHERE d.is_public OR d.is_system OR d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS flashcards_insert_own_deck ON flashcards;
CREATE POLICY flashcards_insert_own_deck
  ON flashcards
  FOR INSERT TO authenticated
  WITH CHECK (
    deck_id IN (
      SELECT d.id
      FROM flashcard_decks d
      WHERE d.user_id = auth.uid() AND COALESCE(d.is_system, false) = false
    )
  );

DROP POLICY IF EXISTS flashcards_update_own_deck ON flashcards;
CREATE POLICY flashcards_update_own_deck
  ON flashcards
  FOR UPDATE TO authenticated
  USING (
    deck_id IN (
      SELECT d.id
      FROM flashcard_decks d
      WHERE d.user_id = auth.uid() AND COALESCE(d.is_system, false) = false
    )
  )
  WITH CHECK (
    deck_id IN (
      SELECT d.id
      FROM flashcard_decks d
      WHERE d.user_id = auth.uid() AND COALESCE(d.is_system, false) = false
    )
  );

DROP POLICY IF EXISTS flashcards_delete_own_deck ON flashcards;
CREATE POLICY flashcards_delete_own_deck
  ON flashcards
  FOR DELETE TO authenticated
  USING (
    deck_id IN (
      SELECT d.id
      FROM flashcard_decks d
      WHERE d.user_id = auth.uid() AND COALESCE(d.is_system, false) = false
    )
  );

DROP POLICY IF EXISTS flashcard_sm2_states_all ON flashcard_sm2_states;
CREATE POLICY flashcard_sm2_states_all
  ON flashcard_sm2_states
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_system
  ON flashcard_decks(is_system)
  WHERE is_system = true;

-- =====================================================
-- 2) Study tracks (paths, modules, progress)
-- =====================================================

CREATE TABLE IF NOT EXISTS study_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  areas TEXT[] NOT NULL,
  estimated_hours NUMERIC(5,1),
  difficulty TEXT CHECK (difficulty IN ('muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil')),
  prerequisites UUID[] DEFAULT '{}'::uuid[],
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES study_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('reading', 'video', 'quiz', 'flashcards', 'case_study')),
  content TEXT,
  estimated_minutes INTEGER,
  question_ids UUID[] DEFAULT '{}'::uuid[],
  flashcard_ids UUID[] DEFAULT '{}'::uuid[],
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_modules_path ON study_modules(path_id);

CREATE TABLE IF NOT EXISTS user_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES study_paths(id) ON DELETE CASCADE,
  completed_modules UUID[] DEFAULT '{}'::uuid[],
  current_module_id UUID REFERENCES study_modules(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

ALTER TABLE study_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_paths_select_public ON study_paths;
CREATE POLICY study_paths_select_public
  ON study_paths
  FOR SELECT TO authenticated
  USING (COALESCE(is_public, true) = true OR created_by = auth.uid());

DROP POLICY IF EXISTS study_modules_select_public ON study_modules;
CREATE POLICY study_modules_select_public
  ON study_modules
  FOR SELECT TO authenticated
  USING (
    path_id IN (
      SELECT p.id
      FROM study_paths p
      WHERE COALESCE(p.is_public, true) = true OR p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS user_path_progress_select_own ON user_path_progress;
CREATE POLICY user_path_progress_select_own
  ON user_path_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_path_progress_insert_own ON user_path_progress;
CREATE POLICY user_path_progress_insert_own
  ON user_path_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_path_progress_update_own ON user_path_progress;
CREATE POLICY user_path_progress_update_own
  ON user_path_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_path_progress_delete_own ON user_path_progress;
CREATE POLICY user_path_progress_delete_own
  ON user_path_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

