-- ============================================
-- CIP Expanded Puzzles - 16 New Puzzles
-- ============================================
-- SAFE RE-RUNNABLE: Deletes puzzles by title before recreating
-- Run AFTER cip-expanded-data.sql
-- Covers all 5 difficulty levels and all 5 ENAMED areas

-- Helper function to find a finding by text prefix and section
CREATE OR REPLACE FUNCTION find_cip_finding(p_text_prefix TEXT, p_section TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM cip_findings
  WHERE text_pt LIKE p_text_prefix || '%' AND section = p_section
  LIMIT 1;
  IF v_id IS NULL THEN
    RAISE WARNING 'Finding not found: % [%]', p_text_prefix, p_section;
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to find a diagnosis by name prefix
CREATE OR REPLACE FUNCTION find_cip_diagnosis(p_name_prefix TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM cip_diagnoses
  WHERE name_pt LIKE p_name_prefix || '%'
  LIMIT 1;
  IF v_id IS NULL THEN
    RAISE WARNING 'Diagnosis not found: %', p_name_prefix;
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Delete old expanded puzzles (by title prefix) to allow re-run
DELETE FROM cip_puzzle_grid WHERE puzzle_id IN (
  SELECT id FROM cip_puzzles WHERE title LIKE 'EXP:%'
);
DELETE FROM cip_puzzles WHERE title LIKE 'EXP:%';

-- ============================================
-- PUZZLE 1: EXP: Clínica Básica (Muito Fácil)
-- 3 diagnoses, 3 sections (MH, PE, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Diabetes Mellitus');
  v_d2 := find_cip_diagnosis('Hipertensão Arterial');
  v_d3 := find_cip_diagnosis('Doença Diarreica');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Clínica Básica',
    'Diagnósticos comuns de clínica médica e pediatria. Ideal para iniciantes.',
    '{clinica_medica,pediatria}', 'muito_facil',
    ARRAY[v_d1, v_d2, v_d3],
    jsonb_build_object(
      'medical_history', v_all_mh[1:6],
      'physical_exam', v_all_pe[1:6],
      'treatment', v_all_treat[1:6]
    ),
    '{"diagnosisCount":3,"sections":["medical_history","physical_exam","treatment"],"distractorCount":2,"allowReuse":false}',
    15, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Polidipsia, poliúria', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Pele seca, cabelos', 'physical_exam')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Iniciar metformina', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Cefaleia occipital', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('PA: 160/100', 'physical_exam')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Iniciar losartana', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Criança 2 anos, diarreia', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Desidratação leve', 'physical_exam')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Soro de reidratação', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 2: EXP: Saúde Pública (Muito Fácil)
-- 3 diagnoses, 3 sections (MH, PE, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Dengue');
  v_d2 := find_cip_diagnosis('Tuberculose');
  v_d3 := find_cip_diagnosis('Hanseníase');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Saúde Pública',
    'Doenças de notificação compulsória. Foco em saúde coletiva.',
    '{saude_coletiva}', 'muito_facil',
    ARRAY[v_d1, v_d2, v_d3],
    jsonb_build_object(
      'medical_history', v_all_mh[1:6],
      'physical_exam', v_all_pe[1:6],
      'treatment', v_all_treat[1:6]
    ),
    '{"diagnosisCount":3,"sections":["medical_history","physical_exam","treatment"],"distractorCount":2,"allowReuse":false}',
    15, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Febre alta há 4 dias, mialgia', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Prova do laço positiva', 'physical_exam')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Hidratação vigorosa', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Tosse produtiva há mais de 3', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Crepitações em ápices', 'physical_exam')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Esquema RIPE', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Manchas hipocrômicas', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Espessamento de nervos', 'physical_exam')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Poliquimioterapia', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 3: EXP: Saúde Coletiva Completa (Fácil)
-- 4 diagnoses, 4 sections (MH, PE, LAB, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Dengue');
  v_d2 := find_cip_diagnosis('Tuberculose');
  v_d3 := find_cip_diagnosis('Hanseníase');
  v_d4 := find_cip_diagnosis('Leptospirose');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Saúde Coletiva Completa',
    'Doenças infecciosas de notificação compulsória com laboratório.',
    '{saude_coletiva}', 'facil',
    ARRAY[v_d1, v_d2, v_d3, v_d4],
    jsonb_build_object(
      'medical_history', v_all_mh[1:8],
      'physical_exam', v_all_pe[1:8],
      'laboratory', v_all_lab[1:8],
      'treatment', v_all_treat[1:8]
    ),
    '{"diagnosisCount":4,"sections":["medical_history","physical_exam","laboratory","treatment"],"distractorCount":2,"allowReuse":false}',
    20, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Febre alta há 4 dias, mialgia', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Prova do laço positiva', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Plaquetopenia', 'laboratory')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Hidratação vigorosa', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Tosse produtiva há mais de 3', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Crepitações em ápices', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('BAAR positivo', 'laboratory')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Esquema RIPE', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Manchas hipocrômicas', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Espessamento de nervos', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Baciloscopia de linfa', 'laboratory')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Poliquimioterapia', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Febre, mialgia intensa em panturrilhas', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Icterícia rubínica', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Bilirrubina direta elevada, creatinina', 'laboratory')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Penicilina cristalina EV', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 4: EXP: Pediatria Básica (Fácil)
