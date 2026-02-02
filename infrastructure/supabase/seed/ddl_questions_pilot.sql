-- ============================================================
-- DDL PILOT QUESTIONS - MEDICAL EDUCATION
-- 5 questoes piloto para teste do sistema DDL
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

-- QUESTAO 1: Farmacologia - Mecanismo de Acao
(
    'DDL-FARM-001',
    'Explique o mecanismo de acao dos inibidores da ECA (Enzima Conversora de Angiotensina) no tratamento da hipertensao arterial.',
    'Farmacologia',
    'Anti-hipertensivos',
    'IECA',
    3,
    'Compreensao/Aplicacao',
    'Os inibidores da ECA bloqueiam a enzima conversora de angiotensina, impedindo a conversao de angiotensina I em angiotensina II. Isso resulta em vasodilatacao (pela reducao da angiotensina II, um potente vasoconstritor) e reducao da retencao de sodio e agua (pela diminuicao da liberacao de aldosterona). Adicionalmente, ha acumulo de bradicinina, que contribui para a vasodilatacao e tambem para efeitos colaterais como a tosse seca.',
    '[
        {"concept": "bloqueio da ECA", "weight": 0.25, "synonyms": ["inibicao da enzima conversora", "bloqueia ECA"]},
        {"concept": "angiotensina II reduzida", "weight": 0.20, "synonyms": ["diminuicao de angiotensina II", "menos angiotensina 2"]},
        {"concept": "vasodilatacao", "weight": 0.20, "synonyms": ["dilatacao dos vasos", "relaxamento vascular"]},
        {"concept": "aldosterona diminuida", "weight": 0.15, "synonyms": ["reducao de aldosterona", "menos aldosterona"]},
        {"concept": "acumulo de bradicinina", "weight": 0.10, "synonyms": ["bradicinina aumentada", "elevacao de bradicinina"]},
        {"concept": "tosse seca como efeito colateral", "weight": 0.10, "synonyms": ["tosse como reacao adversa"]}
    ]'::jsonb,
    '[
        {"from": "bloqueio da ECA", "to": "angiotensina II reduzida", "relation": "causa"},
        {"from": "angiotensina II reduzida", "to": "vasodilatacao", "relation": "resulta_em"},
        {"from": "angiotensina II reduzida", "to": "aldosterona diminuida", "relation": "causa"},
        {"from": "bloqueio da ECA", "to": "acumulo de bradicinina", "relation": "causa"},
        {"from": "acumulo de bradicinina", "to": "tosse seca como efeito colateral", "relation": "causa"}
    ]'::jsonb
),

-- QUESTAO 2: Fisiologia - Integracao de Sistemas
(
    'DDL-FISIO-001',
    'Descreva como o sistema nervoso autonomo e o sistema renina-angiotensina-aldosterona atuam de forma integrada na regulacao da pressao arterial.',
    'Fisiologia',
    'Regulacao Cardiovascular',
    'Integracao Neuro-Humoral',
    4,
    'Analise/Sintese',
    'O sistema nervoso autonomo regula a pressao arterial de forma rapida atraves do simpatico (aumenta FC, contratilidade e vasoconstricao) e parassimpatico (reduz FC). Ja o sistema RAA atua de forma mais lenta: a queda de pressao estimula liberacao de renina, que converte angiotensinogenio em angiotensina I, depois em angiotensina II pela ECA. A angiotensina II causa vasoconstricao direta e estimula aldosterona, retendo sodio e agua. Esses sistemas se integram: o simpatico estimula diretamente a liberacao de renina, criando um loop de amplificacao na resposta a hipotensao.',
    '[
        {"concept": "simpatico aumenta FC e vasoconstricao", "weight": 0.15, "synonyms": ["sistema simpatico eleva frequencia cardiaca"]},
        {"concept": "parassimpatico reduz FC", "weight": 0.10, "synonyms": ["vagal diminui frequencia"]},
        {"concept": "renina liberada por queda de pressao", "weight": 0.15, "synonyms": ["hipotensao estimula renina"]},
        {"concept": "cascata angiotensinogenio-angiotensina", "weight": 0.15, "synonyms": ["conversao de angiotensina"]},
        {"concept": "angiotensina II vasoconstricao", "weight": 0.15, "synonyms": ["ang II contrai vasos"]},
        {"concept": "aldosterona retem sodio e agua", "weight": 0.10, "synonyms": ["aldosterona aumenta volemia"]},
        {"concept": "simpatico estimula renina", "weight": 0.20, "synonyms": ["integracao simpatico-RAA", "loop neuro-humoral"]}
    ]'::jsonb,
    '[
        {"from": "simpatico aumenta FC e vasoconstricao", "to": "simpatico estimula renina", "relation": "integra_com"},
        {"from": "renina liberada por queda de pressao", "to": "cascata angiotensinogenio-angiotensina", "relation": "inicia"},
        {"from": "cascata angiotensinogenio-angiotensina", "to": "angiotensina II vasoconstricao", "relation": "produz"},
        {"from": "angiotensina II vasoconstricao", "to": "aldosterona retem sodio e agua", "relation": "estimula"},
        {"from": "simpatico estimula renina", "to": "cascata angiotensinogenio-angiotensina", "relation": "amplifica"}
    ]'::jsonb
),

