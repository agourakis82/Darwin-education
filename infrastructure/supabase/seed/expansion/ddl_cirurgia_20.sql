-- ============================================================
-- DDL QUESTIONS: CIRURGIA (20 questions)
-- Area: cirurgia | Codes: CIR-DDL-001 to CIR-DDL-020
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

-- Trauma
(
    'CIR-DDL-001',
    'Paciente vítima de politrauma em acidente de trânsito chega ao pronto-socorro com hipotensão, taquicardia e dor torácica. Descreva a abordagem inicial segundo o protocolo ATLS.',
    'Cirurgia',
    'Trauma',
    'Politrauma',
    3,
    'Aplicacao',
    'Seguir ABCDE do ATLS: via aérea com proteção cervical, respiração com avaliação torácica, circulação com controle de hemorragias e reposição volêmica.',
    '[{"concept": "ABCDE do ATLS", "weight": 0.40, "synonyms": ["abordagem inicial trauma"]}, {"concept": "reposicao volemica", "weight": 0.30, "synonyms": ["cristaloides"]}, {"concept": "protecao cervical", "weight": 0.30, "synonyms": ["colar cervical"]}]'::jsonb,
    '[{"from": "hipotensao", "to": "reposicao volemica", "relation": "requer"}, {"from": "politrauma", "to": "ABCDE", "relation": "protocolo"}]'::jsonb
),
(
    'CIR-DDL-002',
    'Paciente com traumatismo cranioencefálico (TCE) grave após queda, apresentando Glasgow 7, pupilas anisocóricas e vômitos. Qual a conduta inicial e monitorização?',
    'Cirurgia',
    'Trauma',
    'TCE',
    4,
    'Analise',
    'Intubação orotraqueal para proteção de via aérea, elevação da cabeceira a 30 graus, monitorização da PIC e controle de hipertensão intracraniana.',
    '[{"concept": "Escala de Glasgow", "weight": 0.35, "synonyms": ["avaliacao neurologica"]}, {"concept": "intubacao", "weight": 0.35, "synonyms": ["protecao via aerea"]}, {"concept": "PIC", "weight": 0.30, "synonyms": ["pressao intracraniana"]}]'::jsonb,
    '[{"from": "TCE grave", "to": "intubacao", "relation": "requer"}, {"from": "pupilas anisocoricas", "to": "monitorar PIC", "relation": "indica"}]'::jsonb
),

-- Abdome Agudo
(
    'CIR-DDL-003',
    'Paciente jovem com dor abdominal em fossa ilíaca direita, febre baixa, náuseas e leucocitose. Suspeita de apendicite aguda. Descreva o diagnóstico e tratamento.',
    'Cirurgia',
    'Abdome Agudo',
    'Apendicite',
    2,
    'Compreensao',
    'Exame físico com sinal de Blumberg positivo, ultrassonografia ou TC de abdome; tratamento cirúrgico com apendicectomia laparoscópica.',
    '[{"concept": "Sinal de Blumberg", "weight": 0.30, "synonyms": ["dor a descompressao"]}, {"concept": "apendicectomia", "weight": 0.40, "synonyms": ["cirurgia apendice"]}, {"concept": "leucocitose", "weight": 0.30, "synonyms": ["infeccao"]}]'::jsonb,
    '[{"from": "apendicite", "to": "apendicectomia", "relation": "indica"}, {"from": "dor FID", "to": "apendicite", "relation": "sugere"}]'::jsonb
),
(
    'CIR-DDL-004',
    'Paciente idoso com obstrução intestinal mecânica, apresentando distensão abdominal, vômitos biliosos e ausência de eliminação de gases. Qual a abordagem diagnóstica e terapêutica?',
    'Cirurgia',
    'Abdome Agudo',
    'Obstrucao Intestinal',
    3,
    'Aplicacao',
    'Raio-X de abdome mostrando níveis hidroaéreos, descompressão com sonda nasogástrica e, se necessário, laparotomia exploradora.',
    '[{"concept": "niveis hidroaereos", "weight": 0.30, "synonyms": ["imagem obstrucao"]}, {"concept": "sonda nasogastrica", "weight": 0.35, "synonyms": ["descompressao"]}, {"concept": "laparotomia", "weight": 0.35, "synonyms": ["cirurgia abdominal"]}]'::jsonb,
    '[{"from": "obstrucao", "to": "sonda nasogastrica", "relation": "requer"}, {"from": "falha conservadora", "to": "laparotomia", "relation": "indica"}]'::jsonb
),

