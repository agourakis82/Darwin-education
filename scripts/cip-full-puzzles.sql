-- ============================================
-- CIP Full Puzzle Set - 10 Puzzles
-- ============================================
-- Run this to add 10 more diagnoses and create 10 complete puzzles

-- Insert additional diagnoses (10 more)
INSERT INTO cip_diagnoses (name_pt, icd10_code, area, subspecialty, difficulty_tier) VALUES
  ('Insuficiência Cardíaca Congestiva', 'I50', 'clinica_medica', 'cardiologia', 4),
  ('Infarto Agudo do Miocárdio', 'I21', 'clinica_medica', 'cardiologia', 4),
  ('DPOC (Doença Pulmonar Obstrutiva Crônica)', 'J44', 'clinica_medica', 'pneumologia', 3),
  ('Asma Brônquica', 'J45', 'clinica_medica', 'pneumologia', 2),
  ('Hipotireoidismo Primário', 'E03', 'clinica_medica', 'endocrinologia', 3),
  ('Colecistite Aguda', 'K81', 'cirurgia', 'cirurgia_geral', 3),
  ('Hemorragia Digestiva Alta', 'K92', 'cirurgia', 'cirurgia_geral', 4),
  ('Bronquiolite Viral Aguda', 'J21', 'pediatria', 'pneumologia', 2),
  ('Pré-eclâmpsia', 'O14', 'ginecologia_obstetricia', 'obstetricia', 4),
  ('ITU na Gestação', 'O23', 'ginecologia_obstetricia', 'obstetricia', 2)
ON CONFLICT DO NOTHING;

-- Insert additional findings (50+ more)
INSERT INTO cip_findings (text_pt, section) VALUES
  -- ICC
  ('Dispneia paroxística noturna', 'medical_history'),
  ('Ortopneia (dorme com 3 travesseiros)', 'medical_history'),
  ('B3 em foco mitral, estase jugular', 'physical_exam'),
  ('BNP elevado (> 400 pg/mL)', 'laboratory'),
  ('Furosemida 40mg/dia + espironolactona', 'treatment'),

  -- IAM
  ('Dor torácica em aperto há 2 horas, irradia para braço esquerdo', 'medical_history'),
  ('Sudorese fria, palidez cutânea', 'physical_exam'),
  ('Troponina elevada, CK-MB elevada', 'laboratory'),
  ('ECG: supra de ST em DII, DIII, aVF', 'imaging'),
  ('Cateterismo + angioplastia primária', 'treatment'),

  -- DPOC
  ('Tabagismo 40 maços-ano, tosse crônica matinal', 'medical_history'),
  ('MV difusamente diminuído, sibilos expiratórios', 'physical_exam'),
  ('Espirometria: VEF1/CVF < 0.7', 'laboratory'),
  ('Broncodilatador de longa ação + corticoide inalatório', 'treatment'),

  -- Asma
  ('Sibilância e tosse noturna, piora com frio', 'medical_history'),
  ('Sibilos difusos à ausculta', 'physical_exam'),
  ('Pico de fluxo expiratório reduzido', 'laboratory'),
  ('Salbutamol spray + corticoide inalatório', 'treatment'),

  -- Hipotireoidismo
  ('Cansaço extremo, ganho de peso, intolerância ao frio', 'medical_history'),
  ('Pele seca, cabelos quebradiços, edema periorbitário', 'physical_exam'),
  ('TSH elevado (> 10 mUI/L), T4 livre baixo', 'laboratory'),
  ('Levotiroxina 50mcg em jejum', 'treatment'),

  -- Colecistite
  ('Dor em HD pós-prandial, principalmente após gordura', 'medical_history'),
  ('Sinal de Murphy positivo', 'physical_exam'),
  ('Leucocitose, bilirrubinas levemente elevadas', 'laboratory'),
  ('USG: cálculo impactado, parede espessada', 'imaging'),
  ('Colecistectomia videolaparoscópica', 'treatment'),

  -- HDA
  ('Melena há 2 dias, fraqueza intensa', 'medical_history'),
  ('Palidez cutâneo-mucosa, taquicardia', 'physical_exam'),
  ('Hb: 7.5 g/dL, ureia elevada', 'laboratory'),
  ('EDA: úlcera gástrica com sangramento ativo', 'imaging'),
  ('Omeprazol EV + hemotransfusão', 'treatment'),

  -- Bronquiolite
  ('Lactente 6 meses, coriza e tosse há 3 dias', 'medical_history'),
  ('Tiragem subcostal, sibilos e crepitações difusas', 'physical_exam'),
  ('SatO2: 92% em ar ambiente', 'laboratory'),
  ('O2 suplementar + aspiração de VAS', 'treatment'),

  -- Pré-eclâmpsia
  ('Gestante 34 semanas, PA elevada em 2 consultas', 'medical_history'),
  ('PA: 160/110 mmHg, edema generalizado', 'physical_exam'),
  ('Proteinúria 24h > 300mg, plaquetas baixas', 'laboratory'),
  ('Sulfato de magnésio + anti-hipertensivo', 'treatment'),

  -- ITU Gestante
  ('Gestante com disúria, urgência e polaciúria', 'medical_history'),
  ('Punho-percussão lombar negativa', 'physical_exam'),
  ('EAS: leucocitúria, nitritos positivos', 'laboratory'),
  ('Cefalexina 500mg 6/6h por 7 dias', 'treatment'),

  -- Additional generic findings for variety
  ('Paciente refere sintomas há 1 semana', 'medical_history'),
  ('Exame físico sem alterações significativas', 'physical_exam'),
  ('Hemograma dentro da normalidade', 'laboratory'),
  ('Conduta expectante com reavaliação', 'treatment')
