-- =====================================================
-- Beta Web Seed: Study Paths + Modules (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Populate public study paths (trilhas) and modules with
-- reading-first content so the beta UI is fully navigable.
--
-- Notes:
-- - Seeds are idempotent via ON CONFLICT (id) DO NOTHING.

-- Darwin Education - Study Paths Seed Data
-- =========================================

-- Study Path 1: Clínica Médica Essencial
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Clínica Médica Essencial',
  'Domine os principais temas de Clínica Médica cobrados no ENAMED. Inclui Cardiologia, Endocrinologia, Pneumologia, Nefrologia e Infectologia.',
  ARRAY['clinica_medica'],
  40.0,
  'medio',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0001-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Hipertensão Arterial Sistêmica',
    'reading',
    '# Hipertensão Arterial Sistêmica

## Definição
PA ≥ 140/90 mmHg em duas ou mais aferições.

## Classificação
- **Normal**: < 120/80
- **Pré-hipertensão**: 120-139/80-89
- **Estágio 1**: 140-159/90-99
- **Estágio 2**: ≥ 160/100

## Tratamento
### Não farmacológico
- Restrição de sódio (< 2g/dia)
- Atividade física regular
- Perda de peso
- Cessação do tabagismo

### Farmacológico
1. **IECA/BRA**: Preferência em DM, DRC, IC
2. **BCC**: Boa opção em idosos
3. **Tiazídicos**: Baixo custo, eficazes
4. **Betabloqueadores**: IC, pós-IAM',
    30,
    1
  ),
  (
    'b1000000-0000-0000-0001-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Quiz: Hipertensão',
    'quiz',
    NULL,
    20,
    2
  ),
  (
    'b1000000-0000-0000-0001-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Diabetes Mellitus',
    'reading',
    '# Diabetes Mellitus

## Critérios Diagnósticos
- Glicemia de jejum ≥ 126 mg/dL (2x)
- Glicemia 2h pós-TOTG ≥ 200 mg/dL
- HbA1c ≥ 6.5%
- Glicemia aleatória ≥ 200 + sintomas

## Classificação
- **DM1**: Autoimune, deficiência absoluta de insulina
- **DM2**: Resistência insulínica, mais comum
- **DMG**: Diagnóstico na gestação

## Metas de Controle
- HbA1c < 7% (geral)
- Glicemia jejum 80-130 mg/dL
- Glicemia pós-prandial < 180 mg/dL

## Tratamento DM2
1. Metformina (1ª linha)
2. Adicionar segundo agente baseado no perfil
3. Insulinização quando necessário',
    35,
    3
  ),
  (
    'b1000000-0000-0000-0001-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'Flashcards: Endocrinologia',
    'flashcards',
    NULL,
    25,
    4
  ),
  (
    'b1000000-0000-0000-0001-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'DPOC e Asma',
    'reading',
    '# Doenças Obstrutivas

## DPOC

### Diagnóstico
- VEF1/CVF < 0.70 pós-BD
- Tabagismo ou exposição ocupacional

### Classificação GOLD (VEF1 pós-BD)
- GOLD 1: ≥ 80%
- GOLD 2: 50-79%
- GOLD 3: 30-49%
- GOLD 4: < 30%

### Tratamento
- Cessação do tabagismo
- Broncodilatadores de longa duração
- CI se exacerbador frequente

## Asma

### Diagnóstico
- Sintomas variáveis
- Obstrução reversível (VEF1 ≥ 12% e 200mL)

### Tratamento
- Steps 1-5 GINA
- CI é base do tratamento
- LABA como add-on',
    40,
    5
  )
ON CONFLICT (id) DO NOTHING;

-- Study Path 2: Cirurgia para o ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'Cirurgia para o ENAMED',
  'Temas cirúrgicos mais cobrados: abdome agudo, trauma, hérnias, oncologia cirúrgica e urgências.',
  ARRAY['cirurgia'],
  35.0,
  'medio',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0002-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'Abdome Agudo',
    'reading',
    '# Abdome Agudo

## Classificação
1. **Inflamatório**: Apendicite, colecistite, diverticulite
2. **Obstrutivo**: Bridas, hérnias, tumores
3. **Perfurativo**: Úlcera, divertículo
4. **Vascular**: Isquemia mesentérica
5. **Hemorrágico**: Aneurisma roto, gravidez ectópica

## Apendicite Aguda

### Quadro Clínico
- Dor periumbilical → FID
- Anorexia, náuseas
- Sinais: Blumberg, Rovsing, psoas

### Diagnóstico
- Clínico (score Alvarado)
- TC se dúvida