-- Cirurgia Vascular
(
    'CIR-DDL-005',
    'Paciente com trombose venosa profunda (TVP) em membro inferior após cirurgia ortopédica, com dor, edema e eritema. Descreva o tratamento inicial.',
    'Cirurgia',
    'Cirurgia Vascular',
    'Trombose Venosa',
    2,
    'Compreensao',
    'Anticoagulação com heparina de baixo peso molecular, elevação do membro e uso de meias de compressão; investigação de causas subjacentes.',
    '[{"concept": "anticoagulacao", "weight": 0.40, "synonyms": ["heparina"]}, {"concept": "TVP", "weight": 0.30, "synonyms": ["trombose venosa profunda"]}, {"concept": "meias de compressao", "weight": 0.30, "synonyms": ["compressao elastica"]}]'::jsonb,
    '[{"from": "TVP", "to": "heparina", "relation": "trata"}, {"from": "cirurgia", "to": "TVP", "relation": "fator de risco"}]'::jsonb
),
(
    'CIR-DDL-006',
    'Paciente hipertenso com dor abdominal pulsátil intensa e choque hipovolêmico, suspeita de ruptura de aneurisma de aorta abdominal (AAA). Qual a conduta urgente?',
    'Cirurgia',
    'Cirurgia Vascular',
    'Aneurisma',
    5,
    'Avaliacao',
    'Ressuscitação volêmica rápida, controle pressórico e cirurgia de emergência com reparo endovascular ou aberto.',
    '[{"concept": "ruptura de AAA", "weight": 0.45, "synonyms": ["aneurisma roto"]}, {"concept": "reparo endovascular", "weight": 0.30, "synonyms": ["EVAR"]}, {"concept": "ressuscitacao volemica", "weight": 0.25, "synonyms": ["reposicao"]}]'::jsonb,
    '[{"from": "choque", "to": "cirurgia emergencial", "relation": "requer"}, {"from": "AAA roto", "to": "reparo", "relation": "indica"}]'::jsonb
),

-- Urologia
(
    'CIR-DDL-007',
    'Paciente com litíase renal obstrutiva causando cólica renal intensa e hematúria. Descreva as opções de tratamento conservador e intervencionista.',
    'Cirurgia',
    'Urologia',
    'Litiase Renal',
    3,
    'Aplicacao',
    'Analgésicos, hidratação e alfa-bloqueadores para expulsão; litotripsia extracorpórea ou ureteroscopia se obstrução persistente.',
    '[{"concept": "litotripsia", "weight": 0.30, "synonyms": ["quebra de calculos"]}, {"concept": "colica renal", "weight": 0.35, "synonyms": ["dor lombar"]}, {"concept": "alfa-bloqueadores", "weight": 0.35, "synonyms": ["tansulosina"]}]'::jsonb,
    '[{"from": "colica renal", "to": "hidratacao", "relation": "alivia"}, {"from": "obstrucao persistente", "to": "litotripsia", "relation": "indica"}]'::jsonb
),
(
    'CIR-DDL-008',
    'Idoso com hiperplasia prostática benigna (HPB) apresentando jato urinário fraco, noctúria e retenção urinária aguda. Qual o manejo?',
    'Cirurgia',
    'Urologia',
    'Hiperplasia Prostatica',
    4,
    'Analise',
    'Alfa-bloqueadores ou inibidores de 5-alfa-redutase; cateterismo para retenção e, se refratário, ressecção transuretral da próstata (RTUP).',
    '[{"concept": "RTUP", "weight": 0.35, "synonyms": ["resseccao prostatica"]}, {"concept": "alfa-bloqueadores", "weight": 0.35, "synonyms": ["tansulosina"]}, {"concept": "retencao urinaria", "weight": 0.30, "synonyms": ["cateterismo"]}]'::jsonb,
    '[{"from": "retencao urinaria", "to": "cateterismo", "relation": "trata"}, {"from": "HPB refrataria", "to": "RTUP", "relation": "indica"}]'::jsonb
),