ON CONFLICT DO NOTHING;

-- Now create 9 more puzzles (we already have 1 from before)
DO $$
DECLARE
  v_all_diagnoses UUID[];
  v_all_findings_hist UUID[];
  v_all_findings_pe UUID[];
  v_all_findings_lab UUID[];
  v_all_findings_img UUID[];
  v_all_findings_treat UUID[];
  v_puzzle_id UUID;
  v_diag_subset UUID[];
  v_grid_cells TEXT;
BEGIN
  -- Get all diagnosis IDs
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_diagnoses FROM cip_diagnoses;

  -- Get all finding IDs by section
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_findings_hist FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_findings_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_findings_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_findings_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_findings_treat FROM cip_findings WHERE section = 'treatment';

  -- PUZZLE 1: Muito Fácil #1 (3 diagnoses)
  v_diag_subset := v_all_diagnoses[2:4]; -- HAS, Pneumonia, Apendicite
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Iniciante - Casos Comuns',
    '{clinica_medica,cirurgia}',
    'muito_facil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist[1:6], 'physical_exam', v_all_findings_pe[1:6], 'treatment', v_all_findings_treat[1:6]),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"]}',
    15, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, row_num-1, sec, fid FROM (
    VALUES
      (1, 'medical_history', v_all_findings_hist[5]),
      (1, 'physical_exam', v_all_findings_pe[6]),
      (1, 'treatment', v_all_findings_treat[7]),
      (2, 'medical_history', v_all_findings_hist[8]),
      (2, 'physical_exam', v_all_findings_pe[9]),
      (2, 'treatment', v_all_findings_treat[11]),
      (3, 'medical_history', v_all_findings_hist[12]),
      (3, 'physical_exam', v_all_findings_pe[13]),
      (3, 'treatment', v_all_findings_treat[15])
  ) AS t(row_num, sec, fid);

  -- PUZZLE 2: Muito Fácil #2 (3 diagnoses)
  v_diag_subset := ARRAY[v_all_diagnoses[1], v_all_diagnoses[5], v_all_diagnoses[8]]; -- DM2, DDA, Asma
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Básico - Clínica Geral',
    '{clinica_medica,pediatria}',
    'muito_facil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist[1:7], 'physical_exam', v_all_findings_pe[1:7], 'treatment', v_all_findings_treat[1:7]),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"]}',
    15, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, row_num-1, sec, fid FROM (
    VALUES
      (1, 'medical_history', v_all_findings_hist[1]),
      (1, 'physical_exam', v_all_findings_pe[1]),
      (1, 'treatment', v_all_findings_treat[4]),
      (2, 'medical_history', v_all_findings_hist[16]),
      (2, 'physical_exam', v_all_findings_pe[17]),
      (2, 'treatment', v_all_findings_treat[18]),
      (3, 'medical_history', v_all_findings_hist[29]),
      (3, 'physical_exam', v_all_findings_pe[30]),
      (3, 'treatment', v_all_findings_treat[32])
  ) AS t(row_num, sec, fid);

  -- PUZZLE 3: Fácil #2 (4 diagnoses)
  v_diag_subset := v_all_diagnoses[1:4];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Intermediário - Mix Clínico',
    '{clinica_medica,cirurgia,pediatria}',
    'facil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist[1:10], 'physical_exam', v_all_findings_pe[1:10], 'laboratory', v_all_findings_lab[1:10], 'treatment', v_all_findings_treat[1:10]),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    20, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT 1 as i, 'medical_history' as sec, v_all_findings_hist[1] as fid UNION ALL
    SELECT 1, 'physical_exam', v_all_findings_pe[1] UNION ALL
    SELECT 1, 'laboratory', v_all_findings_lab[2] UNION ALL
    SELECT 1, 'treatment', v_all_findings_treat[4] UNION ALL
    SELECT 2, 'medical_history', v_all_findings_hist[5] UNION ALL
    SELECT 2, 'physical_exam', v_all_findings_pe[6] UNION ALL
    SELECT 2, 'laboratory', v_all_findings_lab[1] UNION ALL
    SELECT 2, 'treatment', v_all_findings_treat[7] UNION ALL
    SELECT 3, 'medical_history', v_all_findings_hist[8] UNION ALL
    SELECT 3, 'physical_exam', v_all_findings_pe[9] UNION ALL
    SELECT 3, 'laboratory', v_all_findings_lab[1] UNION ALL
    SELECT 3, 'treatment', v_all_findings_treat[11] UNION ALL
    SELECT 4, 'medical_history', v_all_findings_hist[12] UNION ALL
    SELECT 4, 'physical_exam', v_all_findings_pe[13] UNION ALL
    SELECT 4, 'laboratory', v_all_findings_lab[14] UNION ALL
    SELECT 4, 'treatment', v_all_findings_treat[15]
  ) t;

  -- PUZZLE 4: Fácil #3 (4 diagnoses)
  v_diag_subset := ARRAY[v_all_diagnoses[6], v_all_diagnoses[7], v_all_diagnoses[10], v_all_diagnoses[11]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Intermediário - Cardiologia e Pneumologia',
    '{clinica_medica}',
    'facil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist[1:12], 'physical_exam', v_all_findings_pe[1:12], 'laboratory', v_all_findings_lab[1:12], 'treatment', v_all_findings_treat[1:12]),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    25, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT 1 as i, 'medical_history' as sec, v_all_findings_hist[19] as fid UNION ALL
    SELECT 1, 'physical_exam', v_all_findings_pe[21] UNION ALL
    SELECT 1, 'laboratory', v_all_findings_lab[22] UNION ALL
    SELECT 1, 'treatment', v_all_findings_treat[23] UNION ALL
    SELECT 2, 'medical_history', v_all_findings_hist[24] UNION ALL
    SELECT 2, 'physical_exam', v_all_findings_pe[25] UNION ALL
    SELECT 2, 'laboratory', v_all_findings_lab[26] UNION ALL
    SELECT 2, 'treatment', v_all_findings_treat[28] UNION ALL
    SELECT 3, 'medical_history', v_all_findings_hist[29] UNION ALL
    SELECT 3, 'physical_exam', v_all_findings_pe[30] UNION ALL
    SELECT 3, 'laboratory', v_all_findings_lab[31] UNION ALL
    SELECT 3, 'treatment', v_all_findings_treat[32] UNION ALL
    SELECT 4, 'medical_history', v_all_findings_hist[33] UNION ALL
    SELECT 4, 'physical_exam', v_all_findings_pe[34] UNION ALL
    SELECT 4, 'laboratory', v_all_findings_lab[35] UNION ALL
    SELECT 4, 'treatment', v_all_findings_treat[36]
  ) t;

  -- PUZZLE 5: Médio #1 (5 diagnoses)
  v_diag_subset := v_all_diagnoses[1:5];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Avançado - Casos Complexos',
    '{clinica_medica,cirurgia,pediatria}',
    'medio',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist[1:15], 'physical_exam', v_all_findings_pe[1:15], 'laboratory', v_all_findings_lab[1:15], 'treatment', v_all_findings_treat[1:15]),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    30, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT generate_series(1,5) as i, 'medical_history' as sec, v_all_findings_hist[generate_series(1,5)] as fid UNION ALL
    SELECT generate_series(1,5), 'physical_exam', v_all_findings_pe[generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'laboratory', v_all_findings_lab[generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'treatment', v_all_findings_treat[generate_series(1,5)]
  ) t;

  -- PUZZLE 6: Médio #2 (5 diagnoses)
  v_diag_subset := ARRAY[v_all_diagnoses[6], v_all_diagnoses[7], v_all_diagnoses[8], v_all_diagnoses[11], v_all_diagnoses[13]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Avançado - Cardiologia e Cirurgia',
    '{clinica_medica,cirurgia}',
    'medio',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist, 'physical_exam', v_all_findings_pe, 'laboratory', v_all_findings_lab, 'imaging', v_all_findings_img, 'treatment', v_all_findings_treat),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "imaging", "treatment"]}',
    35, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT generate_series(1,5) as i, 'medical_history' as sec, v_all_findings_hist[19+generate_series(1,5)] as fid UNION ALL
    SELECT generate_series(1,5), 'physical_exam', v_all_findings_pe[19+generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'laboratory', v_all_findings_lab[5+generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'imaging', v_all_findings_img[generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'treatment', v_all_findings_treat[19+generate_series(1,5)]
  ) t;

  -- PUZZLE 7: Médio #3 (5 diagnoses)
  v_diag_subset := ARRAY[v_all_diagnoses[9], v_all_diagnoses[10], v_all_diagnoses[12], v_all_diagnoses[14], v_all_diagnoses[15]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Avançado - Especialidades Diversas',
    '{clinica_medica,cirurgia,pediatria,ginecologia_obstetricia}',
    'medio',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist, 'physical_exam', v_all_findings_pe, 'laboratory', v_all_findings_lab, 'treatment', v_all_findings_treat),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    30, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT generate_series(1,5) as i, 'medical_history' as sec, v_all_findings_hist[33+generate_series(1,5)] as fid UNION ALL
    SELECT generate_series(1,5), 'physical_exam', v_all_findings_pe[33+generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'laboratory', v_all_findings_lab[10+generate_series(1,5)] UNION ALL
    SELECT generate_series(1,5), 'treatment', v_all_findings_treat[33+generate_series(1,5)]
  ) t;

  -- PUZZLE 8: Difícil #1 (6 diagnoses)
  v_diag_subset := v_all_diagnoses[1:6];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Expert - Grande Desafio',
    '{clinica_medica,cirurgia}',
    'dificil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist, 'physical_exam', v_all_findings_pe, 'laboratory', v_all_findings_lab, 'imaging', v_all_findings_img, 'treatment', v_all_findings_treat),
    '{"diagnosisCount": 6, "sections": ["medical_history", "physical_exam", "laboratory", "imaging", "treatment"]}',
    40, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT generate_series(1,6) as i, 'medical_history' as sec, v_all_findings_hist[generate_series(1,6)] as fid UNION ALL
    SELECT generate_series(1,6), 'physical_exam', v_all_findings_pe[generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'laboratory', v_all_findings_lab[generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'imaging', v_all_findings_img[generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'treatment', v_all_findings_treat[generate_series(1,6)]
  ) t;

  -- PUZZLE 9: Difícil #2 (6 diagnoses)
  v_diag_subset := ARRAY[v_all_diagnoses[6], v_all_diagnoses[7], v_all_diagnoses[11], v_all_diagnoses[13], v_all_diagnoses[14], v_all_diagnoses[15]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Expert - Casos Críticos',
    '{clinica_medica,cirurgia,ginecologia_obstetricia}',
    'dificil',
    v_diag_subset,
    jsonb_build_object('medical_history', v_all_findings_hist, 'physical_exam', v_all_findings_pe, 'laboratory', v_all_findings_lab, 'imaging', v_all_findings_img, 'treatment', v_all_findings_treat),
    '{"diagnosisCount": 6, "sections": ["medical_history", "physical_exam", "laboratory", "imaging", "treatment"]}',
    45, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id)
  SELECT v_puzzle_id, i-1, sec, fid FROM (
    SELECT generate_series(1,6) as i, 'medical_history' as sec, v_all_findings_hist[19+generate_series(1,6)] as fid UNION ALL
    SELECT generate_series(1,6), 'physical_exam', v_all_findings_pe[19+generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'laboratory', v_all_findings_lab[10+generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'imaging', v_all_findings_img[generate_series(1,6)] UNION ALL
    SELECT generate_series(1,6), 'treatment', v_all_findings_treat[19+generate_series(1,6)]
  ) t;

  RAISE NOTICE '✅ Created 9 additional puzzles!';
END $$;

-- Final summary
SELECT
  difficulty,
  COUNT(*) as puzzle_count,
  ARRAY_AGG(title ORDER BY created_at) as titles
FROM cip_puzzles
GROUP BY difficulty
ORDER BY
  CASE difficulty
    WHEN 'muito_facil' THEN 1
    WHEN 'facil' THEN 2
    WHEN 'medio' THEN 3
    WHEN 'dificil' THEN 4
    WHEN 'muito_dificil' THEN 5
  END;