-- 4 diagnoses, 4 sections (MH, PE, LAB, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Doença Diarreica');
  v_d2 := find_cip_diagnosis('Bronquiolite');
  v_d3 := find_cip_diagnosis('Desidratação');
  v_d4 := find_cip_diagnosis('Crise Asmática');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Pediatria Básica',
    'Urgências pediátricas comuns: diarreia, bronquiolite, desidratação e asma.',
    '{pediatria}', 'facil',
    ARRAY[v_d1, v_d2, v_d3, v_d4],
    jsonb_build_object(
      'medical_history', v_all_mh[1:8],
      'physical_exam', v_all_pe[1:8],
      'laboratory', v_all_lab[1:8],
      'treatment', v_all_treat[1:8]
    ),
    '{"diagnosisCount":4,"sections":["medical_history","physical_exam","laboratory","treatment"],"distractorCount":2,"allowReuse":false}',
    20, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Criança 2 anos, diarreia', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Desidratação leve', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('TGO rápido', 'laboratory')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Soro de reidratação', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Lactente 6 meses, coriza', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Tiragem subcostal, sibilos e crep', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('SatO2: 92%', 'laboratory')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('O2 suplementar + aspiração', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Lactente 8 meses com diarreia', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Olhos encovados, turgor', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Na: 128 mEq/L', 'laboratory')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('SF 0.9% 20mL/kg', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Criança 5 anos com dispneia', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Tiragem intercostal e subcostal, sibilos difusos bilat', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('SatO2: 88%', 'laboratory')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Salbutamol NBZ', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 5: EXP: Cirurgia Geral (Fácil)
-- 4 diagnoses, 4 sections (MH, PE, LAB, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Apendicite');
  v_d2 := find_cip_diagnosis('Colecistite');
  v_d3 := find_cip_diagnosis('Obstrução Intestinal');
  v_d4 := find_cip_diagnosis('Hérnia Inguinal');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Cirurgia Geral',
    'Abdome agudo e emergências cirúrgicas do aparelho digestivo.',
    '{cirurgia}', 'facil',
    ARRAY[v_d1, v_d2, v_d3, v_d4],
    jsonb_build_object(
      'medical_history', v_all_mh[1:8],
      'physical_exam', v_all_pe[1:8],
      'laboratory', v_all_lab[1:8],
      'treatment', v_all_treat[1:8]
    ),
    '{"diagnosisCount":4,"sections":["medical_history","physical_exam","laboratory","treatment"],"distractorCount":2,"allowReuse":false}',
    25, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Dor abdominal migratória', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Sinal de Blumberg', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Leucocitose 18.000', 'laboratory')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Apendicectomia videolaparoscópica', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Dor em HD pós-prandial', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Sinal de Murphy', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Leucocitose, bilirrubinas levemente', 'laboratory')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Colecistectomia', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Parada de eliminação de fezes', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Distensão abdominal, RHA metálicos', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Hipocalemia', 'laboratory')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Descompressão com SNG', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Abaulamento inguinal', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Massa inguinal tensa', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Leucocitose discreta (12.000)', 'laboratory')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Herniorrafia inguinal', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 6: EXP: Cardiopulmonar (Médio)
-- 5 diagnoses, 5 sections (MH, PE, LAB, IMG, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Insuficiência Cardíaca');
  v_d2 := find_cip_diagnosis('Infarto Agudo');
  v_d3 := find_cip_diagnosis('DPOC');
  v_d4 := find_cip_diagnosis('Asma Brônquica');
  v_d5 := find_cip_diagnosis('Tromboembolismo');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Cardiopulmonar',
    'Doenças cardiovasculares e pulmonares com imagem. Diferencial de dispneia.',
    '{clinica_medica}', 'medio',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5],
    jsonb_build_object(
      'medical_history', v_all_mh[1:10],
      'physical_exam', v_all_pe[1:10],
      'laboratory', v_all_lab[1:10],
      'imaging', v_all_img[1:10],
      'treatment', v_all_treat[1:10]
    ),
    '{"diagnosisCount":5,"sections":["medical_history","physical_exam","laboratory","imaging","treatment"],"distractorCount":3,"allowReuse":false}',
    30, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Dispneia paroxística noturna', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('B3 em foco mitral', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('BNP elevado', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('RX tórax: cardiomegalia', 'imaging')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Furosemida 40mg', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Dor torácica em aperto há 2 horas', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Sudorese fria', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Troponina elevada', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('ECG: supra de ST', 'imaging')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Cateterismo + angioplastia', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Tabagismo 40 maços', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('MV difusamente diminuído', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Espirometria: VEF1', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('RX tórax: hiperinsuflação, retificação', 'imaging')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Broncodilatador de longa', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Sibilância e tosse noturna', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Sibilos difusos à ausculta', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Pico de fluxo expiratório', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('RX tórax: hiperinsuflação bilateral (durante', 'imaging')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Salbutamol spray + corticoide', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Dispneia súbita e dor torácica pleurítica', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Taquicardia (FC 120)', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('D-dímero > 500', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('AngioTC de tórax', 'imaging')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Heparina não-fracionada', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 7: EXP: Obstetrícia Completa (Médio)
-- 5 diagnoses, 5 sections (MH, PE, LAB, IMG, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Pré-eclâmpsia');
  v_d2 := find_cip_diagnosis('ITU na Gestação');
  v_d3 := find_cip_diagnosis('Placenta Prévia');
  v_d4 := find_cip_diagnosis('Síndrome HELLP');
  v_d5 := find_cip_diagnosis('Trabalho de Parto Prematuro');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Obstetrícia Completa',
    'Emergências obstétricas: sangramento, hipertensão e prematuridade.',
    '{ginecologia_obstetricia}', 'medio',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5],
    jsonb_build_object(
      'medical_history', v_all_mh[1:10],
      'physical_exam', v_all_pe[1:10],
      'laboratory', v_all_lab[1:10],
      'imaging', v_all_img[1:10],
      'treatment', v_all_treat[1:10]
    ),
    '{"diagnosisCount":5,"sections":["medical_history","physical_exam","laboratory","imaging","treatment"],"distractorCount":3,"allowReuse":false}',
    30, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Gestante 34 semanas, PA elevada', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('PA: 160/110 mmHg, edema generalizado', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Proteinúria 24h > 300mg', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('USG obstétrica com Doppler: incisura', 'imaging')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Sulfato de magnésio + anti-hipertensivo', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Gestante com disúria', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Punho-percussão lombar negativa', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('EAS: leucocitúria', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('USG rins e vias urinárias', 'imaging')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Cefalexina 500mg', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Sangramento vaginal indolor', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Útero indolor e normotônico', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Hemograma: Hb 9.0', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('USG obstétrica: placenta recobrindo', 'imaging')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Internação + corticoide para maturação', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Gestante 35 semanas com mal-estar', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('PA: 170/110 mmHg, edema facial', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Hemólise (LDH > 600', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('USG hepática: hematoma', 'imaging')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Sulfato de magnésio + resolução imediata', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Gestante 30 semanas com contrações', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Colo uterino com 3cm', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Fibronectina fetal', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('USG transvaginal: colo', 'imaging')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Nifedipino (tocolítico)', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 8: EXP: Pediatria Avançada (Médio)
-- 5 diagnoses, 5 sections (MH, PE, LAB, IMG, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Bronquiolite');
  v_d2 := find_cip_diagnosis('Meningite');
  v_d3 := find_cip_diagnosis('Desidratação');
  v_d4 := find_cip_diagnosis('Crise Asmática');
  v_d5 := find_cip_diagnosis('Doença Diarreica');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Pediatria Avançada',
    'Diagnóstico diferencial pediátrico completo com imagem.',
    '{pediatria}', 'medio',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5],
    jsonb_build_object(
      'medical_history', v_all_mh[1:10],
      'physical_exam', v_all_pe[1:10],
      'laboratory', v_all_lab[1:10],
      'imaging', v_all_img[1:10],
      'treatment', v_all_treat[1:10]
    ),
    '{"diagnosisCount":5,"sections":["medical_history","physical_exam","laboratory","imaging","treatment"],"distractorCount":3,"allowReuse":false}',
    30, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Lactente 6 meses, coriza', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Tiragem subcostal, sibilos e crep', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('SatO2: 92%', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('RX tórax: hiperinsuflação com atelectasia', 'imaging')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('O2 suplementar + aspiração', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Criança 3 anos com febre alta, vômitos', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Rigidez de nuca', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Líquor: pleocitose', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('TC crânio: sem sinais de hipertensão', 'imaging')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Ceftriaxona 100mg', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Lactente 8 meses com diarreia', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Olhos encovados, turgor', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Na: 128 mEq/L', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('RX abdome: distensão gasosa difusa sem níveis', 'imaging')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('SF 0.9% 20mL/kg', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Criança 5 anos com dispneia', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Tiragem intercostal e subcostal, sibilos difusos bilat', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('SatO2: 88%', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('RX tórax: hiperinsuflação pulmonar bilateral com retifi', 'imaging')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Salbutamol NBZ', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Criança 2 anos, diarreia', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Desidratação leve', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('TGO rápido', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('RX abdome: distensão de alças com padrão gasoso', 'imaging')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Soro de reidratação', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 9: EXP: Emergências Clínicas (Médio)
-- 5 diagnoses, 5 sections (MH, PE, LAB, IMG, TREAT)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Infarto Agudo');
  v_d2 := find_cip_diagnosis('AVC Isquêmico');
  v_d3 := find_cip_diagnosis('Tromboembolismo');
  v_d4 := find_cip_diagnosis('Cirrose');
  v_d5 := find_cip_diagnosis('Leptospirose');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Emergências Clínicas',
    'Emergências médicas: AVC, IAM, TEP, cirrose e leptospirose.',
    '{clinica_medica,saude_coletiva}', 'medio',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5],
    jsonb_build_object(
      'medical_history', v_all_mh[1:10],
      'physical_exam', v_all_pe[1:10],
      'laboratory', v_all_lab[1:10],
      'imaging', v_all_img[1:10],
      'treatment', v_all_treat[1:10]
    ),
    '{"diagnosisCount":5,"sections":["medical_history","physical_exam","laboratory","imaging","treatment"],"distractorCount":3,"allowReuse":true}',
    35, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Dor torácica em aperto há 2 horas', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Sudorese fria', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Troponina elevada', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('ECG: supra de ST', 'imaging')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Cateterismo + angioplastia', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Déficit neurológico súbito', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Desvio de rima labial', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Glicemia 110 mg/dL', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('TC crânio: hipodensidade', 'imaging')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Trombólise com alteplase', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Dispneia súbita e dor torácica pleurítica', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Taquicardia (FC 120)', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('D-dímero > 500', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('AngioTC de tórax', 'imaging')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Heparina não-fracionada', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Etilismo crônico há 20 anos', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Ascite volumosa', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Albumina < 3.0', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('USG abdominal: fígado reduzido', 'imaging')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Espironolactona + furosemida', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Febre, mialgia intensa em panturrilhas', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Icterícia rubínica', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Bilirrubina direta elevada, creatinina', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('RX tórax: infiltrado alveolar bilateral', 'imaging')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Penicilina cristalina EV', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 10: EXP: Grande Clínica (Difícil)
-- 6 diagnoses, 6 sections (ALL including pathology)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Diabetes Mellitus');
  v_d2 := find_cip_diagnosis('Hipertensão Arterial');
  v_d3 := find_cip_diagnosis('Insuficiência Cardíaca');
  v_d4 := find_cip_diagnosis('Cirrose');
  v_d5 := find_cip_diagnosis('AVC Isquêmico');
  v_d6 := find_cip_diagnosis('Hipotireoidismo');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Grande Clínica',
    'Doenças crônicas e emergências da clínica médica com histopatologia.',
    '{clinica_medica}', 'dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6],
    jsonb_build_object(
      'medical_history', v_all_mh[1:12],
      'physical_exam', v_all_pe[1:12],
      'laboratory', v_all_lab[1:12],
      'imaging', v_all_img[1:12],
      'pathology', v_all_patho[1:12],
      'treatment', v_all_treat[1:12]
    ),
    '{"diagnosisCount":6,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":3,"allowReuse":true}',
    40, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Polidipsia, poliúria', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Pele seca, cabelos', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Glicemia de jejum: 180', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('Fundoscopia: microaneurismas', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Infiltração mixedematosa', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Iniciar metformina', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Cefaleia occipital', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('PA: 160/100', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('HbA1c: 8.5', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('ECG: sobrecarga ventricular', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Miocardiopatia dilatada', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Iniciar losartana', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Dispneia paroxística noturna', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('B3 em foco mitral', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('BNP elevado', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('RX tórax: cardiomegalia', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Necrose coagulativa do miocárdio', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Furosemida 40mg', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Etilismo crônico há 20 anos', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Ascite volumosa', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Albumina < 3.0', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('USG abdominal: fígado reduzido', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Fibrose portal em pontes', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Espironolactona + furosemida', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Déficit neurológico súbito', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Desvio de rima labial', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Glicemia 110 mg/dL', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('TC crânio: hipodensidade', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Necrose de liquefação', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Trombólise com alteplase', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Cansaço extremo, ganho de peso', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Pele seca, cabelos quebradiços, edema periorb', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('TSH elevado', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('USG tireoide: tireoide reduzida', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Infiltração mixedematosa', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Levotiroxina 50mcg', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 11: EXP: Infectologia (Difícil)
-- 6 diagnoses, 6 sections (ALL)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Tuberculose');
  v_d2 := find_cip_diagnosis('Dengue');
  v_d3 := find_cip_diagnosis('Hanseníase');
  v_d4 := find_cip_diagnosis('Leptospirose');
  v_d5 := find_cip_diagnosis('Pneumonia Adquirida');
  v_d6 := find_cip_diagnosis('Meningite');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Infectologia',
    'Doenças infecciosas graves com patologia. TB, dengue, leptospirose e mais.',
    '{saude_coletiva,clinica_medica,pediatria}', 'dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6],
    jsonb_build_object(
      'medical_history', v_all_mh[1:12],
      'physical_exam', v_all_pe[1:12],
      'laboratory', v_all_lab[1:12],
      'imaging', v_all_img[1:12],
      'pathology', v_all_patho[1:12],
      'treatment', v_all_treat[1:12]
    ),
    '{"diagnosisCount":6,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":3,"allowReuse":true}',
    40, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Tosse produtiva há mais de 3', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Crepitações em ápices', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('BAAR positivo', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('RX tórax: infiltrado em ápices com cavit', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Granuloma caseoso', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Esquema RIPE', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Febre alta há 4 dias, mialgia', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Prova do laço positiva', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Plaquetopenia', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('USG abdominal: líquido livre', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Infiltrado linfoplasmocitário perivascular', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Hidratação vigorosa', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Manchas hipocrômicas', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Espessamento de nervos', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Baciloscopia de linfa', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('Eletroneuromiografia', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Granuloma com células epitelioides e bacilos de Hansen', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Poliquimioterapia', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Febre, mialgia intensa em panturrilhas', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Icterícia rubínica', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Bilirrubina direta elevada, creatinina', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('RX tórax: infiltrado alveolar bilateral', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Necrose tubular aguda com infiltrado inflamatório intersticial', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Penicilina cristalina EV', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Febre alta e tosse produtiva há 5', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('MV diminuído em base direita', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Leucocitose 18.000', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('RX tórax: consolidação lobar', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Necrose do epitélio bronquiolar', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Amoxicilina + clavulanato', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Criança 3 anos com febre alta, vômitos', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Rigidez de nuca', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Líquor: pleocitose', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('TC crânio: sem sinais de hipertensão', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Exsudato purulento leptomeníngeo', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Ceftriaxona 100mg', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 12: EXP: Cirurgia + Emergência (Difícil)
-- 6 diagnoses, 6 sections (ALL)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Apendicite');
  v_d2 := find_cip_diagnosis('Colecistite');
  v_d3 := find_cip_diagnosis('Hemorragia Digestiva');
  v_d4 := find_cip_diagnosis('Obstrução Intestinal');
  v_d5 := find_cip_diagnosis('Hérnia Inguinal');
  v_d6 := find_cip_diagnosis('Infarto Agudo');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Cirurgia + Emergência',
    'Abdome agudo cirúrgico e emergência cardiovascular com patologia.',
    '{cirurgia,clinica_medica}', 'dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6],
    jsonb_build_object(
      'medical_history', v_all_mh[1:12],
      'physical_exam', v_all_pe[1:12],
      'laboratory', v_all_lab[1:12],
      'imaging', v_all_img[1:12],
      'pathology', v_all_patho[1:12],
      'treatment', v_all_treat[1:12]
    ),
    '{"diagnosisCount":6,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":3,"allowReuse":true}',
    40, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Dor abdominal migratória', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Sinal de Blumberg', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Leucocitose 18.000', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('TC abdome: apêndice > 6mm', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Infiltrado neutrofílico transmural da vesícula', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Apendicectomia videolaparoscópica', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Dor em HD pós-prandial', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Sinal de Murphy', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Leucocitose, bilirrubinas levemente', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('USG: cálculo impactado', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Infiltrado neutrofílico transmural da vesícula', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Colecistectomia', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Melena há 2 dias', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Palidez cutâneo-mucosa, taquicardia', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Hb: 7.5 g/dL', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('EDA: úlcera gástrica', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Úlcera péptica com erosão', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Omeprazol EV + hemotransfusão', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Parada de eliminação de fezes', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Distensão abdominal, RHA metálicos', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Hipocalemia', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('RX abdome: níveis hidroaéreos', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Isquemia de parede intestinal', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Descompressão com SNG', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Abaulamento inguinal', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Massa inguinal tensa', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Leucocitose discreta (12.000)', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('USG inguinal: conteúdo herniário', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Edema e congestão venosa', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Herniorrafia inguinal', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Dor torácica em aperto há 2 horas', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Sudorese fria', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Troponina elevada', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('ECG: supra de ST', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Necrose coagulativa do miocárdio', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Cateterismo + angioplastia', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 13: EXP: Materno-Infantil (Difícil)
-- 6 diagnoses, 6 sections (ALL)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Pré-eclâmpsia');
  v_d2 := find_cip_diagnosis('Síndrome HELLP');
  v_d3 := find_cip_diagnosis('Placenta Prévia');
  v_d4 := find_cip_diagnosis('Trabalho de Parto Prematuro');
  v_d5 := find_cip_diagnosis('Bronquiolite');
  v_d6 := find_cip_diagnosis('Meningite');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Materno-Infantil',
    'Emergências obstétricas e pediátricas com histopatologia completa.',
    '{ginecologia_obstetricia,pediatria}', 'dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6],
    jsonb_build_object(
      'medical_history', v_all_mh[1:12],
      'physical_exam', v_all_pe[1:12],
      'laboratory', v_all_lab[1:12],
      'imaging', v_all_img[1:12],
      'pathology', v_all_patho[1:12],
      'treatment', v_all_treat[1:12]
    ),
    '{"diagnosisCount":6,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":3,"allowReuse":true}',
    40, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Gestante 34 semanas, PA elevada', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('PA: 160/110 mmHg, edema generalizado', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Proteinúria 24h > 300mg', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('USG obstétrica com Doppler: incisura', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Endoteliose glomerular', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Sulfato de magnésio + anti-hipertensivo', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Gestante 35 semanas com mal-estar', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('PA: 170/110 mmHg, edema facial', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Hemólise (LDH > 600', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('USG hepática: hematoma', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Necrose hemorrágica periportal', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Sulfato de magnésio + resolução imediata', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Sangramento vaginal indolor', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Útero indolor e normotônico', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Hemograma: Hb 9.0', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('USG obstétrica: placenta recobrindo', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Vilosidades coriônicas com vasos dilatados', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Internação + corticoide para maturação', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Gestante 30 semanas com contrações', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Colo uterino com 3cm', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Fibronectina fetal', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('USG transvaginal: colo', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Inflamação corioamniótica', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Nifedipino (tocolítico)', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Lactente 6 meses, coriza', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Tiragem subcostal, sibilos e crep', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('SatO2: 92%', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('RX tórax: hiperinsuflação com atelectasia', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Necrose do epitélio bronquiolar', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('O2 suplementar + aspiração', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Criança 3 anos com febre alta, vômitos', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Rigidez de nuca', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Líquor: pleocitose', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('TC crânio: sem sinais de hipertensão', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Exsudato purulento leptomeníngeo', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Ceftriaxona 100mg', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 14: EXP: Desafio Total I (Muito Difícil)
-- 7 diagnoses, 6 sections (ALL)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID; v_d7 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Insuficiência Cardíaca');
  v_d2 := find_cip_diagnosis('Infarto Agudo');
  v_d3 := find_cip_diagnosis('AVC Isquêmico');
  v_d4 := find_cip_diagnosis('Tromboembolismo');
  v_d5 := find_cip_diagnosis('Cirrose');
  v_d6 := find_cip_diagnosis('DPOC');
  v_d7 := find_cip_diagnosis('Leptospirose');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Desafio Total I',
    'Desafio máximo: 7 diagnósticos com todas as 6 seções. Emergências clínicas.',
    '{clinica_medica,saude_coletiva}', 'muito_dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6, v_d7],
    jsonb_build_object(
      'medical_history', v_all_mh[1:14],
      'physical_exam', v_all_pe[1:14],
      'laboratory', v_all_lab[1:14],
      'imaging', v_all_img[1:14],
      'pathology', v_all_patho[1:14],
      'treatment', v_all_treat[1:14]
    ),
    '{"diagnosisCount":7,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":4,"allowReuse":true}',
    45, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Dispneia paroxística noturna', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('B3 em foco mitral', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('BNP elevado', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('RX tórax: cardiomegalia', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Miocardiopatia dilatada', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Furosemida 40mg', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Dor torácica em aperto há 2 horas', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Sudorese fria', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Troponina elevada', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('ECG: supra de ST', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Necrose coagulativa do miocárdio', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Cateterismo + angioplastia', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Déficit neurológico súbito', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Desvio de rima labial', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Glicemia 110 mg/dL', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('TC crânio: hipodensidade', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Necrose de liquefação', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Trombólise com alteplase', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Dispneia súbita e dor torácica pleurítica', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Taquicardia (FC 120)', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('D-dímero > 500', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('AngioTC de tórax', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Trombo organizado', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Heparina não-fracionada', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Etilismo crônico há 20 anos', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Ascite volumosa', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Albumina < 3.0', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('USG abdominal: fígado reduzido', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Fibrose portal em pontes', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Espironolactona + furosemida', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Tabagismo 40 maços', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('MV difusamente diminuído', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Espirometria: VEF1', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('RX tórax: hiperinsuflação, retificação', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Destruição de septos alveolares', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Broncodilatador de longa', 'treatment')),
    (v_puzzle_id, 6, 'medical_history', find_cip_finding('Febre, mialgia intensa em panturrilhas', 'medical_history')),
    (v_puzzle_id, 6, 'physical_exam', find_cip_finding('Icterícia rubínica', 'physical_exam')),
    (v_puzzle_id, 6, 'laboratory', find_cip_finding('Bilirrubina direta elevada, creatinina', 'laboratory')),
    (v_puzzle_id, 6, 'imaging', find_cip_finding('RX tórax: infiltrado alveolar bilateral', 'imaging')),
    (v_puzzle_id, 6, 'pathology', find_cip_finding('Necrose tubular aguda com infiltrado inflamatório intersticial', 'pathology')),
    (v_puzzle_id, 6, 'treatment', find_cip_finding('Penicilina cristalina EV', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 15: EXP: Desafio Total II (Muito Difícil)
-- 7 diagnoses, 6 sections (ALL)
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID; v_d7 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Dengue');
  v_d2 := find_cip_diagnosis('Tuberculose');
  v_d3 := find_cip_diagnosis('Meningite');
  v_d4 := find_cip_diagnosis('Síndrome HELLP');
  v_d5 := find_cip_diagnosis('Hemorragia Digestiva');
  v_d6 := find_cip_diagnosis('Obstrução Intestinal');
  v_d7 := find_cip_diagnosis('Crise Asmática');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: Desafio Total II',
    'Desafio extremo: infectologia, obstetrícia, cirurgia e pediatria juntos.',
    '{saude_coletiva,ginecologia_obstetricia,cirurgia,pediatria}', 'muito_dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6, v_d7],
    jsonb_build_object(
      'medical_history', v_all_mh[1:14],
      'physical_exam', v_all_pe[1:14],
      'laboratory', v_all_lab[1:14],
      'imaging', v_all_img[1:14],
      'pathology', v_all_patho[1:14],
      'treatment', v_all_treat[1:14]
    ),
    '{"diagnosisCount":7,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":4,"allowReuse":true}',
    45, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Febre alta há 4 dias, mialgia', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Prova do laço positiva', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Plaquetopenia', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('USG abdominal: líquido livre', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Infiltrado linfoplasmocitário perivascular', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Hidratação vigorosa', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Tosse produtiva há mais de 3', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Crepitações em ápices', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('BAAR positivo', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('RX tórax: infiltrado em ápices com cavit', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Granuloma caseoso', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Esquema RIPE', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Criança 3 anos com febre alta, vômitos', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('Rigidez de nuca', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Líquor: pleocitose', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('TC crânio: sem sinais de hipertensão', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Exsudato purulento leptomeníngeo', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Ceftriaxona 100mg', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Gestante 35 semanas com mal-estar', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('PA: 170/110 mmHg, edema facial', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Hemólise (LDH > 600', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('USG hepática: hematoma', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Necrose hemorrágica periportal', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Sulfato de magnésio + resolução imediata', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Melena há 2 dias', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Palidez cutâneo-mucosa, taquicardia', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('Hb: 7.5 g/dL', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('EDA: úlcera gástrica', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Úlcera péptica com erosão', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Omeprazol EV + hemotransfusão', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Parada de eliminação de fezes', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Distensão abdominal, RHA metálicos', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Hipocalemia', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('RX abdome: níveis hidroaéreos', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Isquemia de parede intestinal', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Descompressão com SNG', 'treatment')),
    (v_puzzle_id, 6, 'medical_history', find_cip_finding('Criança 5 anos com dispneia', 'medical_history')),
    (v_puzzle_id, 6, 'physical_exam', find_cip_finding('Tiragem intercostal e subcostal, sibilos difusos bilat', 'physical_exam')),
    (v_puzzle_id, 6, 'laboratory', find_cip_finding('SatO2: 88%', 'laboratory')),
    (v_puzzle_id, 6, 'imaging', find_cip_finding('RX tórax: hiperinsuflação pulmonar bilateral com retifi', 'imaging')),
    (v_puzzle_id, 6, 'pathology', find_cip_finding('Espessamento de membrana basal brônquica com hiperplasia de células caliciformes', 'pathology')),
    (v_puzzle_id, 6, 'treatment', find_cip_finding('Salbutamol NBZ', 'treatment'));
END $$;

-- ============================================
-- PUZZLE 16: EXP: ENAMED Simulado (Muito Difícil)
-- 7 diagnoses, 6 sections (ALL) - All 5 areas
-- ============================================
DO $$
DECLARE
  v_puzzle_id UUID;
  v_d1 UUID; v_d2 UUID; v_d3 UUID; v_d4 UUID; v_d5 UUID; v_d6 UUID; v_d7 UUID;
  v_all_mh UUID[]; v_all_pe UUID[]; v_all_lab UUID[]; v_all_img UUID[]; v_all_patho UUID[]; v_all_treat UUID[];
BEGIN
  v_d1 := find_cip_diagnosis('Diabetes Mellitus');
  v_d2 := find_cip_diagnosis('Apendicite');
  v_d3 := find_cip_diagnosis('Pré-eclâmpsia');
  v_d4 := find_cip_diagnosis('Meningite');
  v_d5 := find_cip_diagnosis('Tuberculose');
  v_d6 := find_cip_diagnosis('AVC Isquêmico');
  v_d7 := find_cip_diagnosis('Cirrose');

  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_img FROM cip_findings WHERE section = 'imaging';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_patho FROM cip_findings WHERE section = 'pathology';
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_all_treat FROM cip_findings WHERE section = 'treatment';

  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'EXP: ENAMED Simulado',
    'Simulado completo ENAMED: 7 diagnósticos de todas as 5 grandes áreas.',
    '{clinica_medica,cirurgia,ginecologia_obstetricia,pediatria,saude_coletiva}', 'muito_dificil',
    ARRAY[v_d1, v_d2, v_d3, v_d4, v_d5, v_d6, v_d7],
    jsonb_build_object(
      'medical_history', v_all_mh[1:14],
      'physical_exam', v_all_pe[1:14],
      'laboratory', v_all_lab[1:14],
      'imaging', v_all_img[1:14],
      'pathology', v_all_patho[1:14],
      'treatment', v_all_treat[1:14]
    ),
    '{"diagnosisCount":7,"sections":["medical_history","physical_exam","laboratory","imaging","pathology","treatment"],"distractorCount":4,"allowReuse":true}',
    45, 'practice', true
  ) RETURNING id INTO v_puzzle_id;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_puzzle_id, 0, 'medical_history', find_cip_finding('Polidipsia, poliúria', 'medical_history')),
    (v_puzzle_id, 0, 'physical_exam', find_cip_finding('Pele seca, cabelos', 'physical_exam')),
    (v_puzzle_id, 0, 'laboratory', find_cip_finding('Glicemia de jejum: 180', 'laboratory')),
    (v_puzzle_id, 0, 'imaging', find_cip_finding('Fundoscopia: microaneurismas', 'imaging')),
    (v_puzzle_id, 0, 'pathology', find_cip_finding('Infiltração mixedematosa', 'pathology')),
    (v_puzzle_id, 0, 'treatment', find_cip_finding('Iniciar metformina', 'treatment')),
    (v_puzzle_id, 1, 'medical_history', find_cip_finding('Dor abdominal migratória', 'medical_history')),
    (v_puzzle_id, 1, 'physical_exam', find_cip_finding('Sinal de Blumberg', 'physical_exam')),
    (v_puzzle_id, 1, 'laboratory', find_cip_finding('Leucocitose 18.000', 'laboratory')),
    (v_puzzle_id, 1, 'imaging', find_cip_finding('TC abdome: apêndice > 6mm', 'imaging')),
    (v_puzzle_id, 1, 'pathology', find_cip_finding('Infiltrado neutrofílico transmural da vesícula', 'pathology')),
    (v_puzzle_id, 1, 'treatment', find_cip_finding('Apendicectomia videolaparoscópica', 'treatment')),
    (v_puzzle_id, 2, 'medical_history', find_cip_finding('Gestante 34 semanas, PA elevada', 'medical_history')),
    (v_puzzle_id, 2, 'physical_exam', find_cip_finding('PA: 160/110 mmHg, edema generalizado', 'physical_exam')),
    (v_puzzle_id, 2, 'laboratory', find_cip_finding('Proteinúria 24h > 300mg', 'laboratory')),
    (v_puzzle_id, 2, 'imaging', find_cip_finding('USG obstétrica com Doppler: incisura', 'imaging')),
    (v_puzzle_id, 2, 'pathology', find_cip_finding('Endoteliose glomerular', 'pathology')),
    (v_puzzle_id, 2, 'treatment', find_cip_finding('Sulfato de magnésio + anti-hipertensivo', 'treatment')),
    (v_puzzle_id, 3, 'medical_history', find_cip_finding('Criança 3 anos com febre alta, vômitos', 'medical_history')),
    (v_puzzle_id, 3, 'physical_exam', find_cip_finding('Rigidez de nuca', 'physical_exam')),
    (v_puzzle_id, 3, 'laboratory', find_cip_finding('Líquor: pleocitose', 'laboratory')),
    (v_puzzle_id, 3, 'imaging', find_cip_finding('TC crânio: sem sinais de hipertensão', 'imaging')),
    (v_puzzle_id, 3, 'pathology', find_cip_finding('Exsudato purulento leptomeníngeo', 'pathology')),
    (v_puzzle_id, 3, 'treatment', find_cip_finding('Ceftriaxona 100mg', 'treatment')),
    (v_puzzle_id, 4, 'medical_history', find_cip_finding('Tosse produtiva há mais de 3', 'medical_history')),
    (v_puzzle_id, 4, 'physical_exam', find_cip_finding('Crepitações em ápices', 'physical_exam')),
    (v_puzzle_id, 4, 'laboratory', find_cip_finding('BAAR positivo', 'laboratory')),
    (v_puzzle_id, 4, 'imaging', find_cip_finding('RX tórax: infiltrado em ápices com cavit', 'imaging')),
    (v_puzzle_id, 4, 'pathology', find_cip_finding('Granuloma caseoso', 'pathology')),
    (v_puzzle_id, 4, 'treatment', find_cip_finding('Esquema RIPE', 'treatment')),
    (v_puzzle_id, 5, 'medical_history', find_cip_finding('Déficit neurológico súbito', 'medical_history')),
    (v_puzzle_id, 5, 'physical_exam', find_cip_finding('Desvio de rima labial', 'physical_exam')),
    (v_puzzle_id, 5, 'laboratory', find_cip_finding('Glicemia 110 mg/dL', 'laboratory')),
    (v_puzzle_id, 5, 'imaging', find_cip_finding('TC crânio: hipodensidade', 'imaging')),
    (v_puzzle_id, 5, 'pathology', find_cip_finding('Necrose de liquefação', 'pathology')),
    (v_puzzle_id, 5, 'treatment', find_cip_finding('Trombólise com alteplase', 'treatment')),
    (v_puzzle_id, 6, 'medical_history', find_cip_finding('Etilismo crônico há 20 anos', 'medical_history')),
    (v_puzzle_id, 6, 'physical_exam', find_cip_finding('Ascite volumosa', 'physical_exam')),
    (v_puzzle_id, 6, 'laboratory', find_cip_finding('Albumina < 3.0', 'laboratory')),
    (v_puzzle_id, 6, 'imaging', find_cip_finding('USG abdominal: fígado reduzido', 'imaging')),
    (v_puzzle_id, 6, 'pathology', find_cip_finding('Fibrose portal em pontes', 'pathology')),
    (v_puzzle_id, 6, 'treatment', find_cip_finding('Espironolactona + furosemida', 'treatment'));
END $$;

-- Cleanup helper functions
DROP FUNCTION IF EXISTS find_cip_finding(TEXT, TEXT);
DROP FUNCTION IF EXISTS find_cip_diagnosis(TEXT);

-- Done!
SELECT 'Expanded puzzles created!' AS status,
  (SELECT COUNT(*) FROM cip_puzzles WHERE title LIKE 'EXP:%') AS new_puzzles,
  (SELECT COUNT(*) FROM cip_puzzles) AS total_puzzles;