-- Ortopedia
(
    'CIR-DDL-009',
    'Paciente com fratura exposta de fêmur após acidente de moto, com sangramento ativo e risco de infecção. Descreva a conduta inicial.',
    'Cirurgia',
    'Ortopedia',
    'Fraturas',
    3,
    'Aplicacao',
    'Imobilização, irrigação da ferida, antibioticoterapia profilática e fixação cirúrgica interna após estabilização.',
    '[{"concept": "fratura exposta", "weight": 0.40, "synonyms": ["fratura aberta"]}, {"concept": "antibioticoterapia", "weight": 0.30, "synonyms": ["profilaxia"]}, {"concept": "fixacao interna", "weight": 0.30, "synonyms": ["osteossintese"]}]'::jsonb,
    '[{"from": "fratura exposta", "to": "antibioticos", "relation": "previne infeccao"}, {"from": "sangramento", "to": "estabilizacao", "relation": "requer"}]'::jsonb
),
(
    'CIR-DDL-010',
    'Paciente com luxação anterior de ombro após trauma esportivo, com deformidade visível e dor intensa. Como realizar a redução e pós-redução?',
    'Cirurgia',
    'Ortopedia',
    'Luxacoes',
    2,
    'Compreensao',
    'Redução fechada com manobra de Kocher ou Tração, confirmação radiológica e imobilização com tipoia por 3 semanas.',
    '[{"concept": "reducao de luxacao", "weight": 0.35, "synonyms": ["reposicionamento"]}, {"concept": "manobra de Kocher", "weight": 0.35, "synonyms": ["tecnica reducao"]}, {"concept": "imobilizacao", "weight": 0.30, "synonyms": ["tipoia"]}]'::jsonb,
    '[{"from": "luxacao ombro", "to": "raio-X", "relation": "confirma"}, {"from": "reducao", "to": "imobilizacao", "relation": "segue"}]'::jsonb
),

