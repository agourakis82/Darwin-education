-- ============================================================
-- DDL QUESTIONS: GINECOLOGIA E OBSTETRICIA (20 questions)
-- Area: ginecologia_obstetricia | Codes: GO-DDL-001 to GO-DDL-020
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

-- Pre-natal
(
    'GO-DDL-001',
    'Gestante de 28 anos, G1P0, na 12ª semana de gestação, sem fatores de risco. Qual o rastreamento recomendado para aneuploidias cromossômicas e qual a conduta baseada nos resultados?',
    'Ginecologia e Obstetricia',
    'Pre-natal',
    'Rastreamento de aneuploidias',
    3,
    'Aplicacao',
    'Rastreamento combinado do primeiro trimestre (translucência nucal + PAPP-A + beta-hCG livre). Risco alto: aconselhamento genético e amniocentese ou biópsia de vilo corial. Risco baixo: seguimento rotina.',
    '[{"concept": "rastreamento combinado", "weight": 0.35, "synonyms": ["teste combinado primeiro trimestre"]}, {"concept": "aneuploidias", "weight": 0.25, "synonyms": ["trissomia 21"]}, {"concept": "translucencia nucal", "weight": 0.25, "synonyms": ["TN"]}, {"concept": "amniocentese", "weight": 0.15, "synonyms": ["diagnostico invasivo"]}]'::jsonb,
    '[{"from": "12 semanas gestacao", "to": "rastreamento combinado", "relation": "indica"}, {"from": "risco alto", "to": "amniocentese", "relation": "diagnostica"}]'::jsonb
),
(
    'GO-DDL-002',
    'Mulher de 32 anos, G2P1, na 24ª semana, IMC 32 kg/m². Quando e como realizar a triagem para diabetes mellitus gestacional?',
    'Ginecologia e Obstetricia',
    'Pre-natal',
    'Diabetes gestacional',
    2,
    'Compreensao',
    'Triagem entre 24-28 semanas com TOTG 75g (critérios IADPSG/OMS 2013): jejum ≥92 mg/dL, 1h ≥180, 2h ≥153 — um ou mais valores alterados confirma DMG. Conduta: dieta, exercício; insulina se metas glicêmicas não atingidas.',
    '[{"concept": "diabetes gestacional", "weight": 0.40, "synonyms": ["DMG"]}, {"concept": "triagem OGTT", "weight": 0.30, "synonyms": ["curva glicemica"]}, {"concept": "insulina", "weight": 0.30, "synonyms": ["tratamento DMG"]}]'::jsonb,
    '[{"from": "24-28 semanas + obesidade", "to": "triagem OGTT", "relation": "indica"}, {"from": "glicemia alterada", "to": "controle glicemico", "relation": "tratamento"}]'::jsonb
),

-- Parto
(
    'GO-DDL-003',
    'Gestante a termo, apresentação pélvica completa, sem trabalho de parto. Discuta as indicações para cesariana e alternativas.',
    'Ginecologia e Obstetricia',
    'Parto',
    'Indicacoes para cesariana',
    4,
    'Analise',
    'Indicação relativa para cesariana em apresentação pélvica a termo devido a maior risco de trauma fetal. Alternativas: versão cefálica externa (VCE) se condições favoráveis. Parto vaginal possível em centros experientes, mas cesariana preferida.',
    '[{"concept": "apresentacao pelvica", "weight": 0.35, "synonyms": ["pelvica"]}, {"concept": "versao cefalica externa", "weight": 0.30, "synonyms": ["VCE"]}, {"concept": "cesariana", "weight": 0.35, "synonyms": ["parto cesareo"]}]'::jsonb,
    '[{"from": "apresentacao pelvica a termo", "to": "cesariana", "relation": "indica"}, {"from": "condicoes adequadas", "to": "VCE", "relation": "alternativa"}]'::jsonb
),
(
    'GO-DDL-004',
    'Mulher em trabalho de parto ativo, dilatação 5 cm, contrações irregulares e hipossistólicas. Qual o diagnóstico diferencial e a conduta inicial?',
    'Ginecologia e Obstetricia',
    'Parto',
    'Distocias de parto',
    3,
    'Aplicacao',
    'Distócia de contração dinâmica (hipodinamia uterina). Conduta: hidratação IV, avaliação de descolamento, monitorização fetal; se persistir, ocitocina para estimular contrações.',
    '[{"concept": "distocia de contracao", "weight": 0.40, "synonyms": ["hipodinamia uterina"]}, {"concept": "ocitocina", "weight": 0.25, "synonyms": ["Pitocin"]}, {"concept": "monitorizacao fetal", "weight": 0.35, "synonyms": ["cardiotocografia"]}]'::jsonb,
    '[{"from": "contracoes irregulares", "to": "distocia de contracao", "relation": "diagnostica"}, {"from": "persistencia", "to": "ocitocina", "relation": "tratamento"}]'::jsonb
),

