-- ============================================================
-- DDL QUESTIONS: PEDIATRIA (20 questions)
-- Area: pediatria | Codes: PED-DDL-001 to PED-DDL-020
-- ============================================================

INSERT INTO ddl_questions (
    question_code,
    question_text,
    discipline,
    topic,
    subtopic,
    difficulty_level,
    cognitive_level,
    reference_answer,
    key_concepts,
    required_integrations
) VALUES

-- Neonatologia
(
    'PED-DDL-001',
    'Recém-nascido a termo apresenta febre e letargia no terceiro dia de vida. Suspeita-se de sepse neonatal. Descreva os principais fatores de risco e o manejo inicial.',
    'Pediatria',
    'Neonatologia',
    'Sepse Neonatal',
    3,
    'Analise',
    'Fatores de risco: prematuridade, ruptura prolongada de membranas, corioamnionite. Manejo: antibióticos empíricos (ampicilina + gentamicina), culturas de sangue e urina, suporte hemodinâmico.',
    '[{"concept": "sepse neonatal", "weight": 0.4, "synonyms": ["infeccao neonatal precoce"]}, {"concept": "antibioticos empiricos", "weight": 0.3, "synonyms": ["ampicilina + gentamicina"]}, {"concept": "fatores de risco", "weight": 0.3, "synonyms": ["prematuridade"]}]'::jsonb,
    '[{"from": "febre", "to": "sepse neonatal", "relation": "sugere"}, {"from": "letargia", "to": "sepse neonatal", "relation": "indica"}]'::jsonb
),
(
    'PED-DDL-002',
    'Recém-nascido pequeno para idade gestacional apresenta tremores e irritabilidade nas primeiras horas de vida. Descreva a abordagem diagnóstica e terapêutica para hipoglicemia neonatal.',
    'Pediatria',
    'Neonatologia',
    'Hipoglicemia Neonatal',
    2,
    'Compreensao',
    'Diagnóstico: glicemia capilar <45 mg/dL. Terapêutica: glicose IV se não responder a alimentação oral, investigação de causas (maternidade diabética, PIG).',
    '[{"concept": "hipoglicemia neonatal", "weight": 0.35, "synonyms": ["baixa glicemia neonatal"]}, {"concept": "glicose IV", "weight": 0.35, "synonyms": ["reposicao glicose"]}, {"concept": "PIG", "weight": 0.30, "synonyms": ["pequeno para idade gestacional"]}]'::jsonb,
    '[{"from": "tremores", "to": "hipoglicemia", "relation": "sugere"}, {"from": "PIG", "to": "hipoglicemia", "relation": "fator de risco"}]'::jsonb
),

-- Crescimento e Desenvolvimento
(
    'PED-DDL-003',
    'Criança de 12 meses não consegue andar sozinha e apresenta atraso em outros marcos motores. Avalie as possíveis causas e os próximos passos no acompanhamento.',
    'Pediatria',
    'Crescimento e Desenvolvimento',
    'Marcos do Desenvolvimento',
    4,
    'Aplicacao',
    'Causas: distúrbios neuromusculares, hipotireoidismo, negligência. Próximos passos: exame neurológico, triagem para erros inatos, referência a especialista.',
    '[{"concept": "marcos do desenvolvimento", "weight": 0.3, "synonyms": ["desenvolvimento motor"]}, {"concept": "atraso global", "weight": 0.25, "synonyms": ["retardo de desenvolvimento"]}, {"concept": "exame neurologico", "weight": 0.25, "synonyms": ["avaliacao neuromotora"]}, {"concept": "erros inatos", "weight": 0.20, "synonyms": ["doencas metabolicas"]}]'::jsonb,
    '[{"from": "atraso motor", "to": "disturbio neurologico", "relation": "pode indicar"}, {"from": "avaliacao", "to": "referencia especialista", "relation": "segue"}]'::jsonb
),
(
    'PED-DDL-004',
    'Criança de 2 anos apresenta peso abaixo do percentil 5 e perda de apetite recente. Descreva a classificação da desnutrição e o manejo inicial.',
    'Pediatria',
    'Crescimento e Desenvolvimento',
    'Desnutricao',
    3,
    'Analise',
    'Classificação: aguda (IMC/idade < -2DP), crônica (estatura/idade < -2DP). Manejo: reabilitação nutricional gradual, suplementos, investigação de causas subjacentes.',
    '[{"concept": "desnutricao", "weight": 0.4, "synonyms": ["desnutricao proteico-calorica"]}, {"concept": "classificacao antropometrica", "weight": 0.3, "synonyms": ["z-score"]}, {"concept": "reabilitacao nutricional", "weight": 0.3, "synonyms": ["suplementacao"]}]'::jsonb,
    '[{"from": "perda de peso", "to": "desnutricao aguda", "relation": "indica"}, {"from": "desnutricao", "to": "investigacao", "relation": "requer"}]'::jsonb
),