### Tratamento
- Apendicectomia (aberta ou VLP)
- ATB se complicada',
    30,
    1
  ),
  (
    'b1000000-0000-0000-0002-000000000002',
    'a1000000-0000-0000-0000-000000000002',
    'Trauma - ATLS',
    'reading',
    '# Atendimento ao Trauma

## ABCDE
- **A**: Airway + cervical
- **B**: Breathing
- **C**: Circulation
- **D**: Disability
- **E**: Exposure

## Choque Hemorrágico

| Classe | Perda | FC | PA | Diurese |
|--------|-------|----|----|---------|
| I | <15% | <100 | Normal | >30 |
| II | 15-30% | 100-120 | Normal | 20-30 |
| III | 30-40% | 120-140 | ↓ | 5-15 |
| IV | >40% | >140 | ↓↓ | Anúria |

## Lesões com Risco de Vida
- Obstrução de via aérea
- Pneumotórax hipertensivo
- Pneumotórax aberto
- Hemotórax maciço
- Tamponamento cardíaco
- Tórax instável',
    45,
    2
  ),
  (
    'b1000000-0000-0000-0002-000000000003',
    'a1000000-0000-0000-0000-000000000002',
    'Quiz: Trauma e Urgências',
    'quiz',
    NULL,
    25,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Study Path 3: GO Completo
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Ginecologia e Obstetrícia Completo',
  'Pré-natal, parto, puerpério, patologias ginecológicas e oncologia ginecológica.',
  ARRAY['ginecologia_obstetricia'],
  45.0,
  'medio',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0003-000000000001',
    'a1000000-0000-0000-0000-000000000003',
    'Pré-Natal de Baixo Risco',
    'reading',
    '# Assistência Pré-Natal

## Consultas
- Mínimo 6 consultas
- Mensais até 28 sem
- Quinzenais 28-36 sem
- Semanais após 36 sem

## Exames por Trimestre

### 1º Trimestre
- Hemograma, tipagem ABO/Rh
- Glicemia jejum, VDRL, HIV
- Toxoplasmose, rubéola
- Urina I, urocultura
- USG (11-14 sem)

### 2º Trimestre
- TOTG 75g (24-28 sem)
- USG morfológico (20-24 sem)

### 3º Trimestre
- Hemograma, VDRL, HIV
- Cultura para GBS (35-37 sem)

## Suplementação
- Ácido fólico: 5mg/dia (pré-concepcional até 12 sem)
- Sulfato ferroso: 40mg Fe elementar/dia',
    40,
    1
  ),
  (
    'b1000000-0000-0000-0003-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'Síndromes Hipertensivas',
    'reading',
    '# Síndromes Hipertensivas na Gestação

## Classificação
1. **HAC**: Antes de 20 sem ou persiste > 12 sem pós-parto
2. **Pré-eclâmpsia**: Após 20 sem + proteinúria ou disfunção orgânica
3. **Eclâmpsia**: PE + convulsões
4. **HELLP**: Hemólise + enzimas hepáticas ↑ + plaquetopenia

## Critérios de Gravidade da PE
- PA ≥ 160/110 mmHg
- Proteinúria > 5g/24h
- Oligúria < 500 mL/24h
- Sintomas neurológicos
- Epigastralgia
- Edema pulmonar
- Trombocitopenia
- Elevação de transaminases

## Tratamento
### PE sem sinais de gravidade
- Acompanhamento ambulatorial
- Interrupção com 37 semanas

### PE grave
- Internação
- Sulfato de magnésio (profilaxia de eclâmpsia)
- Anti-hipertensivos (nifedipino, hidralazina)
- Interrupção conforme idade gestacional',
    35,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- Study Path 4: Pediatria Essencial
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'Pediatria Essencial',
  'Puericultura, neonatologia, doenças infecciosas e urgências pediátricas.',
  ARRAY['pediatria'],
  38.0,
  'medio',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0004-000000000001',
    'a1000000-0000-0000-0000-000000000004',
    'Aleitamento Materno',
    'reading',
    '# Aleitamento Materno

## Tipos
- **Exclusivo**: Apenas leite materno (6 meses)
- **Predominante**: LM + água, chás
- **Complementado**: LM + outros alimentos
- **Misto**: LM + outros leites

## Benefícios
### Para o bebê
- Proteção contra infecções
- Menor mortalidade
- Melhor desenvolvimento cognitivo
- Proteção contra alergias

### Para a mãe
- Involução uterina
- Amenorreia lactacional
- Proteção contra CA mama/ovário
- Vínculo mãe-bebê

## Técnica
- Pega correta: boca bem aberta, lábio inferior evertido, aréola mais visível acima
- Livre demanda
- Esvaziar uma mama antes de oferecer outra

## Contraindicações
- HIV, HTLV
- Galactosemia
- Medicamentos contraindicados',
    30,
    1
  ),
  (
    'b1000000-0000-0000-0004-000000000002',
    'a1000000-0000-0000-0000-000000000004',
    'Calendário Vacinal',
    'reading',
    '# Calendário Nacional de Vacinação

## Ao nascer
- BCG
- Hepatite B

## 2 meses
- Penta (DTP + Hib + HepB)
- VIP
- Pneumo 10
- Rotavírus

## 3 meses
- Meningo C

## 4 meses
- Penta (2ª dose)
- VIP (2ª dose)
- Pneumo 10 (2ª dose)
- Rotavírus (2ª dose)

## 5 meses
- Meningo C (2ª dose)

## 6 meses
- Penta (3ª dose)
- VIP (3ª dose)
- COVID-19

## 9 meses
- Febre Amarela

## 12 meses
- Pneumo 10 (reforço)
- Meningo C (reforço)
- Tríplice viral

## 15 meses
- DTP (1º reforço)
- VOP (1º reforço)
- Hepatite A
- Tetra viral',
    35,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- Study Path 5: Saúde Coletiva
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'Saúde Coletiva e Epidemiologia',
  'SUS, vigilância, epidemiologia, bioestatística e ética médica.',
  ARRAY['saude_coletiva'],
  30.0,
  'medio',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0005-000000000001',
    'a1000000-0000-0000-0000-000000000005',
    'Sistema Único de Saúde',
    'reading',
    '# Sistema Único de Saúde

## Base Legal
- Constituição Federal 1988 (Art. 196-200)
- Lei 8080/1990 (Lei Orgânica)
- Lei 8142/1990 (Participação Social)

## Princípios Doutrinários
1. **Universalidade**: Acesso a todos
2. **Integralidade**: Ações de promoção, prevenção e recuperação
3. **Equidade**: Tratar desigualmente os desiguais

## Princípios Organizativos
1. **Descentralização**: Comando único em cada esfera
2. **Regionalização e Hierarquização**: Níveis de complexidade
3. **Participação da Comunidade**: Conselhos e conferências

## Financiamento
- Tripartite: União, Estados e Municípios
- EC 29/2000: Vinculação de recursos
- Estados: 12% da receita
- Municípios: 15% da receita

## Instâncias de Pactuação
- CIT (tripartite)
- CIB (bipartite)
- CIR (regional)',
    40,
    1
  ),
  (
    'b1000000-0000-0000-0005-000000000002',
    'a1000000-0000-0000-0000-000000000005',
    'Epidemiologia Básica',
    'reading',
    '# Epidemiologia

## Medidas de Frequência

### Incidência
- Casos novos / população em risco no período
- Mede risco

### Prevalência
- Casos existentes / população total
- Mede carga de doença
- Prevalência = Incidência × Duração

## Medidas de Associação

### Risco Relativo (RR)
- Estudos de coorte
- RR = Incidência expostos / Incidência não expostos

### Odds Ratio (OR)
- Estudos caso-controle
- OR = (a×d) / (b×c)

### Razão de Prevalência (RP)
- Estudos transversais

## Validade de Testes

### Sensibilidade
- VP / (VP + FN)
- Capacidade de detectar doentes

### Especificidade
- VN / (VN + FP)
- Capacidade de detectar sadios

### VPP
- VP / (VP + FP)
- Depende da prevalência

### VPN
- VN / (VN + FN)
- Depende da prevalência',
    45,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- Study Path 6: Preparação Intensiva ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, prerequisites, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'Preparação Intensiva ENAMED',
  'Revisão completa das 5 áreas com foco nos temas mais cobrados. Ideal para reta final.',
  ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
  80.0,
  'dificil',
  ARRAY['a1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid],
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'b1000000-0000-0000-0006-000000000001',
    'a1000000-0000-0000-0000-000000000006',
    'Simulado Diagnóstico',
    'quiz',
    NULL,
    180,
    1
  ),
  (
    'b1000000-0000-0000-0006-000000000002',
    'a1000000-0000-0000-0000-000000000006',
    'Revisão: Clínica Médica',
    'reading',
    '# Revisão Rápida: Clínica Médica

## Cardiologia
- IC: Critérios de Framingham, tratamento com IECA+BB+diurético
- FA: CHA2DS2-VASc para anticoagulação
- SCA: IAMCSST = reperfusão em 12h

## Pneumologia
- DPOC: Espirometria + VEF1/CVF < 0.70
- Asma: Reversibilidade + CI base

## Endocrinologia
- DM: HbA1c < 7%, metformina 1ª linha
- Hipotireoidismo: TSH ↑, T4L ↓, levotiroxina

## Nefrologia
- DRC: TFG + albuminúria, IECA nefroprotetor
- IRA: Pré-renal vs renal vs pós-renal

## Infectologia
- HIV: CD4 < 200 → profilaxia PCP
- Meningite: Punção e ATB empírico',
    60,
    2
  ),
  (
    'b1000000-0000-0000-0006-000000000003',
    'a1000000-0000-0000-0000-000000000006',
    'Simulado Final',
    'quiz',
    NULL,
    300,
    3
  )
ON CONFLICT (id) DO NOTHING;


-- Darwin Education - New Study Paths
-- ===================================

-- Path 7: Emergências Médicas
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Médicas',
  'Preparação para emergências médicas: PCR, ACLS, emergências cardiovasculares, respiratórias e metabólicas.',
  ARRAY['clinica_medica', 'cirurgia'],
  30.0,
  'dificil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 8: Medicina Baseada em Evidências
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'Medicina Baseada em Evidências',
  'Fundamentos de MBE: níveis de evidência, leitura crítica, revisão sistemática e meta-análise.',
  ARRAY['saude_coletiva'],
  20.0,
  'medio',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 9: Ética e Bioética Médica
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000009',
  'Ética e Bioética Médica',
  'Princípios bioéticos, Código de Ética Médica e dilemas em situações especiais.',
  ARRAY['saude_coletiva'],
  15.0,
  'facil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 10: Revisão Final ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Final ENAMED',
  'Revisão multidisciplinar das 5 áreas com simulados e flashcards para a reta final.',
  ARRAY['clinica_medica','cirurgia','ginecologia_obstetricia','pediatria','saude_coletiva'],
  50.0,
  'dificil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- Modules for Path 7: Emergências Médicas
-- ========================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000001',
  'a1000000-0000-0000-0000-000000000007',
  'PCR e ACLS',
  'reading',
  '# PCR e ACLS

## Sequência BLS: CAB
Compressões 100-120/min, profundidade 5-6 cm, recoil completo. Proporção 30:2 (compressões:ventilações).

## Ritmos Chocáveis: FV e TV sem Pulso
- Desfibrilação: 200 J bifásico
- Amiodarona: 300 mg IV bolus (repetir 150 mg)
- Adrenalina: 1 mg IV a cada 3-5 min
- RCP por 2 min entre choques

## Ritmos Não Chocáveis: Assistolia e AESP
- Adrenalina 1 mg IV a cada 3-5 min
- Buscar causas reversíveis: **5H 5T**
  - Hipóxia, Hipovolemia, Hipo/Hipercalemia, H+ (acidose), Hipotermia
  - Tensão (pneumotórax), Tamponamento, Trombose coronária, Trombose pulmonar, Tóxicos

## Algoritmo ACLS
Ciclo contínuo: confirmar PCR → RCP → monitorar ritmo a cada 2 min → choque se indicado → drogas → IOT quando oportuno. Rotacionar compressores a cada 2 min.

## Cuidados Pós-PCR (ROSC)
- SpO2 92-98%, MAP >65 mmHg
- **Controle direcionado de temperatura (TTM)**: 32-36°C por ≥24h em comatosos pós-PCR (todos os ritmos); prevenir febre ≥37,7°C
- Cateterismo urgente se IAMCSST
- Monitoração neurológica em UTI por 72h',
  30,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000002',
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Cardiovasculares',
  'reading',
  '# Emergências Cardiovasculares

## Síndrome Coronariana Aguda (SCA)
### IAMCSST
- ECG: supra ST ≥1 mm em ≥2 derivações contíguas (≥2 mm em V1-V3 homens >40a; ≥2,5 mm em <40a)
- Troponina elevada
- Reperfusão em <12h: angioplastia primária (preferencial, porta-balão <90 min) ou trombolítico
- AAS 300 mg + ticagrelor 180 mg (preferencial, ESC/AHA) ou prasugrel 60 mg + anticoagulante

### IAMSSST
- Depressão ST ou inversão T + troponina positiva
- Estratificação de risco (GRACE score)
- Cateterismo em 24-72h conforme risco

## Tromboembolismo Pulmonar (TEP)
- **Escore de Wells**: TVP +3, FC>100 +1,5, imobilização/cirurgia +1,5, TEP prévio +1,5, hemoptise +1, câncer +1, diagnóstico alternativo menos provável +3
- D-dímero: se baixa probabilidade e negativo, descarta
- **Angio-TC**: confirmação diagnóstica
- Tratamento: heparina; trombolítico (alteplase 100mg) se maciço

## Dissecção de Aorta
- **Stanford A**: ascendente → cirurgia urgente
- **Stanford B**: descendente → tratamento clínico
- TC contrastada para diagnóstico
- Labetalol IV: FC <60, PAS <120

## Emergência Hipertensiva
PA >180/120 + lesão de órgão-alvo (encefalopatia, EAP, IAM)
- Nitroprussiato IV: redução 25% em 1h',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000003',
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Respiratórias',
  'reading',
  '# Emergências Respiratórias

## IRpA: Tipo I vs Tipo II
- **Tipo I (hipoxêmica)**: PaO2 <60 mmHg, PaCO2 normal. P/F <300. Causas: pneumonia, EAP
- **Tipo II (hipercápnica)**: PaCO2 >45 mmHg + acidose. Causas: DPOC, fadiga muscular
- Gasometria arterial é essencial

## Crise de Asma Grave
Sibilos + taquipneia >30 + SpO2 <92% + uso de acessórios.

### Tratamento Escalonado
1. Salbutamol NBZ 2,5-5 mg a cada 20 min (3 doses)
2. Ipratrópio NBZ 0,5 mg associado
3. Corticoide IV: metilprednisolona 125 mg
4. Sulfato de magnésio IV: 2 g em 20 min
5. IOT se: fadiga, PaCO2 >45, confusão mental

## Pneumotórax Hipertensivo
Emergência: colapso pulmonar com pressão intratorácica elevada.

### Sinais
- Desvio traqueal contralateral
- Hipotensão + turgência jugular
- Hiperressonância + MV abolido

### Tratamento
1. **Toracocentese descompressiva**: agulha 14G no 2º EIC linha hemiclavicular (alternativa: 4º-5º EIC linha axilar anterior — ATLS 10ª ed.)
2. **Drenagem torácica**: tubo 28-32 Fr no 5º EIC linha axilar média, selo d''água',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000004',
  'a1000000-0000-0000-0000-000000000007',
  'Intoxicações e Emergências Metabólicas',
  'reading',
  '# Intoxicações e Emergências Metabólicas

## Cetoacidose Diabética (CAD)
Glicose >250, pH <7,3, bicarbonato <18, cetonúria.

### Tratamento
1. **SF 0,9%**: 1-1,5 L na 1ª hora, depois 250-500 mL/h
2. **Insulina regular IV**: 0,1 U/kg/h (meta: redução 50-75 mg/dL/h)
3. **Reposição de K+**: 20-40 mEq/L se K+ 3,3-5,2; **ADIAR insulina se K+ <3,3 mEq/L** até correção (risco de arritmia fatal)
4. Tratar fator precipitante (infecção)

## Crise Tireotóxica
Escore de Burch-Wartofsky >45.
- Propiltiouracil 500-1000 mg dose de ataque, depois 200-300 mg 6/6h → Lugol após 1h (5 gts 6/6h)
- Propranolol para controle adrenérgico
- Hidrocortisona 100 mg IV 8/8h

## Intoxicações Comuns
| Agente | Antídoto |
|--------|----------|
| Paracetamol | N-acetilcisteína (NAC) |
| Organofosforados | Atropina + pralidoxima |
| Benzodiazepínicos | Flumazenil |
| Opioides | Naloxona |
| Cumarínicos | Vitamina K |

## Hipercalemia (K+ >6,5)
1. Gluconato de cálcio 10% 10 mL IV em 2-3 min (estabiliza membrana — NÃO reduz K+)
2. Insulina regular 10 UI + glicose 50% 50 mL IV (desloca K+ intracelular, reduz ~0,5-1 mEq/L em 15-30 min)
3. Salbutamol NBZ 10-20 mg (reduz ~0,5 mEq/L)
4. Resina de troca (poliestirenossulfonato) ou diálise se refratária',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000005',
  'a1000000-0000-0000-0000-000000000007',
  'Quiz: Emergências',
  'quiz',
  NULL,
  60,
  5
) ON CONFLICT (id) DO NOTHING;