-- Trauma (11-12)
(
    'CIR-DDL-011',
    'Paciente de 35 anos, vítima de acidente automobilístico em alta velocidade, apresenta dispneia progressiva, dor torácica intensa e hipotensão. Ao exame, observa-se diminuição do murmúrio vesicular à direita e instabilidade na parede torácica. Descreva a abordagem diagnóstica e terapêutica.',
    'Cirurgia',
    'Trauma',
    'Trauma Toracico',
    3,
    'Aplicacao',
    'Suspeitar de pneumotórax hipertensivo ou contusão pulmonar associada a fratura de costela. Realizar avaliação ABCDE do ATLS, com estabilização da via aérea e descompressão torácica imediata se necessário. Solicitar radiografia de tórax e TC para confirmação.',
    '[{"concept": "pneumotorax hipertensivo", "weight": 0.35, "synonyms": ["tensao pneumotorax"]}, {"concept": "ABCDE do ATLS", "weight": 0.30, "synonyms": ["abordagem trauma"]}, {"concept": "descompressao toracica", "weight": 0.25, "synonyms": ["toracostomia"]}, {"concept": "TC torax", "weight": 0.10, "synonyms": ["tomografia"]}]'::jsonb,
    '[{"from": "dispneia", "to": "descompressao toracica", "relation": "requer"}, {"from": "instabilidade toracica", "to": "estabilizacao", "relation": "indica"}]'::jsonb
),
(
    'CIR-DDL-012',
    'Homem de 28 anos sofre trauma abdominal fechado após queda de altura, com dor em quadrante superior esquerdo, hipotensão e taquicardia. USG FAST revela líquido livre peri-esplênico. Analise as opções de manejo.',
    'Cirurgia',
    'Trauma',
    'Lesao de Orgao Solido',
    4,
    'Analise',
    'Classificar a lesão esplênica por escala AAST (revisão 2018) baseada em imagem. Optar por manejo não operatório (NOM) em paciente hemodinamicamente estável — inclusive graus IV-V com estabilidade hemodinâmica e sem lesão de víscera oca associada (tendência atual). Indicar esplenectomia ou angioembolização em instabilidade ou falha conservadora.',
    '[{"concept": "lesao esplenica", "weight": 0.40, "synonyms": ["trauma baco"]}, {"concept": "escala AAST", "weight": 0.25, "synonyms": ["classificacao trauma"]}, {"concept": "manejo conservador", "weight": 0.20, "synonyms": ["nao operatorio"]}, {"concept": "USG FAST", "weight": 0.15, "synonyms": ["ecografia trauma"]}]'::jsonb,
    '[{"from": "hipotensao", "to": "esplenectomia", "relation": "indica"}, {"from": "liquido peri-esplenico", "to": "monitoramento", "relation": "permite"}]'::jsonb
),

-- Abdome Agudo (13-14)
(
    'CIR-DDL-013',
    'Mulher de 52 anos apresenta dor em hipocôndrio direito há 24 horas, associada a náuseas, vômitos e febre baixa. Exame físico revela sinal de Murphy positivo. Explique o diagnóstico e conduta.',
    'Cirurgia',
    'Abdome Agudo',
    'Colecistite',
    2,
    'Compreensao',
    'Diagnosticar colecistite aguda calculosa, confirmada por ultrassonografia mostrando espessamento da vesícula e cálculos. Iniciar antibioticoterapia IV e suporte hídrico, reservando colecistectomia laparoscópica para resolução.',
    '[{"concept": "colecistite aguda", "weight": 0.45, "synonyms": ["inflamacao vesicula"]}, {"concept": "sinal de Murphy", "weight": 0.25, "synonyms": ["dor palpacao"]}, {"concept": "USG abdominal", "weight": 0.20, "synonyms": ["ultrassom"]}, {"concept": "colecistectomia", "weight": 0.10, "synonyms": ["cirurgia vesicula"]}]'::jsonb,
    '[{"from": "febre", "to": "antibioticos", "relation": "requer"}, {"from": "sinal Murphy", "to": "colecistectomia", "relation": "indica"}]'::jsonb
),
(
    'CIR-DDL-014',
    'Paciente de 65 anos, com história de constipação, refere dor abdominal em fossa ilíaca esquerda há 48 horas, febre e diarreia. Exames mostram leucocitose e TC com espessamento sigmoide. Descreva o manejo.',
    'Cirurgia',
    'Abdome Agudo',
    'Diverticulite',
    3,
    'Aplicacao',
    'Classificar como diverticulite aguda pela escala de Hinchey, com antibioticoterapia oral ou IV dependendo da gravidade. Em casos complicados como abscesso, drenar percutaneamente; reservar cirurgia para perfuração ou falha médica.',
    '[{"concept": "diverticulite aguda", "weight": 0.40, "synonyms": ["inflamacao diverticulos"]}, {"concept": "escala Hinchey", "weight": 0.25, "synonyms": ["classificacao"]}, {"concept": "antibioticoterapia", "weight": 0.20, "synonyms": ["tratamento conservador"]}, {"concept": "TC abdome", "weight": 0.15, "synonyms": ["tomografia"]}]'::jsonb,
    '[{"from": "leucocitose", "to": "antibioticos", "relation": "requer"}, {"from": "espessamento sigmoide", "to": "drenagem", "relation": "indica se abscesso"}]'::jsonb
),