-- Infectologia Pediatrica
(
    'PED-DDL-005',
    'Lactente de 6 meses apresenta febre alta, rigidez de nuca e irritabilidade. Suspeita-se de meningite bacteriana. Descreva o diagnóstico diferencial e o tratamento empírico.',
    'Pediatria',
    'Infectologia Pediatrica',
    'Meningite',
    5,
    'Avaliacao',
    'Diagnóstico: punção lombar (LCR com pleocitose, glicorraquia baixa). Tratamento: ceftriaxona IV + vancomicina, dexametasona em casos suspeitos de pneumococo.',
    '[{"concept": "meningite bacteriana", "weight": 0.45, "synonyms": ["meningite infantil"]}, {"concept": "puncao lombar", "weight": 0.25, "synonyms": ["LCR"]}, {"concept": "ceftriaxona", "weight": 0.30, "synonyms": ["antibiotico empirico"]}]'::jsonb,
    '[{"from": "rigidez de nuca", "to": "meningite", "relation": "sugere"}, {"from": "febre", "to": "infeccao", "relation": "indica"}]'::jsonb
),
(
    'PED-DDL-006',
    'Criança de 3 meses com infecção respiratória viral apresenta sibilos, taquipneia e hipoxemia. Discuta o diagnóstico e manejo da bronquiolite.',
    'Pediatria',
    'Infectologia Pediatrica',
    'Bronquiolite',
    2,
    'Compreensao',
    'Diagnóstico: clínico (VRS em ~75% dos casos). Manejo: suporte (oxigênio se SatO2 <90% — AAP 2014), hidratação, evitar broncodilatadores rotineiros (sem benefício comprovado).',
    '[{"concept": "bronquiolite", "weight": 0.35, "synonyms": ["infeccao respiratoria aguda"]}, {"concept": "VRS", "weight": 0.30, "synonyms": ["virus sincicial respiratorio"]}, {"concept": "suporte oxigenio", "weight": 0.35, "synonyms": ["oxigenoterapia"]}]'::jsonb,
    '[{"from": "sibilos", "to": "bronquiolite", "relation": "caracteriza"}, {"from": "hipoxemia", "to": "oxigenio", "relation": "requer"}]'::jsonb
),

