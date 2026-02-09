-- Pilot Test Data for Darwin Education
-- =====================================
-- 5 sample ENAMED questions for testing TRI scoring and simulado features

-- Create test question bank
INSERT INTO question_banks (id, name, description, source, year_start, year_end, question_count, areas, is_premium, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ENAMED Pilot Test Bank',
  'Sample questions for pilot testing',
  'official_enamed',
  2023,
  2024,
  5,
  ARRAY['clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia', 'saude_coletiva'],
  false,
  true
);

-- Question 1: Clínica Médica - Easy (Hipertensão Arterial)
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  area,
  subspecialty,
  topic,
  icd10_codes,
  year,
  difficulty,
  is_ai_generated,
  validated_by
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Paciente de 55 anos, sexo masculino, com diagnóstico de hipertensão arterial sistêmica há 5 anos, em uso irregular de losartana 50mg/dia. Comparece à consulta de rotina com PA de 160x100 mmHg. Nega comorbidades. Qual a melhor conduta?',
  '[
    {"letter": "A", "text": "Manter losartana 50mg e orientar uso regular"},
    {"letter": "B", "text": "Aumentar losartana para 100mg/dia"},
    {"letter": "C", "text": "Associar hidroclorotiazida 25mg/dia"},
    {"letter": "D", "text": "Trocar por anlodipino 5mg/dia"},
    {"letter": "E", "text": "Solicitar MAPA de 24h antes de qualquer mudança"}
  ]'::jsonb,
  1,
  'A conduta mais adequada é aumentar a dose de losartana para 100mg/dia (opção B). O paciente já está em uso de um bloqueador do receptor de angiotensina (BRA) em dose submáxima e apresenta níveis pressóricos não controlados. Antes de associar uma segunda droga, deve-se otimizar a dose do medicamento em uso. A losartana pode ser utilizada em doses de até 100mg/dia. A opção A não seria adequada pois o paciente já vem usando irregularmente e a pressão não está controlada. A associação de hidroclorotiazida (opção C) seria considerada se após otimização da dose do BRA ainda persistisse hipertensão não controlada. O MAPA (opção E) não é necessário neste momento, pois a hipertensão está claramente não controlada.',
  -0.500,
  1.200,
  0.250,
  'clinica_medica',
  'Cardiologia',
  'Hipertensão Arterial Sistêmica',
  ARRAY['I10'],
  2023,
  'facil',
  false,
  'expert'
);

-- Question 2: Cirurgia - Medium (Apendicite Aguda)
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  area,
  subspecialty,
  topic,
  icd10_codes,
  year,
  difficulty,
  is_ai_generated,
  validated_by
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Paciente de 28 anos, previamente hígida, apresenta dor abdominal migratória iniciada em região epigástrica há 12 horas, que se localizou em fossa ilíaca direita. Acompanha náuseas, vômitos e febre (38.2°C). Ao exame: sinal de Blumberg positivo. Leucograma: 15.000/mm³ com desvio à esquerda. Qual o diagnóstico mais provável e conduta?',
  '[
    {"letter": "A", "text": "Diverticulite aguda - tratamento clínico com antibióticos"},
    {"letter": "B", "text": "Apendicite aguda - apendicectomia de urgência"},
    {"letter": "C", "text": "Gastroenterite aguda - hidratação e sintomáticos"},
    {"letter": "D", "text": "Doença inflamatória pélvica - antibioticoterapia"},
    {"letter": "E", "text": "Colecistite aguda - colecistectomia videolaparoscópica"}
  ]'::jsonb,
  1,
  'O quadro clássico de apendicite aguda está presente: dor migratória de epigástrio para fossa ilíaca direita (sinal de Kocher), febre, náuseas/vômitos, sinal de Blumberg positivo (descompressão brusca dolorosa) e leucocitose com desvio à esquerda. A conduta é apendicectomia de urgência (opção B). A diverticulite (A) é rara em pacientes jovens e tipicamente acomete o cólon sigmoide (fossa ilíaca esquerda). Gastroenterite (C) não cursaria com irritação peritoneal. DIP (D) seria considerada em mulheres com história compatível. Colecistite (E) apresenta dor em hipocôndrio direito, não em FID.',
  0.200,
  1.500,
  0.250,
  'cirurgia',
  'Cirurgia Geral',
  'Abdome Agudo',
  ARRAY['K35.8'],
  2023,
  'medio',
  false,
  'expert'
);