-- ====================================================
-- Modules for Path 8: Medicina Baseada em Evidências
-- ====================================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000001',
  'a1000000-0000-0000-0000-000000000008',
  'Níveis de Evidência e Graus de Recomendação',
  'reading',
  '# Níveis de Evidência e Graus de Recomendação

## Pirâmide de Evidências
Da base ao topo:
1. Opinião de especialista
2. Série de casos
3. Caso-controle
4. Coorte
5. Ensaio Clínico Randomizado (ECR)
6. **Revisão Sistemática / Meta-análise** (topo)

## Sistema Oxford CEBM
- **1a**: RS de ECRs homogêneos
- **1b**: ECR individual bem desenhado
- **2a**: RS de coortes
- **2b**: Coorte individual
- **3a**: RS de caso-controle
- **3b**: Caso-controle individual
- **4**: Série de casos
- **5**: Opinião de especialista

## Graus de Recomendação
- **A**: Consistente nível 1
- **B**: Estudos nível 2-3 consistentes
- **C**: Estudos nível 4
- **D**: Nível 5 ou inconsistentes

## Sistema GRADE
Qualidade: alta, moderada, baixa, muito baixa.
- Inicia como alta para ECRs, pode ser rebaixada por viés, inconsistência, imprecisão
- Inicia como baixa para observacionais, pode ser elevada por grande efeito
- Força: forte ou condicional',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000002',
  'a1000000-0000-0000-0000-000000000008',
  'Leitura Crítica de Artigos',
  'reading',
  '# Leitura Crítica de Artigos

