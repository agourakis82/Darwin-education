-- ============================================================
-- DDL QUESTIONS: CLINICA MEDICA (20 questions)
-- Area: clinica_medica | Codes: CM-DDL-001 to CM-DDL-020
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

-- Cardiologia
(
    'CM-DDL-001',
    'Um paciente de 68 anos com história de hipertensão arterial apresenta dispneia progressiva aos esforços, edema bilateral em membros inferiores e crepitações bibasais nos pulmões. Quais são os principais diagnósticos diferenciais e qual o tratamento inicial recomendado?',
    'Clinica Medica',
    'Cardiologia',
    'Insuficiencia Cardiaca',
    3,
    'Aplicacao',
    'Os sintomas sugerem insuficiência cardíaca congestiva (ICC). Diagnósticos diferenciais incluem pneumonia e embolia pulmonar. Tratamento inicial: diuréticos de alça, inibidores da ECA e betabloqueadores.',
    '[{"concept": "insuficiencia cardiaca", "weight": 0.4, "synonyms": ["ICC", "insuficiencia cardiaca congestiva"]}, {"concept": "diureticos de alca", "weight": 0.3, "synonyms": ["furosemida"]}, {"concept": "inibidores da ECA", "weight": 0.3, "synonyms": ["enalapril"]}]'::jsonb,
    '[{"from": "dispneia e edema", "to": "insuficiencia cardiaca", "relation": "sugere"}, {"from": "insuficiencia cardiaca", "to": "diureticos", "relation": "trata"}, {"from": "insuficiencia cardiaca", "to": "inibidores da ECA", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-002',
    'Uma mulher de 52 anos relata episódios de palpitações irregulares, fadiga e síncope ocasional. O ECG revela fibrilação atrial com resposta ventricular rápida. Qual o manejo agudo e as opções de anticoagulação?',
    'Clinica Medica',
    'Cardiologia',
    'Arritmias',
    4,
    'Analise',
    'Manejo agudo: controle da frequência com betabloqueadores ou digoxina. Anticoagulação baseada em escore CHA2DS2-VASc para prevenção de tromboembolismo.',
    '[{"concept": "fibrilacao atrial", "weight": 0.35, "synonyms": ["FA"]}, {"concept": "controle de frequencia", "weight": 0.3, "synonyms": ["betabloqueadores"]}, {"concept": "anticoagulacao", "weight": 0.35, "synonyms": ["varfarina", "DOACs"]}]'::jsonb,
    '[{"from": "palpitacoes irregulares", "to": "fibrilacao atrial", "relation": "indica"}, {"from": "fibrilacao atrial", "to": "controle de frequencia", "relation": "requer"}, {"from": "fibrilacao atrial", "to": "anticoagulacao", "relation": "previne"}]'::jsonb
),

-- Endocrinologia
(
    'CM-DDL-003',
    'Um homem de 45 anos é diagnosticado com diabetes mellitus tipo 2 após glicemia de jejum de 150 mg/dL e HbA1c de 8,5%. Quais são as metas glicêmicas e o tratamento farmacológico inicial?',
    'Clinica Medica',
    'Endocrinologia',
    'Diabetes',
    2,
    'Compreensao',
    'Metas: HbA1c <7%. Tratamento inicial: metformina, associada a mudanças no estilo de vida (dieta e exercício).',
    '[{"concept": "diabetes tipo 2", "weight": 0.4, "synonyms": ["DM2"]}, {"concept": "metformina", "weight": 0.3, "synonyms": []}, {"concept": "HbA1c menor que 7%", "weight": 0.3, "synonyms": ["controle glicemico"]}]'::jsonb,
    '[{"from": "glicemia elevada", "to": "diabetes tipo 2", "relation": "diagnostica"}, {"from": "diabetes tipo 2", "to": "metformina", "relation": "trata"}, {"from": "diabetes tipo 2", "to": "estilo de vida", "relation": "modifica"}]'::jsonb
),
(
    'CM-DDL-004',
    'Uma paciente de 35 anos apresenta fadiga, ganho de peso e pele seca. TSH elevado e T4 livre baixo confirmam hipotireoidismo. Qual a causa mais comum e o tratamento?',
    'Clinica Medica',
    'Endocrinologia',
    'Tireoide',
    3,
    'Aplicacao',
    'Causa mais comum: tireoidite de Hashimoto. Tratamento: levotiroxina na dose de 1,6 mcg/kg/dia, ajustada por TSH.',
    '[{"concept": "hipotireoidismo", "weight": 0.35, "synonyms": ["mixedema"]}, {"concept": "tireoidite de Hashimoto", "weight": 0.3, "synonyms": []}, {"concept": "levotiroxina", "weight": 0.35, "synonyms": ["T4"]}]'::jsonb,
    '[{"from": "TSH elevado", "to": "hipotireoidismo", "relation": "confirma"}, {"from": "hipotireoidismo", "to": "tireoidite de Hashimoto", "relation": "causado por"}, {"from": "hipotireoidismo", "to": "levotiroxina", "relation": "trata"}]'::jsonb
),

