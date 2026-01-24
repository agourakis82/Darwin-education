-- Darwin Education - Sample Questions Seed Data
-- ==============================================
-- 50 questions covering all 5 ENAMED areas with IRT parameters

-- ============================================
-- CLÍNICA MÉDICA (10 questions)
-- ============================================

INSERT INTO questions (id, bank_id, stem, options, correct_index, explanation, area, subspecialty, topic, difficulty, irt_difficulty, irt_discrimination, irt_guessing, year, validated_by)
VALUES
-- CM1: Diabetes (Fácil)
(
  'q1000000-0000-0000-0001-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 52 anos, obeso, com glicemia de jejum de 142 mg/dL em duas ocasiões distintas. Qual o diagnóstico mais provável?',
  '[{"letter": "A", "text": "Glicemia de jejum alterada"}, {"letter": "B", "text": "Diabetes mellitus tipo 2"}, {"letter": "C", "text": "Diabetes mellitus tipo 1"}, {"letter": "D", "text": "Intolerância à glicose"}, {"letter": "E", "text": "Diabetes gestacional"}]',
  1,
  'Duas glicemias de jejum ≥126 mg/dL confirmam o diagnóstico de DM2. A glicemia de jejum alterada seria entre 100-125 mg/dL.',
  'clinica_medica', 'Endocrinologia', 'Diabetes Mellitus', 'facil',
  -1.2, 1.4, 0.20, 2022, 'expert'
),

-- CM2: Hipertensão (Médio)
(
  'q1000000-0000-0000-0001-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente hipertenso de 65 anos com creatinina de 2.1 mg/dL e proteinúria de 1.2 g/24h. Qual a classe de anti-hipertensivo preferencial?',
  '[{"letter": "A", "text": "Betabloqueador"}, {"letter": "B", "text": "Tiazídico"}, {"letter": "C", "text": "IECA ou BRA"}, {"letter": "D", "text": "Bloqueador de canal de cálcio"}, {"letter": "E", "text": "Alfa-bloqueador"}]',
  2,
  'IECA ou BRA são primeira escolha em pacientes com doença renal crônica e proteinúria pela nefroproteção que conferem.',
  'clinica_medica', 'Cardiologia', 'Hipertensão Arterial', 'medio',
  0.3, 1.6, 0.20, 2021, 'expert'
),

-- CM3: Pneumologia (Difícil)
(
  'q1000000-0000-0000-0001-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 58 anos, tabagista de longa data, com dispneia progressiva e tosse crônica. Espirometria: VEF1/CVF = 0.62 e VEF1 = 48% do previsto pós-broncodilatador. Qual a classificação GOLD?',
  '[{"letter": "A", "text": "GOLD 1 - Leve"}, {"letter": "B", "text": "GOLD 2 - Moderado"}, {"letter": "C", "text": "GOLD 3 - Grave"}, {"letter": "D", "text": "GOLD 4 - Muito grave"}, {"letter": "E", "text": "Não é DPOC"}]',
  2,
  'VEF1/CVF < 0.70 confirma obstrução. VEF1 entre 30-49% classifica como GOLD 3 (grave). GOLD 2: 50-79%; GOLD 4: < 30%.',
  'clinica_medica', 'Pneumologia', 'DPOC', 'dificil',
  1.1, 1.8, 0.20, 2023, 'expert'
),

-- CM4: Cardiologia (Médio)
(
  'q1000000-0000-0000-0001-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com FA permanente, 68 anos, hipertenso e diabético. Qual o escore CHA2DS2-VASc e a conduta antitrombótica?',
  '[{"letter": "A", "text": "Score 2, considerar anticoagulação"}, {"letter": "B", "text": "Score 3, anticoagulação indicada"}, {"letter": "C", "text": "Score 4, anticoagulação indicada"}, {"letter": "D", "text": "Score 5, anticoagulação indicada"}, {"letter": "E", "text": "Score 1, AAS suficiente"}]',
  2,
  'HAS (1) + DM (1) + Idade 65-74 (1) + sexo masculino (0) = 3 pontos + FA (1) = 4 pontos. Score ≥2 indica anticoagulação.',
  'clinica_medica', 'Cardiologia', 'Fibrilação Atrial', 'medio',
  0.5, 1.5, 0.20, 2022, 'expert'
),

-- CM5: Nefrologia (Muito Difícil)
(
  'q1000000-0000-0000-0001-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com DRC estágio 4, apresenta K+ = 6.8 mEq/L e alterações eletrocardiográficas. Qual a sequência correta de tratamento?',
  '[{"letter": "A", "text": "Gluconato de cálcio → Insulina + glicose → Furosemida"}, {"letter": "B", "text": "Insulina + glicose → Gluconato de cálcio → Diálise"}, {"letter": "C", "text": "Bicarbonato de sódio → Sorcal → Diálise"}, {"letter": "D", "text": "Furosemida → Insulina → Gluconato de cálcio"}, {"letter": "E", "text": "Sorcal → Gluconato de cálcio → Insulina"}]',
  0,
  'Com alterações no ECG, primeiro estabiliza membrana com gluconato de cálcio, depois shift com insulina+glicose, depois eliminação.',
  'clinica_medica', 'Nefrologia', 'Hipercalemia', 'muito_dificil',
  1.8, 1.9, 0.20, 2023, 'expert'
),