-- Emergencias Pediatricas
(
    'PED-DDL-007',
    'Criança de 18 meses apresenta convulsão tônico-clônica durante episódio febril. Explique a diferenciação entre convulsão febril simples e complexa, e o manejo agudo.',
    'Pediatria',
    'Emergencias Pediatricas',
    'Convulsao Febril',
    3,
    'Analise',
    'Simples: <15min, generalizada, única. Complexa: >15min, focal, recorrente. Manejo: antipiréticos, diazepam retal se persistir, investigação se complexa.',
    '[{"concept": "convulsao febril", "weight": 0.4, "synonyms": ["crise convulsiva febril"]}, {"concept": "simples vs complexa", "weight": 0.30, "synonyms": ["classificacao"]}, {"concept": "diazepam", "weight": 0.30, "synonyms": ["benzodiazepínico"]}]'::jsonb,
    '[{"from": "febre", "to": "convulsao febril", "relation": "precipita"}, {"from": "complexa", "to": "investigacao", "relation": "indica"}]'::jsonb
),
(
    'PED-DDL-008',
    'Criança de 4 anos com diarreia aquosa há 3 dias apresenta letargia, olhos fundos e redução de diurese. Avalie o grau de desidratação e o plano de reidratação.',
    'Pediatria',
    'Emergencias Pediatricas',
    'Desidratacao',
    4,
    'Aplicacao',
    'Grau: moderado (5-10%, sinais como olhos fundos). Plano: SRO oral se tolerar, ou SF IV 20ml/kg bolus, manutenção.',
    '[{"concept": "desidratacao", "weight": 0.35, "synonyms": ["desidratacao por diarreia"]}, {"concept": "reidratacao oral", "weight": 0.25, "synonyms": ["SRO"]}, {"concept": "SF IV", "weight": 0.25, "synonyms": ["soro fisiologico"]}, {"concept": "sinais clinicos", "weight": 0.15, "synonyms": ["olhos fundos", "turgor"]}]'::jsonb,
    '[{"from": "letargia", "to": "desidratacao moderada", "relation": "indica"}, {"from": "desidratacao", "to": "reidratacao", "relation": "requer"}]'::jsonb
),

-- Imunizacao
(
    'PED-DDL-009',
    'Mãe de bebê de 2 meses consulta sobre as vacinas em dia. Descreva o calendário vacinal brasileiro recomendado para os primeiros 12 meses de vida.',
    'Pediatria',
    'Imunizacao',
    'Calendario Vacinal',
    2,
    'Compreensao',
    'Nascimento: BCG + hepatite B. 2 meses: penta, VIP, VORH (1ª dose), pneumocócica 10V. 4 meses: penta, VIP, VORH (2ª dose), pneumocócica 10V. 6 meses: penta, VIP. Nota: VORH são apenas 2 doses (2 e 4 meses); BCG é ao nascer, não aos 2 meses. Reforço aos 12 meses: pneumocócica + meningo C.',
    '[{"concept": "calendario vacinal", "weight": 0.3, "synonyms": ["vacinacao infantil"]}, {"concept": "vacinas basicas", "weight": 0.35, "synonyms": ["penta", "VIP"]}, {"concept": "pneumococica", "weight": 0.35, "synonyms": ["vacina pneumococo"]}]'::jsonb,
    '[{"from": "2 meses", "to": "vacinas iniciais", "relation": "inclui"}, {"from": "calendario", "to": "protecao", "relation": "garante"}]'::jsonb
),
(
    'PED-DDL-010',
    'Criança de 6 meses apresenta febre e choro inconsolável 24 horas após vacinação DTP. Discuta as reações adversas comuns às vacinas e critérios para procurar atendimento.',
    'Pediatria',
    'Imunizacao',
    'Reacoes Adversas',
    3,
    'Analise',
    'Reações comuns: febre, dor local, irritabilidade (DTP). Procurar se: febre >39°C persistente, convulsão, choro >3h.',
    '[{"concept": "reacoes adversas vacinais", "weight": 0.4, "synonyms": ["efeitos colaterais vacinas"]}, {"concept": "DTP", "weight": 0.30, "synonyms": ["triplice bacteriana"]}, {"concept": "criterios alarme", "weight": 0.30, "synonyms": ["sinais de perigo"]}]'::jsonb,
    '[{"from": "choro inconsolavel", "to": "reacao adversa DTP", "relation": "sugere"}, {"from": "febre alta", "to": "atendimento", "relation": "indica"}]'::jsonb
),

