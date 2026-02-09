-- FCR Cases Seed Data
-- 5 high-quality clinical reasoning cases (one per ENAMED area)

INSERT INTO fcr_cases (
  id,
  title_pt,
  clinical_presentation_pt,
  area,
  difficulty,
  dados_options,
  padrao_options,
  hipotese_options,
  conduta_options,
  correct_dados,
  correct_padrao,
  correct_hipotese,
  correct_conduta,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  is_public,
  is_ai_generated
) VALUES

-- CASE 1: CLÍNICA MÉDICA - Insuficiência Cardíaca Descompensada
(
  gen_random_uuid(),
  'Insuficiência Cardíaca Descompensada',
  'Paciente masculino, 68 anos, hipertenso há 20 anos em uso irregular de losartana. Procura pronto-socorro com queixa de falta de ar progressiva há 5 dias, inicialmente aos esforços moderados e agora aos mínimos esforços. Relata ortopneia (necessita dormir com 3 travesseiros), dispneia paroxística noturna e edema de membros inferiores com cacifo 3+/4+. Nega dor torácica. Exame físico: PA 160/100 mmHg, FC 98 bpm, FR 28 irpm, SpO2 92% em ar ambiente. Turgência jugular patológica a 45°. Ausculta cardíaca: ritmo regular, B3 presente, sopro sistólico 2+/6+ em foco mitral. Ausculta pulmonar: estertores crepitantes em bases bilateralmente até terço médio.',
  'clinica_medica',
  'medio',
  '[
    {"id":"icc-dados-1","textPt":"Dispneia progressiva aos esforços com ortopneia","isCorrect":true,"explanationPt":"Sintoma cardinal de IC esquerda por congestão pulmonar. A ortopneia ocorre pelo aumento do retorno venoso ao deitar.","clinicalPearlPt":"Ortopneia é mais específica para IC que dispneia isolada (especificidade ~90%)."},
    {"id":"icc-dados-2","textPt":"Edema de MMII com cacifo 3+/4+","isCorrect":true,"explanationPt":"Sinal de IC direita ou biventricular por congestão sistêmica. O cacifo intenso indica retenção volumétrica importante.","clinicalPearlPt":"Edema com cacifo bilateral sugere causa sistêmica; unilateral sugere causa local (TVP, linfedema)."},
    {"id":"icc-dados-3","textPt":"Estertores crepitantes em bases pulmonares","isCorrect":true,"explanationPt":"Sinal de congestão pulmonar por transudação de líquido para alvéolos (edema pulmonar cardiogênico).","clinicalPearlPt":"Estertores que não melhoram com tosse sugerem edema; que melhoram sugerem secreção."},
    {"id":"icc-dados-4","textPt":"Febre de 38.5°C","isCorrect":false,"explanationPt":"Não há menção de febre no caso. Febre sugeriria processo infeccioso concomitante, não IC descompensada isolada.","clinicalPearlPt":null},
    {"id":"icc-dados-5","textPt":"Dor torácica em aperto irradiando para MSE","isCorrect":false,"explanationPt":"O caso explicitamente nega dor torácica. Dor anginosa sugeriria SCA, não IC descompensada isolada.","clinicalPearlPt":null},
    {"id":"icc-dados-6","textPt":"Sopro diastólico em foco aórtico","isCorrect":false,"explanationPt":"O caso descreve sopro sistólico em foco mitral, não diastólico em aórtico. Sopro sistólico mitral sugere insuficiência mitral funcional por dilatação do VE.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"icc-padrao-1","textPt":"Síndrome de congestão biventricular","isCorrect":true,"explanationPt":"Presença de sinais de congestão pulmonar (dispneia, ortopneia, estertores) E sistêmica (edema MMII, TJP), caracterizando IC biventricular.","clinicalPearlPt":"Classificação de Killip-Kimball avalia congestão pulmonar; Forrester adiciona perfusão periférica."},
    {"id":"icc-padrao-2","textPt":"Síndrome coronariana aguda","isCorrect":false,"explanationPt":"Não há dor torácica típica. SCA se apresenta com dor anginosa, não com dispneia progressiva e sinais congestivos crônicos.","clinicalPearlPt":null},
    {"id":"icc-padrao-3","textPt":"Pneumonia adquirida na comunidade","isCorrect":false,"explanationPt":"Ausência de febre, tosse produtiva ou dor pleurítica. Estertores bilaterais simétricos favorecem edema cardiogênico sobre consolidação infecciosa.","clinicalPearlPt":null},
    {"id":"icc-padrao-4","textPt":"Tromboembolismo pulmonar","isCorrect":false,"explanationPt":"TEP agudo cursa com dispneia súbita e dor pleurítica, não dispneia progressiva. Edema MMII bilateral não é típico de TEP.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"icc-hipotese-1","textPt":"Insuficiência cardíaca descompensada (IC agudizada crônica)","isCorrect":true,"explanationPt":"Quadro clássico de IC descompensada: dispneia progressiva, ortopneia, DPN, edema MMII, B3, estertores, TJP. Contexto de HAS mal controlada.","clinicalPearlPt":"Critérios de Framingham: 2 maiores ou 1 maior + 2 menores. Este caso tem 4 critérios maiores (DPN, TJP, estertores, B3)."},
    {"id":"icc-hipotese-2","textPt":"Doença renal crônica descompensada","isCorrect":false,"explanationPt":"DRC pode causar edema e dispneia por hipervolemia, mas não explica B3, estertores extensos e ortopneia sem história de doença renal.","clinicalPearlPt":null},
    {"id":"icc-hipotese-3","textPt":"Cirrose hepática descompensada","isCorrect":false,"explanationPt":"Cirrose causa ascite e edema, mas não congestão pulmonar com estertores e B3. Ausência de sinais hepáticos (ascite, icterícia, hepatomegalia).","clinicalPearlPt":null},
    {"id":"icc-hipotese-4","textPt":"Síndrome nefrótica","isCorrect":false,"explanationPt":"Síndrome nefrótica causa edema generalizado (anasarca), mas não congestão pulmonar com ortopneia, B3 e estertores crepitantes.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"icc-conduta-1","textPt":"Oxigenoterapia (manter SpO2 ≥94%) + Furosemida IV + restrição hídrica e de sódio","isCorrect":true,"explanationPt":"Diurético de alça IV é terapia inicial para congestão em IC descompensada. Restrição hídrico-salina reduz sobrecarga volêmica.","clinicalPearlPt":"Diretriz brasileira recomenda furosemida 20-40mg IV inicialmente, podendo dobrar dose se sem resposta em 2h. Meta: diurese >100-150ml/h."},
    {"id":"icc-conduta-2","textPt":"Antibioticoterapia empírica de amplo espectro","isCorrect":false,"explanationPt":"Não há sinais de infecção (sem febre, leucocitose não mencionada). Antibiótico não trata IC descompensada.","clinicalPearlPt":null},
    {"id":"icc-conduta-3","textPt":"Anticoagulação plena com heparina","isCorrect":false,"explanationPt":"Não há diagnóstico de TEP ou FA. Anticoagulação não está indicada como terapia inicial da IC descompensada sem essas comorbidades.","clinicalPearlPt":null},
    {"id":"icc-conduta-4","textPt":"Nitroprussiato de sódio em infusão contínua","isCorrect":false,"explanationPt":"Nitroprussiato é vasodilatador para crise hipertensiva ou IC descompensada com baixo débito. Este paciente não tem critérios para vasodilatador IV isolado (PA não está em níveis críticos, sem sinais de hipoperfusão). Furosemida é primeira linha.","clinicalPearlPt":null}
  ]'::jsonb,
  ARRAY['icc-dados-1', 'icc-dados-2', 'icc-dados-3'],
  'icc-padrao-1',
  'icc-hipotese-1',
  'icc-conduta-1',
  0.0,
  1.2,
  0.25,
  true,
  false
),

-- CASE 2: CIRURGIA - Apendicite Aguda
(
  gen_random_uuid(),
  'Abdome Agudo - Apendicite Aguda',
  'Paciente masculino, 25 anos, previamente hígido. Procura emergência com dor abdominal iniciada há 12 horas. Relata início de dor vaga em região periumbilical, associada a náuseas e hiporexia. Após 6 horas, a dor migrou para fossa ilíaca direita (FID), tornando-se mais intensa e contínua. Nega vômitos, diarreia ou sintomas urinários. Evacuação normal há 1 dia. Exame físico: regular estado geral, descorado 1+/4+, T=37.8°C, FC=92bpm, PA=120/70mmHg. Abdome: RHA presentes, doloroso à palpação profunda em FID com descompressão brusca positiva (sinal de Blumberg). Sinal de Rovsing positivo. Ausência de massas palpáveis ou visceromegalias.',
  'cirurgia',
  'medio',
  '[
    {"id":"apend-dados-1","textPt":"Dor periumbilical migrando para FID","isCorrect":true,"explanationPt":"Migração clássica da apendicite: dor visceral periumbilical (inervação do mesentério) evoluindo para dor somática em FID (irritação peritoneal local).","clinicalPearlPt":"Sinal de Kocher: migração de dor para FID tem sensibilidade ~50% mas especificidade ~80% para apendicite."},
    {"id":"apend-dados-2","textPt":"Náuseas e hiporexia (anorexia)","isCorrect":true,"explanationPt":"Sintomas gastrointestinais inespecíficos comuns na apendicite. A anorexia ocorre em >90% dos casos.","clinicalPearlPt":"Sequência clássica: dor → anorexia → náusea/vômito. Vômito antes da dor sugere gastroenterite, não apendicite."},
    {"id":"apend-dados-3","textPt":"Sinal de Blumberg positivo (descompressão brusca dolorosa)","isCorrect":true,"explanationPt":"Sinal de irritação peritoneal. Indica inflamação do peritônio parietal adjacente ao apêndice inflamado.","clinicalPearlPt":"Blumberg tem especificidade ~80% para peritonite. Pode estar ausente em apendicite retrocecal (longe do peritônio anterior)."},
    {"id":"apend-dados-4","textPt":"Diarreia profusa e desidratação","isCorrect":false,"explanationPt":"O caso nega diarreia. Diarreia profusa sugere gastroenterite aguda, não apendicite (que pode ter obstipação ou fezes amolecidas leves).","clinicalPearlPt":null},
    {"id":"apend-dados-5","textPt":"Hematúria macroscópica","isCorrect":false,"explanationPt":"Não há sintomas urinários. Hematúria sugere urolitíase ou ITU, não apendicite.","clinicalPearlPt":null},
    {"id":"apend-dados-6","textPt":"Icterícia e colúria","isCorrect":false,"explanationPt":"Ausência de sinais de colestase. Icterícia e colúria sugerem doença hepatobiliar (colecistite, coledocolitíase), não apendicite.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"apend-padrao-1","textPt":"Síndrome de peritonite localizada em FID","isCorrect":true,"explanationPt":"Dor migratória para FID com sinais de irritação peritoneal localizada (Blumberg, Rovsing) caracteriza peritonite focal, típica de apendicite aguda.","clinicalPearlPt":"Escore de Alvarado ≥7 tem sensibilidade ~80% para apendicite. Este caso pontua: dor migratória, anorexia, náusea, dor FID, Blumberg, febre baixa = 7-8 pontos."},
    {"id":"apend-padrao-2","textPt":"Síndrome diarreica aguda","isCorrect":false,"explanationPt":"Não há diarreia. Gastroenterite cursa com dor difusa/cólica, diarreia, vômitos, sem sinais de irritação peritoneal localizada.","clinicalPearlPt":null},
    {"id":"apend-padrao-3","textPt":"Cólica nefrética direita","isCorrect":false,"explanationPt":"Cólica renal é de início súbito, em flanco/lombar com irradiação para genitália, sem migração para FID ou irritação peritoneal.","clinicalPearlPt":null},
    {"id":"apend-padrao-4","textPt":"Perfuração de víscera oca","isCorrect":false,"explanationPt":"Perfuração causa peritonite difusa (dor generalizada, abdome em tábua, pneumoperitônio), não peritonite localizada em FID com 12h de evolução.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"apend-hipotese-1","textPt":"Apendicite aguda não complicada","isCorrect":true,"explanationPt":"Quadro clássico: migração de dor para FID, anorexia, febre baixa, sinais de irritação peritoneal localizada (Blumberg, Rovsing). Escore de Alvarado ≥7.","clinicalPearlPt":"TC abdome com contraste é padrão-ouro (sens/espec >95%), mas diagnóstico é clínico. Leucocitose com desvio à esquerda ocorre em 80% dos casos."},
    {"id":"apend-hipotese-2","textPt":"Doença inflamatória intestinal (retocolite ulcerativa)","isCorrect":false,"explanationPt":"DII cursa com diarreia sanguinolenta crônica/recorrente, não dor aguda em FID com 12h de evolução e irritação peritoneal.","clinicalPearlPt":null},
    {"id":"apend-hipotese-3","textPt":"Diverticulite aguda","isCorrect":false,"explanationPt":"Diverticulite é rara em paciente de 25 anos (pico >60 anos), acomete cólon sigmoide (dor em FIE, não FID) e não tem migração periumbilical.","clinicalPearlPt":null},
    {"id":"apend-hipotese-4","textPt":"Gastroenterite aguda","isCorrect":false,"explanationPt":"Gastroenterite causa dor difusa/cólica com diarreia e vômitos, sem migração para FID ou sinais de irritação peritoneal localizada.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"apend-conduta-1","textPt":"Apendicectomia (videolaparoscópica ou aberta) após hidratação","isCorrect":true,"explanationPt":"Tratamento definitivo da apendicite aguda é cirúrgico. Apendicectomia deve ser realizada assim que diagnóstico confirmado, após ressuscitação volêmica e ATB profilático.","clinicalPearlPt":"Via laparoscópica é preferencial (menor dor pós-op, alta mais rápida, menor infecção de ferida). ATB profilático: cefoxitina ou ceftriaxona+metronidazol dose única pré-op."},
    {"id":"apend-conduta-2","textPt":"Antibioticoterapia exclusiva (tratamento conservador)","isCorrect":false,"explanationPt":"ATB exclusivo pode ser tentado em apendicite não complicada em casos selecionados, mas tem taxa de recorrência 20-30% em 1 ano. Não é conduta padrão inicial.","clinicalPearlPt":null},
    {"id":"apend-conduta-3","textPt":"Alta hospitalar com analgésicos e reavaliação ambulatorial","isCorrect":false,"explanationPt":"Apendicite aguda é emergência cirúrgica. Alta sem tratamento definitivo pode levar a perfuração, peritonite difusa e sepse.","clinicalPearlPt":null},
    {"id":"apend-conduta-4","textPt":"Colonoscopia para investigação de DII","isCorrect":false,"explanationPt":"Colonoscopia não está indicada em abdome agudo com sinais de irritação peritoneal (risco de perfuração). Não investiga apendicite aguda.","clinicalPearlPt":null}
  ]'::jsonb,
  ARRAY['apend-dados-1', 'apend-dados-2', 'apend-dados-3'],
  'apend-padrao-1',
  'apend-hipotese-1',
  'apend-conduta-1',
  0.0,
  1.2,
  0.25,
  true,
  false
),

-- CASE 3: GINECOLOGIA E OBSTETRÍCIA - Pré-eclâmpsia Grave
(
  gen_random_uuid(),
  'Pré-eclâmpsia Grave',
  'Paciente feminina, 28 anos, G1P0A0, 34 semanas de gestação por DUM compatível com USG do 1º trimestre. Procura emergência obstétrica com cefaleia frontal intensa e persistente há 6 horas, fotofobia e "embaçamento visual" (escotomas cintilantes). Nega dor abdominal, sangramento vaginal ou perda de líquido. Nega contrações uterinas. Pré-natal com 6 consultas, sem intercorrências até 28 semanas. PA prévia: 110/70 mmHg. Não fez uso de AAS profilático. Exame físico: regular estado geral, PA=170/110 mmHg (confirmada após 4h: 180/115 mmHg), FC=88bpm, Tax=36.8°C. Reflexos patelares exaltados (3+/4+) com clônus aquileu presente (4 batimentos). Edema de MMII 2+/4+. Ausculta fetal: BCF=145bpm, rítmico. AU=32cm. Toque: colo posterior, grosso, fechado.',
  'ginecologia_obstetricia',
  'dificil',
  '[
    {"id":"preec-dados-1","textPt":"Cefaleia frontal intensa com escotomas visuais","isCorrect":true,"explanationPt":"Sintomas neurológicos de pré-eclâmpsia grave (critério de gravidade). Indicam vasoespasmo cerebral e risco de eclâmpsia e AVC.","clinicalPearlPt":"Cefaleia da pré-eclâmpsia é tipicamente frontal/occipital, não responde a analgésicos comuns, e piora com luminosidade."},
    {"id":"preec-dados-2","textPt":"Hipertensão severa (PAS≥160 ou PAD≥110 mmHg)","isCorrect":true,"explanationPt":"PA ≥160/110 mmHg define hipertensão severa, critério de gravidade de pré-eclâmpsia (ACOG 2019). Requer tratamento anti-hipertensivo urgente.","clinicalPearlPt":"Hipertensão severa requer tratamento em até 30-60min para reduzir risco de AVC materno (principal causa de morte em pré-eclâmpsia)."},
    {"id":"preec-dados-3","textPt":"Hiperreflexia com clônus","isCorrect":true,"explanationPt":"Sinal de hiperexcitabilidade do SNC, indicando risco aumentado de convulsão (eclâmpsia). Clônus ≥3 batimentos é patológico.","clinicalPearlPt":"Clônus não é critério diagnóstico de pré-eclâmpsia, mas sinaliza iminência de eclâmpsia junto com cefaleia/escotomas. Indica sulfato de magnésio."},
    {"id":"preec-dados-4","textPt":"Febre de 38.5°C e leucocitose","isCorrect":false,"explanationPt":"Não há febre no caso. Pré-eclâmpsia não cursa com febre (afebril). Febre sugeriria infecção concomitante ou síndrome HELLP com hemólise maciça (raro).","clinicalPearlPt":null},
    {"id":"preec-dados-5","textPt":"Sangramento vaginal ativo","isCorrect":false,"explanationPt":"O caso nega sangramento. Sangramento vaginal em gestante hipertensa sugeriria descolamento prematuro de placenta (DPP), não pré-eclâmpsia isolada.","clinicalPearlPt":null},
    {"id":"preec-dados-6","textPt":"Dor torácica pleurítica","isCorrect":false,"explanationPt":"Não há dor torácica. Dor epigástrica/hipocôndrio direito pode ocorrer (sinal de distensão capsular hepática em HELLP), mas não dor pleurítica.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"preec-padrao-1","textPt":"Síndrome hipertensiva específica da gestação com sinais de gravidade","isCorrect":true,"explanationPt":"Hipertensão (PAS≥140 ou PAD≥90) após 20 semanas + sintomas neurológicos (cefaleia, escotomas) + hipertensão severa caracterizam pré-eclâmpsia com sinais de gravidade.","clinicalPearlPt":"Critérios de gravidade (ACOG): PA≥160/110, sintomas neurológicos/visuais, plaquetas<100k, Cr>1.1, transaminases 2x, edema pulmonar, dor epigástrica."},
    {"id":"preec-padrao-2","textPt":"Hipertensão arterial crônica descompensada","isCorrect":false,"explanationPt":"PA prévia era normal (110/70). HAC é diagnosticada antes de 20 semanas ou persistente >12 semanas pós-parto. Este caso é hipertensão de início recente (≥28 semanas).","clinicalPearlPt":null},
    {"id":"preec-padrao-3","textPt":"Enxaqueca com aura","isCorrect":false,"explanationPt":"Enxaqueca pode causar cefaleia e escotomas, mas não explica hipertensão severa de início súbito, hiperreflexia e contexto de 34 semanas de gestação.","clinicalPearlPt":null},
    {"id":"preec-padrao-4","textPt":"Eclâmpsia","isCorrect":false,"explanationPt":"Eclâmpsia é definida por convulsão tônico-clônica em paciente com pré-eclâmpsia. Este caso ainda não convulsionou (é pré-eclâmpsia iminente/grave, não eclâmpsia).","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"preec-hipotese-1","textPt":"Pré-eclâmpsia grave (com sinais de iminência de eclâmpsia)","isCorrect":true,"explanationPt":"Diagnóstico: primigesta, ≥20 semanas, PA≥140/90 (grave: ≥160/110) + sintomas neurológicos (cefaleia, escotomas, hiperreflexia/clônus). Iminência de eclâmpsia justifica neuroproteção urgente.","clinicalPearlPt":"Fatores de risco: primigestação, extremos de idade, obesidade, HAC, DM, gestação múltipla, história familiar. Profilaxia com AAS 100-150mg/dia desde 12-16 semanas reduz risco de pré-eclâmpsia pré-termo em até 62% (ASPRE trial, NEJM 2017)."},
    {"id":"preec-hipotese-2","textPt":"Síndrome HELLP completa","isCorrect":false,"explanationPt":"HELLP (hemólise, enzimas hepáticas elevadas, plaquetopenia) é complicação da pré-eclâmpsia. Este caso não menciona dor epigástrica, icterícia ou sangramento (sugestivos de HELLP). Exames laboratoriais não foram fornecidos.","clinicalPearlPt":null},
    {"id":"preec-hipotese-3","textPt":"Hipertensão gestacional sem pré-eclâmpsia","isCorrect":false,"explanationPt":"Hipertensão gestacional é PA≥140/90 após 20 semanas SEM proteinúria ou disfunção orgânica. Presença de sintomas neurológicos (cefaleia, escotomas, hiperreflexia) define pré-eclâmpsia com gravidade.","clinicalPearlPt":null},
    {"id":"preec-hipotese-4","textPt":"Descolamento prematuro de placenta (DPP)","isCorrect":false,"explanationPt":"DPP cursa com dor abdominal intensa (contratura uterina), sangramento vaginal e sofrimento fetal. Este caso nega dor abdominal e sangramento, BCF normal.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"preec-conduta-1","textPt":"Sulfato de magnésio IV (neuroproteção) + anti-hipertensivo (hidralazina ou nifedipina) + corticoide + programar parto","isCorrect":true,"explanationPt":"Terapia completa: MgSO4 previne eclâmpsia (NNT=100 para pré-ec grave), anti-HT trata crise (meta: PAD 90-100), corticoide amadurece pulmão fetal <34sem, parto é cura definitiva.","clinicalPearlPt":"MgSO4: ataque 4g IV (regime Zuspan) 20min, manutenção 1-2g/h. Monitorar reflexo patelar, FR, diurese (intoxicação: arreflexia, FR<12, oligúria). Antídoto: gluconato de Ca 1g IV."},
    {"id":"preec-conduta-2","textPt":"Conduta expectante ambulatorial com repouso","isCorrect":false,"explanationPt":"Pré-eclâmpsia grave com sintomas neurológicos requer internação hospitalar imediata. Conduta expectante só é considerada em pré-eclâmpsia sem sinais de gravidade <37 semanas.","clinicalPearlPt":null},
    {"id":"preec-conduta-3","textPt":"Diurético de alça (furosemida) para reduzir edema","isCorrect":false,"explanationPt":"Diuréticos são contraindicados na pré-eclâmpsia (reduzem perfusão placentária e agravam hemoconcentração). Edema não é critério diagnóstico nem requer tratamento.","clinicalPearlPt":null},
    {"id":"preec-conduta-4","textPt":"Heparina profilática e AAS","isCorrect":false,"explanationPt":"AAS após 20 semanas não previne pré-eclâmpsia (deve iniciar no 1º trimestre). Heparina profilática não trata pré-eclâmpsia grave (indicação: tromboprofilaxia em obesas ou trombofilia). Conduta urgente é MgSO4 + anti-HT + parto.","clinicalPearlPt":null}
  ]'::jsonb,
  ARRAY['preec-dados-1', 'preec-dados-2', 'preec-dados-3'],
  'preec-padrao-1',
  'preec-hipotese-1',
  'preec-conduta-1',
  0.8,
  1.2,
  0.25,
  true,
  false
),

-- CASE 4: PEDIATRIA - Bronquiolite Viral Aguda
(
  gen_random_uuid(),
  'Bronquiolite Viral Aguda',
  'Lactente de 4 meses, sexo masculino, previamente hígido. Mãe relata quadro de coriza hialina e febre baixa (Tax=37.8°C) há 3 dias. Há 1 dia, evoluiu com tosse, "chiado no peito" e dificuldade para mamar (aceitando apenas 50% do volume habitual). Nega cianose ou apneia. Irmão de 3 anos com resfriado na semana passada. Nascido de parto normal a termo (39 semanas), PN=3200g. Aleitamento materno exclusivo. Vacinas em dia. Exame físico: regular estado geral, corado, hidratado, Tax=38.2°C, FC=150bpm, FR=60irpm, SatO2=92% em ar ambiente. Tiragem subcostal e intercostal leve. AR: MV presente bilateralmente com sibilos expiratórios difusos e estertores crepitantes finos em bases. ACV: ritmo regular, sem sopros. Abdome: plano, flácido, sem visceromegalias.',
  'pediatria',
  'facil',
  '[
    {"id":"bronq-dados-1","textPt":"Sibilância difusa em lactente jovem (<6 meses) no primeiro episódio","isCorrect":true,"explanationPt":"Sibilância em primeiro episódio em lactente <2 anos, especialmente <6 meses, é altamente sugestiva de bronquiolite viral (VSR em 60-80% dos casos).","clinicalPearlPt":"Bronquiolite é a causa mais comum de sibilância em <1 ano. Asma é rara nessa idade (diagnóstico considerado após 3+ episódios recorrentes)."},
    {"id":"bronq-dados-2","textPt":"Pródrome de IVAS (coriza, febre baixa) seguido de sintomas respiratórios baixos","isCorrect":true,"explanationPt":"Padrão clássico de bronquiolite: 1-3 dias de sintomas de IVAS seguidos por tosse, sibilos, taquipneia e desconforto respiratório.","clinicalPearlPt":"Sequência temporal é diagnóstica: IVAS → 24-72h → sibilância/taquipneia. Pico de sintomas: 3-5 dias."},
    {"id":"bronq-dados-3","textPt":"Tiragem subcostal/intercostal e taquipneia (FR=60irpm)","isCorrect":true,"explanationPt":"Sinais de desconforto respiratório por obstrução de vias aéreas pequenas. FR>60irpm em lactente indica taquipneia (VR 2-12 meses: 24-40irpm).","clinicalPearlPt":"Gravidade (escala de Tal/Wood-Downes): FR, tiragem, sibilos, SatO2. Grave: FR>70, tiragem intensa, SatO2<90%, letargia/apneia."},
    {"id":"bronq-dados-4","textPt":"Estridor inspiratório de início súbito","isCorrect":false,"explanationPt":"Não há estridor. Estridor é som agudo inspiratório de obstrução de via aérea ALTA (laringe/traqueia), sugestivo de crupe, não bronquiolite (via baixa).","clinicalPearlPt":null},
    {"id":"bronq-dados-5","textPt":"Febre alta (≥39°C) e toxemia","isCorrect":false,"explanationPt":"Bronquiolite cursa com febre baixa/ausente. Febre alta e toxemia sugerem pneumonia bacteriana ou sepse, não bronquiolite viral.","clinicalPearlPt":null},
    {"id":"bronq-dados-6","textPt":"Cianose central persistente","isCorrect":false,"explanationPt":"Caso nega cianose. SatO2=92% é limítrofe mas não indica cianose central. Cianose persistente indicaria hipoxemia grave (SatO2<85%) e necessidade de suporte ventilatório.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"bronq-padrao-1","textPt":"Síndrome de obstrução brônquica em lactente jovem","isCorrect":true,"explanationPt":"Sibilância + taquipneia + tiragem em lactente <6 meses após pródrome viral caracteriza obstrução de vias aéreas inferiores (bronquíolos), típica de bronquiolite.","clinicalPearlPt":"Diagnóstico diferencial de sibilância em <2 anos: bronquiolite (mais comum), asma (raro <1 ano, geralmente recorrente), aspiração de corpo estranho (início súbito, unilateral)."},
    {"id":"bronq-padrao-2","textPt":"Crupe viral (laringotraqueobronquite)","isCorrect":false,"explanationPt":"Crupe cursa com tosse metálica/ladrante, estridor inspiratório, rouquidão, não sibilância expiratória. Acomete via aérea alta (laringe), não bronquíolos.","clinicalPearlPt":null},
    {"id":"bronq-padrao-3","textPt":"Pneumonia bacteriana","isCorrect":false,"explanationPt":"Pneumonia bacteriana cursa com febre alta, taquipneia, estertores crepitantes localizados (consolidação), não sibilos difusos. RX: consolidação, não hiperinsuflação.","clinicalPearlPt":null},
    {"id":"bronq-padrao-4","textPt":"Insuficiência cardíaca congestiva","isCorrect":false,"explanationPt":"ICC em lactente causa taquipneia e estertores, mas cursa com hepatomegalia, má-perfusão, sudorese às mamadas, não sibilos difusos após IVAS.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"bronq-hipotese-1","textPt":"Bronquiolite viral aguda (provavelmente por VSR)","isCorrect":true,"explanationPt":"Diagnóstico clínico: lactente <2 anos, primeiro episódio, pródrome de IVAS, sibilância difusa, taquipneia, tiragem. VSR é agente em 60-80% (epidemia: outono-inverno).","clinicalPearlPt":"Exames complementares não são necessários para diagnóstico (clínico). RX tórax: hiperinsuflação, espessamento peribrônquico, atelectasias. PCR VSR: não altera conduta em casos típicos."},
    {"id":"bronq-hipotese-2","textPt":"Asma do lactente","isCorrect":false,"explanationPt":"Asma requer episódios recorrentes de sibilância (≥3). Primeiro episódio em lactente <6 meses após IVAS é bronquiolite até prova em contrário.","clinicalPearlPt":null},
    {"id":"bronq-hipotese-3","textPt":"Coqueluche","isCorrect":false,"explanationPt":"Coqueluche cursa com tosse paroxística (acesso de tosse seguido de guincho inspiratório), vômitos pós-tosse, apneia em <6 meses. Não causa sibilância difusa.","clinicalPearlPt":null},
    {"id":"bronq-hipotese-4","textPt":"Fibrose cística","isCorrect":false,"explanationPt":"FC causa infecções respiratórias recorrentes, desnutrição, diarreia crônica (insuficiência pancreática). Não é diagnóstico de quadro agudo isolado em lactente previamente hígido.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"bronq-conduta-1","textPt":"Suporte clínico: hidratação, oxigenoterapia se SatO2<90%, aspiração de VAS, observação","isCorrect":true,"explanationPt":"Bronquiolite é doença autolimitada (7-10 dias). Tratamento é suportivo: O2 se hipoxemia, hidratação (preferencialmente oral/LM), desobstrução nasal. Internação se desconforto grave, SatO2<90%, idade<3m, comorbidades.","clinicalPearlPt":"NÃO usar rotineiramente: broncodilatadores (sem benefício comprovado), corticoides (não recomendado), antibióticos (viral). Adrenalina nebulizada pode ser tentada em casos graves (efeito transitório)."},
    {"id":"bronq-conduta-2","textPt":"Antibioticoterapia empírica (amoxicilina)","isCorrect":false,"explanationPt":"Bronquiolite é viral. Antibiótico não está indicado na ausência de pneumonia bacteriana associada (febre alta persistente, leucocitose, consolidação ao RX).","clinicalPearlPt":null},
    {"id":"bronq-conduta-3","textPt":"Corticoide sistêmico (prednisolona VO)","isCorrect":false,"explanationPt":"Corticoides não têm benefício comprovado em bronquiolite e não são recomendados por diretrizes (AAP, SBP). Diferente de asma, não reduzem inflamação nem hospitalização.","clinicalPearlPt":null},
    {"id":"bronq-conduta-4","textPt":"Salbutamol inalatório de manutenção","isCorrect":false,"explanationPt":"Broncodilatadores (salbutamol, fenoterol) não são recomendados rotineiramente (sem benefício clínico em revisões sistemáticas). Teste terapêutico pode ser feito, mas se sem resposta, descontinuar.","clinicalPearlPt":null}
  ]'::jsonb,
  ARRAY['bronq-dados-1', 'bronq-dados-2', 'bronq-dados-3'],
  'bronq-padrao-1',
  'bronq-hipotese-1',
  'bronq-conduta-1',
  -0.5,
  1.2,
  0.25,
  true,
  false
),

-- CASE 5: SAÚDE COLETIVA - Tuberculose Pulmonar
(
  gen_random_uuid(),
  'Tuberculose Pulmonar',
  'Paciente masculino, 35 anos, procura UBS com queixa de tosse há 5 semanas. Refere tosse inicialmente seca, tornando-se produtiva com expectoração amarelada nas últimas 2 semanas, ocasionalmente hemoptoica (raias de sangue). Associa sudorese noturna profusa (troca de roupa durante a noite), febre vespertina diária não aferida, e perda de 7 kg no último mês (peso habitual 72kg, atual 65kg). Nega dispneia, dor torácica ou ânsia. Contato domiciliar: tio com "TB" em tratamento há 2 meses, residindo na mesma casa. História social: tabagista 20 anos-maço, etilista social, nega uso de drogas ilícitas. Nega comorbidades ou uso de medicações. Exame físico: regular estado geral, emagrecido, descorado 1+/4+, Tax=37.2°C (aferida pela manhã), IMC=19.5. AR: MV presente bilateralmente, estertores crepitantes em ápice de HTD.',
  'saude_coletiva',
  'medio',
  '[
    {"id":"tb-dados-1","textPt":"Tosse produtiva há >3 semanas (5 semanas)","isCorrect":true,"explanationPt":"Tosse persistente ≥3 semanas é sintoma definidor de SINTOMÁTICO RESPIRATÓRIO (SR) para rastreio de TB. Sensibilidade ~80% para TB pulmonar.","clinicalPearlPt":"TODO paciente com tosse ≥3 semanas deve coletar 2 amostras de escarro para baciloscopia (BAAR) e teste rápido molecular (TRM-TB)."},
    {"id":"tb-dados-2","textPt":"Sudorese noturna e febre vespertina com emagrecimento (7kg/mês)","isCorrect":true,"explanationPt":"Sintomas constitucionais clássicos de TB: febre vespertina, sudorese noturna profusa, emagrecimento >10% do peso corporal. Indicam doença ativa com alta carga bacilar.","clinicalPearlPt":"Tríade clássica: tosse + febre/sudorese + emagrecimento. Presente em ~60% dos casos de TB pulmonar."},
    {"id":"tb-dados-3","textPt":"Contato domiciliar com TB ativa","isCorrect":true,"explanationPt":"Exposição a caso índice (tio em tratamento) aumenta risco de infecção/doença em 10-30x. Contatos intradomiciliares têm maior risco (compartilham ambiente fechado, maior tempo de exposição).","clinicalPearlPt":"Investigação de contatos: todos os contatos domiciliares devem fazer RX tórax e PT/IGRA. Se assintomáticos e RX normal, tratar ILTB (infecção latente) se PT≥5mm."},
    {"id":"tb-dados-4","textPt":"Dor torácica pleurítica intensa","isCorrect":false,"explanationPt":"Não há dor torácica no caso. Dor pleurítica sugere derrame pleural (TB pleural) ou pneumotórax, não TB pulmonar parenquimatosa isolada.","clinicalPearlPt":null},
    {"id":"tb-dados-5","textPt":"Dispneia aos mínimos esforços","isCorrect":false,"explanationPt":"Caso nega dispneia. TB pulmonar geralmente não causa dispneia (a não ser em doença extensa bilateral ou derrame pleural volumoso). Dispneia sugere ICC, DPOC ou pneumonia extensa.","clinicalPearlPt":null},
    {"id":"tb-dados-6","textPt":"Exantema maculopapular pruriginoso","isCorrect":false,"explanationPt":"Não há exantema. TB não causa exantema (exceto reação adversa a medicamentos anti-TB, como rifampicina).","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"tb-padrao-1","textPt":"Síndrome consumptiva com sintomas respiratórios crônicos","isCorrect":true,"explanationPt":"Tosse crônica (>3 sem) + sintomas constitucionais (febre, sudorese, emagrecimento) + contexto epidemiológico (contato TB) caracterizam síndrome compatível com TB pulmonar ativa.","clinicalPearlPt":"Diagnóstico de TB é confirmado por: BAAR+ ou TRM-TB+ (confirma microbactéria) ou cultura+ (padrão-ouro, resultado em 4-8 semanas). Clínico-radiológico é presuntivo."},
    {"id":"tb-padrao-2","textPt":"Pneumonia bacteriana típica","isCorrect":false,"explanationPt":"Pneumonia bacteriana tem início agudo (dias), febre alta, tosse produtiva purulenta, sem sintomas constitucionais crônicos (sudorese, emagrecimento).","clinicalPearlPt":null},
    {"id":"tb-padrao-3","textPt":"Neoplasia pulmonar","isCorrect":false,"explanationPt":"Câncer de pulmão pode causar tosse, emagrecimento e hemoptise, mas é raro em paciente de 35 anos. Contexto de contato TB e sintomas agudos (5 semanas) favorecem TB.","clinicalPearlPt":null},
    {"id":"tb-padrao-4","textPt":"DPOC exacerbada","isCorrect":false,"explanationPt":"DPOC causa tosse crônica, mas paciente de 35 anos sem história de DPOC prévia não tem doença estabelecida. DPOC não causa febre vespertina, sudorese e emagrecimento acentuado.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"tb-hipotese-1","textPt":"Tuberculose pulmonar ativa","isCorrect":true,"explanationPt":"Diagnóstico altamente provável: sintomático respiratório (tosse ≥3sem) + sintomas constitucionais + contato TB + achados compatíveis (estertores em ápice). Confirmação: BAAR/TRM-TB/cultura de escarro.","clinicalPearlPt":"Fluxograma MS: sintomático respiratório → coletar 2 amostras de escarro (1ª no momento, 2ª manhã seguinte) → TRM-TB (resultado em 2h) OU baciloscopia (resultado em 24h). RX tórax: infiltrado/cavitação em lobos superiores."},
    {"id":"tb-hipotese-2","textPt":"Pneumonia atípica por Mycoplasma","isCorrect":false,"explanationPt":"Mycoplasma causa pneumonia subaguda (1-2 sem), tosse seca, sem sintomas constitucionais intensos ou contato TB. Emagrecimento de 7kg não é típico.","clinicalPearlPt":null},
    {"id":"tb-hipotese-3","textPt":"Aspergilose pulmonar","isCorrect":false,"explanationPt":"Aspergilose ocorre em imunossuprimidos (HIV, corticoide, transplante) ou coloniza cavidades preexistentes (sequela de TB). Paciente sem fatores de risco ou doença prévia.","clinicalPearlPt":null},
    {"id":"tb-hipotese-4","textPt":"Bronquite crônica","isCorrect":false,"explanationPt":"Bronquite crônica é definida por tosse produtiva ≥3 meses/ano por ≥2 anos (critério de DPOC). Não causa febre, sudorese noturna, emagrecimento ou hemoptise.","clinicalPearlPt":null}
  ]'::jsonb,
  '[
    {"id":"tb-conduta-1","textPt":"Coleta de 2 amostras de escarro (TRM-TB/BAAR) + RX tórax + iniciar esquema básico se alta suspeição","isCorrect":true,"explanationPt":"Conduta MS: SR → coletar escarro (TRM-TB preferencial, resultado rápido) + RX tórax. Se TRM+ ou clínico-radiológico compatível + BAAR+, iniciar esquema básico RHZE (rifampicina, isoniazida, pirazinamida, etambutol) por 2 meses + RH por 4 meses. Notificação compulsória.","clinicalPearlPt":"TRM-TB detecta MTB e resistência à rifampicina (RR-TB) em 2h. Se indisponível, BAAR (sensibilidade ~60%, especificidade ~98%). Cultura é padrão-ouro (sensibilidade >80%) mas demora 4-8 semanas."},
    {"id":"tb-conduta-2","textPt":"Prescrever azitromicina e orientar retorno em 7 dias","isCorrect":false,"explanationPt":"Azitromicina trata pneumonia atípica, não TB. Tratar empiricamente como pneumonia sem investigar TB pode atrasar diagnóstico, piorar prognóstico e manter transmissão.","clinicalPearlPt":null},
    {"id":"tb-conduta-3","textPt":"Encaminhar para pneumologista e aguardar avaliação","isCorrect":false,"explanationPt":"TB é diagnosticada e tratada na Atenção Primária (política de descentralização do MS). Não é necessário encaminhar para especialista em caso típico. Investigação e tratamento devem ser imediatos.","clinicalPearlPt":null},
    {"id":"tb-conduta-4","textPt":"Solicitar TC de tórax e aguardar resultado","isCorrect":false,"explanationPt":"TC não é necessária para diagnóstico inicial de TB pulmonar (RX simples é suficiente). Prioridade é coletar escarro (confirma diagnóstico microbiológico) e iniciar tratamento sem atraso.","clinicalPearlPt":null}
  ]'::jsonb,
  ARRAY['tb-dados-1', 'tb-dados-2', 'tb-dados-3'],
  'tb-padrao-1',
  'tb-hipotese-1',
  'tb-conduta-1',
  0.0,
  1.2,
  0.25,
  true,
  false
);
