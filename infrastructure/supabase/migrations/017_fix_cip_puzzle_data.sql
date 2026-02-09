-- =====================================================
-- Migration 017: Fix CIP Puzzle Data (Answer Key Fix)
-- =====================================================
-- Date: 2026-02-08
-- Root Cause: cip-full-puzzles-fixed.sql used positional
--   array indices (ORDER BY created_at) to assign correct
--   findings to grid cells. This caused complete misalignment
--   between diagnoses and their correct findings (e.g.,
--   Levotiroxina as correct treatment for IAM).
--
-- Fix: Clean all CIP data and re-insert with explicit
--   name-based diagnosis-finding mappings.
-- =====================================================

-- Step 1: Clean all CIP data (in FK dependency order)
DELETE FROM cip_puzzle_grid;
DELETE FROM cip_attempts;
DELETE FROM cip_puzzles;
DELETE FROM cip_diagnosis_findings;
DELETE FROM cip_findings;
DELETE FROM cip_diagnoses;

-- Step 2: Insert 15 diagnoses
INSERT INTO cip_diagnoses (name_pt, icd10_code, area, subspecialty, difficulty_tier) VALUES
  ('Diabetes Mellitus tipo 2', 'E11', 'clinica_medica', 'endocrinologia', 2),
  ('Hipertensão Arterial Sistêmica', 'I10', 'clinica_medica', 'cardiologia', 1),
  ('Insuficiência Cardíaca Congestiva', 'I50', 'clinica_medica', 'cardiologia', 4),
  ('Infarto Agudo do Miocárdio', 'I21', 'clinica_medica', 'cardiologia', 4),
  ('Pneumonia Adquirida na Comunidade', 'J18', 'clinica_medica', 'pneumologia', 2),
  ('DPOC (Doença Pulmonar Obstrutiva Crônica)', 'J44', 'clinica_medica', 'pneumologia', 3),
  ('Asma Brônquica', 'J45', 'clinica_medica', 'pneumologia', 2),
  ('Hipotireoidismo Primário', 'E03', 'clinica_medica', 'endocrinologia', 3),
  ('Apendicite Aguda', 'K35', 'cirurgia', 'cirurgia_geral', 2),
  ('Colecistite Aguda', 'K81', 'cirurgia', 'cirurgia_geral', 3),
  ('Hemorragia Digestiva Alta', 'K92', 'cirurgia', 'cirurgia_geral', 4),
  ('Bronquiolite Viral Aguda', 'J21', 'pediatria', 'pneumologia', 2),
  ('Doença Diarreica Aguda', 'A09', 'pediatria', 'gastroenterologia', 1),
  ('Pré-eclâmpsia', 'O14', 'ginecologia_obstetricia', 'obstetricia', 4),
  ('ITU na Gestação', 'O23', 'ginecologia_obstetricia', 'obstetricia', 2);