-- Neonatologia (11-12)
(
    'PED-DDL-011',
    'Recém-nascido prematuro de 32 semanas nasce com taquipneia, gemidos e retrações intercostais. Raio-X de tórax revela padrão de vidro fosco bilateral. O bebê apresenta hipoxemia.',
    'Pediatria',
    'Neonatologia',
    'Doenca da Membrana Hialina',
    3,
    'Analise',
    'A doença da membrana hialina resulta da deficiência de surfactante pulmonar em prematuros. Diagnóstico confirmado por radiografia. Tratamento: oxigenoterapia, CPAP e administração de surfactante exógeno.',
    '[{"concept": "doenca da membrana hialina", "weight": 0.5, "synonyms": ["RDS", "sindrome do desconforto respiratorio"]}, {"concept": "surfactante pulmonar", "weight": 0.3, "synonyms": ["fosfolipideos pulmonares"]}, {"concept": "CPAP", "weight": 0.2, "synonyms": ["ventilacao nao invasiva"]}]'::jsonb,
    '[{"from": "taquipneia", "to": "doenca da membrana hialina", "relation": "sugere"}, {"from": "padrao de vidro fosco", "to": "DMH", "relation": "confirma"}, {"from": "hipoxemia", "to": "insuficiencia respiratoria", "relation": "indica"}]'::jsonb
),
(
    'PED-DDL-012',
    'Recém-nascido a termo apresenta Apgar de 4 no primeiro minuto, acidose metabólica e convulsões nas primeiras horas de vida. A mãe relata trabalho de parto prolongado com sofrimento fetal.',
    'Pediatria',
    'Neonatologia',
    'Asfixia Perinatal',
    4,
    'Aplicacao',
    'A asfixia perinatal causa encefalopatia hipóxico-isquêmica. Manejo: reanimação com ventilação e correção de acidose. Possível uso de hipotermia terapêutica para neuroproteção.',
    '[{"concept": "asfixia perinatal", "weight": 0.4, "synonyms": ["hipoxia perinatal"]}, {"concept": "encefalopatia hipoxico-isquemica", "weight": 0.3, "synonyms": ["EHI"]}, {"concept": "Apgar baixo", "weight": 0.2, "synonyms": ["escore de Apgar"]}, {"concept": "hipotermia terapeutica", "weight": 0.1, "synonyms": ["neuroprotecao"]}]'::jsonb,
    '[{"from": "Apgar baixo", "to": "asfixia perinatal", "relation": "indica"}, {"from": "convulsoes", "to": "encefalopatia", "relation": "sugere"}, {"from": "sofrimento fetal", "to": "hipoxia", "relation": "causa"}]'::jsonb
),

-- Crescimento e Desenvolvimento (13-14)
(
    'PED-DDL-013',
    'Criança de 8 anos apresenta ganho de peso excessivo nos últimos 2 anos, com IMC no percentil 95. Há histórico familiar de diabetes tipo 2 e sedentarismo.',
    'Pediatria',
    'Crescimento e Desenvolvimento',
    'Obesidade Infantil',
    2,
    'Compreensao',
    'A obesidade infantil é multifatorial. Avaliação inclui IMC e triagem para comorbidades como dislipidemia e intolerância à glicose. Intervenções focam em mudanças no estilo de vida familiar.',
    '[{"concept": "obesidade infantil", "weight": 0.4, "synonyms": ["sobrepeso pediatrico"]}, {"concept": "IMC elevado", "weight": 0.3, "synonyms": ["indice de massa corporal"]}, {"concept": "fatores de risco", "weight": 0.2, "synonyms": ["historico familiar"]}, {"concept": "estilo de vida", "weight": 0.1, "synonyms": ["dieta e exercicio"]}]'::jsonb,
    '[{"from": "ganho de peso excessivo", "to": "obesidade", "relation": "define"}, {"from": "historico familiar", "to": "diabetes tipo 2", "relation": "aumenta risco"}]'::jsonb
),
(
    'PED-DDL-014',
    'Menina de 7 anos é trazida à consulta por desenvolvimento de mamas e pelos pubianos há 6 meses, com altura acelerada acima do percentil 90.',
    'Pediatria',
    'Crescimento e Desenvolvimento',
    'Puberdade Precoce',
    5,
    'Avaliacao',
    'Puberdade precoce diagnosticada quando sinais puberais antes dos 8 anos em meninas. Investigação: hormônios gonadais, RM de encéfalo. Tratamento com análogos de GnRH para preservar altura final.',
    '[{"concept": "puberdade precoce", "weight": 0.5, "synonyms": ["maturacao sexual precoce"]}, {"concept": "telarca", "weight": 0.2, "synonyms": ["desenvolvimento mamario"]}, {"concept": "analogos GnRH", "weight": 0.2, "synonyms": ["tratamento hormonal"]}, {"concept": "altura acelerada", "weight": 0.1, "synonyms": ["crescimento rapido"]}]'::jsonb,
    '[{"from": "desenvolvimento de mamas", "to": "puberdade precoce", "relation": "sugere"}, {"from": "altura acelerada", "to": "maturacao avancada", "relation": "indica"}]'::jsonb
),

