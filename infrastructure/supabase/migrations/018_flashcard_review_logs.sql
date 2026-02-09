-- Migration 018: Flashcard Review Logs for FSRS Optimizer
-- =====================================================
-- The optimizer needs a history of individual review events.
-- Currently only the latest state is upserted — no event log exists.

-- 1. Review event log table
CREATE TABLE IF NOT EXISTS flashcard_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4),
  state TEXT NOT NULL CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  elapsed_days NUMERIC(8, 2) DEFAULT 0,
  stability_after NUMERIC(8, 3),
  difficulty_after NUMERIC(5, 3),
  scheduled_days INTEGER,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimizer queries
CREATE INDEX IF NOT EXISTS idx_review_logs_user
  ON flashcard_review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_time
  ON flashcard_review_logs(card_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_card_time
  ON flashcard_review_logs(user_id, card_id, reviewed_at);

-- 2. Add optimizer result column to user_fsrs_weights (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_fsrs_weights'
  ) THEN
    ALTER TABLE user_fsrs_weights
      ADD COLUMN IF NOT EXISTS optimizer_result JSONB;
  ELSE
    -- Create user_fsrs_weights table if it doesn't exist
    CREATE TABLE user_fsrs_weights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      weights JSONB NOT NULL,
      optimizer_result JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_fsrs_weights_user
      ON user_fsrs_weights(user_id);
  END IF;
END $$;

-- 3. RLS policies for flashcard_review_logs
ALTER TABLE flashcard_review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_logs_select ON flashcard_review_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY review_logs_insert ON flashcard_review_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. RLS policies for user_fsrs_weights (if just created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_fsrs_weights' AND policyname = 'fsrs_weights_select'
  ) THEN
    ALTER TABLE user_fsrs_weights ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY fsrs_weights_select ON user_fsrs_weights FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY fsrs_weights_insert ON user_fsrs_weights FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY fsrs_weights_update ON user_fsrs_weights FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END $$;