-- Pneumologia
(
    'CM-DDL-005',
    'Um homem de 60 anos, fumante crônico, apresenta tosse produtiva, dispneia e barrel chest. Espirometria mostra VEF1/CVF <70%. Qual o diagnóstico e o manejo?',
    'Clinica Medica',
    'Pneumologia',
    'DPOC',
    4,
    'Analise',
    'Diagnóstico: DPOC confirmada por espirometria pós-broncodilatador com VEF1/CVF <0,70 (GOLD). Manejo: cessação tabágica, broncodilatadores (LABA/LAMA) e reabilitação pulmonar.',
    '[{"concept": "DPOC", "weight": 0.4, "synonyms": ["doenca pulmonar obstrutiva cronica"]}, {"concept": "cessacao tabagica", "weight": 0.3, "synonyms": ["parar de fumar"]}, {"concept": "broncodilatadores", "weight": 0.3, "synonyms": ["salmeterol", "tiotropio"]}]'::jsonb,
    '[{"from": "tosse e dispneia", "to": "DPOC", "relation": "sugere"}, {"from": "DPOC", "to": "cessacao tabagica", "relation": "essencial"}, {"from": "DPOC", "to": "broncodilatadores", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-006',
    'Uma idosa de 75 anos desenvolve febre, calafrios e tosse purulenta após aspiração. Raio-X mostra infiltrado lobar. Qual o patógeno mais provável e o antibiótico empírico?',
    'Clinica Medica',
    'Pneumologia',
    'Pneumonia',
    3,
    'Aplicacao',
    'Pneumonia aspirativa: flora polimicrobiana (anaeróbios + gram-negativos). Antibiótico: amoxicilina-clavulanato ou clindamicina; ceftriaxona + metronidazol se gravidade. Nota: S. pneumoniae é o principal agente de PAC típica, não aspirativa.',
    '[{"concept": "pneumonia aspirativa", "weight": 0.35, "synonyms": ["aspiracao pulmonar"]}, {"concept": "flora polimicrobiana", "weight": 0.3, "synonyms": ["anaerobios", "gram-negativos"]}, {"concept": "amoxicilina-clavulanato", "weight": 0.35, "synonyms": ["clindamicina"]}]'::jsonb,
    '[{"from": "infiltrado lobar", "to": "pneumonia", "relation": "indica"}, {"from": "pneumonia", "to": "Streptococcus pneumoniae", "relation": "causado por"}, {"from": "pneumonia", "to": "amoxicilina", "relation": "trata"}]'::jsonb
),

