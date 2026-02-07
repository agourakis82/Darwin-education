-- ============================================
-- CIP Expanded Data - 15 New Diagnoses + 90 Findings
-- ============================================
-- SAFE RE-RUNNABLE: Uses NOT EXISTS guards
-- Fills gaps: saude_coletiva area, pathology section, imaging expansion
-- Run AFTER cip-sample-data.sql and cip-full-puzzles-fixed.sql

-- Step 1: Remove duplicate diagnoses (keep oldest)
DELETE FROM cip_diagnoses a
USING cip_diagnoses b
WHERE a.created_at > b.created_at AND a.name_pt = b.name_pt;

-- Step 2: Remove duplicate findings (keep oldest)
DELETE FROM cip_findings a
USING cip_findings b
WHERE a.created_at > b.created_at AND a.text_pt = b.text_pt AND a.section = b.section;

-- Step 3: Insert 15 new diagnoses
INSERT INTO cip_diagnoses (name_pt, icd10_code, area, subspecialty, difficulty_tier)
SELECT v.* FROM (VALUES
  ('Tuberculose Pulmonar', 'A15', 'saude_coletiva', 'pneumologia', 3),
  ('Dengue', 'A90', 'saude_coletiva', 'infectologia', 2),
  ('Hanseníase', 'A30', 'saude_coletiva', 'dermatologia', 3),
  ('Leptospirose', 'A27', 'saude_coletiva', 'infectologia', 3),
  ('Cirrose Hepática', 'K74', 'clinica_medica', 'gastroenterologia', 4),
  ('AVC Isquêmico', 'I63', 'clinica_medica', 'neurologia', 4),
  ('Tromboembolismo Pulmonar', 'I26', 'clinica_medica', 'pneumologia', 4),
  ('Obstrução Intestinal', 'K56', 'cirurgia', 'cirurgia_geral', 3),
  ('Hérnia Inguinal Encarcerada', 'K40', 'cirurgia', 'cirurgia_geral', 2),
  ('Placenta Prévia', 'O44', 'ginecologia_obstetricia', 'obstetricia', 4),
  ('Síndrome HELLP', 'O14.2', 'ginecologia_obstetricia', 'obstetricia', 5),
  ('Trabalho de Parto Prematuro', 'O60', 'ginecologia_obstetricia', 'obstetricia', 3),
  ('Meningite Bacteriana', 'G00', 'pediatria', 'neurologia', 4),
  ('Desidratação Grave', 'E86', 'pediatria', 'gastroenterologia', 2),
  ('Crise Asmática na Infância', 'J46', 'pediatria', 'pneumologia', 3)
) AS v(name_pt, icd10_code, area, subspecialty, difficulty_tier)
WHERE NOT EXISTS (SELECT 1 FROM cip_diagnoses WHERE cip_diagnoses.name_pt = v.name_pt);

-- Step 4: Insert findings (6 sections × 15 diagnoses = 90 findings)
-- Also adds pathology findings for the 10 EXISTING diagnoses (from previous scripts)

