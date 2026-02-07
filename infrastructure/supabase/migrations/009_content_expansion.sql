-- ============================================================
-- MIGRATION 009: Content Expansion Infrastructure
-- System user for platform-owned content + flashcard schema updates
-- ============================================================

-- 1. System deck flag for flashcards
ALTER TABLE flashcard_decks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- 2. RLS policies for system content
-- Allow anyone authenticated to read system decks
CREATE POLICY "Anyone can read system decks"
  ON flashcard_decks FOR SELECT
  USING (is_system = true);

-- Allow anyone authenticated to read flashcards in system decks
CREATE POLICY "Anyone can read system flashcards"
  ON flashcards FOR SELECT
  USING (deck_id IN (SELECT id FROM flashcard_decks WHERE is_system = true));

-- 3. Index for efficient system deck queries
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_system ON flashcard_decks(is_system) WHERE is_system = true;