-- QUESTAO 3: Clinica Medica - Raciocinio Diagnostico
(
    'DDL-CLIN-001',
    'Um paciente de 55 anos apresenta dor toracica retroesternal que piora ao esforco e melhora ao repouso. Quais sao os principais diagnosticos diferenciais e que exame voce solicitaria primeiro?',
    'Clinica Medica',
    'Dor Toracica',
    'Sindrome Coronariana',
    3,
    'Aplicacao/Analise',
    'A dor toracica tipica (retroesternal, aos esforcos, alivia com repouso) sugere angina estavel como principal hipotese. Os diagnosticos diferenciais incluem: sindrome coronariana aguda (se ha piora recente do padrao), espasmo esofagico (dor pode ser similar), doenca do refluxo gastroesofagico, e causas musculoesqueleticas. O primeiro exame a solicitar e o eletrocardiograma (ECG), que e rapido, acessivel e pode mostrar alteracoes isquemicas. Se normal e a suspeita persiste, seguir com teste ergometrico ou outros exames funcionais.',
    '[
        {"concept": "angina estavel como principal hipotese", "weight": 0.25, "synonyms": ["angina de esforco", "DAC estavel"]},
        {"concept": "sindrome coronariana aguda no diferencial", "weight": 0.15, "synonyms": ["SCA", "infarto"]},
        {"concept": "causas esofagicas", "weight": 0.10, "synonyms": ["DRGE", "espasmo esofagico"]},
        {"concept": "ECG como primeiro exame", "weight": 0.25, "synonyms": ["eletrocardiograma inicial", "ECG de repouso"]},
        {"concept": "teste ergometrico se ECG normal", "weight": 0.15, "synonyms": ["prova de esforco", "teste funcional"]},
        {"concept": "caracteristicas tipicas da angina", "weight": 0.10, "synonyms": ["dor tipica", "padrao anginoso"]}
    ]'::jsonb,
    '[
        {"from": "caracteristicas tipicas da angina", "to": "angina estavel como principal hipotese", "relation": "sugere"},
        {"from": "angina estavel como principal hipotese", "to": "sindrome coronariana aguda no diferencial", "relation": "diferencia_de"},
        {"from": "angina estavel como principal hipotese", "to": "ECG como primeiro exame", "relation": "requer"},
        {"from": "ECG como primeiro exame", "to": "teste ergometrico se ECG normal", "relation": "seguido_por"}
    ]'::jsonb
),

