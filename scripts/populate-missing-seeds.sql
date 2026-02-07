-- Darwin Education - Question Banks Seed Data
-- =============================================

-- ENAMED Official Questions (Historical)
INSERT INTO question_banks (id, name, description, source, year_start, year_end, areas, is_premium, is_active)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'ENAMED Provas Oficiais 2018-2023',
    'Questões das provas oficiais do ENAMED aplicadas entre 2018 e 2023',
    'official_enamed',
    2018,
    2023,
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
    FALSE,
    TRUE
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'ENAMED Provas Oficiais 2010-2017',
    'Questões das provas oficiais do ENAMED aplicadas entre 2010 e 2017',
    'official_enamed',
    2010,
    2017,
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Residência Médica Questions
INSERT INTO question_banks (id, name, description, source, year_start, year_end, areas, is_premium, is_active)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'USP Residência 2020-2024',
    'Questões das provas de residência médica da USP',
    'residencia',
    2020,
    2024,
    ARRAY['clinica_medica', 'cirurgia', 'pediatria'],
    TRUE,
    TRUE
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'UNIFESP Residência 2020-2024',
    'Questões das provas de residência médica da UNIFESP',
    'residencia',
    2020,
    2024,
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria'],
    TRUE,
    TRUE
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'UNICAMP Residência 2020-2024',
    'Questões das provas de residência médica da UNICAMP',
    'residencia',
    2020,
    2024,
    ARRAY['clinica_medica', 'cirurgia', 'saude_coletiva'],
    TRUE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Practice Question Banks
INSERT INTO question_banks (id, name, description, source, areas, is_premium, is_active)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'Banco de Prática - Clínica Médica',
    'Questões para prática em Clínica Médica com foco em temas mais cobrados',
    'ai_generated',
    ARRAY['clinica_medica'],
    FALSE,
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Banco de Prática - Cirurgia',
    'Questões para prática em Cirurgia com foco em temas mais cobrados',
    'ai_generated',
    ARRAY['cirurgia'],
    FALSE,
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Banco de Prática - GO',
    'Questões para prática em Ginecologia e Obstetrícia',
    'ai_generated',
    ARRAY['ginecologia_obstetricia'],
    FALSE,
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Banco de Prática - Pediatria',
    'Questões para prática em Pediatria com foco nos principais temas',
    'ai_generated',
    ARRAY['pediatria'],
    FALSE,
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Banco de Prática - Saúde Coletiva',
    'Questões para prática em Saúde Coletiva e Medicina Preventiva',
    'ai_generated',
    ARRAY['saude_coletiva'],
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Community Question Bank
INSERT INTO question_banks (id, name, description, source, areas, is_premium, is_active)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'Questões da Comunidade',
    'Questões criadas e validadas pela comunidade Darwin Education',
    'community',
    ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;
-- Darwin Education - Achievements Seed Data
-- ==========================================

-- Learning Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_question', 'Primeira Questão', 'Responda sua primeira questão', '🎯', 10, 'learning'),
  ('first_exam', 'Primeiro Simulado', 'Complete seu primeiro simulado', '📝', 50, 'exam'),
  ('first_flashcard', 'Primeira Revisão', 'Revise seu primeiro flashcard', '🗂️', 10, 'learning'),
  ('first_deck', 'Criador de Baralhos', 'Crie seu primeiro deck de flashcards', '✨', 25, 'learning'),
  ('first_path', 'Desbravador', 'Inicie sua primeira trilha de estudos', '🗺️', 25, 'learning')
ON CONFLICT (id) DO NOTHING;

-- Streak Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('streak_3', 'Consistente', 'Mantenha uma sequência de 3 dias', '🔥', 30, 'streak'),
  ('streak_7', 'Dedicado', 'Mantenha uma sequência de 7 dias', '🔥', 75, 'streak'),
  ('streak_14', 'Determinado', 'Mantenha uma sequência de 14 dias', '🔥', 150, 'streak'),
  ('streak_30', 'Incansável', 'Mantenha uma sequência de 30 dias', '🔥', 300, 'streak'),
  ('streak_60', 'Imparável', 'Mantenha uma sequência de 60 dias', '🔥', 600, 'streak'),
  ('streak_100', 'Lendário', 'Mantenha uma sequência de 100 dias', '🏆', 1000, 'streak')
ON CONFLICT (id) DO NOTHING;

-- Exam Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('pass_first', 'Aprovado!', 'Seja aprovado em seu primeiro simulado', '✅', 100, 'exam'),
  ('score_700', 'Excelência', 'Alcance pontuação acima de 700', '⭐', 150, 'exam'),
  ('score_800', 'Brilhante', 'Alcance pontuação acima de 800', '🌟', 250, 'exam'),
  ('score_900', 'Extraordinário', 'Alcance pontuação acima de 900', '💫', 500, 'exam'),
  ('perfect_area', 'Especialista', 'Acerte todas as questões de uma área', '🎖️', 200, 'exam'),
  ('exams_5', 'Persistente', 'Complete 5 simulados', '📚', 100, 'exam'),
  ('exams_10', 'Veterano', 'Complete 10 simulados', '📚', 200, 'exam'),
  ('exams_25', 'Experiente', 'Complete 25 simulados', '📚', 500, 'exam'),
  ('exams_50', 'Mestre', 'Complete 50 simulados', '👑', 1000, 'exam')
ON CONFLICT (id) DO NOTHING;

-- Flashcard Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('cards_100', 'Colecionador', 'Revise 100 flashcards', '🗂️', 50, 'learning'),
  ('cards_500', 'Estudioso', 'Revise 500 flashcards', '🗂️', 150, 'learning'),
  ('cards_1000', 'Enciclopédia', 'Revise 1000 flashcards', '🗂️', 300, 'learning'),
  ('cards_5000', 'Memória de Elefante', 'Revise 5000 flashcards', '🐘', 750, 'learning'),
  ('mature_10', 'Memorizado', 'Tenha 10 cards maduros', '🧠', 50, 'learning'),
  ('mature_50', 'Boa Memória', 'Tenha 50 cards maduros', '🧠', 150, 'learning'),
  ('mature_100', 'Retenção Total', 'Tenha 100 cards maduros', '🧠', 300, 'learning')
ON CONFLICT (id) DO NOTHING;

-- Milestone Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('questions_100', 'Centenário', 'Responda 100 questões', '💯', 75, 'milestone'),
  ('questions_500', 'Quinhentos', 'Responda 500 questões', '🎯', 200, 'milestone'),
  ('questions_1000', 'Milhar', 'Responda 1000 questões', '🎯', 400, 'milestone'),
  ('questions_5000', 'Veterano de Guerra', 'Responda 5000 questões', '⚔️', 1000, 'milestone'),
  ('study_hours_10', 'Dedicação', '10 horas de estudo', '⏱️', 50, 'milestone'),
  ('study_hours_50', 'Compromisso', '50 horas de estudo', '⏱️', 200, 'milestone'),
  ('study_hours_100', 'Determinação', '100 horas de estudo', '⏱️', 400, 'milestone'),
  ('study_hours_500', 'Devoção', '500 horas de estudo', '⏱️', 1000, 'milestone'),
  ('level_5', 'Iniciante', 'Alcance o nível 5', '📈', 50, 'milestone'),
  ('level_10', 'Intermediário', 'Alcance o nível 10', '📈', 100, 'milestone'),
  ('level_25', 'Avançado', 'Alcance o nível 25', '📈', 250, 'milestone'),
  ('level_50', 'Expert', 'Alcance o nível 50', '📈', 500, 'milestone'),
  ('level_100', 'Mestre Darwin', 'Alcance o nível 100', '🦉', 1000, 'milestone')