## Estrutura PICO
- **P**: População (ex: adultos com DM2)
- **I**: Intervenção (metformina)
- **C**: Comparação (placebo)
- **O**: Outcome (controle glicêmico)

## Validade Interna
- Viés de seleção: randomização adequada?
- Viés de aferição: cegamento (simples/duplo/triplo)?
- Viés de confusão: fatores não controlados?
- Análise por intenção de tratar (ITT)

## Validade Externa
Generalização para outras populações. Considerar critérios de inclusão/exclusão.

## Medidas de Efeito
- **RR (Risco Relativo)**: incidência expostos / não expostos. RR <1 = protetor
- **RRA**: diferença absoluta entre grupos
- **OR (Odds Ratio)**: aproxima RR em eventos raros
- **NNT**: 1/RRA. Quanto menor, mais eficaz
- **NNH**: 1/aumento absoluto de risco (dano)

## IC 95% e Significância
- IC que não cruza 1 (para RR/OR) = significativo
- p <0,05 rejeita H0
- Significância estatística ≠ clínica

## CONSORT
Checklist com 25 itens para relato de ECRs: fluxograma, randomização, cegamento, baselines.',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000003',
  'a1000000-0000-0000-0000-000000000008',
  'Revisão Sistemática e Meta-análise',
  'reading',
  '# Revisão Sistemática e Meta-análise

## Protocolo PRISMA
Padroniza relatórios: identificação → triagem → elegibilidade → inclusão.
- 27 itens obrigatórios
- Registro em PROSPERO para transparência

## Busca em Bases
- **PubMed**: termos MeSH, operadores booleanos
- **LILACS**: literatura latino-americana
- **Cochrane Library**: revisões prontas
- Incluir literatura cinzenta (clinicaltrials.gov)

## Forest Plot
- Cada estudo: quadrado (efeito) + linha horizontal (IC)
- **Diamante**: efeito combinado da meta-análise
- À esquerda de 1 (para RR/OR) = favorece tratamento

## Heterogeneidade I²
- **<25%**: baixa
- **25-75%**: moderada
- **>75%**: alta
- Teste qui-quadrado: p <0,10 indica heterogeneidade
- Se alta: análise de subgrupos ou modelo de efeitos aleatórios

## Funnel Plot
Efeito vs tamanho amostral. Assimetria sugere viés de publicação.
- Teste de Egger quantifica a assimetria

## Análise de Sensibilidade
Excluir estudos de baixa qualidade ou outliers para testar robustez do resultado.',
  20,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000004',
  'a1000000-0000-0000-0000-000000000008',
  'Quiz: MBE',
  'quiz',
  NULL,
  60,
  4
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Modules for Path 9: Ética e Bioética Médica
-- =============================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000001',
  'a1000000-0000-0000-0000-000000000009',
  'Princípios da Bioética',
  'reading',
  '# Princípios da Bioética

