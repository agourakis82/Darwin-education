-- =====================================================
-- Beta Web Seed: ENAMED 2025 Official Questions (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Seed the ENAMED 2025 official question bank (96 questions)
-- with calibrated IRT parameters for simulado/CAT flows.
--
-- IMPORTANT:
-- - This seed is intended for internal educational use and psychometrics.
-- - Keep provenance and licensing notes in repo docs; do not embed secrets.

-- ============================================================================
-- ENAMED 2025 Official Questions with IRT Parameters
-- Generated: 2026-01-31T18:52:02.825Z
-- Source: Microdados ENAMED 2025 + INEP Portal PDFs
-- ============================================================================

-- Ensure question_banks table exists (should be created by schema.sql)

-- Question bank for ENAMED 2025 official microdata
INSERT INTO question_banks (id, name, description, source, year_start, year_end, is_premium)
VALUES (
  'e2025000-0000-0000-0000-000000000001',
  'ENAMED 2025 Oficial',
  'Questões oficiais do ENAMED 2025 com parâmetros IRT calibrados',
  'official_enamed',
  2025,
  2025,
  FALSE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert 96 questions from ENAMED 2025
-- IRT Parameters: difficulty (b), discrimination (a), guessing (c), infit, outfit
INSERT INTO questions (
  id,
  bank_id,
  stem,
  options,
  correct_index,
  explanation,
  area,
  subspecialty,
  topic,
  irt_difficulty,
  irt_discrimination,
  irt_guessing,
  irt_infit,
  irt_outfit,
  year,
  validated_by
)
VALUES
  (
    'e2025c10-0001-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 58 anos, com diagnóstico de hipertensão arterial sistêmica (HAS) e em tratamento irregular, é encaminhada ao ambulatório de clínica médica de atenção secundária. Queixa-se de fadiga e dispneia aos esforços, com piora progressiva. Ao exame físico, é observado ritmo cardíaco regular em 4 tempos (B3 + B4), sem sopros no precórdio, mas com crépitos em bases pulmonares; pressão arterial: 148 x 90 mmHg. Ecocardiograma transtorácico evidencia hipertrofia ventricular esquerda concêntrica, associada com fração de ejeção de 38% (por Simpson). Exames laboratoriais normais, salvo pela elevação sérica de peptídeo natriurético tipo B (BNP). Para melhorar o controle da HAS e o prognóstico da paciente, o tratamento com inibidor da enzima conversora de angiotensina foi mantido, e o especialista optou por associar determinado fármaco, devido ao impacto positivo no prognóstico de sobrevida dessa paciente. O fármaco introduzido no tratamento da paciente foi',
    '[{"letter":"A","text":"espironolactona","feedback":""},{"letter":"B","text":"clortalidona","feedback":""},{"letter":"C","text":"hidralazina","feedback":""},{"letter":"D","text":"clonidina","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.16663,
    0.891,
    0.25,
    1.00117,
    0.97973,
    2025,
    'expert'
  ),
  (
    'e2025c10-0003-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 45 anos foi encontrado inconsciente por familiares junto a uma escada de sua casa. Familiares o conduziram em carro próprio, sem medidas-padrão de atendimento pré- hospitalar. Não sabem por quanto tempo ficou desacordado e nem sobre o histórico de saúde. Quando deu entrada no pronto-socorro, encontrava-se inconsciente, com equimose e escoriações na região orbital e palpebral direita, além de escoriações na região cervical posterior e em membros à direita. Não apresentava resposta ao comando verbal, mas respirava espontaneamente com frequência normal. Pressão arterial de 140 x 90 mmHg e pupilas isocóricas. Durante a avaliação, abriu os olhos e começou a se mexer, ainda sem responder a questões ou comandos. Após 30 minutos começou a responder, mas informava não se lembrar de ter caído da escada. Considerando o quadro, a conduta adequada é',
    '[{"letter":"A","text":"tomografia de crânio, face e coluna cervical; radiografia de membros; manter o paciente em observação por 12 horas","feedback":""},{"letter":"B","text":"radiografia de crânio, coluna cervical e membros em duas posições; internar o paciente para observação","feedback":""},{"letter":"C","text":"tomografia de crânio, face e radiografia de membros; liberar o paciente para observação domiciliar","feedback":""},{"letter":"D","text":"radiografia de crânio e face; radiografia de membros; internar o paciente por 24 horas","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -3.23653,
    1.042,
    0.25,
    0.10017,
    0.88733,
    2025,
    'expert'
  ),
  (
    'e2025c10-0004-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 30 anos procurou consultório de ginecologia relatando fadiga, dismenorreia progressiva e dispareunia de profundidade. Toque vaginal: útero de volume normal, retroversofletido, dor à mobilização do colo. Com base nessas informações, a principal hipótese diagnóstica é',
    '[{"letter":"A","text":"doença inflamatória pélvica","feedback":""},{"letter":"B","text":"miomatose uterina","feedback":""},{"letter":"C","text":"cisto hemorrágico","feedback":""},{"letter":"D","text":"endometriose","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.12947,
    1.345,
    0.25,
    0.92555,
    0.91336,
    2025,
    'expert'
  ),
  (
    'e2025c10-0005-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 28 anos, estudante universitário, residente em zona urbana, comparece à Unidade Básica de Saúde (UBS) referindo aparecimento de lesão cutânea em região dorsal da mão, cerca de 1 mês após ter sofrido arranhadura de gato de rua. A lesão apresenta úlceras com presença de crostas além de nodulações próximas. Foi submetido à biópsia da lesão cutânea e cultura de material. Observou-se dermatite granulomatosa difusa, presença de corpos asteroides e material eosinofílico ao redor de células características. Qual é a principal hipótese diagnóstica e o respectivo tratamento para esse caso?',
    '[{"letter":"A","text":"Furunculose; cefalexina por 7 dias","feedback":""},{"letter":"B","text":"Herpes-zoster; aciclovir por 10 dias","feedback":""},{"letter":"C","text":"Esporotricose; itraconazol por 120 dias","feedback":""},{"letter":"D","text":"Paracoccidioidomicose; anfotericina B por 30 dias. ÁREA LIVRE 1 2","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.64261,
    1.18,
    0.25,
    0.96823,
    0.91076,
    2025,
    'expert'
  ),
  (
    'e2025c10-0006-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Observe o encaminhamento realizado por um médico de família. “À cardiologia, Encaminho o Sr. J. L. S., de 56 anos, com diagnóstico de cardiopatia isquêmica, que sofreu um infarto agudo do miocárdio há 3 meses. Tem orientação para o uso de antiagregantes plaquetários, mas tem história de úlcera péptica e teve reação alérgica ao clopidogrel e à ticlopidina. Desta forma, solicito orientação quanto à conduta preventiva.” Ao ser assistido pelo cardiologista, o paciente será atendido em qual nível de atenção e receberá que tipo de prevenção, respectivamente?',
    '[{"letter":"A","text":"Primário; secundário","feedback":""},{"letter":"B","text":"Secundário; secundário","feedback":""},{"letter":"C","text":"Terciário; terciário","feedback":""},{"letter":"D","text":"Quaternário; terciário","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.78789,
    0.495,
    0.25,
    1.05697,
    1.07366,
    2025,
    'expert'
  ),
  (
    'e2025c10-0008-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 20 anos procura atendimento médico no ambulatório de clínica médica de referência devido a quadro iniciado há 3 meses, com dor e edema articular acometendo articulações das mãos (interfalangeanas proximais, metacarpofalangeanas e punhos), assim como cotovelos, joelhos e tornozelos. Relata rigidez matinal que persiste por mais de 2 horas. O exame físico confirma dor e edema nas articulações descritas, além de mucosas hipocoradas (++/4+), sem outras alterações. A hipótese diagnóstica a ser considerada, o achado laboratorial esperado e a primeira linha de tratamento indicada são, respectivamente,',
    '[{"letter":"A","text":"esclerose sistêmica; níveis elevados de creatina quinase; prednisona","feedback":""},{"letter":"B","text":"artrite reumatoide; pesquisa de fator reumatoide (FR) positivo; metotrexato","feedback":""},{"letter":"C","text":"lúpus eritematoso sistêmico; FAN com padrão nuclear pontilhado fino denso; cloroquina","feedback":""},{"letter":"D","text":"doença mista do tecido conjuntivo; FAN com padrão nuclear pontilhado fino; azatioprina","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.13495,
    1,
    0.25,
    1.10373,
    1.19878,
    2025,
    'expert'
  ),
  (
    'e2025c10-0012-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 52 anos, branco, solteiro, comparece à consulta agendada na Unidade Básica de Saúde (UBS) desejando realizar revisão clínica e exames laboratoriais. Desde os 35 anos não faz acompanhamento de saúde. Relata história familiar de diabetes e hipertensão, e a mãe faleceu com câncer de pulmão. Sem história familiar de câncer de próstata. Fuma cerca de 2 maços por dia há 21 anos. Exame físico: pressão arterial de 120 x 80 mmHg, índice de massa corporal de 23 kg/m 2 , sem outras alterações. Considerando as recomendações de rastreamento para esse paciente, o médico de família e comunidade deve',
    '[{"letter":"A","text":"solicitar exames de colesterol total e frações, hemograma, glicemia de jejum, creatinina, PSA, radiografia de tórax, colonoscopia, realizar toque retal; orientar sobre a prática de atividade física regular","feedback":""},{"letter":"B","text":"solicitar exames de colesterol total, glicemia de jejum, pesquisa de sangue oculto nas fezes, PSA, ofertar anti-HIV e HBsAg, realizar toque retal; orientar sobre participação no grupo na UBS para abandono do tabagismo","feedback":""},{"letter":"C","text":"abordar mudanças no estilo de vida e cessação do tabagismo; acompanhar, em consultas longitudinais, as futuras possibilidades de exames complementares, quando o paciente atingir faixa etária para investigações adicionais","feedback":""},{"letter":"D","text":"solicitar exames de colesterol total, HDL e triglicerídeos, glicemia de jejum, pesquisa de sangue oculto nas fezes, ofertar testes rápidos para HIV, sífilis e hepatites B e C; realizar abordagem sobre possibilidade de cessação do tabagismo. ÁREA LIVRE","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.02738,
    1.227,
    0.25,
    0.95628,
    0.90579,
    2025,
    'expert'
  ),
  (
    'e2025c10-0013-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 32 anos, parda, ensino fundamental incompleto, trabalhadora rural, diarista no plantio de morango, procura Unidade Básica de Saúde (UBS) com queixas de tonturas, dores de cabeça, cansaço, náuseas e falta de ar. Ela referiu que desde os 20 anos sofre com dores de cabeça frequentes, mas há 2 semanas, após uma pulverização de agrotóxicos, começou a apresentar os sintomas descritos. Disse ainda que sua colega de trabalho apresentava queixas similares. Ao ouvir esses relatos, a médica da UBS suspeita de intoxicação aguda por agrotóxicos. Nessa situação, qual é a conduta adequada a ser adotada na assistência?',
    '[{"letter":"A","text":"Encaminhar como caso suspeito ao centro de referência em saúde do trabalhador estadual e formalizar denúncia ao Ministério Público do Trabalho","feedback":""},{"letter":"B","text":"Estabelecer nexo causal entre os sintomas e os resultados de exames complementares, para confirmar diagnóstico de intoxicação por agrotóxicos, e notificar a Vigilância em Saúde municipal","feedback":""},{"letter":"C","text":"Tratar os sintomas, solicitar exames complementares, notificar o caso no Sistema de Notificação de Agravos e Doenças (Sinan), conceder atestado médico e solicitar matriciamento à Vigilância em Saúde do Trabalhador","feedback":""},{"letter":"D","text":"Informar não ser responsável pelo preenchimento da comunicação de acidente de trabalho (CAT), por ser atribuição exclusiva da medicina do trabalho, no centro municipal de referência em saúde do trabalhador","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -2.24134,
    0.952,
    0.25,
    0.99933,
    0.09456,
    2025,
    'expert'
  ),
  (
    'e2025c10-0014-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Pais de um menino de 10 anos levam a criança para avaliação médica em Unidade Básica de Saúde (UBS). Relatam que seu filho se dá bem com a família até que não lhe seja permitido fazer algo que deseja. Quando isso ocorre, ele fica irritado, impulsivamente agressivo e agitado por várias horas. Assim que se acalma ou consegue o que quer, fica feliz e agradável novamente. Os pais entendem que o filho parece agir deliberadamente para aborrecer os outros e nunca assume a culpa por seus próprios erros ou mau comportamento. Relatam ainda que ele discute com adultos ou figuras de autoridade e em várias situações não aceita as regras de boa convivência com os familiares. Considerando o caso descrito, qual é o diagnóstico mais provável?',
    '[{"letter":"A","text":"Transtorno afetivo bipolar","feedback":""},{"letter":"B","text":"Transtorno de oposição desafiante","feedback":""},{"letter":"C","text":"Transtorno disruptivo da desregulação do humor","feedback":""},{"letter":"D","text":"Transtorno do déficit de atenção e hiperatividade. ÁREA LIVRE 1 4","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -3.00859,
    1.099,
    0.25,
    0.99577,
    0.88368,
    2025,
    'expert'
  ),
  (
    'e2025c10-0015-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 50 anos, queixando-se de astenia e constipação com fezes em fita. Há 15 dias, apresenta edema de membros inferiores até a raiz da região crural, bilateralmente, com pouca melhora à elevação dos membros. Ele perdeu 10 kg em 6 meses. Nega hipertensão arterial e diabetes mellitus e não faz uso de medicamento. Os exames do paciente apresentaram os seguintes resultados: ExameResultadoValor de referência Pressão arterial130 x 80 mmHg--- Peso70 kg--- Hematócrito35%48 a 69% Glicemia88 mg/dL60 a 100 mg/dL Albumina sérica1,8 g/dL3,8 a 4,8 g/dL Creatinina1,2 mg/dL0,7 a 1,3 mg/dL Triglicerídeos200 mg/dL< 150 mg/dL Proteína urinária de 24 horas 3,6 g/24 horas< 100 mg/24 horas Sedimentos proteínas +++ hemácias + (5 por campo) --- Dentre esses achados laboratoriais, quais são necessários para a definição da síndrome renal do paciente?',
    '[{"letter":"A","text":"Proteína urinária de 24 horas = 3,6 g e albumina sérica = 1,8 g/dL","feedback":""},{"letter":"B","text":"Proteína urinária de 24 horas = 3,6 g e triglicerídeos = 200 mg/dL","feedback":""},{"letter":"C","text":"Hematúria e triglicerídeos = 200 mg/dL","feedback":""},{"letter":"D","text":"Hematúria e albumina sérica = 1,8 g/dL","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.70765,
    0.3,
    0.25,
    1.06359,
    1.17815,
    2025,
    'expert'
  ),
  (
    'e2025c10-0016-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Recém-nascido de 15 dias, a termo, Apgar 8/9, peso e comprimento ao nascer de 2.600 g e 46 cm, respectivamente, com síndrome de Down, e cuja gestação não apresentou outras intercorrências. Está na consulta de puericultura com peso e comprimento atuais de 2.900 g e 47 cm, respectivamente. Para o acompanhamento pôndero-estatural, os dados devem ser plotados nas',
    '[{"letter":"A","text":"curvas de crescimento da OMS desde o nascimento até a adolescência","feedback":""},{"letter":"B","text":"curvas de crescimento específicas para síndrome de Down desde o nascimento","feedback":""},{"letter":"C","text":"curvas de crescimento da OMS, corrigindo o peso e o comprimento para síndrome de Down","feedback":""},{"letter":"D","text":"curvas de crescimento da OMS até os dois anos e, a partir daí, em curvas específicas para síndrome de Down","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    0.64139,
    1.275,
    0.25,
    0.93323,
    0.09334,
    2025,
    'expert'
  ),
  (
    'e2025c10-0017-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 20 anos, sexo masculino, vítima de colisão “automóvel a muro”, sem cinto de segurança, é atendido ainda na cena pelo Serviço Móvel de Atendimento de Urgência (SAMU). Exame físico: paciente torporoso; saturação de O 2 de 60%, em ar ambiente; frequência respiratória de 28 irpm; frequência cardíaca de 112 bpm; pressão arterial de 90 x 50 mmHg. Desvio da traqueia para a direita, turgência de veias jugulares, hipofonese de bulhas cardíacas e diminuição acentuada do murmúrio vesicular à esquerda. Qual é a conduta adequada no atendimento pré-hospitalar?',
    '[{"letter":"A","text":"Reposição volêmica","feedback":""},{"letter":"B","text":"Cricotireoidostomia","feedback":""},{"letter":"C","text":"Pericardiocentese","feedback":""},{"letter":"D","text":"Toracocentese","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.02338,
    0.544,
    0.25,
    1.05388,
    1.05938,
    2025,
    'expert'
  ),
  (
    'e2025c10-0018-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 16 anos comparece ao ambulatório para mostrar os resultados dos exames complementares solicitados na consulta anterior. Está preocupada porque todas as colegas da mesma idade já menstruaram e ela não. O fenótipo é feminino, com pelos pubianos e axilares esparsos. Os exames complementares evidenciam ausência do útero à ultrassonografia pélvica, dosagem sérica do hormônio folículo estimulante (FSH) normal, dosagem de testosterona sérica compatível com níveis do sexo masculino e cariótipo 46 XY. Com base no quadro clínico e nos dados apresentados, a principal hipótese diagnóstica dessa paciente é',
    '[{"letter":"A","text":"disgenesia gonadal","feedback":""},{"letter":"B","text":"malformação Mulleriana","feedback":""},{"letter":"C","text":"obstrução do trato genital","feedback":""},{"letter":"D","text":"insensibilidade androgênica","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    0.62682,
    1.947,
    0.25,
    0.83074,
    0.80689,
    2025,
    'expert'
  ),
  (
    'e2025c10-0019-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 82 anos, sem história prévia de hipertensão, comparece à consulta preocupada porque aferiu a pressão na farmácia há 1 semana e estava em 146 x 86 mmHg. Em outra aferição, há 2 semanas, na unidade de saúde, a pressão estava em 144 x 88 mmHg. No momento da consulta, a pressão está em 148 x 88 mmHg. Não apresenta sintomas nem está em acompanhamento de outros agravos neste momento. Qual é a abordagem adequada nesse caso?',
    '[{"letter":"A","text":"Referenciar ao cardiologista para um manejo específico","feedback":""},{"letter":"B","text":"Solicitar holter 24 horas e ecocardiograma para ampliar a avaliação","feedback":""},{"letter":"C","text":"Prescrever losartana 50 mg, 1 comprimido à noite, com monitoramento da pressão arterial na unidade","feedback":""},{"letter":"D","text":"Realizar uma conduta expectante, sem necessidade de medicamentos, com monitoramento de pressão arterial na unidade. ÁREA LIVREÁREA LIVRE 5","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    0.81822,
    0.325,
    0.25,
    1.08226,
    0.11223,
    2025,
    'expert'
  ),
  (
    'e2025c10-0020-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher travesti de 28 anos, profissional do sexo, comparece à Unidade Básica de Saúde (UBS) em demanda espontânea. Relata relações sexuais frequentes com diferentes parceiros, com uso inconsistente de preservativos, principalmente durante relações anais receptivas. Há 2 dias teve uma relação sexual desprotegida com um cliente que se recusou a usar camisinha. Nunca utilizou medicamento para profilaxia pré-exposição (PrEP) ou pós- exposição (PEP) à infecção pelo HIV. Considerando que a paciente está assintomática no momento, qual a melhor estratégia de prevenção?',
    '[{"letter":"A","text":"Prescrever PrEP após resultado não reagente para HIV; indicar PEP após tratamento inicial e orientar rastreamento de ISTs a cada 3 meses","feedback":""},{"letter":"B","text":"Oferecer teste rápido para HIV e sífilis; prescrever PrEP de início imediato; orientar sobre as vacinas disponíveis no SUS para seu grupo populacional","feedback":""},{"letter":"C","text":"Realizar testagem rápida para HIV e sífilis; prescrever PEP mediante resultado não reagente para HIV e programar início da PrEP após término da PEP","feedback":""},{"letter":"D","text":"Prescrever PEP e PrEP de forma concomitante; solicitar sorologias para ISTs; agendar retorno para analisar os resultados e revisar adesão ao tratamento","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.08921,
    1.27,
    0.25,
    0.94894,
    0.90807,
    2025,
    'expert'
  ),
  (
    'e2025c10-0021-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 21 anos comparece à consulta médica em Unidade Básica de Saúde (UBS) para avaliação de amenorreia há 4 meses, sendo descartada gravidez. Paciente relata que há 10 meses iniciou dieta para perder peso, tendo emagrecido nesse período aproximadamente 30 kg. Há 2 dias relata desmaio durante prática de exercício físico e, por isso, realizou eletrocardiograma (ECG) que indicou alterações no segmento ST e na onda T. Paciente nega histórico de diagnóstico de transtorno mental, mora sozinha e sua família é de outra cidade. Afirma manter o padrão alimentar, pois ainda quer perder peso. Ao exame físico, apresenta palidez de mucosa e turgor cutâneo diminuído. Altura = 1,63 m; peso = 39 kg (IMC = 14,7 kg/m 2 ); pressão arterial = 80 x 60 mmHg; frequência cardíaca = 55 bpm e frequência respiratória = 15 irpm. Qual é a conduta adequada nesse momento?',
    '[{"letter":"A","text":"Solicitar internação em enfermaria de clínica médica","feedback":""},{"letter":"B","text":"Encaminhar para internação em enfermaria de saúde mental","feedback":""},{"letter":"C","text":"Continuar a investigação para causas da amenorreia na UBS","feedback":""},{"letter":"D","text":"Acompanhar em ambulatório do Centro de Atenção Psicossocial (CAPs). ÁREA LIVRE","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.04374,
    0.343,
    0.25,
    1.08555,
    1.09704,
    2025,
    'expert'
  ),
  (
    'e2025c10-0022-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 65 anos iniciou quadro de lentidão dos movimentos há 6 meses, com dificuldade para amarrar sapatos, abotoar roupas e digitar. Ao caminhar, apresentava passos mais curtos e sensação de instabilidade, com 1 episódio de queda. Concomitantemente apresentou tremores nas mãos, de repouso, associados à rigidez e alteração do padrão do sono. Nega alterações de memória e cognição. Ao exame físico apresentava fácies em máscara, marcha em pequenos passos, frequência cardíaca de 88 bpm com ausculta sem alterações, pressão arterial de 130 x 80 mmHg, tremores assimétricos na manobra dos braços estendidos, hipertonia em roda dentada. A ressonância nuclear magnética realizada há 2 semanas constatou atrofia cerebral compatível com a idade. O tratamento medicamentoso inicial recomendado para o caso clínico será',
    '[{"letter":"A","text":"levodopa e carbidopa","feedback":""},{"letter":"B","text":"donepezila e memantina","feedback":""},{"letter":"C","text":"propranalol e amantadina","feedback":""},{"letter":"D","text":"atorvastatina e baclofeno","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.71556,
    1.245,
    0.25,
    0.94762,
    0.92262,
    2025,
    'expert'
  ),
  (
    'e2025c10-0023-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'A violência contra adolescentes pode ter várias causas e atores. Os sinais que demonstram essas ações podem ser indiretos, mas devem ser observados pelos profissionais da saúde. Assinale a alternativa com a situação em que se deve notificar o Conselho Tutelar.',
    '[{"letter":"A","text":"Manuel, 15 anos, abandonado pelos pais e sob os cuidados de uma família acolhedora, apresenta febre, vômitos, petéquias que evoluem para púrpuras em MMII e SS, rigidez de nuca e história vacinal desconhecida","feedback":""},{"letter":"B","text":"Michele, 13 anos, está morando temporariamente com os tios enquanto a mãe faz um curso no exterior. Há 1 mês vem apresentando equimoses em face, pernas, coxas, em vários estágios de evolução, e evita falar sobre o fato","feedback":""},{"letter":"C","text":"Felipe, 11 anos, acolhido em um abrigo desde os 9 anos, há 3 dias está mais recolhido no seu quarto e dorme quase o tempo todo. Apresenta febre, muita dor no corpo e retro- orbitária, sangramento gengival quando escova os dentes e petéquias pelo corpo","feedback":""},{"letter":"D","text":"Edilene, 16 anos, que cumpre medidas socioeducativas em uma instituição do Estado, apresenta várias equimoses nos membros superiores e inferiores, além do tronco. Refere também suores noturnos, febre inexplicada, perda de peso e linfonodos aumentados de tamanho em região cervical, supraclavicular e inguinal bilateralmente. ÁREA LIVRE 1 6","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -3.53761,
    1.25,
    0.25,
    0.99617,
    0.80534,
    2025,
    'expert'
  ),
  (
    'e2025c10-0024-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente do sexo feminino, 27 anos, é atendida em Unidade de Pronto Atendimento (UPA) com história de dor abdominal, com início em epigástrio há dois dias, contínua, sem fatores de melhora, associada a náuseas e perda de apetite, evoluindo para dor em fossa ilíaca direita há 1 dia e febre de 38,2 °C no dia do atendimento. Nega comorbidades, cirurgias prévias ou uso de medicações regulares. Relata que a última menstruação foi há 23 dias, e apresenta ciclos regulares de 28 dias. Exame físico: regular estado geral, corada, desidratada +/4+, eupneica, anictérica, acianótica; ausculta pulmonar e cardíaca sem alterações; ruídos hidroaéreos diminuídos, descompressão brusca dolorosa em quadrante inferior de abdome à direita. ExameResultadoValor de referência Hemoglobina10,7 g/dL11,5 a 15,5 g/dL Hematócrito37%38 a 52% Leucócitos totais 13.400/mm 3 4.000 a 11.000/mm 3 Bastonetes7%0 a 5% Urina25 leucócitos/campo-- Hemácias8 hemácias/campo-- Beta-hCG sérico negativo-- Considerando o diagnóstico mais provável, a conduta adequada é',
    '[{"letter":"A","text":"iniciar antibioticoterapia empírica até resultado de exame de urocultura","feedback":""},{"letter":"B","text":"realizar tomografia computadorizada de abdome e iniciar metotrexato","feedback":""},{"letter":"C","text":"iniciar antibioticoterapia empírica e acompanhamento ambulatorial","feedback":""},{"letter":"D","text":"realizar ultrassonografia de abdome e solicitar parecer cirúrgico","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -2.61062,
    1.415,
    0.25,
    0.96752,
    0.00791,
    2025,
    'expert'
  ),
  (
    'e2025c10-0025-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Multípara, 37 semanas, obesa, apresentando diabetes mellitus gestacional controlada com insulina NPH e regular. Evoluiu para parto normal, e o recém-nascido pesou 3.300 g. A conduta no puerpério imediato deve ser',
    '[{"letter":"A","text":"suspender insulinoterapia","feedback":""},{"letter":"B","text":"iniciar hipoglicemiante oral","feedback":""},{"letter":"C","text":"manter insulina NPH em 1/3 da dose da gravidez","feedback":""},{"letter":"D","text":"manter insulinoterapia com a dosagem do pré-natal. ÁREA LIVRE","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    0.34177,
    0.814,
    0.25,
    1.00878,
    1.01384,
    2025,
    'expert'
  ),
  (
    'e2025c10-0026-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 34 anos se dirige à Unidade Básica de Saúde (UBS) com febre (38,5 °C), dores de moderada intensidade e manchas no corpo há 3 dias. No dia da consulta, iniciou com dores abdominais e vômitos incontroláveis. Exame físico: prostrado, mucosas coradas, extremidades bem perfundidas. Pressão arterial de 120 x 80 mmHg; frequência respiratória de 16 irpm; frequência cardíaca de 80 bpm. Leve dor à palpação abdominal, sem outras alterações. Qual a hipótese diagnóstica e o manejo, respectivamente?',
    '[{"letter":"A","text":"Dengue grupo B. Prescrever hidratação oral, analgésico e antiemético; solicitar hemograma, plaquetas e antígeno NS1; realizar acompanhamento domiciliar após exames","feedback":""},{"letter":"B","text":"Dengue grupo C. Prescrever hidratação oral, analgésico e antiemético; solicitar hemograma, plaquetas e anticorpo IgM; realizar acompanhamento ambulatorial após exames","feedback":""},{"letter":"C","text":"Dengue grupo C. Prescrever hidratação parenteral, analgésico e antiemético; solicitar hemograma, plaquetas e antígeno NS1; manter em leito de observação até estabilização","feedback":""},{"letter":"D","text":"Dengue grupo B. Prescrever hidratação parenteral, analgésico e antiemético; solicitar hemograma, plaquetas, antígeno NS1 e anticorpo IgM; manter em leito de observação até estabilização","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.46483,
    1.298,
    0.25,
    0.93702,
    0.09189,
    2025,
    'expert'
  ),
  (
    'e2025c10-0027-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 48 anos, auxiliar de pedreiro, procura Unidade Básica de Saúde (UBS) com queixa de dor lombar iniciada há 3 semanas, de instalação insidiosa, sem irradiação. Relata que a dor piora ao final do dia e melhora parcialmente com repouso e uso de paracetamol. Nega perda de peso, febre, traumas, incontinência ou fraqueza nos membros inferiores. Ao exame físico, apresenta dor à palpação paravertebral em região lombar, sem alterações neurológicas. Com base na história clínica e no exame físico, qual o próximo passo na condução desse caso?',
    '[{"letter":"A","text":"Solicitar ressonância magnética da coluna lombar e encaminhar para a ortopedia","feedback":""},{"letter":"B","text":"Solicitar radiografia lombar, prescrever corticoide oral e agendar o retorno após 10 dias","feedback":""},{"letter":"C","text":"Orientar repouso, fornecer atestado de 7 dias e otimizar a analgesia com antidepressivo tricíclico","feedback":""},{"letter":"D","text":"Explicar a natureza benigna, orientar analgesia e atividade física leve, com reavaliação em 4 a 6 semanas. ÁREA LIVRE 7","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.32924,
    1.376,
    0.25,
    0.93814,
    0.88218,
    2025,
    'expert'
  ),
  (
    'e2025c10-0028-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    '“Internações sem consentimento aumentam na Cracolândia, em meio a denúncias de agressões”. ZYLBERKAN, M.; KRUSE, T. Folha de S. Paulo, 3 jul. 2024. Notícias como esta têm se tornado frequentes em jornais brasileiros nos últimos anos. Alguns municípios têm criado leis locais próprias para as internações involuntárias que muitas vezes contradizem as leis federais sobre o tema. Sobre a internação involuntária no Brasil, é correto afirmar que',
    '[{"letter":"A","text":"a internação involuntária é determinada, de acordo com a legislação, pela Justiça","feedback":""},{"letter":"B","text":"é autorizada por médico devidamente registrado no Conselho Regional de Medicina","feedback":""},{"letter":"C","text":"no prazo de 15 dias, a internação deve ser comunicada ao Ministério Público Federal","feedback":""},{"letter":"D","text":"o término da internação involuntária ocorrerá por solicitação do Ministério Público Municipal","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    0.12847,
    0.3,
    0.25,
    1.08155,
    1.16861,
    2025,
    'expert'
  ),
  (
    'e2025c10-0029-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 68 anos, em tratamento crônico irregular de hipertensão arterial sistêmica, diabetes mellitus e fibrilação atrial, é admitido em Unidade de Pronto Atendimento (UPA) com quadro de rebaixamento do nível de consciência e déficit neurológico do lado esquerdo, de predomínio braquiofacial. Segundo o acompanhante, o paciente tinha ido se deitar havia 90 minutos, sem qualquer sintoma antes de ser encontrado com o transtorno observado. Foi levado ao hospital, onde deu entrada 30 minutos após constatado o déficit focal. Ao exame físico, paciente com 9 pontos na escala de coma de Glasgow modificada, exibindo hemiparesia acentuada à esquerda, pressão arterial de 170 x 100 mmHg em ambos os membros superiores, com ritmo cardíaco irregular, frequência cardíaca média de 96 bpm. Não há outras alterações expressivas ao exame físico. Glicemia capilar de 285 mg/dL; demais exames laboratoriais não revelam anormalidades. A tomografia computadorizada de crânio sem contraste revela área de atenuação de densidade em cerca de 40% do território da artéria cerebral média direita, cujo laudo é obtido cerca de 3 horas após o último momento em que o paciente foi visto sem déficits. O médico da unidade explica ao acompanhante que, apesar dos potenciais benefícios da terapia trombolítica em pacientes com acidente vascular encefálico isquêmico, o paciente apresenta contraindicação em função de',
    '[{"letter":"A","text":"apresentar extensão de isquemia superior a 1/3 do território da artéria cerebral média acometida","feedback":""},{"letter":"B","text":"haver decorrido período de tempo superior ao limite máximo tolerável desde o início do déficit","feedback":""},{"letter":"C","text":"evoluir com glicemia acima de 200 mg/dL com intervalo maior que 2 horas pós-prandial","feedback":""},{"letter":"D","text":"ter níveis pressóricos superiores aos permitidos para o uso do fármaco","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.00887,
    0.921,
    0.25,
    0.99296,
    0.99226,
    2025,
    'expert'
  ),
  (
    'e2025c10-0030-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Menino de 6 anos é levado à Unidade Básica de Saúde (UBS) com queixa de fimose. Mãe relata balanopostites frequentes, sendo o primeiro episódio com 1 ano de vida. Nega infecções do trato urinário. Ao exame físico, apresenta prepúcio cobrindo toda a glande que, quando tracionado, expõe meato uretral e anel fibrótico prepucial. Sobre o caso, assinale a alternativa correta.',
    '[{"letter":"A","text":"Trata-se de fimose fisiológica, necessitando de exercícios de redução e higiene do prepúcio","feedback":""},{"letter":"B","text":"Há indicação cirúrgica na adolescência, pois já está apresentando exposição de meato uretral","feedback":""},{"letter":"C","text":"Há indicação cirúrgica, pois a criança apresenta balanopostites recorrentes com fibrose prepucial","feedback":""},{"letter":"D","text":"Indica-se uso de creme de betametasona e hialuronidase por 4 semanas, uma vez que apresenta exposição de meato uretral","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.34509,
    0.71,
    0.25,
    1.02289,
    1.02998,
    2025,
    'expert'
  ),
  (
    'e2025c10-0031-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 72 anos foi atendida em hospital de médio porte. Relatava emagrecimento e dor abdominal com irradiação para região dorsal há 3 meses; há 1 mês a urina ficou mais escura, começou a apresentar prurido cutâneo intenso e icterícia em escleras. Ao exame físico, encontrava-se ictérica +++/4+, emagrecida; exame do abdome com fígado palpável abaixo da borda costal direita, assim como uma massa bem definida, de consistência cística, não dolorosa em hipocôndrio direito. Nesse caso, o mais adequado é solicitar',
    '[{"letter":"A","text":"ultrassonografia para avaliar colecistite crônica calculosa","feedback":""},{"letter":"B","text":"tomografia computadorizada para avaliar vias biliares e pâncreas","feedback":""},{"letter":"C","text":"colangiopancreatografia por ressonância para avaliar coledocolitíase","feedback":""},{"letter":"D","text":"biópsia percutânea com agulha da massa palpada para avaliar neoplasia","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.41917,
    1.061,
    0.25,
    0.97318,
    0.09555,
    2025,
    'expert'
  ),
  (
    'e2025c10-0032-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente G5P3C1, 35 anos, idade gestacional de 15 semanas por ecografia relizada com 8 semanas, hipertensa crônica em uso de enalapril, antecedente de pré-eclâmpsia. Comparece à consulta de pré-natal na Unidade Básica de Saúde (UBS) com pressão arterial de 140 x 90 mmHg. Qual é a conduta medicamentosa indicada para essa paciente?',
    '[{"letter":"A","text":"Captopril, varfarina e ácido acetilsalicílico","feedback":""},{"letter":"B","text":"Furosemida, varfarina e carbonato de cálcio","feedback":""},{"letter":"C","text":"Losartana, enoxaparina e carbonato de cálcio","feedback":""},{"letter":"D","text":"Alfa-metildopa, ácido acetilsalicílico e carbonato de cálcio. ÁREA LIVRE ÁREA LIVRE 1 8","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -3.31628,
    1.806,
    0.25,
    0.09656,
    0.63295,
    2025,
    'expert'
  ),
  (
    'e2025c10-0033-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 48 anos busca atendimento na Unidade Básica de Saúde (UBS) para reiniciar tratamento para tuberculose. Paciente refere que iniciou o tratamento poliquimioterápico há 6 meses, quando foi diagnosticado com tuberculose; porém, há 2 meses, interrompeu o acompanhamento na sua unidade de origem devido ao uso de substâncias psicoativas. Ele se mudou para o território da unidade há 15 dias e foi visitado pelo agente comunitário, que o orientou a procurar atendimento médico para avaliação e retomada do tratamento. Foram solicitados, inicialmente, o teste rápido molecular para tuberculose (TRM-TB), baciloscopia de escarro e radiografia de tórax. Qual a conduta adequada para esse caso?',
    '[{"letter":"A","text":"Se o TRM-TB for positivo, sem resistência à rifampicina, e a baciloscopia for negativa, reiniciar o esquema básico","feedback":""},{"letter":"B","text":"Se o TRM-TB for negativo e a baciloscopia for positiva, reiniciar o esquema básico, desde que a resistência à rifampicina seja positiva","feedback":""},{"letter":"C","text":"Se o TRM-TB for negativo e a baciloscopia for positiva, solicitar cultura de escarro com teste de sensibilidade e reiniciar o esquema básico enquanto se aguarda a cultura","feedback":""},{"letter":"D","text":"Se o TRM-TB for positivo, com resistência à rifampicina, e a baciloscopia for positiva, solicitar cultura de escarro com teste de sensibilidade e reiniciar o esquema básico enquanto se aguarda a cultura","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.07522,
    0.3,
    0.25,
    1.10797,
    1.12384,
    2025,
    'expert'
  ),
  (
    'e2025c10-0034-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Uma instituição de saúde está pesquisando um novo teste de triagem para hanseníase, com sensibilidade de 92% e especificidade de 65%, aplicado em uma população com baixa prevalência da doença. Nesse contexto, é correto afirmar que',
    '[{"letter":"A","text":"quase todos os testes positivos indicarão verdadeiros casos de hanseníase, diante da elevada sensibilidade do teste","feedback":""},{"letter":"B","text":"o número de falsos-positivos será elevado, devido à baixa especificidade do teste e à baixa prevalência da doença","feedback":""},{"letter":"C","text":"o número de falsos-negativos será elevado, reduzindo a capacidade do teste em detectar casos reais","feedback":""},{"letter":"D","text":"a elevada sensibilidade do teste o torna ideal para a confirmação do diagnóstico de hanseníase. ÁREA LIVRE","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -0.94633,
    0.401,
    0.25,
    1.06662,
    1.10299,
    2025,
    'expert'
  ),
  (
    'e2025c10-0035-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 52 anos chega ao acolhimento de Unidade Básica de Saúde (UBS), muito chorosa, e relata: “Estou com dificuldade para dormir, não tenho comido direito, desde o ocorrido ... é o meu filho, sabe ... ele morreu há 3 dias ... e a dor no meu coração está muito forte, quase insuportável”. A paciente chora copiosamente e diz que sonha com uma pessoa gritando o nome de seu filho, relembrando o momento em que o tinha encontrado na rua, vítima de atropelamento. Após o primeiro acolhimento, ela fica um pouco mais calma, relatando que não pensa em se matar, que nunca tinha sido atendida por psiquiatra ou tomado medicamentos antes, mas que nesse momento precisa de muita ajuda. Diante do caso, qual a conduta adequada?',
    '[{"letter":"A","text":"Prescrever inibidor de recaptação de serotonina para alívio dos sintomas depressivos e ansiosos","feedback":""},{"letter":"B","text":"Encaminhar ao Centro de Atenção Psicossocial (CAPs) para seguimento intensivo com médico psiquiatra","feedback":""},{"letter":"C","text":"Encaminhar para psicologia na atenção secundária para ofertar terapia psicanalítica breve","feedback":""},{"letter":"D","text":"Acompanhar longitudinalmente para observação e ofertar apoio pela equipe da UBS","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.07482,
    1.616,
    0.25,
    0.89312,
    0.85856,
    2025,
    'expert'
  ),
  (
    'e2025c10-0036-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 86 anos é levada pela filha à consulta no ambulatório de clínica médica, com queixa de quedas frequentes. A paciente tem diagnóstico prévio de hipertensão arterial sistêmica, diabetes mellitus tipo 2, dislipidemia, depressão, déficit cognitivo leve e constipação intestinal. Está em uso de losartana, hidroclorotiazida, atenolol, metformina, gliclazida, rosuvastatina, escitalopram, donepezila e lactulose. Segundo a filha da paciente, as quedas ocorrem em diversos horários do dia, mais frequentemente na madrugada, ao se levantar para ir ao banheiro. Ao exame físico, a idosa apresenta leve bradipsiquismo e sinais de sarcopenia; pressão arterial do membro superior direito de 138 x 92 mmHg, quando deitada, e 110 x 70 mmHg, quando sentada. O plano terapêutico apropriado ao contexto desse caso deve incluir',
    '[{"letter":"A","text":"sugerir avaliação oftalmológica para investigação de catarata","feedback":""},{"letter":"B","text":"encaminhar ao neurologista para investigar a presença de disautonomia","feedback":""},{"letter":"C","text":"rever a polifarmácia para reduzir fármacos indutores de hipotensão arterial","feedback":""},{"letter":"D","text":"adicionar fármaco capaz de elevar os níveis tensionais, como a fludrocortisona. ÁREA LIVRE 9","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -2.33473,
    1.37,
    0.25,
    0.96412,
    0.82351,
    2025,
    'expert'
  ),
  (
    'e2025c10-0037-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Menino, 10 anos, morador de área urbana, está em avaliação no pronto-atendimento por apresentar dor em cotovelo direito há 1 dia. Há 1 semana, iniciou quadro de febre de 38,5 °C, 1 a 2 picos ao dia, associada à dificuldade de deambular devido ao joelho direito apresentar-se “doloroso e inchado”. Após 4 dias, percebeu melhora da dor no joelho, porém o tornozelo direito começou a ficar “inchado e um pouco avermelhado”, doloroso, com melhora em 2 dias. Há 3 semanas, havia se queixado de dor de garganta. Sem outras queixas. Nega contato com animais domésticos. No momento do atendimento, está com dificuldade para movimentar o cotovelo direito por causa da dor e do edema, frequência cardíaca de 110 bpm e 2 bulhas rítmicas normofonéticas, com sopro sistólico de 3+/6+. Restante do exame físico sem anormalidades. Considerando o quadro clínico apresentado, o agente etiológico e o tratamento de escolha são, respectivamente,',
    '[{"letter":"A","text":"Borrelia burgdorferi; doxiciclina","feedback":""},{"letter":"B","text":"Staphylococcus aureus; oxacilina","feedback":""},{"letter":"C","text":"Treponema pallidum; penicilina G benzatina","feedback":""},{"letter":"D","text":"Streptococcus pyogenes; penicilina G benzatina","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -1.36494,
    1.205,
    0.25,
    0.96089,
    0.91517,
    2025,
    'expert'
  ),
  (
    'e2025c10-0038-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 58 anos deu entrada no pronto-socorro com dor epigástrica irradiada para as costas, iniciada há 2 horas, progressiva, pós-prandial, acompanhada de náuseas, vômitos e sudorese. Relata episódios semelhantes no último ano, que melhoraram com uso de analgésico. Tabagista ativo, alcoolista de 8 doses de destilado por dia há 33 anos, nega comorbidades. Exame físico: corado, acianótico, anictérico, sudoreico, fácies de dor, agitado. Índice de massa corporal de 23 kg/m 2 ; pressão arterial de 150 x 90 mmHg; frequência cardíaca de 74 bpm; frequência respiratória de 18 irpm; temperatura axilar de 37 o C. Abdome globoso, distendido, timpânico, peristalse presente, doloroso à palpação do epigástrio e hipocôndrio esquerdo. Os exames laboratoriais apresentam os seguintes resultados: ExameResultadoValor de referência Hematócrito46%36 a 46% Hemoglobina15,0 g/dL12,0 a 15,0 g/dL Leucócitos12.000/mm 3 4.000 a 10.000/mm 3 Glicose120 mg/dL70 a 99 mg/dL Bilirrubina total1,2 mg/dL0,3 a 1,3 mg/dL Ureia38 mg/dL15 a 40 mg/dL Cálcio8,9 mg/dL8,7 a 10,2 mg/dL Amilase35 U/L20 a 96 U/L Lipase12 U/L3 a 43 U/L Fosfatase alcalina81 U/L33 a 96 U/L LDH127 U/L100 a 190 U/L TGO36 U/L5 a 40 U/L Qual é o provável diagnóstico?',
    '[{"letter":"A","text":"Colangite aguda","feedback":""},{"letter":"B","text":"Colecistite aguda","feedback":""},{"letter":"C","text":"Doença ulcerosa péptica","feedback":""},{"letter":"D","text":"Pancreatite crônica","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    0.43672,
    0.61,
    0.25,
    1.04004,
    1.05472,
    2025,
    'expert'
  ),
  (
    'e2025c10-0039-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Primigesta de 29 anos, com 41 semanas de gestação e pré-natal de risco habitual, comparece à Unidade Básica de Saúde (UBS) para consulta de rotina. Ela está preocupada com a duração da gravidez e deseja saber quais serão os próximos passos. A paciente está assintomática, relata movimentação fetal presente, e o exame físico está normal para a idade gestacional. Perfil biofísico fetal realizado há 1 dia encontra-se dentro da normalidade. Considerando o quadro clínico apresentado e a idade gestacional, a conduta é',
    '[{"letter":"A","text":"orientar repouso domiciliar, com planejamento da indução do parto após 42 semanas","feedback":""},{"letter":"B","text":"solicitar dopplervelocimetria obstétrica para avaliar o bem- estar fetal e planejar o manejo com base no resultado","feedback":""},{"letter":"C","text":"realizar amnioscopia para verificar a presença de mecônio no líquido amniótico e planejar o manejo com base no resultado","feedback":""},{"letter":"D","text":"solicitar perfil biofísico fetal e cardiotocografia a cada 2 a 3 dias e planejamento da indução do parto até 41 semanas e 6 dias","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.83601,
    0.662,
    0.25,
    1.03144,
    0.10456,
    2025,
    'expert'
  ),
  (
    'e2025c10-0041-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 21 anos, portador de diabetes mellitus tipo 1, diagnosticado há 5 anos, foi levado à Unidade de Pronto Atendimento (UPA) devido à dor abdominal, náuseas e vômitos. Familiares informam que está sem utilizar insulina há 3 dias por dificuldades financeiras. No exame físico, encontra-se torporoso, desidratado, com hálito cetótico e dor abdominal à palpação profunda de forma generalizada. Ao exame, frequência cardíaca de 112 bpm; frequência respiratória de 38 irpm; pressão arterial de 110 x 70 mmHg. Os exames laboratoriais na admissão indicam: ExameResultadoValor de referência Glicemia472 mg/dL60 a 100 mg/dL Gasometria arterialpH de 7,27,35 a 7,45 Bicarbonato10 mEq/L22 a 26 mEq/L Creatinina1,6 mg/dL0,7 a 1,3 mg/dL Potássio sérico3,0 mEq/L3,5 a 5,5 mEq/L O diagnóstico e a conduta inicial indicada para esse paciente são, respectivamente,',
    '[{"letter":"A","text":"pancreatite aguda; iniciar dieta oral zero","feedback":""},{"letter":"B","text":"estado hiperosmolar hiperglicêmico; iniciar insulinoterapia","feedback":""},{"letter":"C","text":"cetoacidose diabética; prescrever solução fisiológica a 0,9 por cento","feedback":""},{"letter":"D","text":"insuficiência renal aguda; prescrever bicarbonato de sódio","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -2.54143,
    1.658,
    0.25,
    0.94986,
    0.71204,
    2025,
    'expert'
  ),
  (
    'e2025c10-0042-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Recém-nascido de 14 dias, hipoativo e com desconforto respiratório, é levado para avaliação na Unidade de Pronto Atendimento (UPA). Antecedentes obstétricos: não foi realizado pré-natal e o parto ocorreu a termo no domicílio. Exame clínico: hipoativo e pouco responsivo, hipocorado, cianótico. Aparelho respiratório: 70 irpm com tiragem subcostal. Murmúrio vesicular diminuído bilateralmente. Saturação de O2 em ar ambiente de 82%. Aparelho cardiovascular: pulsos débeis, tempo de perfusão capilar de 5 segundos. Frequência cardíaca de 160 bpm, com ritmo cardíaco regular. Abdome globoso, com fígado a 2,5 cm do rebordo costal direito, presença de halo de hiperemia e edema em torno do coto umbilical. O diagnóstico e as condutas adequadas são, respectivamente,',
    '[{"letter":"A","text":"choque cardiogênico; manter suporte ventilatório, evitar excesso de volume intravascular devido a risco de piora, administrar fármacos vasoativos e prostaglandina E1","feedback":""},{"letter":"B","text":"choque neurogênico; manter suporte ventilatório, acesso venoso para fase rápida de fluido cristaloide isotônico, hidratação venosa de manutenção e administrar corticoide endovenoso","feedback":""},{"letter":"C","text":"choque obstrutivo; manter suporte ventilatório, acesso venoso para fase rápida de fluido cristaloide isotônico e corrigir rapidamente a causa subjacente com descompressão torácica com agulha","feedback":""},{"letter":"D","text":"choque distributivo; manter suporte ventilatório, acesso venoso para fase rápida de fluido cristaloide isotônico, hidratação venosa de manutenção, administrar antibióticos e fármacos vasoativos","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -1.16412,
    0.963,
    0.25,
    0.98538,
    1.00375,
    2025,
    'expert'
  ),
  (
    'e2025c10-0044-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Parturiente de 29 anos, sem comorbidades, esteve em trabalho de parto por 8 horas e evoluiu para parto vaginal. Após 10 minutos do desprendimento do feto, ainda não se observou a expulsão da placenta. A paciente está estável e sem sinais de hemorragia. Diante do quadro apresentado, a conduta a ser adotada é',
    '[{"letter":"A","text":"aguardar a expulsão espontânea da placenta, sem intervenções adicionais, e observar sinais de separação","feedback":""},{"letter":"B","text":"realizar tração controlada do cordão umbilical, enquanto se estabiliza o útero com a mão suprapúbica","feedback":""},{"letter":"C","text":"iniciar curagem placentária, devido ao tempo transcorrido sem desprendimento placentário","feedback":""},{"letter":"D","text":"administrar uterotônico adicional e realizar massagem uterina para auxiliar a dequitação","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.05497,
    0.34,
    0.25,
    1.08238,
    1.11009,
    2025,
    'expert'
  ),
  (
    'e2025c10-0045-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 27 anos, em regime fechado em penitenciária, queixa-se de tosse há 2 semanas. Considerando a situação na qual se encontra esse paciente, o médico de família e comunidade deve',
    '[{"letter":"A","text":"encaminhar para internação clínica, objetivando rapidez no diagnóstico e garantia da segurança","feedback":""},{"letter":"B","text":"solicitar radiografia de tórax, pesquisa laboratorial de Mycobacterium tuberculosis e garantir o tratamento em caso de positividade","feedback":""},{"letter":"C","text":"solicitar internação social, a fim de garantir tratamento supervisionado, observado diretamente por 6 meses, caso seja confirmada a tuberculose","feedback":""},{"letter":"D","text":"aguardar evolução, com uso de sintomáticos; caso a tosse persista por mais de 3 semanas, proceder à investigação diagnóstica de tuberculose. 11","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -1.26544,
    0.659,
    0.25,
    1.03142,
    1.03284,
    2025,
    'expert'
  ),
  (
    'e2025c10-0046-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 32 anos apresenta quadro de dor lombar crônica de início insidioso, com duração aproximada de 6 meses, que piora pela manhã e melhora com o movimento. Refere rigidez matinal, principalmente nas regiões lombar e sacroilíaca, com duração de mais de 30 minutos, com dor nas articulações sacroilíacas e sensação de fadiga durante as últimas semanas. Não há histórico de trauma. A história familiar é positiva para doenças reumatológicas, mas o paciente desconhece diagnósticos específicos. O painel de autoanticorpos apresenta: Anticorpo antinuclear (ANA) Positivo Título 1:80 Padrão homogêneo/difuso Anticorpo anti-DNA dupla hélice Negativo Antígeno leucocitário humano B27 (HLA-B27) Positivo Fator reumatoideNegativo Anticorpo anti-CCPNegativo Anticorpo anti-RoNegativo Anticorpo anti-LaNegativo Com base no caso clínico e nos exames laboratoriais apresentados, qual é o diagnóstico mais provável?',
    '[{"letter":"A","text":"Artrite reativa","feedback":""},{"letter":"B","text":"Artrite psoriática","feedback":""},{"letter":"C","text":"Espondilite anquilosante","feedback":""},{"letter":"D","text":"Lúpus eritematoso sistêmico","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -2.04348,
    1.614,
    0.25,
    0.93573,
    0.76313,
    2025,
    'expert'
  ),
  (
    'e2025c10-0047-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Adolescente de 12 anos, sexo feminino, é levada à Unidade Básica de Saúde (UBS) para verificar se suas vacinas estão atualizadas. Até os 8 anos, todas as vacinas preconizadas pelo Ministério da Saúde para o biênio 2024-2025 foram feitas, sendo que tomou 1 dose da vacina contra febre amarela aos 9 meses. Nesse momento, deve receber as vacinas',
    '[{"letter":"A","text":"HPV, reforço da hepatite B e dT","feedback":""},{"letter":"B","text":"reforço da hepatite B, dT e SCR","feedback":""},{"letter":"C","text":"HPV, meningocócica ACWY e febre amarela","feedback":""},{"letter":"D","text":"SCR, meningocócica ACWY e febre amarela. ÁREA LIVRE","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -1.20016,
    1.054,
    0.25,
    0.98217,
    0.93291,
    2025,
    'expert'
  ),
  (
    'e2025c10-0048-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente masculino, 36 anos, é tabagista e trabalha como ascensorista. Procura atendimento no ambulatório queixando-se de tosse seca, persistente por mais de 3 semanas, acompanhada de febre vespertina, dificuldade respiratória durante esforços e dor infraescapular à esquerda. Exame físico: bom estado geral, orientado, emagrecido, descorado, hidratado, afebril. Ausculta cardíaca sem alterações; ausculta pulmonar com murmúrios vesiculares diminuídos e percussão maciça em base do tórax à esquerda. Com base no diagnóstico provável, quais são, respectivamente, o exame complementar e a conduta adequada ao caso?',
    '[{"letter":"A","text":"Ressonância magnética; programação cirúrgica","feedback":""},{"letter":"B","text":"Tomografia de tórax; lobectomia segmentar","feedback":""},{"letter":"C","text":"Tomografia de tórax; drenagem de tórax","feedback":""},{"letter":"D","text":"Ultrassonografia; toracocentese","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    1.77005,
    0.777,
    0.25,
    0.09992,
    1.06245,
    2025,
    'expert'
  ),
  (
    'e2025c10-0049-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Nulípara de 30 anos, com diagnóstico de lúpus eritematoso sistêmico e história recente de trombose venosa, apresenta ciclos menstruais prolongados de 8 a 10 dias, com intenso sangramento e cólicas fortes, busca orientação sobre métodos contraceptivos. Considerando os critérios de elegibilidade para uso de anticoncepção e o quadro clínico, qual é a melhor opção de contracepção?',
    '[{"letter":"A","text":"DIU de cobre","feedback":""},{"letter":"B","text":"DIU de levonorgestrel","feedback":""},{"letter":"C","text":"Anticoncepcional injetável mensal","feedback":""},{"letter":"D","text":"Pílula anticoncepcional combinada contínua","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.70808,
    1.213,
    0.25,
    0.95204,
    0.09305,
    2025,
    'expert'
  ),
  (
    'e2025c10-0050-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 55 anos, com diagnóstico de diabetes mellitus, foi em consulta de rotina em Unidade Básica de Saúde (UBS) levando exames laboratoriais solicitados pelo médico na consulta anterior. Faz uso de metformina 850 mg, 3 vezes ao dia, e glicazida 30 mg, 1 vez ao dia, há mais de 6 meses. Os exames laboratoriais atuais apresentam hemoglobina glicada de 9,5% e creatinina sérica de 0,8 mg/dL. Qual das condutas é a mais adequada para o seguimento desse caso?',
    '[{"letter":"A","text":"Suspender os medicamentos orais, iniciar insulina NPH 10 UI subcutânea pela manhã e 20 UI à noite. Monitorar a glicemia pré-prandial, e, quando estiver controlada, medir a glicemia pós-prandial para avaliação da introdução da insulina regular","feedback":""},{"letter":"B","text":"Aumentar a glicazida para 60 mg ao dia, aumentar a metformina para 1 g, 3 vezes ao dia, repetir exames em 1 mês. Iniciar insulina se estiverem alterados; pactuar com o paciente a possibilidade de insulinização no retorno","feedback":""},{"letter":"C","text":"Manter a dose de metformina e glicazida, iniciar insulina NPH 10 UI subcutânea à noite, associada à monitorização glicêmica de jejum. Ajustar 2 a 3 UI a cada 2 a 3 dias, até atingir a meta da glicemia de jejum","feedback":""},{"letter":"D","text":"Trocar a glicazida por glibenclamida 20 mg por dia, aumentar a metformina para 1 g, 3 vezes ao dia, solicitar novos exames em 1 mês. Pactuar com o paciente a possibilidade de insulinização no retorno. 1 12","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.39599,
    0.817,
    0.25,
    1.01043,
    1.00918,
    2025,
    'expert'
  ),
  (
    'e2025c10-0051-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 38 anos retorna a ambulatório de clínica médica de um hospital de atenção secundária, onde faz acompanhamento clínico de retocolite ulcerativa. Analisando os exames complementares solicitados na última consulta, o médico atendente observa elevações significativas da fosfatase alcalina e gama-GT, com discreta elevação dos níveis séricos de aminotransferases, sem hiperbilirrubinemia. Questionado, o paciente refere apenas leve desconforto no hipocôndrio direito. Ao exame físico, não há icterícia, febre ou presença de sinal de Murphy. Considerando a doença de base do caso, o exame complementar indicado e seu resultado provável são, respectivamente,',
    '[{"letter":"A","text":"tomografia computadorizada de abdome; lesão tumoral presente ao nível do hilo hepático","feedback":""},{"letter":"B","text":"colangiopancreatografia retrógrada endoscópica; presença de litíase impactada no colédoco terminal","feedback":""},{"letter":"C","text":"colangiorressonância; múltiplas estenoses intercaladas na árvore biliar, com áreas normais ou dilatadas de permeio","feedback":""},{"letter":"D","text":"ultrassonografia abdominal total; espessamento da parede da vesícula biliar com nodulação no interior, sem sombra acústica","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.00174,
    1.404,
    0.25,
    0.91547,
    0.90369,
    2025,
    'expert'
  ),
  (
    'e2025c10-0052-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mãe de menina de 11 meses em consulta de puericultura, relata que não há queixas específicas no momento e refere que a criança está começando a trocar passos de maneira independente. Apresenta marcos do desenvolvimento anteriores a 11 meses dentro da normalidade e bom ganho pondero-estatural. Gestação e parto sem intercorrências. O reflexo primitivo usualmente presente nessa faixa etária é o',
    '[{"letter":"A","text":"reflexo plantar","feedback":""},{"letter":"B","text":"reflexo de Moro","feedback":""},{"letter":"C","text":"reflexo de procura","feedback":""},{"letter":"D","text":"reflexo tônico cervical. ÁREA LIVRE","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    0.48929,
    0.689,
    0.25,
    0.01027,
    1.04253,
    2025,
    'expert'
  ),
  (
    'e2025c10-0053-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente do sexo masculino, 23 anos, foi vítima de acidente automobilístico no qual o veículo em que estava colidiu com caminhão. Usava cinto de segurança e foi retirado consciente do carro pela equipe de resgate. Apresentava amnésia anterógrada. Após atendimento pré-hospitalar, o paciente foi levado ao pronto-socorro, sem déficits motores ou sensitivos. No hospital, o médico pede uma tomografia computadorizada de crânio para avaliação. Alguns minutos depois, a equipe de enfermagem solicita avaliação de emergência para o paciente, com necessidade de intubação orotraqueal por rebaixamento do nível de consciência e anisocoria com pupila esquerda dilatada. Tomografia computadorizada de crânio sem contraste Ao considerar a situação clínica do paciente e a imagem tomográfica apresentada, o médico diagnosticou',
    '[{"letter":"A","text":"hematoma subdural agudo, sendo necessário realizar hidantalização do paciente e aguardar melhora clínica","feedback":""},{"letter":"B","text":"contusão cerebral, sendo necessário realizar cirurgia de emergência para controle de hipertensão intracraniana","feedback":""},{"letter":"C","text":"hematoma epidural, sendo necessário realizar cirurgia de emergência para controle da hipertensão intracraniana","feedback":""},{"letter":"D","text":"hematoma intraparenquimatoso, sendo necessário realizar hidantalização do paciente e aguardar melhora clínica. ÁREA LIVRE 13","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.70798,
    1.297,
    0.25,
    0.96081,
    0.85547,
    2025,
    'expert'
  ),
  (
    'e2025c10-0054-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Uma adolescente de 15 anos comparece em consulta ginecológica com a finalidade de iniciar contracepção. Na história patológica pregressa, refere episódios de enxaqueca com aura. Nos antecedentes familiares, relata que a avó materna teve diagnóstico de câncer de mama, sua mãe é hipertensa e sua irmã tem diabetes. O uso do contraceptivo combinado está contraindicado para essa paciente devido ao risco de',
    '[{"letter":"A","text":"câncer de mama","feedback":""},{"letter":"B","text":"diabetes mellitus","feedback":""},{"letter":"C","text":"acidente vascular cerebral","feedback":""},{"letter":"D","text":"hipertensão arterial sistêmica","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.44573,
    1.363,
    0.25,
    0.94689,
    0.85651,
    2025,
    'expert'
  ),
  (
    'e2025c10-0055-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Ao visitar um idoso acamado de 80 anos, restrito ao lar e dependente em relação às atividades de vida diária, a médica de família e comunidade verificou que ele não havia recebido as vacinas indicadas pelo Ministério da Saúde para os idosos. Ao questionar a filha de 55 anos, principal cuidadora, sobre a vacinação do idoso, ela respondeu que o pai é muito frágil e não iria aguentar os efeitos colaterais, e como ele é restrito ao lar, a família preferiu não vacinar. Assinale a alternativa que inclui, respectivamente, vacinas disponibilizadas no calendário de imunização nacional para o idoso e uma forma de abordar a situação encontrada.',
    '[{"letter":"A","text":"Pneumocócica 23-valente, 1 dose, com reforço em 5 anos; dupla adulto (dT – contra difteria e tétano), a cada 10 anos; contra influenza e covid-19, anualmente; contra hepatite B, 3 doses. Agendar uma nova visita domiciliar com mais membros da família para dialogar sobre a situação","feedback":""},{"letter":"B","text":"Contra influenza e covid-19, anualmente; dupla adulto (dT – contra difteria e tétano), a cada 10 anos; contra hepatite B, 3 doses; contra herpes-zoster, 2 doses. Fazer denúncia ao Conselho Municipal do Idoso sobre não vacinação do idoso","feedback":""},{"letter":"C","text":"Pneumocócica 10-valente, 1 dose, com reforço em 5 anos; dupla adulto (dT – contra difteria e tétano), a cada 10 anos; contra influenza e covid-19, anualmente; contra hepatite B, 3 doses. Solicitar que a filha assine um termo de responsabilidade em relação à não vacinação do pai","feedback":""},{"letter":"D","text":"Pneumocócica 10-valente, 1 dose, com reforço em 5 anos; contra influenza e covid-19, anualmente; contra herpes- zoster, 2 doses; dupla adulto (dT – contra difteria e tétano), a cada 10 anos. Respeitar a autonomia da filha sobre a vacinação, uma vez que é a cuidadora responsável. ÁREA LIVRE","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -0.95853,
    0.684,
    0.25,
    1.02514,
    1.05539,
    2025,
    'expert'
  ),
  (
    'e2025c10-0056-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'O vírus Chikungunya é transmitido pelo mosquito Aedes sp e foi responsável por grandes epidemias associadas a desfechos clínicos agudos, crônicos e graves. As ações voltadas para o controle do Aedes sp incluem medidas como o manejo integrado de vetores, que envolve atividades a serem executadas pela equipe de vigilância do território em um processo cíclico, tais como',
    '[{"letter":"A","text":"levantamento do índice larvário, notificação de vetores infectados e avaliação dos indicadores entomológicos e epidemiológicos","feedback":""},{"letter":"B","text":"treinamento da equipe de controle de vetores, uso intensivo de inseticidas, mutirões de limpeza e tratamento de pontos estratégicos","feedback":""},{"letter":"C","text":"vigilância virológica, notificação semanal dos casos suspeitos de Chikungunya em áreas sem transmissão e definição do local provável de infecção","feedback":""},{"letter":"D","text":"análise situacional com base em informações epidemiológicas e entomológicas, desenho das operações de planificação, implementação, monitoramento e avaliação","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    0.09498,
    0.488,
    0.25,
    1.06387,
    1.07144,
    2025,
    'expert'
  ),
  (
    'e2025c10-0057-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Criança de 9 anos chega à Unidade Básica de Saúde (UBS) com o diagnóstico de transtorno de déficit de atenção e hiperatividade há 2 anos. Faz uso de metilfenidato há pelo menos 1 ano. O pai informa que, desde o início do uso, apresentou grande melhora na escola e solicita que o uso seja estendido por mais tempo. Quais estratégias de monitoramento referentes ao uso dessa medicação devem ser utilizadas?',
    '[{"letter":"A","text":"Realizar seguimento em conjunto com neuropediatra para acompanhar aumento de peso e possível dislipidemia associada ao uso crônico do medicamento","feedback":""},{"letter":"B","text":"Acompanhar com testes psicodinâmicos parâmetros de atenção e desempenho escolar, a fim de avaliar a efetividade da estimulação farmacológica","feedback":""},{"letter":"C","text":"Coletar hemograma e hormônios tireoidianos anuais e eventualmente prescrever antipsicóticos para combate dos efeitos colaterais","feedback":""},{"letter":"D","text":"Agendar consultas periódicas para verificação da estatura, peso e pressão arterial, com nova avaliação para retirada após 1 ano. ÁREA LIVRE 1 14","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    1.18514,
    0.669,
    0.25,
    1.03013,
    1.04975,
    2025,
    'expert'
  ),
  (
    'e2025c10-0058-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 45 anos é internada em hospital de média complexidade com queixas de febre (em torno de 38 °C), mialgia, mal-estar e dor na região cervical anterior, irradiada para a mandíbula e orelhas. Há 2 semanas, iniciou quadro sugestivo de infecção viral respiratória alta, com evolução clínica lenta desde então, passando a sentir palpitações e tremores nos últimos 3 dias. Procurou atendimento na unidade de saúde. Ao exame físico, a paciente se encontra febril, com taquicardia desproporcional à temperatura corporal e tremores finos nas extremidades. À palpação da tireoide: glândula dolorosa, firme e levemente aumentada de tamanho, assimétrica, não nodular. As dosagens da velocidade de hemossedimentação e proteína C reativa se mostraram elevadas. Considerando a principal hipótese diagnóstica para o caso, quais exames complementares a sustentariam e qual o tratamento indicado, respectivamente?',
    '[{"letter":"A","text":"Redução da captação tireoidiana de iodo radioativo; betabloqueador e anti-inflamatório","feedback":""},{"letter":"B","text":"Detecção de presença de nódulo quente à cintilografia de tireoide; tireoidectomia subtotal","feedback":""},{"letter":"C","text":"Verificação de aumento nas dosagens séricas de TSH, T4 livre e TRAb; ablação com iodo radioativo","feedback":""},{"letter":"D","text":"Verificação de aumento das concentrações sanguíneas de TSH, T3 e T4 livre; oseltamivir + metimazol + atenolol","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    0.70962,
    1.73,
    0.25,
    0.86386,
    0.84402,
    2025,
    'expert'
  ),
  (
    'e2025c10-0059-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Lactente de 9 meses é atendido em Unidade Básica de Saúde (UBS) em virtude do surgimento de crises epilépticas há 3 meses. Os eventos se caracterizam por espasmos em flexão dos membros superiores sobre o tronco, semelhantes a sustos, e ocorrem nos horários de maior sonolência da criança. História gestacional e de parto sem anormalidades. Ao exame físico, lactente interage com o observador, porém não consegue ficar sentado. Ausculta cardíaca e respiratória sem anormalidades. Apresenta várias manchas hipomelanóticas nos membros inferiores e no tronco. Ressonância magnética de crânio revelou duas áreas compatíveis com astrocitomas de células gigantes subependimárias. A principal hipótese diagnóstica é',
    '[{"letter":"A","text":"neurofibromatose","feedback":""},{"letter":"B","text":"esclerose tuberosa","feedback":""},{"letter":"C","text":"síndrome de Sturge-Weber","feedback":""},{"letter":"D","text":"doença de von Hippel-Lindau. ÁREA LIVRE","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    2.41514,
    1,
    0.25,
    1.05908,
    1.28587,
    2025,
    'expert'
  ),
  (
    'e2025c10-0060-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente masculino, 59 anos, atendido em hospital terciário com queixa de dor de moderada intensidade em fossa ilíaca esquerda (FIE), com início há 5 dias. Apresentou temperatura de 38 °C nas últimas 48 horas, associada à prostração. Não possuía comorbidades. Relatou episódio semelhante de menor intensidade há cerca de 1 ano, com resolução espontânea e um episódio de hematoquezia há 6 meses. No momento se encontra em regular estado geral, discretamente desidratado, com frequência cardíaca de 95 bpm; pressão arterial de 140 x 90 mmHg; índice de massa corporal de 30,5 mg/kg 2 . Abdome flácido, doloroso à palpação profunda em FIE e hipogástrio, com plastrão palpável em hipogástrio. Hemograma: leucócitos de 17.000/mm 3 (valor de referência: 5.000 a 10.000/ mm 3 ), 7% de bastões (valor de referência: 0 a 5%). Considerando o quadro, qual é o exame complementar de maior acurácia para estabelecer o diagnóstico?',
    '[{"letter":"A","text":"Radiografia abdominal em 3 posições","feedback":""},{"letter":"B","text":"Colonoscopia com biópsia","feedback":""},{"letter":"C","text":"Tomografia de abdome com contraste","feedback":""},{"letter":"D","text":"Ultrassonografia de abdome","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.15173,
    1.163,
    0.25,
    0.96755,
    0.91082,
    2025,
    'expert'
  ),
  (
    'e2025c10-0061-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 35 anos, diabética, com laqueadura tubária bilateral, procurou atendimento médico com queixa de prurido genital e disúria terminal, com 7 dias de evolução. Recentemente, fez uso de antibiótico para tratamento de abscesso dental. Ao exame especular, notava-se edema vulvar, hiperemia, fissura, corrimento esbranquiçado e teste das aminas negativo. Com base no agente etiológico mais provável, o tratamento é',
    '[{"letter":"A","text":"miconazol, 1 aplicador, via vaginal, por 7 noites","feedback":""},{"letter":"B","text":"cefalexina, 2 g/dia, via oral, por 7 dias","feedback":""},{"letter":"C","text":"azitromicina 1 g/dia, via oral, por 10 dias","feedback":""},{"letter":"D","text":"metronidazol, 1 aplicador, via vaginal, por 10 noites. ÁREA LIVRE 15","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.62641,
    1.53,
    0.25,
    0.92915,
    0.82173,
    2025,
    'expert'
  ),
  (
    'e2025c10-0062-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Médica de família e comunidade foi solicitada para preencher a declaração de óbito de um paciente que acompanhava regularmente em sua área adstrita. O paciente era hipertenso há 30 anos, com histórico pessoal de acidente vascular encefálico (AVE) há 5 anos. Há 10 dias o paciente apresentou quadro gripal e há 1 dia teve agravamento dos sintomas respiratórios, com dispneia e cianose. A declaração de óbito deverá ser preenchida',
    '[{"letter":"A","text":"pelo Instituto Médico Legal e constar: Parte I: a) Insuficiência respiratória aguda grave (horas); b) Síndrome gripal (10 dias); c) Hipertensão arterial sistêmica (30 anos). Parte II: Acidente vascular encefálico (5 anos)","feedback":""},{"letter":"B","text":"pela médica e constar: Parte I: a) Insuficiência respiratória aguda grave (horas); b) Pneumonia (1 dia); Síndrome gripal (10 dias). Parte II: a) Acidente vascular encefálico (5 anos); b) Hipertensão arterial sistêmica (30 anos)","feedback":""},{"letter":"C","text":"pelo Serviço Móvel de Atendimento de Urgência (SAMU) e constar: Parte I: a) Síndrome gripal (10 dias); b) Pneumonia (1 dia); c) Insuficiência respiratória aguda grave (horas). Parte II: a) Acidente vascular encefálico (5 anos); b) Hipertensão arterial sistêmica (30 anos)","feedback":""},{"letter":"D","text":"pelo serviço de verificação de óbitos e constar: Parte I: a) Insuficiência respiratória aguda grave (horas); b) Acidente vascular encefálico (5 anos); c) Hipertensão arterial sistêmica (30 anos). Parte II: a) Pneumonia (1 dia); b) Síndrome gripal (10 dias)","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -2.08296,
    1.328,
    0.25,
    0.96412,
    0.83503,
    2025,
    'expert'
  ),
  (
    'e2025c10-0063-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Uma equipe de saúde da família percebeu um aumento do número de casos complicados de diabetes mellitus. De um total de 3.500 pacientes cadastrados, 280 são acompanhados por diabetes mellitus tipo 2, sendo 4 casos de amputações, 28 casos de retinopatia diabética e 80 casos de algum grau de doença renal crônica. Foi identificado que essa população apresentava dieta inadequada, baixo nível de atividade física e pouco conhecimento sobre estilos de vida que poderiam prevenir complicações das doenças. A equipe de saúde decidiu elaborar um projeto de intervenção com ênfase em avaliação e orientação nutricional e práticas de atividade física de rotina. Qual é o desenho de pesquisa para avaliação do impacto desse projeto de intervenção coletiva?',
    '[{"letter":"A","text":"Estudo de caso-controle aninhado","feedback":""},{"letter":"B","text":"Ensaio clínico não randomizado","feedback":""},{"letter":"C","text":"Estudo de coorte retrospectivo","feedback":""},{"letter":"D","text":"Ensaio clínico randomizado. ÁREA LIVRE","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    0.78003,
    0.789,
    0.25,
    1.01508,
    1.02131,
    2025,
    'expert'
  ),
  (
    'e2025c10-0064-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 23 anos, estudante universitário, é levado à Unidade de Pronto Atendimento (UPA) por um amigo da moradia estudantil, que o encontrou chorando, trancado no banheiro com diversas cartelas de medicamentos próximas de si. O paciente nega ter ingerido qualquer fármaco ou outras substâncias, mas admite estar pensando em dar fim à própria vida. Refere tristeza profunda há cerca de 2 meses, com piora recente após o término de um relacionamento. Diz estar “sem propósito na vida” e que “ninguém sentiria falta” se ele morresse. Conta que viu na internet que tomar muitos comprimidos de paracetamol seria a melhor forma de morrer. Relata insônia inicial e terminal, perda de apetite, queda de rendimento acadêmico e isolamento social. Nega uso atual de drogas ilícitas, mas admite consumo de álcool eventualmente. Abandonou psicoterapia após 2 sessões. Todos os familiares vivem em outro estado. Ao exame, apresenta-se vígil, orientado, com discurso discretamente lentificado, sem alucinações ou delírios evidentes. O contato visual é pobre, o afeto está intensamente rebaixado e não modulante. Exames laboratoriais gerais solicitados à chegada na UPA não mostram alterações. Qual é a conduta adequada ao caso clínico apresentado?',
    '[{"letter":"A","text":"Encaminhar o paciente para acompanhamento médico em Unidade Básica de Saúde (UBS)","feedback":""},{"letter":"B","text":"Encaminhar o paciente para psicoterapia com equipe multiprofissional na atenção primária à saúde","feedback":""},{"letter":"C","text":"Encaminhar o paciente para avaliação ambulatorial com psiquiatra em centro de atenção psicossocial do tipo I","feedback":""},{"letter":"D","text":"Encaminhar o paciente para internação em enfermaria de saúde mental em hospital geral ou em serviço congênere","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.00667,
    1.074,
    0.25,
    0.97183,
    0.09608,
    2025,
    'expert'
  ),
  (
    'e2025c10-0065-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 35 anos procura Unidade Básica de Saúde (UBS) informando ter tido diagnóstico de trombose venosa profunda há cerca de 2 anos. Fez tratamento adequado com anticoagulante oral por tempo limitado, tendo recebido alta com cura do quadro há cerca de 1 ano. Na ocasião, ela não havia realizado qualquer exame específico adicional. Entretanto, nos últimos 6 meses, seu pai e sua irmã também tiveram o diagnóstico de trombose. O médico assistente solicita exames complementares para rastreio de hipercoagulabilidade primária. Considerando a história apresentada, qual alteração laboratorial é compatível com a suspeita de doença hereditária?',
    '[{"letter":"A","text":"Presença de Fator V de Leiden","feedback":""},{"letter":"B","text":"Níveis aumentados de proteína S","feedback":""},{"letter":"C","text":"Níveis aumentados de antitrombina III","feedback":""},{"letter":"D","text":"Níveis reduzidos de Fator de Von Willebrand. ÁREA LIVRE 1 16","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    0.41192,
    0.786,
    0.25,
    1.01366,
    1.01913,
    2025,
    'expert'
  ),
  (
    'e2025c10-0066-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Menina de 11 anos foi trazida à Unidade de Pronto Atendimento (UPA) com quadro de queda do estado geral, náuseas e dor abdominal, desidratação e hálito cetônico. Exames realizados: glicemia de 410 mg/dL; gasometria venosa de pH 7,15 e bicarbonato de 13 mEq/L; exame de urina indica cetonúria. Além da fluidoterapia, o próximo passo é',
    '[{"letter":"A","text":"reposição de potássio","feedback":""},{"letter":"B","text":"correção imediata da glicemia","feedback":""},{"letter":"C","text":"reposição de bicarbonato de sódio","feedback":""},{"letter":"D","text":"administração imediata de manitol","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -0.11227,
    1.303,
    0.25,
    0.93376,
    0.09239,
    2025,
    'expert'
  ),
  (
    'e2025c10-0067-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente do sexo masculino, 26 anos, está sendo atendido em via pública, vítima de disparo de arma de fogo em braço direito. O trauma ocorreu cerca de 15 minutos antes da chegada da equipe de atendimento pré-hospitalar. Ao exame, o paciente se encontra pálido, pele fria, sudoreico, frequência cardíaca de 120 bpm, pressão arterial de 90 x 50 mmHg e escala de coma de Glasgow de 15. A equipe de socorristas não possui hemoderivados disponíveis. Exame físico de cabeça, pescoço, tórax e abdome sem alterações, incluindo a região posterior do paciente. Presença de ferida perfuro-contusa em região medial do terço distal do braço direito, apresentando hemorragia pulsátil em grande volume. Considerando o atendimento pré-hospitalar do paciente, deve-se realizar',
    '[{"letter":"A","text":"dissecção da região traumatizada e hemostasia do vaso que apresenta sangramento com pinças hemostáticas; iniciar reposição volêmica com albumina e soro fisiológico","feedback":""},{"letter":"B","text":"dissecção da região traumatizada e hemostasia do vaso que apresenta sangramento com pinças hemostáticas; iniciar reposição volêmica com soro fisiológico e glicofisiológico","feedback":""},{"letter":"C","text":"compressão local da ferida e, caso essa manobra não cesse a hemorragia, aplicação de torniquete proximal à ferida e fora da região de articulação; iniciar reposição volêmica com soro fisiológico","feedback":""},{"letter":"D","text":"compressão local da ferida e, caso essa manobra não cesse a hemorragia, aplicação de torniquete proximal à ferida e fora da região de articulação; iniciar reposição volêmica com albumina e soro fisiológico. ÁREA LIVRE","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -2.02864,
    1.253,
    0.25,
    0.96927,
    0.08623,
    2025,
    'expert'
  ),
  (
    'e2025c10-0068-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Uma mulher de 30 anos recebeu a citologia oncótica com laudo de “atipias celulares escamosas de significado indeterminado, onde não se pode afastar alto grau (ASC-H)”. Ela nega antecedente de tabagismo e não se lembra de ter tido infecção sexualmente transmissível. Nesse caso, a conduta adequada deve ser a realização de',
    '[{"letter":"A","text":"conização","feedback":""},{"letter":"B","text":"colposcopia","feedback":""},{"letter":"C","text":"cirurgia de alta frequência","feedback":""},{"letter":"D","text":"nova citologia oncótica em 6 meses","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.52701,
    0.777,
    0.25,
    1.01472,
    1.00868,
    2025,
    'expert'
  ),
  (
    'e2025c10-0069-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 45 anos procura Unidade Básica de Saúde (UBS) do seu bairro, por não conseguir controlar a frequência e a quantidade do uso de bebida alcoólica. Por conta disso, está faltando ao trabalho e não consegue se lembrar do que acontece quando bebe. O médico da UBS investigará os pontos mais importantes que podem indicar o padrão de dependência a substâncias psicoativas de acordo com o Manual Diagnóstico Estatístico de Saúde Mental (DSM-5). O médico deve investigar sobre',
    '[{"letter":"A","text":"a intolerância cruzada entre outras substâncias e a de uso abusivo","feedback":""},{"letter":"B","text":"a aceitação e a adesão à proposta de abstinência apresentada pela equipe","feedback":""},{"letter":"C","text":"o tempo que é gasto para obter a substância ou recuperar- se de seus efeitos","feedback":""},{"letter":"D","text":"o tipo e a classe de substância que o paciente usa, diferenciando se é lícita ou ilícita. ÁREA LIVRE 17","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    0.54672,
    1.15,
    0.25,
    0.95897,
    0.94985,
    2025,
    'expert'
  ),
  (
    'e2025c10-0070-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Agentes penitenciários de uma unidade prisional informaram à equipe de saúde sobre o aumento de queixas de prurido intenso e lesões cutâneas entre as pessoas privadas de liberdade. Cada cela, prevista para 35 pessoas, está com lotação de 75. As ações prioritárias no manejo adequado dessa situação são',
    '[{"letter":"A","text":"solicitar o isolamento imediato dos casos sintomáticos, iniciar tratamento individual conforme avaliação clínica, recomendar higienização de colchões e ampliar o fornecimento de sabão e escovas pessoais","feedback":""},{"letter":"B","text":"implementar bloqueio coletivo com tratamento simultâneo, notificar o surto ao serviço de vigilância em saúde, reorganizar fluxos com a administração prisional e planejar medidas educativas e estruturais","feedback":""},{"letter":"C","text":"preferir o tratamento tópico dos casos diagnosticados, com prescrição médica individualizada, e restringir o fornecimento de medicação aos casos confirmados, evitando exposição a medicamentos em massa","feedback":""},{"letter":"D","text":"reunir-se com a direção para discutir a viabilidade de transferência dos casos graves, focando a atuação em medidas educativas com folhetos informativos sobre problemas de pele mais frequentes","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -0.05953,
    0.627,
    0.25,
    1.03899,
    1.04479,
    2025,
    'expert'
  ),
  (
    'e2025c10-0071-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 28 anos, solteiro e residindo com os pais, comparece ao Centro de Atenção Psicossocial (CAPs), com visível constrangimento ao longo da consulta. Apesar de sua resistência inicial, relata que tem pensamentos recorrentes e indesejados, os quais invadem sua cabeça, tendo como temática a sua mãe sendo vítima de grande violência. Enfatiza sua angústia com esses pensamentos, que já duram mais de 6 meses, provocando significativo prejuízo em sua vida pessoal e profissional. Afirma ter o entendimento de que não há fundamento nessas ideias e que não faz sentido sofrer com isso. A denominação para a descrição clínica apresentada é',
    '[{"letter":"A","text":"delírio","feedback":""},{"letter":"B","text":"obsessão","feedback":""},{"letter":"C","text":"hipertimia","feedback":""},{"letter":"D","text":"compulsão. ÁREA LIVRE","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.11251,
    0.993,
    0.25,
    0.98271,
    0.97819,
    2025,
    'expert'
  ),
  (
    'e2025c10-0072-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 35 anos, índice de massa corporal de 15 kg/m², é internado devido à diarreia líquida, com produtos patológicos, acompanhada de flatulência e desconforto abdominal há 4 semanas. Apresentou emagrecimento de cerca de 10 kg em 1 mês. Foram solicitados exames com endoscopia digestiva alta e baixa, sem alterações macroscópicas. Estudos histopatológicos de estômago, intestino delgado e cólon normais. Teste respiratório com lactulose positivo. O plano terapêutico adequado para esse paciente será',
    '[{"letter":"A","text":"neomicina e rifaximina","feedback":""},{"letter":"B","text":"loperamida e escopolamina","feedback":""},{"letter":"C","text":"dieta sem glúten e sem lactose","feedback":""},{"letter":"D","text":"probióticos e inibidores da bomba de prótons","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    1.70128,
    0.696,
    0.25,
    1.01864,
    1.05683,
    2025,
    'expert'
  ),
  (
    'e2025c10-0073-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Criança de 2 anos encaminhada ao matriciamento de pediatria, com história de ter apresentado há 7 dias uma crise tônico- clônica generalizada em vigência de temperatura axilar de 39,3 °C, duração de 2 minutos, sem recorrência em 24 horas. Naquela ocasião foi realizado exame físico e neurológico, compatível com infecção viral de vias aéreas superiores, sem outras alterações. A conduta adequada nesse caso é',
    '[{"letter":"A","text":"solicitar eletroencefalograma","feedback":""},{"letter":"B","text":"indicar profilaxia com barbitúricos","feedback":""},{"letter":"C","text":"tranquilizar e orientar puericultura de rotina","feedback":""},{"letter":"D","text":"solicitar exames laboratoriais e de imagem","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -2.09686,
    1.884,
    0.25,
    0.90813,
    0.70949,
    2025,
    'expert'
  ),
  (
    'e2025c10-0074-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 47 anos, sexo feminino, atendida no ambulatório de cirurgia geral. A paciente havia sido submetida à cirurgia de tireoidectomia total há 60 dias, devido à um carcinoma folicular de tireoide, o qual estava restrito à glândula. No pós-operatório imediato, a paciente apresentou rouquidão, que não melhorou durante o acompanhamento ambulatorial nesses 60 dias. Com base no quadro clínico apresentado, qual foi o nervo lesionado durante a cirurgia?',
    '[{"letter":"A","text":"Laríngeo recorrente","feedback":""},{"letter":"B","text":"Glossofaríngeo","feedback":""},{"letter":"C","text":"Hipoglosso","feedback":""},{"letter":"D","text":"Vago. ÁREA LIVRE 1 18","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.32379,
    1.639,
    0.25,
    0.90695,
    0.81533,
    2025,
    'expert'
  ),
  (
    'e2025c10-0075-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 29 anos, nuligesta, ciclos menstruais com intervalos de 20 a 65 dias, duração de 4 a 10 dias, intensidade moderada. Apresenta índice de massa corporal de 41,5 kg/m 2 e se submeterá à cirurgia bariátrica em alguns meses. Necessita de orientação para contracepção. Com base nessas informações, assinale a alternativa correta.',
    '[{"letter":"A","text":"Para contracepção efetiva e proteção endometrial, está indicado o endoceptivo antes da operação","feedback":""},{"letter":"B","text":"Devido ao risco de apresentar tromboembolismo, está contraindicado o uso de métodos hormonais","feedback":""},{"letter":"C","text":"Apresenta quadro de anovulação crônica, portanto deve ser orientada a usar preservativo masculino","feedback":""},{"letter":"D","text":"Está contraindicada gravidez na fase de perda de peso, logo ela pode usar o adesivo anticoncepcional","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    0.16241,
    1.043,
    0.25,
    0.97494,
    0.97168,
    2025,
    'expert'
  ),
  (
    'e2025c10-0077-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Uma equipe de saúde da família realiza atendimento itinerante a comunidades ribeirinhas e aldeias indígenas na Região Amazônica. Em visita, uma médica recém-chegada observa que uma mulher ribeirinha evita contato visual durante a consulta e responde às perguntas apenas com monossílabos. Em outra situação, um indígena da etnia Tikuna não aceita ser atendido sozinho e insiste na presença de um pajé da comunidade. A abordagem adequada que a equipe deve adotar é',
    '[{"letter":"A","text":"investir na padronização de rotinas clínicas e na capacitação da equipe para comunicação técnica propositiva e objetiva","feedback":""},{"letter":"B","text":"promover espaços formativos para a equipe assistencial, reconhecendo saberes e práticas das populações atendidas","feedback":""},{"letter":"C","text":"reforçar a autonomia profissional da médica, mantendo as condutas clínicas baseadas em evidências científicas","feedback":""},{"letter":"D","text":"estabelecer rotinas padronizadas uniformes de atendimento para ribeirinhos e indígenas","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -3.20535,
    1.69,
    0.25,
    0.96926,
    0.66197,
    2025,
    'expert'
  ),
  (
    'e2025c10-0078-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 21 anos comparece à Unidade Básica de Saúde (UBS) para uma consulta agendada. Durante o atendimento, diz que se reconhece como um homem trans e que está em processo de afirmação de gênero. Relata que, nos últimos meses, tem buscado apoio em grupos de pessoas trans, começou a usar um binder (faixa de compressão torácica) e que cogita iniciar terapia hormonal no futuro. Refere que não apresenta sofrimento psíquico intenso relacionado à sua identidade de gênero, mas sente que precisa de informações adequadas sobre os próximos passos e sobre cuidados com a saúde. Não apresenta sintomas depressivos, ansiosos ou psicóticos. Qual é a conduta mais adequada a ser adotada?',
    '[{"letter":"A","text":"Solicitar avaliação psiquiátrica para diagnóstico de disforia de gênero antes do acompanhamento na UBS","feedback":""},{"letter":"B","text":"Iniciar terapia hormonal na UBS, conforme estabelecido no processo transexualizador do SUS, e marcar retorno em 8 semanas","feedback":""},{"letter":"C","text":"Encaminhar paciente para serviço especializado e informar que o seguimento relacionado à transição de gênero deve ser feito com especialista","feedback":""},{"letter":"D","text":"Esclarecer que tal identidade de gênero não é transtorno mental, oferecer acompanhamento contínuo na UBS e orientar sobre cuidados gerais de saúde. ÁREA LIVRE ÁREA LIVRE 19","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -1.84265,
    1.143,
    0.25,
    0.97484,
    0.91603,
    2025,
    'expert'
  ),
  (
    'e2025c10-0079-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 62 anos, com histórico de infecções do trato urinário de repetição, dá entrada em Unidade de Pronto Atendimento (UPA) com quadro de febre alta e calafrios. A paciente é portadora de diabetes mellitus tipo 2, em tratamento regular com metformina e glicazida. À admissão apresenta-se com pressão arterial de 110 x 70 mmHg, frequência cardíaca de 106 bpm, frequência respiratória de 25 irpm e temperatura axilar de 38 °C. Os exames laboratoriais indicam hemoglobina de 12,3 g/dL e hematócrito de 36%; leucócitos de 14.000/mm 3 (valor de referência: 6.000 a 10.000/mm 3 ), com 84% de neutrófilos e 12% de bastonetes; plaquetas de 210.000/mm 3 . A conduta para o caso deve ser recomendar',
    '[{"letter":"A","text":"tratamento com antitérmico, hidratação oral vigorosa e observação na unidade hospitalar","feedback":""},{"letter":"B","text":"tratamento com esquema antibiótico de amplo espectro, ainda na 1ª hora da chegada da paciente","feedback":""},{"letter":"C","text":"tratamento com cobertura contra Candida sp, por se tratar de infecção urinária de repetição em paciente diabética","feedback":""},{"letter":"D","text":"tratamento com antibiótico de amplo espectro, mantido durante todo o curso de tratamento, mesmo após os resultados das culturas","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.84299,
    0.883,
    0.25,
    0.99903,
    1.00454,
    2025,
    'expert'
  ),
  (
    'e2025c10-0080-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Recém-nascido a termo apresenta, no 1° minuto de vida, quadro de apneia e bradicardia, desvio do ictus à direita, abdome escavado e presença de ruídos hidroaéreos à ausculta do hemitórax esquerdo. No decorrer do atendimento desse recém-nascido, em sala de parto, os procedimentos adequados a serem realizados são',
    '[{"letter":"A","text":"intubação traqueal e massagem cardíaca externa","feedback":""},{"letter":"B","text":"cateterismo umbilical e drenagem de hemitórax esquerdo","feedback":""},{"letter":"C","text":"ventilação com óxido nítrico e administração de surfactante","feedback":""},{"letter":"D","text":"ventilação com balão autoinflável com pressão expiratória final positiva","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    0.88635,
    0.747,
    0.25,
    1.01264,
    0.10401,
    2025,
    'expert'
  ),
  (
    'e2025c10-0081-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Adulto jovem, sexo masculino, atendido em Unidade Básica de Saúde (UBS), relata dor e ardor no ânus acompanhados de sangramento vivo em pequena quantidade ao evacuar com esforço e fezes endurecidas. Nega tumoração perianal. Portador de constipação crônica e diagnóstico recente de doença Crohn. Exame geral sem alterações. Qual é o diagnóstico mais provável?',
    '[{"letter":"A","text":"Abcesso perianal","feedback":""},{"letter":"B","text":"Fístula perianal","feedback":""},{"letter":"C","text":"Cisto pilonidal","feedback":""},{"letter":"D","text":"Fissura anal","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    -2.41165,
    0.814,
    0.25,
    1.00884,
    0.99334,
    2025,
    'expert'
  ),
  (
    'e2025c10-0082-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente G3P1A1, idade gestacional de 24 semanas, comparece à consulta. Refere que na primeira gestação teve um abortamento com 16 semanas e na segunda, teve trabalho de parto vaginal muito rápido, na idade gestacional de 28 semanas. Na ultrassonografia transvaginal, realizada com 23 semanas desta gestação, detectou-se colo uterino com 1,5 cm de comprimento. Qual é a conduta adequada à situação?',
    '[{"letter":"A","text":"Solicitar a pesquisa de estreptococo do Grupo B na 28ª semana","feedback":""},{"letter":"B","text":"Internar a paciente para receber atosiban intravenoso até 34 semanas","feedback":""},{"letter":"C","text":"Prescrever nifedipina 20 mg via oral diariamente à noite até 39 semanas","feedback":""},{"letter":"D","text":"Prescrever progesterona micronizada via vaginal 200 mg ao dia até 36 semanas","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.23842,
    1.295,
    0.25,
    0.94952,
    0.88838,
    2025,
    'expert'
  ),
  (
    'e2025c10-0083-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 32 anos, sexualmente ativa, comparece à consulta com o médico de família e comunidade para realização do seu primeiro exame preventivo. O médico realiza a coleta de citologia oncótica. Após 3 semanas, a paciente retorna com o resultado “presença de lesão intraepitelial de baixo grau”. Considerando esse resultado, qual é a conduta adequada do médico?',
    '[{"letter":"A","text":"Solicitar ultrassonografia transvaginal","feedback":""},{"letter":"B","text":"Repetir o exame citopatológico em 6 meses","feedback":""},{"letter":"C","text":"Encaminhar para a realização de colposcopia","feedback":""},{"letter":"D","text":"Repetir o exame citopatológico imediatamente. ÁREA LIVRE 1 20","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.18636,
    0.98,
    0.25,
    0.09877,
    0.96976,
    2025,
    'expert'
  ),
  (
    'e2025c10-0084-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'A agente comunitária de saúde de uma Unidade Básica de Saúde (UBS) relata, durante a reunião de equipe, a sua preocupação com os idosos de uma instituição de longa permanência para idosos (ILPI) no território da UBS. Em sua última visita, a agente observou que na instituição havia 38 idosos vivendo em isolamento excessivo, a maioria sem vínculos familiares ativos e sofrendo constantes agressões dos funcionários. Comenta ainda que havia sinais de contenção física em idosos com demência avançada e presença de lesões de pressão. Qual a conduta mais adequada da equipe de saúde?',
    '[{"letter":"A","text":"Formalizar denúncia ao Conselho Municipal do Idoso, considerando que situações como contenção e úlcera por pressão podem acontecer em ambientes de institucionalização prolongada e não requerem intervenção clínica imediata","feedback":""},{"letter":"B","text":"Oferecer apoio clínico para os casos de maior vulnerabilidade, como os com lesão por pressão e agitação psicomotora, sugerindo adequações na rotina assistencial, respeitando a autonomia da ILPI","feedback":""},{"letter":"C","text":"Articular ação intersetorial com órgãos de controle social, registrar notificação compulsória de violência institucional e elaborar plano de ação conjunta com a equipe da ILPI","feedback":""},{"letter":"D","text":"Agendar reuniões quinzenais com a equipe da ILPI para educação permanente sobre cuidados paliativos, sem envolver outras instâncias legais ou sociais","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -2.98163,
    1.204,
    0.25,
    0.98852,
    0.84776,
    2025,
    'expert'
  ),
  (
    'e2025c10-0085-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 42 anos é levada pelo irmão à Unidade de Pronto Atendimento (UPA) com fala alterada, lentificação, tontura e sonolência. Ela admite ter ingerido 30 comprimidos de clonazepam 2 mg há 20 minutos. Paciente evolui com hipotensão, rebaixamento do nível de consciência, sendo caracterizado coma e indicada a ventilação mecânica. Qual medicação é indicada nessa situação?',
    '[{"letter":"A","text":"N-acetilcisteína","feedback":""},{"letter":"B","text":"Flumazenil","feedback":""},{"letter":"C","text":"Naloxona","feedback":""},{"letter":"D","text":"Atropina. ÁREA LIVRE","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -1.55488,
    1.383,
    0.25,
    0.94519,
    0.85385,
    2025,
    'expert'
  ),
  (
    'e2025c10-0086-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 55 anos, sem história de doenças crônicas, procura atendimento por queixa de cefaleia persistente em ambos os lados do crânio, associada a alterações de visão (amaurose fugaz e diplopia), cansaço e artralgias. Relata dor em todo o couro cabeludo. Notou perda de peso (2 kg em 2 meses). Nega fotofobia ou fonofobia, febre ou náuseas, e afirma que não acorda de madrugada por conta da cefaleia. Nega qualquer problema de ordem emocional. Ao exame, a paciente encontra- se afebril, com pupilas isocóricas e sem rigidez de nuca. Qual é o tipo de cefaleia dessa paciente, e qual exame seria útil na sua investigação preliminar, respectivamente?',
    '[{"letter":"A","text":"Cefaleia primária (cefaleia tensional); nenhum exame é necessário","feedback":""},{"letter":"B","text":"Cefaleia secundária (hemorragia subaracnoideia); análise de líquor","feedback":""},{"letter":"C","text":"Cefaleia primária (migrânea); tomografia computadorizada de encéfalo","feedback":""},{"letter":"D","text":"Cefaleia secundária (arterite temporal); velocidade de hemossedimentação","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.73242,
    1.56,
    0.25,
    0.90147,
    0.86593,
    2025,
    'expert'
  ),
  (
    'e2025c10-0087-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Adolescente de 13 anos, sexo masculino, procura atendimento na Unidade Básica de Saúde (UBS) devido a manchas escurecidas nas dobras do pescoço, axilas e virilhas. Ao exame físico, índice de massa corporal está no Z escore entre +2 e +3 para a idade e sexo, relação da circunferência abdominal/estatura aumentada, com manchas hipercrômicas no pescoço, axilas e raiz da coxa, sem outros achados significativos. Além de prescrever mudança de hábitos alimentares e aumento da atividade física, deve-se',
    '[{"letter":"A","text":"solicitar biópsia das lesões e hemoglobina glicada","feedback":""},{"letter":"B","text":"solicitar perfil lipídico e ultrassonografia de abdome","feedback":""},{"letter":"C","text":"indicar corticoide tópico nas lesões e evitar exposição solar","feedback":""},{"letter":"D","text":"indicar antifúngico nas lesões e solicitar teste de tolerância oral à glicose. ÁREA LIVRE 21","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -0.26636,
    1.066,
    0.25,
    0.97132,
    0.96469,
    2025,
    'expert'
  ),
  (
    'e2025c10-0089-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Gestante de 28 anos, idade gestacional desconhecida, situação de vulnerabilidade social, chega, trazida pelo Serviço Móvel de Atendimento de Urgência (SAMU), com sangramento vaginal intenso, hipertonia uterina, pressão arterial de 130 x 90 mmHg, altura uterina de 32 cm, batimentos cardíacos fetais de 90 bpm. Toque vaginal: colo grosso, posterior impérvio. A acompanhante refere que a paciente fez uso de cocaína antes do ocorrido. O diagnóstico, a conduta adequada e a complicação possível são, respectivamente,',
    '[{"letter":"A","text":"descolamento de placenta; cesárea; útero de Couvalaire","feedback":""},{"letter":"B","text":"rotura de vasa prévia; amniotomia; anemia fetal","feedback":""},{"letter":"C","text":"trabalho de parto; inibição; prematuridade","feedback":""},{"letter":"D","text":"pré-eclâmpsia; cesárea; rotura uterina. ÁREA LIVRE","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -1.79802,
    1.546,
    0.25,
    0.93434,
    0.79793,
    2025,
    'expert'
  ),
  (
    'e2025c10-0090-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 23 anos, previamente hígido, procura atendimento na Unidade Básica de Saúde (UBS) relatando que há cerca de 2 horas foi mordido por um gato de rua ao tentar retirá-lo de cima de uma árvore. A mordida resultou em feridas cortocontusas nos dedos da mão esquerda. Paciente nega episódios anteriores de agressões desse tipo. O animal, que não pertence a ninguém da vizinhança, fugiu após ser resgatado. Na cidade, no ano anterior, houve a confirmação de raiva em felinos. A conduta adequada no atendimento imediato ao paciente é',
    '[{"letter":"A","text":"higienizar adequadamente e suturar as lacerações; aplicar o soro antirrábico; prescrever 1 dose de penicilina benzatina 1,2 milhão de UI","feedback":""},{"letter":"B","text":"lavar os ferimentos com antissépticos; aguardar a busca ativa do animal pela zoonose para início da profilaxia; aplicar reforço da vacina dT (difteria e tétano)","feedback":""},{"letter":"C","text":"lavar os ferimentos com água corrente abundante e sabão; administrar a vacina antirrábica em 4 doses, nos dias 0, 3, 7 e 14; aplicar imunoglobulina humana antirrábica","feedback":""},{"letter":"D","text":"higienizar com solução antisséptica; administrar a 1ª dose da vacina antirrábica; na presença de qualquer reação adversa, contraindicar as doses subsequentes; aplicar o soro antirrábico","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'saude_coletiva',
    NULL, -- subspecialty
    NULL, -- topic
    -1.41314,
    1.08,
    0.25,
    0.09791,
    0.93276,
    2025,
    'expert'
  ),
  (
    'e2025c10-0091-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 56 anos, em acompanhamento médico por angina instável de início recente, diabetes mellitus tipo 2, hipertensão arterial sistêmica e dislipidemia, é internado em unidade coronariana de hospital de atenção terciária com quadro de dor torácica em aperto, de forte intensidade, irradiada para o membro superior esquerdo e mandíbula, iniciada há cerca de 2 horas. O paciente relata ter sofrido 3 episódios de dor com características similares, mas de menor duração, nas últimas 24 horas. Ele vem em uso crônico de losartana, hidroclorotiazida, ácido acetilsalicílico, dapagliflozina, metformina e atorvastatina. Ao exame físico, ausculta-se 4ª bulha, níveis pressóricos dentro da normalidade, sem congestão pulmonar. Um eletrocardiograma mostra novo infradesnivelamento segmento ST de 1 mm, com inversão de onda T, em parede anterior. O paciente evolui com elevação da troponina-I, fazendo curva enzimática. O escore de risco Grace é de 152 pontos, enquanto o TIMI risk score é de 5 pontos. A conduta indicada nesse caso é realizar',
    '[{"letter":"A","text":"angiotomografia coronária em até 48 horas","feedback":""},{"letter":"B","text":"cateterismo cardíaco nas primeiras 24 horas","feedback":""},{"letter":"C","text":"cateterismo cardíaco em até 3 dias do evento","feedback":""},{"letter":"D","text":"ecocardiograma de estresse em até 7 dias do evento. ÁREA LIVRE 1 22","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -2.28325,
    0.818,
    0.25,
    1.00925,
    0.99321,
    2025,
    'expert'
  ),
  (
    'e2025c10-0092-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Menina de 1 ano e 10 meses é levada ao serviço de urgência com quadro de tosse e dispneia há 4 dias. A mãe refere que aumentou a frequência de salbutamol, que usa rotineiramente, porém não observou melhora, com piora da dispneia há 6 horas. Relata frequentes exacerbações da asma nos últimos 3 meses, apesar da utilização de prednisolona. História familiar: pai e mãe asmáticos. Ao exame físico, lactente no colo da mãe, afebril, sonolenta, taquidispneica, choro entrecortado, saturação 94% em ar ambiente, retração de musculatura acessória. Além da internação da criança, a conduta adequada é prescrever',
    '[{"letter":"A","text":"metilprednisolona endovenoso","feedback":""},{"letter":"B","text":"ventilação não invasiva (VNI) com sedação","feedback":""},{"letter":"C","text":"salbutamol endovenoso em infusão contínua","feedback":""},{"letter":"D","text":"sulfato de magnésio em infusão intravenosa contínua","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    0.00933,
    0.334,
    0.25,
    1.08712,
    1.09797,
    2025,
    'expert'
  ),
  (
    'e2025c10-0093-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 45 anos atendida na Unidade Básica de Saúde (UBS) com dor ocular. Referiu que estava realizando limpeza doméstica com alvejante e deixou atingir o olho, acidentalmente. Ao exame físico, foi observada presença de hiperemia intensa com opacidade da córnea e queimadura química da pálpebra superior do olho direito. Qual é o correto manejo da paciente?',
    '[{"letter":"A","text":"Prescrição de analgésico tópico e colírio lubrificante","feedback":""},{"letter":"B","text":"Lavagem dos olhos com solução de água boricada e curativo oclusivo","feedback":""},{"letter":"C","text":"Lavagem ocular com solução fisiológica e avaliação imediata do especialista","feedback":""},{"letter":"D","text":"Prescrição de colírio de corticoide tópico e avaliação precoce do especialista","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    -0.27361,
    0.963,
    0.25,
    1.00287,
    0.91511,
    2025,
    'expert'
  ),
  (
    'e2025c10-0094-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mulher de 72 anos, previamente hígida, com menopausa aos 53 anos, obesa, solteira e nulípara, nunca fez reposição hormonal. Chega à Unidade de Pronto Atendimento (UPA) com sangramento vaginal há dois dias, hemodinamicamente estável. Nega sangramentos anteriores. Realizou exame especular, com os seguintes achados: mucosa vaginal sem alterações, colo uterino contendo lesão polipoide que se exteriorizava pelo orifício externo, ectocérvice sem alterações, anexos livres. À ultrassonografia transvaginal, útero contendo 3 nódulos, medindo respectivamente 2,5 cm, 3,5 cm e 1,5 cm em seus maiores diâmetros, sendo o 1º e o 2º intramurais e o 3º submucoso. Endométrio medindo 8 mm de espessura. Colo uterino mostrando lesão polipoide no canal endocervical, medindo 1,5 cm em sua maior dimensão. Qual é a principal hipótese diagnóstica?',
    '[{"letter":"A","text":"Hiperplasia endometrial","feedback":""},{"letter":"B","text":"Câncer de colo de útero","feedback":""},{"letter":"C","text":"Leiomioma submucoso","feedback":""},{"letter":"D","text":"Endométrio atrófico","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    0.30307,
    1.421,
    0.25,
    0.91023,
    0.90726,
    2025,
    'expert'
  ),
  (
    'e2025c10-0095-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Menina de 11 anos é levada pela mãe à consulta médica em Unidade Básica de Saúde (UBS), com história de cansaço, palidez cutânea e baixo rendimento escolar nos últimos 3 meses. Ao exame físico, mucosas hipocrômicas (3+/4+); palidez cutânea. Pulso radial: 104 bpm, rítmico e cheio. Aparelho cardiovascular: sopro sistólico 2/6. Restante do exame físico sem alterações. Mãe apresenta hemograma da menina realizado há 2 semanas. ResultadosValores de referência Hemoglobina8,4 g/dL11,5 a 15,5 g/dL Hematócrito25,3%36 a 48% VCM62 fL80 a 98 fL HCM24 pg27 a 34 pg CHCM28 g/dL31 a 36 g/dL RDW22%11,5 a 14,5% Leucócitos totais8.430/mm 3 4.000 a 10.000/mm 3 Neutrófilos54%40 a 80% Eosinófilos10%0 a 5% Basófilos1%0 a 2% Monócitos4%2 a 10% Linfócitos31%25 a 50% Plaquetas480.000/mm 3 140.000 a 450.000/mm 3 Diante do caso apresentado, assinale a alternativa mais adequada.',
    '[{"letter":"A","text":"Deve-se dosar o ferro sérico, por ser exame sensível e específico, atentando-se para o ritmo circadiano do ferro, cujos valores são mais elevados pela manhã","feedback":""},{"letter":"B","text":"Considerando-se o resultado dos exames, pode-se iniciar tratamento com 4 mg/kg/dia de ferro elementar, e espera- se aumento de reticulócitos em 4 a 7 dias","feedback":""},{"letter":"C","text":"Com base no HCM, a anemia pode ser classificada em normocítica, e o esfregaço de sangue periférico pode evidenciar anisocitose, eliptocitose e poiquilocitose","feedback":""},{"letter":"D","text":"A eosinofilia e a trombocitose observadas justificam o encaminhamento para hematologista, a fim de investigar causas de anemia e comprometimento esplênico. ÁREA LIVRE 23","feedback":""}]'::jsonb,
    1,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    -0.03548,
    1.186,
    0.25,
    0.95297,
    0.93845,
    2025,
    'expert'
  ),
  (
    'e2025c10-0096-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Homem de 30 anos chega para consulta em Unidade Básica de Saúde (UBS) devido à astenia e úlcera no pênis. Trabalha como profissional do sexo e nem sempre faz uso de preservativo. Há cerca de 3 meses, vem notando emagrecimento (10 kg no período), astenia, febre baixa sem horário fixo e, há 1 semana, observou o aparecimento de úlcera dolorosa no pênis. Nega secreção uretral. Ao exame físico, apresenta-se emagrecido, com uma lesão ulcerada com bordas elevadas sem secreção de aproximadamente 3 centímetros logo abaixo da glande, rasa e de base mole, além de linfonodomegalia inguinal direita, com sinais inflamatórios, sem fistulização. Nesse caso, a investigação, o achado esperado e o tratamento referentes à úlcera devem ser, respectivamente,',
    '[{"letter":"A","text":"sorologia para Chlamydia trachomatis; positiva; doxiciclina 100 mg, 2 vezes ao dia, via oral, por 7 dias","feedback":""},{"letter":"B","text":"biópsia da úlcera; bacilos álcool ácido resistentes; esquema inicial com pirazinamida, isoniazida e rifampicina, via oral","feedback":""},{"letter":"C","text":"Veneral Disease Research Laboratory (VDRL); reagente; benzilpenicilina benzatina 1,2 milhão de unidades, intramuscular, dose única","feedback":""},{"letter":"D","text":"microscopia de esfregaço do fundo da úlcera; Gram negativos agrupados em correntes; azitromicina 500 mg, via oral, 2 comprimidos em dose única. ÁREA LIVRE","feedback":""}]'::jsonb,
    3,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'clinica_medica',
    NULL, -- subspecialty
    NULL, -- topic
    0.60964,
    1.435,
    0.25,
    0.91674,
    0.89408,
    2025,
    'expert'
  ),
  (
    'e2025c10-0097-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Mãe de menina de 7 anos, em consulta na Unidade Básica de Saúde (UBS), relata preocupação por a filha ser a menor de sua sala de aula. Nega intercorrências nos períodos gestacional e neonatal. Nega internações ou uso de medicações contínuas. Exame físico sem alterações, estágio de desenvolvimento de Tanner M1P1; peso de 19 kg (z -1); estatura de 1,07 m (-3 < z < -2) com alvo de 1,50 m (z -2); índice de massa corporal de 16,6 (0 < z < +1); relação entre segmento superior e segmento inferior de 1,02 (valor de referência para a idade: 1 a 1,3). Em consulta com 6 anos e 8 meses, apresentava peso de 17 kg (-2 < z < -1); estatura de 1,05 m (-3 < z < -2); índice de massa corporal de 15,4 (z 0), quando foi realizado cálculo de idade óssea compatível com 5 anos e 10 meses. A hipótese diagnóstica adequada para o caso é',
    '[{"letter":"A","text":"acondroplasia","feedback":""},{"letter":"B","text":"síndrome de Turner","feedback":""},{"letter":"C","text":"baixa estatura familiar","feedback":""},{"letter":"D","text":"atraso constitucional do crescimento. ÁREA LIVRE 1 24","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'pediatria',
    NULL, -- subspecialty
    NULL, -- topic
    1.12101,
    0.47,
    0.25,
    1.05511,
    1.10145,
    2025,
    'expert'
  ),
  (
    'e2025c10-0098-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Paciente de 43 anos, sexo feminino, internada em enfermaria de cirurgia. Refere icterícia, colúria e acolia, iniciadas há 72 horas. Paciente nega tabagismo, comorbidades ou episódios semelhantes previamente. Exame físico: ictérica (+++/++++), dor à palpação profunda de hipocôndrio direito; frequência cardíaca de 83 bpm; pressão arterial de 123 x 76 mmHg; temperatura axilar de 37,4 °C. Ultrassonografia de abdome: presença de múltiplas imagens móveis e arredondadas, de 0,5 a 1 cm de diâmetro, e dilatação de vias biliares intra e extra-hepáticas. Exames laboratoriais: ExameResultadoValor de referência Hematócrito50%38 a 52% Leucócitos totais9.000/mL4.000 a 11.000/mL Bastões3%0 a 5% Creatinina0,9 mg/dL0,7 a 1,3 mg/dL TGO45 U/L4 a 35 U/L TGP38 U/L4 a 32 U/L Fosfatase alcalina760 U/L40 a 150 U/L Gama GT900 U/L9 a 36 U/L Bilirrubina total6,2 mg/dL0,2 mg/dL a 1,20 mg/dL Bilirrubina direta5,1 mg/dL0,1 a 0,4 mg/dL Amilase80 U/L28 a 100 U/L Nesse momento, quais são, respectivamente, o diagnóstico sindrômico e o exame complementar mais indicados para prosseguir à investigação?',
    '[{"letter":"A","text":"Síndrome colestática sem colangite; tomografia de abdome com contraste venoso","feedback":""},{"letter":"B","text":"Síndrome colestática com colangite; ressonância nuclear magnética de vias biliares","feedback":""},{"letter":"C","text":"Síndrome colestática sem colangite; ressonância nuclear magnética de vias biliares","feedback":""},{"letter":"D","text":"Síndrome colestática com colangite; colangiopancreatografia retrógrada endoscópica. ÁREA LIVRE","feedback":""}]'::jsonb,
    2,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'cirurgia',
    NULL, -- subspecialty
    NULL, -- topic
    0.00862,
    1.287,
    0.25,
    0.93735,
    0.92222,
    2025,
    'expert'
  ),
  (
    'e2025c10-0099-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Primigesta de 28 anos, com 33 semanas de gestação, pré-natal de risco habitual, chega ao pronto-atendimento obstétrico relatando saída de líquido claro pela vagina há cerca de 2 horas. Ao exame físico, sinais vitais normais, tônus uterino normal, não há presença de contrações, altura uterina é compatível com a idade gestacional, movimentos fetais presentes e frequência cardíaca fetal de 140 bpm. Ao exame especular, nota-se saída de líquido amniótico claro pelo orifício externo do colo uterino. Após a prescrição de antibiótico e corticoterapia antenatal, a conduta adequada a ser adotada é prescrever',
    '[{"letter":"A","text":"internação hospitalar e monitoramento materno-fetal diário","feedback":""},{"letter":"B","text":"internação hospitalar, cardiotocografia e indução imediata do parto","feedback":""},{"letter":"C","text":"alta, repouso domiciliar e monitoramento materno-fetal ambulatorial diário","feedback":""},{"letter":"D","text":"alta, repouso domiciliar e monitoramento materno-fetal ambulatorial semanal","feedback":""}]'::jsonb,
    0,
    'Questão oficial ENAMED 2025. Explicação em elaboração.',
    'ginecologia_obstetricia',
    NULL, -- subspecialty
    NULL, -- topic
    -0.37289,
    1.012,
    0.25,
    0.98022,
    0.97241,
    2025,
    'expert'
  )
ON CONFLICT (id) DO UPDATE SET
  stem = EXCLUDED.stem,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  irt_difficulty = EXCLUDED.irt_difficulty,
  irt_discrimination = EXCLUDED.irt_discrimination,
  irt_guessing = EXCLUDED.irt_guessing,
  irt_infit = EXCLUDED.irt_infit,
  irt_outfit = EXCLUDED.irt_outfit,
  updated_at = NOW();

-- Update question count in question_banks
UPDATE question_banks
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE bank_id = 'e2025000-0000-0000-0000-000000000001'
)
WHERE id = 'e2025000-0000-0000-0000-000000000001';