-- Nefrologia
(
    'CM-DDL-007',
    'Um paciente de 55 anos com diabetes apresenta oligúria, edema e creatinina sérica de 3,5 mg/dL. Qual a classificação da insuficiência renal e as medidas iniciais?',
    'Clinica Medica',
    'Nefrologia',
    'Insuficiencia Renal',
    4,
    'Analise',
    'Classificação: Insuficiência Renal Crônica estágio 4 (DFG 15-29 mL/min). Medidas: controle de PA, restrição proteica e evitar nefrotóxicos.',
    '[{"concept": "insuficiencia renal cronica", "weight": 0.4, "synonyms": ["IRC"]}, {"concept": "estagio 4", "weight": 0.3, "synonyms": ["DFG 15-29"]}, {"concept": "controle pressorico", "weight": 0.3, "synonyms": ["IECA/ARA II"]}]'::jsonb,
    '[{"from": "creatinina elevada", "to": "insuficiencia renal cronica", "relation": "indica"}, {"from": "insuficiencia renal", "to": "estagio 4", "relation": "classifica"}, {"from": "insuficiencia renal", "to": "controle de PA", "relation": "gerencia"}]'::jsonb
),
(
    'CM-DDL-008',
    'Uma paciente de 40 anos com vômitos intensos apresenta fraqueza muscular e arritmias. Exames mostram K+ 2,8 mEq/L e alcalose metabólica. Qual a causa e o tratamento?',
    'Clinica Medica',
    'Nefrologia',
    'Disturbios Eletroliticos',
    5,
    'Avaliacao',
    'Causa: hipocalemia por perda gástrica. Tratamento: reposição de potássio IV com monitoramento cardíaco.',
    '[{"concept": "hipocalemia", "weight": 0.4, "synonyms": ["K+ baixo"]}, {"concept": "vomitos", "weight": 0.3, "synonyms": []}, {"concept": "reposicao de potassio", "weight": 0.3, "synonyms": ["KCl IV"]}]'::jsonb,
    '[{"from": "vomitos", "to": "hipocalemia", "relation": "causa"}, {"from": "hipocalemia", "to": "arritmias", "relation": "provoca"}, {"from": "hipocalemia", "to": "reposicao de potassio", "relation": "corrige"}]'::jsonb
),

-- Gastroenterologia
(
    'CM-DDL-009',
    'Um homem de 50 anos, alcoólatra, apresenta icterícia, astenia e dor abdominal. Exames: ALT/AST elevadas, bilirrubina total 5 mg/dL. Qual o diagnóstico e o manejo?',
    'Clinica Medica',
    'Gastroenterologia',
    'Hepatite',
    3,
    'Aplicacao',
    'Diagnóstico: Hepatite alcoólica. Manejo: abstinência alcoólica, suporte nutricional e corticoides (prednisolona 40 mg/dia × 28 dias) se Função Discriminante de Maddrey (FD) ≥32 — critério formal para indicação de corticoterapia.',
    '[{"concept": "hepatite alcoolica", "weight": 0.4, "synonyms": []}, {"concept": "abstinencia alcoolica", "weight": 0.3, "synonyms": ["parar de beber"]}, {"concept": "corticoides", "weight": 0.3, "synonyms": ["prednisona"]}]'::jsonb,
    '[{"from": "ictericia e ALT elevada", "to": "hepatite alcoolica", "relation": "sugere"}, {"from": "hepatite alcoolica", "to": "abstinencia alcoolica", "relation": "essencial"}, {"from": "hepatite alcoolica", "to": "corticoides", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-010',
    'Uma mulher de 45 anos relata epigastralgia em jejum aliviada por antiácidos. Endoscopia mostra úlcera duodenal. Qual a etiologia principal e o tratamento?',
    'Clinica Medica',
    'Gastroenterologia',
    'Doenca Ulcerosa Peptica',
    2,
    'Compreensao',
    'Etiologia: infecção por Helicobacter pylori. Tratamento: erradicação com IBP + amoxicilina + claritromicina.',
    '[{"concept": "ulcera peptica", "weight": 0.35, "synonyms": ["ulcera duodenal"]}, {"concept": "Helicobacter pylori", "weight": 0.35, "synonyms": ["H. pylori"]}, {"concept": "erradicacao", "weight": 0.3, "synonyms": ["terapia tripla"]}]'::jsonb,
    '[{"from": "epigastralgia em jejum", "to": "ulcera peptica", "relation": "indica"}, {"from": "ulcera peptica", "to": "Helicobacter pylori", "relation": "causado por"}, {"from": "Helicobacter pylori", "to": "erradicacao", "relation": "trata"}]'::jsonb
),

