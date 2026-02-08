-- ============================================================
-- DDL QUESTIONS: SAUDE COLETIVA (20 questions)
-- Area: saude_coletiva | Codes: SC-DDL-001 to SC-DDL-020
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

-- Epidemiologia
(
    'SC-DDL-001',
    'Em uma populacao de 10.000 habitantes, foram notificados 150 novos casos de tuberculose ao longo de um ano. Descreva como calcular a incidencia dessa doenca.',
    'Saude Coletiva',
    'Epidemiologia',
    'Medidas de Frequencia',
    2,
    'Compreensao',
    'Incidencia = (novos casos / populacao em risco) x 1.000 = 15 por 1.000 habitantes.',
    '[{"concept": "incidencia", "weight": 0.4, "synonyms": ["taxa de incidencia"]}, {"concept": "populacao em risco", "weight": 0.3, "synonyms": ["denominador"]}, {"concept": "calculo epidemiologico", "weight": 0.3, "synonyms": ["medida de frequencia"]}]'::jsonb,
    '[{"from": "notificacao de casos", "to": "calculo de incidencia", "relation": "permite"}, {"from": "incidencia", "to": "vigilancia", "relation": "informa"}]'::jsonb
),
(
    'SC-DDL-002',
    'Em um hospital, observou-se um aumento de infeccoes hospitalares. Descreva o tipo de estudo epidemiologico mais adequado para investigar as causas.',
    'Saude Coletiva',
    'Epidemiologia',
    'Estudos Epidemiologicos',
    3,
    'Aplicacao',
    'Estudo de caso-controle ou coorte, dependendo dos recursos; analisar fatores de risco como procedimentos e higiene.',
    '[{"concept": "estudo de caso-controle", "weight": 0.35, "synonyms": ["caso-controle"]}, {"concept": "estudo de coorte", "weight": 0.35, "synonyms": ["coorte"]}, {"concept": "fatores de risco", "weight": 0.30, "synonyms": ["variaveis de exposicao"]}]'::jsonb,
    '[{"from": "aumento de infeccoes", "to": "investigacao epidemiologica", "relation": "desencadeia"}, {"from": "estudo", "to": "fatores de risco", "relation": "identifica"}]'::jsonb
),

-- Vigilancia em Saude
(
    'SC-DDL-003',
    'Durante uma epidemia de gripe em uma escola, foram identificados 50 casos. Descreva as medidas iniciais de vigilancia em saude para controle.',
    'Saude Coletiva',
    'Vigilancia em Saude',
    'Notificacao Compulsoria',
    3,
    'Aplicacao',
    'Notificacao compulsoria a autoridades, investigacao de casos, isolamento de sintomaticos e rastreamento de contatos.',
    '[{"concept": "notificacao compulsoria", "weight": 0.3, "synonyms": ["notificacao obrigatoria"]}, {"concept": "investigacao de casos", "weight": 0.3, "synonyms": ["investigacao epidemiologica"]}, {"concept": "isolamento", "weight": 0.2, "synonyms": ["quarentena"]}, {"concept": "rastreamento de contatos", "weight": 0.2, "synonyms": ["busca ativa"]}]'::jsonb,
    '[{"from": "epidemia em escola", "to": "medidas de controle", "relation": "exige"}, {"from": "notificacao", "to": "resposta", "relation": "inicia"}]'::jsonb
),
(
    'SC-DDL-004',
    'Em um municipio, ha suspeita de surto de dengue. Explique o papel da vigilancia em saude na deteccao precoce.',
    'Saude Coletiva',
    'Vigilancia em Saude',
    'Surtos',
    4,
    'Analise',
    'Monitoramento de indicadores, busca ativa de casos, analise de tendencias e acao rapida para interromper transmissao.',
    '[{"concept": "busca ativa", "weight": 0.4, "synonyms": ["pesquisa ativa"]}, {"concept": "monitoramento", "weight": 0.3, "synonyms": ["vigilancia"]}, {"concept": "analise de tendencias", "weight": 0.30, "synonyms": ["curva epidemica"]}]'::jsonb,
    '[{"from": "suspeita de surto", "to": "deteccao precoce", "relation": "depende"}, {"from": "busca ativa", "to": "controle", "relation": "permite"}]'::jsonb
),

