-- ============================================================
-- QGen Misconceptions Seed Data
-- Common medical student misconceptions for distractor generation
-- ============================================================

-- Insert medical areas first (if not already present)
INSERT INTO qgen_medical_areas (id, name, description, enamed_weight)
VALUES
  ('cm', 'clinica_medica', 'Clínica Médica', 0.30),
  ('cir', 'cirurgia', 'Cirurgia', 0.20),
  ('go', 'ginecologia_obstetricia', 'Ginecologia e Obstetrícia', 0.15),
  ('ped', 'pediatria', 'Pediatria', 0.15),
  ('sc', 'saude_coletiva', 'Saúde Coletiva', 0.20)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLÍNICA MÉDICA - Misconceptions
-- ============================================================

-- Cardiologia
INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('clinica_medica', 'Cardiologia', 'Atenolol causa hipercalemia',
   'IECA e BRA causam hipercalemia, não beta-bloqueadores',
   'Confusão entre mecanismos de ação de anti-hipertensivos',
   'O medicamento mais provável de causar hipercalemia neste paciente é {medicamento}',
   'high', 'moderate', ARRAY['Harrison 21ed, Cap. 274']),

  ('clinica_medica', 'Cardiologia', 'ICC com FE preservada é tratada apenas com diuréticos',
   'ICFEp requer controle de comorbidades (HAS, FA, DM), não apenas diuréticos',
   'Simplificação excessiva do manejo de ICFEp',
   'O tratamento inicial mais adequado para esta paciente seria {tratamento}',
   'high', 'moderate', ARRAY['Diretriz Brasileira de IC 2021']),

  ('clinica_medica', 'Cardiologia', 'Fibrilação atrial sempre requer anticoagulação',
   'Anticoagulação em FA depende do escore CHA2DS2-VASc',
   'Generalização do risco tromboembólico',
   'A conduta mais adequada para anticoagulação neste paciente é {conduta}',
   'medium', 'moderate', ARRAY['ESC AF Guidelines 2020']),

  ('clinica_medica', 'Cardiologia', 'Todo sopro cardíaco indica doença valvar',
   'Sopros inocentes são comuns, especialmente em crianças e jovens',
   'Confusão entre sopros fisiológicos e patológicos',
   'O sopro descrito é mais compatível com {diagnóstico}',
   'high', 'minor', ARRAY['Braunwald''s Heart Disease 12ed']);

-- Endocrinologia
INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('clinica_medica', 'Endocrinologia', 'Hipotireoidismo sempre cursa com TSH elevado',
   'Hipotireoidismo central (secundário/terciário) apresenta TSH baixo ou normal',
   'Desconhecimento do eixo hipotálamo-hipófise-tireoide',
   'O perfil hormonal mais compatível com este quadro é {perfil}',
   'medium', 'moderate', ARRAY['Williams Textbook of Endocrinology 14ed']),

  ('clinica_medica', 'Endocrinologia', 'Metformina causa hipoglicemia',
   'Metformina isoladamente não causa hipoglicemia; sulfonilureias e insulina causam',
   'Confusão entre mecanismos de antidiabéticos',
   'O medicamento mais provável de ter causado a hipoglicemia é {medicamento}',
   'high', 'critical', ARRAY['ADA Standards of Care 2024']),

  ('clinica_medica', 'Endocrinologia', 'Cetoacidose diabética ocorre apenas em DM1',
   'CAD pode ocorrer em DM2, especialmente em situações de estresse',
   'Associação rígida de complicações a tipos específicos de DM',
   'A complicação aguda mais provável neste paciente é {complicação}',
   'medium', 'critical', ARRAY['Kitabchi et al., Diabetes Care 2009']);

-- Pneumologia
INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('clinica_medica', 'Pneumologia', 'DPOC sempre apresenta padrão obstrutivo puro',
   'DPOC pode apresentar componente restritivo associado (padrão misto)',
   'Simplificação dos padrões espirométricos',
   'O padrão espirométrico mais compatível com este caso é {padrão}',
   'medium', 'moderate', ARRAY['GOLD 2024']),

  ('clinica_medica', 'Pneumologia', 'Pneumonia atípica não causa febre alta',
   'Pneumonias atípicas podem cursar com febre alta, especialmente Legionella',
   'Generalização excessiva de apresentações clínicas',
   'O agente etiológico mais provável neste caso é {agente}',
   'medium', 'moderate', ARRAY['IDSA/ATS Community-acquired Pneumonia Guidelines']);

-- Neurologia
INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('clinica_medica', 'Neurologia', 'Meningite bacteriana sempre apresenta tríade clássica',
   'A tríade clássica (febre, rigidez de nuca, alteração de consciência) está presente em <50% dos casos',
   'Dependência excessiva de apresentações típicas',
   'A apresentação clínica mais sugestiva de meningite bacteriana é {apresentação}',
   'high', 'critical', ARRAY['van de Beek et al., NEJM 2004']),

  ('clinica_medica', 'Neurologia', 'AVC hemorrágico sempre apresenta cefaleia súbita',
   'AVC hemorrágico pode ser assintomático inicialmente ou apresentar sintomas focais apenas',
   'Generalização de sintomas de hemorragia subaracnóide',
   'O sintoma inicial mais provável neste tipo de AVC é {sintoma}',
   'medium', 'critical', ARRAY['AHA/ASA Stroke Guidelines 2019']);

