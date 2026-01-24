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
  );

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
  );

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
  );

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
  );
