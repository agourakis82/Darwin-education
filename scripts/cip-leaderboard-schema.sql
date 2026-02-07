-- ============================================
-- CIP Leaderboard System - v3
-- ============================================

-- Step 1: Add total_time_seconds to cip_attempts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cip_attempts' AND column_name = 'total_time_seconds'
  ) THEN
    ALTER TABLE cip_attempts ADD COLUMN total_time_seconds INTEGER;
  END IF;
END $$;

-- Step 2: Clean up ALL previous objects safely
DO $$
BEGIN
  -- Drop views (they depend on the table)
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_stats CASCADE';
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_weekly CASCADE';
  EXECUTE 'DROP VIEW IF EXISTS cip_leaderboard_global CASCADE';

  -- Drop trigger
  EXECUTE 'DROP TRIGGER IF EXISTS cip_attempts_populate_leaderboard ON cip_attempts';
  EXECUTE 'DROP FUNCTION IF EXISTS populate_cip_leaderboard() CASCADE';

  -- Drop table with CASCADE (handles policies automatically)
  EXECUTE 'DROP TABLE IF EXISTS cip_leaderboard_entries CASCADE';
END $$;

-- Step 3: Create table
CREATE TABLE cip_leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES cip_puzzles(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES cip_attempts(id) ON DELETE CASCADE,
  scaled_score INTEGER NOT NULL DEFAULT 0,
  percentage_correct NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_time_seconds INTEGER,
  difficulty TEXT NOT NULL DEFAULT 'facil',
  areas TEXT[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_leaderboard_entry UNIQUE (attempt_id)
);

-- Step 4: Indexes
CREATE INDEX idx_lb_user ON cip_leaderboard_entries(user_id);
CREATE INDEX idx_lb_score ON cip_leaderboard_entries(scaled_score DESC);
CREATE INDEX idx_lb_completed ON cip_leaderboard_entries(completed_at DESC);

-- Step 5: RLS
ALTER TABLE cip_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY cip_leaderboard_entries_select ON cip_leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY cip_leaderboard_entries_insert ON cip_leaderboard_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 6: Global leaderboard view
CREATE VIEW cip_leaderboard_global AS
SELECT
  l.id,
  l.user_id,
  COALESCE(p.full_name, 'Anônimo') AS display_name,
  p.avatar_url,
  l.scaled_score,
  l.percentage_correct,
  l.total_time_seconds,
  l.difficulty,
  l.completed_at,
  ROW_NUMBER() OVER (ORDER BY l.scaled_score DESC, l.completed_at ASC) as rank,
  COUNT(*) OVER () as total_entries
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
ORDER BY l.scaled_score DESC, l.completed_at ASC
LIMIT 100;

-- Step 7: Weekly leaderboard view
CREATE VIEW cip_leaderboard_weekly AS
SELECT
  l.id,
  l.user_id,
  COALESCE(p.full_name, 'Anônimo') AS display_name,
  p.avatar_url,
  l.scaled_score,
  l.percentage_correct,
  l.total_time_seconds,
  l.difficulty,
  l.completed_at,
  ROW_NUMBER() OVER (ORDER BY l.scaled_score DESC, l.completed_at ASC) as rank,
  COUNT(*) OVER () as total_entries
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
WHERE l.completed_at >= NOW() - INTERVAL '7 days'
ORDER BY l.scaled_score DESC, l.completed_at ASC
LIMIT 50;

-- Step 8: Stats view
CREATE VIEW cip_leaderboard_stats AS
SELECT
  l.user_id,
  COALESCE(p.full_name, 'Anônimo') AS display_name,
  COUNT(*) as total_puzzles,
  AVG(l.scaled_score)::INTEGER as avg_score,
  MAX(l.scaled_score) as best_score,
  AVG(l.percentage_correct)::NUMERIC(5,2) as avg_percentage
FROM cip_leaderboard_entries l
JOIN profiles p ON p.id = l.user_id
GROUP BY l.user_id, p.full_name;

-- Step 9: Trigger function
CREATE OR REPLACE FUNCTION populate_cip_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD IS NULL OR OLD.completed_at IS NULL) THEN
    INSERT INTO cip_leaderboard_entries (
      user_id, puzzle_id, attempt_id, scaled_score,
      percentage_correct, total_time_seconds, difficulty, areas, completed_at
    )
    SELECT
      NEW.user_id,
      NEW.puzzle_id,
      NEW.id,
      COALESCE(NEW.scaled_score, 0),
      CASE
        WHEN COALESCE(NEW.total_cells, 0) > 0
        THEN (COALESCE(NEW.correct_count, 0)::NUMERIC / NEW.total_cells::NUMERIC * 100)
        ELSE 0
      END,
      NEW.total_time_seconds,
      COALESCE(p.difficulty, 'facil'),
      COALESCE(p.areas, '{}'),
      NEW.completed_at
    FROM cip_puzzles p
    WHERE p.id = NEW.puzzle_id
    ON CONFLICT (attempt_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cip_attempts_populate_leaderboard
  AFTER UPDATE ON cip_attempts
  FOR EACH ROW
  EXECUTE FUNCTION populate_cip_leaderboard();

-- Step 10: Backfill
INSERT INTO cip_leaderboard_entries (
  user_id, puzzle_id, attempt_id, scaled_score,
  percentage_correct, total_time_seconds, difficulty, areas, completed_at
)
SELECT
  a.user_id, a.puzzle_id, a.id,
  COALESCE(a.scaled_score, 0),
  CASE
    WHEN COALESCE(a.total_cells, 0) > 0
    THEN (COALESCE(a.correct_count, 0)::NUMERIC / a.total_cells::NUMERIC * 100)
    ELSE 0
  END,
  a.total_time_seconds,
  COALESCE(p.difficulty, 'facil'),
  COALESCE(p.areas, '{}'),
  a.completed_at
FROM cip_attempts a
JOIN cip_puzzles p ON p.id = a.puzzle_id
WHERE a.completed_at IS NOT NULL
ON CONFLICT (attempt_id) DO NOTHING;

-- Done!
SELECT 'Leaderboard created!' as status,
  (SELECT COUNT(*) FROM cip_leaderboard_entries) as entries;