-- Cardiologia (11-12)
(
    'CM-DDL-011',
    'Um homem de 58 anos apresenta-se ao pronto-socorro com dor torácica opressiva intensa iniciada há 2 horas, acompanhada de sudorese profusa e irradiação para o braço esquerdo. O ECG revela elevação do segmento ST em derivações anteriores.',
    'Clinica Medica',
    'Cardiologia',
    'Infarto Agudo do Miocardio',
    3,
    'Aplicacao',
    'O quadro clínico sugere infarto agudo do miocárdio (IAM) com supradesnivelamento do ST, necessitando de avaliação imediata para reperfusão. Iniciar aspirina, clopidogrel e heparina não fracionada. Realizar angiografia coronária urgente para intervenção percutânea.',
    '[{"concept": "infarto agudo do miocardio", "weight": 0.4, "synonyms": ["IAM"]}, {"concept": "reperfusao", "weight": 0.3, "synonyms": ["angioplastia"]}, {"concept": "elevacao ST", "weight": 0.2, "synonyms": ["ECG"]}, {"concept": "aspirina", "weight": 0.1, "synonyms": ["AAS"]}]'::jsonb,
    '[{"from": "dor toracica", "to": "infarto agudo do miocardio", "relation": "sugere"}, {"from": "elevacao ST", "to": "reperfusao", "relation": "indica"}, {"from": "infarto agudo do miocardio", "to": "aspirina", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-012',
    'Uma mulher de 72 anos relata episódios de síncope ao esforço, associada a um sopro sistólico rude em foco aórtico. O ecocardiograma mostra gradiente de pressão elevado na válvula aórtica.',
    'Clinica Medica',
    'Cardiologia',
    'Valvulopatias',
    4,
    'Analise',
    'Os achados indicam estenose aórtica grave, com risco de síncope e insuficiência cardíaca. Avaliar para intervenção cirúrgica ou transcateter, como troca valvar. Monitorar com ecocardiogramas seriados e otimizar tratamento medicamentoso.',
    '[{"concept": "estenose aortica", "weight": 0.4, "synonyms": ["valvula aortica"]}, {"concept": "ecocardiograma", "weight": 0.3, "synonyms": ["eco"]}, {"concept": "troca valvar", "weight": 0.2, "synonyms": ["TAVI"]}, {"concept": "sincope", "weight": 0.1, "synonyms": ["desmaio"]}]'::jsonb,
    '[{"from": "sincope", "to": "estenose aortica", "relation": "sugere"}, {"from": "sopro sistolico", "to": "ecocardiograma", "relation": "confirma"}, {"from": "estenose aortica", "to": "troca valvar", "relation": "trata"}]'::jsonb
),

-- Endocrinologia (13-14)
(
    'CM-DDL-013',
    'Um paciente de 45 anos apresenta ganho de peso central, estrias purpúreas abdominais, hipertensão arterial e fraqueza muscular proximal. Dosagens laboratoriais revelam cortisol elevado e supressão incompleta no teste de dexametasona.',
    'Clinica Medica',
    'Endocrinologia',
    'Sindrome de Cushing',
    2,
    'Compreensao',
    'O quadro é compatível com síndrome de Cushing, provavelmente por adenoma hipofisário. Investigar com RM de hipófise e testes de supressão. Tratamento envolve cirurgia transesfenoidal ou medicamentos inibidores da esteroidogênese.',
    '[{"concept": "sindrome de cushing", "weight": 0.4, "synonyms": ["hipercortisolismo"]}, {"concept": "cortisol elevado", "weight": 0.3, "synonyms": ["hipercortisolemia"]}, {"concept": "adenoma hipofisario", "weight": 0.2, "synonyms": ["tumor pituitario"]}, {"concept": "cirurgia transesfenoidal", "weight": 0.1, "synonyms": []}]'::jsonb,
    '[{"from": "ganho de peso", "to": "sindrome de cushing", "relation": "sugere"}, {"from": "cortisol elevado", "to": "RM hipofise", "relation": "indica"}, {"from": "sindrome de cushing", "to": "cirurgia", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-014',
    'Uma mulher de 38 anos com fadiga extrema, perda de peso, hipotensão ortostática e hiperpigmentação cutânea refere crises de náuseas e vômitos. O teste de estímulo com ACTH mostra resposta inadequada do cortisol.',
    'Clinica Medica',
    'Endocrinologia',
    'Insuficiencia Adrenal',
    3,
    'Aplicacao',
    'Suspeita de insuficiência adrenal primária (doença de Addison), com destruição adrenal autoimune. Iniciar reposição com hidrocortisona e fludrocortisona imediatamente. Educar sobre aumento de dose em estresse e monitorar eletrólitos.',
    '[{"concept": "insuficiencia adrenal", "weight": 0.4, "synonyms": ["doenca de addison"]}, {"concept": "hidrocortisona", "weight": 0.3, "synonyms": ["cortisol"]}, {"concept": "teste ACTH", "weight": 0.2, "synonyms": ["cosyntropin"]}, {"concept": "hiperpigmentacao", "weight": 0.1, "synonyms": []}]'::jsonb,
    '[{"from": "fadiga", "to": "insuficiencia adrenal", "relation": "sugere"}, {"from": "hipotensao", "to": "reposicao mineralocorticoide", "relation": "trata"}, {"from": "insuficiencia adrenal", "to": "hidrocortisona", "relation": "trata"}]'::jsonb
),