ON CONFLICT (id) DO NOTHING;

-- Area Mastery Achievements
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('master_clinica', 'Mestre em Clínica Médica', 'Acerte 80%+ em 50 questões de Clínica', '🏥', 300, 'exam'),
  ('master_cirurgia', 'Mestre em Cirurgia', 'Acerte 80%+ em 50 questões de Cirurgia', '🔪', 300, 'exam'),
  ('master_go', 'Mestre em GO', 'Acerte 80%+ em 50 questões de GO', '👶', 300, 'exam'),
  ('master_pediatria', 'Mestre em Pediatria', 'Acerte 80%+ em 50 questões de Pediatria', '🧒', 300, 'exam'),
  ('master_coletiva', 'Mestre em Saúde Coletiva', 'Acerte 80%+ em 50 questões de Saúde Coletiva', '🌍', 300, 'exam'),
  ('complete_master', 'Médico Completo', 'Seja mestre em todas as 5 áreas', '👨‍⚕️', 1000, 'exam')
ON CONFLICT (id) DO NOTHING;

-- Social Achievements (for future features)
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('share_deck', 'Generoso', 'Compartilhe um deck de flashcards', '🤝', 50, 'social'),
  ('deck_popular', 'Popular', 'Tenha um deck com 10+ favoritos', '❤️', 100, 'social'),
  ('deck_viral', 'Viral', 'Tenha um deck com 100+ favoritos', '🚀', 300, 'social'),
  ('helper', 'Ajudante', 'Contribua com 10 questões validadas', '🙋', 150, 'social'),
  ('contributor', 'Contribuidor', 'Contribua com 50 questões validadas', '📖', 400, 'social')
ON CONFLICT (id) DO NOTHING;
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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

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
)
ON CONFLICT (id) DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;
-- Darwin Education - Sample Questions Seed Data
-- ==============================================
-- 50 questions covering all 5 ENAMED areas with IRT parameters

-- ============================================
-- CLÍNICA MÉDICA (10 questions)
-- ============================================

INSERT INTO questions (id, bank_id, stem, options, correct_index, explanation, area, subspecialty, topic, difficulty, irt_difficulty, irt_discrimination, irt_guessing, year, validated_by)
VALUES
-- CM1: Diabetes (Fácil)
(
  'q1000000-0000-0000-0001-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 52 anos, obeso, com glicemia de jejum de 142 mg/dL em duas ocasiões distintas. Qual o diagnóstico mais provável?',
  '[{"letter": "A", "text": "Glicemia de jejum alterada"}, {"letter": "B", "text": "Diabetes mellitus tipo 2"}, {"letter": "C", "text": "Diabetes mellitus tipo 1"}, {"letter": "D", "text": "Intolerância à glicose"}, {"letter": "E", "text": "Diabetes gestacional"}]',
  1,
  'Duas glicemias de jejum ≥126 mg/dL confirmam o diagnóstico de DM2. A glicemia de jejum alterada seria entre 100-125 mg/dL.',
  'clinica_medica', 'Endocrinologia', 'Diabetes Mellitus', 'facil',
  -1.2, 1.4, 0.20, 2022, 'expert'
),

-- CM2: Hipertensão (Médio)
(
  'q1000000-0000-0000-0001-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente hipertenso de 65 anos com creatinina de 2.1 mg/dL e proteinúria de 1.2 g/24h. Qual a classe de anti-hipertensivo preferencial?',
  '[{"letter": "A", "text": "Betabloqueador"}, {"letter": "B", "text": "Tiazídico"}, {"letter": "C", "text": "IECA ou BRA"}, {"letter": "D", "text": "Bloqueador de canal de cálcio"}, {"letter": "E", "text": "Alfa-bloqueador"}]',
  2,
  'IECA ou BRA são primeira escolha em pacientes com doença renal crônica e proteinúria pela nefroproteção que conferem.',
  'clinica_medica', 'Cardiologia', 'Hipertensão Arterial', 'medio',
  0.3, 1.6, 0.20, 2021, 'expert'
),

-- CM3: Pneumologia (Difícil)
(
  'q1000000-0000-0000-0001-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 58 anos, tabagista de longa data, com dispneia progressiva e tosse crônica. Espirometria: VEF1/CVF = 0.62 e VEF1 = 48% do previsto pós-broncodilatador. Qual a classificação GOLD?',
  '[{"letter": "A", "text": "GOLD 1 - Leve"}, {"letter": "B", "text": "GOLD 2 - Moderado"}, {"letter": "C", "text": "GOLD 3 - Grave"}, {"letter": "D", "text": "GOLD 4 - Muito grave"}, {"letter": "E", "text": "Não é DPOC"}]',
  2,
  'VEF1/CVF < 0.70 confirma obstrução. VEF1 entre 30-49% classifica como GOLD 3 (grave). GOLD 2: 50-79%; GOLD 4: < 30%.',
  'clinica_medica', 'Pneumologia', 'DPOC', 'dificil',
  1.1, 1.8, 0.20, 2023, 'expert'
),

-- CM4: Cardiologia (Médio)
(
  'q1000000-0000-0000-0001-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com FA permanente, 68 anos, hipertenso e diabético. Qual o escore CHA2DS2-VASc e a conduta antitrombótica?',
  '[{"letter": "A", "text": "Score 2, considerar anticoagulação"}, {"letter": "B", "text": "Score 3, anticoagulação indicada"}, {"letter": "C", "text": "Score 4, anticoagulação indicada"}, {"letter": "D", "text": "Score 5, anticoagulação indicada"}, {"letter": "E", "text": "Score 1, AAS suficiente"}]',
  2,
  'HAS (1) + DM (1) + Idade 65-74 (1) + sexo masculino (0) = 3 pontos + FA (1) = 4 pontos. Score ≥2 indica anticoagulação.',
  'clinica_medica', 'Cardiologia', 'Fibrilação Atrial', 'medio',
  0.5, 1.5, 0.20, 2022, 'expert'
),

-- CM5: Nefrologia (Muito Difícil)
(
  'q1000000-0000-0000-0001-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com DRC estágio 4, apresenta K+ = 6.8 mEq/L e alterações eletrocardiográficas. Qual a sequência correta de tratamento?',
  '[{"letter": "A", "text": "Gluconato de cálcio → Insulina + glicose → Furosemida"}, {"letter": "B", "text": "Insulina + glicose → Gluconato de cálcio → Diálise"}, {"letter": "C", "text": "Bicarbonato de sódio → Sorcal → Diálise"}, {"letter": "D", "text": "Furosemida → Insulina → Gluconato de cálcio"}, {"letter": "E", "text": "Sorcal → Gluconato de cálcio → Insulina"}]',
  0,
  'Com alterações no ECG, primeiro estabiliza membrana com gluconato de cálcio, depois shift com insulina+glicose, depois eliminação.',
  'clinica_medica', 'Nefrologia', 'Hipercalemia', 'muito_dificil',
  1.8, 1.9, 0.20, 2023, 'expert'
),