-- Ginecologia
(
    'GO-DDL-005',
    'Mulher de 42 anos, nuligesta, com sangramento uterino anormal pós-menopausa há 3 meses. Qual a abordagem diagnóstica inicial e riscos associados?',
    'Ginecologia e Obstetricia',
    'Ginecologia',
    'Sangramento uterino anormal',
    4,
    'Analise',
    'Abordagem: história, exame físico, beta-hCG, hemograma, TSH; ultrassom transvaginal (ET >4mm suspeito). Riscos: hiperplasia endometrial, carcinoma. Biópsia endometrial se ET >4mm.',
    '[{"concept": "sangramento pos-menopausa", "weight": 0.35, "synonyms": ["SPM"]}, {"concept": "ultrassom transvaginal", "weight": 0.30, "synonyms": ["US TV"]}, {"concept": "biopsia endometrial", "weight": 0.35, "synonyms": ["aspirado endometrial"]}]'::jsonb,
    '[{"from": "SPM", "to": "ultrassom transvaginal", "relation": "investiga"}, {"from": "ET maior que 4mm", "to": "biopsia endometrial", "relation": "diagnostica"}]'::jsonb
),
(
    'GO-DDL-006',
    'Paciente de 35 anos com dor pélvica crônica, dismenorreia intensa e infertilidade há 2 anos. Suspeita de endometriose: quais exames confirmatórios e opções terapêuticas?',
    'Ginecologia e Obstetricia',
    'Ginecologia',
    'Endometriose',
    5,
    'Avaliacao',
    'Exames: US TV com preparo intestinal, RMN pélvica; gold standard: laparoscopia com biópsia. Terapêuticas: AINEs, contraceptivos orais, agonistas GnRH; cirurgia conservadora ou definitiva para infertilidade.',
    '[{"concept": "endometriose", "weight": 0.40, "synonyms": []}, {"concept": "laparoscopia", "weight": 0.30, "synonyms": ["diagnostico cirurgico"]}, {"concept": "agonistas GnRH", "weight": 0.30, "synonyms": ["tratamento hormonal"]}]'::jsonb,
    '[{"from": "dor pelvica + infertilidade", "to": "endometriose", "relation": "suspeita"}, {"from": "confirmacao", "to": "laparoscopia", "relation": "diagnostica"}, {"from": "infertilidade", "to": "cirurgia", "relation": "tratamento"}]'::jsonb
),

-- Oncologia Ginecologica
(
    'GO-DDL-007',
    'Mulher de 28 anos, HPV positivo, citologia ASC-H. Qual o manejo recomendado e implicações oncológicas?',
    'Ginecologia e Obstetricia',
    'Oncologia Ginecologica',
    'Cancer de colo do utero',
    3,
    'Aplicacao',
    'Colposcopia imediata com biópsia se lesão visível. Implicações: risco de CIN 2/3 ou carcinoma invasivo; seguimento com HPV e citologia anual se negativo.',
    '[{"concept": "ASC-H", "weight": 0.35, "synonyms": ["atipias de alto grau"]}, {"concept": "colposcopia", "weight": 0.30, "synonyms": []}, {"concept": "CIN", "weight": 0.35, "synonyms": ["neoplasia intraepitelial cervical"]}]'::jsonb,
    '[{"from": "ASC-H + HPV positivo", "to": "colposcopia", "relation": "indica"}, {"from": "biopsia positiva", "to": "CIN", "relation": "diagnostica"}]'::jsonb
),
(
    'GO-DDL-008',
    'Mulher de 45 anos, multípara, nódulo mamário palpável de 2 cm, sem irradiação. Avaliação inicial e critérios para biópsia.',
    'Ginecologia e Obstetricia',
    'Oncologia Ginecologica',
    'Cancer de mama',
    4,
    'Analise',
    'Avaliação: mamografia bilateral + US mama. Biópsia se BIRADS 4/5 ou suspeito. Critérios: idade >40, história familiar, crescimento rápido.',
    '[{"concept": "nodulo mamario", "weight": 0.40, "synonyms": ["caroco mama"]}, {"concept": "mamografia", "weight": 0.25, "synonyms": ["mamografia bilateral"]}, {"concept": "BIRADS", "weight": 0.35, "synonyms": ["classificacao mamografica"]}]'::jsonb,
    '[{"from": "nodulo palpavel", "to": "mamografia + US", "relation": "investiga"}, {"from": "BIRADS 4 ou 5", "to": "biopsia", "relation": "indica"}]'::jsonb
),