INSERT INTO cip_findings (text_pt, section)
SELECT v.* FROM (VALUES

  -- =============================================
  -- TUBERCULOSE PULMONAR (A15)
  -- =============================================
  ('Tosse produtiva há mais de 3 semanas, sudorese noturna, emagrecimento', 'medical_history'),
  ('Crepitações em ápices pulmonares, linfadenopatia cervical', 'physical_exam'),
  ('BAAR positivo no escarro, PPD reator forte (> 10mm)', 'laboratory'),
  ('RX tórax: infiltrado em ápices com cavitação', 'imaging'),
  ('Granuloma caseoso com células gigantes de Langhans', 'pathology'),
  ('Esquema RIPE (Rifampicina + Isoniazida + Pirazinamida + Etambutol) 6 meses', 'treatment'),

  -- =============================================
  -- DENGUE (A90)
  -- =============================================
  ('Febre alta há 4 dias, mialgia intensa, cefaleia retro-orbitária', 'medical_history'),
  ('Prova do laço positiva, petéquias em membros inferiores', 'physical_exam'),
  ('Plaquetopenia (< 100.000/mm³), hematócrito elevado', 'laboratory'),
  ('USG abdominal: líquido livre em pelve e derrame pleural à direita', 'imaging'),
  ('Infiltrado linfoplasmocitário perivascular com edema dérmico', 'pathology'),
  ('Hidratação vigorosa VO/EV + monitorização de sinais de alarme', 'treatment'),

  -- =============================================
  -- HANSENÍASE (A30)
  -- =============================================
  ('Manchas hipocrômicas com perda de sensibilidade há meses', 'medical_history'),
  ('Espessamento de nervos periféricos (ulnar, fibular), lesões em placa', 'physical_exam'),
  ('Baciloscopia de linfa: BAAR com globias (multibacilar)', 'laboratory'),
  ('Eletroneuromiografia: neuropatia periférica mista', 'imaging'),
  ('Granuloma com células epitelioides e bacilos de Hansen (Fite-Faraco +)', 'pathology'),
  ('Poliquimioterapia (Dapsona + Rifampicina + Clofazimina) 12 meses', 'treatment'),

  -- =============================================
  -- LEPTOSPIROSE (A27)
  -- =============================================
  ('Febre, mialgia intensa em panturrilhas, exposição a enchente/esgoto', 'medical_history'),
  ('Icterícia rubínica, sufusão conjuntival, hepatomegalia dolorosa', 'physical_exam'),
  ('Bilirrubina direta elevada, creatinina elevada (IRA), CPK alto', 'laboratory'),
  ('RX tórax: infiltrado alveolar bilateral (hemorragia pulmonar)', 'imaging'),
  ('Necrose tubular aguda com infiltrado inflamatório intersticial renal', 'pathology'),
  ('Penicilina cristalina EV + suporte hemodinâmico e diálise se necessário', 'treatment'),

  -- =============================================
  -- CIRROSE HEPÁTICA (K74)
  -- =============================================
  ('Etilismo crônico há 20 anos, astenia progressiva, edema de MMII', 'medical_history'),
  ('Ascite volumosa, circulação colateral (caput medusae), aranhas vasculares', 'physical_exam'),
  ('Albumina < 3.0 g/dL, INR alargado (> 1.5), bilirrubinas elevadas', 'laboratory'),
  ('USG abdominal: fígado reduzido, ecotextura heterogênea, esplenomegalia', 'imaging'),
  ('Fibrose portal em pontes com nódulos regenerativos e esteatose', 'pathology'),
  ('Espironolactona + furosemida, restrição sódica, lactulose profilática', 'treatment'),

  -- =============================================
  -- AVC ISQUÊMICO (I63)
  -- =============================================
  ('Déficit neurológico súbito: hemiparesia D e afasia há 2 horas', 'medical_history'),
  ('Desvio de rima labial, força grau 2 em dimídio D, Babinski positivo', 'physical_exam'),
  ('Glicemia 110 mg/dL, coagulograma normal, INR 1.0', 'laboratory'),
  ('TC crânio: hipodensidade em território de ACM esquerda', 'imaging'),
  ('Necrose de liquefação com edema perilesional e gliose reativa', 'pathology'),
  ('Trombólise com alteplase EV (se < 4.5h) + AAS 100mg após 24h', 'treatment'),

  -- =============================================
  -- TROMBOEMBOLISMO PULMONAR (I26)
  -- =============================================
  ('Dispneia súbita e dor torácica pleurítica após imobilização prolongada', 'medical_history'),
  ('Taquicardia (FC 120), taquipneia, empastamento em panturrilha (TVP)', 'physical_exam'),
  ('D-dímero > 500 ng/mL, gasometria com hipoxemia e hipocapnia', 'laboratory'),
  ('AngioTC de tórax: falha de enchimento em artéria pulmonar direita', 'imaging'),
  ('Trombo organizado com recanalização parcial no vaso pulmonar', 'pathology'),
  ('Heparina não-fracionada EV em bomba + warfarina oral + meias compressivas', 'treatment'),

  -- =============================================
  -- OBSTRUÇÃO INTESTINAL (K56)
  -- =============================================
  ('Parada de eliminação de fezes e flatos há 48h, vômitos fecaloides', 'medical_history'),
  ('Distensão abdominal, RHA metálicos (timbre aumentado), cicatriz cirúrgica prévia', 'physical_exam'),
  ('Hipocalemia (K 2.9), leucocitose 15.000, lactato elevado', 'laboratory'),
  ('RX abdome: níveis hidroaéreos em escada com distensão de alças', 'imaging'),
  ('Isquemia de parede intestinal com necrose transmural (se estrangulamento)', 'pathology'),
  ('Descompressão com SNG + hidratação EV + cirurgia se estrangulamento', 'treatment'),

  -- =============================================
  -- HÉRNIA INGUINAL ENCARCERADA (K40)
  -- =============================================
  ('Abaulamento inguinal doloroso há 6 horas, irredutível, náuseas', 'medical_history'),
  ('Massa inguinal tensa e dolorosa à palpação, sem redução manual', 'physical_exam'),
  ('Leucocitose discreta (12.000), PCR elevada (35 mg/L)', 'laboratory'),
  ('USG inguinal: conteúdo herniário com alça espessada sem fluxo vascular', 'imaging'),
  ('Edema e congestão venosa de parede de alça intestinal encarcerada', 'pathology'),
  ('Herniorrafia inguinal de emergência + ressecção intestinal se necrose', 'treatment'),

  -- =============================================
  -- PLACENTA PRÉVIA (O44)
  -- =============================================
  ('Sangramento vaginal indolor no 3º trimestre, vermelho vivo e abundante', 'medical_history'),
  ('Útero indolor e normotônico, BCF presentes, sangue rutilante ao toque', 'physical_exam'),
  ('Hemograma: Hb 9.0 g/dL, tipagem sanguínea ABO/Rh, reserva de sangue', 'laboratory'),
  ('USG obstétrica: placenta recobrindo totalmente o OCI (prévia total)', 'imaging'),
  ('Vilosidades coriônicas com vasos dilatados e trombose focal', 'pathology'),
  ('Internação + corticoide para maturação fetal + cesárea programada a termo', 'treatment'),

  -- =============================================
  -- SÍNDROME HELLP (O14.2)
  -- =============================================
  ('Gestante 35 semanas com mal-estar, dor em barra epigástrica e náuseas intensas', 'medical_history'),
  ('PA: 170/110 mmHg, edema facial importante, dor à palpação de hipocôndrio D', 'physical_exam'),
  ('Hemólise (LDH > 600, esquizócitos), AST/ALT > 70 U/L, plaquetas < 100.000', 'laboratory'),
  ('USG hepática: hematoma subcapsular hepático', 'imaging'),
  ('Necrose hemorrágica periportal com depósitos de fibrina sinusoidal', 'pathology'),
  ('Sulfato de magnésio + resolução imediata da gestação (parto) + corticoide', 'treatment'),

  -- =============================================
  -- TRABALHO DE PARTO PREMATURO (O60)
  -- =============================================
  ('Gestante 30 semanas com contrações regulares e pressão pélvica crescente', 'medical_history'),
  ('Colo uterino com 3cm dilatação, 70% apagamento, dinâmica 3 contrações/10min', 'physical_exam'),
  ('Fibronectina fetal positiva, cultura GBS coletada, hemograma normal', 'laboratory'),
  ('USG transvaginal: colo uterino < 25mm com afunilamento', 'imaging'),
  ('Inflamação corioamniótica com infiltrado polimorfonuclear', 'pathology'),
  ('Nifedipino (tocolítico) + betametasona 12mg IM + MgSO4 (neuroproteção)', 'treatment'),

  -- =============================================
  -- MENINGITE BACTERIANA (G00)
  -- =============================================
  ('Criança 3 anos com febre alta, vômitos em jato e irritabilidade há 24h', 'medical_history'),
  ('Rigidez de nuca, sinal de Kernig positivo, fontanela abaulada', 'physical_exam'),
  ('Líquor: pleocitose neutrofílica (> 1000), glicose < 40, proteína > 100', 'laboratory'),
  ('TC crânio: sem sinais de hipertensão intracraniana (liberação para punção)', 'imaging'),
  ('Exsudato purulento leptomeníngeo com vasculite e necrose cortical focal', 'pathology'),
  ('Ceftriaxona 100mg/kg/dia EV + dexametasona 0.15mg/kg + isolamento', 'treatment'),

  -- =============================================
  -- DESIDRATAÇÃO GRAVE (E86)
  -- =============================================
  ('Lactente 8 meses com diarreia líquida e vômitos há 3 dias, recusa alimentar', 'medical_history'),
  ('Olhos encovados, turgor pastoso, fontanela deprimida, letargia', 'physical_exam'),
  ('Na: 128 mEq/L (hiponatremia), K: 2.8 mEq/L, gasometria: acidose metabólica', 'laboratory'),
  ('RX abdome: distensão gasosa difusa sem níveis (íleo paralítico funcional)', 'imaging'),
  ('Necrose tubular aguda por hipoperfusão renal (em casos graves)', 'pathology'),
  ('SF 0.9% 20mL/kg em bolus + reposição de K+ + reavaliação seriada', 'treatment'),

  -- =============================================
  -- CRISE ASMÁTICA NA INFÂNCIA (J46)
  -- =============================================
  ('Criança 5 anos com dispneia progressiva, chiado e tosse após poeira', 'medical_history'),
  ('Tiragem intercostal e subcostal, sibilos difusos bilaterais, uso de musculatura acessória', 'physical_exam'),
  ('SatO2: 88% em ar ambiente, gasometria: pCO2 elevado (sinal de gravidade)', 'laboratory'),
  ('RX tórax: hiperinsuflação pulmonar bilateral com retificação diafragmática', 'imaging'),
  ('Espessamento de membrana basal brônquica com hiperplasia de células caliciformes', 'pathology'),
  ('Salbutamol NBZ 3 doses/1h + ipratrópio + prednisolona VO + O2 suplementar', 'treatment'),

  -- =============================================
  -- PATHOLOGY FINDINGS FOR EXISTING DIAGNOSES
  -- (These 10 diagnoses from previous scripts had no pathology)
  -- =============================================

  -- ICC (I50)
  ('Miocardiopatia dilatada com fibrose intersticial e hipertrofia de cardiomiócitos', 'pathology'),
  -- IAM (I21)
  ('Necrose coagulativa do miocárdio com infiltrado neutrofílico (12-24h)', 'pathology'),
  -- DPOC (J44)
  ('Destruição de septos alveolares (enfisema) com hiperplasia de glândulas mucosas', 'pathology'),
  -- Asma (J45)
  ('Espessamento de membrana basal, hiperplasia muscular lisa brônquica, eosinófilos', 'pathology'),
  -- Hipotireoidismo (E03)
  ('Infiltração mixedematosa com depósito de mucopolissacarídeos em tecido conectivo', 'pathology'),
  -- Colecistite (K81)
  ('Infiltrado neutrofílico transmural da vesícula com edema e congestão vascular', 'pathology'),
  -- HDA (K92)
  ('Úlcera péptica com erosão de vaso arterial em base e fibrina na superfície', 'pathology'),
  -- Bronquiolite (J21)
  ('Necrose do epitélio bronquiolar com infiltrado linfocitário peribronquial', 'pathology'),
  -- Pré-eclâmpsia (O14)
  ('Endoteliose glomerular com edema endotelial e depósitos subendoteliais de fibrina', 'pathology'),
  -- ITU na Gestação (O23)
  ('Pielonefrite aguda com infiltrado neutrofílico tubulointersticial e microabscessos', 'pathology'),

  -- =============================================
  -- ADDITIONAL IMAGING FINDINGS FOR EXISTING DIAGNOSES
  -- (Only 4 imaging findings existed before)
  -- =============================================

  -- ICC (I50)
  ('RX tórax: cardiomegalia (ICT > 0.5), congestão hilar bilateral, derrame pleural', 'imaging'),
  -- DPOC (J44)
  ('RX tórax: hiperinsuflação, retificação diafragmática, aumento do espaço retroesternal', 'imaging'),
  -- Asma (J45)
  ('RX tórax: hiperinsuflação bilateral (durante crise), sem condensação', 'imaging'),
  -- Hipotireoidismo (E03)
  ('USG tireoide: tireoide reduzida, ecotextura heterogênea (tireoidite de Hashimoto)', 'imaging'),
  -- Bronquiolite (J21)
  ('RX tórax: hiperinsuflação com atelectasia subsegmentar e espessamento peribrônquico', 'imaging'),
  -- Pré-eclâmpsia (O14)
  ('USG obstétrica com Doppler: incisura protodiastólica em artérias uterinas', 'imaging'),
  -- ITU na Gestação (O23)
  ('USG rins e vias urinárias: dilatação pielocalicial (hidronefrose fisiológica vs obstrutiva)', 'imaging'),
  -- DM2 (E11)
  ('Fundoscopia: microaneurismas e exsudatos duros (retinopatia diabética)', 'imaging'),
  -- HAS (I10)
  ('ECG: sobrecarga ventricular esquerda (índice de Sokolow-Lyon > 35mm)', 'imaging'),
  -- Apendicite (K35)
  ('TC abdome: apêndice > 6mm com borramento de gordura periapendicular', 'imaging'),
  -- DDA (A09)
  ('RX abdome: distensão de alças com padrão gasoso difuso (inespecífico)', 'imaging')

) AS v(text_pt, section)
WHERE NOT EXISTS (
  SELECT 1 FROM cip_findings
  WHERE cip_findings.text_pt = v.text_pt AND cip_findings.section = v.section
);

