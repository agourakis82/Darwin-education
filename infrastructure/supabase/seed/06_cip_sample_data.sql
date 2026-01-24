-- ============================================
-- CIP Sample Data Seed
-- ============================================
-- Populates cip_diagnoses, cip_findings, cip_puzzles, and cip_puzzle_grid
-- with sample data for testing the CIP feature.

-- ============================================
-- 1. CIP Diagnoses (sample from each ENAMED area)
-- ============================================

INSERT INTO cip_diagnoses (id, name_pt, name_en, icd10_code, icd10_codes_secondary, area, subspecialty, difficulty_tier, keywords) VALUES
-- Clínica Médica
('diag-dm2', 'Diabetes Mellitus tipo 2', 'Type 2 Diabetes Mellitus', 'E11', ARRAY['E11.9', 'E11.65'], 'clinica_medica', 'endocrinologia', 3, ARRAY['diabetes', 'glicemia', 'insulina', 'metformina']),
('diag-has', 'Hipertensão Arterial Sistêmica', 'Systemic Arterial Hypertension', 'I10', ARRAY['I11', 'I12'], 'clinica_medica', 'cardiologia', 2, ARRAY['pressão', 'hipertensão', 'cardiovascular']),
('diag-icc', 'Insuficiência Cardíaca Congestiva', 'Congestive Heart Failure', 'I50', ARRAY['I50.0', 'I50.9'], 'clinica_medica', 'cardiologia', 4, ARRAY['dispneia', 'edema', 'congestão', 'BNP']),
('diag-dpoc', 'Doença Pulmonar Obstrutiva Crônica', 'Chronic Obstructive Pulmonary Disease', 'J44', ARRAY['J44.0', 'J44.1'], 'clinica_medica', 'pneumologia', 3, ARRAY['tabagismo', 'dispneia', 'broncodilatador']),
('diag-pneumonia', 'Pneumonia Adquirida na Comunidade', 'Community-Acquired Pneumonia', 'J18', ARRAY['J15', 'J13'], 'clinica_medica', 'pneumologia', 2, ARRAY['febre', 'tosse', 'infiltrado', 'antibiótico']),

-- Cirurgia
('diag-apendicite', 'Apendicite Aguda', 'Acute Appendicitis', 'K35', ARRAY['K35.8', 'K35.9'], 'cirurgia', 'cirurgia_geral', 2, ARRAY['dor abdominal', 'McBurney', 'apendicectomia']),
('diag-colecistite', 'Colecistite Aguda', 'Acute Cholecystitis', 'K81', ARRAY['K81.0', 'K80'], 'cirurgia', 'cirurgia_geral', 3, ARRAY['cólica biliar', 'Murphy', 'colecistectomia']),
('diag-hda', 'Hemorragia Digestiva Alta', 'Upper Gastrointestinal Bleeding', 'K92.2', ARRAY['K25', 'K26'], 'cirurgia', 'cirurgia_geral', 4, ARRAY['melena', 'hematêmese', 'endoscopia']),

-- Ginecologia e Obstetrícia
('diag-pre-eclampsia', 'Pré-eclâmpsia', 'Preeclampsia', 'O14', ARRAY['O14.0', 'O14.1'], 'ginecologia_obstetricia', 'obstetricia', 4, ARRAY['hipertensão', 'gestação', 'proteinúria', 'sulfato']),
('diag-itu-gestante', 'Infecção Urinária na Gestação', 'Urinary Tract Infection in Pregnancy', 'O23', ARRAY['O23.0', 'O23.4'], 'ginecologia_obstetricia', 'obstetricia', 2, ARRAY['disúria', 'bacteriúria', 'gestação']),
('diag-mioma', 'Leiomioma Uterino', 'Uterine Leiomyoma', 'D25', ARRAY['D25.0', 'D25.1'], 'ginecologia_obstetricia', 'ginecologia', 3, ARRAY['sangramento', 'útero', 'miomectomia']),

-- Pediatria
('diag-bva', 'Bronquiolite Viral Aguda', 'Acute Viral Bronchiolitis', 'J21', ARRAY['J21.0', 'J21.9'], 'pediatria', 'pneumologia_pediatrica', 2, ARRAY['VSR', 'lactente', 'sibilância', 'oxigênio']),
('diag-dda', 'Doença Diarreica Aguda', 'Acute Diarrheal Disease', 'A09', ARRAY['A08', 'A09'], 'pediatria', 'gastro_pediatrica', 2, ARRAY['diarreia', 'desidratação', 'SRO']),
('diag-meningite-bact', 'Meningite Bacteriana', 'Bacterial Meningitis', 'G00', ARRAY['G00.0', 'G00.9'], 'pediatria', 'infectologia_pediatrica', 5, ARRAY['febre', 'rigidez nucal', 'LCR', 'ceftriaxona']),