-- Planejamento Familiar
(
    'GO-DDL-009',
    'Mulher de 22 anos, G0, sem comorbidades, deseja contracepção hormonal reversível de longa duração. Quais opções e contraindicações principais?',
    'Ginecologia e Obstetricia',
    'Planejamento Familiar',
    'Metodos contraceptivos',
    2,
    'Compreensao',
    'Opções: pílula combinada, adesivo, anel vaginal, DIU hormonal. Contraindicações: tabagismo >35 anos, hipertensão não controlada, história de TVP, migrânea com aura.',
    '[{"concept": "contracepcao hormonal", "weight": 0.35, "synonyms": ["pilula anticoncepcional"]}, {"concept": "DIU hormonal", "weight": 0.30, "synonyms": ["Mirena"]}, {"concept": "contraindicacoes", "weight": 0.35, "synonyms": ["riscos"]}]'::jsonb,
    '[{"from": "jovem sem comorbidades", "to": "pilula combinada", "relation": "indica"}, {"from": "risco cardiovascular", "to": "contraindicacao", "relation": "evita"}]'::jsonb
),
(
    'GO-DDL-010',
    'Casal de 30 anos, planeja gravidez em 1 ano, usa DIU de cobre há 5 anos. Discuta remoção, eficácia e aconselhamento pós-retirada.',
    'Ginecologia e Obstetricia',
    'Planejamento Familiar',
    'Metodos contraceptivos',
    3,
    'Aplicacao',
    'Remoção ambulatorial simples. Eficácia do DIU de cobre >99%; fertilidade retorna imediata. Aconselhamento: teste gravidez se atraso menstrual, pré-natal precoce.',
    '[{"concept": "DIU de cobre", "weight": 0.40, "synonyms": ["DIU nao hormonal"]}, {"concept": "retorno fertilidade", "weight": 0.30, "synonyms": []}, {"concept": "aconselhamento pre-concepcional", "weight": 0.30, "synonyms": ["planejamento"]}]'::jsonb,
    '[{"from": "planejamento gravidez", "to": "remocao DIU", "relation": "indica"}, {"from": "pos-remocao", "to": "monitorizacao fertilidade", "relation": "acompanhamento"}]'::jsonb
),