-- Infectologia Pediatrica (15-16)
(
    'PED-DDL-015',
    'Criança de 2 anos com febre há 3 dias, irritabilidade e otalgia. Otoscopia revela membrana timpânica abaulada e hiperêmica.',
    'Pediatria',
    'Infectologia Pediatrica',
    'Otite Media',
    3,
    'Aplicacao',
    'Otite média aguda comum em pré-escolares. Tratamento com analgésicos e antibióticos (amoxicilina) em casos com critérios de gravidade. Prevenção inclui vacinação pneumocócica.',
    '[{"concept": "otite media aguda", "weight": 0.4, "synonyms": ["OMA"]}, {"concept": "otalgia", "weight": 0.3, "synonyms": ["dor de ouvido"]}, {"concept": "amoxicilina", "weight": 0.2, "synonyms": ["antibiotico"]}, {"concept": "membrana timpanica", "weight": 0.1, "synonyms": ["timpano"]}]'::jsonb,
    '[{"from": "febre", "to": "otite media", "relation": "sugere"}, {"from": "otalgia", "to": "infeccao otologica", "relation": "indica"}, {"from": "membrana hiperemica", "to": "OMA", "relation": "confirma"}]'::jsonb
),
(
    'PED-DDL-016',
    'Criança de 5 anos não vacinada apresenta erupção pruriginosa maculopapular iniciando no tronco, com febre baixa e lesões vesiculares.',
    'Pediatria',
    'Infectologia Pediatrica',
    'Varicela',
    4,
    'Analise',
    'Varicela causada pelo vírus varicela-zoster, altamente contagiosa. Diagnóstico clínico pela rash vesicular; complicações incluem infecção secundária. Tratamento sintomático com antipiréticos; aciclovir em imunocomprometidos.',
    '[{"concept": "varicela", "weight": 0.5, "synonyms": ["catapora"]}, {"concept": "erupcao vesicular", "weight": 0.2, "synonyms": ["rash de varicela"]}, {"concept": "virus varicela-zoster", "weight": 0.2, "synonyms": ["VZV"]}, {"concept": "aciclovir", "weight": 0.1, "synonyms": ["antiviral"]}]'::jsonb,
    '[{"from": "erupcao pruriginosa", "to": "varicela", "relation": "sugere"}, {"from": "lesoes vesiculares", "to": "infeccao viral", "relation": "caracteriza"}, {"from": "nao vacinada", "to": "varicela", "relation": "aumenta risco"}]'::jsonb
),