-- CM6: Infectologia (Fácil)
(
  'q1000000-0000-0000-0001-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente HIV+ com CD4 = 150 células/mm³. Qual profilaxia primária está indicada?',
  '[{"letter": "A", "text": "Sulfametoxazol-trimetoprim para Pneumocystis jirovecii"}, {"letter": "B", "text": "Azitromicina para MAC"}, {"letter": "C", "text": "Fluconazol para Candida"}, {"letter": "D", "text": "Ganciclovir para CMV"}, {"letter": "E", "text": "Nenhuma profilaxia necessária"}]',
  0,
  'Profilaxia para P. jirovecii com SMX-TMP quando CD4 < 200. MAC apenas se CD4 < 50. CMV não faz profilaxia primária.',
  'clinica_medica', 'Infectologia', 'HIV/AIDS', 'facil',
  -0.8, 1.3, 0.20, 2021, 'expert'
),

-- CM7: Gastroenterologia (Médio)
(
  'q1000000-0000-0000-0001-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente cirrótico com ascite tensa. Paracentese retira 6 litros. Qual a conduta para prevenção de disfunção circulatória?',
  '[{"letter": "A", "text": "Albumina 8g/L de ascite retirada"}, {"letter": "B", "text": "Soro fisiológico 500mL"}, {"letter": "C", "text": "Reposição não necessária"}, {"letter": "D", "text": "Dextran 70"}, {"letter": "E", "text": "Plasma fresco"}]',
  0,
  'Paracentese > 5L requer albumina 6-8g por litro retirado para prevenir síndrome de disfunção circulatória pós-paracentese.',
  'clinica_medica', 'Gastroenterologia', 'Cirrose Hepática', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- CM8: Reumatologia (Difícil)
(
  'q1000000-0000-0000-0001-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Mulher de 35 anos com artrite simétrica de mãos, rigidez matinal >1h, nódulos subcutâneos e fator reumatoide positivo. Anti-CCP negativo. Qual a principal diferença prognóstica em relação a pacientes anti-CCP positivos?',
  '[{"letter": "A", "text": "Menor chance de erosões ósseas"}, {"letter": "B", "text": "Maior chance de manifestações extra-articulares"}, {"letter": "C", "text": "Menor resposta ao metotrexato"}, {"letter": "D", "text": "Maior mortalidade cardiovascular"}, {"letter": "E", "text": "Não há diferença prognóstica"}]',
  0,
  'Anti-CCP positivo associa-se a doença mais erosiva e agressiva. FR+/anti-CCP- tem melhor prognóstico radiológico.',
  'clinica_medica', 'Reumatologia', 'Artrite Reumatoide', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- CM9: Hematologia (Muito Fácil)
(
  'q1000000-0000-0000-0001-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com anemia, VCM = 68 fL, ferritina = 8 ng/mL. Qual o tipo de anemia?',
  '[{"letter": "A", "text": "Anemia ferropriva"}, {"letter": "B", "text": "Anemia de doença crônica"}, {"letter": "C", "text": "Talassemia minor"}, {"letter": "D", "text": "Anemia sideroblástica"}, {"letter": "E", "text": "Anemia megaloblástica"}]',
  0,
  'VCM baixo (microcítica) + ferritina baixa (<30) = anemia ferropriva. Talassemia teria ferritina normal ou alta.',
  'clinica_medica', 'Hematologia', 'Anemias', 'muito_facil',
  -1.8, 1.2, 0.20, 2020, 'expert'
),

-- CM10: Neurologia (Médio)
(
  'q1000000-0000-0000-0001-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 70 anos com AVC isquêmico há 2 horas, sem contraindicações. PA = 185x105 mmHg. Qual a conduta antes da trombólise?',
  '[{"letter": "A", "text": "Reduzir PA para <185/110 mmHg"}, {"letter": "B", "text": "Não há necessidade de controle pressórico"}, {"letter": "C", "text": "Reduzir PA para <140/90 mmHg"}, {"letter": "D", "text": "Contraindicação absoluta à trombólise"}, {"letter": "E", "text": "Iniciar anti-hipertensivo VO"}]',
  0,
  'Para trombólise, PA deve estar <185/110 mmHg. Se não atingir com anti-hipertensivo EV, contraindica rTPA.',
  'clinica_medica', 'Neurologia', 'AVC', 'medio',
  0.2, 1.4, 0.20, 2022, 'expert'
),

-- ============================================
-- CIRURGIA (10 questions)
-- ============================================

-- CIR1: Abdome Agudo (Fácil)
(
  'q1000000-0000-0000-0002-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 25 anos com dor em fossa ilíaca direita, náuseas e febre. Sinal de Blumberg positivo. Qual o diagnóstico mais provável?',
  '[{"letter": "A", "text": "Apendicite aguda"}, {"letter": "B", "text": "Colecistite aguda"}, {"letter": "C", "text": "Diverticulite"}, {"letter": "D", "text": "Pancreatite aguda"}, {"letter": "E", "text": "Úlcera perfurada"}]',
  0,
  'Quadro clássico de apendicite: dor em FID, febre, sinal de Blumberg (descompressão brusca dolorosa) indica irritação peritoneal.',
  'cirurgia', 'Cirurgia Geral', 'Abdome Agudo', 'facil',
  -1.0, 1.3, 0.20, 2021, 'expert'
),

-- CIR2: Trauma (Médio)
(
  'q1000000-0000-0000-0002-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente vítima de acidente automobilístico, estável hemodinamicamente, com FAST positivo no quadrante superior esquerdo. TC mostra laceração esplênica grau III. Conduta?',
  '[{"letter": "A", "text": "Tratamento não operatório com observação"}, {"letter": "B", "text": "Laparotomia imediata"}, {"letter": "C", "text": "Arteriografia com embolização"}, {"letter": "D", "text": "Videolaparoscopia diagnóstica"}, {"letter": "E", "text": "Repetir FAST em 6 horas"}]',
  0,
  'Paciente estável com lesão esplênica grau I-III pode ser manejado conservadoramente com observação e exames seriados.',
  'cirurgia', 'Trauma', 'Trauma Abdominal', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- CIR3: Coloproctologia (Difícil)
(
  'q1000000-0000-0000-0002-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 60 anos com obstrução intestinal por adenocarcinoma de cólon sigmoide. Tumor irressecável com metástases hepáticas. Qual a conduta cirúrgica paliativa preferencial?',
  '[{"letter": "A", "text": "Colostomia em alça"}, {"letter": "B", "text": "Prótese colônica endoscópica"}, {"letter": "C", "text": "Ressecção paliativa com anastomose primária"}, {"letter": "D", "text": "Derivação ileocólica"}, {"letter": "E", "text": "Cecostomia"}]',
  1,
  'Stent colônico é opção menos invasiva para paliação de obstrução por tumor irressecável, evitando estomias.',
  'cirurgia', 'Coloproctologia', 'Câncer Colorretal', 'dificil',
  1.2, 1.7, 0.20, 2023, 'expert'
),

-- CIR4: Hérnias (Fácil)
(
  'q1000000-0000-0000-0002-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 45 anos com abaulamento em região inguinal direita que aumenta com Valsalva e reduz espontaneamente. Qual o diagnóstico?',
  '[{"letter": "A", "text": "Hérnia inguinal indireta redutível"}, {"letter": "B", "text": "Hérnia inguinal direta"}, {"letter": "C", "text": "Hérnia femoral"}, {"letter": "D", "text": "Varicocele"}, {"letter": "E", "text": "Hidrocele"}]',
  0,
  'Abaulamento que aumenta com esforço e reduz espontaneamente é hérnia redutível. Localização acima do ligamento inguinal indica hérnia inguinal.',
  'cirurgia', 'Cirurgia Geral', 'Hérnias', 'facil',
  -0.9, 1.2, 0.20, 2020, 'expert'
),

-- CIR5: Cirurgia Bariátrica (Muito Difícil)
(
  'q1000000-0000-0000-0002-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente pós bypass gástrico em Y de Roux há 3 anos apresenta dor abdominal intermitente, náuseas e vômitos biliosos. TC sem alterações. Qual a hipótese diagnóstica e conduta?',
  '[{"letter": "A", "text": "Hérnia interna de Petersen - exploração laparoscópica"}, {"letter": "B", "text": "Estenose da anastomose - EDA com dilatação"}, {"letter": "C", "text": "Úlcera marginal - IBP e erradicação de H. pylori"}, {"letter": "D", "text": "Dumping tardio - ajuste dietético"}, {"letter": "E", "text": "Aderências - tratamento conservador"}]',
  0,
  'Obstrução intermitente pós-bypass com TC normal sugere hérnia interna (Petersen ou mesocólon). Requer exploração cirúrgica.',
  'cirurgia', 'Cirurgia Bariátrica', 'Complicações Pós-Operatórias', 'muito_dificil',
  1.9, 2.0, 0.20, 2023, 'expert'
),

-- CIR6: Cirurgia Vascular (Médio)
(
  'q1000000-0000-0000-0002-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 68 anos, tabagista, com claudicação intermitente a 100 metros. ITB = 0.6. Qual a conduta inicial?',
  '[{"letter": "A", "text": "Tratamento clínico com cilostazol e estatina"}, {"letter": "B", "text": "Angioplastia com stent"}, {"letter": "C", "text": "Bypass femoropoplíteo"}, {"letter": "D", "text": "Simpatectomia lombar"}, {"letter": "E", "text": "Amputação primária"}]',
  0,
  'Claudicação intermitente (Fontaine II) tem tratamento inicial clínico: cessação tabagismo, exercício, cilostazol, estatina. Revascularização para isquemia crítica.',
  'cirurgia', 'Cirurgia Vascular', 'DAOP', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- CIR7: Cirurgia Torácica (Difícil)
(
  'q1000000-0000-0000-0002-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 55 anos com nódulo pulmonar solitário de 2.5 cm no lobo superior direito. PET-CT com SUV = 8.5. Estadiamento negativo para metástases. Qual a conduta?',
  '[{"letter": "A", "text": "Lobectomia com linfadenectomia mediastinal"}, {"letter": "B", "text": "Quimioterapia neoadjuvante"}, {"letter": "C", "text": "Segmentectomia"}, {"letter": "D", "text": "Radioterapia estereotáxica"}, {"letter": "E", "text": "Biópsia por EBUS antes de cirurgia"}]',
  0,
  'Câncer de pulmão estágio I-II (nódulo sem linfonodos ou metástases) tem indicação de ressecção cirúrgica com lobectomia como padrão-ouro.',
  'cirurgia', 'Cirurgia Torácica', 'Câncer de Pulmão', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- CIR8: Urgências (Muito Fácil)
(
  'q1000000-0000-0000-0002-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com ferimento por arma branca em tórax esquerdo, PA = 80x50 mmHg, turgência jugular, bulhas abafadas. Diagnóstico?',
  '[{"letter": "A", "text": "Tamponamento cardíaco"}, {"letter": "B", "text": "Pneumotórax hipertensivo"}, {"letter": "C", "text": "Hemotórax maciço"}, {"letter": "D", "text": "Contusão miocárdica"}, {"letter": "E", "text": "Lesão de grandes vasos"}]',
  0,
  'Tríade de Beck (hipotensão + turgência jugular + bulhas abafadas) é clássica de tamponamento cardíaco.',
  'cirurgia', 'Trauma', 'Trauma Torácico', 'muito_facil',
  -1.5, 1.2, 0.20, 2021, 'expert'
),

-- CIR9: Via Biliar (Médio)
(
  'q1000000-0000-0000-0002-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com colecistite aguda litiásica há 72 horas, sem peritonite. Quando realizar colecistectomia?',
  '[{"letter": "A", "text": "Precoce, durante a mesma internação"}, {"letter": "B", "text": "Após 6-8 semanas de tratamento clínico"}, {"letter": "C", "text": "Após resolução da dor"}, {"letter": "D", "text": "Apenas se recorrência"}, {"letter": "E", "text": "Colecistostomia percutânea primeiro"}]',
  0,
  'Colecistectomia precoce (<72h-7 dias) é preferível ao tratamento tardio, com menores complicações e menor tempo de internação total.',
  'cirurgia', 'Cirurgia Geral', 'Colecistite', 'medio',
  0.2, 1.3, 0.20, 2022, 'expert'
),

-- CIR10: Oncologia Cirúrgica (Difícil)
(
  'q1000000-0000-0000-0002-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com adenocarcinoma gástrico do antro, T2N1M0. Qual a extensão da linfadenectomia recomendada?',
  '[{"letter": "A", "text": "D2"}, {"letter": "B", "text": "D1"}, {"letter": "C", "text": "D0"}, {"letter": "D", "text": "D3"}, {"letter": "E", "text": "Linfadenectomia não indicada"}]',
  0,
  'Linfadenectomia D2 é padrão para câncer gástrico avançado no Japão e cada vez mais aceito no Ocidente por melhor estadiamento e resultados oncológicos.',
  'cirurgia', 'Oncologia Cirúrgica', 'Câncer Gástrico', 'dificil',
  1.0, 1.5, 0.20, 2023, 'expert'
),

-- ============================================
-- GINECOLOGIA E OBSTETRÍCIA (10 questions)
-- ============================================

-- GO1: Pré-Natal (Fácil)
(
  'q1000000-0000-0000-0003-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 24 semanas com glicemia de jejum de 98 mg/dL no primeiro trimestre. Qual a conduta?',
  '[{"letter": "A", "text": "Realizar TOTG 75g entre 24-28 semanas"}, {"letter": "B", "text": "Diagnosticar diabetes gestacional"}, {"letter": "C", "text": "Iniciar insulina"}, {"letter": "D", "text": "Repetir glicemia de jejum"}, {"letter": "E", "text": "Considerar normal, sem necessidade de investigação"}]',
  0,
  'Glicemia de jejum 92-125 mg/dL no 1º trimestre indica DMG. Se <92, realizar TOTG 75g entre 24-28 semanas para rastreio.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Diabetes Gestacional', 'facil',
  -0.8, 1.3, 0.20, 2022, 'expert'
),

-- GO2: Parto (Médio)
(
  'q1000000-0000-0000-0003-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 39 semanas em trabalho de parto, dilatação 8 cm, BCF = 100 bpm com desacelerações tardias repetitivas. Conduta?',
  '[{"letter": "A", "text": "Cesárea de emergência"}, {"letter": "B", "text": "Amniotomia"}, {"letter": "C", "text": "Ocitocina"}, {"letter": "D", "text": "Fórcipe de alívio"}, {"letter": "E", "text": "Aguardar evolução"}]',
  0,
  'Bradicardia fetal com DIP II (desacelerações tardias) repetitivas indica sofrimento fetal e necessidade de cesárea de emergência.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Sofrimento Fetal', 'medio',
  0.5, 1.6, 0.20, 2022, 'expert'
),

-- GO3: Oncologia Ginecológica (Difícil)
(
  'q1000000-0000-0000-0003-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 45 anos com sangramento uterino anormal. Histeroscopia mostra pólipo endometrial. Anatomopatológico: adenocarcinoma de endométrio grau 1 limitado ao pólipo. Qual a conduta?',
  '[{"letter": "A", "text": "Histerectomia total com salpingo-ooforectomia bilateral"}, {"letter": "B", "text": "Apenas acompanhamento"}, {"letter": "C", "text": "Nova polipectomia com margens"}, {"letter": "D", "text": "Radioterapia pélvica"}, {"letter": "E", "text": "Quimioterapia adjuvante"}]',
  0,
  'Adenocarcinoma de endométrio requer estadiamento cirúrgico com histerectomia total + SOB, mesmo se aparentemente limitado.',
  'ginecologia_obstetricia', 'Ginecologia', 'Câncer de Endométrio', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- GO4: Sangramento 1º Trimestre (Fácil)
(
  'q1000000-0000-0000-0003-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente com 8 semanas de amenorreia, beta-hCG = 2000 mUI/mL, USG transvaginal sem saco gestacional intrauterino. Qual a principal hipótese?',
  '[{"letter": "A", "text": "Gravidez ectópica"}, {"letter": "B", "text": "Gestação inicial viável"}, {"letter": "C", "text": "Aborto completo"}, {"letter": "D", "text": "Mola hidatiforme"}, {"letter": "E", "text": "Gravidez anembrionada"}]',
  0,
  'Beta-hCG > 1500-2000 sem saco gestacional no USG TV é altamente sugestivo de gestação ectópica.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Gravidez Ectópica', 'facil',
  -0.7, 1.4, 0.20, 2021, 'expert'
),

-- GO5: Pré-eclâmpsia (Muito Difícil)
(
  'q1000000-0000-0000-0003-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Gestante de 32 semanas com pré-eclâmpsia grave. PA = 170x110 mmHg, proteinúria 3+, plaquetas = 85.000, TGO = 250, DHL = 800, esquizócitos no sangue periférico. Conduta?',
  '[{"letter": "A", "text": "Interrupção imediata da gestação após estabilização"}, {"letter": "B", "text": "Corticoide e aguardar 48h"}, {"letter": "C", "text": "Sulfato de magnésio e anti-hipertensivo apenas"}, {"letter": "D", "text": "Plasmaférese"}, {"letter": "E", "text": "Transfusão de plaquetas e observação"}]',
  0,
  'Síndrome HELLP (hemólise + enzimas elevadas + plaquetopenia) indica interrupção imediata independente da IG, após estabilização materna.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Pré-eclâmpsia', 'muito_dificil',
  1.8, 1.9, 0.20, 2023, 'expert'
),

-- GO6: Ginecologia Geral (Médio)
(
  'q1000000-0000-0000-0003-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 28 anos com corrimento vaginal amarelo-esverdeado, bolhoso, com odor fétido. pH vaginal = 6.0, teste das aminas positivo. Agente etiológico?',
  '[{"letter": "A", "text": "Trichomonas vaginalis"}, {"letter": "B", "text": "Gardnerella vaginalis"}, {"letter": "C", "text": "Candida albicans"}, {"letter": "D", "text": "Neisseria gonorrhoeae"}, {"letter": "E", "text": "Chlamydia trachomatis"}]',
  0,
  'Corrimento amarelo-esverdeado bolhoso + pH > 4.5 + teste das aminas positivo é característico de tricomoníase.',
  'ginecologia_obstetricia', 'Ginecologia', 'Vulvovaginites', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- GO7: Contracepção (Fácil)
(
  'q1000000-0000-0000-0003-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 35 anos, tabagista de 25 cigarros/dia, deseja contracepção hormonal. Qual método é contraindicado?',
  '[{"letter": "A", "text": "Contraceptivo combinado oral"}, {"letter": "B", "text": "Implante subdérmico"}, {"letter": "C", "text": "DIU hormonal"}, {"letter": "D", "text": "Minipílula"}, {"letter": "E", "text": "Injetável trimestral"}]',
  0,
  'Tabagismo >15 cig/dia em >35 anos é contraindicação absoluta (categoria 4) para métodos com estrogênio pelo risco cardiovascular.',
  'ginecologia_obstetricia', 'Ginecologia', 'Contracepção', 'facil',
  -0.9, 1.3, 0.20, 2021, 'expert'
),

-- GO8: Mama (Difícil)
(
  'q1000000-0000-0000-0003-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente de 52 anos com nódulo mamário de 2 cm, móvel. Mamografia: BI-RADS 4B. Core biopsy: carcinoma ductal invasivo, RE+, RP+, HER2 negativo, Ki-67 = 15%. Classificação molecular?',
  '[{"letter": "A", "text": "Luminal A"}, {"letter": "B", "text": "Luminal B HER2 negativo"}, {"letter": "C", "text": "Luminal B HER2 positivo"}, {"letter": "D", "text": "HER2 superexpresso"}, {"letter": "E", "text": "Triplo negativo"}]',
  0,
  'RE+, RP+, HER2-, Ki-67 baixo (<20%) = Luminal A. Se Ki-67 >20% seria Luminal B HER2-.',
  'ginecologia_obstetricia', 'Ginecologia', 'Câncer de Mama', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- GO9: Puerpério (Médio)
(
  'q1000000-0000-0000-0003-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Puérpera de 5 dias com febre 39°C, útero doloroso e subinvoluído, lóquios piossanguinolentos fétidos. Diagnóstico e tratamento?',
  '[{"letter": "A", "text": "Endometrite - Clindamicina + Gentamicina"}, {"letter": "B", "text": "Mastite - Cefalexina"}, {"letter": "C", "text": "ITU - Ciprofloxacino"}, {"letter": "D", "text": "Tromboflebite pélvica - Anticoagulação"}, {"letter": "E", "text": "Restos placentários - Curetagem"}]',
  0,
  'Tríade de febre + útero doloroso + lóquios fétidos define endometrite puerperal. Esquema clássico: clindamicina + gentamicina EV.',
  'ginecologia_obstetricia', 'Obstetrícia', 'Infecção Puerperal', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- GO10: Infertilidade (Muito Fácil)
(
  'q1000000-0000-0000-0003-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Casal com infertilidade há 2 anos. Espermograma com azoospermia. Qual o próximo passo?',
  '[{"letter": "A", "text": "Dosagem de FSH e testosterona"}, {"letter": "B", "text": "Histerossalpingografia"}, {"letter": "C", "text": "USG transvaginal seriada"}, {"letter": "D", "text": "Laparoscopia"}, {"letter": "E", "text": "Indução de ovulação"}]',
  0,
  'Azoospermia requer investigação com FSH e testosterona para diferenciar causa obstrutiva (FSH normal) de não-obstrutiva (FSH elevado).',
  'ginecologia_obstetricia', 'Ginecologia', 'Infertilidade', 'muito_facil',
  -1.4, 1.2, 0.20, 2020, 'expert'
),

-- ============================================
-- PEDIATRIA (10 questions)
-- ============================================

-- PED1: Neonatologia (Fácil)
(
  'q1000000-0000-0000-0004-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'RN de 34 semanas, desconforto respiratório precoce, gasometria com PaO2 = 45 mmHg. Raio-X com infiltrado reticulogranular difuso e broncogramas aéreos. Diagnóstico?',
  '[{"letter": "A", "text": "Síndrome do desconforto respiratório"}, {"letter": "B", "text": "Taquipneia transitória do RN"}, {"letter": "C", "text": "Pneumonia neonatal"}, {"letter": "D", "text": "Síndrome de aspiração meconial"}, {"letter": "E", "text": "Persistência do canal arterial"}]',
  0,
  'RN prematuro com desconforto precoce + Rx com vidro moído (reticulogranular) + broncogramas = doença da membrana hialina (SDR).',
  'pediatria', 'Neonatologia', 'Desconforto Respiratório', 'facil',
  -0.8, 1.3, 0.20, 2022, 'expert'
),

-- PED2: Puericultura (Muito Fácil)
(
  'q1000000-0000-0000-0004-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 6 meses em aleitamento materno exclusivo. Qual a suplementação obrigatória?',
  '[{"letter": "A", "text": "Vitamina D"}, {"letter": "B", "text": "Ferro"}, {"letter": "C", "text": "Vitamina A"}, {"letter": "D", "text": "Zinco"}, {"letter": "E", "text": "Nenhuma suplementação necessária"}]',
  0,
  'Vitamina D (400 UI/dia) deve ser suplementada desde o nascimento até 2 anos, independente do tipo de aleitamento.',
  'pediatria', 'Puericultura', 'Suplementação', 'muito_facil',
  -1.6, 1.2, 0.20, 2021, 'expert'
),

-- PED3: Infectologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 4 anos com febre alta há 5 dias, conjuntivite bilateral não purulenta, língua em framboesa, linfadenopatia cervical unilateral >1.5 cm, exantema polimórfico e edema de extremidades. Qual o diagnóstico e a complicação mais temida?',
  '[{"letter": "A", "text": "Doença de Kawasaki - Aneurismas coronarianos"}, {"letter": "B", "text": "Escarlatina - Glomerulonefrite"}, {"letter": "C", "text": "Sarampo - Encefalite"}, {"letter": "D", "text": "Mononucleose - Ruptura esplênica"}, {"letter": "E", "text": "Rubéola - Trombocitopenia"}]',
  0,
  'Kawasaki: febre ≥5 dias + 4 de 5 critérios (conjuntivite, alterações orais, exantema, extremidades, linfadenopatia). Complicação: aneurismas coronários.',
  'pediatria', 'Infectologia', 'Kawasaki', 'medio',
  0.4, 1.5, 0.20, 2022, 'expert'
),

-- PED4: Pneumologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 8 meses, primeiro episódio de sibilância, coriza e febre baixa há 3 dias. FR = 48 irpm, SatO2 = 93%, tiragem subcostal. Qual o diagnóstico e tratamento?',
  '[{"letter": "A", "text": "Bronquiolite viral aguda - Suporte e oxigênio"}, {"letter": "B", "text": "Asma - Beta-2 agonista"}, {"letter": "C", "text": "Pneumonia bacteriana - Amoxicilina"}, {"letter": "D", "text": "Coqueluche - Azitromicina"}, {"letter": "E", "text": "Laringite - Corticoide"}]',
  0,
  'Bronquiolite: lactente <2 anos, primeiro episódio de sibilância, pródromos virais. Tratamento: suporte, O2 se SatO2 <92%.',
  'pediatria', 'Pneumologia', 'Bronquiolite', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- PED5: Emergência Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 3 anos com diarreia há 5 dias, olhos fundos, sinal da prega presente mas retorna lentamente, bebe água com avidez. Qual o grau de desidratação e a reposição inicial?',
  '[{"letter": "A", "text": "Desidratação moderada - TRO supervisionada"}, {"letter": "B", "text": "Desidratação grave - SF 0.9% 20 mL/kg em bolus"}, {"letter": "C", "text": "Desidratação leve - TRO domiciliar"}, {"letter": "D", "text": "Sem desidratação - Apenas orientações"}, {"letter": "E", "text": "Desidratação grave - Soro glicosado"}]',
  0,
  '2 ou mais sinais de desidratação (prega, olhos fundos, sede) = desidratação moderada (plano B). Tratamento com TRO supervisionada.',
  'pediatria', 'Emergência', 'Desidratação', 'dificil',
  0.9, 1.6, 0.20, 2023, 'expert'
),

-- PED6: Neurologia Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 18 meses com febre de 39.5°C há 1 hora apresenta crise tônico-clônica generalizada de 3 minutos com recuperação completa. Sem história prévia de convulsões. Conduta?',
  '[{"letter": "A", "text": "Investigar foco infeccioso e orientar recorrência"}, {"letter": "B", "text": "TC de crânio urgente"}, {"letter": "C", "text": "Iniciar anticonvulsivante profilático"}, {"letter": "D", "text": "Punção lombar"}, {"letter": "E", "text": "EEG de urgência"}]',
  0,
  'Convulsão febril simples (6m-5a, <15min, generalizada, sem recorrência em 24h) não requer neuroimagem, PL ou profilaxia. Investigar causa da febre.',
  'pediatria', 'Neurologia', 'Convulsão Febril', 'dificil',
  1.0, 1.7, 0.20, 2023, 'expert'
),

-- PED7: Gastroenterologia Pediátrica (Médio)
(
  'q1000000-0000-0000-0004-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Lactente de 2 meses com regurgitações frequentes após mamadas, sem perda ponderal, sem irritabilidade ou recusa alimentar. Diagnóstico e conduta?',
  '[{"letter": "A", "text": "Refluxo gastroesofágico fisiológico - Orientações posturais"}, {"letter": "B", "text": "DRGE - Omeprazol"}, {"letter": "C", "text": "Estenose hipertrófica de piloro - USG"}, {"letter": "D", "text": "Alergia à proteína do leite de vaca - Fórmula hidrolisada"}, {"letter": "E", "text": "Má rotação intestinal - Trânsito intestinal"}]',
  0,
  'Lactente que regurgita mas ganha peso bem e não tem sinais de alarme = regurgitador feliz (RGE fisiológico). Conduta expectante.',
  'pediatria', 'Gastroenterologia', 'Refluxo Gastroesofágico', 'medio',
  0.2, 1.3, 0.20, 2022, 'expert'
),

-- PED8: Cardiologia Pediátrica (Muito Difícil)
(
  'q1000000-0000-0000-0004-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'RN com cianose central desde o nascimento, piora com choro, SatO2 = 75% em ar ambiente que não melhora com O2 100%. Raio-X com área cardíaca normal e trama vascular pulmonar diminuída. Sopro sistólico em BEE. Provável diagnóstico?',
  '[{"letter": "A", "text": "Tetralogia de Fallot"}, {"letter": "B", "text": "Transposição das grandes artérias"}, {"letter": "C", "text": "Coarctação da aorta"}, {"letter": "D", "text": "Comunicação interventricular"}, {"letter": "E", "text": "Persistência do canal arterial"}]',
  0,
  'Cianose + trama pulmonar diminuída + área cardíaca normal = cardiopatia com hipofluxo pulmonar. T4F é a mais comum. TGA teria coração em ovo e trama aumentada.',
  'pediatria', 'Cardiologia', 'Cardiopatias Congênitas', 'muito_dificil',
  1.7, 1.8, 0.20, 2023, 'expert'
),

-- PED9: Imunização (Fácil)
(
  'q1000000-0000-0000-0004-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 15 meses comparece à UBS para vacinação. Quais vacinas do calendário devem ser aplicadas nesta idade?',
  '[{"letter": "A", "text": "Tríplice viral, Hepatite A, Tetra viral"}, {"letter": "B", "text": "Pentavalente, VIP, Pneumo 10"}, {"letter": "C", "text": "DTP, VOP, Febre amarela"}, {"letter": "D", "text": "Meningo C, Pneumo 23"}, {"letter": "E", "text": "BCG e Hepatite B"}]',
  0,
  'Aos 15 meses: DTP (1º reforço), VOP (1º reforço), Hepatite A (dose única), Tetra viral (caxumba, sarampo, rubéola, varicela).',
  'pediatria', 'Imunização', 'Calendário Vacinal', 'facil',
  -0.9, 1.3, 0.20, 2021, 'expert'
),

-- PED10: Nefrologia Pediátrica (Difícil)
(
  'q1000000-0000-0000-0004-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Criança de 5 anos com edema palpebral matinal que evoluiu para anasarca. Urina I: proteína 4+, sem hematúria. Albumina sérica = 1.8 g/dL, colesterol = 380 mg/dL. Diagnóstico e tratamento inicial?',
  '[{"letter": "A", "text": "Síndrome nefrótica - Prednisona"}, {"letter": "B", "text": "Síndrome nefrítica - Restrição hídrica"}, {"letter": "C", "text": "Glomerulonefrite pós-estreptocócica - Penicilina"}, {"letter": "D", "text": "Síndrome hemolítico-urêmica - Suporte"}, {"letter": "E", "text": "Nefropatia por IgA - IECA"}]',
  0,
  'Tétrade: edema + proteinúria maciça + hipoalbuminemia + hiperlipidemia = síndrome nefrótica. Em crianças, maioria é lesão mínima, responsiva a corticoide.',
  'pediatria', 'Nefrologia', 'Síndrome Nefrótica', 'dificil',
  1.0, 1.6, 0.20, 2023, 'expert'
),

-- ============================================
-- SAÚDE COLETIVA (10 questions)
-- ============================================

-- SC1: Epidemiologia (Fácil)
(
  'q1000000-0000-0000-0005-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Em um estudo sobre COVID-19, 100 pessoas foram acompanhadas por 1 ano. 20 desenvolveram a doença. Qual a taxa de incidência?',
  '[{"letter": "A", "text": "20%"}, {"letter": "B", "text": "0.2 por pessoa-ano"}, {"letter": "C", "text": "20 casos"}, {"letter": "D", "text": "80%"}, {"letter": "E", "text": "Não é possível calcular"}]',
  0,
  'Incidência = casos novos / população em risco no período. 20/100 em 1 ano = 20% ou 0.2 por pessoa-ano.',
  'saude_coletiva', 'Epidemiologia', 'Medidas de Frequência', 'facil',
  -1.0, 1.3, 0.20, 2022, 'expert'
),

-- SC2: Vigilância (Médio)
(
  'q1000000-0000-0000-0005-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Médico atende caso suspeito de sarampo. Qual a conduta quanto à notificação?',
  '[{"letter": "A", "text": "Notificação imediata em até 24 horas"}, {"letter": "B", "text": "Notificação semanal"}, {"letter": "C", "text": "Notificação apenas se confirmado"}, {"letter": "D", "text": "Não é doença de notificação compulsória"}, {"letter": "E", "text": "Notificação mensal"}]',
  0,
  'Sarampo é de notificação imediata (até 24h) por ser doença em eliminação e pelo potencial de surtos.',
  'saude_coletiva', 'Vigilância Epidemiológica', 'Notificação Compulsória', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
),

-- SC3: SUS (Médio)
(
  'q1000000-0000-0000-0005-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'Sobre os princípios do SUS, qual alternativa corresponde corretamente a um princípio organizativo?',
  '[{"letter": "A", "text": "Descentralização"}, {"letter": "B", "text": "Universalidade"}, {"letter": "C", "text": "Integralidade"}, {"letter": "D", "text": "Equidade"}, {"letter": "E", "text": "Preservação da autonomia"}]',
  0,
  'Princípios doutrinários: universalidade, integralidade, equidade. Princípios organizativos: descentralização, regionalização, hierarquização, participação.',
  'saude_coletiva', 'Políticas de Saúde', 'SUS', 'medio',
  0.2, 1.3, 0.20, 2021, 'expert'
),

-- SC4: Bioestatística (Difícil)
(
  'q1000000-0000-0000-0005-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'Um teste diagnóstico para HIV tem sensibilidade de 99% e especificidade de 98%. Em uma população com prevalência de 1%, qual o valor preditivo positivo aproximado?',
  '[{"letter": "A", "text": "33%"}, {"letter": "B", "text": "50%"}, {"letter": "C", "text": "75%"}, {"letter": "D", "text": "99%"}, {"letter": "E", "text": "98%"}]',
  0,
  'VPP = VP/(VP+FP). Em 1000 pessoas: 10 HIV+ (9.9 VP), 990 HIV- (19.8 FP). VPP = 9.9/(9.9+19.8) ≈ 33%.',
  'saude_coletiva', 'Bioestatística', 'Testes Diagnósticos', 'dificil',
  1.2, 1.7, 0.20, 2023, 'expert'
),

-- SC5: Atenção Primária (Fácil)
(
  'q1000000-0000-0000-0005-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'Qual o número máximo recomendado de pessoas adstritas a uma equipe de Saúde da Família?',
  '[{"letter": "A", "text": "4.000 pessoas"}, {"letter": "B", "text": "2.000 pessoas"}, {"letter": "C", "text": "1.000 pessoas"}, {"letter": "D", "text": "5.000 pessoas"}, {"letter": "E", "text": "3.500 pessoas"}]',
  0,
  'Cada eSF deve ser responsável por no máximo 4.000 pessoas (recomendado 2.000-3.500), considerando vulnerabilidade.',
  'saude_coletiva', 'Atenção Primária', 'ESF', 'facil',
  -0.8, 1.2, 0.20, 2021, 'expert'
),

-- SC6: Medicina do Trabalho (Médio)
(
  'q1000000-0000-0000-0005-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Trabalhador exposto a ruído de 90 dB por 8 horas diárias. Qual a conduta quanto ao PCMSO?',
  '[{"letter": "A", "text": "Audiometria admissional, periódica e demissional"}, {"letter": "B", "text": "Apenas audiometria anual"}, {"letter": "C", "text": "Audiometria a cada 2 anos"}, {"letter": "D", "text": "Exame clínico apenas"}, {"letter": "E", "text": "Dispensa acompanhamento audiométrico"}]',
  0,
  'Exposição >85 dB requer PCA com audiometria nos exames admissional, periódico (semestral a anual) e demissional.',
  'saude_coletiva', 'Saúde do Trabalhador', 'PCMSO', 'medio',
  0.4, 1.4, 0.20, 2022, 'expert'
),

-- SC7: Epidemiologia Descritiva (Difícil)
(
  'q1000000-0000-0000-0005-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Um estudo comparou fumantes e não fumantes quanto ao desenvolvimento de câncer de pulmão. RR = 10. Qual a fração atribuível no grupo exposto?',
  '[{"letter": "A", "text": "90%"}, {"letter": "B", "text": "80%"}, {"letter": "C", "text": "10%"}, {"letter": "D", "text": "50%"}, {"letter": "E", "text": "100%"}]',
  0,
  'Fração atribuível = (RR-1)/RR = (10-1)/10 = 0.9 = 90%. Significa que 90% dos casos em fumantes são atribuíveis ao fumo.',
  'saude_coletiva', 'Epidemiologia', 'Medidas de Associação', 'dificil',
  1.1, 1.6, 0.20, 2023, 'expert'
),

-- SC8: Ética Médica (Muito Fácil)
(
  'q1000000-0000-0000-0005-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Paciente competente recusa transfusão sanguínea por motivos religiosos. Qual a conduta correta?',
  '[{"letter": "A", "text": "Respeitar a decisão e buscar alternativas"}, {"letter": "B", "text": "Realizar transfusão compulsória"}, {"letter": "C", "text": "Solicitar autorização judicial"}, {"letter": "D", "text": "Transferir para outro hospital"}, {"letter": "E", "text": "Aguardar perda de consciência para transfundir"}]',
  0,
  'Autonomia do paciente competente deve ser respeitada. Médico deve documentar, informar riscos e buscar alternativas.',
  'saude_coletiva', 'Ética Médica', 'Autonomia', 'muito_facil',
  -1.5, 1.2, 0.20, 2020, 'expert'
),

-- SC9: Epidemiologia Analítica (Muito Difícil)
(
  'q1000000-0000-0000-0005-000000000009',
  'a1000000-0000-0000-0000-000000000001',
  'Ensaio clínico randomizado avalia nova droga vs placebo. 200 pacientes em cada grupo. Droga: 40 eventos. Placebo: 80 eventos. Qual o NNT?',
  '[{"letter": "A", "text": "5"}, {"letter": "B", "text": "10"}, {"letter": "C", "text": "20"}, {"letter": "D", "text": "2.5"}, {"letter": "E", "text": "4"}]',
  0,
  'NNT = 1/RAR. RAR = 80/200 - 40/200 = 0.4 - 0.2 = 0.2. NNT = 1/0.2 = 5. Precisa tratar 5 para prevenir 1 evento.',
  'saude_coletiva', 'Epidemiologia', 'Ensaios Clínicos', 'muito_dificil',
  1.6, 1.8, 0.20, 2023, 'expert'
),

-- SC10: Planejamento em Saúde (Médio)
(
  'q1000000-0000-0000-0005-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Na Programação Pactuada Integrada (PPI), qual o papel do município na organização da atenção?',
  '[{"letter": "A", "text": "Garantir acesso à atenção básica e referenciar para média/alta complexidade"}, {"letter": "B", "text": "Apenas executar ações de vigilância"}, {"letter": "C", "text": "Ofertar apenas alta complexidade"}, {"letter": "D", "text": "Definir políticas nacionais"}, {"letter": "E", "text": "Financiar a atenção hospitalar"}]',
  0,
  'Município é responsável pela atenção básica de sua população e deve pactuar referências para média e alta complexidade.',
  'saude_coletiva', 'Políticas de Saúde', 'Regionalização', 'medio',
  0.3, 1.4, 0.20, 2022, 'expert'
)
ON CONFLICT (id) DO NOTHING;
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
    NULL,
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
    'e2025c10-0001-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Qual o grau de dificuldade das questões?',
    '[{"letter":"A","text":"Muito fácil","feedback":""},{"letter":"B","text":"Fácil","feedback":""},{"letter":"C","text":"Médio","feedback":""},{"letter":"D","text":"Difícil. (E) Muito difícil","feedback":""}]'::jsonb,
    0,
    NULL,
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
    NULL,
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
    'e2025c10-0003-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Em relação ao tempo total de aplicação, você considera que a prova foi',
    '[{"letter":"A","text":"muito longa","feedback":""},{"letter":"B","text":"longa","feedback":""},{"letter":"C","text":"adequada","feedback":""},{"letter":"D","text":"curta. (E) muito curta","feedback":""}]'::jsonb,
    0,
    NULL,
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
    NULL,
    'clinica_medica',
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
    'e2025c10-0004-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Os enunciados das questões estavam claros e objetivos?',
    '[{"letter":"A","text":"Sim, todos","feedback":""},{"letter":"B","text":"Sim, a maioria","feedback":""},{"letter":"C","text":"Apenas cerca da metade","feedback":""},{"letter":"D","text":"Poucos. (E) Não, nenhum","feedback":""}]'::jsonb,
    3,
    NULL,
    'clinica_medica',
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
    NULL,
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
    'e2025c10-0005-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'As informações/instruções fornecidas para a resolução das questões foram suficientes para resolvê-las?',
    '[{"letter":"A","text":"Sim, até excessivas","feedback":""},{"letter":"B","text":"Sim, em todas elas","feedback":""},{"letter":"C","text":"Sim, na maioria delas","feedback":""},{"letter":"D","text":"Sim, somente em algumas. (E) Não, em nenhuma delas","feedback":""}]'::jsonb,
    2,
    NULL,
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
    NULL,
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
    'e2025c10-0006-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Você se deparou com alguma dificuldade ao responder à prova? Qual?',
    '[{"letter":"A","text":"Desconhecimento do conteúdo","feedback":""},{"letter":"B","text":"Forma diferente de abordagem do conteúdo","feedback":""},{"letter":"C","text":"Espaço insuficiente para responder às questões","feedback":""},{"letter":"D","text":"Falta de motivação para fazer a prova. (E) Não tive qualquer tipo de dificuldade para responder à prova","feedback":""}]'::jsonb,
    1,
    NULL,
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
    NULL,
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
    'e2025c10-0008-0000-0000-000000000001',
    'e2025000-0000-0000-0000-000000000001',
    'Como você avalia a sequência das questões na prova?',
    '[{"letter":"A","text":"A sequência não interferiu nas minhas respostas","feedback":""},{"letter":"B","text":"Preferiria a sequência por área","feedback":""},{"letter":"C","text":"Preferiria a sequência por grau de dificuldade","feedback":""},{"letter":"D","text":"A sequência dificultou meu raciocínio durante a prova. (E) A sequência facilitou minha organização e resolução da prova","feedback":""}]'::jsonb,
    1,
    NULL,
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
    NULL,
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
    NULL,
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
    NULL,
    'clinica_medica',
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
    NULL,
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
    NULL,
    'clinica_medica',
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
    NULL,
    'clinica_medica',
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
    NULL,
    'clinica_medica',
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
    NULL,
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
    NULL,
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
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
    NULL,
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
    'cirurgia',
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
    NULL,
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
    NULL,
    'cirurgia',
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'pediatria',
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
    NULL,
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'ginecologia_obstetricia',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
    NULL,
    'saude_coletiva',
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