-- Pre-natal (11-12)
(
    'GO-DDL-011',
    'Uma gestante de 24 anos, G2P1, na 20ª semana de gestação, apresenta febre e dor lombar persistente há 48 horas. Exames laboratoriais revelam leucocitose e proteinúria leve. Como abordar o diagnóstico e manejo?',
    'Ginecologia e Obstetricia',
    'Pre-natal',
    'Infeccoes gestacionais',
    3,
    'Aplicacao',
    'Suspeitar de pielonefrite aguda, comum em gestantes. Realizar urocultura para identificação do agente etiológico e iniciar antibioticoterapia empírica com cefalosporinas seguras na gestação. Monitorar hidratação e função renal.',
    '[{"concept": "pielonefrite gestacional", "weight": 0.4, "synonyms": ["infeccao urinaria alta"]}, {"concept": "urocultura", "weight": 0.25, "synonyms": ["cultura de urina"]}, {"concept": "antibioticoterapia empirica", "weight": 0.2, "synonyms": ["tratamento antibiotico"]}, {"concept": "sepse gestacional", "weight": 0.15, "synonyms": ["infeccao sistemica"]}]'::jsonb,
    '[{"from": "febre e dor lombar", "to": "pielonefrite", "relation": "sugere"}, {"from": "leucocitose", "to": "infeccao", "relation": "indica"}, {"from": "gestacao", "to": "antibioticos seguros", "relation": "exige"}]'::jsonb
),
(
    'GO-DDL-012',
    'Mulher de 32 anos, primigesta, na 28ª semana, com histórico de hipertensão crônica, apresenta edema em membros inferiores e ganho de peso súbito. Pressão arterial 150/95 mmHg. Descreva a avaliação e conduta.',
    'Ginecologia e Obstetricia',
    'Pre-natal',
    'DHEG',
    4,
    'Analise',
    'Avaliar para pré-eclâmpsia sobreposta à hipertensão crônica, medindo proteinúria. Iniciar sulfato de magnésio para prevenção de convulsões se proteinúria significativa, e betabloqueadores para controle pressórico. Monitorar crescimento fetal com Doppler.',
    '[{"concept": "pre-eclampsia", "weight": 0.35, "synonyms": ["eclampsia gestacional"]}, {"concept": "proteinuria", "weight": 0.3, "synonyms": ["albuminuria"]}, {"concept": "sulfato de magnesio", "weight": 0.2, "synonyms": ["profilaxia convulsiva"]}, {"concept": "Doppler fetal", "weight": 0.15, "synonyms": ["ultrassom vascular"]}]'::jsonb,
    '[{"from": "hipertensao", "to": "pre-eclampsia", "relation": "risco"}, {"from": "edema", "to": "DHEG", "relation": "associa"}, {"from": "PA elevada", "to": "controle pressorico", "relation": "requer"}]'::jsonb
),

-- Parto (13-14)
(
    'GO-DDL-013',
    'Durante o trabalho de parto de uma gestante a termo, o monitor fetal mostra desacelerações tardias persistentes e variabilidade reduzida. Frequência cardíaca basal de 160 bpm. Qual a conduta imediata?',
    'Ginecologia e Obstetricia',
    'Parto',
    'Sofrimento fetal',
    2,
    'Compreensao',
    'Reconhecer sinais de sofrimento fetal agudo. Interromper ocitocina se em uso, reposicionar a paciente e administrar oxigênio suplementar. Preparar para cesariana de emergência se não houver melhora em 10-15 minutos.',
    '[{"concept": "sofrimento fetal", "weight": 0.4, "synonyms": ["distresse fetal"]}, {"concept": "desaceleracoes tardias", "weight": 0.25, "synonyms": ["bradicardia fetal"]}, {"concept": "cesariana emergencial", "weight": 0.2, "synonyms": ["parto cesareo"]}, {"concept": "oxigenio suplementar", "weight": 0.15, "synonyms": ["O2 materno"]}]'::jsonb,
    '[{"from": "monitor fetal", "to": "sofrimento", "relation": "detecta"}, {"from": "variabilidade reduzida", "to": "hipoxia", "relation": "indica"}, {"from": "desaceleracoes", "to": "cesariana", "relation": "conduz a"}]'::jsonb
),
(
    'GO-DDL-014',
    'Puérpera de 29 anos, 2 horas pós-parto vaginal, apresenta hipotensão (80/50 mmHg) e taquicardia, com sangramento vaginal estimado em 800 mL. Suspeita de atonia uterina. Descreva o manejo.',
    'Ginecologia e Obstetricia',
    'Parto',
    'Hemorragia pos-parto',
    3,
    'Aplicacao',
    'Confirmar atonia uterina por exame manual, massageando o útero para contração. Administrar uterotônicos como ocitocina IV. Se persistir, explorar causas como lacerações ou retenção placentária, e preparar transfusão.',
    '[{"concept": "hemorragia pos-parto", "weight": 0.35, "synonyms": ["HPP"]}, {"concept": "atonia uterina", "weight": 0.3, "synonyms": ["hipotonia uterina"]}, {"concept": "uterotonicos", "weight": 0.2, "synonyms": ["oxitocina"]}, {"concept": "transfusao sanguinea", "weight": 0.15, "synonyms": ["reposicao volemica"]}]'::jsonb,
    '[{"from": "sangramento excessivo", "to": "atonia", "relation": "causa"}, {"from": "hipotensao", "to": "choque hemorragico", "relation": "risco"}, {"from": "massagem uterina", "to": "contracao", "relation": "induz"}]'::jsonb
),