-- Cirurgia Vascular (15-16)
(
    'CIR-DDL-015',
    'Homem de 72 anos com diabetes e tabagismo relata claudicação intermitente nos membros inferiores ao caminhar 50 metros, com pulsos pediosos ausentes. Analise as opções de revascularização.',
    'Cirurgia',
    'Cirurgia Vascular',
    'Doenca Arterial Periferica',
    4,
    'Analise',
    'Diagnosticar doença arterial oclusiva periférica estágio IIb pela classificação de Fontaine, com ABI <0.9. Iniciar terapia antiplaquetária e reabilitação, progredindo para angioplastia ou bypass se sintomas limitantes.',
    '[{"concept": "doenca arterial periferica", "weight": 0.35, "synonyms": ["DAP"]}, {"concept": "indice tornozelo-braquial", "weight": 0.30, "synonyms": ["ABI"]}, {"concept": "angioplastia", "weight": 0.20, "synonyms": ["revascularizacao"]}, {"concept": "bypass vascular", "weight": 0.15, "synonyms": ["enxerto arterial"]}]'::jsonb,
    '[{"from": "claudicacao", "to": "angioplastia", "relation": "indica"}, {"from": "pulsos ausentes", "to": "revascularizacao", "relation": "requer"}]'::jsonb
),
(
    'CIR-DDL-016',
    'Mulher de 48 anos com varizes safenas sintomáticas, edema e dor crônica em pernas após longos períodos em pé. Não há úlceras. Descreva as indicações para tratamento intervencionista.',
    'Cirurgia',
    'Cirurgia Vascular',
    'Varizes',
    2,
    'Compreensao',
    'Indicar tratamento para insuficiência venosa crônica CEAP C3, com escleroterapia ou ablação endovenosa para alívio sintomático. Reservar safenectomia para falha de métodos minimamente invasivos.',
    '[{"concept": "varizes safenas", "weight": 0.40, "synonyms": ["veias varicosas"]}, {"concept": "classificacao CEAP", "weight": 0.25, "synonyms": ["estadiamento venoso"]}, {"concept": "ablacao endovenosa", "weight": 0.20, "synonyms": ["laser venoso"]}, {"concept": "meias compressivas", "weight": 0.15, "synonyms": ["compressao elastica"]}]'::jsonb,
    '[{"from": "edema", "to": "ablacao", "relation": "indica"}, {"from": "dor cronica", "to": "escleroterapia", "relation": "alivia"}]'::jsonb
),

