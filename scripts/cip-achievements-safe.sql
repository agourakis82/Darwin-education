-- ============================================
-- CIP Achievements System - Safe Migration (Idempotent)
-- ============================================
-- This version can be run multiple times safely

-- Drop existing policies if they exist
DROP POLICY IF EXISTS cip_achievements_select ON cip_achievements;
DROP POLICY IF EXISTS user_cip_achievements_select ON user_cip_achievements;
DROP POLICY IF EXISTS user_cip_achievements_insert ON user_cip_achievements;
DROP POLICY IF EXISTS user_cip_achievements_update ON user_cip_achievements;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cip_attempts_check_achievements ON cip_attempts;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS trigger_check_cip_achievements();
DROP FUNCTION IF EXISTS check_cip_achievements(UUID, UUID);

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_cip_achievement_progress;

-- Create tables (IF NOT EXISTS)
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

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_cip_achievements_active ON cip_achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_cip_achievements_type ON cip_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_cip_achievements_sort ON cip_achievements(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_cip_achievements_user ON user_cip_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cip_achievements_achievement ON user_cip_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_cip_achievements_unlocked ON user_cip_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_cip_achievements_notified ON user_cip_achievements(notified) WHERE notified = false;

-- Enable RLS
ALTER TABLE cip_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cip_achievements ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY cip_achievements_select ON cip_achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY user_cip_achievements_select ON user_cip_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_cip_achievements_insert ON user_cip_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_cip_achievements_update ON user_cip_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert base achievements (ON CONFLICT DO NOTHING)
INSERT INTO cip_achievements (id, title_pt, description_pt, icon, tier, achievement_type, criteria, xp_reward, sort_order) VALUES
  ('first_puzzle', 'Primeira Tentativa', 'Complete seu primeiro puzzle CIP', '🎯', 'bronze', 'first_puzzle', '{"puzzles_completed": 1}', 50, 1),
  ('perfect_score', 'Perfeição', 'Acerte 100% de um puzzle', '💯', 'gold', 'perfect_score', '{"percentage_correct": 100}', 200, 2),
  ('high_achiever', 'Alto Desempenho', 'Score acima de 800 em qualquer puzzle', '⭐', 'silver', 'high_score', '{"score": 800}', 100, 3),
  ('elite_performer', 'Desempenho Elite', 'Score acima de 900 em qualquer puzzle', '🌟', 'gold', 'high_score', '{"score": 900}', 150, 4),
  ('speed_demon', 'Velocidade Relâmpago', 'Complete um puzzle em menos de 10 minutos', '⚡', 'silver', 'speed', '{"time_seconds": 600}', 75, 5),
  ('lightning_fast', 'Mais Rápido que a Luz', 'Complete um puzzle em menos de 5 minutos', '🚀', 'gold', 'speed', '{"time_seconds": 300}', 150, 6),
  ('clinica_specialist', 'Especialista em Clínica Médica', 'Complete 10 puzzles de Clínica Médica', '🩺', 'silver', 'area_specialist', '{"area": "clinica_medica", "count": 10}', 100, 10),
  ('cirurgia_specialist', 'Especialista em Cirurgia', 'Complete 10 puzzles de Cirurgia', '🔪', 'silver', 'area_specialist', '{"area": "cirurgia", "count": 10}', 100, 11),
  ('pediatria_specialist', 'Especialista em Pediatria', 'Complete 10 puzzles de Pediatria', '👶', 'silver', 'area_specialist', '{"area": "pediatria", "count": 10}', 100, 12),
  ('gineobs_specialist', 'Especialista em GO', 'Complete 10 puzzles de Ginecologia/Obstetrícia', '🤰', 'silver', 'area_specialist', '{"area": "ginecologia_obstetricia", "count": 10}', 100, 13),
  ('saude_coletiva_specialist', 'Especialista em Saúde Coletiva', 'Complete 10 puzzles de Saúde Coletiva', '🏥', 'silver', 'area_specialist', '{"area": "saude_coletiva", "count": 10}', 100, 14),
  ('difficulty_master', 'Mestre das Dificuldades', 'Passe em todos os níveis de dificuldade', '🎓', 'gold', 'difficulty_master', '{"difficulties": ["muito_facil", "facil", "medio", "dificil", "muito_dificil"]}', 250, 20),
  ('hard_mode_hero', 'Herói do Modo Difícil', 'Complete um puzzle Muito Difícil', '🔥', 'silver', 'difficulty_master', '{"difficulty": "muito_dificil"}', 150, 21),
  ('week_streak', 'Semana Consistente', 'Complete puzzles 7 dias seguidos', '📅', 'silver', 'streak', '{"streak_days": 7}', 100, 30),
  ('month_streak', 'Mês de Dedicação', 'Complete puzzles 30 dias seguidos', '🗓️', 'gold', 'streak', '{"streak_days": 30}', 300, 31),
  ('puzzle_10', 'Praticante', 'Complete 10 puzzles', '📚', 'bronze', 'puzzle_count', '{"puzzles_completed": 10}', 75, 40),
  ('puzzle_25', 'Estudante Dedicado', 'Complete 25 puzzles', '📖', 'silver', 'puzzle_count', '{"puzzles_completed": 25}', 150, 41),
  ('puzzle_50', 'Veterano', 'Complete 50 puzzles', '🎖️', 'gold', 'puzzle_count', '{"puzzles_completed": 50}', 300, 42),
  ('puzzle_100', 'Lenda', 'Complete 100 puzzles', '👑', 'platinum', 'puzzle_count', '{"puzzles_completed": 100}', 500, 43)
ON CONFLICT (id) DO NOTHING;

-- Create achievement checking function
CREATE OR REPLACE FUNCTION check_cip_achievements(p_user_id UUID, p_attempt_id UUID)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_title TEXT,
  achievement_icon TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_attempt RECORD;
  v_user_stats RECORD;
  v_achievement RECORD;
  v_already_has BOOLEAN;
BEGIN
  -- Get attempt details
  SELECT
    a.*,
    p.difficulty,
    p.areas
  INTO v_attempt
  FROM cip_attempts a
  JOIN cip_puzzles p ON p.id = a.puzzle_id
  WHERE a.id = p_attempt_id;

  -- Get user stats
  SELECT
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_puzzles,
    MAX(scaled_score) as best_score
  INTO v_user_stats
  FROM cip_attempts
  WHERE user_id = p_user_id;

  -- Check each active achievement
  FOR v_achievement IN
    SELECT * FROM cip_achievements WHERE is_active = true
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM user_cip_achievements
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) INTO v_already_has;

    IF v_already_has THEN
      CONTINUE;
    END IF;

    -- Check criteria based on achievement type
    CASE v_achievement.achievement_type
      WHEN 'first_puzzle' THEN
        IF v_user_stats.completed_puzzles >= (v_achievement.criteria->>'puzzles_completed')::int THEN
          INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
          VALUES (p_user_id, v_achievement.id, p_attempt_id, jsonb_build_object('puzzles_completed', v_user_stats.completed_puzzles))
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.title_pt, v_achievement.icon, true;
        END IF;

      WHEN 'perfect_score' THEN
        IF v_attempt.total_cells > 0 AND v_attempt.correct_count = v_attempt.total_cells THEN
          INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
          VALUES (p_user_id, v_achievement.id, p_attempt_id, jsonb_build_object('score', v_attempt.scaled_score))
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.title_pt, v_achievement.icon, true;
        END IF;

      WHEN 'high_score' THEN
        IF v_attempt.scaled_score >= (v_achievement.criteria->>'score')::int THEN
          INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
          VALUES (p_user_id, v_achievement.id, p_attempt_id, jsonb_build_object('score', v_attempt.scaled_score))
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.title_pt, v_achievement.icon, true;
        END IF;

      WHEN 'speed' THEN
        IF v_attempt.total_time_seconds IS NOT NULL AND v_attempt.total_time_seconds <= (v_achievement.criteria->>'time_seconds')::int THEN
          INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
          VALUES (p_user_id, v_achievement.id, p_attempt_id, jsonb_build_object('time_seconds', v_attempt.total_time_seconds))
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.title_pt, v_achievement.icon, true;
        END IF;

      WHEN 'puzzle_count' THEN
        IF v_user_stats.completed_puzzles >= (v_achievement.criteria->>'puzzles_completed')::int THEN
          INSERT INTO user_cip_achievements (user_id, achievement_id, related_attempt_id, metadata)
          VALUES (p_user_id, v_achievement.id, p_attempt_id, jsonb_build_object('puzzles_completed', v_user_stats.completed_puzzles))
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          RETURN QUERY SELECT v_achievement.id, v_achievement.title_pt, v_achievement.icon, true;
        END IF;

      ELSE
        CONTINUE;
    END CASE;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_check_cip_achievements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
    PERFORM check_cip_achievements(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER cip_attempts_check_achievements
  AFTER UPDATE ON cip_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_cip_achievements();

-- Create helper view
CREATE OR REPLACE VIEW user_cip_achievement_progress AS
SELECT
  p.id as user_id,
  a.id as achievement_id,
  a.title_pt,
  a.description_pt,
  a.icon,
  a.tier,
  a.xp_reward,
  CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_unlocked,
  ua.unlocked_at,
  ua.metadata
FROM profiles p
CROSS JOIN cip_achievements a
LEFT JOIN user_cip_achievements ua ON ua.user_id = p.id AND ua.achievement_id = a.id
WHERE a.is_active = true
ORDER BY a.sort_order;

-- ============================================
-- Complete! ✅
-- ============================================
