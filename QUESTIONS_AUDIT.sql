-- =====================================================
-- AUDITORIA DE QUALIDADE - BANCO DE QUESTÕES
-- =====================================================
-- Execute no Supabase SQL Editor para diagnóstico completo
-- Data: 2026-02-14
-- Objetivo: Identificar gaps de curadoria e priorizar trabalho
-- =====================================================

-- ============================================
-- 1. RESUMO EXECUTIVO
-- ============================================

SELECT
  'RESUMO EXECUTIVO - BANCO DE QUESTÕES' as secao;

-- Total geral
SELECT
  COUNT(*) as total_questoes,
  COUNT(DISTINCT bank_id) as bancos_distintos,
  COUNT(DISTINCT area) as areas_cobertas,
  MIN(created_at)::date as primeira_questao,
  MAX(created_at)::date as ultima_questao
FROM questions;

-- ============================================
-- 2. DISTRIBUIÇÃO POR ÁREA
-- ============================================

SELECT
  '2. DISTRIBUIÇÃO POR ÁREA (Meta: 50 por área)' as secao;

SELECT
  area as "Área ENAMED",
  COUNT(*) as "Total Atual",
  50 as "Meta Beta",
  50 - COUNT(*) as "Faltam",
  ROUND(COUNT(*) * 100.0 / 50, 1) || '%' as "Progresso %",
  CASE
    WHEN COUNT(*) >= 50 THEN '✅ META ATINGIDA'
    WHEN COUNT(*) >= 40 THEN '🟡 PRÓXIMO DA META'
    WHEN COUNT(*) >= 30 THEN '🟠 PRECISA EXPANSÃO'
    ELSE '🔴 CRÍTICO - MUITO DEFASADO'
  END as "Status"
FROM questions
GROUP BY area
ORDER BY COUNT(*) ASC;  -- Menor primeiro = prioridade

-- ============================================
-- 3. QUESTÕES SEM EXPLICAÇÃO COMPLETA
-- ============================================

SELECT
  '3. QUESTÕES SEM EXPLICAÇÃO COMPLETA (PRIORIDADE CRÍTICA)' as secao;

-- Resumo por área
SELECT
  area as "Área",
  COUNT(*) as "Sem Explicação",
  (SELECT COUNT(*) FROM questions q2 WHERE q2.area = q.area) as "Total na Área",
  ROUND(
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions q2 WHERE q2.area = q.area),
    1
  ) || '%' as "% Sem Explicação"
FROM questions q
WHERE
  explanation LIKE '%em elaboração%'
  OR explanation LIKE '%Explicação em elaboração%'
  OR LENGTH(TRIM(explanation)) < 100
GROUP BY area
ORDER BY COUNT(*) DESC;

-- Lista completa (primeiras 20)
SELECT
  area as "Área",
  LEFT(stem, 80) || '...' as "Preview do Caso",
  LENGTH(explanation) as "Tamanho Explicação",
  id as "ID"
FROM questions
WHERE
  explanation LIKE '%em elaboração%'
  OR explanation LIKE '%Explicação em elaboração%'
  OR LENGTH(TRIM(explanation)) < 100
ORDER BY area, created_at
LIMIT 20;

-- ============================================
-- 4. QUESTÕES SEM METADATA (subspecialty/topic)
-- ============================================

SELECT
  '4. QUESTÕES SEM METADATA (subspecialty e topic NULL)' as secao;

SELECT
  area as "Área",
  COUNT(CASE WHEN subspecialty IS NULL THEN 1 END) as "Sem Subspecialty",
  COUNT(CASE WHEN topic IS NULL THEN 1 END) as "Sem Topic",
  COUNT(CASE WHEN subspecialty IS NULL AND topic IS NULL THEN 1 END) as "Ambos NULL",
  COUNT(*) as "Total na Área",
  ROUND(
    COUNT(CASE WHEN subspecialty IS NULL AND topic IS NULL THEN 1 END) * 100.0 / COUNT(*),
    1
  ) || '%' as "% Incompleto"
FROM questions
GROUP BY area
ORDER BY COUNT(CASE WHEN subspecialty IS NULL AND topic IS NULL THEN 1 END) DESC;

-- Lista de questões sem metadata (amostra)
SELECT
  area as "Área",
  LEFT(stem, 60) || '...' as "Preview",
  subspecialty as "Subspecialty",
  topic as "Topic",
  id as "ID"
FROM questions
WHERE subspecialty IS NULL OR topic IS NULL
ORDER BY area
LIMIT 30;

-- ============================================
-- 5. PARÂMETROS IRT PROBLEMÁTICOS
-- ============================================

SELECT
  '5. PARÂMETROS IRT PROBLEMÁTICOS (Infit/Outfit fora do ideal)' as secao;

