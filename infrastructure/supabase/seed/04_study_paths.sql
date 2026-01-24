-- Darwin Education - Study Paths Seed Data
-- =========================================

-- Study Path 1: Clínica Médica Essencial
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000001',
  'Clínica Médica Essencial',
  'Domine os principais temas de Clínica Médica cobrados no ENAMED. Inclui Cardiologia, Endocrinologia, Pneumologia, Nefrologia e Infectologia.',
  ARRAY['clinica_medica'],
  40.0,
  'medio',
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0001-000000000001',
    'p1000000-0000-0000-0000-000000000001',
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
    'm1000000-0000-0000-0001-000000000002',
    'p1000000-0000-0000-0000-000000000001',
    'Quiz: Hipertensão',
    'quiz',
    NULL,
    20,
    2
  ),
  (
    'm1000000-0000-0000-0001-000000000003',
    'p1000000-0000-0000-0000-000000000001',
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
    'm1000000-0000-0000-0001-000000000004',
    'p1000000-0000-0000-0000-000000000001',
    'Flashcards: Endocrinologia',
    'flashcards',
    NULL,
    25,
    4
  ),
  (
    'm1000000-0000-0000-0001-000000000005',
    'p1000000-0000-0000-0000-000000000001',
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
  );

-- Study Path 2: Cirurgia para o ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000002',
  'Cirurgia para o ENAMED',
  'Temas cirúrgicos mais cobrados: abdome agudo, trauma, hérnias, oncologia cirúrgica e urgências.',
  ARRAY['cirurgia'],
  35.0,
  'medio',
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0002-000000000001',
    'p1000000-0000-0000-0000-000000000002',
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
    'm1000000-0000-0000-0002-000000000002',
    'p1000000-0000-0000-0000-000000000002',
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
    'm1000000-0000-0000-0002-000000000003',
    'p1000000-0000-0000-0000-000000000002',
    'Quiz: Trauma e Urgências',
    'quiz',
    NULL,
    25,
    3
  );

-- Study Path 3: GO Completo
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000003',
  'Ginecologia e Obstetrícia Completo',
  'Pré-natal, parto, puerpério, patologias ginecológicas e oncologia ginecológica.',
  ARRAY['ginecologia_obstetricia'],
  45.0,
  'medio',
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0003-000000000001',
    'p1000000-0000-0000-0000-000000000003',
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
    'm1000000-0000-0000-0003-000000000002',
    'p1000000-0000-0000-0000-000000000003',
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
  );

-- Study Path 4: Pediatria Essencial
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000004',
  'Pediatria Essencial',
  'Puericultura, neonatologia, doenças infecciosas e urgências pediátricas.',
  ARRAY['pediatria'],
  38.0,
  'medio',
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0004-000000000001',
    'p1000000-0000-0000-0000-000000000004',
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
    'm1000000-0000-0000-0004-000000000002',
    'p1000000-0000-0000-0000-000000000004',
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
  );

-- Study Path 5: Saúde Coletiva
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000005',
  'Saúde Coletiva e Epidemiologia',
  'SUS, vigilância, epidemiologia, bioestatística e ética médica.',
  ARRAY['saude_coletiva'],
  30.0,
  'medio',
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0005-000000000001',
    'p1000000-0000-0000-0000-000000000005',
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
    'm1000000-0000-0000-0005-000000000002',
    'p1000000-0000-0000-0000-000000000005',
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
  );

-- Study Path 6: Preparação Intensiva ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, prerequisites, is_public)
VALUES (
  'p1000000-0000-0000-0000-000000000006',
  'Preparação Intensiva ENAMED',
  'Revisão completa das 5 áreas com foco nos temas mais cobrados. Ideal para reta final.',
  ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
  80.0,
  'dificil',
  ARRAY['p1000000-0000-0000-0000-000000000001'::uuid, 'p1000000-0000-0000-0000-000000000002'::uuid],
  TRUE
);

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES
  (
    'm1000000-0000-0000-0006-000000000001',
    'p1000000-0000-0000-0000-000000000006',
    'Simulado Diagnóstico',
    'quiz',
    NULL,
    180,
    1
  ),
  (
    'm1000000-0000-0000-0006-000000000002',
    'p1000000-0000-0000-0000-000000000006',
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
    'm1000000-0000-0000-0006-000000000003',
    'p1000000-0000-0000-0000-000000000006',
    'Simulado Final',
    'quiz',
    NULL,
    300,
    3
  );