-- SUS e Politicas de Saude
(
    'SC-DDL-005',
    'Analise os principios do SUS em relacao ao acesso universal em um contexto de escassez de recursos.',
    'Saude Coletiva',
    'SUS e Politicas de Saude',
    'Principios do SUS',
    4,
    'Analise',
    'Universalidade, equidade e integralidade; priorizar grupos vulneraveis e otimizar alocacao de recursos.',
    '[{"concept": "universalidade", "weight": 0.3, "synonyms": ["acesso universal"]}, {"concept": "equidade", "weight": 0.3, "synonyms": ["equidade em saude"]}, {"concept": "integralidade", "weight": 0.2, "synonyms": ["atencao integral"]}, {"concept": "alocacao de recursos", "weight": 0.2, "synonyms": ["gestao"]}]'::jsonb,
    '[{"from": "escassez de recursos", "to": "priorizacao no SUS", "relation": "influencia"}, {"from": "equidade", "to": "vulneraveis", "relation": "prioriza"}]'::jsonb
),
(
    'SC-DDL-006',
    'Descreva o impacto do financiamento tripartite no funcionamento do SUS em um estado com desigualdades regionais.',
    'Saude Coletiva',
    'SUS e Politicas de Saude',
    'Financiamento',
    5,
    'Avaliacao',
    'Uniao, estados e municipios contribuem; desigualdades podem ser mitigadas por transferencias federais, mas ha desafios na arrecadacao local.',
    '[{"concept": "financiamento tripartite", "weight": 0.4, "synonyms": ["financiamento SUS"]}, {"concept": "desigualdades regionais", "weight": 0.3, "synonyms": ["desigualdade"]}, {"concept": "transferencias federais", "weight": 0.30, "synonyms": ["repasses"]}]'::jsonb,
    '[{"from": "financiamento", "to": "funcionamento SUS", "relation": "sustenta"}, {"from": "desigualdade", "to": "transferencias", "relation": "exige"}]'::jsonb
),

-- Atencao Primaria
(
    'SC-DDL-007',
    'Em uma unidade basica de saude, implementou-se a Estrategia Saude da Familia. Descreva seus atributos principais.',
    'Saude Coletiva',
    'Atencao Primaria',
    'Estrategia Saude da Familia',
    2,
    'Compreensao',
    'Acessibilidade, longitudinalidade, integralidade, coordenacao de cuidados e orientacao familiar/comunitaria.',
    '[{"concept": "acessibilidade", "weight": 0.25, "synonyms": ["acesso"]}, {"concept": "integralidade", "weight": 0.25, "synonyms": ["atencao integral"]}, {"concept": "longitudinalidade", "weight": 0.25, "synonyms": ["continuidade"]}, {"concept": "coordenacao", "weight": 0.25, "synonyms": ["articulacao"]}]'::jsonb,
    '[{"from": "ESF", "to": "atributos APS", "relation": "incorpora"}, {"from": "atributos", "to": "qualidade", "relation": "garante"}]'::jsonb
),
(
    'SC-DDL-008',
    'Avalie a importancia dos atributos da Atencao Primaria a Saude na prevencao de doencas cronicas.',
    'Saude Coletiva',
    'Atencao Primaria',
    'Atributos da APS',
    4,
    'Avaliacao',
    'Atributos como primeiro contato e coordenacao reduzem hospitalizacoes; promovem promocao de saude e rastreio precoce.',
    '[{"concept": "primeiro contato", "weight": 0.3, "synonyms": ["first contact"]}, {"concept": "coordenacao de cuidados", "weight": 0.3, "synonyms": ["coordenacao"]}, {"concept": "prevencao de cronicas", "weight": 0.2, "synonyms": ["rastreio"]}, {"concept": "reducao hospitalizacoes", "weight": 0.2, "synonyms": ["desospitalizacao"]}]'::jsonb,
    '[{"from": "atributos APS", "to": "prevencao cronicas", "relation": "facilita"}, {"from": "coordenacao", "to": "hospitalizacoes", "relation": "reduz"}]'::jsonb
),