## Beauchamp e Childress (1979)
Quatro princípios fundamentais da bioética médica:

## Autonomia
Respeitar a capacidade decisória do paciente.
- **Consentimento informado**: informação clara, voluntariedade, competência
- Avaliar capacidade de compreensão e comunicação
- Direito à **recusa de tratamento**, mesmo vital
- Em menores: envolver pais, mas adolescentes maduros podem consentir

## Beneficência
Agir pelo bem do paciente; maximizar benefícios.
- Basear condutas em evidências científicas
- Evitar paternalismo: respeitar escolhas informadas

## Não-Maleficência
*Primum non nocere* — não causar dano.
- Ponderar riscos vs benefícios de cada intervenção
- Evitar procedimentos fúteis ou desnecessários

## Justiça
Distribuição equitativa de recursos e cuidados.
- **Justiça distributiva**: alocação de UTIs, transplantes
- Sem discriminação por raça, gênero, status social
- No SUS: garantir acesso universal (Lei 8.080/90)

## Dignidade e Vulnerabilidade
- Preservar privacidade em todos os estágios
- Proteção especial a vulneráveis: idosos, crianças, indígenas
- Comitês de ética hospitalar para dilemas complexos',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000002',
  'a1000000-0000-0000-0000-000000000009',
  'Código de Ética Médica',
  'reading',
  '# Código de Ética Médica

## Base Legal
Resolução CFM nº 2.217/2018 (atualizado).

## Direitos do Médico
- Remuneração justa e condições de trabalho seguras
- Liberdade de exercício profissional
- Pode recusar paciente fora de plantão (exceto emergência)

## Sigilo Profissional (Art. 22-31)
- Sigilo é **absoluto**: não divulgar informações sem consentimento
- Exceções: dever legal de notificação (doenças compulsórias), risco iminente a terceiros
- Mantenha sigilo mesmo após morte do paciente

## Relação Médico-Paciente
- Informar riscos e benefícios de procedimentos
- Evitar propaganda enganosa (Art. 34): proibida autopromoção sensacionalista
- Respeitar segunda opinião

## Infrações Éticas
- **Imperícia**: falta de conhecimento técnico
- **Imprudência**: ação precipitada sem cautela
- **Negligência**: omissão de cuidados devidos

## Punições
Advertência → censura → suspensão → cassação do registro

## Processo Ético-Disciplinar
- Denúncia ao CRM → investigação → defesa → julgamento
- Direito a ampla defesa
- Apelação ao CFM',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000003',
  'a1000000-0000-0000-0000-000000000009',
  'Ética em Situações Especiais',
  'reading',
  '# Ética em Situações Especiais

## Terminalidade
Fase irreversível da doença com morte iminente. Foco em qualidade de vida.

### Cuidados Paliativos (OMS)
- Alívio de dor e sintomas (escada analgésica)
- Suporte psicológico ao paciente e família
- Não acelerar nem postergar a morte

## Eutanásia
Ato de provocar a morte para aliviar sofrimento.
- **Crime no Brasil**: Código Penal art. 121 (homicídio)
- Proibida pelo CFM, mesmo com consentimento do paciente

## Distanásia
Obstinação terapêutica: prolongar sofrimento com medidas fúteis.
- Viola princípio da não-maleficência
- Ex: manter ventilação mecânica em coma irreversível

## Ortotanásia
Morte natural digna, sem prolongamento artificial.
- **Resolução CFM 1.805/2006**: permite suspender medidas desproporcionais
- Com consentimento do paciente ou representante legal
- Médico pode limitar ou suspender tratamentos fúteis

## Diretivas Antecipadas de Vontade (DAV)
**Resolução CFM 1.995/2012**: expressão prévia de preferências para fim de vida.
- Requer duas testemunhas
- Válida quando paciente perde capacidade de decisão
- Equipe deve respeitar, exceto se contraindicação ética
- Ex: recusa de IOT, preferência por sedação paliativa',
  20,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000004',
  'a1000000-0000-0000-0000-000000000009',
  'Quiz: Ética',
  'quiz',
  NULL,
  60,
  4
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Modules for Path 10: Revisão Final ENAMED
-- ==========================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000001',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Cirurgia',
  'reading',
  '# Revisão Rápida: Cirurgia

## Abdome Agudo
- **Apendicite**: Dor FID, Alvarado >7 → cirurgia. Murphy → colecistite
- **Colecistite**: USG (litíase + parede espessada). Colecistectomia 72h

## Trauma ATLS
- ABCDE: via aérea → respiração → circulação → neurológico → exposição
- FAST: hemoperitônio (líquido em Morrison, Douglas, esplênico)
- Choque hemorrágico: classes I-IV, cristaloides + hemoderivados

## Hérnias
- Inguinal: Lichtenstein (tela tension-free). TEP/TAPP se bilateral
- Femoral: maior risco de estrangulamento
- Emergência se encarceramento + sinais de isquemia

## Câncer Colorretal
- Rastreio: colonoscopia >50 anos
- CEA: monitoramento (não diagnóstico)
- Tratamento: colectomia + linfadenectomia ≥12 linfonodos

## Obstrução Intestinal
- **Delgado**: bridas (pós-cirúrgica), RX com níveis hidroaéreos
- **Grosso**: tumor (colonoscopia). Vólvulo de sigmoide: descompressão endoscópica',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000002',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: GO',
  'reading',
  '# Revisão Rápida: Ginecologia e Obstetrícia

## Pré-Natal
- Mínimo 6 consultas; mensal até 28s, quinzenal até 36s, semanal após
- 1º tri: tipagem, VDRL, HIV, toxo, USG 11-14s
- 2º tri: TOTG 24-28s, USG morfológico
- 3º tri: repetir sorologias, cultura GBS 35-37s

## DHEG (Pré-eclâmpsia)
- PA >140/90 após 20 sem + proteinúria ou LOA
- MgSO4 (Pritchard ou Zuspan) para profilaxia de eclâmpsia
- Parto se ≥37 sem ou grave refratária

## Diabetes Gestacional
- TOTG 75g 24-28 sem: jejum >92, 1h >180, 2h >153
- Dieta + atividade física → insulina se falha
- Macrossomia fetal é complicação principal

## CA Colo Uterino
- Rastreio: Papanicolau (citologia) anual
- HPV 16/18 responsáveis por 70%
- NIC → HSIL → conização; CA invasivo: histerectomia + radio

