-- =====================================================
-- VERIFICAÇÃO DE CONTEÚDO BETA (Darwin Education)
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- para verificar o estado atual do conteúdo.
--
-- Data: 2026-02-14
-- Objetivo: Confirmar se o conteúdo está pronto para 50 beta-testers
--
-- MÍNIMO RECOMENDADO PARA BETA:
-- - 200+ questões (40 por área mínimo)
-- - 1000 flashcards (200 por área)
-- - 1 simulado público completo
-- - 3-5 study paths públicas
-- =====================================================

-- ============================================
-- 1. RESUMO GERAL DE CONTEÚDO
-- ============================================
SELECT
  'Questões' as tipo,
  COUNT(*) as total,
  CASE
    WHEN COUNT(*) >= 200 THEN '✅ PRONTO'
    WHEN COUNT(*) >= 100 THEN '⚠️ MÍNIMO VIÁVEL'
    ELSE '❌ INSUFICIENTE'
  END as status
FROM questions
UNION ALL
SELECT
  'Flashcards',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 1000 THEN '✅ PRONTO'
    WHEN COUNT(*) >= 500 THEN '⚠️ MÍNIMO VIÁVEL'
    ELSE '❌ INSUFICIENTE'
  END
FROM flashcards
UNION ALL
SELECT
  'Exames Públicos',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ PRONTO'
    ELSE '❌ INSUFICIENTE'
  END
FROM exams WHERE is_public = TRUE
UNION ALL
SELECT
  'Study Paths Públicas',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ PRONTO'
    WHEN COUNT(*) >= 1 THEN '⚠️ MÍNIMO VIÁVEL'
    ELSE '❌ INSUFICIENTE'
  END
FROM study_paths WHERE is_public = TRUE
UNION ALL
SELECT
  'Doenças (Darwin-MFC)',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 300 THEN '✅ PRONTO'
    WHEN COUNT(*) >= 100 THEN '⚠️ MÍNIMO VIÁVEL'
    ELSE '❌ INSUFICIENTE'
  END
FROM medical_diseases
UNION ALL
SELECT
  'Medicamentos (Darwin-MFC)',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 500 THEN '✅ PRONTO'
    WHEN COUNT(*) >= 200 THEN '⚠️ MÍNIMO VIÁVEL'
    ELSE '❌ INSUFICIENTE'
  END
FROM medical_medications;

-- ============================================
-- 2. QUESTÕES POR ÁREA (Distribuição ENAMED)
-- ============================================
SELECT
  area as "Área ENAMED",
  COUNT(*) as "Questões",
  ROUND(AVG(irt_difficulty)::numeric, 2) as "IRT Difficulty Média",
  ROUND(AVG(irt_discrimination)::numeric, 2) as "IRT Discrimination Média",
  COUNT(CASE WHEN year = 2025 THEN 1 END) as "ENAMED 2025",
  CASE
    WHEN COUNT(*) >= 40 THEN '✅'
    WHEN COUNT(*) >= 20 THEN '⚠️'
    ELSE '❌'
  END as "Status"
FROM questions
GROUP BY area
ORDER BY COUNT(*) DESC;

-- ============================================
-- 3. FLASHCARDS POR ÁREA
-- ============================================
SELECT
  area as "Área",
  COUNT(*) as "Total Flashcards",
  COUNT(DISTINCT deck_id) as "Decks",
  CASE
    WHEN COUNT(*) >= 200 THEN '✅'
    WHEN COUNT(*) >= 100 THEN '⚠️'
    ELSE '❌'
  END as "Status"
FROM flashcards
GROUP BY area
ORDER BY COUNT(*) DESC;

-- ============================================
-- 4. DECKS DO SISTEMA (Públicos)
-- ============================================
SELECT
  name as "Nome do Deck",
  area as "Área",
  card_count as "Cards",
  is_public as "Público?",
  is_system as "Sistema?"
FROM flashcard_decks
WHERE is_system = TRUE
ORDER BY area;