-- Step 3: Insert 60 findings (15 diagnoses × 4 sections)
INSERT INTO cip_findings (text_pt, section, tags) VALUES
  -- Medical History (15)
  ('Polidipsia, poliúria e perda de peso há 3 meses', 'medical_history', ARRAY['diabetes']),
  ('Cefaleia occipital matinal recorrente', 'medical_history', ARRAY['hipertensão']),
  ('Dispneia paroxística noturna', 'medical_history', ARRAY['ICC']),
  ('Dor torácica em aperto há 2 horas, irradia para braço esquerdo', 'medical_history', ARRAY['IAM']),
  ('Febre alta e tosse produtiva há 5 dias', 'medical_history', ARRAY['pneumonia']),
  ('Tabagismo 40 maços-ano, tosse crônica matinal', 'medical_history', ARRAY['DPOC']),
  ('Sibilância e tosse noturna, piora com frio', 'medical_history', ARRAY['asma']),
  ('Cansaço extremo, ganho de peso, intolerância ao frio', 'medical_history', ARRAY['hipotireoidismo']),
  ('Dor abdominal migratória (epigástrio → FID) há 24h', 'medical_history', ARRAY['apendicite']),
  ('Dor em HD pós-prandial, principalmente após gordura', 'medical_history', ARRAY['colecistite']),
  ('Melena há 2 dias, fraqueza intensa', 'medical_history', ARRAY['HDA']),
  ('Lactente 6 meses, coriza e tosse há 3 dias', 'medical_history', ARRAY['bronquiolite']),
  ('Criança 2 anos, diarreia líquida e vômitos há 2 dias', 'medical_history', ARRAY['DDA']),
  ('Gestante 34 semanas, PA elevada em 2 consultas', 'medical_history', ARRAY['pré-eclâmpsia']),
  ('Gestante com disúria, urgência e polaciúria', 'medical_history', ARRAY['ITU']),

  -- Physical Exam (15)
  ('Acantose nigricans cervical, IMC 32', 'physical_exam', ARRAY['diabetes']),
  ('PA 180x110 mmHg (confirmada), fundoscopia com exsudatos', 'physical_exam', ARRAY['hipertensão']),
  ('Turgência jugular, edema 3+/4+ em MMII', 'physical_exam', ARRAY['ICC']),
  ('Sudorese fria, pálido, ansioso', 'physical_exam', ARRAY['IAM']),
  ('Crepitações e macicez à percussão em base direita', 'physical_exam', ARRAY['pneumonia']),
  ('MV diminuído, expiração prolongada, tórax em tonel', 'physical_exam', ARRAY['DPOC']),
  ('Sibilos difusos bilateralmente', 'physical_exam', ARRAY['asma']),
  ('Pele fria e seca, mixedema, bradicardia', 'physical_exam', ARRAY['hipotireoidismo']),
  ('Blumberg +, Rovsing +, defesa em FID', 'physical_exam', ARRAY['apendicite']),
  ('Murphy +, massa palpável em HD', 'physical_exam', ARRAY['colecistite']),
  ('Palidez ++/4+, taquicardia, hipotensão postural', 'physical_exam', ARRAY['HDA']),
  ('Tiragem subcostal, sibilos difusos, FR 65', 'physical_exam', ARRAY['bronquiolite']),
  ('Olhos encovados, turgor diminuído, mucosas secas', 'physical_exam', ARRAY['DDA']),
  ('Edema facial e em mãos, ROT aumentados', 'physical_exam', ARRAY['pré-eclâmpsia']),
  ('Dor suprapúbica à palpação, sem febre', 'physical_exam', ARRAY['ITU']),

  -- Laboratory (15)
  ('Glicemia jejum 280 mg/dL, HbA1c 10.2%', 'laboratory', ARRAY['diabetes']),
  ('Creatinina 1.8 mg/dL, proteinúria 500mg/24h', 'laboratory', ARRAY['hipertensão']),
  ('BNP 1800 pg/mL, RX: cardiomegalia e congestão', 'laboratory', ARRAY['ICC']),
  ('Troponina I 45 ng/mL, ECG: supra ST DII/III/aVF', 'laboratory', ARRAY['IAM']),
  ('Leucócitos 18.000 com desvio, PCR 180 mg/L', 'laboratory', ARRAY['pneumonia']),
  ('Gasometria: pH 7.32, pCO2 58, HCO3 30 (acidose respiratória compensada)', 'laboratory', ARRAY['DPOC']),
  ('Espirometria: VEF1/CVF <70%, reversível com BD', 'laboratory', ARRAY['asma']),
  ('TSH 45 mU/L, T4 livre 0.3 ng/dL', 'laboratory', ARRAY['hipotireoidismo']),
  ('Leucocitose 16.000, amilase e lipase normais', 'laboratory', ARRAY['apendicite']),
  ('Bilirrubinas elevadas, FA 380 U/L, GGT 250 U/L', 'laboratory', ARRAY['colecistite']),
  ('Hb 6.5 g/dL, ureia 95 mg/dL (ureia/creatinina >100)', 'laboratory', ARRAY['HDA']),
  ('SatO2 88% em ar ambiente, RX: hiperinsuflação', 'laboratory', ARRAY['bronquiolite']),
  ('Sódio 128 mEq/L, potássio 2.8 mEq/L', 'laboratory', ARRAY['DDA']),
  ('Proteinúria 800 mg/24h, plaquetas 95.000, TGO/TGP elevadas', 'laboratory', ARRAY['pré-eclâmpsia']),
  ('Urocultura: E. coli >100.000 UFC/mL', 'laboratory', ARRAY['ITU']),

  -- Treatment (15)
  ('Metformina 850mg 2x/dia + mudança estilo de vida', 'treatment', ARRAY['diabetes']),
  ('IECA (Enalapril 10mg/dia) + hidroclorotiazida 25mg', 'treatment', ARRAY['hipertensão']),
  ('Furosemida + Espironolactona + IECA + Betabloqueador', 'treatment', ARRAY['ICC']),
  ('AAS + Clopidogrel + Angioplastia primária urgente', 'treatment', ARRAY['IAM']),
  ('Amoxicilina + Clavulanato 875mg 12/12h por 7 dias', 'treatment', ARRAY['pneumonia']),
  ('Tiotrópio + Formoterol, cessação tabagismo', 'treatment', ARRAY['DPOC']),
  ('Corticoide inalatório + LABA, plano de ação', 'treatment', ARRAY['asma']),
  ('Levotiroxina 75mcg em jejum', 'treatment', ARRAY['hipotireoidismo']),
  ('Apendicectomia videolaparoscópica + ATB', 'treatment', ARRAY['apendicite']),
  ('Colecistectomia videolaparoscópica + ATB', 'treatment', ARRAY['colecistite']),
  ('Reposição volêmica + EDA + IBP EV', 'treatment', ARRAY['HDA']),
  ('Oxigenioterapia + aspiração nasal + hidratação', 'treatment', ARRAY['bronquiolite']),
  ('Soro de reidratação oral + zinco', 'treatment', ARRAY['DDA']),
  ('Sulfato de magnésio + anti-hipertensivos + parto', 'treatment', ARRAY['pré-eclâmpsia']),
  ('Cefalexina 500mg 6/6h por 7 dias', 'treatment', ARRAY['ITU']);

-- Step 4: Create puzzles and grid with correct name-based lookups
DO $$
DECLARE
  -- Diagnosis UUIDs
  d_dm2 UUID; d_has UUID; d_icc UUID; d_iam UUID; d_pneumonia UUID;
  d_dpoc UUID; d_asma UUID; d_hipotireoidismo UUID; d_apendicite UUID;
  d_colecistite UUID; d_hda UUID; d_bronquiolite UUID; d_dda UUID;
  d_pre_eclampsia UUID; d_itu_gestante UUID;

  -- Finding UUIDs: f_{section}_{diagnosis}
  -- medical_history
  f_mh_dm2 UUID; f_mh_has UUID; f_mh_icc UUID; f_mh_iam UUID;
  f_mh_pneumonia UUID; f_mh_dpoc UUID; f_mh_asma UUID; f_mh_hipotireoidismo UUID;
  f_mh_apendicite UUID; f_mh_colecistite UUID; f_mh_hda UUID;
  f_mh_bronquiolite UUID; f_mh_dda UUID; f_mh_preeclampsia UUID; f_mh_itu UUID;
  -- physical_exam
  f_pe_dm2 UUID; f_pe_has UUID; f_pe_icc UUID; f_pe_iam UUID;
  f_pe_pneumonia UUID; f_pe_dpoc UUID; f_pe_asma UUID; f_pe_hipotireoidismo UUID;
  f_pe_apendicite UUID; f_pe_colecistite UUID; f_pe_hda UUID;
  f_pe_bronquiolite UUID; f_pe_dda UUID; f_pe_preeclampsia UUID; f_pe_itu UUID;
  -- laboratory
  f_lab_dm2 UUID; f_lab_has UUID; f_lab_icc UUID; f_lab_iam UUID;
  f_lab_pneumonia UUID; f_lab_dpoc UUID; f_lab_asma UUID; f_lab_hipotireoidismo UUID;
  f_lab_apendicite UUID; f_lab_colecistite UUID; f_lab_hda UUID;
  f_lab_bronquiolite UUID; f_lab_dda UUID; f_lab_preeclampsia UUID; f_lab_itu UUID;
  -- treatment
  f_treat_dm2 UUID; f_treat_has UUID; f_treat_icc UUID; f_treat_iam UUID;
  f_treat_pneumonia UUID; f_treat_dpoc UUID; f_treat_asma UUID; f_treat_hipotireoidismo UUID;
  f_treat_apendicite UUID; f_treat_colecistite UUID; f_treat_hda UUID;
  f_treat_bronquiolite UUID; f_treat_dda UUID; f_treat_preeclampsia UUID; f_treat_itu UUID;

  v_pid UUID;