-- Questões com fit ruim (infit ou outfit fora de 0.7-1.3)
SELECT
  area as "Área",
  COUNT(CASE
    WHEN irt_infit IS NOT NULL AND (irt_infit < 0.7 OR irt_infit > 1.3)
    THEN 1
  END) as "Infit Problemático",
  COUNT(CASE
    WHEN irt_outfit IS NOT NULL AND (irt_outfit < 0.7 OR irt_outfit > 1.3)
    THEN 1
  END) as "Outfit Problemático",
  COUNT(CASE
    WHEN (irt_infit IS NOT NULL AND (irt_infit < 0.7 OR irt_infit > 1.3))
      OR (irt_outfit IS NOT NULL AND (irt_outfit < 0.7 OR irt_outfit > 1.3))
    THEN 1
  END) as "Total com Problema",
  COUNT(*) as "Total na Área"
FROM questions
GROUP BY area
ORDER BY "Total com Problema" DESC;

-- Lista detalhada de questões com fit ruim
SELECT
  area as "Área",
  LEFT(stem, 50) || '...' as "Preview",
  ROUND(irt_difficulty::numeric, 2) as "Difficulty",
  ROUND(irt_discrimination::numeric, 2) as "Discrimination",
  ROUND(irt_infit::numeric, 2) as "Infit",
  ROUND(irt_outfit::numeric, 2) as "Outfit",
  CASE
    WHEN irt_infit < 0.7 OR irt_infit > 1.3 THEN '❌ Infit fora'
    WHEN irt_outfit < 0.7 OR irt_outfit > 1.3 THEN '❌ Outfit fora'
    ELSE '⚠️ Ambos'
  END as "Problema",
  id as "ID"
FROM questions
WHERE
  (irt_infit IS NOT NULL AND (irt_infit < 0.7 OR irt_infit > 1.3))
  OR (irt_outfit IS NOT NULL AND (irt_outfit < 0.7 OR irt_outfit > 1.3))
ORDER BY area, irt_infit DESC NULLS LAST
LIMIT 25;

-- ============================================
-- 6. DISTRIBUIÇÃO DE DIFICULDADE
-- ============================================

SELECT
  '6. DISTRIBUIÇÃO DE DIFICULDADE (Balanceamento)' as secao;

-- Por área
SELECT
  area as "Área",
  COUNT(CASE WHEN difficulty = 'muito_facil' THEN 1 END) as "Muito Fácil",
  COUNT(CASE WHEN difficulty = 'facil' THEN 1 END) as "Fácil",
  COUNT(CASE WHEN difficulty = 'medio' THEN 1 END) as "Médio",
  COUNT(CASE WHEN difficulty = 'dificil' THEN 1 END) as "Difícil",
  COUNT(CASE WHEN difficulty = 'muito_dificil' THEN 1 END) as "Muito Difícil",
  COUNT(CASE WHEN difficulty IS NULL THEN 1 END) as "Sem Classificação",
  COUNT(*) as "Total",
  ROUND(AVG(irt_difficulty)::numeric, 2) as "IRT b Médio"
FROM questions
GROUP BY area
ORDER BY area;

-- Distribuição IRT (bins)
SELECT
  '6b. Distribuição IRT Difficulty (bins de 0.5)' as secao;

SELECT
  CASE
    WHEN irt_difficulty < -2.0 THEN '< -2.0 (Muito Fácil)'
    WHEN irt_difficulty < -1.0 THEN '-2.0 a -1.0 (Fácil)'
    WHEN irt_difficulty < 0.0 THEN '-1.0 a 0.0 (Fácil-Médio)'
    WHEN irt_difficulty < 1.0 THEN '0.0 a 1.0 (Médio-Difícil)'
    WHEN irt_difficulty < 2.0 THEN '1.0 a 2.0 (Difícil)'
    ELSE '> 2.0 (Muito Difícil)'
  END as "Faixa de Dificuldade IRT",
  COUNT(*) as "Questões",
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions WHERE irt_difficulty IS NOT NULL), 1) || '%' as "% do Total"
FROM questions
WHERE irt_difficulty IS NOT NULL
GROUP BY
  CASE
    WHEN irt_difficulty < -2.0 THEN '< -2.0 (Muito Fácil)'
    WHEN irt_difficulty < -1.0 THEN '-2.0 a -1.0 (Fácil)'
    WHEN irt_difficulty < 0.0 THEN '-1.0 a 0.0 (Fácil-Médio)'
    WHEN irt_difficulty < 1.0 THEN '0.0 a 1.0 (Médio-Difícil)'
    WHEN irt_difficulty < 2.0 THEN '1.0 a 2.0 (Difícil)'
    ELSE '> 2.0 (Muito Difícil)'
  END
ORDER BY MIN(irt_difficulty);