-- ============================================================
-- CIRURGIA - Misconceptions
-- ============================================================

INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('cirurgia', 'Abdome Agudo', 'Apendicite aguda sempre apresenta dor em FID desde o início',
   'Apendicite tipicamente inicia com dor periumbilical que migra para FID',
   'Desconhecimento da evolução clássica da dor apendicular',
   'A evolução típica da dor neste caso é {evolução}',
   'high', 'moderate', ARRAY['Schwartz''s Principles of Surgery 11ed']),

  ('cirurgia', 'Abdome Agudo', 'Obstrução intestinal alta não apresenta distensão abdominal',
   'Obstrução alta pode apresentar distensão, especialmente se tardia',
   'Simplificação de achados clínicos',
   'O achado mais característico desta obstrução é {achado}',
   'medium', 'moderate', ARRAY['Sabiston Textbook of Surgery 21ed']),

  ('cirurgia', 'Trauma', 'Hemotórax maciço requer sempre toracotomia de emergência',
   'Hemotórax maciço inicial geralmente é tratado com drenagem torácica; toracotomia se drenagem >1500ml ou >200ml/h',
   'Indicação precipitada de cirurgia',
   'A conduta inicial mais adequada para este hemotórax é {conduta}',
   'medium', 'critical', ARRAY['ATLS 10ed']),

  ('cirurgia', 'Cirurgia Vascular', 'Úlcera venosa sempre localiza-se no maléolo medial',
   'Úlceras venosas tipicamente afetam maléolo medial, mas podem ocorrer em outras localizações',
   'Rigidez na caracterização de úlceras',
   'A localização mais típica para este tipo de úlcera é {localização}',
   'medium', 'minor', ARRAY['Rutherford''s Vascular Surgery 9ed']);

-- ============================================================
-- GINECOLOGIA E OBSTETRÍCIA - Misconceptions
-- ============================================================

INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('ginecologia_obstetricia', 'Pré-eclâmpsia', 'Pré-eclâmpsia só ocorre após 20 semanas em primigestas',
   'Pré-eclâmpsia pode ocorrer em multíparas e, em casos de mola, antes de 20 semanas',
   'Generalização de fatores de risco',
   'O fator de risco mais importante neste caso de pré-eclâmpsia é {fator}',
   'high', 'critical', ARRAY['ACOG Practice Bulletin 222, 2020']),

  ('ginecologia_obstetricia', 'Diabetes Gestacional', 'DMG sempre requer insulinoterapia',
   'Maioria das pacientes com DMG responde ao tratamento não farmacológico (dieta + exercício)',
   'Medicalização excessiva do DMG',
   'O tratamento inicial mais adequado para esta paciente é {tratamento}',
   'medium', 'moderate', ARRAY['SBD Guidelines 2022']),

  ('ginecologia_obstetricia', 'Hemorragia Pós-parto', 'Atonia uterina é a única causa de HPP',
   'HPP pode ser causada pelos 4T: Tônus, Trauma, Tecido, Trombina',
   'Simplificação da etiologia da HPP',
   'A causa mais provável de HPP neste caso é {causa}',
   'high', 'critical', ARRAY['WHO Recommendations for HPP 2018']),

  ('ginecologia_obstetricia', 'Vulvovaginites', 'Candidíase sempre apresenta corrimento branco',
   'Candidíase pode apresentar corrimento mínimo ou ausente; prurido é o principal sintoma',
   'Dependência de características do corrimento para diagnóstico',
   'O achado mais sugestivo de candidíase neste caso é {achado}',
   'medium', 'minor', ARRAY['CDC STI Guidelines 2021']);

-- ============================================================
-- PEDIATRIA - Misconceptions
-- ============================================================

INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('pediatria', 'Bronquiolite', 'Bronquiolite deve ser tratada com broncodilatadores',
   'Broncodilatadores não são recomendados rotineiramente; tratamento é suportivo',
   'Extrapolação do tratamento de asma para bronquiolite',
   'O tratamento mais adequado para esta bronquiolite é {tratamento}',
   'high', 'moderate', ARRAY['AAP Bronchiolitis Guidelines 2014']),

  ('pediatria', 'Desidratação', 'Desidratação grave sempre requer hidratação venosa',
   'TRO pode ser usada mesmo em desidratação moderada a grave, se criança tolera via oral',
   'Subestimação da eficácia da TRO',
   'A via de hidratação mais adequada neste caso é {via}',
   'medium', 'moderate', ARRAY['WHO/UNICEF Oral Rehydration Therapy']),

  ('pediatria', 'Convulsão Febril', 'Convulsão febril indica início de epilepsia',
   'Convulsões febris simples não aumentam significativamente risco de epilepsia',
   'Confusão entre convulsão febril e epilepsia',
   'O prognóstico mais provável para esta criança é {prognóstico}',
   'high', 'moderate', ARRAY['AAP Febrile Seizure Guidelines 2011']),

  ('pediatria', 'Icterícia Neonatal', 'Icterícia fisiológica nunca requer tratamento',
   'Icterícia fisiológica pode atingir níveis que requerem fototerapia',
   'Falsa segurança sobre icterícia neonatal',
   'A conduta mais adequada para este nível de bilirrubina é {conduta}',
   'medium', 'critical', ARRAY['AAP Hyperbilirubinemia Guidelines 2022']);

