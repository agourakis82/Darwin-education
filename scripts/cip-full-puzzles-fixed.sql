-- ============================================
-- CIP Full Puzzle Set - SAFE RE-RUNNABLE VERSION
-- ============================================
-- Safe to run multiple times. Cleans up duplicates first.
-- Finding counts: MH=16, PE=14, LAB=14, IMG=4, TREAT=15

-- Step 1: Remove duplicate diagnoses (keep oldest by created_at)
DELETE FROM cip_diagnoses a
USING cip_diagnoses b
WHERE a.created_at > b.created_at AND a.name_pt = b.name_pt;

-- Step 2: Remove duplicate findings (keep oldest by created_at)
DELETE FROM cip_findings a
USING cip_findings b
WHERE a.created_at > b.created_at AND a.text_pt = b.text_pt AND a.section = b.section;

-- Step 3: Insert diagnoses only if they don't exist yet
INSERT INTO cip_diagnoses (name_pt, icd10_code, area, subspecialty, difficulty_tier)
SELECT v.* FROM (VALUES
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
) AS v(name_pt, icd10_code, area, subspecialty, difficulty_tier)
WHERE NOT EXISTS (SELECT 1 FROM cip_diagnoses WHERE cip_diagnoses.name_pt = v.name_pt);

-- Step 4: Insert findings only if they don't exist yet
INSERT INTO cip_findings (text_pt, section)
SELECT v.* FROM (VALUES
  ('Dispneia paroxística noturna', 'medical_history'),
  ('Ortopneia (dorme com 3 travesseiros)', 'medical_history'),
  ('B3 em foco mitral, estase jugular', 'physical_exam'),
  ('BNP elevado (> 400 pg/mL)', 'laboratory'),
  ('Furosemida 40mg/dia + espironolactona', 'treatment'),
  ('Dor torácica em aperto há 2 horas, irradia para braço esquerdo', 'medical_history'),
  ('Sudorese fria, palidez cutânea', 'physical_exam'),
  ('Troponina elevada, CK-MB elevada', 'laboratory'),
  ('ECG: supra de ST em DII, DIII, aVF', 'imaging'),
  ('Cateterismo + angioplastia primária', 'treatment'),
  ('Tabagismo 40 maços-ano, tosse crônica matinal', 'medical_history'),
  ('MV difusamente diminuído, sibilos expiratórios', 'physical_exam'),
  ('Espirometria: VEF1/CVF < 0.7', 'laboratory'),
  ('Broncodilatador de longa ação + corticoide inalatório', 'treatment'),
  ('Sibilância e tosse noturna, piora com frio', 'medical_history'),
  ('Sibilos difusos à ausculta', 'physical_exam'),
  ('Pico de fluxo expiratório reduzido', 'laboratory'),
  ('Salbutamol spray + corticoide inalatório', 'treatment'),
  ('Cansaço extremo, ganho de peso, intolerância ao frio', 'medical_history'),
  ('Pele seca, cabelos quebradiços, edema periorbitário', 'physical_exam'),
  ('TSH elevado (> 10 mUI/L), T4 livre baixo', 'laboratory'),
  ('Levotiroxina 50mcg em jejum', 'treatment'),
  ('Dor em HD pós-prandial, principalmente após gordura', 'medical_history'),
  ('Sinal de Murphy positivo', 'physical_exam'),
  ('Leucocitose, bilirrubinas levemente elevadas', 'laboratory'),
  ('USG: cálculo impactado, parede espessada', 'imaging'),
  ('Colecistectomia videolaparoscópica', 'treatment'),
  ('Melena há 2 dias, fraqueza intensa', 'medical_history'),
  ('Palidez cutâneo-mucosa, taquicardia', 'physical_exam'),
  ('Hb: 7.5 g/dL, ureia elevada', 'laboratory'),
  ('EDA: úlcera gástrica com sangramento ativo', 'imaging'),
  ('Omeprazol EV + hemotransfusão', 'treatment'),
  ('Lactente 6 meses, coriza e tosse há 3 dias', 'medical_history'),
  ('Tiragem subcostal, sibilos e crepitações difusas', 'physical_exam'),
  ('SatO2: 92% em ar ambiente', 'laboratory'),
  ('O2 suplementar + aspiração de VAS', 'treatment'),
  ('Gestante 34 semanas, PA elevada em 2 consultas', 'medical_history'),
  ('PA: 160/110 mmHg, edema generalizado', 'physical_exam'),
  ('Proteinúria 24h > 300mg, plaquetas baixas', 'laboratory'),
  ('Sulfato de magnésio + anti-hipertensivo', 'treatment'),
  ('Gestante com disúria, urgência e polaciúria', 'medical_history'),
  ('Punho-percussão lombar negativa', 'physical_exam'),
  ('EAS: leucocitúria, nitritos positivos', 'laboratory'),
  ('Cefalexina 500mg 6/6h por 7 dias', 'treatment')
) AS v(text_pt, section)
WHERE NOT EXISTS (SELECT 1 FROM cip_findings WHERE cip_findings.text_pt = v.text_pt AND cip_findings.section = v.section);