BEGIN
  -- ============================================
  -- Look up diagnosis UUIDs by name
  -- ============================================
  SELECT id INTO STRICT d_dm2 FROM cip_diagnoses WHERE name_pt = 'Diabetes Mellitus tipo 2';
  SELECT id INTO STRICT d_has FROM cip_diagnoses WHERE name_pt = 'Hipertensão Arterial Sistêmica';
  SELECT id INTO STRICT d_icc FROM cip_diagnoses WHERE name_pt = 'Insuficiência Cardíaca Congestiva';
  SELECT id INTO STRICT d_iam FROM cip_diagnoses WHERE name_pt = 'Infarto Agudo do Miocárdio';
  SELECT id INTO STRICT d_pneumonia FROM cip_diagnoses WHERE name_pt = 'Pneumonia Adquirida na Comunidade';
  SELECT id INTO STRICT d_dpoc FROM cip_diagnoses WHERE name_pt LIKE 'DPOC%';
  SELECT id INTO STRICT d_asma FROM cip_diagnoses WHERE name_pt = 'Asma Brônquica';
  SELECT id INTO STRICT d_hipotireoidismo FROM cip_diagnoses WHERE name_pt = 'Hipotireoidismo Primário';
  SELECT id INTO STRICT d_apendicite FROM cip_diagnoses WHERE name_pt = 'Apendicite Aguda';
  SELECT id INTO STRICT d_colecistite FROM cip_diagnoses WHERE name_pt = 'Colecistite Aguda';
  SELECT id INTO STRICT d_hda FROM cip_diagnoses WHERE name_pt = 'Hemorragia Digestiva Alta';
  SELECT id INTO STRICT d_bronquiolite FROM cip_diagnoses WHERE name_pt = 'Bronquiolite Viral Aguda';
  SELECT id INTO STRICT d_dda FROM cip_diagnoses WHERE name_pt = 'Doença Diarreica Aguda';
  SELECT id INTO STRICT d_pre_eclampsia FROM cip_diagnoses WHERE name_pt = 'Pré-eclâmpsia';
  SELECT id INTO STRICT d_itu_gestante FROM cip_diagnoses WHERE name_pt = 'ITU na Gestação';

  -- ============================================
  -- Look up finding UUIDs by text + section
  -- ============================================
  -- DM2
  SELECT id INTO STRICT f_mh_dm2 FROM cip_findings WHERE text_pt LIKE 'Polidipsia%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_dm2 FROM cip_findings WHERE text_pt LIKE 'Acantose nigricans%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_dm2 FROM cip_findings WHERE text_pt LIKE 'Glicemia jejum%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_dm2 FROM cip_findings WHERE text_pt LIKE 'Metformina%' AND section = 'treatment';
  -- HAS
  SELECT id INTO STRICT f_mh_has FROM cip_findings WHERE text_pt LIKE 'Cefaleia occipital%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_has FROM cip_findings WHERE text_pt LIKE 'PA 180x110%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_has FROM cip_findings WHERE text_pt LIKE 'Creatinina 1.8%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_has FROM cip_findings WHERE text_pt LIKE 'IECA%' AND section = 'treatment';
  -- ICC
  SELECT id INTO STRICT f_mh_icc FROM cip_findings WHERE text_pt LIKE 'Dispneia paroxística%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_icc FROM cip_findings WHERE text_pt LIKE 'Turgência jugular%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_icc FROM cip_findings WHERE text_pt LIKE 'BNP 1800%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_icc FROM cip_findings WHERE text_pt LIKE 'Furosemida + Espironolactona%' AND section = 'treatment';
  -- IAM
  SELECT id INTO STRICT f_mh_iam FROM cip_findings WHERE text_pt LIKE 'Dor torácica em aperto%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_iam FROM cip_findings WHERE text_pt LIKE 'Sudorese fria%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_iam FROM cip_findings WHERE text_pt LIKE 'Troponina I 45%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_iam FROM cip_findings WHERE text_pt LIKE 'AAS + Clopidogrel%' AND section = 'treatment';
  -- Pneumonia
  SELECT id INTO STRICT f_mh_pneumonia FROM cip_findings WHERE text_pt LIKE 'Febre alta e tosse%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_pneumonia FROM cip_findings WHERE text_pt LIKE 'Crepitações%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_pneumonia FROM cip_findings WHERE text_pt LIKE 'Leucócitos 18%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_pneumonia FROM cip_findings WHERE text_pt LIKE 'Amoxicilina + Clavulanato%' AND section = 'treatment';
  -- DPOC
  SELECT id INTO STRICT f_mh_dpoc FROM cip_findings WHERE text_pt LIKE 'Tabagismo 40%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_dpoc FROM cip_findings WHERE text_pt LIKE 'MV diminuído%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_dpoc FROM cip_findings WHERE text_pt LIKE 'Gasometria:%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_dpoc FROM cip_findings WHERE text_pt LIKE 'Tiotrópio%' AND section = 'treatment';
  -- Asma
  SELECT id INTO STRICT f_mh_asma FROM cip_findings WHERE text_pt LIKE 'Sibilância e tosse%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_asma FROM cip_findings WHERE text_pt LIKE 'Sibilos difusos%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_asma FROM cip_findings WHERE text_pt LIKE 'Espirometria%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_asma FROM cip_findings WHERE text_pt LIKE 'Corticoide inalatório%' AND section = 'treatment';
  -- Hipotireoidismo
  SELECT id INTO STRICT f_mh_hipotireoidismo FROM cip_findings WHERE text_pt LIKE 'Cansaço extremo%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_hipotireoidismo FROM cip_findings WHERE text_pt LIKE 'Pele fria e seca%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_hipotireoidismo FROM cip_findings WHERE text_pt LIKE 'TSH 45%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_hipotireoidismo FROM cip_findings WHERE text_pt LIKE 'Levotiroxina%' AND section = 'treatment';
  -- Apendicite
  SELECT id INTO STRICT f_mh_apendicite FROM cip_findings WHERE text_pt LIKE 'Dor abdominal migratória%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_apendicite FROM cip_findings WHERE text_pt LIKE 'Blumberg%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_apendicite FROM cip_findings WHERE text_pt LIKE 'Leucocitose 16%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_apendicite FROM cip_findings WHERE text_pt LIKE 'Apendicectomia%' AND section = 'treatment';
  -- Colecistite
  SELECT id INTO STRICT f_mh_colecistite FROM cip_findings WHERE text_pt LIKE 'Dor em HD%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_colecistite FROM cip_findings WHERE text_pt LIKE 'Murphy%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_colecistite FROM cip_findings WHERE text_pt LIKE 'Bilirrubinas elevadas%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_colecistite FROM cip_findings WHERE text_pt LIKE 'Colecistectomia%' AND section = 'treatment';
  -- HDA
  SELECT id INTO STRICT f_mh_hda FROM cip_findings WHERE text_pt LIKE 'Melena há 2%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_hda FROM cip_findings WHERE text_pt LIKE 'Palidez%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_hda FROM cip_findings WHERE text_pt LIKE 'Hb 6.5%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_hda FROM cip_findings WHERE text_pt LIKE 'Reposição volêmica%' AND section = 'treatment';
  -- Bronquiolite
  SELECT id INTO STRICT f_mh_bronquiolite FROM cip_findings WHERE text_pt LIKE 'Lactente 6%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_bronquiolite FROM cip_findings WHERE text_pt LIKE 'Tiragem subcostal%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_bronquiolite FROM cip_findings WHERE text_pt LIKE 'SatO2 88%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_bronquiolite FROM cip_findings WHERE text_pt LIKE 'Oxigenioterapia%' AND section = 'treatment';
  -- DDA
  SELECT id INTO STRICT f_mh_dda FROM cip_findings WHERE text_pt LIKE 'Criança 2 anos%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_dda FROM cip_findings WHERE text_pt LIKE 'Olhos encovados%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_dda FROM cip_findings WHERE text_pt LIKE 'Sódio 128%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_dda FROM cip_findings WHERE text_pt LIKE 'Soro de reidratação%' AND section = 'treatment';
  -- Pré-eclâmpsia
  SELECT id INTO STRICT f_mh_preeclampsia FROM cip_findings WHERE text_pt LIKE 'Gestante 34 semanas%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_preeclampsia FROM cip_findings WHERE text_pt LIKE 'Edema facial%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_preeclampsia FROM cip_findings WHERE text_pt LIKE 'Proteinúria 800%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_preeclampsia FROM cip_findings WHERE text_pt LIKE 'Sulfato de magnésio%' AND section = 'treatment';
  -- ITU na Gestação
  SELECT id INTO STRICT f_mh_itu FROM cip_findings WHERE text_pt LIKE 'Gestante com disúria%' AND section = 'medical_history';
  SELECT id INTO STRICT f_pe_itu FROM cip_findings WHERE text_pt LIKE 'Dor suprapúbica%' AND section = 'physical_exam';
  SELECT id INTO STRICT f_lab_itu FROM cip_findings WHERE text_pt LIKE 'Urocultura%' AND section = 'laboratory';
  SELECT id INTO STRICT f_treat_itu FROM cip_findings WHERE text_pt LIKE 'Cefalexina%' AND section = 'treatment';

  RAISE NOTICE 'All diagnosis and finding UUIDs resolved successfully';

  -- ============================================
  -- Insert diagnosis-finding links
  -- ============================================
  INSERT INTO cip_diagnosis_findings (diagnosis_id, finding_id, section, is_primary) VALUES
    (d_dm2, f_mh_dm2, 'medical_history', true), (d_dm2, f_pe_dm2, 'physical_exam', true),
    (d_dm2, f_lab_dm2, 'laboratory', true), (d_dm2, f_treat_dm2, 'treatment', true),
    (d_has, f_mh_has, 'medical_history', true), (d_has, f_pe_has, 'physical_exam', true),
    (d_has, f_lab_has, 'laboratory', true), (d_has, f_treat_has, 'treatment', true),
    (d_icc, f_mh_icc, 'medical_history', true), (d_icc, f_pe_icc, 'physical_exam', true),
    (d_icc, f_lab_icc, 'laboratory', true), (d_icc, f_treat_icc, 'treatment', true),
    (d_iam, f_mh_iam, 'medical_history', true), (d_iam, f_pe_iam, 'physical_exam', true),
    (d_iam, f_lab_iam, 'laboratory', true), (d_iam, f_treat_iam, 'treatment', true),
    (d_pneumonia, f_mh_pneumonia, 'medical_history', true), (d_pneumonia, f_pe_pneumonia, 'physical_exam', true),
    (d_pneumonia, f_lab_pneumonia, 'laboratory', true), (d_pneumonia, f_treat_pneumonia, 'treatment', true),
    (d_dpoc, f_mh_dpoc, 'medical_history', true), (d_dpoc, f_pe_dpoc, 'physical_exam', true),
    (d_dpoc, f_lab_dpoc, 'laboratory', true), (d_dpoc, f_treat_dpoc, 'treatment', true),
    (d_asma, f_mh_asma, 'medical_history', true), (d_asma, f_pe_asma, 'physical_exam', true),
    (d_asma, f_lab_asma, 'laboratory', true), (d_asma, f_treat_asma, 'treatment', true),
    (d_hipotireoidismo, f_mh_hipotireoidismo, 'medical_history', true), (d_hipotireoidismo, f_pe_hipotireoidismo, 'physical_exam', true),
    (d_hipotireoidismo, f_lab_hipotireoidismo, 'laboratory', true), (d_hipotireoidismo, f_treat_hipotireoidismo, 'treatment', true),
    (d_apendicite, f_mh_apendicite, 'medical_history', true), (d_apendicite, f_pe_apendicite, 'physical_exam', true),
    (d_apendicite, f_lab_apendicite, 'laboratory', true), (d_apendicite, f_treat_apendicite, 'treatment', true),
    (d_colecistite, f_mh_colecistite, 'medical_history', true), (d_colecistite, f_pe_colecistite, 'physical_exam', true),
    (d_colecistite, f_lab_colecistite, 'laboratory', true), (d_colecistite, f_treat_colecistite, 'treatment', true),
    (d_hda, f_mh_hda, 'medical_history', true), (d_hda, f_pe_hda, 'physical_exam', true),
    (d_hda, f_lab_hda, 'laboratory', true), (d_hda, f_treat_hda, 'treatment', true),
    (d_bronquiolite, f_mh_bronquiolite, 'medical_history', true), (d_bronquiolite, f_pe_bronquiolite, 'physical_exam', true),
    (d_bronquiolite, f_lab_bronquiolite, 'laboratory', true), (d_bronquiolite, f_treat_bronquiolite, 'treatment', true),
    (d_dda, f_mh_dda, 'medical_history', true), (d_dda, f_pe_dda, 'physical_exam', true),
    (d_dda, f_lab_dda, 'laboratory', true), (d_dda, f_treat_dda, 'treatment', true),
    (d_pre_eclampsia, f_mh_preeclampsia, 'medical_history', true), (d_pre_eclampsia, f_pe_preeclampsia, 'physical_exam', true),
    (d_pre_eclampsia, f_lab_preeclampsia, 'laboratory', true), (d_pre_eclampsia, f_treat_preeclampsia, 'treatment', true),
    (d_itu_gestante, f_mh_itu, 'medical_history', true), (d_itu_gestante, f_pe_itu, 'physical_exam', true),
    (d_itu_gestante, f_lab_itu, 'laboratory', true), (d_itu_gestante, f_treat_itu, 'treatment', true);

  -- ============================================
  -- PUZZLE 1: Muito Fácil - Doenças Comuns
  -- Diagnoses: HAS, DDA, ITU (3 diags, 3 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Iniciante - Doenças Comuns',
    'Puzzle introdutório com 3 diagnósticos muito comuns.',
    ARRAY['clinica_medica', 'pediatria', 'ginecologia_obstetricia'],
    'muito_facil',
    ARRAY[d_has, d_dda, d_itu_gestante],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_has, f_mh_dda, f_mh_itu),
      'physical_exam', jsonb_build_array(f_pe_has, f_pe_dda, f_pe_itu),
      'treatment', jsonb_build_array(f_treat_has, f_treat_dda, f_treat_itu)
    ),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"], "distractorCount": 2, "allowReuse": false}',
    15, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_has),
    (v_pid, 0, 'physical_exam', f_pe_has),
    (v_pid, 0, 'treatment', f_treat_has),
    (v_pid, 1, 'medical_history', f_mh_dda),
    (v_pid, 1, 'physical_exam', f_pe_dda),
    (v_pid, 1, 'treatment', f_treat_dda),
    (v_pid, 2, 'medical_history', f_mh_itu),
    (v_pid, 2, 'physical_exam', f_pe_itu),
    (v_pid, 2, 'treatment', f_treat_itu);
  RAISE NOTICE 'Puzzle 1 created: %', v_pid;

  -- ============================================
  -- PUZZLE 2: Muito Fácil - Clínica Geral
  -- Diagnoses: DM2, Asma, DDA (3 diags, 3 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Básico - Clínica Geral',
    'Condições básicas de clínica médica.',
    ARRAY['clinica_medica', 'pediatria'],
    'muito_facil',
    ARRAY[d_dm2, d_asma, d_dda],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_dm2, f_mh_asma, f_mh_dda),
      'physical_exam', jsonb_build_array(f_pe_dm2, f_pe_asma, f_pe_dda),
      'treatment', jsonb_build_array(f_treat_dm2, f_treat_asma, f_treat_dda)
    ),
    '{"diagnosisCount": 3, "sections": ["medical_history", "physical_exam", "treatment"], "distractorCount": 2, "allowReuse": false}',
    15, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_dm2),
    (v_pid, 0, 'physical_exam', f_pe_dm2),
    (v_pid, 0, 'treatment', f_treat_dm2),
    (v_pid, 1, 'medical_history', f_mh_asma),
    (v_pid, 1, 'physical_exam', f_pe_asma),
    (v_pid, 1, 'treatment', f_treat_asma),
    (v_pid, 2, 'medical_history', f_mh_dda),
    (v_pid, 2, 'physical_exam', f_pe_dda),
    (v_pid, 2, 'treatment', f_treat_dda);
  RAISE NOTICE 'Puzzle 2 created: %', v_pid;

  -- ============================================
  -- PUZZLE 3: Fácil - Mix de Especialidades
  -- Diagnoses: DM2, HAS, Pneumonia, Apendicite (4 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Prática - Mix de Especialidades',
    'Puzzle com 4 diagnósticos de diferentes áreas.',
    ARRAY['clinica_medica', 'cirurgia'],
    'facil',
    ARRAY[d_dm2, d_has, d_pneumonia, d_apendicite],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_dm2, f_mh_has, f_mh_pneumonia, f_mh_apendicite),
      'physical_exam', jsonb_build_array(f_pe_dm2, f_pe_has, f_pe_pneumonia, f_pe_apendicite),
      'laboratory', jsonb_build_array(f_lab_dm2, f_lab_has, f_lab_pneumonia, f_lab_apendicite),
      'treatment', jsonb_build_array(f_treat_dm2, f_treat_has, f_treat_pneumonia, f_treat_apendicite)
    ),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 2, "allowReuse": false}',
    20, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_dm2), (v_pid, 0, 'physical_exam', f_pe_dm2),
    (v_pid, 0, 'laboratory', f_lab_dm2), (v_pid, 0, 'treatment', f_treat_dm2),
    (v_pid, 1, 'medical_history', f_mh_has), (v_pid, 1, 'physical_exam', f_pe_has),
    (v_pid, 1, 'laboratory', f_lab_has), (v_pid, 1, 'treatment', f_treat_has),
    (v_pid, 2, 'medical_history', f_mh_pneumonia), (v_pid, 2, 'physical_exam', f_pe_pneumonia),
    (v_pid, 2, 'laboratory', f_lab_pneumonia), (v_pid, 2, 'treatment', f_treat_pneumonia),
    (v_pid, 3, 'medical_history', f_mh_apendicite), (v_pid, 3, 'physical_exam', f_pe_apendicite),
    (v_pid, 3, 'laboratory', f_lab_apendicite), (v_pid, 3, 'treatment', f_treat_apendicite);
  RAISE NOTICE 'Puzzle 3 created: %', v_pid;

  -- ============================================
  -- PUZZLE 4: Fácil - Clínica Médica Básica
  -- Diagnoses: Pneumonia, Asma, Hipotireoidismo, DM2 (4 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Clínica Médica Básica',
    'Condições comuns de clínica médica.',
    ARRAY['clinica_medica'],
    'facil',
    ARRAY[d_pneumonia, d_asma, d_hipotireoidismo, d_dm2],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_pneumonia, f_mh_asma, f_mh_hipotireoidismo, f_mh_dm2),
      'physical_exam', jsonb_build_array(f_pe_pneumonia, f_pe_asma, f_pe_hipotireoidismo, f_pe_dm2),
      'laboratory', jsonb_build_array(f_lab_pneumonia, f_lab_asma, f_lab_hipotireoidismo, f_lab_dm2),
      'treatment', jsonb_build_array(f_treat_pneumonia, f_treat_asma, f_treat_hipotireoidismo, f_treat_dm2)
    ),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 2, "allowReuse": false}',
    20, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_pneumonia), (v_pid, 0, 'physical_exam', f_pe_pneumonia),
    (v_pid, 0, 'laboratory', f_lab_pneumonia), (v_pid, 0, 'treatment', f_treat_pneumonia),
    (v_pid, 1, 'medical_history', f_mh_asma), (v_pid, 1, 'physical_exam', f_pe_asma),
    (v_pid, 1, 'laboratory', f_lab_asma), (v_pid, 1, 'treatment', f_treat_asma),
    (v_pid, 2, 'medical_history', f_mh_hipotireoidismo), (v_pid, 2, 'physical_exam', f_pe_hipotireoidismo),
    (v_pid, 2, 'laboratory', f_lab_hipotireoidismo), (v_pid, 2, 'treatment', f_treat_hipotireoidismo),
    (v_pid, 3, 'medical_history', f_mh_dm2), (v_pid, 3, 'physical_exam', f_pe_dm2),
    (v_pid, 3, 'laboratory', f_lab_dm2), (v_pid, 3, 'treatment', f_treat_dm2);
  RAISE NOTICE 'Puzzle 4 created: %', v_pid;

  -- ============================================
  -- PUZZLE 5: Fácil - Cirurgia e Pediatria
  -- Diagnoses: Apendicite, Bronquiolite, Colecistite, DDA (4 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Cirurgia e Pediatria',
    'Mix de casos cirúrgicos e pediátricos.',
    ARRAY['cirurgia', 'pediatria'],
    'facil',
    ARRAY[d_apendicite, d_bronquiolite, d_colecistite, d_dda],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_apendicite, f_mh_bronquiolite, f_mh_colecistite, f_mh_dda),
      'physical_exam', jsonb_build_array(f_pe_apendicite, f_pe_bronquiolite, f_pe_colecistite, f_pe_dda),
      'laboratory', jsonb_build_array(f_lab_apendicite, f_lab_bronquiolite, f_lab_colecistite, f_lab_dda),
      'treatment', jsonb_build_array(f_treat_apendicite, f_treat_bronquiolite, f_treat_colecistite, f_treat_dda)
    ),
    '{"diagnosisCount": 4, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 2, "allowReuse": false}',
    25, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_apendicite), (v_pid, 0, 'physical_exam', f_pe_apendicite),
    (v_pid, 0, 'laboratory', f_lab_apendicite), (v_pid, 0, 'treatment', f_treat_apendicite),
    (v_pid, 1, 'medical_history', f_mh_bronquiolite), (v_pid, 1, 'physical_exam', f_pe_bronquiolite),
    (v_pid, 1, 'laboratory', f_lab_bronquiolite), (v_pid, 1, 'treatment', f_treat_bronquiolite),
    (v_pid, 2, 'medical_history', f_mh_colecistite), (v_pid, 2, 'physical_exam', f_pe_colecistite),
    (v_pid, 2, 'laboratory', f_lab_colecistite), (v_pid, 2, 'treatment', f_treat_colecistite),
    (v_pid, 3, 'medical_history', f_mh_dda), (v_pid, 3, 'physical_exam', f_pe_dda),
    (v_pid, 3, 'laboratory', f_lab_dda), (v_pid, 3, 'treatment', f_treat_dda);
  RAISE NOTICE 'Puzzle 5 created: %', v_pid;

  -- ============================================
  -- PUZZLE 6: Médio - Cardiopneumo
  -- Diagnoses: ICC, Pneumonia, DPOC, IAM, Asma (5 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Intermediário - Cardiopneumo',
    'Condições cardíacas e pulmonares.',
    ARRAY['clinica_medica'],
    'medio',
    ARRAY[d_icc, d_pneumonia, d_dpoc, d_iam, d_asma],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_icc, f_mh_pneumonia, f_mh_dpoc, f_mh_iam, f_mh_asma),
      'physical_exam', jsonb_build_array(f_pe_icc, f_pe_pneumonia, f_pe_dpoc, f_pe_iam, f_pe_asma),
      'laboratory', jsonb_build_array(f_lab_icc, f_lab_pneumonia, f_lab_dpoc, f_lab_iam, f_lab_asma),
      'treatment', jsonb_build_array(f_treat_icc, f_treat_pneumonia, f_treat_dpoc, f_treat_iam, f_treat_asma)
    ),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 3, "allowReuse": false}',
    30, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_icc), (v_pid, 0, 'physical_exam', f_pe_icc),
    (v_pid, 0, 'laboratory', f_lab_icc), (v_pid, 0, 'treatment', f_treat_icc),
    (v_pid, 1, 'medical_history', f_mh_pneumonia), (v_pid, 1, 'physical_exam', f_pe_pneumonia),
    (v_pid, 1, 'laboratory', f_lab_pneumonia), (v_pid, 1, 'treatment', f_treat_pneumonia),
    (v_pid, 2, 'medical_history', f_mh_dpoc), (v_pid, 2, 'physical_exam', f_pe_dpoc),
    (v_pid, 2, 'laboratory', f_lab_dpoc), (v_pid, 2, 'treatment', f_treat_dpoc),
    (v_pid, 3, 'medical_history', f_mh_iam), (v_pid, 3, 'physical_exam', f_pe_iam),
    (v_pid, 3, 'laboratory', f_lab_iam), (v_pid, 3, 'treatment', f_treat_iam),
    (v_pid, 4, 'medical_history', f_mh_asma), (v_pid, 4, 'physical_exam', f_pe_asma),
    (v_pid, 4, 'laboratory', f_lab_asma), (v_pid, 4, 'treatment', f_treat_asma);
  RAISE NOTICE 'Puzzle 6 created: %', v_pid;

  -- ============================================
  -- PUZZLE 7: Médio - Mix Clínico-Cirúrgico
  -- Diagnoses: HAS, Apendicite, Pneumonia, Colecistite, DM2 (5 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Mix Clínico-Cirúrgico',
    'Casos clínicos e cirúrgicos misturados.',
    ARRAY['clinica_medica', 'cirurgia'],
    'medio',
    ARRAY[d_has, d_apendicite, d_pneumonia, d_colecistite, d_dm2],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_has, f_mh_apendicite, f_mh_pneumonia, f_mh_colecistite, f_mh_dm2),
      'physical_exam', jsonb_build_array(f_pe_has, f_pe_apendicite, f_pe_pneumonia, f_pe_colecistite, f_pe_dm2),
      'laboratory', jsonb_build_array(f_lab_has, f_lab_apendicite, f_lab_pneumonia, f_lab_colecistite, f_lab_dm2),
      'treatment', jsonb_build_array(f_treat_has, f_treat_apendicite, f_treat_pneumonia, f_treat_colecistite, f_treat_dm2)
    ),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 3, "allowReuse": false}',
    30, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_has), (v_pid, 0, 'physical_exam', f_pe_has),
    (v_pid, 0, 'laboratory', f_lab_has), (v_pid, 0, 'treatment', f_treat_has),
    (v_pid, 1, 'medical_history', f_mh_apendicite), (v_pid, 1, 'physical_exam', f_pe_apendicite),
    (v_pid, 1, 'laboratory', f_lab_apendicite), (v_pid, 1, 'treatment', f_treat_apendicite),
    (v_pid, 2, 'medical_history', f_mh_pneumonia), (v_pid, 2, 'physical_exam', f_pe_pneumonia),
    (v_pid, 2, 'laboratory', f_lab_pneumonia), (v_pid, 2, 'treatment', f_treat_pneumonia),
    (v_pid, 3, 'medical_history', f_mh_colecistite), (v_pid, 3, 'physical_exam', f_pe_colecistite),
    (v_pid, 3, 'laboratory', f_lab_colecistite), (v_pid, 3, 'treatment', f_treat_colecistite),
    (v_pid, 4, 'medical_history', f_mh_dm2), (v_pid, 4, 'physical_exam', f_pe_dm2),
    (v_pid, 4, 'laboratory', f_lab_dm2), (v_pid, 4, 'treatment', f_treat_dm2);
  RAISE NOTICE 'Puzzle 7 created: %', v_pid;

  -- ============================================
  -- PUZZLE 8: Médio - Todas as Áreas
  -- Diagnoses: IAM, HDA, Bronquiolite, Pré-eclâmpsia, DPOC (5 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Todas as Áreas',
    'Representação de todas as especialidades ENAMED.',
    ARRAY['clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia'],
    'medio',
    ARRAY[d_iam, d_hda, d_bronquiolite, d_pre_eclampsia, d_dpoc],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_iam, f_mh_hda, f_mh_bronquiolite, f_mh_preeclampsia, f_mh_dpoc),
      'physical_exam', jsonb_build_array(f_pe_iam, f_pe_hda, f_pe_bronquiolite, f_pe_preeclampsia, f_pe_dpoc),
      'laboratory', jsonb_build_array(f_lab_iam, f_lab_hda, f_lab_bronquiolite, f_lab_preeclampsia, f_lab_dpoc),
      'treatment', jsonb_build_array(f_treat_iam, f_treat_hda, f_treat_bronquiolite, f_treat_preeclampsia, f_treat_dpoc)
    ),
    '{"diagnosisCount": 5, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 3, "allowReuse": false}',
    35, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_iam), (v_pid, 0, 'physical_exam', f_pe_iam),
    (v_pid, 0, 'laboratory', f_lab_iam), (v_pid, 0, 'treatment', f_treat_iam),
    (v_pid, 1, 'medical_history', f_mh_hda), (v_pid, 1, 'physical_exam', f_pe_hda),
    (v_pid, 1, 'laboratory', f_lab_hda), (v_pid, 1, 'treatment', f_treat_hda),
    (v_pid, 2, 'medical_history', f_mh_bronquiolite), (v_pid, 2, 'physical_exam', f_pe_bronquiolite),
    (v_pid, 2, 'laboratory', f_lab_bronquiolite), (v_pid, 2, 'treatment', f_treat_bronquiolite),
    (v_pid, 3, 'medical_history', f_mh_preeclampsia), (v_pid, 3, 'physical_exam', f_pe_preeclampsia),
    (v_pid, 3, 'laboratory', f_lab_preeclampsia), (v_pid, 3, 'treatment', f_treat_preeclampsia),
    (v_pid, 4, 'medical_history', f_mh_dpoc), (v_pid, 4, 'physical_exam', f_pe_dpoc),
    (v_pid, 4, 'laboratory', f_lab_dpoc), (v_pid, 4, 'treatment', f_treat_dpoc);
  RAISE NOTICE 'Puzzle 8 created: %', v_pid;

  -- ============================================
  -- PUZZLE 9: Difícil - Urgências
  -- Diagnoses: IAM, HDA, ICC, Pré-eclâmpsia, Apendicite, Colecistite (6 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Desafio Avançado - Urgências',
    'Condições graves e urgentes.',
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia'],
    'dificil',
    ARRAY[d_iam, d_hda, d_icc, d_pre_eclampsia, d_apendicite, d_colecistite],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_iam, f_mh_hda, f_mh_icc, f_mh_preeclampsia, f_mh_apendicite, f_mh_colecistite),
      'physical_exam', jsonb_build_array(f_pe_iam, f_pe_hda, f_pe_icc, f_pe_preeclampsia, f_pe_apendicite, f_pe_colecistite),
      'laboratory', jsonb_build_array(f_lab_iam, f_lab_hda, f_lab_icc, f_lab_preeclampsia, f_lab_apendicite, f_lab_colecistite),
      'treatment', jsonb_build_array(f_treat_iam, f_treat_hda, f_treat_icc, f_treat_preeclampsia, f_treat_apendicite, f_treat_colecistite)
    ),
    '{"diagnosisCount": 6, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 3, "allowReuse": true}',
    40, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_iam), (v_pid, 0, 'physical_exam', f_pe_iam),
    (v_pid, 0, 'laboratory', f_lab_iam), (v_pid, 0, 'treatment', f_treat_iam),
    (v_pid, 1, 'medical_history', f_mh_hda), (v_pid, 1, 'physical_exam', f_pe_hda),
    (v_pid, 1, 'laboratory', f_lab_hda), (v_pid, 1, 'treatment', f_treat_hda),
    (v_pid, 2, 'medical_history', f_mh_icc), (v_pid, 2, 'physical_exam', f_pe_icc),
    (v_pid, 2, 'laboratory', f_lab_icc), (v_pid, 2, 'treatment', f_treat_icc),
    (v_pid, 3, 'medical_history', f_mh_preeclampsia), (v_pid, 3, 'physical_exam', f_pe_preeclampsia),
    (v_pid, 3, 'laboratory', f_lab_preeclampsia), (v_pid, 3, 'treatment', f_treat_preeclampsia),
    (v_pid, 4, 'medical_history', f_mh_apendicite), (v_pid, 4, 'physical_exam', f_pe_apendicite),
    (v_pid, 4, 'laboratory', f_lab_apendicite), (v_pid, 4, 'treatment', f_treat_apendicite),
    (v_pid, 5, 'medical_history', f_mh_colecistite), (v_pid, 5, 'physical_exam', f_pe_colecistite),
    (v_pid, 5, 'laboratory', f_lab_colecistite), (v_pid, 5, 'treatment', f_treat_colecistite);
  RAISE NOTICE 'Puzzle 9 created: %', v_pid;

  -- ============================================
  -- PUZZLE 10: Difícil - Master Mix
  -- Diagnoses: ICC, DPOC, Hipotireoidismo, HDA, Pré-eclâmpsia, IAM (6 diags, 4 sections)
  -- ============================================
  INSERT INTO cip_puzzles (title, description, areas, difficulty, diagnosis_ids, options_per_section, settings, time_limit_minutes, type, is_public)
  VALUES (
    'Master Mix - Todas as Áreas',
    'Puzzle desafiador com alta complexidade.',
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia'],
    'dificil',
    ARRAY[d_icc, d_dpoc, d_hipotireoidismo, d_hda, d_pre_eclampsia, d_iam],
    jsonb_build_object(
      'medical_history', jsonb_build_array(f_mh_icc, f_mh_dpoc, f_mh_hipotireoidismo, f_mh_hda, f_mh_preeclampsia, f_mh_iam),
      'physical_exam', jsonb_build_array(f_pe_icc, f_pe_dpoc, f_pe_hipotireoidismo, f_pe_hda, f_pe_preeclampsia, f_pe_iam),
      'laboratory', jsonb_build_array(f_lab_icc, f_lab_dpoc, f_lab_hipotireoidismo, f_lab_hda, f_lab_preeclampsia, f_lab_iam),
      'treatment', jsonb_build_array(f_treat_icc, f_treat_dpoc, f_treat_hipotireoidismo, f_treat_hda, f_treat_preeclampsia, f_treat_iam)
    ),
    '{"diagnosisCount": 6, "sections": ["medical_history", "physical_exam", "laboratory", "treatment"], "distractorCount": 4, "allowReuse": true}',
    45, 'practice', true
  ) RETURNING id INTO v_pid;

  INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id) VALUES
    (v_pid, 0, 'medical_history', f_mh_icc), (v_pid, 0, 'physical_exam', f_pe_icc),
    (v_pid, 0, 'laboratory', f_lab_icc), (v_pid, 0, 'treatment', f_treat_icc),
    (v_pid, 1, 'medical_history', f_mh_dpoc), (v_pid, 1, 'physical_exam', f_pe_dpoc),
    (v_pid, 1, 'laboratory', f_lab_dpoc), (v_pid, 1, 'treatment', f_treat_dpoc),
    (v_pid, 2, 'medical_history', f_mh_hipotireoidismo), (v_pid, 2, 'physical_exam', f_pe_hipotireoidismo),
    (v_pid, 2, 'laboratory', f_lab_hipotireoidismo), (v_pid, 2, 'treatment', f_treat_hipotireoidismo),
    (v_pid, 3, 'medical_history', f_mh_hda), (v_pid, 3, 'physical_exam', f_pe_hda),
    (v_pid, 3, 'laboratory', f_lab_hda), (v_pid, 3, 'treatment', f_treat_hda),
    (v_pid, 4, 'medical_history', f_mh_preeclampsia), (v_pid, 4, 'physical_exam', f_pe_preeclampsia),
    (v_pid, 4, 'laboratory', f_lab_preeclampsia), (v_pid, 4, 'treatment', f_treat_preeclampsia),
    (v_pid, 5, 'medical_history', f_mh_iam), (v_pid, 5, 'physical_exam', f_pe_iam),
    (v_pid, 5, 'laboratory', f_lab_iam), (v_pid, 5, 'treatment', f_treat_iam);
  RAISE NOTICE 'Puzzle 10 created: %', v_pid;

  RAISE NOTICE '✅ All 10 puzzles created with correct answer mappings!';
END $$;

-- Verify final state
SELECT 'Diagnoses' AS entity, COUNT(*) AS count FROM cip_diagnoses
UNION ALL SELECT 'Findings', COUNT(*) FROM cip_findings
UNION ALL SELECT 'Diagnosis-Finding Links', COUNT(*) FROM cip_diagnosis_findings
UNION ALL SELECT 'Puzzles', COUNT(*) FROM cip_puzzles
UNION ALL SELECT 'Grid Cells', COUNT(*) FROM cip_puzzle_grid;

-- Verify puzzle distribution
SELECT difficulty, COUNT(*) AS count
FROM cip_puzzles
GROUP BY difficulty
ORDER BY
  CASE difficulty
    WHEN 'muito_facil' THEN 1
    WHEN 'facil' THEN 2
    WHEN 'medio' THEN 3
    WHEN 'dificil' THEN 4
  END;