-- Saude do Trabalhador
(
    'SC-DDL-009',
    'Em uma fabrica, trabalhadores relatam dores musculares repetitivas. Descreva as doencas ocupacionais possiveis e medidas preventivas.',
    'Saude Coletiva',
    'Saude do Trabalhador',
    'Doencas Ocupacionais',
    3,
    'Aplicacao',
    'LER/DORT; ergonomia, pausas, treinamentos e avaliacao ergometrica.',
    '[{"concept": "LER/DORT", "weight": 0.4, "synonyms": ["doencas musculoesqueleticas"]}, {"concept": "ergonomia", "weight": 0.3, "synonyms": ["ergonomia laboral"]}, {"concept": "pausas", "weight": 0.30, "synonyms": ["descanso periodico"]}]'::jsonb,
    '[{"from": "dores musculares", "to": "doencas ocupacionais", "relation": "indica"}, {"from": "ergonomia", "to": "prevencao", "relation": "garante"}]'::jsonb
),
(
    'SC-DDL-010',
    'Explique o conteudo obrigatorio do PCMSO em uma empresa de construcao civil.',
    'Saude Coletiva',
    'Saude do Trabalhador',
    'PCMSO',
    5,
    'Avaliacao',
    'Exames admissionais, periodicos, mudanca de funcao e retorno ao trabalho; avaliacao de riscos ocupacionais como poeira e ruido.',
    '[{"concept": "exames periodicos", "weight": 0.3, "synonyms": ["exames medicos"]}, {"concept": "avaliacao de riscos", "weight": 0.3, "synonyms": ["riscos ocupacionais"]}, {"concept": "PCMSO", "weight": 0.2, "synonyms": ["programa de saude ocupacional"]}, {"concept": "exames admissionais", "weight": 0.2, "synonyms": ["exame admissional"]}]'::jsonb,
    '[{"from": "PCMSO", "to": "prevencao ocupacional", "relation": "garante"}, {"from": "riscos", "to": "exames", "relation": "determina"}]'::jsonb
),

-- Epidemiologia (11-12)
(
    'SC-DDL-011',
    'Em um estudo epidemiologico sobre uma doenca infecciosa, um teste diagnostico apresenta resultados variados em uma amostra de 500 pacientes. Descreva o conceito de sensibilidade e especificidade.',
    'Saude Coletiva',
    'Epidemiologia',
    'Sensibilidade e Especificidade',
    2,
    'Compreensao',
    'Sensibilidade: capacidade de identificar corretamente doentes. Especificidade: capacidade de identificar corretamente sadios. Alta sensibilidade preferivel em triagem para minimizar falsos negativos.',
    '[{"concept": "sensibilidade", "weight": 0.3, "synonyms": ["sensibilidade do teste"]}, {"concept": "especificidade", "weight": 0.3, "synonyms": ["especificidade do teste"]}, {"concept": "teste diagnostico", "weight": 0.2, "synonyms": ["exame"]}, {"concept": "falsos negativos", "weight": 0.2, "synonyms": ["falso negativo"]}]'::jsonb,
    '[{"from": "sensibilidade", "to": "rastreamento", "relation": "facilita"}, {"from": "especificidade", "to": "confirmacao", "relation": "apoia"}]'::jsonb
),
(
    'SC-DDL-012',
    'Durante a analise de um estudo de coorte sobre fatores de risco para hipertensao, o pesquisador nota discrepancias nos dados. Discuta possiveis tipos de vies que podem ter influenciado os resultados.',
    'Saude Coletiva',
    'Epidemiologia',
    'Vies em Estudos',
    3,
    'Aplicacao',
    'Vies de selecao quando participantes nao representam a populacao. Vies de informacao por erros na coleta. Mitigar com randomizacao e padronizacao de instrumentos.',
    '[{"concept": "vies de selecao", "weight": 0.25, "synonyms": ["bias de selecao"]}, {"concept": "vies de informacao", "weight": 0.25, "synonyms": ["bias de informacao"]}, {"concept": "estudo de coorte", "weight": 0.2, "synonyms": ["coorte"]}, {"concept": "randomizacao", "weight": 0.15, "synonyms": ["aleatorizacao"]}, {"concept": "cegamento", "weight": 0.15, "synonyms": ["blinding"]}]'::jsonb,
    '[{"from": "vies", "to": "validade", "relation": "compromete"}, {"from": "mitigacao", "to": "resultados", "relation": "melhora"}]'::jsonb
),