## Métodos Contraceptivos
- DIU-Cu: 10 anos, 99% eficácia
- DIU-LNG: 5 anos, reduz sangramento
- Implante subdérmico: 3-5 anos, 99,9% eficácia',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000003',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Pediatria',
  'reading',
  '# Revisão Rápida: Pediatria

## Aleitamento Materno
- Exclusivo até 6 meses; complementado até 2 anos
- Protege contra infecções (IgA secretora), reduz mortalidade
- Contraindicações: HIV, HTLV, galactosemia

## Calendário Vacinal
- Nascimento: BCG + Hepatite B
- 2/4/6 meses: Penta, VIP, Pneumo 10, Rotavírus
- 12 meses: Tríplice viral, Pneumo reforço, Meningo C reforço
- 15 meses: DTP reforço, VOP, Hepatite A, Tetra viral

## Doenças Exantemáticas
- **Sarampo**: Koplik + exantema cefalocaudal
- **Varicela**: vesículas em estágios diferentes
- **Escarlatina**: língua framboesa + rash "lixa"
- **Eritema infeccioso**: face esbofeteada

## Desidratação
- Plano A: SRO domiciliar (leve)
- Plano B: SRO supervisionado 75 mL/kg/4h (moderada)
- Plano C: SF IV 20 mL/kg bolus (grave)
- Zinco em diarreia aguda

## IVAS
- Otite: amoxicilina se <2 anos ou grave
- Amigdalite: Centor → penicilina se estreptocócica',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000004',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Saúde Coletiva',
  'reading',
  '# Revisão Rápida: Saúde Coletiva

## SUS
- Princípios doutrinários: universalidade, equidade, integralidade
- Leis orgânicas: 8.080/90 e 8.142/90
- Financiamento tripartite; descentralização

## Epidemiologia
- **Incidência**: casos novos / população em risco
- **Prevalência**: casos existentes / total (prevalência = incidência × duração)
- **RR**: incidência expostos / não expostos (coorte)
- **OR**: odds expostos / não expostos (caso-controle)

## ESF (Estratégia Saúde da Família)
- Equipe: médico, enfermeiro, técnicos, ACS
- 1 ACS para cada 150-200 famílias
- Território definido, visitas domiciliares

## Vigilância em Saúde
- Notificação compulsória: >60 doenças (SINAN)
- Surto: ≥2 casos relacionados no tempo/espaço
- Investigação: busca ativa, bloqueio vacinal

## Bioestatística
- ECR: padrão-ouro para causalidade
- NNT = 1/RRA (baixo = eficaz)
- IC 95%: se não cruza 1, significativo
- p <0,05 rejeita hipótese nula',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000005',
  'a1000000-0000-0000-0000-000000000010',
  'Flashcards: Revisão Multidisciplinar',
  'flashcards',
  NULL,
  120,
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000006',
  'a1000000-0000-0000-0000-000000000010',
  'Simulado Completo Final',
  'quiz',
  NULL,
  300,
  6
) ON CONFLICT (id) DO NOTHING;


-- Darwin Education - New Study Modules for Existing Paths
-- ======================================================

-- Path 1: CM - Insuficiência Cardíaca
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Insuficiência Cardíaca',
  'reading',
  '# Insuficiência Cardíaca

## Definição
Síndrome clínica caracterizada pela incapacidade do coração em bombear sangue suficiente para atender às demandas metabólicas, resultando em dispneia, fadiga e retenção de líquidos.

## Classificação NYHA
- **Classe I**: Sem limitação; atividade física ordinária não causa sintomas
- **Classe II**: Leve limitação; conforto em repouso, atividade leve causa fadiga ou dispneia
- **Classe III**: Limitação marcada; sintomas com atividade mínima
- **Classe IV**: Incapacidade; sintomas presentes em repouso

## Critérios de Framingham
### Maiores
Dispneia paroxística noturna, ortopneia, estertores pulmonares, galope B3, turgência jugular, PVC >16 cmH2O, cardiomegalia, refluxo hepatojugular, edema agudo de pulmão, perda >4,5 kg com diurético

### Menores
Edema bilateral, tosse noturna, dispneia aos esforços, hepatomegalia, derrame pleural, FC >120 bpm, capacidade vital reduzida em 1/3

Diagnóstico: 2 maiores OU 1 maior + 2 menores.

## Tratamento Escalonado (ICFER)

### IECA/BRA
Enalapril: reduz mortalidade em IC grave NYHA IV em 40% aos 6 meses (CONSENSUS) e 16% em IC leve-moderada (SOLVD-Treatment). Sacubitril/valsartana superior ao enalapril em 20% no desfecho composto (PARADIGM-HF). Monitorar função renal e potássio.

### Betabloqueadores
Carvedilol, bisoprolol ou metoprolol succinato. Reduzem mortalidade em 34%. Titulação gradual após estabilização.

### Espironolactona
Antagonista da aldosterona; reduz mortalidade em 30% (RALES). Dose 25mg/dia. Monitorar K+ e creatinina.

### Inibidores SGLT2
Dapagliflozina, empagliflozina. Reduzem desfecho composto (morte CV + hospitalização por IC) em 26% (DAPA-HF, HR 0,74) e 25% (EMPEROR-Reduced, HR 0,75), independente da FE. Benefícios em função renal (DAPA-CKD: 39% redução desfecho renal composto).

## Dispositivos
- DAI: prevenção morte súbita em FE <35%
- TRC: dissincronismo com BRE e FE <35%',
  30,
  6
) ON CONFLICT (id) DO NOTHING;

-- Path 1: CM - IRA e DRC
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Insuficiência Renal Aguda e Crônica',
  'reading',
  '# Insuficiência Renal Aguda e Crônica

## Insuficiência Renal Aguda (IRA)
Aumento rápido da creatinina sérica (≥0,3 mg/dL em 48h ou ≥50% em 7 dias) ou oligúria (<0,5 mL/kg/h por 6h).

### Classificação por Causa
- **Pré-renal (60%)**: Hipoperfusão sem dano tubular. BUN/Cr >20, FeNa <1%
- **Renal (35%)**: Dano intrínseco (NTA, nefrite, glomerulonefrite). FeNa >2%
- **Pós-renal (5%)**: Obstrução (litíase, HPB). USG com hidronefrose

### Manejo
Correção da causa, hidratação em pré-renal, alívio de obstrução em pós-renal.

### Indicações de Diálise de Urgência
- K+ >6,5 mEq/L refratário
- Acidose pH <7,2 refratária
- Uremia sintomática (encefalopatia, pericardite)
- Sobrecarga volêmica refratária

## Doença Renal Crônica (DRC)
Dano renal ≥3 meses com alteração de TFG ou marcadores.