-- Step 5: Verify counts before creating puzzles
DO $$
DECLARE
  v_mh_count INTEGER;
  v_pe_count INTEGER;
  v_lab_count INTEGER;
  v_img_count INTEGER;
  v_treat_count INTEGER;
  v_diag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_diag_count FROM cip_diagnoses;
  SELECT COUNT(*) INTO v_mh_count FROM cip_findings WHERE section = 'medical_history';
  SELECT COUNT(*) INTO v_pe_count FROM cip_findings WHERE section = 'physical_exam';
  SELECT COUNT(*) INTO v_lab_count FROM cip_findings WHERE section = 'laboratory';
  SELECT COUNT(*) INTO v_img_count FROM cip_findings WHERE section = 'imaging';
  SELECT COUNT(*) INTO v_treat_count FROM cip_findings WHERE section = 'treatment';

  RAISE NOTICE 'Data counts - Diagnoses: %, MH: %, PE: %, LAB: %, IMG: %, TREAT: %',
    v_diag_count, v_mh_count, v_pe_count, v_lab_count, v_img_count, v_treat_count;

  IF v_diag_count < 15 THEN
    RAISE EXCEPTION 'Not enough diagnoses: %. Expected at least 15.', v_diag_count;
  END IF;
  IF v_pe_count < 14 THEN
    RAISE EXCEPTION 'Not enough physical_exam findings: %. Expected at least 14.', v_pe_count;
  END IF;
  IF v_lab_count < 14 THEN
    RAISE EXCEPTION 'Not enough laboratory findings: %. Expected at least 14.', v_lab_count;
  END IF;
END $$;

-- Step 6: Delete puzzles from previous failed runs (keep original "Puzzle de Prática")
DELETE FROM cip_puzzle_grid WHERE puzzle_id IN (
  SELECT id FROM cip_puzzles WHERE title != 'Puzzle de Prática - Fácil'
);
DELETE FROM cip_puzzles WHERE title != 'Puzzle de Prática - Fácil';

-- Step 7: Create 9 puzzles
-- Max safe indices: MH=16, PE=14, LAB=14, IMG=4, TREAT=15
DO $$
DECLARE
  v_all_diags UUID[];
  v_mh UUID[];
  v_pe UUID[];
  v_lab UUID[];
  v_img UUID[];
  v_treat UUID[];
  v_pid UUID;
  v_temp_diags UUID[];