-- ============================================================
-- SAÚDE COLETIVA - Misconceptions
-- ============================================================

INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('saude_coletiva', 'Epidemiologia', 'Prevalência e incidência podem ser usadas intercambiavelmente',
   'Prevalência mede casos existentes; incidência mede casos novos em período',
   'Confusão conceitual fundamental',
   'A medida mais adequada para avaliar este cenário epidemiológico é {medida}',
   'high', 'moderate', ARRAY['Gordis Epidemiology 6ed']),

  ('saude_coletiva', 'Vigilância', 'Notificação compulsória é sempre imediata',
   'Notificação pode ser imediata (24h) ou semanal, dependendo do agravo',
   'Desconhecimento da lista de notificação',
   'O prazo de notificação para este agravo é {prazo}',
   'medium', 'moderate', ARRAY['Portaria MS 264/2020']),

  ('saude_coletiva', 'Atenção Primária', 'UBS não pode realizar procedimentos cirúrgicos',
   'UBS realiza pequenas cirurgias e procedimentos básicos',
   'Subestimação da resolutividade da APS',
   'O procedimento adequado para realizar na UBS é {procedimento}',
   'medium', 'minor', ARRAY['PNAB 2017']),

  ('saude_coletiva', 'Vacinação', 'BCG deve ser reaplicada se não formar cicatriz',
   'Ausência de cicatriz não indica falha vacinal; não se reaplica BCG',
   'Interpretação incorreta de resposta vacinal',
   'A conduta frente à ausência de cicatriz de BCG é {conduta}',
   'high', 'critical', ARRAY['PNI Manual de Normas e Procedimentos']),

  ('saude_coletiva', 'Políticas de Saúde', 'NASF substitui a equipe de Saúde da Família',
   'NASF é equipe de apoio matricial, não substitui a eSF',
   'Confusão sobre papel do apoio matricial',
   'A função do NASF nesta situação é {função}',
   'medium', 'moderate', ARRAY['Portaria NASF 2488/2011']);

-- ============================================================
-- Additional high-frequency misconceptions across areas
-- ============================================================

INSERT INTO qgen_misconceptions (area, topic, misconception, correct_concept, common_confusion, distractor_template, frequency, severity, references)
VALUES
  ('clinica_medica', 'Infectologia', 'Sepse requer hemocultura positiva para diagnóstico',
   'Sepse é diagnóstico clínico (SOFA + infecção suspeita); hemocultura positiva em ~30%',
   'Dependência excessiva de exames para diagnóstico clínico',
   'O critério diagnóstico essencial para sepse é {critério}',
   'high', 'critical', ARRAY['Sepsis-3, JAMA 2016']),

  ('clinica_medica', 'Nefrologia', 'Creatinina normal exclui doença renal',
   'Creatinina pode estar normal com perda de até 50% da função renal',
   'Confiança excessiva na creatinina como marcador',
   'O exame mais adequado para avaliar função renal neste caso é {exame}',
   'high', 'moderate', ARRAY['KDIGO CKD Guidelines 2024']),

  ('clinica_medica', 'Reumatologia', 'FAN positivo confirma lúpus',
   'FAN é sensível mas não específico; pode estar positivo em diversas condições',
   'Interpretação incorreta de autoanticorpos',
   'O anticorpo mais específico para lúpus é {anticorpo}',
   'high', 'moderate', ARRAY['ACR/EULAR SLE Classification Criteria 2019']),

  ('cirurgia', 'Politrauma', 'TC de crânio é o primeiro exame no politrauma',
   'ABCDE e FAST são prioritários; TC depende de estabilidade hemodinâmica',
   'Inversão de prioridades no trauma',
   'O primeiro passo na avaliação deste paciente é {passo}',
   'high', 'critical', ARRAY['ATLS 10ed']),

  ('pediatria', 'Puericultura', 'Introdução alimentar deve iniciar aos 4 meses',
   'Introdução alimentar recomendada aos 6 meses de idade',
   'Desconhecimento das recomendações atuais',
   'A idade recomendada para introdução alimentar é {idade}',
   'high', 'moderate', ARRAY['OMS/SBP Alimentação Complementar']);

-- ============================================================
-- Create index for faster queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_misconceptions_area_topic
ON qgen_misconceptions(area, topic);

CREATE INDEX IF NOT EXISTS idx_misconceptions_frequency
ON qgen_misconceptions(frequency);

CREATE INDEX IF NOT EXISTS idx_misconceptions_severity
ON qgen_misconceptions(severity);