### Classificação KDIGO
| Estágio | TFG (mL/min/1,73m²) | Descrição |
|---------|----------------------|-----------|
| 1       | ≥90                 | Normal com dano |
| 2       | 60-89               | Leve |
| 3a      | 45-59               | Moderada |
| 3b      | 30-44               | Moderada-grave |
| 4       | 15-29               | Grave |
| 5       | <15                 | Terminal |

### Tratamento
- PA <130/80 com IECA/BRA (nefroproteção)
- Controle glicêmico, dieta hipoproteica
- SGLT2i: benefício renal comprovado (DAPA-CKD)
- Evitar nefrotóxicos (AINEs, contrastes)
- Transplante renal: tratamento definitivo para DRC-5',
  30,
  7
) ON CONFLICT (id) DO NOTHING;

-- Path 1: CM - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Quiz: Clínica Médica Avançado',
  'quiz',
  NULL,
  15,
  8
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Hérnias
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000004',
  'a1000000-0000-0000-0000-000000000002',
  'Hérnias da Parede Abdominal',
  'reading',
  '# Hérnias da Parede Abdominal

## Tipos
- **Inguinal Indireta**: Congênita, segue canal inguinal. Mais comum em jovens
- **Inguinal Direta**: Adquirida, medial aos vasos epigástricos. Mais em idosos
- **Femoral**: Abaixo do ligamento inguinal. Mais em mulheres. Alto risco encarceramento
- **Incisional**: Pós-cirúrgica. Fatores: infecção, obesidade, tosse crônica

## Classificação Nyhus
- **Tipo I**: Indireta com anel interno normal
- **Tipo II**: Indireta com anel dilatado
- **Tipo III**: Defeito do assoalho (IIIa direta, IIIb indireta, IIIc femoral)
- **Tipo IV**: Recidivante

## Diagnóstico
Clínico: inspeção em pé, Valsalva. USG para dúvida; TC se complicação.

## Tratamento
### Técnica de Lichtenstein
Aberta, tensão livre com tela de polipropileno. Taxa recorrência <2%. Padrão-ouro para inguinais unilaterais.

### Laparoscópica (TEP/TAPP)
- TEP: pré-peritoneal, sem entrar na cavidade. Ideal para bilateral
- TAPP: transabdominal. Melhor visualização

## Complicações
Encarceramento (5-15%), estrangulamento (emergência). Dor crônica pós-operatória em até 10%.',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Oncologia
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000005',
  'a1000000-0000-0000-0000-000000000002',
  'Oncologia Cirúrgica',
  'reading',
  '# Oncologia Cirúrgica

## Câncer Gástrico
Adenocarcinoma; fatores: H. pylori, dieta salgada/defumada. Sintomas: epigastralgia, perda ponderal, anemia.
- Gastrectomia subtotal (distal) ou total (proximal)
- Linfadenectomia D2
- Quimioterapia neoadjuvante (FLOT) em avançados

## Câncer Colorretal
Pólipos adenomatosos como precursores. Screening colonoscopia >50 anos.
- Colectomia segmentar + linfadenectomia (≥12 linfonodos)
- TME para reto (excisão mesorretal total)
- CEA para monitoramento; quimio adjuvante estágio III+

## Câncer de Esôfago
Escamoso (tabaco/álcool) ou adenocarcinoma (Barrett/DRGE). Disfagia progressiva.
- Esofagectomia para localizados
- Quimiorradioterapia neoadjuvante (protocolo CROSS)

## Câncer Hepático (HCC)
Em cirróticos (HBV/HCV); alfa-fetoproteína, USG semestral para rastreio.
- Hepatectomia se <5cm sem cirrose descompensada
- Ablação RFA para pequenos
- Transplante: critérios de Milão (1 nódulo ≤5cm ou até 3 ≤3cm)

## Estadiamento TNM
- T: tamanho e invasão (T1-T4)
- N: linfonodos (N0-N3)
- M: metástases (M0/M1)',
  25,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000006',
  'a1000000-0000-0000-0000-000000000002',
  'Quiz: Cirurgia Avançado',
  'quiz',
  NULL,
  15,
  6
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Parto
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000003',
  'a1000000-0000-0000-0000-000000000003',
  'Trabalho de Parto e Partograma',
  'reading',
  '# Trabalho de Parto e Partograma

## Fases do Parto
- **Latente**: Dilatação 0-6 cm; duração 6-10h nulíparas. Contrações irregulares
- **Ativa**: Dilatação 6-10 cm; aceleração 1 cm/h. Contrações regulares
- **Expulsão**: Descida e nascimento do concepto
- **Dequitação**: Expulsão placentária (até 30 min)

## Partograma OMS
Ferramenta gráfica para monitorar progressão:
- Eixo X: tempo (horas)
- Eixo Y: dilatação (cm) e plano de De Lee
- **Linha de alerta**: 1 cm/h a partir de 4 cm (OMS clássico). Nota: OMS 2018 e ACOG 2014 consideram fase ativa a partir de 6 cm — o partograma da OMS original usa 4 cm
- **Linha de ação**: 4h à direita da alerta (indica distocia)

### Monitoramento
- BCF fetal: 110-160 bpm
- Dinâmica uterina: 3-5 contrações/10min
- Líquido amniótico: claro (normal) vs meconial

## Indicações de Cesariana
- Sofrimento fetal agudo (bradicardia persistente)
- Desproporção cefalopélvica
- Apresentação pélvica
- Placenta prévia total
- Pré-eclâmpsia grave refratária

## Distocias
- **De progressão**: Hipodinamia → ocitocina IV
- **Mecânica**: DCP → cesárea
- **De ombro**: Manobra de McRoberts, pressão suprapúbica',
  30,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Patologias Ginecológicas
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000004',
  'a1000000-0000-0000-0000-000000000003',
  'Patologias Ginecológicas',
  'reading',
  '# Patologias Ginecológicas

## Endometriose
Implantes endometriais ectópicos; prevalência 10% em idade reprodutiva.
- Sintomas: dismenorreia, dispareunia, infertilidade
- Diagnóstico: laparoscopia (padrão-ouro); USG com preparo
- Tratamento: COC contínuo, agonistas GnRH, cirurgia conservadora

## Miomas Uterinos
Tumores benignos; 20-40% mulheres >35 anos.
- Subtipos: submucoso (sangramento), intramural, subseroso
- Diagnóstico: USG transvaginal
- Tratamento: observação, ulipristal, miomectomia ou histerectomia

## Síndrome dos Ovários Policísticos (SOP)
Critérios Rotterdam (2/3): hiperandrogenismo + anovulação + ovários policísticos.
- Sintomas: hirsutismo, acne, irregularidade menstrual
- Tratamento: perda de peso, COC, metformina, clomifeno para fertilidade