-- Ginecologia (15-16)
(
    'GO-DDL-015',
    'Mulher de 35 anos, nuligesta, com história de ciclos irregulares e infertilidade há 2 anos, apresenta hirsutismo moderado e IMC 28 kg/m². USG mostra ovários policísticos. Como investigar e tratar SOP?',
    'Ginecologia e Obstetricia',
    'Ginecologia',
    'SOP',
    4,
    'Analise',
    'Diagnosticar síndrome dos ovários policísticos pelos critérios de Rotterdam. Dosar testosterona total/livre, SHBG e LH/FSH; excluir outras causas. Tratamento inicial com anticoncepcionais orais e metformina se resistência insulínica.',
    '[{"concept": "sindrome dos ovarios policisticos", "weight": 0.4, "synonyms": ["SOP"]}, {"concept": "hiperandrogenismo", "weight": 0.25, "synonyms": ["hirsutismo"]}, {"concept": "criterios de Rotterdam", "weight": 0.2, "synonyms": ["diagnostico SOP"]}, {"concept": "metformina", "weight": 0.15, "synonyms": ["sensibilizador insulina"]}]'::jsonb,
    '[{"from": "ciclos irregulares", "to": "oligo-anovulacao", "relation": "indica"}, {"from": "ovarios policisticos", "to": "SOP", "relation": "confirma"}, {"from": "infertilidade", "to": "tratamento hormonal", "relation": "requer"}]'::jsonb
),
(
    'GO-DDL-016',
    'Paciente de 42 anos, G3P2, relata sangramento uterino anormal há 6 meses, com miomas submucosos identificados em histeroscopia. Hemoglobina 9,5 g/dL. Discuta opções terapêuticas.',
    'Ginecologia e Obstetricia',
    'Ginecologia',
    'Miomas',
    5,
    'Avaliacao',
    'Para miomas submucosos sintomáticos, priorizar ressecção histeroscópica para controle de sangramento. Se múltiplos ou grandes, considerar agonistas de GnRH pré-operatórios ou embolização de artérias uterinas. Histerectomia se refratária.',
    '[{"concept": "miomas uterinos", "weight": 0.35, "synonyms": ["fibromas"]}, {"concept": "sangramento anormal", "weight": 0.3, "synonyms": ["menorragia"]}, {"concept": "histeroscopia", "weight": 0.2, "synonyms": ["resseccao endoscopica"]}, {"concept": "embolizacao uterina", "weight": 0.15, "synonyms": ["tratamento intervencionista"]}]'::jsonb,
    '[{"from": "miomas submucosos", "to": "sangramento", "relation": "causa"}, {"from": "anemia", "to": "tratamento cirurgico", "relation": "justifica"}, {"from": "fertilidade", "to": "opcoes conservadoras", "relation": "influencia"}]'::jsonb
),

