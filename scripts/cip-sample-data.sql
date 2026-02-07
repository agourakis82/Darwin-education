-- ============================================
-- CIP Sample Data - Quick Start
-- ============================================
-- Run this in Supabase SQL Editor to populate sample data

-- Insert diagnoses
INSERT INTO cip_diagnoses (name_pt, icd10_code, area, subspecialty, difficulty_tier) VALUES
  ('Diabetes Mellitus tipo 2', 'E11', 'clinica_medica', 'endocrinologia', 2),
  ('Hipertensão Arterial Sistêmica', 'I10', 'clinica_medica', 'cardiologia', 1),
  ('Pneumonia Adquirida na Comunidade', 'J18', 'clinica_medica', 'pneumologia', 2),
  ('Apendicite Aguda', 'K35', 'cirurgia', 'cirurgia_geral', 2),
  ('Doença Diarreica Aguda', 'A09', 'pediatria', 'gastroenterologia', 1)
ON CONFLICT DO NOTHING;

-- Insert findings
INSERT INTO cip_findings (text_pt, section) VALUES
  -- Diabetes
  ('Polidipsia, poliúria e perda de peso há 3 meses', 'medical_history'),
  ('Glicemia de jejum: 180 mg/dL', 'laboratory'),
  ('HbA1c: 8.5%', 'laboratory'),
  ('Iniciar metformina 850mg 2x/dia', 'treatment'),

  -- HAS
  ('Cefaleia occipital matinal recorrente', 'medical_history'),
  ('PA: 160/100 mmHg (confirmada em 3 medidas)', 'physical_exam'),
  ('Iniciar losartana 50mg/dia', 'treatment'),

  -- Pneumonia
  ('Febre alta e tosse produtiva há 5 dias', 'medical_history'),
  ('MV diminuído em base direita, estertores crepitantes', 'physical_exam'),
  ('RX tórax: consolidação lobar inferior direita', 'imaging'),
  ('Amoxicilina + clavulanato 875mg 12/12h por 7 dias', 'treatment'),

  -- Apendicite
  ('Dor abdominal migratória (epigástrio → FID) há 24h', 'medical_history'),
  ('Sinal de Blumberg positivo em FID', 'physical_exam'),
  ('Leucocitose 18.000 com desvio à esquerda', 'laboratory'),
  ('Apendicectomia videolaparoscópica', 'treatment'),

  -- DDA
  ('Criança 2 anos, diarreia líquida e vômitos há 2 dias', 'medical_history'),
  ('Desidratação leve (mucosas levemente secas)', 'physical_exam'),
  ('TGO rápido: sem desidratação grave', 'laboratory'),
  ('Soro de reidratação oral + zinco', 'treatment')
ON CONFLICT DO NOTHING;

-- Create a sample puzzle (this is a bit complex, so we'll use a function)
DO $$
DECLARE
  v_diagnosis_ids UUID[];
  v_finding_ids_hist UUID[];
  v_finding_ids_pe UUID[];
  v_finding_ids_lab UUID[];
  v_finding_ids_treat UUID[];
  v_puzzle_id UUID;
BEGIN
  -- Get diagnosis IDs (first 4)
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_diagnosis_ids
  FROM (SELECT id, created_at FROM cip_diagnoses LIMIT 4) sub;

  -- Get finding IDs by section
  SELECT ARRAY_AGG(id) INTO v_finding_ids_hist FROM (SELECT id FROM cip_findings WHERE section = 'medical_history' ORDER BY created_at LIMIT 4) sub;
  SELECT ARRAY_AGG(id) INTO v_finding_ids_pe FROM (SELECT id FROM cip_findings WHERE section = 'physical_exam' ORDER BY created_at LIMIT 4) sub;
  SELECT ARRAY_AGG(id) INTO v_finding_ids_lab FROM (SELECT id FROM cip_findings WHERE section = 'laboratory' ORDER BY created_at LIMIT 4) sub;
  SELECT ARRAY_AGG(id) INTO v_finding_ids_treat FROM (SELECT id FROM cip_findings WHERE section = 'treatment' ORDER BY created_at LIMIT 4) sub;

  -- Insert puzzle
  INSERT INTO cip_puzzles (
    title,
    areas,
    difficulty,
    diagnosis_ids,
    options_per_section,
    settings,
    time_limit_minutes,
    type,
    is_public
  ) VALUES (
    'Puzzle de Prática - Fácil',
    '{clinica_medica,cirurgia,pediatria}',
    'facil',
    v_diagnosis_ids,
    jsonb_build_object(
      'medical_history', v_finding_ids_hist,
      'physical_exam', v_finding_ids_pe,
      'laboratory', v_finding_ids_lab,
      'treatment', v_finding_ids_treat
    ),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 2, "allowReuse": false}',
    25,
    'practice',
    true
  ) RETURNING id INTO v_puzzle_id;

  -- Insert puzzle grid
  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT
    v_puzzle_id,
    row_num - 1,
    section,
    finding_id
  FROM (
    SELECT 1 as row_num, 'medical_history' as section, v_finding_ids_hist[1] as finding_id
    UNION ALL SELECT 1, 'physical_exam', v_finding_ids_pe[1]
    UNION ALL SELECT 1, 'laboratory', v_finding_ids_lab[1]
    UNION ALL SELECT 1, 'treatment', v_finding_ids_treat[1]
    UNION ALL SELECT 2, 'medical_history', v_finding_ids_hist[2]
    UNION ALL SELECT 2, 'physical_exam', v_finding_ids_pe[2]
    UNION ALL SELECT 2, 'laboratory', v_finding_ids_lab[2]
    UNION ALL SELECT 2, 'treatment', v_finding_ids_treat[2]
    UNION ALL SELECT 3, 'medical_history', v_finding_ids_hist[3]
    UNION ALL SELECT 3, 'physical_exam', v_finding_ids_pe[3]
    UNION ALL SELECT 3, 'laboratory', v_finding_ids_lab[3]
    UNION ALL SELECT 3, 'treatment', v_finding_ids_treat[3]
    UNION ALL SELECT 4, 'medical_history', v_finding_ids_hist[4]
    UNION ALL SELECT 4, 'physical_exam', v_finding_ids_pe[4]
    UNION ALL SELECT 4, 'laboratory', v_finding_ids_lab[4]
    UNION ALL SELECT 4, 'treatment', v_finding_ids_treat[4]
  ) grid;

  RAISE NOTICE '✅ Created puzzle: %', v_puzzle_id;
END $$;

-- Show summary
SELECT
  'Diagnoses' as table_name,
  COUNT(*)::text as count
FROM cip_diagnoses
UNION ALL
SELECT 'Findings', COUNT(*)::text FROM cip_findings
UNION ALL
SELECT 'Puzzles', COUNT(*)::text FROM cip_puzzles
UNION ALL
SELECT 'Grid Cells', COUNT(*)::text FROM cip_puzzle_grid;