-- Step 5: Validate counts
DO $$
DECLARE
  v_diag_count INTEGER;
  v_mh INTEGER;
  v_pe INTEGER;
  v_lab INTEGER;
  v_img INTEGER;
  v_patho INTEGER;
  v_treat INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_diag_count FROM cip_diagnoses;
  SELECT COUNT(*) INTO v_mh FROM cip_findings WHERE section = 'medical_history';
  SELECT COUNT(*) INTO v_pe FROM cip_findings WHERE section = 'physical_exam';
  SELECT COUNT(*) INTO v_lab FROM cip_findings WHERE section = 'laboratory';
  SELECT COUNT(*) INTO v_img FROM cip_findings WHERE section = 'imaging';
  SELECT COUNT(*) INTO v_patho FROM cip_findings WHERE section = 'pathology';
  SELECT COUNT(*) INTO v_treat FROM cip_findings WHERE section = 'treatment';

  RAISE NOTICE 'Diagnoses: % | MH: % | PE: % | LAB: % | IMG: % | PATHO: % | TREAT: %',
    v_diag_count, v_mh, v_pe, v_lab, v_img, v_patho, v_treat;

  IF v_diag_count < 25 THEN
    RAISE WARNING 'Expected >= 25 diagnoses, got %', v_diag_count;
  END IF;
  IF v_patho < 15 THEN
    RAISE WARNING 'Expected >= 15 pathology findings, got %', v_patho;
  END IF;
  IF v_img < 15 THEN
    RAISE WARNING 'Expected >= 15 imaging findings, got %', v_img;
  END IF;
END $$;

-- Done!
SELECT 'Expanded data loaded!' AS status,
  (SELECT COUNT(*) FROM cip_diagnoses) AS total_diagnoses,
  (SELECT COUNT(*) FROM cip_findings) AS total_findings,
  (SELECT COUNT(*) FROM cip_findings WHERE section = 'pathology') AS pathology_findings,
  (SELECT COUNT(*) FROM cip_findings WHERE section = 'imaging') AS imaging_findings;