-- Vigilancia em Saude (13-14)
(
    'SC-DDL-013',
    'Em uma unidade de vigilancia sanitaria municipal, foi identificada uma falha no monitoramento de alimentos em feiras livres. Analise as implicacoes e proponha acoes corretivas.',
    'Saude Coletiva',
    'Vigilancia em Saude',
    'Vigilancia Sanitaria',
    4,
    'Analise',
    'Falha pode resultar em surtos de doencas transmitidas por alimentos. Acoes corretivas: inspecoes regulares, treinamento de fiscais e integracao com sistemas de notificacao.',
    '[{"concept": "vigilancia sanitaria", "weight": 0.3, "synonyms": ["inspecao sanitaria"]}, {"concept": "surtos epidemicos", "weight": 0.2, "synonyms": ["epidemias"]}, {"concept": "notificacao obrigatoria", "weight": 0.2, "synonyms": ["notificacao"]}, {"concept": "inspecoes regulares", "weight": 0.3, "synonyms": ["fiscalizacao"]}]'::jsonb,
    '[{"from": "monitoramento", "to": "prevencao", "relation": "permite"}, {"from": "falha", "to": "saude publica", "relation": "ameaca"}]'::jsonb
),
(
    'SC-DDL-014',
    'Uma nova doenca emergente surge em uma regiao remota do Brasil, com sintomas respiratorios. Explique os passos iniciais para vigilancia em saude.',
    'Saude Coletiva',
    'Vigilancia em Saude',
    'Doencas Emergentes',
    2,
    'Compreensao',
    'Notificacao imediata, coleta de amostras para diagnostico laboratorial e isolamento de casos suspeitos. Integracao com redes nacionais para resposta rapida.',
    '[{"concept": "doencas emergentes", "weight": 0.25, "synonyms": ["doencas novas"]}, {"concept": "notificacao", "weight": 0.25, "synonyms": ["alerta"]}, {"concept": "isolamento", "weight": 0.2, "synonyms": ["quarentena"]}, {"concept": "diagnostico laboratorial", "weight": 0.15, "synonyms": ["teste"]}, {"concept": "redes nacionais", "weight": 0.15, "synonyms": ["sistema integrado"]}]'::jsonb,
    '[{"from": "vigilancia", "to": "controle", "relation": "inicia"}, {"from": "desafios logisticos", "to": "resposta", "relation": "dificulta"}]'::jsonb
),

-- SUS e Politicas de Saude (15-16)
(
    'SC-DDL-015',
    'No contexto do SUS, a Politica Nacional de Atencao Basica (PNAB) visa fortalecer a rede de atencao primaria. Descreva como a PNAB impacta a organizacao dos servicos em um municipio pequeno.',
    'Saude Coletiva',
    'SUS e Politicas de Saude',
    'PNAB',
    3,
    'Aplicacao',
    'PNAB prioriza a Atencao Basica como porta de entrada do SUS, promovendo equidade. Em municipios pequenos, incentiva formacao de equipes multiprofissionais nas UBS.',
    '[{"concept": "PNAB", "weight": 0.3, "synonyms": ["Politica Nacional de Atencao Basica"]}, {"concept": "atencao basica", "weight": 0.25, "synonyms": ["atencao primaria"]}, {"concept": "equipes multiprofissionais", "weight": 0.2, "synonyms": ["equipe de saude"]}, {"concept": "UBS", "weight": 0.15, "synonyms": ["Unidade Basica de Saude"]}, {"concept": "equidade", "weight": 0.1, "synonyms": ["acesso igual"]}]'::jsonb,
    '[{"from": "PNAB", "to": "SUS", "relation": "fortalece"}, {"from": "aplicacao", "to": "servicos", "relation": "organiza"}]'::jsonb
),
(
    'SC-DDL-016',
    'Em uma conferencia de saude municipal, representantes questionam a efetividade do controle social no SUS. Avalie os mecanismos existentes e proponha melhorias.',
    'Saude Coletiva',
    'SUS e Politicas de Saude',
    'Controle Social',
    5,
    'Avaliacao',
    'Controle social exercido por conselhos e conferencias de saude. Participacao limitada por falta de informacao. Melhorias: campanhas de capacitacao e uso de tecnologias digitais.',
    '[{"concept": "controle social", "weight": 0.3, "synonyms": ["participacao social"]}, {"concept": "conselhos de saude", "weight": 0.2, "synonyms": ["conselho municipal"]}, {"concept": "conferencias", "weight": 0.2, "synonyms": ["conferencia de saude"]}, {"concept": "participacao comunitaria", "weight": 0.15, "synonyms": ["envolvimento"]}, {"concept": "capacitacao", "weight": 0.15, "synonyms": ["treinamento"]}]'::jsonb,
    '[{"from": "controle social", "to": "fiscalizacao", "relation": "exerce"}, {"from": "melhorias", "to": "participacao", "relation": "aumenta"}]'::jsonb
),