-- Pneumologia (15-16)
(
    'CM-DDL-015',
    'Um jovem de 25 anos com história de asma atópica apresenta dispneia noturna recorrente, tosse com expectoração mucosa e sibilos audíveis, piorando com exercício e alérgenos.',
    'Clinica Medica',
    'Pneumologia',
    'Asma',
    2,
    'Compreensao',
    'O quadro sugere asma brônquica descontrolada, classificada como intermitente ou persistente leve. Iniciar corticosteroide inalatório associado a beta-agonista de curta ação. Educar sobre evitar gatilhos e monitorar com espirometria.',
    '[{"concept": "asma", "weight": 0.4, "synonyms": ["asma bronquica"]}, {"concept": "corticosteroide inalatorio", "weight": 0.3, "synonyms": ["budesonida"]}, {"concept": "sibilos", "weight": 0.2, "synonyms": ["wheezing"]}, {"concept": "espirometria", "weight": 0.1, "synonyms": ["funcao pulmonar"]}]'::jsonb,
    '[{"from": "dispneia noturna", "to": "asma", "relation": "sugere"}, {"from": "sibilos", "to": "beta agonista", "relation": "alivia"}, {"from": "asma", "to": "corticosteroide", "relation": "controla"}]'::jsonb
),
(
    'CM-DDL-016',
    'Uma paciente de 65 anos, pós-cirurgia de quadril há 10 dias, desenvolve dispneia súbita, taquipneia e dor pleurítica no hemitórax direito. A gasometria arterial mostra hipoxemia e a D-dímero está elevada.',
    'Clinica Medica',
    'Pneumologia',
    'Embolia Pulmonar',
    4,
    'Analise',
    'Alta suspeita de embolia pulmonar, especialmente em contexto de imobilização. Realizar angio-TC de tórax para confirmação e iniciar anticoagulação com heparina de baixo peso molecular. Avaliar para terapia trombolítica se instabilidade hemodinâmica.',
    '[{"concept": "embolia pulmonar", "weight": 0.4, "synonyms": ["EP"]}, {"concept": "anticoagulacao", "weight": 0.3, "synonyms": ["heparina"]}, {"concept": "D dimero", "weight": 0.2, "synonyms": []}, {"concept": "angio TC", "weight": 0.1, "synonyms": ["tomografia"]}]'::jsonb,
    '[{"from": "dispneia subita", "to": "embolia pulmonar", "relation": "sugere"}, {"from": "dor pleuritica", "to": "D dimero", "relation": "indica"}, {"from": "embolia pulmonar", "to": "anticoagulacao", "relation": "trata"}]'::jsonb
),