## Sangramento Uterino Anormal (SUA)
Classificação PALM-COEIN:
- **Estrutural**: Pólipo, Adenomiose, Leiomioma, Malignidade
- **Não Estrutural**: Coagulopatia, Ovulatório, Endometrial, Iatrogênico, Não classificado
- Avaliação: USG, biópsia endometrial >45 anos
- Tratamento: DIU-LNG, COC, antifibrinolíticos, cirurgia',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000005',
  'a1000000-0000-0000-0000-000000000003',
  'Quiz: GO Completo',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Exantemáticas
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'Doenças Exantemáticas',
  'reading',
  '# Doenças Exantemáticas

## Sarampo
Paramixovírus; transmissão aérea. Incubação 10-14 dias.
- Pródromos: febre alta, tosse, coriza, conjuntivite (3Cs)
- **Manchas de Koplik** (patognomônicas): mucosa jugal
- Exantema maculopapular cefalocaudal
- Complicações: otite, pneumonia, encefalite
- Tratamento: suporte + vitamina A

## Rubéola
Togavírus; risco teratogênico (Síndrome da Rubéola Congênita).
- Linfadenopatia retroauricular + exantema rosado discreto
- Mancha de Forchheimer (palato)
- Vacina tríplice viral

## Varicela
VZV; altamente contagiosa.
- Vesículas pruriginosas em diferentes estágios ("céu estrelado")
- Evolui: mácula → pápula → vesícula → crosta
- Aciclovir em imunossuprimidos

## Escarlatina
Estreptococo grupo A; exotoxina.
- Exantema fino "lixa", língua em framboesa
- Linhas de Pastia (dobras cutâneas)
- Tratamento: penicilina (prevenção reumática)

## Eritema Infeccioso (5ª doença)
Parvovírus B19; "face esbofeteada"
- Rash malar + padrão rendilhado em tronco

## Exantema Súbito (6ª doença)
HHV-6; <2 anos
- Febre alta 3-5 dias → rash após cessar febre',
  30,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Urgências
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'Urgências Pediátricas',
  'reading',
  '# Urgências Pediátricas

## Bronquiolite
VRS; <2 anos. Rinorreia → tosse → sibilos → taquipneia.
- Diagnóstico clínico; RX se pneumonia suspeita
- Tratamento: O2 se Sat<92%, hidratação, NBZ salina hipertônica
- NÃO usar broncodilatadores de rotina
- Internação: desidratação, apneia, <3 meses

## Desidratação
### Classificação e Tratamento
| Grau | Perda | Plano |
|------|-------|-------|
| Leve (<5%) | Sem sinais | A: SRO domiciliar |
| Moderada (5-10%) | Olhos fundos, turgor ruim | B: SRO supervisionado 75 mL/kg/4h |
| Grave (>10%) | Choque | C: SF IV 20 mL/kg bolus |

- Sinais: fontanela deprimida, oligúria, letargia
- Reidratar + zinco em diarreia

## Convulsão Febril
Crise com febre >38°C; 2-5 anos; sem infecção do SNC.
- Simples: generalizada, <15 min, única em 24h
- Complexa: focal, >15 min, ou múltipla
- Tratamento agudo: diazepam retal 0,5 mg/kg
- Recorrência: 30%; epilepsia: 2-5%

## PCR Pediátrica
Causa mais comum: hipóxia (diferente do adulto).
- Compressões 100-120/min, 1/3 do AP do tórax
- Adrenalina 0,01 mg/kg IV/IO a cada 3-5 min
- Desfibrilação 2-4 J/kg',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000005',
  'a1000000-0000-0000-0000-000000000004',
  'Quiz: Pediatria Avançado',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - Bioestatística
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000003',
  'a1000000-0000-0000-0000-000000000005',
  'Bioestatística',
  'reading',
  '# Bioestatística

## Tipos de Estudo
- **ECR**: Ensaio Clínico Randomizado — padrão-ouro para causalidade
- **Coorte**: Prospectivo, mede incidência e RR
- **Caso-controle**: Retrospectivo, mede OR
- **Transversal**: Prevalência, fotografia do momento
- **Ecológico**: Populações, não indivíduos

## Viés
- **Seleção**: Amostra não representativa
- **Informação**: Recall bias, aferição diferencial
- **Confusão**: Terceira variável; controlar por estratificação ou regressão

## Intervalo de Confiança (IC)
IC 95%: contém parâmetro verdadeiro em 95% das vezes.
- RR ou OR significativo se IC não cruza 1
- Quanto mais estreito, mais preciso

## Teste de Hipótese
- H0 (nula): sem efeito
- H1 (alternativa): há efeito
- p <0,05: rejeita H0
- Erro tipo I (α): falso positivo
- Erro tipo II (β): falso negativo
- Poder = 1 - β (ideal ≥80%)

## NNT (Número Necessário para Tratar)
NNT = 1/RRA (redução absoluta de risco)
- NNT baixo = tratamento eficaz
- Ex: RRA 5% → NNT = 20',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - APS/ESF
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'Atenção Primária e Estratégia Saúde da Família',
  'reading',
  '# Atenção Primária e ESF

## Estratégia Saúde da Família (ESF)
Modelo desde 1994; cobertura de ~76% da população brasileira (2024).

### Equipe
- Médico generalista ou de família
- Enfermeiro
- Técnicos de enfermagem
- Agentes Comunitários de Saúde (ACS): 1 para cada 150-200 famílias

### Território
Microáreas definidas por vulnerabilidade; cadastro via e-SUS.

## NASF-AB / eMulti
O antigo NASF (2008) foi renomeado NASF-AB em 2020 e, a partir de 2023/2024, está em transição para o programa **eMulti** (Equipes Multiprofissionais na APS).
Equipes multiprofissionais: nutricionista, psicólogo, fisioterapeuta.
- Apoio matricial às ESF
- Foco em casos complexos e crônicos

## Ações da APS
- Promoção: educação em saúde, grupos operativos
- Prevenção: vacinação, rastreamento
- Tratamento: consultas, visitas domiciliares
- Reabilitação: pós-AVC, pós-cirúrgicos

## Indicadores de Saúde
- Cobertura vacinal (meta >95%)
- Mortalidade infantil (<10/1000 NV)
- Cobertura ESF (% da população)
- Internações por condições sensíveis à APS

## Princípios da APS (Starfield)
1. Primeiro contato (acesso)
2. Longitudinalidade (vínculo)
3. Integralidade (abrangência)
4. Coordenação do cuidado',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000005',
  'a1000000-0000-0000-0000-000000000005',
  'Quiz: Saúde Coletiva Avançado',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;