-- Oncologia Ginecologica (17-18)
(
    'GO-DDL-017',
    'Mulher de 55 anos, pós-menopausa, com sangramento vaginal recorrente e ultrassom mostrando endométrio espessado em 12 mm. Biópsia endometrial revela adenocarcinoma. Qual o estadiamento e plano terapêutico?',
    'Ginecologia e Obstetricia',
    'Oncologia Ginecologica',
    'Cancer de endometrio',
    4,
    'Analise',
    'Realizar estadiamento cirúrgico com histerectomia total, salpingo-ooforectomia bilateral e linfadenectomia (FIGO). Radioterapia adjuvante se invasão miometrial profunda. Quimioterapia se estádio avançado.',
    '[{"concept": "adenocarcinoma endometrial", "weight": 0.4, "synonyms": ["cancer de endometrio"]}, {"concept": "estadiamento FIGO", "weight": 0.25, "synonyms": ["classificacao tumoral"]}, {"concept": "histerectomia", "weight": 0.2, "synonyms": ["cirurgia radical"]}, {"concept": "radioterapia adjuvante", "weight": 0.15, "synonyms": ["RT pos-operatoria"]}]'::jsonb,
    '[{"from": "sangramento pos-menopausa", "to": "cancer endometrial", "relation": "alerta"}, {"from": "endometrio espessado", "to": "biopsia", "relation": "indica"}, {"from": "invasao miometrial", "to": "quimioterapia", "relation": "pode requerer"}]'::jsonb
),
(
    'GO-DDL-018',
    'Paciente de 48 anos com distensão abdominal progressiva e dor pélvica; CA-125 elevado em 250 U/mL e USG sugere massa ovariana complexa de 8 cm. Como prosseguir?',
    'Ginecologia e Obstetricia',
    'Oncologia Ginecologica',
    'Cancer de ovario',
    5,
    'Avaliacao',
    'Suspeitar de carcinoma epitelial ovariano. Realizar TC de abdome/pelve para estadiamento. Citorredução ótima seguida de quimioterapia com carboplatina/paclitaxel. Monitorar com CA-125 pós-tratamento.',
    '[{"concept": "cancer de ovario", "weight": 0.35, "synonyms": ["neoplasia ovariana"]}, {"concept": "CA-125", "weight": 0.3, "synonyms": ["marcador tumoral"]}, {"concept": "citorreducao", "weight": 0.2, "synonyms": ["cirurgia debulking"]}, {"concept": "quimioterapia platina", "weight": 0.15, "synonyms": ["paclitaxel + carboplatina"]}]'::jsonb,
    '[{"from": "massa ovariana", "to": "cancer", "relation": "sugere"}, {"from": "CA-125 elevado", "to": "estadiamento", "relation": "auxilia"}, {"from": "dor abdominal", "to": "cirurgia exploratoria", "relation": "conduz a"}]'::jsonb
),

-- Planejamento Familiar (19-20)
(
    'GO-DDL-019',
    'Mulher de 30 anos, G2P2, deseja esterilização definitiva após parto cesáreo. Ela está amamentando e sem contraindicações. Discuta métodos e consentimento.',
    'Ginecologia e Obstetricia',
    'Planejamento Familiar',
    'Esterilizacao',
    2,
    'Compreensao',
    'Opções incluem laqueadura tubária pós-parto. Discutir irreversibilidade, eficácia >99%, e alternativas como DIU se reconsideração futura. Obter consentimento informado sobre riscos.',
    '[{"concept": "esterilizacao tubaria", "weight": 0.4, "synonyms": ["laqueadura"]}, {"concept": "consentimento informado", "weight": 0.25, "synonyms": ["autorizacao cirurgica"]}, {"concept": "eficacia contraceptiva", "weight": 0.2, "synonyms": ["metodo definitivo"]}, {"concept": "gravidez ectopica", "weight": 0.15, "synonyms": ["risco residual"]}]'::jsonb,
    '[{"from": "desejo definitivo", "to": "laqueadura", "relation": "indica"}, {"from": "pos-cesarea", "to": "procedimento oportuno", "relation": "facilita"}, {"from": "amamentacao", "to": "metodos seguros", "relation": "considera"}]'::jsonb
),
(
    'GO-DDL-020',
    'Puérpera de 26 anos, 6 semanas pós-parto vaginal, deseja contracepção de longa duração enquanto amamenta. Sem histórico de trombose. Qual método recomendar?',
    'Ginecologia e Obstetricia',
    'Planejamento Familiar',
    'DIU pos-parto',
    3,
    'Aplicacao',
    'Recomendar DIU de levonorgestrel inserido entre 4-6 semanas pós-parto, seguro na lactação. Fornece contracepção por até 8 anos (FDA 2023) e reduz sangramento. Avaliar útero involuído e contraindicações.',
    '[{"concept": "DIU levonorgestrel", "weight": 0.35, "synonyms": ["Mirena"]}, {"concept": "contracepcao pos-parto", "weight": 0.3, "synonyms": ["metodo LARC"]}, {"concept": "lactacao", "weight": 0.2, "synonyms": ["amamentacao"]}, {"concept": "insercao pos-parto", "weight": 0.15, "synonyms": ["timing ideal"]}]'::jsonb,
    '[{"from": "pos-parto", "to": "DIU", "relation": "oportuno"}, {"from": "amamentacao", "to": "metodos progestogenicos", "relation": "compativel"}, {"from": "desejo LARC", "to": "eficacia longa", "relation": "garante"}]'::jsonb
);
