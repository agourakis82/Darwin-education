-- Minimal achievements table creation
-- Run this first if the full script fails

CREATE TABLE IF NOT EXISTS cip_achievements (
  id TEXT PRIMARY KEY,
  title_pt TEXT NOT NULL,
  title_en TEXT,
  description_pt TEXT NOT NULL,
  description_en TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'first_puzzle', 'perfect_score', 'high_score', 'speed',
    'area_specialist', 'difficulty_master', 'streak', 'puzzle_count'
  )),
  criteria JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_cip_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES cip_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  related_puzzle_id UUID REFERENCES cip_puzzles(id),
  related_attempt_id UUID REFERENCES cip_attempts(id),
  metadata JSONB DEFAULT '{}',
  notified BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE cip_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cip_achievements ENABLE ROW LEVEL SECURITY;

-- Simple policies
DROP POLICY IF EXISTS cip_achievements_select ON cip_achievements;
CREATE POLICY cip_achievements_select ON cip_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS user_cip_achievements_select ON user_cip_achievements;
CREATE POLICY user_cip_achievements_select ON user_cip_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_cip_achievements_insert ON user_cip_achievements;
CREATE POLICY user_cip_achievements_insert ON user_cip_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