-- Question 3: Pediatria - Hard (Bronquiolite Viral Aguda)
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  area,
  subspecialty,
  topic,
  icd10_codes,
  year,
  difficulty,
  is_ai_generated,
  validated_by
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Lactente de 4 meses, previamente hígido, apresenta há 3 dias quadro de coriza, tosse e febre baixa. Evolui nas últimas 24h com taquipneia (FR=65 irpm), tiragem subcostal e sibilos difusos. Sat O2: 91% em ar ambiente. Afebril no momento. Qual a melhor conduta inicial?',
  '[
    {"letter": "A", "text": "Iniciar amoxicilina + clavulanato e observação domiciliar"},
    {"letter": "B", "text": "Iniciar broncodilatador inalatório (salbutamol) e reavaliar"},
    {"letter": "C", "text": "Oxigenoterapia + suporte + hidratação venosa se necessário"},
    {"letter": "D", "text": "Corticoide sistêmico (prednisolona) + broncodilatador"},
    {"letter": "E", "text": "Pesquisa viral (PCR para VSR) e aguardar resultado para conduta"}
  ]'::jsonb,
  2,
  'O quadro é típico de bronquiolite viral aguda (provavelmente por VSR - Vírus Sincicial Respiratório). A conduta baseia-se em suporte clínico: oxigenoterapia para manter Sat O2 >90%, hidratação adequada (venosa se necessária) e observação. A opção C está correta. Antibióticos (A) não têm indicação em bronquiolite viral sem evidência de infecção bacteriana secundária. Broncodilatadores (B) têm benefício questionável em bronquiolite e não são recomendados como primeira linha. Corticoides (D) não demonstraram benefício em bronquiolite. A pesquisa viral (E) não altera a conduta terapêutica que é de suporte.',
  1.200,
  1.800,
  0.250,
  'pediatria',
  'Pneumologia Pediátrica',
  'Bronquiolite Viral Aguda',
  ARRAY['J21.0'],
  2024,
  'dificil',
  false,
  'expert'
);

-- Question 4: Ginecologia/Obstetrícia - Medium (Pré-eclâmpsia)
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  area,
  subspecialty,
  topic,
  icd10_codes,
  year,
  difficulty,
  is_ai_generated,
  validated_by
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Gestante de 34 semanas, primigesta, comparece à emergência com cefaleia intensa e epigastralgia. PA: 170x110 mmHg. Proteinúria de fita: 3+. Exames: plaquetas 90.000/mm³, TGO 150 U/L, TGP 180 U/L. Qual a classificação e conduta mais adequada?',
  '[
    {"letter": "A", "text": "Pré-eclâmpsia sem sinais de gravidade - controle ambulatorial"},
    {"letter": "B", "text": "Pré-eclâmpsia grave - sulfato de magnésio + anti-hipertensivo + interrupção"},
    {"letter": "C", "text": "Hipertensão gestacional - expectante até 37 semanas"},
    {"letter": "D", "text": "Síndrome HELLP - corticoide + parto vaginal imediato"},
    {"letter": "E", "text": "Eclâmpsia iminente - diazepam + hidralazina"}
  ]'::jsonb,
  1,
  'A paciente apresenta pré-eclâmpsia GRAVE (opção B): PA ≥160x110 mmHg, proteinúria, cefaleia (sinal de gravidade), epigastralgia (sinal de gravidade), plaquetopenia (<100.000) e elevação de transaminases (HELLP parcial). A conduta é: sulfato de magnésio para neuroproteção/prevenção de eclâmpsia, anti-hipertensivo para PA ≥160x110 mmHg e interrupção da gestação. Com 34 semanas, o feto tem viabilidade e a mãe apresenta sinais de gravidade que contraindicam conduta expectante. A opção A está incorreta pois há critérios de gravidade. A opção C ignora os sinais graves. A opção D está parcialmente correta (HELLP) mas o parto não precisa ser necessariamente vaginal. A opção E usa medicação inadequada (diazepam não é primeira linha).',
  0.500,
  1.600,
  0.250,
  'ginecologia_obstetricia',
  'Obstetrícia',
  'Síndromes Hipertensivas da Gestação',
  ARRAY['O14.1'],
  2024,
  'medio',
  false,
  'expert'
);

-- Question 5: Saúde Coletiva - Easy (Imunização)
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  area,
  subspecialty,
  topic,
  year,
  difficulty,
  is_ai_generated,
  validated_by
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Segundo o Programa Nacional de Imunizações (PNI), qual vacina está contraindicada para gestantes?',
  '[
    {"letter": "A", "text": "Hepatite B"},
    {"letter": "B", "text": "Influenza (inativada)"},
    {"letter": "C", "text": "dTpa (tríplice bacteriana acelular)"},
    {"letter": "D", "text": "Febre amarela (vírus vivo atenuado)"},
    {"letter": "E", "text": "COVID-19"}
  ]'::jsonb,
  3,
  'A vacina contra febre amarela (opção D) é contraindicada na gestação por ser uma vacina de vírus vivo atenuado, que apresenta risco teórico de transmissão vertical. As demais vacinas são seguras e algumas até recomendadas durante a gestação: Hepatite B (A) pode ser administrada se houver indicação; Influenza inativada (B) é recomendada em qualquer trimestre; dTpa (C) é recomendada entre 20-36 semanas para proteção contra coqueluche neonatal; COVID-19 (E) é recomendada para gestantes. Outras vacinas de vírus vivo atenuado também contraindicadas na gestação incluem: tríplice viral (sarampo, caxumba, rubéola) e varicela.',
  -0.800,
  1.000,
  0.250,
  'saude_coletiva',
  'Epidemiologia',
  'Imunizações',
  ARRAY['Z23'],
  2023,
  'facil',
  false,
  'expert'
);

-- Update question bank count
UPDATE question_banks
SET question_count = 5,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create sample exam (Simulado Pilot)
INSERT INTO exams (
  id,
  title,
  description,
  question_count,
  time_limit_minutes,
  question_ids,
  type,
  is_public
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Simulado ENAMED - Pilot Test',
  'Simulado de teste com 5 questões cobrindo as 5 grandes áreas do ENAMED. Use este simulado para testar o sistema de pontuação TRI.',
  5,
  30,
  ARRAY[
    '10000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid
  ],
  'official_simulation',
  true
);