-- Atencao Primaria (17-18)
(
    'SC-DDL-017',
    'O Nucleo de Apoio a Saude da Familia (NASF) e implementado em uma UBS de periferia urbana. Analise seu papel na melhoria da atencao primaria.',
    'Saude Coletiva',
    'Atencao Primaria',
    'NASF',
    4,
    'Analise',
    'NASF proporciona suporte multiprofissional, ampliando resolutividade. Foca em educacao em saude e manejo de casos complexos, reduzindo encaminhamentos desnecessarios. Barreiras: escassez de profissionais.',
    '[{"concept": "NASF", "weight": 0.3, "synonyms": ["Nucleo de Apoio"]}, {"concept": "saude da familia", "weight": 0.25, "synonyms": ["ESF"]}, {"concept": "resolutividade", "weight": 0.2, "synonyms": ["resolucao de casos"]}, {"concept": "integracao", "weight": 0.15, "synonyms": ["articulacao"]}, {"concept": "barreiras", "weight": 0.1, "synonyms": ["obstaculos"]}]'::jsonb,
    '[{"from": "NASF", "to": "atencao primaria", "relation": "apoia"}, {"from": "barreiras", "to": "efetividade", "relation": "reduz"}]'::jsonb
),
(
    'SC-DDL-018',
    'Durante uma visita domiciliar em comunidade rural, a equipe identifica um idoso com mobilidade reduzida e historico de quedas. Descreva a importancia da visita domiciliar na APS.',
    'Saude Coletiva',
    'Atencao Primaria',
    'Visita Domiciliar',
    2,
    'Compreensao',
    'Visita domiciliar permite avaliacao no contexto real do paciente. Planejamento inclui avaliacao de riscos ambientais e orientacao familiar. Fortalece vinculo com equipe.',
    '[{"concept": "visita domiciliar", "weight": 0.3, "synonyms": ["atendimento domiciliar"]}, {"concept": "atencao primaria", "weight": 0.25, "synonyms": ["atencao basica"]}, {"concept": "cuidados personalizados", "weight": 0.2, "synonyms": ["atencao individualizada"]}, {"concept": "vinculo", "weight": 0.15, "synonyms": ["relacionamento"]}, {"concept": "prevencao", "weight": 0.1, "synonyms": ["prevencao de quedas"]}]'::jsonb,
    '[{"from": "visita", "to": "avaliacao", "relation": "facilita"}, {"from": "planejamento", "to": "adesao", "relation": "promove"}]'::jsonb
),

-- Saude do Trabalhador (19-20)
(
    'SC-DDL-019',
    'Um trabalhador de construcao civil sofre um acidente no canteiro e busca orientacao sobre a Comunicacao de Acidente de Trabalho (CAT). Explique o processo e relevancia.',
    'Saude Coletiva',
    'Saude do Trabalhador',
    'CAT',
    3,
    'Aplicacao',
    'CAT e documento obrigatorio emitido pelo empregador, notificando acidente ao INSS. Integra registro de agravos ocupacionais no SUS. Processo envolve descricao do evento e encaminhamento para tratamento.',
    '[{"concept": "CAT", "weight": 0.3, "synonyms": ["Comunicacao de Acidente de Trabalho"]}, {"concept": "acidente de trabalho", "weight": 0.25, "synonyms": ["acidente laboral"]}, {"concept": "INSS", "weight": 0.2, "synonyms": ["previdencia"]}, {"concept": "vigilancia", "weight": 0.15, "synonyms": ["monitoramento"]}, {"concept": "SUS", "weight": 0.1, "synonyms": ["Sistema Unico de Saude"]}]'::jsonb,
    '[{"from": "CAT", "to": "beneficios", "relation": "garante"}, {"from": "emissao", "to": "tratamento", "relation": "inicia"}]'::jsonb
),
(
    'SC-DDL-020',
    'Em uma empresa industrial, trabalhadores expostos a ruido excessivo reclamam de condicoes insalubres. Avalie as diferencas entre insalubridade e periculosidade, e proponha medidas de controle.',
    'Saude Coletiva',
    'Saude do Trabalhador',
    'Insalubridade e Periculosidade',
    5,
    'Avaliacao',
    'Insalubridade: agentes que afetam saude (ruido, poeira). Periculosidade: risco iminente de vida (eletricidade, explosivos). Medidas: engenharia de controle ambiental, EPI e programas de saude ocupacional.',
    '[{"concept": "insalubridade", "weight": 0.25, "synonyms": ["condicoes insalubres"]}, {"concept": "periculosidade", "weight": 0.25, "synonyms": ["risco iminente"]}, {"concept": "controle ocupacional", "weight": 0.2, "synonyms": ["medidas preventivas"]}, {"concept": "EPI", "weight": 0.15, "synonyms": ["equipamentos de protecao"]}, {"concept": "saude ocupacional", "weight": 0.15, "synonyms": ["medicina do trabalho"]}]'::jsonb,
    '[{"from": "insalubridade", "to": "saude", "relation": "afeta"}, {"from": "medidas", "to": "riscos", "relation": "mitiga"}]'::jsonb
);
