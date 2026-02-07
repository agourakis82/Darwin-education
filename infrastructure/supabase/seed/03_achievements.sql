-- Darwin Education - Achievements Seed Data
-- ==========================================

-- Learning Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_question', 'Primeira Questão', 'Responda sua primeira questão', '🎯', 10, 'learning'),
  ('first_exam', 'Primeiro Simulado', 'Complete seu primeiro simulado', '📝', 50, 'exam'),
  ('first_flashcard', 'Primeira Revisão', 'Revise seu primeiro flashcard', '🗂️', 10, 'learning'),
  ('first_deck', 'Criador de Baralhos', 'Crie seu primeiro deck de flashcards', '✨', 25, 'learning'),
  ('first_path', 'Desbravador', 'Inicie sua primeira trilha de estudos', '🗺️', 25, 'learning')
ON CONFLICT (id) DO NOTHING;

-- Streak Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('streak_3', 'Consistente', 'Mantenha uma sequência de 3 dias', '🔥', 30, 'streak'),
  ('streak_7', 'Dedicado', 'Mantenha uma sequência de 7 dias', '🔥', 75, 'streak'),
  ('streak_14', 'Determinado', 'Mantenha uma sequência de 14 dias', '🔥', 150, 'streak'),
  ('streak_30', 'Incansável', 'Mantenha uma sequência de 30 dias', '🔥', 300, 'streak'),
  ('streak_60', 'Imparável', 'Mantenha uma sequência de 60 dias', '🔥', 600, 'streak'),
  ('streak_100', 'Lendário', 'Mantenha uma sequência de 100 dias', '🏆', 1000, 'streak')
ON CONFLICT (id) DO NOTHING;

-- Exam Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('pass_first', 'Aprovado!', 'Seja aprovado em seu primeiro simulado', '✅', 100, 'exam'),
  ('score_700', 'Excelência', 'Alcance pontuação acima de 700', '⭐', 150, 'exam'),
  ('score_800', 'Brilhante', 'Alcance pontuação acima de 800', '🌟', 250, 'exam'),
  ('score_900', 'Extraordinário', 'Alcance pontuação acima de 900', '💫', 500, 'exam'),
  ('perfect_area', 'Especialista', 'Acerte todas as questões de uma área', '🎖️', 200, 'exam'),
  ('exams_5', 'Persistente', 'Complete 5 simulados', '📚', 100, 'exam'),
  ('exams_10', 'Veterano', 'Complete 10 simulados', '📚', 200, 'exam'),
  ('exams_25', 'Experiente', 'Complete 25 simulados', '📚', 500, 'exam'),
  ('exams_50', 'Mestre', 'Complete 50 simulados', '👑', 1000, 'exam')
ON CONFLICT (id) DO NOTHING;

-- Flashcard Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('cards_100', 'Colecionador', 'Revise 100 flashcards', '🗂️', 50, 'learning'),
  ('cards_500', 'Estudioso', 'Revise 500 flashcards', '🗂️', 150, 'learning'),
  ('cards_1000', 'Enciclopédia', 'Revise 1000 flashcards', '🗂️', 300, 'learning'),
  ('cards_5000', 'Memória de Elefante', 'Revise 5000 flashcards', '🐘', 750, 'learning'),
  ('mature_10', 'Memorizado', 'Tenha 10 cards maduros', '🧠', 50, 'learning'),
  ('mature_50', 'Boa Memória', 'Tenha 50 cards maduros', '🧠', 150, 'learning'),
  ('mature_100', 'Retenção Total', 'Tenha 100 cards maduros', '🧠', 300, 'learning')
ON CONFLICT (id) DO NOTHING;

-- Milestone Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('questions_100', 'Centenário', 'Responda 100 questões', '💯', 75, 'milestone'),
  ('questions_500', 'Quinhentos', 'Responda 500 questões', '🎯', 200, 'milestone'),
  ('questions_1000', 'Milhar', 'Responda 1000 questões', '🎯', 400, 'milestone'),
  ('questions_5000', 'Veterano de Guerra', 'Responda 5000 questões', '⚔️', 1000, 'milestone'),
  ('study_hours_10', 'Dedicação', '10 horas de estudo', '⏱️', 50, 'milestone'),
  ('study_hours_50', 'Compromisso', '50 horas de estudo', '⏱️', 200, 'milestone'),
  ('study_hours_100', 'Determinação', '100 horas de estudo', '⏱️', 400, 'milestone'),
  ('study_hours_500', 'Devoção', '500 horas de estudo', '⏱️', 1000, 'milestone'),
  ('level_5', 'Iniciante', 'Alcance o nível 5', '📈', 50, 'milestone'),
  ('level_10', 'Intermediário', 'Alcance o nível 10', '📈', 100, 'milestone'),
  ('level_25', 'Avançado', 'Alcance o nível 25', '📈', 250, 'milestone'),
  ('level_50', 'Expert', 'Alcance o nível 50', '📈', 500, 'milestone'),
  ('level_100', 'Mestre Darwin', 'Alcance o nível 100', '🦉', 1000, 'milestone')
ON CONFLICT (id) DO NOTHING;

-- Area Mastery Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('master_clinica', 'Mestre em Clínica Médica', 'Acerte 80%+ em 50 questões de Clínica', '🏥', 300, 'exam'),
  ('master_cirurgia', 'Mestre em Cirurgia', 'Acerte 80%+ em 50 questões de Cirurgia', '🔪', 300, 'exam'),
  ('master_go', 'Mestre em GO', 'Acerte 80%+ em 50 questões de GO', '👶', 300, 'exam'),
  ('master_pediatria', 'Mestre em Pediatria', 'Acerte 80%+ em 50 questões de Pediatria', '🧒', 300, 'exam'),
  ('master_coletiva', 'Mestre em Saúde Coletiva', 'Acerte 80%+ em 50 questões de Saúde Coletiva', '🌍', 300, 'exam'),
  ('complete_master', 'Médico Completo', 'Seja mestre em todas as 5 áreas', '👨‍⚕️', 1000, 'exam')
ON CONFLICT (id) DO NOTHING;

-- Social Achievements (for future features)
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('share_deck', 'Generoso', 'Compartilhe um deck de flashcards', '🤝', 50, 'social'),
  ('deck_popular', 'Popular', 'Tenha um deck com 10+ favoritos', '❤️', 100, 'social'),
  ('deck_viral', 'Viral', 'Tenha um deck com 100+ favoritos', '🚀', 300, 'social'),
  ('helper', 'Ajudante', 'Contribua com 10 questões validadas', '🙋', 150, 'social'),
  ('contributor', 'Contribuidor', 'Contribua com 50 questões validadas', '📖', 400, 'social')
ON CONFLICT (id) DO NOTHING;