-- QUESTAO 4: Patologia - Conceitos Fundamentais
(
    'DDL-PAT-001',
    'Diferencie necrose de apoptose quanto aos mecanismos celulares e consequencias teciduais.',
    'Patologia',
    'Lesao Celular',
    'Morte Celular',
    2,
    'Compreensao',
    'A necrose e morte celular patologica causada por injuria irreversivel (isquemia, toxinas). Caracteriza-se por tumefacao celular, ruptura de membrana, liberacao de conteudo intracelular e inflamacao subsequente. Ja a apoptose e morte celular programada, fisiologica ou patologica, mediada por caspases. Caracteriza-se por condensacao celular, fragmentacao do nucleo (cariorrexe), formacao de corpos apoptoticos que sao fagocitados, sem inflamacao. A necrose e sempre patologica; a apoptose pode ser fisiologica (desenvolvimento, renovacao tecidual) ou patologica.',
    '[
        {"concept": "necrose por injuria irreversivel", "weight": 0.15, "synonyms": ["necrose por isquemia", "morte por dano"]},
        {"concept": "tumefacao e ruptura de membrana na necrose", "weight": 0.15, "synonyms": ["edema celular", "lise celular"]},
        {"concept": "inflamacao na necrose", "weight": 0.15, "synonyms": ["resposta inflamatoria", "necrose causa inflamacao"]},
        {"concept": "apoptose mediada por caspases", "weight": 0.15, "synonyms": ["via das caspases", "execucao apoptotica"]},
        {"concept": "condensacao e fragmentacao na apoptose", "weight": 0.15, "synonyms": ["cariorrexe", "corpos apoptoticos"]},
        {"concept": "apoptose sem inflamacao", "weight": 0.15, "synonyms": ["morte silenciosa", "fagocitose sem inflamacao"]},
        {"concept": "apoptose pode ser fisiologica", "weight": 0.10, "synonyms": ["apoptose no desenvolvimento", "renovacao tecidual"]}
    ]'::jsonb,
    '[
        {"from": "necrose por injuria irreversivel", "to": "tumefacao e ruptura de membrana na necrose", "relation": "causa"},
        {"from": "tumefacao e ruptura de membrana na necrose", "to": "inflamacao na necrose", "relation": "resulta_em"},
        {"from": "apoptose mediada por caspases", "to": "condensacao e fragmentacao na apoptose", "relation": "produz"},
        {"from": "condensacao e fragmentacao na apoptose", "to": "apoptose sem inflamacao", "relation": "resulta_em"}
    ]'::jsonb
),

-- QUESTAO 5: Neurologia - Caso Clinico Simples
(
    'DDL-NEURO-001',
    'Um paciente apresenta hemiparesia direita e afasia. Em qual hemisferio e territorio vascular voce localiza a lesao?',
    'Neurologia',
    'AVC',
    'Localizacao de Lesoes',
    2,
    'Aplicacao',
    'A hemiparesia direita indica lesao no hemisferio cerebral esquerdo (cruzamento das vias piramidais). A afasia (disturbio de linguagem) confirma lesao no hemisferio dominante, que na maioria dos destros e em grande parte dos canhotos e o esquerdo. O territorio vascular mais provavel e o da arteria cerebral media esquerda, que irriga as areas motoras para face e membro superior (regiao perisylviana) e as areas de linguagem (Broca e Wernicke).',
    '[
        {"concept": "lesao no hemisferio esquerdo", "weight": 0.30, "synonyms": ["hemisferio cerebral esquerdo", "lado esquerdo do cerebro"]},
        {"concept": "cruzamento das vias piramidais", "weight": 0.15, "synonyms": ["decussacao piramidal", "vias cruzam na medula"]},
        {"concept": "hemisferio dominante para linguagem", "weight": 0.20, "synonyms": ["dominancia para fala", "hemisferio da linguagem"]},
        {"concept": "arteria cerebral media", "weight": 0.25, "synonyms": ["ACM", "territorio da media"]},
        {"concept": "areas de Broca e Wernicke", "weight": 0.10, "synonyms": ["areas de linguagem", "cortex perisylviano"]}
    ]'::jsonb,
    '[
        {"from": "cruzamento das vias piramidais", "to": "lesao no hemisferio esquerdo", "relation": "explica"},
        {"from": "lesao no hemisferio esquerdo", "to": "hemisferio dominante para linguagem", "relation": "corresponde_a"},
        {"from": "hemisferio dominante para linguagem", "to": "arteria cerebral media", "relation": "irrigado_por"},
        {"from": "arteria cerebral media", "to": "areas de Broca e Wernicke", "relation": "supre"}
    ]'::jsonb
);