BEGIN
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_diags FROM cip_diagnoses;
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_treat FROM cip_findings WHERE section = 'treatment';

  RAISE NOTICE 'Arrays loaded - Diags: %, MH: %, PE: %, LAB: %, IMG: %, TREAT: %',
    array_length(v_all_diags, 1),
    array_length(v_mh, 1),
    array_length(v_pe, 1),
    array_length(v_lab, 1),
    array_length(v_img, 1),
    array_length(v_treat, 1);

  -- =============================================
  -- PUZZLE 1: Muito Fácil - 3 diagnoses, 3 sections
  -- Uses: MH[2-4], PE[2-4], TREAT[2-4]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[2], v_all_diags[3], v_all_diags[4]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Iniciante - Casos Comuns',
    '{clinica_medica,cirurgia}',
    'muito_facil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:9], 'physical_exam', v_pe[1:9], 'treatment', v_treat[1:9]),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"]}',
    15, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[2]),
    (v_pid, 0, 'physical_exam', v_pe[2]),
    (v_pid, 0, 'treatment', v_treat[2]),
    (v_pid, 1, 'medical_history', v_mh[3]),
    (v_pid, 1, 'physical_exam', v_pe[3]),
    (v_pid, 1, 'treatment', v_treat[3]),
    (v_pid, 2, 'medical_history', v_mh[4]),
    (v_pid, 2, 'physical_exam', v_pe[4]),
    (v_pid, 2, 'treatment', v_treat[4]);

  RAISE NOTICE 'Puzzle 1 created: %', v_pid;

  -- =============================================
  -- PUZZLE 2: Muito Fácil - 3 diagnoses, 3 sections
  -- Uses: MH[1,5,6], PE[1,5,6], TREAT[1,5,6]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[1], v_all_diags[5], v_all_diags[8]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Básico - Clínica Geral',
    '{clinica_medica,pediatria}',
    'muito_facil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:9], 'physical_exam', v_pe[1:9], 'treatment', v_treat[1:9]),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"]}',
    15, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[1]),
    (v_pid, 0, 'physical_exam', v_pe[1]),
    (v_pid, 0, 'treatment', v_treat[1]),
    (v_pid, 1, 'medical_history', v_mh[5]),
    (v_pid, 1, 'physical_exam', v_pe[5]),
    (v_pid, 1, 'treatment', v_treat[5]),
    (v_pid, 2, 'medical_history', v_mh[6]),
    (v_pid, 2, 'physical_exam', v_pe[6]),
    (v_pid, 2, 'treatment', v_treat[6]);

  RAISE NOTICE 'Puzzle 2 created: %', v_pid;

  -- =============================================
  -- PUZZLE 3: Fácil - 4 diagnoses, 4 sections
  -- Uses: MH[1-4], PE[2-5], LAB[1-4], TREAT[1-4]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[1], v_all_diags[2], v_all_diags[3], v_all_diags[4]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Intermediário - Mix Clínico',
    '{clinica_medica,cirurgia,pediatria}',
    'facil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:12], 'physical_exam', v_pe[1:12], 'laboratory', v_lab[1:12], 'treatment', v_treat[1:12]),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    20, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[1]),
    (v_pid, 0, 'physical_exam', v_pe[2]),
    (v_pid, 0, 'laboratory', v_lab[1]),
    (v_pid, 0, 'treatment', v_treat[1]),
    (v_pid, 1, 'medical_history', v_mh[2]),
    (v_pid, 1, 'physical_exam', v_pe[3]),
    (v_pid, 1, 'laboratory', v_lab[2]),
    (v_pid, 1, 'treatment', v_treat[2]),
    (v_pid, 2, 'medical_history', v_mh[3]),
    (v_pid, 2, 'physical_exam', v_pe[4]),
    (v_pid, 2, 'laboratory', v_lab[3]),
    (v_pid, 2, 'treatment', v_treat[3]),
    (v_pid, 3, 'medical_history', v_mh[4]),
    (v_pid, 3, 'physical_exam', v_pe[5]),
    (v_pid, 3, 'laboratory', v_lab[4]),
    (v_pid, 3, 'treatment', v_treat[4]);

  RAISE NOTICE 'Puzzle 3 created: %', v_pid;

  -- =============================================
  -- PUZZLE 4: Fácil - 4 diagnoses
  -- Uses: MH[6-9], PE[6-9], LAB[5-8], TREAT[6-9]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[6], v_all_diags[7], v_all_diags[9], v_all_diags[10]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Cardiologia e Pneumologia',
    '{clinica_medica}',
    'facil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:12], 'physical_exam', v_pe[1:12], 'laboratory', v_lab[1:12], 'treatment', v_treat[1:12]),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    25, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[6]),
    (v_pid, 0, 'physical_exam', v_pe[6]),
    (v_pid, 0, 'laboratory', v_lab[5]),
    (v_pid, 0, 'treatment', v_treat[6]),
    (v_pid, 1, 'medical_history', v_mh[7]),
    (v_pid, 1, 'physical_exam', v_pe[7]),
    (v_pid, 1, 'laboratory', v_lab[6]),
    (v_pid, 1, 'treatment', v_treat[7]),
    (v_pid, 2, 'medical_history', v_mh[8]),
    (v_pid, 2, 'physical_exam', v_pe[8]),
    (v_pid, 2, 'laboratory', v_lab[7]),
    (v_pid, 2, 'treatment', v_treat[8]),
    (v_pid, 3, 'medical_history', v_mh[9]),
    (v_pid, 3, 'physical_exam', v_pe[9]),
    (v_pid, 3, 'laboratory', v_lab[8]),
    (v_pid, 3, 'treatment', v_treat[9]);

  RAISE NOTICE 'Puzzle 4 created: %', v_pid;

  -- =============================================
  -- PUZZLE 5: Fácil - 4 diagnoses
  -- Uses: MH[10-13], PE[10-13], LAB[9-12], TREAT[10-13]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[11], v_all_diags[12], v_all_diags[13], v_all_diags[14]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Cirurgia e Ginecologia',
    '{cirurgia,ginecologia_obstetricia}',
    'facil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[5:16], 'physical_exam', v_pe[5:14], 'laboratory', v_lab[5:14], 'treatment', v_treat[5:15]),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    25, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[10]),
    (v_pid, 0, 'physical_exam', v_pe[10]),
    (v_pid, 0, 'laboratory', v_lab[9]),
    (v_pid, 0, 'treatment', v_treat[10]),
    (v_pid, 1, 'medical_history', v_mh[11]),
    (v_pid, 1, 'physical_exam', v_pe[11]),
    (v_pid, 1, 'laboratory', v_lab[10]),
    (v_pid, 1, 'treatment', v_treat[11]),
    (v_pid, 2, 'medical_history', v_mh[12]),
    (v_pid, 2, 'physical_exam', v_pe[12]),
    (v_pid, 2, 'laboratory', v_lab[11]),
    (v_pid, 2, 'treatment', v_treat[12]),
    (v_pid, 3, 'medical_history', v_mh[13]),
    (v_pid, 3, 'physical_exam', v_pe[13]),
    (v_pid, 3, 'laboratory', v_lab[12]),
    (v_pid, 3, 'treatment', v_treat[13]);

  RAISE NOTICE 'Puzzle 5 created: %', v_pid;

  -- =============================================
  -- PUZZLE 6: Médio - 5 diagnoses, 4 sections
  -- Uses: MH[1-5], PE[1-5], LAB[1-5], TREAT[1-5]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[1], v_all_diags[2], v_all_diags[3], v_all_diags[4], v_all_diags[5]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Avançado - Casos Complexos',
    '{clinica_medica,cirurgia,pediatria}',
    'medio',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:14], 'physical_exam', v_pe[1:14], 'laboratory', v_lab[1:14], 'treatment', v_treat[1:14]),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    30, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[1]),
    (v_pid, 0, 'physical_exam', v_pe[1]),
    (v_pid, 0, 'laboratory', v_lab[1]),
    (v_pid, 0, 'treatment', v_treat[1]),
    (v_pid, 1, 'medical_history', v_mh[2]),
    (v_pid, 1, 'physical_exam', v_pe[2]),
    (v_pid, 1, 'laboratory', v_lab[2]),
    (v_pid, 1, 'treatment', v_treat[2]),
    (v_pid, 2, 'medical_history', v_mh[3]),
    (v_pid, 2, 'physical_exam', v_pe[3]),
    (v_pid, 2, 'laboratory', v_lab[3]),
    (v_pid, 2, 'treatment', v_treat[3]),
    (v_pid, 3, 'medical_history', v_mh[4]),
    (v_pid, 3, 'physical_exam', v_pe[4]),
    (v_pid, 3, 'laboratory', v_lab[4]),
    (v_pid, 3, 'treatment', v_treat[4]),
    (v_pid, 4, 'medical_history', v_mh[5]),
    (v_pid, 4, 'physical_exam', v_pe[5]),
    (v_pid, 4, 'laboratory', v_lab[5]),
    (v_pid, 4, 'treatment', v_treat[5]);

  RAISE NOTICE 'Puzzle 6 created: %', v_pid;

  -- =============================================
  -- PUZZLE 7: Médio - 5 diagnoses
  -- Uses: MH[6-10], PE[6-10], LAB[6-10], TREAT[6-10]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[6], v_all_diags[7], v_all_diags[8], v_all_diags[9], v_all_diags[10]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Médio - Especialidades Variadas',
    '{clinica_medica,cirurgia}',
    'medio',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[1:14], 'physical_exam', v_pe[1:14], 'laboratory', v_lab[1:14], 'treatment', v_treat[1:14]),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"]}',
    35, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[6]),
    (v_pid, 0, 'physical_exam', v_pe[6]),
    (v_pid, 0, 'laboratory', v_lab[6]),
    (v_pid, 0, 'treatment', v_treat[6]),
    (v_pid, 1, 'medical_history', v_mh[7]),
    (v_pid, 1, 'physical_exam', v_pe[7]),
    (v_pid, 1, 'laboratory', v_lab[7]),
    (v_pid, 1, 'treatment', v_treat[7]),
    (v_pid, 2, 'medical_history', v_mh[8]),
    (v_pid, 2, 'physical_exam', v_pe[8]),
    (v_pid, 2, 'laboratory', v_lab[8]),
    (v_pid, 2, 'treatment', v_treat[8]),
    (v_pid, 3, 'medical_history', v_mh[9]),
    (v_pid, 3, 'physical_exam', v_pe[9]),
    (v_pid, 3, 'laboratory', v_lab[9]),
    (v_pid, 3, 'treatment', v_treat[9]),
    (v_pid, 4, 'medical_history', v_mh[10]),
    (v_pid, 4, 'physical_exam', v_pe[10]),
    (v_pid, 4, 'laboratory', v_lab[10]),
    (v_pid, 4, 'treatment', v_treat[10]);

  RAISE NOTICE 'Puzzle 7 created: %', v_pid;

  -- =============================================
  -- PUZZLE 8: Médio - 5 diagnoses WITH imaging
  -- Uses: MH[10-14], PE[10-14], LAB[10-14], IMG[1-4], TREAT[10-14]
  -- SAFE: max PE=14, max LAB=14
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[11], v_all_diags[12], v_all_diags[13], v_all_diags[14], v_all_diags[15]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Médio - Diagnóstico por Imagem',
    '{cirurgia,ginecologia_obstetricia,pediatria}',
    'medio',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh[8:16], 'physical_exam', v_pe[8:14], 'laboratory', v_lab[8:14], 'imaging', v_img[1:4], 'treatment', v_treat[8:15]),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "imaging", "treatment"]}',
    35, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[10]),
    (v_pid, 0, 'physical_exam', v_pe[10]),
    (v_pid, 0, 'laboratory', v_lab[10]),
    (v_pid, 0, 'imaging', v_img[1]),
    (v_pid, 0, 'treatment', v_treat[10]),
    (v_pid, 1, 'medical_history', v_mh[11]),
    (v_pid, 1, 'physical_exam', v_pe[11]),
    (v_pid, 1, 'laboratory', v_lab[11]),
    (v_pid, 1, 'imaging', v_img[2]),
    (v_pid, 1, 'treatment', v_treat[11]),
    (v_pid, 2, 'medical_history', v_mh[12]),
    (v_pid, 2, 'physical_exam', v_pe[12]),
    (v_pid, 2, 'laboratory', v_lab[12]),
    (v_pid, 2, 'imaging', v_img[3]),
    (v_pid, 2, 'treatment', v_treat[12]),
    (v_pid, 3, 'medical_history', v_mh[13]),
    (v_pid, 3, 'physical_exam', v_pe[13]),
    (v_pid, 3, 'laboratory', v_lab[13]),
    (v_pid, 3, 'imaging', v_img[4]),
    (v_pid, 3, 'treatment', v_treat[13]),
    (v_pid, 4, 'medical_history', v_mh[14]),
    (v_pid, 4, 'physical_exam', v_pe[14]),
    (v_pid, 4, 'laboratory', v_lab[14]),
    (v_pid, 4, 'imaging', v_img[1]),
    (v_pid, 4, 'treatment', v_treat[14]);

  RAISE NOTICE 'Puzzle 8 created: %', v_pid;

  -- =============================================
  -- PUZZLE 9: Difícil - 6 diagnoses, 5 sections
  -- Uses mixed indices, all within safe bounds
  -- MAX: MH[14], PE[14], LAB[14], IMG[4], TREAT[14]
  -- =============================================
  v_temp_diags := ARRAY[v_all_diags[1], v_all_diags[3], v_all_diags[6], v_all_diags[7], v_all_diags[11], v_all_diags[14]];
  INSERT INTO cip_puzzles (title, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Desafiador - Múltiplas Áreas',
    '{clinica_medica,cirurgia,ginecologia_obstetricia}',
    'dificil',
    v_temp_diags,
    jsonb_build_object('medical_history', v_mh, 'physical_exam', v_pe, 'laboratory', v_lab, 'imaging', v_img, 'treatment', v_treat),
    '{"diagnosisCount": 6, "sections": ["medical_history", "physical_exam", "laboratory", "imaging", "treatment"]}',
    40, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', v_mh[1]),
    (v_pid, 0, 'physical_exam', v_pe[2]),
    (v_pid, 0, 'laboratory', v_lab[1]),
    (v_pid, 0, 'imaging', v_img[1]),
    (v_pid, 0, 'treatment', v_treat[1]),
    (v_pid, 1, 'medical_history', v_mh[3]),
    (v_pid, 1, 'physical_exam', v_pe[4]),
    (v_pid, 1, 'laboratory', v_lab[3]),
    (v_pid, 1, 'imaging', v_img[2]),
    (v_pid, 1, 'treatment', v_treat[3]),
    (v_pid, 2, 'medical_history', v_mh[6]),
    (v_pid, 2, 'physical_exam', v_pe[6]),
    (v_pid, 2, 'laboratory', v_lab[5]),
    (v_pid, 2, 'imaging', v_img[1]),
    (v_pid, 2, 'treatment', v_treat[6]),
    (v_pid, 3, 'medical_history', v_mh[7]),
    (v_pid, 3, 'physical_exam', v_pe[7]),
    (v_pid, 3, 'laboratory', v_lab[6]),
    (v_pid, 3, 'imaging', v_img[2]),
    (v_pid, 3, 'treatment', v_treat[7]),
    (v_pid, 4, 'medical_history', v_mh[11]),
    (v_pid, 4, 'physical_exam', v_pe[11]),
    (v_pid, 4, 'laboratory', v_lab[9]),
    (v_pid, 4, 'imaging', v_img[3]),
    (v_pid, 4, 'treatment', v_treat[11]),
    (v_pid, 5, 'medical_history', v_mh[14]),
    (v_pid, 5, 'physical_exam', v_pe[14]),
    (v_pid, 5, 'laboratory', v_lab[14]),
    (v_pid, 5, 'imaging', v_img[4]),
    (v_pid, 5, 'treatment', v_treat[14]);

  RAISE NOTICE 'Puzzle 9 created: %', v_pid;
  RAISE NOTICE '✅ All 9 puzzles created successfully!';
END $$;

-- Show final summary
SELECT difficulty, COUNT(*) as count
FROM cip_puzzles
GROUP BY difficulty
ORDER BY
  CASE difficulty
    WHEN 'muito_facil' THEN 1
    WHEN 'facil' THEN 2
    WHEN 'medio' THEN 3
    WHEN 'dificil' THEN 4
    ELSE 5
  END;