-- ============================================
-- 5. EXAMES DISPONÍVEIS
-- ============================================
SELECT
  title as "Título do Exame",
  is_public as "Público?",
  time_limit_minutes as "Duração (min)",
  (
    SELECT COUNT(*)
    FROM exam_questions eq
    WHERE eq.exam_id = exams.id
  ) as "Questões",
  created_at::date as "Criado em"
FROM exams
ORDER BY is_public DESC, created_at DESC
LIMIT 10;

-- ============================================
-- 6. STUDY PATHS DISPONÍVEIS
-- ============================================
SELECT
  title as "Trilha",
  areas as "Áreas",
  estimated_hours as "Horas Estimadas",
  difficulty as "Dificuldade",
  is_public as "Público?",
  (
    SELECT COUNT(*)
    FROM study_modules sm
    WHERE sm.path_id = study_paths.id
  ) as "Módulos"
FROM study_paths
WHERE is_public = TRUE
ORDER BY estimated_hours;

-- ============================================
-- 7. CONTEÚDO MÉDICO (Darwin-MFC)
-- ============================================
SELECT
  'Doenças' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN full_content IS NOT NULL AND full_content != '' THEN 1 END) as com_conteudo,
  COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) as com_summary
FROM medical_diseases
UNION ALL
SELECT
  'Medicamentos',
  COUNT(*),
  COUNT(CASE WHEN full_content IS NOT NULL AND full_content != '' THEN 1 END),
  COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END)
FROM medical_medications;

-- ============================================
-- 8. USUÁRIOS BETA (Se migration de invites rodou)
-- ============================================
-- Comentado: descomente se a tabela beta_invites existir
/*
SELECT
  COUNT(*) as "Total de Convites",
  COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as "Usados",
  COUNT(CASE WHEN used_at IS NULL THEN 1 END) as "Disponíveis",
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as "Expirados"
FROM beta_invites;
*/

-- ============================================
-- 9. ESTATÍSTICAS DE ATIVIDADE (Se já tem usuários)
-- ============================================
SELECT
  (SELECT COUNT(*) FROM profiles) as "Total de Usuários",
  (SELECT COUNT(*) FROM exam_attempts) as "Simulados Iniciados",
  (SELECT COUNT(*) FROM exam_attempts WHERE completed_at IS NOT NULL) as "Simulados Completados",
  (SELECT COUNT(*) FROM flashcard_reviews) as "Flashcards Revisados",
  (SELECT COUNT(DISTINCT user_id) FROM flashcard_reviews) as "Usuários Ativos em Flashcards";

-- ============================================
-- 10. VERIFICAÇÃO DE MIGRATIONS CRÍTICAS
-- ============================================
-- Lista as últimas migrations aplicadas
-- (Supabase armazena em supabase_migrations.schema_migrations)
SELECT
  version as "Migration Version",
  name as "Nome",
  executed_at::date as "Executada em"
FROM supabase_migrations.schema_migrations
WHERE version::text LIKE '202602%'
ORDER BY version DESC
LIMIT 10;

-- ============================================
-- 11. TAMANHO DO BANCO (Monitorar para beta)
-- ============================================
SELECT
  pg_size_pretty(pg_database_size(current_database())) as "Tamanho Total do DB",
  pg_size_pretty(
    pg_total_relation_size('questions')
  ) as "Tabela questions",
  pg_size_pretty(
    pg_total_relation_size('flashcards')
  ) as "Tabela flashcards",
  pg_size_pretty(
    pg_total_relation_size('medical_diseases')
  ) as "Tabela medical_diseases",
  pg_size_pretty(
    pg_total_relation_size('medical_medications')
  ) as "Tabela medical_medications";

-- ============================================
-- RESULTADO ESPERADO PARA BETA PRONTO:
-- ============================================
-- ✅ Questões: 90-200 (mínimo 40 por área)
-- ✅ Flashcards: 1000 (200 por área)
-- ✅ Exames públicos: 1+
-- ✅ Study paths públicas: 3-5
-- ✅ Doenças: 300+
-- ✅ Medicamentos: 500+
-- ✅ DB size: < 100 MB
-- ============================================