-- ============================================
-- 7. COBERTURA DE SUBSPECIALIDADES
-- ============================================

SELECT
  '7. COBERTURA DE SUBSPECIALIDADES (Top 10 por área)' as secao;

-- Clínica Médica
SELECT
  'Clínica Médica' as "Área",
  subspecialty as "Subspecialty",
  COUNT(*) as "Questões"
FROM questions
WHERE area = 'clinica_medica' AND subspecialty IS NOT NULL
GROUP BY subspecialty
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Cirurgia
SELECT
  'Cirurgia' as "Área",
  subspecialty as "Subspecialty",
  COUNT(*) as "Questões"
FROM questions
WHERE area = 'cirurgia' AND subspecialty IS NOT NULL
GROUP BY subspecialty
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Ginecologia/Obstetrícia
SELECT
  'Ginecologia/Obstetrícia' as "Área",
  subspecialty as "Subspecialty",
  COUNT(*) as "Questões"
FROM questions
WHERE area = 'ginecologia_obstetricia' AND subspecialty IS NOT NULL
GROUP BY subspecialty
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Pediatria
SELECT
  'Pediatria' as "Área",
  subspecialty as "Subspecialty",
  COUNT(*) as "Questões"
FROM questions
WHERE area = 'pediatria' AND subspecialty IS NOT NULL
GROUP BY subspecialty
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Saúde Coletiva
SELECT
  'Saúde Coletiva' as "Área",
  subspecialty as "Subspecialty",
  COUNT(*) as "Questões"
FROM questions
WHERE area = 'saude_coletiva' AND subspecialty IS NOT NULL
GROUP BY subspecialty
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================
-- 8. QUESTÕES POR BANCO
-- ============================================

SELECT
  '8. QUESTÕES POR BANCO (Question Banks)' as secao;

SELECT
  qb.name as "Nome do Banco",
  qb.source as "Fonte",
  qb.year_start as "Ano",
  COUNT(q.id) as "Questões",
  qb.is_premium as "Premium?",
  qb.is_active as "Ativo?"
FROM question_banks qb
LEFT JOIN questions q ON q.bank_id = qb.id
GROUP BY qb.id, qb.name, qb.source, qb.year_start, qb.is_premium, qb.is_active
ORDER BY COUNT(q.id) DESC;

-- ============================================
-- 9. VALIDAÇÃO E QUALIDADE
-- ============================================

SELECT
  '9. VALIDAÇÃO E QUALIDADE' as secao;

SELECT
  validated_by as "Validado Por",
  COUNT(*) as "Questões",
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions), 1) || '%' as "% do Total"
FROM questions
WHERE validated_by IS NOT NULL
GROUP BY validated_by
ORDER BY COUNT(*) DESC;

-- Questões sem validação
SELECT
  'Questões SEM validação' as "Categoria",
  COUNT(*) as "Total"
FROM questions
WHERE validated_by IS NULL;

-- ============================================
-- 10. REFERÊNCIAS BIBLIOGRÁFICAS
-- ============================================

SELECT
  '10. QUESTÕES COM REFERÊNCIAS' as secao;

SELECT
  area as "Área",
  COUNT(CASE WHEN reference_list IS NOT NULL AND array_length(reference_list, 1) > 0 THEN 1 END) as "Com Referências",
  COUNT(*) as "Total",
  ROUND(
    COUNT(CASE WHEN reference_list IS NOT NULL AND array_length(reference_list, 1) > 0 THEN 1 END) * 100.0 / COUNT(*),
    1
  ) || '%' as "% Com Referências"
FROM questions
GROUP BY area
ORDER BY "% Com Referências" ASC;

-- ============================================
-- 11. ANÁLISE DE USO (Se já tem dados de beta)
-- ============================================

SELECT
  '11. ANÁLISE DE USO (Dados de respostas de usuários)' as secao;

-- Questões mais respondidas
SELECT
  q.area as "Área",
  LEFT(q.stem, 60) || '...' as "Preview",
  COUNT(DISTINCT ea.user_id) as "Usuários Distintos",
  COUNT(ea.id) as "Total Tentativas",
  ROUND(AVG(CASE WHEN ea.is_correct THEN 1.0 ELSE 0.0 END)::numeric, 3) as "P(Correta)",
  q.id as "ID"
FROM questions q
LEFT JOIN exam_answers ea ON ea.question_id = q.id
WHERE ea.id IS NOT NULL
GROUP BY q.id, q.area, q.stem
ORDER BY COUNT(ea.id) DESC
LIMIT 20;

-- Questões nunca respondidas
SELECT
  area as "Área",
  COUNT(*) as "Questões Nunca Respondidas"
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM exam_answers ea WHERE ea.question_id = q.id
)
GROUP BY area;

-- ============================================
-- 12. PRIORIZAÇÃO DE CURADORIA
-- ============================================