-- Nefrologia (17-18)
(
    'CM-DDL-017',
    'Um homem de 40 anos apresenta edema generalizado progressivo, hipoalbuminemia e proteinúria maciça em exame de urina de 24 horas. Não há hematúria significativa.',
    'Clinica Medica',
    'Nefrologia',
    'Sindrome Nefrotica',
    3,
    'Aplicacao',
    'O quadro é clássico de síndrome nefrótica, possivelmente por glomerulopatia membranosa. Iniciar diuréticos, inibidores da ECA e estatina para dislipidemia. Realizar biópsia renal se não responsivo a tratamento empírico.',
    '[{"concept": "sindrome nefrotica", "weight": 0.4, "synonyms": ["nefropatia"]}, {"concept": "proteinuria", "weight": 0.3, "synonyms": ["perda proteica"]}, {"concept": "inibidores ECA", "weight": 0.2, "synonyms": ["enalapril"]}, {"concept": "biopsia renal", "weight": 0.1, "synonyms": []}]'::jsonb,
    '[{"from": "edema", "to": "sindrome nefrotica", "relation": "sugere"}, {"from": "hipoalbuminemia", "to": "diureticos", "relation": "trata"}, {"from": "sindrome nefrotica", "to": "biopsia", "relation": "diagnostica"}]'::jsonb
),
(
    'CM-DDL-018',
    'Uma mulher de 32 anos com lúpus eritematoso sistêmico apresenta hematúria, proteinúria moderada e elevação de creatinina sérica. O complemento C3 está baixo.',
    'Clinica Medica',
    'Nefrologia',
    'Nefrite Lupica',
    5,
    'Avaliacao',
    'Suspeita de nefrite lúpica classe III ou IV, com envolvimento glomerular ativo. Iniciar imunossupressão com pulsos de ciclofosfamida ou micofenolato e corticoides. Monitorar função renal e atividade da doença lúpica.',
    '[{"concept": "nefrite lupica", "weight": 0.4, "synonyms": ["lupus nefropatia"]}, {"concept": "imunossupressao", "weight": 0.3, "synonyms": ["ciclofosfamida"]}, {"concept": "complemento C3", "weight": 0.2, "synonyms": []}, {"concept": "hematuria", "weight": 0.1, "synonyms": []}]'::jsonb,
    '[{"from": "lupus", "to": "nefrite lupica", "relation": "complica"}, {"from": "proteinuria", "to": "imunossupressao", "relation": "trata"}, {"from": "nefrite lupica", "to": "monitoramento renal", "relation": "requer"}]'::jsonb
),

-- Gastroenterologia (19-20)
(
    'CM-DDL-019',
    'Um homem de 50 anos, bebedor crônico, apresenta dor abdominal intensa epigástrica irradiada para dorso, náuseas e vômitos. Amilase e lipase séricas estão marcadamente elevadas.',
    'Clinica Medica',
    'Gastroenterologia',
    'Pancreatite',
    3,
    'Aplicacao',
    'O quadro sugere pancreatite aguda biliar ou alcoólica, com necessidade de hidratação vigorosa e jejum. Investigar com USG abdominal para litíase e monitorar complicações como necrose. Suporte nutricional parenteral se prolongado.',
    '[{"concept": "pancreatite aguda", "weight": 0.4, "synonyms": ["inflamacao pancreatica"]}, {"concept": "amilase lipase", "weight": 0.3, "synonyms": ["enzimas"]}, {"concept": "hidratacao", "weight": 0.2, "synonyms": ["fluidos IV"]}, {"concept": "USG abdominal", "weight": 0.1, "synonyms": ["ultrassom"]}]'::jsonb,
    '[{"from": "dor epigastrica", "to": "pancreatite aguda", "relation": "sugere"}, {"from": "vomitos", "to": "jejum", "relation": "trata"}, {"from": "pancreatite aguda", "to": "hidratacao", "relation": "trata"}]'::jsonb
),
(
    'CM-DDL-020',
    'Uma paciente de 55 anos com história de hepatite C apresenta ascite refratária, icterícia e hematêmese por varizes esofágicas. A função hepática está descompensada com bilirrubina elevada.',
    'Clinica Medica',
    'Gastroenterologia',
    'Cirrose Hepatica',
    4,
    'Avaliacao',
    'Quadro de cirrose hepática descompensada com hipertensão portal. Realizar endoscopia para ligadura de varizes e paracenteses para ascite. Avaliar para transplante hepático e tratar etiologia subjacente com antivirais.',
    '[{"concept": "cirrose hepatica", "weight": 0.4, "synonyms": ["cirrose"]}, {"concept": "ascite", "weight": 0.3, "synonyms": ["liquido abdominal"]}, {"concept": "varizes esofagicas", "weight": 0.2, "synonyms": []}, {"concept": "transplante hepatico", "weight": 0.1, "synonyms": []}]'::jsonb,
    '[{"from": "ictericia", "to": "cirrose hepatica", "relation": "sugere"}, {"from": "hematemese", "to": "endoscopia", "relation": "trata"}, {"from": "cirrose hepatica", "to": "transplante", "relation": "cura"}]'::jsonb
);