-- Emergencias Pediatricas (17-18)
(
    'PED-DDL-017',
    'Adolescente de 12 anos ingere amendoim e imediatamente desenvolve urticária generalizada, dispneia e hipotensão. Histórico de atopia.',
    'Pediatria',
    'Emergencias Pediatricas',
    'Anafilaxia',
    5,
    'Avaliacao',
    'Anafilaxia é reação alérgica grave mediada por IgE. Tratamento imediato com epinefrina intramuscular, seguido de anti-histamínicos e corticoides. Monitoramento hospitalar e educação sobre auto-injetor.',
    '[{"concept": "anafilaxia", "weight": 0.4, "synonyms": ["choque anafilatico"]}, {"concept": "epinefrina", "weight": 0.3, "synonyms": ["adrenalina"]}, {"concept": "urticaria", "weight": 0.2, "synonyms": ["hives"]}, {"concept": "auto-injetor", "weight": 0.1, "synonyms": ["EpiPen"]}]'::jsonb,
    '[{"from": "urticaria", "to": "anafilaxia", "relation": "sugere"}, {"from": "dispneia", "to": "reacao alergica grave", "relation": "indica"}, {"from": "hipotensao", "to": "choque", "relation": "confirma"}]'::jsonb
),
(
    'PED-DDL-018',
    'Criança de 3 anos é trazida ao PS após ingestão acidental de comprimidos de paracetamol (dose estimada 200 mg/kg). Apresenta náuseas, vômitos e letargia.',
    'Pediatria',
    'Emergencias Pediatricas',
    'Intoxicacao',
    4,
    'Aplicacao',
    'Intoxicação por paracetamol causa hepatotoxicidade. Avaliação com níveis séricos e N-acetilcisteína (NAC) como antídoto se indicado pelo nomograma de Rumack. Monitoramento de função hepática.',
    '[{"concept": "intoxicacao por paracetamol", "weight": 0.4, "synonyms": ["sobredosagem acetaminofeno"]}, {"concept": "N-acetilcisteina", "weight": 0.3, "synonyms": ["NAC"]}, {"concept": "hepatotoxicidade", "weight": 0.2, "synonyms": ["lesao hepatica"]}, {"concept": "nomograma de Rumack", "weight": 0.1, "synonyms": ["avaliacao toxicidade"]}]'::jsonb,
    '[{"from": "ingestao acidental", "to": "intoxicacao", "relation": "causa"}, {"from": "nauseas", "to": "paracetamol overdose", "relation": "sugere"}, {"from": "letargia", "to": "toxicidade hepatica", "relation": "indica"}]'::jsonb
),

-- Imunizacao (19-20)
(
    'PED-DDL-019',
    'Lactente de 6 meses com história de alergia grave a ovo é levado para vacinação. Os pais questionam sobre a segurança da vacina SCR.',
    'Pediatria',
    'Imunizacao',
    'Contraindicacoes Vacinais',
    3,
    'Compreensao',
    'Alergia a ovo isolada não é contraindicação absoluta para SCR. Administração deve ocorrer em ambiente com suporte para anafilaxia. Consulta com alergista recomendada em dúvida.',
    '[{"concept": "contraindicacoes vacinais", "weight": 0.4, "synonyms": ["proibicoes de vacinacao"]}, {"concept": "vacina SCR", "weight": 0.3, "synonyms": ["sarampo-caxumba-rubeola"]}, {"concept": "alergia a ovo", "weight": 0.2, "synonyms": ["hipersensibilidade"]}, {"concept": "anafilaxia", "weight": 0.1, "synonyms": ["reacao grave"]}]'::jsonb,
    '[{"from": "alergia a ovo", "to": "contraindicacao SCR", "relation": "nao absoluta"}, {"from": "ambiente preparado", "to": "vacinacao segura", "relation": "exige"}]'::jsonb
),
(
    'PED-DDL-020',
    'Criança de 4 anos em quimioterapia por leucemia linfoblástica aguda precisa completar o calendário vacinal. Está em neutropenia.',
    'Pediatria',
    'Imunizacao',
    'Imunizacao em Imunossuprimidos',
    2,
    'Analise',
    'Em pacientes imunossuprimidos, vacinas vivas atenuadas são contraindicadas. Priorizar vacinas inativadas. Vacinação após recuperação imunológica, 3-6 meses pós-quimioterapia.',
    '[{"concept": "imunizacao em imunossuprimidos", "weight": 0.4, "synonyms": ["vacinacao em onco-hematologicos"]}, {"concept": "vacinas vivas", "weight": 0.3, "synonyms": ["vacinas atenuadas"]}, {"concept": "neutropenia", "weight": 0.2, "synonyms": ["imunossupressao"]}, {"concept": "vacinas inativadas", "weight": 0.1, "synonyms": ["vacinas mortas"]}]'::jsonb,
    '[{"from": "quimioterapia", "to": "imunossupressao", "relation": "causa"}, {"from": "vacinas vivas", "to": "contraindicadas", "relation": "em neutropenicos"}, {"from": "recuperacao imunologica", "to": "inicio vacinacao", "relation": "permite"}]'::jsonb
);