-- CM6: Infectologia (Fácil)
(
  'q1000000-0000-0000-0001-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente HIV+ com CD4 = 150 células/mm³. Qual profilaxia primária está indicada?',
  '[{"letter": "A", "text": "Sulfametoxazol-trimetoprim para Pneumocystis jirovecii"}, {"letter": "B", "text": "Azitromicina para MAC"}, {"letter": "C", "text": "Fluconazol para Candida"}, {"letter": "D", "text": "Ganciclovir para CMV"}, {"letter": "E", "text": "Nenhuma profilaxia necessária"}]',
  0,
  'Profilaxia para P. jirovecii com SMX-TMP quando CD4 < 200. MAC apenas se CD4 < 50. CMV não faz profilaxia primária.',
  'clinica_medica', 'Infectologia', 'HIV/AIDS', 'facil',
  -0.8, 1.3, 0.20, 2021, 'expert'
),

-- CM7: Gastroenterologia (Médio)
(
  'q1000000-0000-0000-0001-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente cirrótico com ascite tensa. Paracentese retira 6 litros. Qual a conduta para prevenção de disfunção circulatória?',
  '[{"letter": "A", "text": "Albumina 8g/L de ascite retirada"}, {"letter": "B", "text": "Soro fisiológico 500mL"}, {"letter": "C", "text": "Reposição não necessária"}, {"letter": "D", "text": "Dextran 70"}, {"letter": "E", "text": "Plasma fresco"}]',
  0,
  'Paracentese > 5L requer albumina 6-8g por litro retirado para prevenir síndrome de disfunção circulatória pós-paracentese.',
  'clinica_medica', 'Gastroenterologia', 'Cirrose Hepática', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- CM8: Reumatologia (Difícil)
(
  'q1000000-0000-0000-0001-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Mulher de 35 anos com artrite simétrica de mãos, rigidez matinal >1h, nódulos subcutâneos e fator reumatoide positivo. Anti-CCP negativo. Qual a principal diferença prognóstica em relação a pacientes anti-CCP positivos?',
  '[{"letter": "A", "text": "Menor chance de erosões ósseas"}, {"letter": "B", "text": "Maior chance de manifestações extra-articulares"}, {"letter": "C", "text": "Menor resposta ao metotrexato"}, {"letter": "D", "text": "Maior mortalidade cardiovascular"}, {"letter": "E", "text": "Não há diferença prognóstica"}]',
  0,
  'Anti-CCP positivo associa-se a doença mais erosiva e agressiva. FR+/anti-CCP- tem melhor prognóstico radiológico.',
  'clinica_medica', 'Reumatologia', 'Artrite Reumatoide', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- CM9: Hematologia (Muito Fácil)
(
  'q1000000-0000-0000-0001-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com anemia, VCM = 68 fL, ferritina = 8 ng/mL. Qual o tipo de anemia?',
  '[{"letter": "A", "text": "Anemia ferropriva"}, {"letter": "B", "text": "Anemia de doença crônica"}, {"letter": "C", "text": "Talassemia minor"}, {"letter": "D", "text": "Anemia sideroblástica"}, {"letter": "E", "text": "Anemia megaloblástica"}]',
  0,
  'VCM baixo (microcítica) + ferritina baixa (<30) = anemia ferropriva. Talassemia teria ferritina normal ou alta.',
  'clinica_medica', 'Hematologia', 'Anemias', 'muito_facil',
  -1.8, 1.2, 0.20, 2020, 'expert'
),

-- CM10: Neurologia (Médio)
(
  'q1000000-0000-0000-0001-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 70 anos com AVC isquêmico há 2 horas, sem contraindicações. PA = 185x105 mmHg. Qual a conduta antes da trombólise?',
  '[{"letter": "A", "text": "Reduzir PA para <185/110 mmHg"}, {"letter": "B", "text": "Não há necessidade de controle pressórico"}, {"letter": "C", "text": "Reduzir PA para <140/90 mmHg"}, {"letter": "D", "text": "Contraindicação absoluta à trombólise"}, {"letter": "E", "text": "Iniciar anti-hipertensivo VO"}]',
  0,
  'Para trombólise, PA deve estar <185/110 mmHg. Se não atingir com anti-hipertensivo EV, contraindica rTPA.',
  'clinica_medica', 'Neurologia', 'AVC', 'medio',
  0.2, 1.4, 0.20, 2022, 'expert'
),

-- ============================================
-- CIRURGIA (10 questions)
-- ============================================

-- CIR1: Abdome Agudo (Fácil)
(
  'q1000000-0000-0000-0002-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 25 anos com dor em fossa ilíaca direita, náuseas e febre. Sinal de Blumberg positivo. Qual o diagnóstico mais provável?',
  '[{"letter": "A", "text": "Apendicite aguda"}, {"letter": "B", "text": "Colecistite aguda"}, {"letter": "C", "text": "Diverticulite"}, {"letter": "D", "text": "Pancreatite aguda"}, {"letter": "E", "text": "Úlcera perfurada"}]',
  0,
  'Quadro clássico de apendicite: dor em FID, febre, sinal de Blumberg (descompressão brusca dolorosa) indica irritação peritoneal.',
  'cirurgia', 'Cirurgia Geral', 'Abdome Agudo', 'facil',
  -1.0, 1.3, 0.20, 2021, 'expert'
),

-- CIR2: Trauma (Médio)
(
  'q1000000-0000-0000-0002-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente vítima de acidente automobilístico, estável hemodinamicamente, com FAST positivo no quadrante superior esquerdo. TC mostra laceração esplênica grau III. Conduta?',
  '[{"letter": "A", "text": "Tratamento não operatório com observação"}, {"letter": "B", "text": "Laparotomia imediata"}, {"letter": "C", "text": "Arteriografia com embolização"}, {"letter": "D", "text": "Videolaparoscopia diagnóstica"}, {"letter": "E", "text": "Repetir FAST em 6 horas"}]',
  0,
  'Paciente estável com lesão esplênica grau I-III pode ser manejado conservadoramente com observação e exames seriados.',
  'cirurgia', 'Trauma', 'Trauma Abdominal', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- CIR3: Coloproctologia (Difícil)
(
  'q1000000-0000-0000-0002-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 60 anos com obstrução intestinal por adenocarcinoma de cólon sigmoide. Tumor irressecável com metástases hepáticas. Qual a conduta cirúrgica paliativa preferencial?',
  '[{"letter": "A", "text": "Colostomia em alça"}, {"letter": "B", "text": "Prótese colônica endoscópica"}, {"letter": "C", "text": "Ressecção paliativa com anastomose primária"}, {"letter": "D", "text": "Derivação ileocólica"}, {"letter": "E", "text": "Cecostomia"}]',
  1,
  'Stent colônico é opção menos invasiva para paliação de obstrução por tumor irressecável, evitando estomias.',
  'cirurgia', 'Coloproctologia', 'Câncer Colorretal', 'dificil',
  1.2, 1.7, 0.20, 2023, 'expert'
),

-- CIR4: Hérnias (Fácil)
(
  'q1000000-0000-0000-0002-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 45 anos com abaulamento em região inguinal direita que aumenta com Valsalva e reduz espontaneamente. Qual o diagnóstico?',
  '[{"letter": "A", "text": "Hérnia inguinal indireta redutível"}, {"letter": "B", "text": "Hérnia inguinal direta"}, {"letter": "C", "text": "Hérnia femoral"}, {"letter": "D", "text": "Varicocele"}, {"letter": "E", "text": "Hidrocele"}]',
  0,
  'Abaulamento que aumenta com esforço e reduz espontaneamente é hérnia redutível. Localização acima do ligamento inguinal indica hérnia inguinal.',
  'cirurgia', 'Cirurgia Geral', 'Hérnias', 'facil',
  -0.9, 1.2, 0.20, 2020, 'expert'
),

-- CIR5: Cirurgia Bariátrica (Muito Difícil)
(
  'q1000000-0000-0000-0002-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente pós bypass gástrico em Y de Roux há 3 anos apresenta dor abdominal intermitente, náuseas e vômitos biliosos. TC sem alterações. Qual a hipótese diagnóstica e conduta?',
  '[{"letter": "A", "text": "Hérnia interna de Petersen - exploração laparoscópica"}, {"letter": "B", "text": "Estenose da anastomose - EDA com dilatação"}, {"letter": "C", "text": "Úlcera marginal - IBP e erradicação de H. pylori"}, {"letter": "D", "text": "Dumping tardio - ajuste dietético"}, {"letter": "E", "text": "Aderências - tratamento conservador"}]',
  0,
  'Obstrução intermitente pós-bypass com TC normal sugere hérnia interna (Petersen ou mesocólon). Requer exploração cirúrgica.',
  'cirurgia', 'Cirurgia Bariátrica', 'Complicações Pós-Operatórias', 'muito_dificil',
  1.9, 2.0, 0.20, 2023, 'expert'
),

-- CIR6: Cirurgia Vascular (Médio)
(
  'q1000000-0000-0000-0002-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 68 anos, tabagista, com claudicação intermitente a 100 metros. ITB = 0.6. Qual a conduta inicial?',
  '[{"letter": "A", "text": "Tratamento clínico com cilostazol e estatina"}, {"letter": "B", "text": "Angioplastia com stent"}, {"letter": "C", "text": "Bypass femoropoplíteo"}, {"letter": "D", "text": "Simpatectomia lombar"}, {"letter": "E", "text": "Amputação primária"}]',
  0,
  'Claudicação intermitente (Fontaine II) tem tratamento inicial clínico: cessação tabagismo, exercício, cilostazol, estatina. Revascularização para isquemia crítica.',
  'cirurgia', 'Cirurgia Vascular', 'DAOP', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- CIR7: Cirurgia Torácica (Difícil)
(
  'q1000000-0000-0000-0002-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 55 anos com nódulo pulmonar solitário de 2.5 cm no lobo superior direito. PET-CT com SUV = 8.5. Estadiamento negativo para metástases. Qual a conduta?',
  '[{"letter": "A", "text": "Lobectomia com linfadenectomia mediastinal"}, {"letter": "B", "text": "Quimioterapia neoadjuvante"}, {"letter": "C", "text": "Segmentectomia"}, {"letter": "D", "text": "Radioterapia estereotáxica"}, {"letter": "E", "text": "Biópsia por EBUS antes de cirurgia"}]',
  0,
  'Câncer de pulmão estágio I-II (nódulo sem linfonodos ou metástases) tem indicação de ressecção cirúrgica com lobectomia como padrão-ouro.',
  'cirurgia', 'Cirurgia Torácica', 'Câncer de Pulmão', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- CIR8: Urgências (Muito Fácil)
(
  'q1000000-0000-0000-0002-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com ferimento por arma branca em tórax esquerdo, PA = 80x50 mmHg, turgência jugular, bulhas abafadas. Diagnóstico?',
  '[{"letter": "A", "text": "Tamponamento cardíaco"}, {"letter": "B", "text": "Pneumotórax hipertensivo"}, {"letter": "C", "text": "Hemotórax maciço"}, {"letter": "D", "text": "Contusão miocárdica"}, {"letter": "E", "text": "Lesão de grandes vasos"}]',
  0,
  'Tríade de Beck (hipotensão + turgência jugular + bulhas abafadas) é clássica de tamponamento cardíaco.',
  'cirurgia', 'Trauma', 'Trauma Torácico', 'muito_facil',
  -1.5, 1.2, 0.20, 2021, 'expert'
),

-- CIR9: Via Biliar (Médio)
(
  'q1000000-0000-0000-0002-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com colecistite aguda litiásica há 72 horas, sem peritonite. Quando realizar colecistectomia?',
  '[{"letter": "A", "text": "Precoce, durante a mesma internação"}, {"letter": "B", "text": "Após 6-8 semanas de tratamento clínico"}, {"letter": "C", "text": "Após resolução da dor"}, {"letter": "D", "text": "Apenas se recorrência"}, {"letter": "E", "text": "Colecistostomia percutânea primeiro"}]',
  0,
  'Colecistectomia precoce (<72h-7 dias) é preferível ao tratamento tardio, com menores complicações e menor tempo de internação total.',
  'cirurgia', 'Cirurgia Geral', 'Colecistite', 'medio',
  0.2, 1.3, 0.20, 2022, 'expert'
),

-- CIR10: Oncologia Cirúrgica (Difícil)
(
  'q1000000-0000-0000-0002-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com adenocarcinoma gástrico do antro, T2N1M0. Qual a extensão da linfadenectomia recomendada?',
  '[{"letter": "A", "text": "D2"}, {"letter": "B", "text": "D1"}, {"letter": "C", "text": "D0"}, {"letter": "D", "text": "D3"}, {"letter": "E", "text": "Linfadenectomia não indicada"}]',
  0,
  'Linfadenectomia D2 é padrão para câncer gástrico avançado no Japão e cada vez mais aceito no Ocidente por melhor estadiamento e resultados oncológicos.',
  'cirurgia', 'Oncologia Cirúrgica', 'Câncer Gástrico', 'dificil',
  1.0, 1.5, 0.20, 2023, 'expert'
),

-- ============================================
-- GINECOLOGIA E OBSTETRÍCIA (10 questions)
-- ============================================

-- GO1: Pré-Natal (Fácil)
(
  'q1000000-0000-0000-0003-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 24 semanas com glicemia de jejum de 98 mg/dL no primeiro trimestre. Qual a conduta?',
  '[{"letter": "A", "text": "Realizar TOTG 75g entre 24-28 semanas"}, {"letter": "B", "text": "Diagnosticar diabetes gestacional"}, {"letter": "C", "text": "Iniciar insulina"}, {"letter": "D", "text": "Repetir glicemia de jejum"}, {"letter": "E", "text": "Considerar normal, sem necessidade de investigação"}]',
  0,
  'Glicemia de jejum 92-125 mg/dL no 1º trimestre indica DMG. Se <92, realizar TOTG 75g entre 24-28 semanas para rastreio.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Diabetes Gestacional', 'facil',
  -0.8, 1.3, 0.20, 2022, 'expert'
),

-- GO2: Parto (Médio)
(
  'q1000000-0000-0000-0003-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 39 semanas em trabalho de parto, dilatação 8 cm, BCF = 100 bpm com desacelerações tardias repetitivas. Conduta?',
  '[{"letter": "A", "text": "Cesárea de emergência"}, {"letter": "B", "text": "Amniotomia"}, {"letter": "C", "text": "Ocitocina"}, {"letter": "D", "text": "Fórcipe de alívio"}, {"letter": "E", "text": "Aguardar evolução"}]',
  0,
  'Bradicardia fetal com DIP II (desacelerações tardias) repetitivas indica sofrimento fetal e necessidade de cesárea de emergência.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Sofrimento Fetal', 'medio',
  0.5, 1.6, 0.20, 2022, 'expert'
),

-- GO3: Oncologia Ginecológica (Difícil)
(
  'q1000000-0000-0000-0003-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 45 anos com sangramento uterino anormal. Histeroscopia mostra pólipo endometrial. Anatomopatológico: adenocarcinoma de endométrio grau 1 limitado ao pólipo. Qual a conduta?',
  '[{"letter": "A", "text": "Histerectomia total com salpingo-ooforectomia bilateral"}, {"letter": "B", "text": "Apenas acompanhamento"}, {"letter": "C", "text": "Nova polipectomia com margens"}, {"letter": "D", "text": "Radioterapia pélvica"}, {"letter": "E", "text": "Quimioterapia adjuvante"}]',
  0,
  'Adenocarcinoma de endométrio requer estadiamento cirúrgico com histerectomia total + SOB, mesmo se aparentemente limitado.',
  'ginecologia_obstetricia', 'Ginecologia', 'Câncer de Endométrio', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- GO4: Sangramento 1º Trimestre (Fácil)
(
  'q1000000-0000-0000-0003-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com 8 semanas de amenorreia, beta-hCG = 2000 mUI/mL, USG transvaginal sem saco gestacional intrauterino. Qual a principal hipótese?',
  '[{"letter": "A", "text": "Gravidez ectópica"}, {"letter": "B", "text": "Gestação inicial viável"}, {"letter": "C", "text": "Aborto completo"}, {"letter": "D", "text": "Mola hidatiforme"}, {"letter": "E", "text": "Gravidez anembrionada"}]',
  0,
  'Beta-hCG > 1500-2000 sem saco gestacional no USG TV é altamente sugestivo de gestação ectópica.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Gravidez Ectópica', 'facil',
  -0.7, 1.4, 0.20, 2021, 'expert'
),

-- GO5: Pré-eclâmpsia (Muito Difícil)
(
  'q1000000-0000-0000-0003-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 32 semanas com pré-eclâmpsia grave. PA = 170x110 mmHg, proteinúria 3+, plaquetas = 85.000, TGO = 250, DHL = 800, esquizócitos no sangue periférico. Conduta?',
  '[{"letter": "A", "text": "Interrupção imediata da gestação após estabilização"}, {"letter": "B", "text": "Corticoide e aguardar 48h"}, {"letter": "C", "text": "Sulfato de magnésio e anti-hipertensivo apenas"}, {"letter": "D", "text": "Plasmaférese"}, {"letter": "E", "text": "Transfusão de plaquetas e observação"}]',
  0,
  'Síndrome HELLP (hemólise + enzimas elevadas + plaquetopenia) indica interrupção imediata independente da IG, após estabilização materna.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Pré-eclâmpsia', 'muito_dificil',
  1.8, 1.9, 0.20, 2023, 'expert'
),

-- GO6: Ginecologia Geral (Médio)
(
  'q1000000-0000-0000-0003-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 28 anos com corrimento vaginal amarelo-esverdeado, bolhoso, com odor fétido. pH vaginal = 6.0, teste das aminas positivo. Agente etiológico?',
  '[{"letter": "A", "text": "Trichomonas vaginalis"}, {"letter": "B", "text": "Gardnerella vaginalis"}, {"letter": "C", "text": "Candida albicans"}, {"letter": "D", "text": "Neisseria gonorrhoeae"}, {"letter": "E", "text": "Chlamydia trachomatis"}]',
  0,
  'Corrimento amarelo-esverdeado bolhoso + pH > 4.5 + teste das aminas positivo é característico de tricomoníase.',
  'ginecologia_obstetricia', 'Ginecologia', 'Vulvovaginites', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- GO7: Contracepção (Fácil)
(
  'q1000000-0000-0000-0003-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 35 anos, tabagista de 25 cigarros/dia, deseja contracepção hormonal. Qual método é contraindicado?',
  '[{"letter": "A", "text": "Contraceptivo combinado oral"}, {"letter": "B", "text": "Implante subdérmico"}, {"letter": "C", "text": "DIU hormonal"}, {"letter": "D", "text": "Minipílula"}, {"letter": "E", "text": "Injetável trimestral"}]',
  0,
  'Tabagismo >15 cig/dia em >35 anos é contraindicação absoluta (categoria 4) para métodos com estrogênio pelo risco cardiovascular.',
  'ginecologia_obstetricia', 'Ginecologia', 'Contracepção', 'facil',
  -0.9, 1.3, 0.20, 2021, 'expert'
),

-- GO8: Mama (Difícil)
(
  'q1000000-0000-0000-0003-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 52 anos com nódulo mamário de 2 cm, móvel. Mamografia: BI-RADS 4B. Core biopsy: carcinoma ductal invasivo, RE+, RP+, HER2 negativo, Ki-67 = 15%. Classificação molecular?',
  '[{"letter": "A", "text": "Luminal A"}, {"letter": "B", "text": "Luminal B HER2 negativo"}, {"letter": "C", "text": "Luminal B HER2 positivo"}, {"letter": "D", "text": "HER2 superexpresso"}, {"letter": "E", "text": "Triplo negativo"}]',
  0,
  'RE+, RP+, HER2-, Ki-67 baixo (<20%) = Luminal A. Se Ki-67 >20% seria Luminal B HER2-.',
  'ginecologia_obstetricia', 'Ginecologia', 'Câncer de Mama', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- GO9: Puerpério (Médio)
(
  'q1000000-0000-0000-0003-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Puérpera de 5 dias com febre 39°C, útero doloroso e subinvoluído, lóquios piossanguinolentos fétidos. Diagnóstico e tratamento?',
  '[{"letter": "A", "text": "Endometrite - Clindamicina + Gentamicina"}, {"letter": "B", "text": "Mastite - Cefalexina"}, {"letter": "C", "text": "ITU - Ciprofloxacino"}, {"letter": "D", "text": "Tromboflebite pélvica - Anticoagulação"}, {"letter": "E", "text": "Restos placentários - Curetagem"}]',
  0,
  'Tríade de febre + útero doloroso + lóquios fétidos define endometrite puerperal. Esquema clássico: clindamicina + gentamicina EV.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Infecção Puerperal', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- GO10: Infertilidade (Muito Fácil)
(
  'q1000000-0000-0000-0003-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Casal com infertilidade há 2 anos. Espermograma com azoospermia. Qual o próximo passo?',
  '[{"letter": "A", "text": "Dosagem de FSH e testosterona"}, {"letter": "B", "text": "Histerossalpingografia"}, {"letter": "C", "text": "USG transvaginal seriada"}, {"letter": "D", "text": "Laparoscopia"}, {"letter": "E", "text": "Indução de ovulação"}]',
  0,
  'Azoospermia requer investigação com FSH e testosterona para diferenciar causa obstrutiva (FSH normal) de não-obstrutiva (FSH elevado).',
  'ginecologia_obstetricia', 'Ginecologia', 'Infertilidade', 'muito_facil',
  -1.4, 1.2, 0.20, 2020, 'expert'
),

-- ============================================
-- PEDIATRIA (10 questions)
-- ============================================

-- PED1: Neonatologia (Fácil)
(
  'q1000000-0000-0000-0004-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'RN de 34 semanas, desconforto respiratório precoce, gasometria com PaO2 = 45 mmHg. Raio-X com infiltrado reticulogranular difuso e broncogramas aéreos. Diagnóstico?',
  '[{"letter": "A", "text": "Síndrome do desconforto respiratório"}, {"letter": "B", "text": "Taquipneia transitória do RN"}, {"letter": "C", "text": "Pneumonia neonatal"}, {"letter": "D", "text": "Síndrome de aspiração meconial"}, {"letter": "E", "text": "Persistência do canal arterial"}]',
  0,
  'RN prematuro com desconforto precoce + Rx com vidro moído (reticulogranular) + broncogramas = doença da membrana hialina (SDR).',
  'pediatria', 'Neonatologia', 'Desconforto Respiratório', 'facil',
  -0.8, 1.3, 0.20, 2022, 'expert'
),

-- PED2: Puericultura (Muito Fácil)
(
  'q1000000-0000-0000-0004-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 6 meses em aleitamento materno exclusivo. Qual a suplementação obrigatória?',
  '[{"letter": "A", "text": "Vitamina D"}, {"letter": "B", "text": "Ferro"}, {"letter": "C", "text": "Vitamina A"}, {"letter": "D", "text": "Zinco"}, {"letter": "E", "text": "Nenhuma suplementação necessária"}]',
  0,
  'Vitamina D (400 UI/dia) deve ser suplementada desde o nascimento até 2 anos, independente do tipo de aleitamento.',
  'pediatria', 'Puericultura', 'Suplementação', 'muito_facil',
  -1.6, 1.2, 0.20, 2021, 'expert'
),

-- PED3: Infectologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 4 anos com febre alta há 5 dias, conjuntivite bilateral não purulenta, língua em framboesa, linfadenopatia cervical unilateral >1.5 cm, exantema polimórfico e edema de extremidades. Qual o diagnóstico e a complicação mais temida?',
  '[{"letter": "A", "text": "Doença de Kawasaki - Aneurismas coronarianos"}, {"letter": "B", "text": "Escarlatina - Glomerulonefrite"}, {"letter": "C", "text": "Sarampo - Encefalite"}, {"letter": "D", "text": "Mononucleose - Ruptura esplênica"}, {"letter": "E", "text": "Rubéola - Trombocitopenia"}]',
  0,
  'Kawasaki: febre ≥5 dias + 4 de 5 critérios (conjuntivite, alterações orais, exantema, extremidades, linfadenopatia). Complicação: aneurismas coronários.',
  'pediatria', 'Infectologia', 'Kawasaki', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- PED4: Pneumologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 8 meses, primeiro episódio de sibilância, coriza e febre baixa há 3 dias. FR = 48 irpm, SatO2 = 93%, tiragem subcostal. Qual o diagnóstico e tratamento?',
  '[{"letter": "A", "text": "Bronquiolite viral aguda - Suporte e oxigênio"}, {"letter": "B", "text": "Asma - Beta-2 agonista"}, {"letter": "C", "text": "Pneumonia bacteriana - Amoxicilina"}, {"letter": "D", "text": "Coqueluche - Azitromicina"}, {"letter": "E", "text": "Laringite - Corticoide"}]',
  0,
  'Bronquiolite: lactente <2 anos, primeiro episódio de sibilância, pródromos virais. Tratamento: suporte, O2 se SatO2 <92%.',
  'pediatria', 'Pneumologia', 'Bronquiolite', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- PED5: Emergência Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 3 anos com diarreia há 5 dias, olhos fundos, sinal da prega presente mas retorna lentamente, bebe água com avidez. Qual o grau de desidratação e a reposição inicial?',
  '[{"letter": "A", "text": "Desidratação moderada - TRO supervisionada"}, {"letter": "B", "text": "Desidratação grave - SF 0.9% 20 mL/kg em bolus"}, {"letter": "C", "text": "Desidratação leve - TRO domiciliar"}, {"letter": "D", "text": "Sem desidratação - Apenas orientações"}, {"letter": "E", "text": "Desidratação grave - Soro glicosado"}]',
  0,
  '2 ou mais sinais de desidratação (prega, olhos fundos, sede) = desidratação moderada (plano B). Tratamento com TRO supervisionada.',
  'pediatria', 'Emergência', 'Desidratação', 'dificil',
  0.9, 1.6, 0.20, 2023, 'expert'
),

-- PED6: Neurologia Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 18 meses com febre de 39.5°C há 1 hora apresenta crise tônico-clônica generalizada de 3 minutos com recuperação completa. Sem história prévia de convulsões. Conduta?',
  '[{"letter": "A", "text": "Investigar foco infeccioso e orientar recorrência"}, {"letter": "B", "text": "TC de crânio urgente"}, {"letter": "C", "text": "Iniciar anticonvulsivante profilático"}, {"letter": "D", "text": "Punção lombar"}, {"letter": "E", "text": "EEG de urgência"}]',
  0,
  'Convulsão febril simples (6m-5a, <15min, generalizada, sem recorrência em 24h) não requer neuroimagem, PL ou profilaxia. Investigar causa da febre.',
  'pediatria', 'Neurologia', 'Convulsão Febril', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- PED7: Gastroenterologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 2 meses com regurgitações frequentes após mamadas, sem perda ponderal, sem irritabilidade ou recusa alimentar. Diagnóstico e conduta?',
  '[{"letter": "A", "text": "Refluxo gastroesofágico fisiológico - Orientações posturais"}, {"letter": "B", "text": "DRGE - Omeprazol"}, {"letter": "C", "text": "Estenose hipertrófica de piloro - USG"}, {"letter": "D", "text": "Alergia à proteína do leite de vaca - Fórmula hidrolisada"}, {"letter": "E", "text": "Má rotação intestinal - Trânsito intestinal"}]',
  0,
  'Lactente que regurgita mas ganha peso bem e não tem sinais de alarme = regurgitador feliz (RGE fisiológico). Conduta expectante.',
  'pediatria', 'Gastroenterologia', 'Refluxo Gastroesofágico', 'medio',
  0.2, 1.3, 0.20, 2022, 'expert'
),

-- PED8: Cardiologia Pediátrica (Muito Difícil)
(
  'q1000000-0000-0000-0004-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'RN com cianose central desde o nascimento, piora com choro, SatO2 = 75% em ar ambiente que não melhora com O2 100%. Raio-X com área cardíaca normal e trama vascular pulmonar diminuída. Sopro sistólico em BEE. Provável diagnóstico?',
  '[{"letter": "A", "text": "Tetralogia de Fallot"}, {"letter": "B", "text": "Transposição das grandes artérias"}, {"letter": "C", "text": "Coarctação da aorta"}, {"letter": "D", "text": "Comunicação interventricular"}, {"letter": "E", "text": "Persistência do canal arterial"}]',
  0,
  'Cianose + trama pulmonar diminuída + área cardíaca normal = cardiopatia com hipofluxo pulmonar. T4F é a mais comum. TGA teria coração em ovo e trama aumentada.',
  'pediatria', 'Cardiologia', 'Cardiopatias Congênitas', 'muito_dificil',
  1.7, 1.8, 0.20, 2023, 'expert'
),

-- PED9: Imunização (Fácil)
(
  'q1000000-0000-0000-0004-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 15 meses comparece à UBS para vacinação. Quais vacinas do calendário devem ser aplicadas nesta idade?',
  '[{"letter": "A", "text": "Tríplice viral, Hepatite A, Tetra viral"}, {"letter": "B", "text": "Pentavalente, VIP, Pneumo 10"}, {"letter": "C", "text": "DTP, VOP, Febre amarela"}, {"letter": "D", "text": "Meningo C, Pneumo 23"}, {"letter": "E", "text": "BCG e Hepatite B"}]',
  0,
  'Aos 15 meses: DTP (1º reforço), VOP (1º reforço), Hepatite A (dose única), Tetra viral (caxumba, sarampo, rubéola, varicela).',
  'pediatria', 'Imunização', 'Calendário Vacinal', 'facil',
  -0.9, 1.3, 0.20, 2021, 'expert'
),

-- PED10: Nefrologia Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 5 anos com edema palpebral matinal que evoluiu para anasarca. Urina I: proteína 4+, sem hematúria. Albumina sérica = 1.8 g/dL, colesterol = 380 mg/dL. Diagnóstico e tratamento inicial?',
  '[{"letter": "A", "text": "Síndrome nefrótica - Prednisona"}, {"letter": "B", "text": "Síndrome nefrítica - Restrição hídrica"}, {"letter": "C", "text": "Glomerulonefrite pós-estreptocócica - Penicilina"}, {"letter": "D", "text": "Síndrome hemolítico-urêmica - Suporte"}, {"letter": "E", "text": "Nefropatia por IgA - IECA"}]',
  0,
  'Tétrade: edema + proteinúria maciça + hipoalbuminemia + hiperlipidemia = síndrome nefrótica. Em crianças, maioria é lesão mínima, responsiva a corticoide.',
  'pediatria', 'Nefrologia', 'Síndrome Nefrótica', 'dificil',
  1.0, 1.6, 0.20, 2023, 'expert'
),

-- ============================================
-- SAÚDE COLETIVA (10 questions)
-- ============================================

-- SC1: Epidemiologia (Fácil)
(
  'q1000000-0000-0000-0005-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Em um estudo sobre COVID-19, 100 pessoas foram acompanhadas por 1 ano. 20 desenvolveram a doença. Qual a taxa de incidência?',
  '[{"letter": "A", "text": "20%"}, {"letter": "B", "text": "0.2 por pessoa-ano"}, {"letter": "C", "text": "20 casos"}, {"letter": "D", "text": "80%"}, {"letter": "E", "text": "Não é possível calcular"}]',
  0,
  'Incidência = casos novos / população em risco no período. 20/100 em 1 ano = 20% ou 0.2 por pessoa-ano.',
  'saude_coletiva', 'Epidemiologia', 'Medidas de Frequência', 'facil',
  -1.0, 1.3, 0.20, 2022, 'expert'
),

-- SC2: Vigilância (Médio)
(
  'q1000000-0000-0000-0005-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Médico atende caso suspeito de sarampo. Qual a conduta quanto à notificação?',
  '[{"letter": "A", "text": "Notificação imediata em até 24 horas"}, {"letter": "B", "text": "Notificação semanal"}, {"letter": "C", "text": "Notificação apenas se confirmado"}, {"letter": "D", "text": "Não é doença de notificação compulsória"}, {"letter": "E", "text": "Notificação mensal"}]',
  0,
  'Sarampo é de notificação imediata (até 24h) por ser doença em eliminação e pelo potencial de surtos.',
  'saude_coletiva', 'Vigilância Epidemiológica', 'Notificação Compulsória', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- SC3: SUS (Médio)
(
  'q1000000-0000-0000-0005-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Sobre os princípios do SUS, qual alternativa corresponde corretamente a um princípio organizativo?',
  '[{"letter": "A", "text": "Descentralização"}, {"letter": "B", "text": "Universalidade"}, {"letter": "C", "text": "Integralidade"}, {"letter": "D", "text": "Equidade"}, {"letter": "E", "text": "Preservação da autonomia"}]',
  0,
  'Princípios doutrinários: universalidade, integralidade, equidade. Princípios organizativos: descentralização, regionalização, hierarquização, participação.',
  'saude_coletiva', 'Políticas de Saúde', 'SUS', 'medio',
  0.2, 1.3, 0.20, 2021, 'expert'
),

-- SC4: Bioestatística (Difícil)
(
  'q1000000-0000-0000-0005-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Um teste diagnóstico para HIV tem sensibilidade de 99% e especificidade de 98%. Em uma população com prevalência de 1%, qual o valor preditivo positivo aproximado?',
  '[{"letter": "A", "text": "33%"}, {"letter": "B", "text": "50%"}, {"letter": "C", "text": "75%"}, {"letter": "D", "text": "99%"}, {"letter": "E", "text": "98%"}]',
  0,
  'VPP = VP/(VP+FP). Em 1000 pessoas: 10 HIV+ (9.9 VP), 990 HIV- (19.8 FP). VPP = 9.9/(9.9+19.8) ≈ 33%.',
  'saude_coletiva', 'Bioestatística', 'Testes Diagnósticos', 'dificil',
  1.2, 1.7, 0.20, 2023, 'expert'
),

-- SC5: Atenção Primária (Fácil)
(
  'q1000000-0000-0000-0005-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Qual o número máximo recomendado de pessoas adstritas a uma equipe de Saúde da Família?',
  '[{"letter": "A", "text": "4.000 pessoas"}, {"letter": "B", "text": "2.000 pessoas"}, {"letter": "C", "text": "1.000 pessoas"}, {"letter": "D", "text": "5.000 pessoas"}, {"letter": "E", "text": "3.500 pessoas"}]',
  0,
  'Cada eSF deve ser responsável por no máximo 4.000 pessoas (recomendado 2.000-3.500), considerando vulnerabilidade.',
  'saude_coletiva', 'Atenção Primária', 'ESF', 'facil',
  -0.8, 1.2, 0.20, 2021, 'expert'
),

-- SC6: Medicina do Trabalho (Médio)
(
  'q1000000-0000-0000-0005-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Trabalhador exposto a ruído de 90 dB por 8 horas diárias. Qual a conduta quanto ao PCMSO?',
  '[{"letter": "A", "text": "Audiometria admissional, periódica e demissional"}, {"letter": "B", "text": "Apenas audiometria anual"}, {"letter": "C", "text": "Audiometria a cada 2 anos"}, {"letter": "D", "text": "Exame clínico apenas"}, {"letter": "E", "text": "Dispensa acompanhamento audiométrico"}]',
  0,
  'Exposição >85 dB requer PCA com audiometria nos exames admissional, periódico (semestral a anual) e demissional.',
  'saude_coletiva', 'Saúde do Trabalhador', 'PCMSO', 'medio',
  0.4, 1.4, 0.20, 2022, 'expert'
),

-- SC7: Epidemiologia Descritiva (Difícil)
(
  'q1000000-0000-0000-0005-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Um estudo comparou fumantes e não fumantes quanto ao desenvolvimento de câncer de pulmão. RR = 10. Qual a fração atribuível no grupo exposto?',
  '[{"letter": "A", "text": "90%"}, {"letter": "B", "text": "80%"}, {"letter": "C", "text": "10%"}, {"letter": "D", "text": "50%"}, {"letter": "E", "text": "100%"}]',
  0,
  'Fração atribuível = (RR-1)/RR = (10-1)/10 = 0.9 = 90%. Significa que 90% dos casos em fumantes são atribuíveis ao fumo.',
  'saude_coletiva', 'Epidemiologia', 'Medidas de Associação', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- SC8: Ética Médica (Muito Fácil)
(
  'q1000000-0000-0000-0005-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente competente recusa transfusão sanguínea por motivos religiosos. Qual a conduta correta?',
  '[{"letter": "A", "text": "Respeitar a decisão e buscar alternativas"}, {"letter": "B", "text": "Realizar transfusão compulsória"}, {"letter": "C", "text": "Solicitar autorização judicial"}, {"letter": "D", "text": "Transferir para outro hospital"}, {"letter": "E", "text": "Aguardar perda de consciência para transfundir"}]',
  0,
  'Autonomia do paciente competente deve ser respeitada. Médico deve documentar, informar riscos e buscar alternativas.',
  'saude_coletiva', 'Ética Médica', 'Autonomia', 'muito_facil',
  -1.5, 1.2, 0.20, 2020, 'expert'
),

-- SC9: Epidemiologia Analítica (Muito Difícil)
(
  'q1000000-0000-0000-0005-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Ensaio clínico randomizado avalia nova droga vs placebo. 200 pacientes em cada grupo. Droga: 40 eventos. Placebo: 80 eventos. Qual o NNT?',
  '[{"letter": "A", "text": "5"}, {"letter": "B", "text": "10"}, {"letter": "C", "text": "20"}, {"letter": "D", "text": "2.5"}, {"letter": "E", "text": "4"}]',
  0,
  'NNT = 1/RAR. RAR = 80/200 - 40/200 = 0.4 - 0.2 = 0.2. NNT = 1/0.2 = 5. Precisa tratar 5 para prevenir 1 evento.',
  'saude_coletiva', 'Epidemiologia', 'Ensaios Clínicos', 'muito_dificil',
  1.6, 1.8, 0.20, 2023, 'expert'
),

-- SC10: Planejamento em Saúde (Médio)
(
  'q1000000-0000-0000-0005-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Na Programação Pactuada Integrada (PPI), qual o papel do município na organização da atenção?',
  '[{"letter": "A", "text": "Garantir acesso à atenção básica e referenciar para média/alta complexidade"}, {"letter": "B", "text": "Apenas executar ações de vigilância"}, {"letter": "C", "text": "Ofertar apenas alta complexidade"}, {"letter": "D", "text": "Definir políticas nacionais"}, {"letter": "E", "text": "Financiar a atenção hospitalar"}]',
  0,
  'Município é responsável pela atenção básica de sua população e deve pactuar referências para média e alta complexidade.',
  'saude_coletiva', 'Políticas de Saúde', 'Regionalização', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
);
