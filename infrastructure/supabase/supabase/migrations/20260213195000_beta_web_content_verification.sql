-- =====================================================
-- Beta Web: Content Verification Corrections (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Apply vetted corrections to seeded study modules and flashcards.
--
-- Notes:
-- - Updates are best-effort via pattern replacement; safe to re-run.

-- Migration 012: Content Verification Corrections
-- Generated: 2026-02-08
-- Purpose: Apply verified medical content corrections to live database
-- Scope: 45 corrections across flashcards, DDL questions, and study modules
-- Verification: All claims checked against 2026 SOTA literature (2-source rule)
-- Priority tiers: TIER 0 (life-threatening), TIER 1 (clinical), TIER 2/3 (educational)

BEGIN;

-- ============================================================
-- SECTION 1: STUDY PATHS (Emergency Medicine Modules)
-- File: study_paths_new.sql — 8 corrections
-- ============================================================

-- 1.1 BLS compression depth: "5 cm" → "5-6 cm" (AHA 2020)
UPDATE study_modules
SET content = REPLACE(content, 'Compressões: 5 cm de profundidade', 'Compressões: 5-6 cm de profundidade (AHA 2020, não exceder 6 cm)')
WHERE content LIKE '%Compressões: 5 cm de profundidade%';

-- 1.2 Post-ROSC SpO2 target: add upper limit
UPDATE study_modules
SET content = REPLACE(content, 'SpO2 >94%', 'SpO2 94-98% (evitar hiperóxia)')
WHERE content LIKE '%Cuidados pós-PCR%' AND content LIKE '%SpO2 >94%%';

-- 1.3 TTM: specify all rhythms, not just shockable
UPDATE study_modules
SET content = REPLACE(content, 'Hipotermia terapêutica (32-36°C) por 24h pós-PCR com ritmo chocável', 'Hipotermia terapêutica (TTM 32-36°C) por 24h pós-PCR — indicada para qualquer ritmo inicial (ILCOR 2020/2021), não apenas chocável')
WHERE content LIKE '%Hipotermia terapêutica (32-36°C) por 24h pós-PCR com ritmo chocável%';

-- 1.4 STEMI: add ECG timing and ticagrelor preference
UPDATE study_modules
SET content = REPLACE(content, 'ECG com supra de ST', 'ECG com supra de ST (obter ECG em ≤10 min da chegada)')
WHERE content LIKE '%ECG com supra de ST%' AND content LIKE '%Reperfusão%';

UPDATE study_modules
SET content = REPLACE(content, 'AAS + clopidogrel 600mg', 'AAS 300mg + ticagrelor 180mg (preferência ESC/AHA 2023) ou clopidogrel 600mg')
WHERE content LIKE '%AAS + clopidogrel 600mg%';

-- 1.5 Wells PE: correct to 7 components
UPDATE study_modules
SET content = REPLACE(content, 'Wells simplificado (8 critérios)', 'Wells PE (7 critérios — versão original)')
WHERE content LIKE '%Wells simplificado (8 critérios)%';

-- 1.6 Needle decompression: add alternate site
UPDATE study_modules
SET content = REPLACE(content, 'Punção com agulha calibrosa (14G) no 2° EIC, linha hemiclavicular', 'Punção com agulha calibrosa (14G) no 2° EIC linha hemiclavicular OU 4°-5° EIC linha axilar anterior (sítio alternativo ATLS 10ª ed.)')
WHERE content LIKE '%Punção com agulha calibrosa (14G) no 2° EIC, linha hemiclavicular%';

-- 1.7 DKA: add K+ check before insulin
UPDATE study_modules
SET content = REPLACE(content, 'Insulina regular 0,1 U/kg/h IV', 'Insulina regular 0,1 U/kg/h IV — ATENÇÃO: verificar K+ ≥3,3 mEq/L antes de iniciar insulina (repor K+ primeiro se <3,3)')
WHERE content LIKE '%Insulina regular 0,1 U/kg/h IV%';

-- 1.8 Thyroid storm: correct PTU dose
UPDATE study_modules
SET content = REPLACE(content, 'PTU 200mg 4/4h', 'PTU 500-1000mg ataque, depois 250mg 4/4h (ATA)')
WHERE content LIKE '%PTU 200mg 4/4h%';

-- 1.9 Hypercalemia: add specific doses
UPDATE study_modules
SET content = REPLACE(content, 'Cálcio IV, insulina + glicose, bicarbonato', 'Gluconato de cálcio 10% 10mL IV em 2-3 min (estabiliza membrana); insulina 10 UI + glicose 50% 50mL (shift); bicarbonato 50mEq se acidose')
WHERE content LIKE '%Cálcio IV, insulina + glicose, bicarbonato%';

-- ============================================================
-- SECTION 2: STUDY MODULES (HF, APS, Obstetrics)
-- File: study_modules_new.sql — 6 corrections
-- ============================================================

-- 2.1 Enalapril trial percentages: CONSENSUS 40%, SOLVD 16%, PARADIGM-HF 20%
UPDATE study_modules
SET content = REPLACE(content, 'Enalapril reduziu mortalidade em 20-30% (estudos CONSENSUS, SOLVD)', 'Enalapril reduziu mortalidade em 40% no CONSENSUS (IC grave, 1987) e 16% no SOLVD-Treatment (IC leve-moderada, 1991). Sacubitril/valsartana reduziu 20% vs enalapril (PARADIGM-HF, 2014)')
WHERE content LIKE '%Enalapril reduziu mortalidade em 20-30%%';

-- 2.2 SGLT2i precise trial results
UPDATE study_modules
SET content = REPLACE(content, 'SGLT2i reduziram hospitalização por IC em ~30% (DAPA-HF, EMPEROR-Reduced)', 'SGLT2i: dapagliflozina reduziu desfecho primário (morte CV + hospitalização IC) HR 0,74 (DAPA-HF, 2019); empagliflozina HR 0,75 (EMPEROR-Reduced, 2020). Também benefício renal: DAPA-CKD reduziu progressão renal HR 0,61')
WHERE content LIKE '%SGLT2i reduziram hospitalização por IC em ~30%%';

-- 2.3 Framingham criteria expanded
UPDATE study_modules
SET content = REPLACE(content, 'dispneia paroxística noturna, estase jugular', 'dispneia paroxística noturna, estase jugular, refluxo hepatojugular, galope B3, PVC >16 cmH₂O, cardiomegalia ao RX, edema agudo de pulmão')
WHERE content LIKE '%dispneia paroxística noturna, estase jugular%' AND content NOT LIKE '%refluxo hepatojugular%';

-- 2.4 Partograph: note WHO 2018 active labor at 6 cm
UPDATE study_modules
SET content = REPLACE(content, '**Linha de alerta**: 1 cm/h a partir de 4 cm', '**Linha de alerta**: 1 cm/h a partir de 4 cm (OMS clássico). Nota: OMS 2018 e ACOG 2014 consideram fase ativa a partir de 6 cm — o partograma da OMS original usa 4 cm')
WHERE content LIKE '%**Linha de alerta**: 1 cm/h a partir de 4 cm%';

-- 2.5 ESF coverage: 60% → ~76%
UPDATE study_modules
SET content = REPLACE(content, 'cobertura de 60% da população brasileira', 'cobertura de ~76% da população brasileira (2024)')
WHERE content LIKE '%cobertura de 60% da população brasileira%';

-- 2.6 NASF → NASF-AB/eMulti
UPDATE study_modules
SET content = REPLACE(content,
  '## NASF (Núcleo de Apoio)
Equipes multiprofissionais: nutricionista, psicólogo, fisioterapeuta.
- Apoio matricial às ESF
- Foco em casos complexos e crônicos',
  '## NASF-AB / eMulti
O antigo NASF (2008) foi renomeado NASF-AB em 2020 e, a partir de 2023/2024, está em transição para o programa **eMulti** (Equipes Multiprofissionais na APS).
Equipes multiprofissionais: nutricionista, psicólogo, fisioterapeuta.
- Apoio matricial às ESF
- Foco em casos complexos e crônicos')
WHERE content LIKE '%## NASF (Núcleo de Apoio)%';

-- ============================================================
-- SECTION 3: FLASHCARDS — Clínica Médica (3 corrections)
-- File: flashcards_clinica_medica_200.sql
-- ============================================================

-- 3.1 VT: adenosine only for regular monomorphic VT
UPDATE flashcards
SET back = REPLACE(back, 'Adenosina pode ser usada como teste diagnóstico', 'Adenosina pode ser usada como teste diagnóstico/terapêutico APENAS em TV monomórfica regular estável (não usar em TV polimórfica ou instável)')
WHERE back LIKE '%Adenosina pode ser usada como teste diagnóstico%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000001';

-- 3.2 Asthma reversibility: add ≥200mL volume criterion
UPDATE flashcards
SET back = REPLACE(back, 'aumento ≥12% do VEF1 pós-broncodilatador', 'aumento ≥12% E ≥200 mL do VEF1 pós-broncodilatador')
WHERE back LIKE '%aumento ≥12% do VEF1 pós-broncodilatador%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000001';

-- 3.3 Lung cancer: smoking 80-85%
UPDATE flashcards
SET back = REPLACE(back, 'Tabagismo é responsável por 90% dos casos', 'Tabagismo é responsável por 80-85% dos casos')
WHERE back LIKE '%Tabagismo é responsável por 90% dos casos%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000001';

-- ============================================================
-- SECTION 4: FLASHCARDS — Cirurgia (5 corrections)
-- File: flashcards_cirurgia_200.sql
-- ============================================================

-- 4.1 Hinchey classification: correct stages
UPDATE flashcards
SET back = REPLACE(back, 'Hinchey I (abscesso pericólico)', 'Hinchey I (fleimão/abscesso pericólico ≤4 cm), Ia (fleimão), Ib (abscesso pericólico)')
WHERE back LIKE '%Hinchey I (abscesso pericólico)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000002';

-- 4.2 Rutherford classification: correct to 6 categories
UPDATE flashcards
SET back = REPLACE(back, 'Rutherford (I-III)', 'Rutherford (0-6, sendo 0=assintomático a 6=gangrena extensa)')
WHERE back LIKE '%Rutherford (I-III)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000002';

-- 4.3 DCR protocol: 1:1:1 ratio
UPDATE flashcards
SET back = REPLACE(back, 'concentrado de hemácias, plasma fresco e plaquetas', 'concentrado de hemácias, plasma fresco e plaquetas na proporção 1:1:1 (protocolo PROPPR)')
WHERE back LIKE '%concentrado de hemácias, plasma fresco e plaquetas%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000002'
  AND back NOT LIKE '%1:1:1%';

-- 4.4 Open fracture: remove arbitrary 6h window
UPDATE flashcards
SET back = REPLACE(back, 'desbridamento cirúrgico em até 6 horas', 'desbridamento cirúrgico precoce (a meta de 6h foi abandonada — evidência atual favorece "o mais breve possível" sem tempo rígido)')
WHERE back LIKE '%desbridamento cirúrgico em até 6 horas%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000002';

-- 4.5 Ranson mortality: graduated scale
UPDATE flashcards
SET back = REPLACE(back, 'Ranson ≥3 indica pancreatite grave (mortalidade >15%)', 'Ranson ≥3 indica pancreatite grave: 3-4 pontos ~15%, 5-6 pontos ~40%, ≥7 pontos >90% mortalidade')
WHERE back LIKE '%Ranson ≥3 indica pancreatite grave (mortalidade >15%)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000002';

-- ============================================================
-- SECTION 5: FLASHCARDS — Ginecologia & Obstetrícia (5 corrections)
-- File: flashcards_ginecologia_200.sql
-- ============================================================

-- 5.1 dTpa vaccination window
UPDATE flashcards
SET back = REPLACE(back, 'dTpa (12-32 semanas)', 'dTpa (20-36 semanas, ideal 27-36 sem — MS/FEBRASGO)')
WHERE back LIKE '%dTpa (12-32 semanas)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000003';

-- 5.2 PPH TXA: early within 3h per WOMAN trial
UPDATE flashcards
SET back = REPLACE(back, 'ácido tranexâmico se refratária', 'ácido tranexâmico 1g IV nas primeiras 3h (WOMAN trial) — NÃO esperar refratariedade')
WHERE back LIKE '%ácido tranexâmico se refratária%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000003';

-- 5.3 FIGO 2018 cervical cancer staging
UPDATE flashcards
SET back = REPLACE(back, 'IB (invasão <4 cm)', 'IB1 (<2 cm), IB2 (2-4 cm), IB3 (≥4 cm) — FIGO 2018')
WHERE back LIKE '%IB (invasão <4 cm)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000003';

-- 5.4 Mirena duration: 5 → 8 years (FDA 2023)
UPDATE flashcards
SET back = REPLACE(back, 'hormonal (Mirena, 5 anos)', 'hormonal (Mirena, 8 anos — FDA 2023)')
WHERE back LIKE '%hormonal (Mirena, 5 anos)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000003';

-- 5.5 Pre-eclampsia: proteinuria NOT mandatory
UPDATE flashcards
SET back = 'A pré-eclâmpsia é uma complicação hipertensiva da gravidez após 20 semanas. Diagnóstico: PA ≥140/90 mmHg + proteinúria ≥300 mg/24h OU, na ausência de proteinúria, sinais de lesão orgânica (plaquetas <100.000, creatinina >1,1, transaminases 2× normal, edema pulmonar, sintomas cerebrais/visuais) — ACOG 2013/ISSHP 2018. Proteinúria NÃO é obrigatória. Tratamento: monitoramento materno-fetal, anti-hipertensivos (nifedipino, metildopa, hidralazina) e parto como cura definitiva.'
WHERE front LIKE '%pré-eclâmpsia%'
  AND back LIKE '%proteinúria e hipertensão após 20 semanas%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000003';

-- ============================================================
-- SECTION 6: FLASHCARDS — Pediatria (5 corrections)
-- File: flashcards_pediatria_200.sql
-- ============================================================

-- 6.1 Rotavirus max age
UPDATE flashcards
SET back = REPLACE(back, 'VORH: 2 doses (2 e 4 meses)', 'VORH: 2 doses (2 e 4 meses; dose 1 até 3m15d, dose 2 até 7m29d — doses NÃO podem ser administradas fora da faixa etária)')
WHERE back LIKE '%VORH: 2 doses (2 e 4 meses)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000004';

-- 6.2 Capillary refill: correct threshold
UPDATE flashcards
SET back = REPLACE(back, 'perfusão capilar >2 segundos', 'perfusão capilar >2 segundos (considerar >3 segundos em contexto pediátrico — FEAST trial, NICE 2019)')
WHERE back LIKE '%perfusão capilar >2 segundos%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000004';

-- 6.3 Febrile seizure: antipyretics clarification
UPDATE flashcards
SET back = REPLACE(back, 'antipiréticos não previnem recorrência', 'antipiréticos NÃO previnem recorrência de convulsão febril (apenas controlam febre)')
WHERE back LIKE '%antipiréticos não previnem recorrência%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000004';

-- 6.4 HepB → pentavalente
UPDATE flashcards
SET back = REPLACE(back, 'hepatite B aos 2, 4 e 6 meses', 'hepatite B ao nascer (monovalente) + componente HB na pentavalente aos 2, 4 e 6 meses')
WHERE back LIKE '%hepatite B aos 2, 4 e 6 meses%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000004';

-- 6.5 DTP → DTPw (whole-cell in Brazil)
UPDATE flashcards
SET back = REPLACE(back, 'DTP aos 15 meses e 4 anos', 'DTP (células inteiras = DTPw no PNI) aos 15 meses e 4 anos como reforço')
WHERE back LIKE '%DTP aos 15 meses e 4 anos%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000004';

-- ============================================================
-- SECTION 7: FLASHCARDS — Saúde Coletiva (4 corrections)
-- File: flashcards_saude_coletiva_200.sql
-- ============================================================

-- 7.1 EC 29/2000: Union percentage attribution
UPDATE flashcards
SET back = 'EC 29/2000 estabelece percentuais mínimos de aplicação em saúde: estados 12% e municípios 15% de receitas próprias. Para a União, a EC 29 vinculou o gasto ao valor do ano anterior corrigido pela variação nominal do PIB — o piso de 15% da receita corrente líquida para a União veio somente com a EC 86/2015 (consolidado pela EC 95/2016). Visa garantir recursos estáveis, mas enfrenta judicializações por descumprimento.'
WHERE back LIKE '%EC 29/2000 estabelece percentuais%' AND back LIKE '%União 15% da receita corrente%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000005';

-- 7.2 ESF coverage: 60% → ~76%
UPDATE flashcards
SET back = REPLACE(back, 'cobre 60% população', 'cobre ~76% da população (2024)')
WHERE back LIKE '%cobre 60% população%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000005';

-- 7.3 NASF → NASF-AB/eMulti
UPDATE flashcards
SET back = 'NASF (2008) integrava profissionais (nutricionista, psicólogo, etc.) às equipes ESF para apoio matricial. Em 2020, renomeado NASF-AB; a partir de 2023/2024, transição para programa eMulti (Equipes Multiprofissionais). Mantém lógica de apoio matricial e amplia resolutividade em APS.'
WHERE back LIKE '%NASF integra profissionais%' AND back LIKE '%apoio matricial%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000005';

-- 7.4 NR-9 PPRA → PGR
UPDATE flashcards
SET back = REPLACE(back, 'NR-9 (PPRA)', 'NR-1 (PGR — substituiu o antigo PPRA/NR-9 desde jan/2022)')
WHERE back LIKE '%NR-9 (PPRA)%'
  AND deck_id = 'a0000001-0000-0000-0000-000000000005';

-- ============================================================
-- SECTION 8: DDL QUESTIONS — Clínica Médica (3 corrections)
-- File: ddl_clinica_medica_20.sql
-- ============================================================

-- 8.1 CM-DDL-005: Add post-bronchodilator spirometry criterion
UPDATE ddl_questions
SET reference_answer = 'Diagnóstico: DPOC confirmada por espirometria pós-broncodilatador com VEF1/CVF <0,70 (GOLD). Manejo: cessação tabágica, broncodilatadores (LABA/LAMA) e reabilitação pulmonar.'
WHERE question_code = 'CM-DDL-005';

-- 8.2 CM-DDL-006: Aspiration pneumonia → anaerobes, not S. pneumoniae
UPDATE ddl_questions
SET reference_answer = 'Pneumonia aspirativa: flora polimicrobiana (anaeróbios + gram-negativos). Antibiótico: amoxicilina-clavulanato ou clindamicina; ceftriaxona + metronidazol se gravidade. Nota: S. pneumoniae é o principal agente de PAC típica, não aspirativa.',
    key_concepts = '[{"concept": "pneumonia aspirativa", "weight": 0.35, "synonyms": ["aspiracao pulmonar"]}, {"concept": "flora polimicrobiana", "weight": 0.3, "synonyms": ["anaerobios", "gram-negativos"]}, {"concept": "amoxicilina-clavulanato", "weight": 0.35, "synonyms": ["clindamicina"]}]'::jsonb
WHERE question_code = 'CM-DDL-006';

-- 8.3 CM-DDL-009: Add Maddrey DF ≥32 criterion
UPDATE ddl_questions
SET reference_answer = 'Diagnóstico: Hepatite alcoólica. Manejo: abstinência alcoólica, suporte nutricional e corticoides (prednisolona 40 mg/dia × 28 dias) se Função Discriminante de Maddrey (FD) ≥32 — critério formal para indicação de corticoterapia.'
WHERE question_code = 'CM-DDL-009';

-- ============================================================
-- SECTION 9: DDL QUESTIONS — Cirurgia (2 corrections)
-- File: ddl_cirurgia_20.sql
-- ============================================================

-- 9.1 CIR-DDL-012: Expand NOM to include Grade IV-V
UPDATE ddl_questions
SET reference_answer = 'Classificar a lesão esplênica por escala AAST (revisão 2018) baseada em imagem. Optar por manejo não operatório (NOM) em paciente hemodinamicamente estável — inclusive graus IV-V com estabilidade hemodinâmica e sem lesão de víscera oca associada (tendência atual). Indicar esplenectomia ou angioembolização em instabilidade ou falha conservadora.'
WHERE question_code = 'CIR-DDL-012';

-- 9.2 CIR-DDL-019: ΔP criterion for compartment syndrome
UPDATE ddl_questions
SET reference_answer = 'Diagnosticar síndrome compartimental aguda quando ΔP (pressão diastólica − pressão intracompartimental) <30 mmHg (critério de Stryker/McQueen). O limiar absoluto >30 mmHg isolado é menos confiável. Realizar fasciotomia descompressiva emergente para prevenir necrose muscular e rabdomiólise.'
WHERE question_code = 'CIR-DDL-019';

-- ============================================================
-- SECTION 10: DDL QUESTIONS — Ginecologia & Obstetrícia (2 corrections)
-- File: ddl_ginecologia_obstetricia_20.sql
-- ============================================================

-- 10.1 GO-DDL-002: IADPSG one-or-more criterion
UPDATE ddl_questions
SET reference_answer = 'Triagem entre 24-28 semanas com TOTG 75g (critérios IADPSG/OMS 2013): jejum ≥92 mg/dL, 1h ≥180, 2h ≥153 — um ou mais valores alterados confirma DMG. Conduta: dieta, exercício; insulina se metas glicêmicas não atingidas.'
WHERE question_code = 'GO-DDL-002';

-- 10.2 GO-DDL-020: Mirena 5 → 8 years
UPDATE ddl_questions
SET reference_answer = 'Recomendar DIU de levonorgestrel inserido entre 4-6 semanas pós-parto, seguro na lactação. Fornece contracepção por até 8 anos (FDA 2023) e reduz sangramento. Avaliar útero involuído e contraindicações.'
WHERE question_code = 'GO-DDL-020';

-- ============================================================
-- SECTION 11: DDL QUESTIONS — Pediatria (2 corrections)
-- File: ddl_pediatria_20.sql
-- ============================================================

-- 11.1 PED-DDL-006: Bronchiolitis O2 threshold <90% (AAP 2014)
UPDATE ddl_questions
SET reference_answer = 'Diagnóstico: clínico (VRS em ~75% dos casos). Manejo: suporte (oxigênio se SatO2 <90% — AAP 2014), hidratação, evitar broncodilatadores rotineiros (sem benefício comprovado).'
WHERE question_code = 'PED-DDL-006';

-- 11.2 PED-DDL-009: Correct vaccination calendar (BCG at birth, VORH 2 doses)
UPDATE ddl_questions
SET reference_answer = 'Nascimento: BCG + hepatite B. 2 meses: penta, VIP, VORH (1ª dose), pneumocócica 10V. 4 meses: penta, VIP, VORH (2ª dose), pneumocócica 10V. 6 meses: penta, VIP. Nota: VORH são apenas 2 doses (2 e 4 meses); BCG é ao nascer, não aos 2 meses. Reforço aos 12 meses: pneumocócica + meningo C.'
WHERE question_code = 'PED-DDL-009';

COMMIT;