-- Saúde Coletiva
('diag-tb-pulmonar', 'Tuberculose Pulmonar', 'Pulmonary Tuberculosis', 'A15', ARRAY['A15.0', 'A15.3'], 'saude_coletiva', 'vigilancia', 3, ARRAY['tosse', 'BAAR', 'rifampicina', 'notificação']),
('diag-dengue', 'Dengue', 'Dengue Fever', 'A90', ARRAY['A91'], 'saude_coletiva', 'vigilancia', 2, ARRAY['febre', 'mialgia', 'plaquetopenia', 'Aedes'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CIP Findings (clinical findings per section)
-- ============================================

INSERT INTO cip_findings (id, text_pt, text_en, section, icd10_codes, atc_codes, tags, is_ai_generated) VALUES
-- Medical History findings
('find-hist-polidipsia', 'Polidipsia e poliúria há 3 meses', 'Polydipsia and polyuria for 3 months', 'medical_history', ARRAY['R63.1'], ARRAY[], ARRAY['diabetes', 'sintomas'], false),
('find-hist-cefaleia-has', 'Cefaleia occipital matinal há 2 semanas', 'Morning occipital headache for 2 weeks', 'medical_history', ARRAY['R51'], ARRAY[], ARRAY['hipertensão', 'cefaleia'], false),
('find-hist-dispneia-esforco', 'Dispneia aos esforços progressiva há 1 mês', 'Progressive exertional dyspnea for 1 month', 'medical_history', ARRAY['R06.0'], ARRAY[], ARRAY['ICC', 'dispneia'], false),
('find-hist-tabagismo', 'Tabagismo 40 maços-ano, tosse crônica', 'Smoking 40 pack-years, chronic cough', 'medical_history', ARRAY['F17'], ARRAY[], ARRAY['DPOC', 'tabagismo'], false),
('find-hist-febre-tosse', 'Febre e tosse produtiva há 5 dias', 'Fever and productive cough for 5 days', 'medical_history', ARRAY['R50', 'R05'], ARRAY[], ARRAY['pneumonia', 'infecção'], false),
('find-hist-dor-fid', 'Dor abdominal em fossa ilíaca direita há 24h', 'Right lower quadrant pain for 24h', 'medical_history', ARRAY['R10.3'], ARRAY[], ARRAY['apendicite', 'abdome'], false),
('find-hist-colica-biliar', 'Dor em hipocôndrio direito pós-prandial', 'Right upper quadrant pain after meals', 'medical_history', ARRAY['R10.1'], ARRAY[], ARRAY['colecistite', 'biliar'], false),
('find-hist-melena', 'Melena há 2 dias, fraqueza', 'Melena for 2 days, weakness', 'medical_history', ARRAY['K92.1'], ARRAY[], ARRAY['HDA', 'sangramento'], false),
('find-hist-gestante-pa', 'Gestante 32 semanas, PA elevada em consulta', 'Pregnant 32 weeks, elevated BP at visit', 'medical_history', ARRAY['O14'], ARRAY[], ARRAY['pré-eclâmpsia', 'gestação'], false),
('find-hist-disuria-gest', 'Gestante com disúria e polaciúria', 'Pregnant with dysuria and frequency', 'medical_history', ARRAY['O23'], ARRAY[], ARRAY['ITU', 'gestação'], false),
('find-hist-menorragia', 'Sangramento menstrual aumentado há 6 meses', 'Increased menstrual bleeding for 6 months', 'medical_history', ARRAY['N92'], ARRAY[], ARRAY['mioma', 'sangramento'], false),
('find-hist-lactente-coriza', 'Lactente 6 meses, coriza e tosse há 3 dias', 'Infant 6 months, runny nose and cough for 3 days', 'medical_history', ARRAY['J21'], ARRAY[], ARRAY['bronquiolite', 'VSR'], false),
('find-hist-diarreia-crianca', 'Criança 2 anos, diarreia líquida e vômitos', 'Child 2 years, watery diarrhea and vomiting', 'medical_history', ARRAY['A09'], ARRAY[], ARRAY['DDA', 'desidratação'], false),
('find-hist-febre-rigidez', 'Criança com febre alta e irritabilidade', 'Child with high fever and irritability', 'medical_history', ARRAY['G00'], ARRAY[], ARRAY['meningite', 'febre'], false),
('find-hist-tosse-3sem', 'Tosse há mais de 3 semanas, sudorese noturna', 'Cough for over 3 weeks, night sweats', 'medical_history', ARRAY['A15'], ARRAY[], ARRAY['tuberculose', 'tosse'], false),
('find-hist-febre-mialgia', 'Febre, mialgia intensa e cefaleia há 4 dias', 'Fever, intense myalgia and headache for 4 days', 'medical_history', ARRAY['A90'], ARRAY[], ARRAY['dengue', 'arbovirose'], false),

-- Physical Exam findings
('find-exam-acantose', 'Acantose nigricans em região cervical', 'Acanthosis nigricans in cervical region', 'physical_exam', ARRAY['L83'], ARRAY[], ARRAY['diabetes', 'resistência insulínica'], false),
('find-exam-pa-elevada', 'PA 180x110 mmHg, fundoscopia com exsudatos', 'BP 180x110 mmHg, fundoscopy with exudates', 'physical_exam', ARRAY['I10'], ARRAY[], ARRAY['hipertensão', 'lesão órgão-alvo'], false),
('find-exam-turgencia', 'Turgência jugular, edema de membros inferiores', 'Jugular venous distension, lower extremity edema', 'physical_exam', ARRAY['I50'], ARRAY[], ARRAY['ICC', 'congestão'], false),
('find-exam-mv-diminuido', 'MV diminuído bilateralmente, expiração prolongada', 'Decreased breath sounds bilaterally, prolonged expiration', 'physical_exam', ARRAY['J44'], ARRAY[], ARRAY['DPOC', 'obstrução'], false),
('find-exam-crepitacoes', 'Crepitações em base pulmonar direita', 'Crackles at right lung base', 'physical_exam', ARRAY['J18'], ARRAY[], ARRAY['pneumonia', 'consolidação'], false),
('find-exam-blumberg', 'Sinal de Blumberg positivo', 'Positive Blumberg sign', 'physical_exam', ARRAY['K35'], ARRAY[], ARRAY['apendicite', 'peritonite'], false),
('find-exam-murphy', 'Sinal de Murphy positivo', 'Positive Murphy sign', 'physical_exam', ARRAY['K81'], ARRAY[], ARRAY['colecistite', 'vesícula'], false),
('find-exam-palidez', 'Palidez cutâneo-mucosa importante, taquicardia', 'Significant pallor, tachycardia', 'physical_exam', ARRAY['R23.1'], ARRAY[], ARRAY['HDA', 'anemia aguda'], false),
('find-exam-edema-gest', 'Edema de face e mãos, hiperreflexia', 'Facial and hand edema, hyperreflexia', 'physical_exam', ARRAY['O14'], ARRAY[], ARRAY['pré-eclâmpsia', 'gravidade'], false),
('find-exam-giordano', 'Sinal de Giordano positivo à direita', 'Positive right Giordano sign', 'physical_exam', ARRAY['N10'], ARRAY[], ARRAY['pielonefrite', 'ITU'], false),
('find-exam-utero-aumentado', 'Útero aumentado, irregular à palpação', 'Enlarged uterus, irregular on palpation', 'physical_exam', ARRAY['D25'], ARRAY[], ARRAY['mioma', 'massa'], false),
('find-exam-tiragem', 'Tiragem subcostal, sibilos difusos', 'Subcostal retractions, diffuse wheezing', 'physical_exam', ARRAY['J21'], ARRAY[], ARRAY['bronquiolite', 'desconforto'], false),
('find-exam-desidratacao', 'Olhos encovados, turgor diminuído, mucosas secas', 'Sunken eyes, decreased skin turgor, dry mucosa', 'physical_exam', ARRAY['E86'], ARRAY[], ARRAY['desidratação', 'DDA'], false),
('find-exam-rigidez-nucal', 'Rigidez de nuca, Kernig e Brudzinski positivos', 'Neck stiffness, positive Kernig and Brudzinski', 'physical_exam', ARRAY['G00'], ARRAY[], ARRAY['meningite', 'irritação meníngea'], false),
('find-exam-linfonodos', 'Linfonodos cervicais aumentados, indolores', 'Enlarged, painless cervical lymph nodes', 'physical_exam', ARRAY['A15'], ARRAY[], ARRAY['tuberculose', 'adenopatia'], false),
('find-exam-prova-laco', 'Prova do laço positiva, petéquias', 'Positive tourniquet test, petechiae', 'physical_exam', ARRAY['A91'], ARRAY[], ARRAY['dengue', 'plaquetopenia'], false),

-- Laboratory findings
('find-lab-glicemia-alta', 'Glicemia de jejum 280 mg/dL, HbA1c 10%', 'Fasting glucose 280 mg/dL, HbA1c 10%', 'laboratory', ARRAY['R73'], ARRAY[], ARRAY['diabetes', 'hiperglicemia'], false),
('find-lab-creatinina', 'Creatinina 1.8 mg/dL, proteinúria 300 mg/24h', 'Creatinine 1.8 mg/dL, proteinuria 300 mg/24h', 'laboratory', ARRAY['N18'], ARRAY[], ARRAY['nefropatia', 'DRC'], false),
('find-lab-bnp', 'BNP 1500 pg/mL, Rx tórax com cardiomegalia', 'BNP 1500 pg/mL, CXR with cardiomegaly', 'laboratory', ARRAY['I50'], ARRAY[], ARRAY['ICC', 'marcador'], false),
('find-lab-gasometria', 'Gasometria: pH 7.32, pCO2 55, HCO3 28', 'ABG: pH 7.32, pCO2 55, HCO3 28', 'laboratory', ARRAY['J96'], ARRAY[], ARRAY['DPOC', 'acidose respiratória'], false),
('find-lab-leucocitose', 'Leucócitos 18.000, PCR 150 mg/L', 'WBC 18,000, CRP 150 mg/L', 'laboratory', ARRAY['R77'], ARRAY[], ARRAY['infecção', 'inflamação'], false),
('find-lab-pct', 'Procalcitonina 2.5 ng/mL', 'Procalcitonin 2.5 ng/mL', 'laboratory', ARRAY['R50'], ARRAY[], ARRAY['sepse', 'infecção bacteriana'], false),
('find-lab-amilase', 'Amilase e lipase normais, leucocitose', 'Normal amylase and lipase, leukocytosis', 'laboratory', ARRAY['K35'], ARRAY[], ARRAY['apendicite', 'abdome agudo'], false),
('find-lab-bilirrubinas', 'Bilirrubinas elevadas, FA e GGT aumentadas', 'Elevated bilirubin, increased ALP and GGT', 'laboratory', ARRAY['K81'], ARRAY[], ARRAY['colestase', 'colecistite'], false),
('find-lab-hb-baixa', 'Hemoglobina 6.5 g/dL, ureia elevada', 'Hemoglobin 6.5 g/dL, elevated BUN', 'laboratory', ARRAY['D64'], ARRAY[], ARRAY['anemia', 'HDA'], false),
('find-lab-proteinuria-gest', 'Proteinúria 500 mg/24h, plaquetas 110.000', 'Proteinuria 500 mg/24h, platelets 110,000', 'laboratory', ARRAY['O14'], ARRAY[], ARRAY['pré-eclâmpsia', 'HELLP'], false),
('find-lab-urocultura', 'Urocultura: E. coli > 100.000 UFC/mL', 'Urine culture: E. coli > 100,000 CFU/mL', 'laboratory', ARRAY['N39'], ARRAY[], ARRAY['ITU', 'bacteriúria'], false),
('find-lab-hb-ferritina', 'Hemoglobina 9 g/dL, ferritina baixa', 'Hemoglobin 9 g/dL, low ferritin', 'laboratory', ARRAY['D50'], ARRAY[], ARRAY['anemia ferropriva', 'sangramento'], false),
('find-lab-sat-o2', 'Saturação O2 88% em ar ambiente', 'O2 saturation 88% on room air', 'laboratory', ARRAY['J96'], ARRAY[], ARRAY['hipoxemia', 'bronquiolite'], false),
('find-lab-na-baixo', 'Sódio 128 mEq/L, osmolaridade baixa', 'Sodium 128 mEq/L, low osmolality', 'laboratory', ARRAY['E87'], ARRAY[], ARRAY['hiponatremia', 'desidratação'], false),
('find-lab-lcr', 'LCR: pleocitose neutrofílica, glicose baixa, proteína alta', 'CSF: neutrophilic pleocytosis, low glucose, high protein', 'laboratory', ARRAY['G00'], ARRAY[], ARRAY['meningite bacteriana', 'LCR'], false),
('find-lab-baar', 'BAAR positivo no escarro, 2 amostras', 'Positive AFB smear in sputum, 2 samples', 'laboratory', ARRAY['A15'], ARRAY[], ARRAY['tuberculose', 'diagnóstico'], false),
('find-lab-plaquetopenia', 'Plaquetas 45.000, hematócrito aumentando', 'Platelets 45,000, rising hematocrit', 'laboratory', ARRAY['A91'], ARRAY[], ARRAY['dengue grave', 'alarme'], false),

-- Treatment findings
('find-trat-metformina', 'Metformina 850mg 2x/dia + orientação dietética', 'Metformin 850mg twice daily + dietary counseling', 'treatment', ARRAY[], ARRAY['A10BA02'], ARRAY['diabetes', 'primeira linha'], false),
('find-trat-anti-hipertensivo', 'Losartana 50mg + HCTZ 12.5mg', 'Losartan 50mg + HCTZ 12.5mg', 'treatment', ARRAY[], ARRAY['C09DA01', 'C03AA03'], ARRAY['hipertensão', 'combinação'], false),
('find-trat-furosemida', 'Furosemida 40mg IV + restrição hídrica', 'Furosemide 40mg IV + fluid restriction', 'treatment', ARRAY[], ARRAY['C03CA01'], ARRAY['ICC', 'diurético'], false),
('find-trat-broncodilatador', 'Salbutamol + brometo de ipratrópio + corticoide inalatório', 'Albuterol + ipratropium + inhaled corticosteroid', 'treatment', ARRAY[], ARRAY['R03AC02', 'R03BB01', 'R03BA'], ARRAY['DPOC', 'broncodilatadores'], false),
('find-trat-amoxicilina', 'Amoxicilina + clavulanato 875/125mg 12/12h', 'Amoxicillin-clavulanate 875/125mg every 12h', 'treatment', ARRAY[], ARRAY['J01CR02'], ARRAY['pneumonia', 'antibiótico'], false),
('find-trat-apendicectomia', 'Apendicectomia laparoscópica + antibioticoprofilaxia', 'Laparoscopic appendectomy + antibiotic prophylaxis', 'treatment', ARRAY[], ARRAY[], ARRAY['apendicite', 'cirurgia'], false),
('find-trat-colecistectomia', 'Colecistectomia videolaparoscópica eletiva', 'Elective laparoscopic cholecystectomy', 'treatment', ARRAY[], ARRAY[], ARRAY['colecistite', 'cirurgia'], false),
('find-trat-eda', 'EDA urgente + IBP IV em dose alta', 'Urgent EGD + high-dose IV PPI', 'treatment', ARRAY[], ARRAY['A02BC01'], ARRAY['HDA', 'endoscopia'], false),
('find-trat-sulfato-mg', 'Sulfato de magnésio + anti-hipertensivo + parto', 'Magnesium sulfate + antihypertensive + delivery', 'treatment', ARRAY[], ARRAY['A12CC02', 'C02'], ARRAY['pré-eclâmpsia', 'prevenção convulsão'], false),
('find-trat-nitrofurantoina', 'Nitrofurantoína 100mg 6/6h por 7 dias', 'Nitrofurantoin 100mg every 6h for 7 days', 'treatment', ARRAY[], ARRAY['J01XE01'], ARRAY['ITU', 'gestação seguro'], false),
('find-trat-acido-tranexamico', 'Ácido tranexâmico + DIU hormonal', 'Tranexamic acid + hormonal IUD', 'treatment', ARRAY[], ARRAY['B02AA02'], ARRAY['sangramento', 'mioma'], false),
('find-trat-suporte-bva', 'Oxigenoterapia + hidratação + aspiração nasal', 'Oxygen therapy + hydration + nasal suctioning', 'treatment', ARRAY[], ARRAY[], ARRAY['bronquiolite', 'suporte'], false),
('find-trat-sro', 'Solução de reidratação oral - Plano B', 'Oral rehydration solution - Plan B', 'treatment', ARRAY[], ARRAY['A07CA'], ARRAY['DDA', 'reidratação'], false),
('find-trat-ceftriaxona', 'Ceftriaxona 100mg/kg/dia + dexametasona', 'Ceftriaxone 100mg/kg/day + dexamethasone', 'treatment', ARRAY[], ARRAY['J01DD04', 'H02AB02'], ARRAY['meningite', 'antibiótico'], false),
('find-trat-ripe', 'RIPE: Rifampicina + Isoniazida + Pirazinamida + Etambutol', 'RIPE: Rifampin + Isoniazid + Pyrazinamide + Ethambutol', 'treatment', ARRAY[], ARRAY['J04AM02'], ARRAY['tuberculose', 'esquema básico'], false),
('find-trat-sintomatico-dengue', 'Hidratação oral vigorosa + paracetamol (evitar AINEs)', 'Vigorous oral hydration + acetaminophen (avoid NSAIDs)', 'treatment', ARRAY[], ARRAY['N02BE01'], ARRAY['dengue', 'sintomático'], false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CIP Diagnosis-Finding Links
-- ============================================

INSERT INTO cip_diagnosis_findings (diagnosis_id, finding_id, section, is_primary) VALUES
-- Diabetes
('diag-dm2', 'find-hist-polidipsia', 'medical_history', true),
('diag-dm2', 'find-exam-acantose', 'physical_exam', true),
('diag-dm2', 'find-lab-glicemia-alta', 'laboratory', true),
('diag-dm2', 'find-trat-metformina', 'treatment', true),

-- Hipertensão
('diag-has', 'find-hist-cefaleia-has', 'medical_history', true),
('diag-has', 'find-exam-pa-elevada', 'physical_exam', true),
('diag-has', 'find-lab-creatinina', 'laboratory', true),
('diag-has', 'find-trat-anti-hipertensivo', 'treatment', true),

-- ICC
('diag-icc', 'find-hist-dispneia-esforco', 'medical_history', true),
('diag-icc', 'find-exam-turgencia', 'physical_exam', true),
('diag-icc', 'find-lab-bnp', 'laboratory', true),
('diag-icc', 'find-trat-furosemida', 'treatment', true),

-- DPOC
('diag-dpoc', 'find-hist-tabagismo', 'medical_history', true),
('diag-dpoc', 'find-exam-mv-diminuido', 'physical_exam', true),
('diag-dpoc', 'find-lab-gasometria', 'laboratory', true),
('diag-dpoc', 'find-trat-broncodilatador', 'treatment', true),

-- Pneumonia
('diag-pneumonia', 'find-hist-febre-tosse', 'medical_history', true),
('diag-pneumonia', 'find-exam-crepitacoes', 'physical_exam', true),
('diag-pneumonia', 'find-lab-leucocitose', 'laboratory', true),
('diag-pneumonia', 'find-trat-amoxicilina', 'treatment', true),

-- Apendicite
('diag-apendicite', 'find-hist-dor-fid', 'medical_history', true),
('diag-apendicite', 'find-exam-blumberg', 'physical_exam', true),
('diag-apendicite', 'find-lab-amilase', 'laboratory', true),
('diag-apendicite', 'find-trat-apendicectomia', 'treatment', true),

-- Colecistite
('diag-colecistite', 'find-hist-colica-biliar', 'medical_history', true),
('diag-colecistite', 'find-exam-murphy', 'physical_exam', true),
('diag-colecistite', 'find-lab-bilirrubinas', 'laboratory', true),
('diag-colecistite', 'find-trat-colecistectomia', 'treatment', true),

-- HDA
('diag-hda', 'find-hist-melena', 'medical_history', true),
('diag-hda', 'find-exam-palidez', 'physical_exam', true),
('diag-hda', 'find-lab-hb-baixa', 'laboratory', true),
('diag-hda', 'find-trat-eda', 'treatment', true),

-- Pré-eclâmpsia
('diag-pre-eclampsia', 'find-hist-gestante-pa', 'medical_history', true),
('diag-pre-eclampsia', 'find-exam-edema-gest', 'physical_exam', true),
('diag-pre-eclampsia', 'find-lab-proteinuria-gest', 'laboratory', true),
('diag-pre-eclampsia', 'find-trat-sulfato-mg', 'treatment', true),

-- ITU na gestação
('diag-itu-gestante', 'find-hist-disuria-gest', 'medical_history', true),
('diag-itu-gestante', 'find-exam-giordano', 'physical_exam', true),
('diag-itu-gestante', 'find-lab-urocultura', 'laboratory', true),
('diag-itu-gestante', 'find-trat-nitrofurantoina', 'treatment', true),

-- Mioma
('diag-mioma', 'find-hist-menorragia', 'medical_history', true),
('diag-mioma', 'find-exam-utero-aumentado', 'physical_exam', true),
('diag-mioma', 'find-lab-hb-ferritina', 'laboratory', true),
('diag-mioma', 'find-trat-acido-tranexamico', 'treatment', true),

-- Bronquiolite
('diag-bva', 'find-hist-lactente-coriza', 'medical_history', true),
('diag-bva', 'find-exam-tiragem', 'physical_exam', true),
('diag-bva', 'find-lab-sat-o2', 'laboratory', true),
('diag-bva', 'find-trat-suporte-bva', 'treatment', true),

-- DDA
('diag-dda', 'find-hist-diarreia-crianca', 'medical_history', true),
('diag-dda', 'find-exam-desidratacao', 'physical_exam', true),
('diag-dda', 'find-lab-na-baixo', 'laboratory', true),
('diag-dda', 'find-trat-sro', 'treatment', true),

-- Meningite
('diag-meningite-bact', 'find-hist-febre-rigidez', 'medical_history', true),
('diag-meningite-bact', 'find-exam-rigidez-nucal', 'physical_exam', true),
('diag-meningite-bact', 'find-lab-lcr', 'laboratory', true),
('diag-meningite-bact', 'find-trat-ceftriaxona', 'treatment', true),

-- Tuberculose
('diag-tb-pulmonar', 'find-hist-tosse-3sem', 'medical_history', true),
('diag-tb-pulmonar', 'find-exam-linfonodos', 'physical_exam', true),
('diag-tb-pulmonar', 'find-lab-baar', 'laboratory', true),
('diag-tb-pulmonar', 'find-trat-ripe', 'treatment', true),

-- Dengue
('diag-dengue', 'find-hist-febre-mialgia', 'medical_history', true),
('diag-dengue', 'find-exam-prova-laco', 'physical_exam', true),
('diag-dengue', 'find-lab-plaquetopenia', 'laboratory', true),
('diag-dengue', 'find-trat-sintomatico-dengue', 'treatment', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Sample CIP Puzzle (Clínica Médica)
-- ============================================

INSERT INTO cip_puzzles (
  id, title, description, areas, difficulty,
  diagnosis_ids, options_per_section, settings,
  time_limit_minutes, irt_difficulty, type, created_by
) VALUES (
  'puzzle-clinica-01',
  'Clínica Médica - Doenças Crônicas',
  'Associe os achados clínicos aos diagnósticos de doenças crônicas comuns.',
  ARRAY['clinica_medica'],
  'medio',
  ARRAY['diag-dm2', 'diag-has', 'diag-icc', 'diag-dpoc'],
  '{
    "medical_history": ["find-hist-polidipsia", "find-hist-cefaleia-has", "find-hist-dispneia-esforco", "find-hist-tabagismo", "find-hist-febre-tosse", "find-hist-dor-fid"],
    "physical_exam": ["find-exam-acantose", "find-exam-pa-elevada", "find-exam-turgencia", "find-exam-mv-diminuido", "find-exam-crepitacoes", "find-exam-blumberg"],
    "laboratory": ["find-lab-glicemia-alta", "find-lab-creatinina", "find-lab-bnp", "find-lab-gasometria", "find-lab-leucocitose", "find-lab-amilase"],
    "treatment": ["find-trat-metformina", "find-trat-anti-hipertensivo", "find-trat-furosemida", "find-trat-broncodilatador", "find-trat-amoxicilina", "find-trat-apendicectomia"]
  }'::jsonb,
  '{
    "diagnosisCount": 4,
    "sections": ["medical_history", "physical_exam", "laboratory", "treatment"],
    "distractorCount": 2,
    "allowReuse": false,
    "minDistractorSimilarity": 0.3,
    "maxDistractorSimilarity": 0.7
  }'::jsonb,
  20,
  0.5,
  'practice',
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- Grid for puzzle-clinica-01
INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id, irt_difficulty) VALUES
-- Row 0: DM2
('puzzle-clinica-01', 0, 'medical_history', 'find-hist-polidipsia', 0.3),
('puzzle-clinica-01', 0, 'physical_exam', 'find-exam-acantose', 0.4),
('puzzle-clinica-01', 0, 'laboratory', 'find-lab-glicemia-alta', 0.2),
('puzzle-clinica-01', 0, 'treatment', 'find-trat-metformina', 0.3),
-- Row 1: HAS
('puzzle-clinica-01', 1, 'medical_history', 'find-hist-cefaleia-has', 0.4),
('puzzle-clinica-01', 1, 'physical_exam', 'find-exam-pa-elevada', 0.3),
('puzzle-clinica-01', 1, 'laboratory', 'find-lab-creatinina', 0.5),
('puzzle-clinica-01', 1, 'treatment', 'find-trat-anti-hipertensivo', 0.3),
-- Row 2: ICC
('puzzle-clinica-01', 2, 'medical_history', 'find-hist-dispneia-esforco', 0.5),
('puzzle-clinica-01', 2, 'physical_exam', 'find-exam-turgencia', 0.4),
('puzzle-clinica-01', 2, 'laboratory', 'find-lab-bnp', 0.4),
('puzzle-clinica-01', 2, 'treatment', 'find-trat-furosemida', 0.3),
-- Row 3: DPOC
('puzzle-clinica-01', 3, 'medical_history', 'find-hist-tabagismo', 0.3),
('puzzle-clinica-01', 3, 'physical_exam', 'find-exam-mv-diminuido', 0.4),
('puzzle-clinica-01', 3, 'laboratory', 'find-lab-gasometria', 0.6),
('puzzle-clinica-01', 3, 'treatment', 'find-trat-broncodilatador', 0.4)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Sample CIP Puzzle (Cirurgia)
-- ============================================

INSERT INTO cip_puzzles (
  id, title, description, areas, difficulty,
  diagnosis_ids, options_per_section, settings,
  time_limit_minutes, irt_difficulty, type, created_by
) VALUES (
  'puzzle-cirurgia-01',
  'Cirurgia - Abdome Agudo',
  'Associe os achados clínicos aos diagnósticos de urgências abdominais.',
  ARRAY['cirurgia'],
  'medio',
  ARRAY['diag-apendicite', 'diag-colecistite', 'diag-hda'],
  '{
    "medical_history": ["find-hist-dor-fid", "find-hist-colica-biliar", "find-hist-melena", "find-hist-febre-tosse", "find-hist-dispneia-esforco"],
    "physical_exam": ["find-exam-blumberg", "find-exam-murphy", "find-exam-palidez", "find-exam-crepitacoes", "find-exam-turgencia"],
    "laboratory": ["find-lab-amilase", "find-lab-bilirrubinas", "find-lab-hb-baixa", "find-lab-leucocitose", "find-lab-bnp"],
    "treatment": ["find-trat-apendicectomia", "find-trat-colecistectomia", "find-trat-eda", "find-trat-amoxicilina", "find-trat-furosemida"]
  }'::jsonb,
  '{
    "diagnosisCount": 3,
    "sections": ["medical_history", "physical_exam", "laboratory", "treatment"],
    "distractorCount": 2,
    "allowReuse": false,
    "minDistractorSimilarity": 0.3,
    "maxDistractorSimilarity": 0.7
  }'::jsonb,
  15,
  0.6,
  'practice',
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- Grid for puzzle-cirurgia-01
INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id, irt_difficulty) VALUES
-- Row 0: Apendicite
('puzzle-cirurgia-01', 0, 'medical_history', 'find-hist-dor-fid', 0.3),
('puzzle-cirurgia-01', 0, 'physical_exam', 'find-exam-blumberg', 0.4),
('puzzle-cirurgia-01', 0, 'laboratory', 'find-lab-amilase', 0.5),
('puzzle-cirurgia-01', 0, 'treatment', 'find-trat-apendicectomia', 0.3),
-- Row 1: Colecistite
('puzzle-cirurgia-01', 1, 'medical_history', 'find-hist-colica-biliar', 0.4),
('puzzle-cirurgia-01', 1, 'physical_exam', 'find-exam-murphy', 0.3),
('puzzle-cirurgia-01', 1, 'laboratory', 'find-lab-bilirrubinas', 0.5),
('puzzle-cirurgia-01', 1, 'treatment', 'find-trat-colecistectomia', 0.4),
-- Row 2: HDA
('puzzle-cirurgia-01', 2, 'medical_history', 'find-hist-melena', 0.4),
('puzzle-cirurgia-01', 2, 'physical_exam', 'find-exam-palidez', 0.3),
('puzzle-cirurgia-01', 2, 'laboratory', 'find-lab-hb-baixa', 0.4),
('puzzle-cirurgia-01', 2, 'treatment', 'find-trat-eda', 0.5)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. Sample CIP Puzzle (Pediatria)
-- ============================================