SELECT
  '12. PRIORIZAÇÃO DE CURADORIA (Score de urgência)' as secao;

SELECT
  q.area as "Área",
  LEFT(q.stem, 50) || '...' as "Preview",
  -- Score de urgência (0-10, maior = mais urgente)
  (
    -- Sem explicação: +5 pontos
    CASE WHEN q.explanation LIKE '%em elaboração%' OR LENGTH(q.explanation) < 100 THEN 5 ELSE 0 END
    +
    -- Sem metadata: +3 pontos
    CASE WHEN q.subspecialty IS NULL OR q.topic IS NULL THEN 3 ELSE 0 END
    +
    -- IRT fit ruim: +2 pontos
    CASE WHEN (q.irt_infit < 0.7 OR q.irt_infit > 1.3) OR (q.irt_outfit < 0.7 OR q.irt_outfit > 1.3) THEN 2 ELSE 0 END
  ) as "Score Urgência",
  CASE
    WHEN q.explanation LIKE '%em elaboração%' OR LENGTH(q.explanation) < 100 THEN '❌ Sem explicação'
    ELSE '✅'
  END as "Explicação",
  CASE
    WHEN q.subspecialty IS NULL OR q.topic IS NULL THEN '❌ Sem metadata'
    ELSE '✅'
  END as "Metadata",
  CASE
    WHEN (q.irt_infit < 0.7 OR q.irt_infit > 1.3) OR (q.irt_outfit < 0.7 OR q.irt_outfit > 1.3) THEN '⚠️ IRT ruim'
    ELSE '✅'
  END as "IRT Fit",
  q.id as "ID"
FROM questions q
ORDER BY
  (
    CASE WHEN q.explanation LIKE '%em elaboração%' OR LENGTH(q.explanation) < 100 THEN 5 ELSE 0 END
    + CASE WHEN q.subspecialty IS NULL OR q.topic IS NULL THEN 3 ELSE 0 END
    + CASE WHEN (q.irt_infit < 0.7 OR q.irt_infit > 1.3) OR (q.irt_outfit < 0.7 OR q.irt_outfit > 1.3) THEN 2 ELSE 0 END
  ) DESC,
  q.area
LIMIT 50;

-- ============================================
-- 13. RESUMO FINAL E RECOMENDAÇÕES
-- ============================================

SELECT
  '13. RESUMO FINAL - AÇÕES RECOMENDADAS' as secao;

-- Compilar métricas finais
WITH metrics AS (
  SELECT
    COUNT(*) as total_questoes,
    COUNT(CASE WHEN explanation LIKE '%em elaboração%' OR LENGTH(explanation) < 100 THEN 1 END) as sem_explicacao,
    COUNT(CASE WHEN subspecialty IS NULL OR topic IS NULL THEN 1 END) as sem_metadata,
    COUNT(CASE WHEN (irt_infit < 0.7 OR irt_infit > 1.3) OR (irt_outfit < 0.7 OR irt_outfit > 1.3) THEN 1 END) as irt_ruim,
    MIN(CASE WHEN area = 'cirurgia' THEN 1 ELSE 999 END) as tem_cirurgia,
    (SELECT COUNT(*) FROM questions WHERE area = 'cirurgia') as cirurgia_count,
    (SELECT COUNT(*) FROM questions WHERE area = 'saude_coletiva') as saude_col_count
  FROM questions
)
SELECT
  'Total de Questões' as "Métrica",
  total_questoes as "Valor Atual",
  '250' as "Meta Beta",
  250 - total_questoes as "Gap"
FROM metrics
UNION ALL
SELECT
  'Questões SEM Explicação',
  sem_explicacao,
  '0',
  sem_explicacao
FROM metrics
UNION ALL
SELECT
  'Questões SEM Metadata',
  sem_metadata,
  '0',
  sem_metadata
FROM metrics
UNION ALL
SELECT
  'Questões com IRT Problemático',
  irt_ruim,
  '<20',
  CASE WHEN irt_ruim > 20 THEN irt_ruim - 20 ELSE 0 END
FROM metrics
UNION ALL
SELECT
  'Cirurgia (área mais defasada)',
  cirurgia_count,
  '50',
  50 - cirurgia_count
FROM metrics
UNION ALL
SELECT
  'Saúde Coletiva',
  saude_col_count,
  '50',
  50 - saude_col_count
FROM metrics;

-- =====================================================
-- FIM DA AUDITORIA
-- =====================================================
-- Próximos passos:
-- 1. Curar questões sem explicação (prioridade: Cirurgia, Saúde Coletiva)
-- 2. Preencher metadata (subspecialty, topic)
-- 3. Expandir áreas defasadas (criar novas questões)
-- 4. Validar/recalibrar IRT problemáticos
-- =====================================================