-- Urologia (17-18)
(
    'CIR-DDL-017',
    'Adolescente de 17 anos acorda com dor escrotal intensa e aguda à direita, náuseas e vômitos. Exame revela testículo elevado, horizontal e doloroso ao toque. Explique a urgência do manejo.',
    'Cirurgia',
    'Urologia',
    'Torcao Testicular',
    3,
    'Aplicacao',
    'Suspeitar de torção do cordão espermático, confirmada por Doppler escrotal mostrando ausência de fluxo. Realizar detorção manual ou cirúrgica exploratória imediata para salvar o testículo, idealmente em 6 horas.',
    '[{"concept": "torcao testicular", "weight": 0.45, "synonyms": ["torcao cordao"]}, {"concept": "Doppler escrotal", "weight": 0.25, "synonyms": ["USG com Doppler"]}, {"concept": "detorcao cirurgica", "weight": 0.20, "synonyms": ["orquipexia"]}, {"concept": "janela de 6 horas", "weight": 0.10, "synonyms": ["tempo salvamento"]}]'::jsonb,
    '[{"from": "dor aguda", "to": "exploracao cirurgica", "relation": "requer"}, {"from": "ausencia fluxo", "to": "detorcao", "relation": "indica"}]'::jsonb
),
(
    'CIR-DDL-018',
    'Homem de 68 anos com PSA de 12 ng/mL e nódulo duro em toque retal. Biópsia confirma adenocarcinoma prostático Gleason 7. Avalie opções de tratamento baseado em estadiamento.',
    'Cirurgia',
    'Urologia',
    'Cancer de Prostata',
    5,
    'Avaliacao',
    'Estadiar com RMN pélvica e cintilografia óssea para metástases. Em doença localizada, optar por prostatectomia radical ou radioterapia; em avançada, terapia hormonal ou quimioterapia.',
    '[{"concept": "cancer de prostata", "weight": 0.35, "synonyms": ["adenocarcinoma prostatico"]}, {"concept": "escala Gleason", "weight": 0.25, "synonyms": ["grau histologico"]}, {"concept": "prostatectomia radical", "weight": 0.20, "synonyms": ["cirurgia prostatica"]}, {"concept": "PSA elevado", "weight": 0.10, "synonyms": ["antigeno prostatico"]}, {"concept": "estadiamento TNM", "weight": 0.10, "synonyms": ["classificacao cancer"]}]'::jsonb,
    '[{"from": "Gleason 7", "to": "prostatectomia", "relation": "indica se localizado"}, {"from": "nodulo retal", "to": "biopsia", "relation": "requer"}]'::jsonb
),

-- Ortopedia (19-20)
(
    'CIR-DDL-019',
    'Paciente de 40 anos pós-fratura de tíbia por trauma esportivo, com dor desproporcional, parestesia e tensão em compartimento anterior da perna 4 horas após imobilização. Analise a suspeita diagnóstica e conduta.',
    'Cirurgia',
    'Ortopedia',
    'Sindrome Compartimental',
    4,
    'Analise',
    'Diagnosticar síndrome compartimental aguda quando ΔP (pressão diastólica − pressão intracompartimental) <30 mmHg (critério de Stryker/McQueen). O limiar absoluto >30 mmHg isolado é menos confiável. Realizar fasciotomia descompressiva emergente para prevenir necrose muscular e rabdomiólise.',
    '[{"concept": "sindrome compartimental", "weight": 0.40, "synonyms": ["compartimento sindrome"]}, {"concept": "fasciotomia", "weight": 0.30, "synonyms": ["descompressao muscular"]}, {"concept": "pressao intracompartimental", "weight": 0.20, "synonyms": ["PIC"]}, {"concept": "sinais 6P", "weight": 0.10, "synonyms": ["dor, parestesia, palidez"]}]'::jsonb,
    '[{"from": "dor desproporcional", "to": "fasciotomia", "relation": "requer"}, {"from": "parestesia", "to": "medir PIC", "relation": "indica"}]'::jsonb
),
(
    'CIR-DDL-020',
    'Mulher de 62 anos com artrose avançada de joelho, dor crônica diária, limitação de mobilidade e deformidade em varo. Analgésicos e fisioterapia falharam. Descreva opções cirúrgicas.',
    'Cirurgia',
    'Ortopedia',
    'Artrose',
    3,
    'Aplicacao',
    'Indicar artroplastia total de joelho para gonartrose estágio IV Kellgren-Lawrence, aliviando dor e restaurando função. Avaliar alinhamento e preparar reabilitação pós-operatória.',
    '[{"concept": "artrose de joelho", "weight": 0.35, "synonyms": ["gonartrose"]}, {"concept": "artroplastia total", "weight": 0.30, "synonyms": ["protese joelho"]}, {"concept": "escala Kellgren", "weight": 0.20, "synonyms": ["classificacao radiologica"]}, {"concept": "reabilitacao pos-op", "weight": 0.15, "synonyms": ["fisioterapia"]}]'::jsonb,
    '[{"from": "dor cronica", "to": "artroplastia", "relation": "indica"}, {"from": "limitacao mobilidade", "to": "osteotomia", "relation": "alternativa"}]'::jsonb
);