INSERT INTO cip_puzzles (
  id, title, description, areas, difficulty,
  diagnosis_ids, options_per_section, settings,
  time_limit_minutes, irt_difficulty, type, created_by
) VALUES (
  'puzzle-pediatria-01',
  'Pediatria - Urgências Pediátricas',
  'Associe os achados clínicos aos diagnósticos de emergências pediátricas comuns.',
  ARRAY['pediatria'],
  'dificil',
  ARRAY['diag-bva', 'diag-dda', 'diag-meningite-bact'],
  '{
    "medical_history": ["find-hist-lactente-coriza", "find-hist-diarreia-crianca", "find-hist-febre-rigidez", "find-hist-febre-tosse", "find-hist-polidipsia"],
    "physical_exam": ["find-exam-tiragem", "find-exam-desidratacao", "find-exam-rigidez-nucal", "find-exam-crepitacoes", "find-exam-acantose"],
    "laboratory": ["find-lab-sat-o2", "find-lab-na-baixo", "find-lab-lcr", "find-lab-leucocitose", "find-lab-glicemia-alta"],
    "treatment": ["find-trat-suporte-bva", "find-trat-sro", "find-trat-ceftriaxona", "find-trat-amoxicilina", "find-trat-metformina"]
  }'::jsonb,
  '{
    "diagnosisCount": 3,
    "sections": ["medical_history", "physical_exam", "laboratory", "treatment"],
    "distractorCount": 2,
    "allowReuse": false,
    "minDistractorSimilarity": 0.3,
    "maxDistractorSimilarity": 0.7
  }'::jsonb,
  15,
  0.8,
  'practice',
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- Grid for puzzle-pediatria-01
INSERT INTO cip_puzzle_grid (puzzle_id, row_index, section, correct_finding_id, irt_difficulty) VALUES
-- Row 0: Bronquiolite
('puzzle-pediatria-01', 0, 'medical_history', 'find-hist-lactente-coriza', 0.4),
('puzzle-pediatria-01', 0, 'physical_exam', 'find-exam-tiragem', 0.5),
('puzzle-pediatria-01', 0, 'laboratory', 'find-lab-sat-o2', 0.4),
('puzzle-pediatria-01', 0, 'treatment', 'find-trat-suporte-bva', 0.5),
-- Row 1: DDA
('puzzle-pediatria-01', 1, 'medical_history', 'find-hist-diarreia-crianca', 0.3),
('puzzle-pediatria-01', 1, 'physical_exam', 'find-exam-desidratacao', 0.4),
('puzzle-pediatria-01', 1, 'laboratory', 'find-lab-na-baixo', 0.5),
('puzzle-pediatria-01', 1, 'treatment', 'find-trat-sro', 0.3),
-- Row 2: Meningite
('puzzle-pediatria-01', 2, 'medical_history', 'find-hist-febre-rigidez', 0.5),
('puzzle-pediatria-01', 2, 'physical_exam', 'find-exam-rigidez-nucal', 0.4),
('puzzle-pediatria-01', 2, 'laboratory', 'find-lab-lcr', 0.6),
('puzzle-pediatria-01', 2, 'treatment', 'find-trat-ceftriaxona', 0.5)
ON CONFLICT DO NOTHING;

-- ============================================
-- Summary
-- ============================================
-- Created:
-- - 16 diagnoses across all 5 ENAMED areas
-- - 48 findings (16 per section type: history, exam, lab, treatment)
-- - 64 diagnosis-finding links
-- - 3 sample puzzles (Clínica Médica, Cirurgia, Pediatria)
-- - 28 puzzle grid cells
