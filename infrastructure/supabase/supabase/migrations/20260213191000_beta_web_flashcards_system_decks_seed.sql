-- =====================================================
-- Beta Web Seed: System Flashcard Decks (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Provide 5 platform-owned public decks (one per ENAMED area).

INSERT INTO flashcard_decks (id, user_id, name, description, area, is_public, card_count, is_system)
VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    NULL,
    'Clínica Médica — Essenciais',
    'Cards essenciais de Clínica Médica para o ENAMED: cardiologia, endocrinologia, pneumologia, nefrologia e gastroenterologia.',
    'clinica_medica',
    TRUE,
    200,
    TRUE
  ),
  (
    'a0000001-0000-0000-0000-000000000002',
    NULL,
    'Cirurgia — Essenciais',
    'Cards essenciais de Cirurgia para o ENAMED: trauma, abdome agudo, cirurgia vascular, urologia e ortopedia.',
    'cirurgia',
    TRUE,
    200,
    TRUE
  ),
  (
    'a0000001-0000-0000-0000-000000000003',
    NULL,
    'Ginecologia e Obstetrícia — Essenciais',
    'Cards essenciais de GO para o ENAMED: pré-natal, parto, ginecologia, oncologia ginecológica e planejamento familiar.',
    'ginecologia_obstetricia',
    TRUE,
    200,
    TRUE
  ),
  (
    'a0000001-0000-0000-0000-000000000004',
    NULL,
    'Pediatria — Essenciais',
    'Cards essenciais de Pediatria para o ENAMED: neonatologia, crescimento, infectologia pediátrica, emergências e imunização.',
    'pediatria',
    TRUE,
    200,
    TRUE
  ),
  (
    'a0000001-0000-0000-0000-000000000005',
    NULL,
    'Saúde Coletiva — Essenciais',
    'Cards essenciais de Saúde Coletiva para o ENAMED: epidemiologia, vigilância, SUS/políticas, atenção primária e saúde do trabalhador.',
    'saude_coletiva',
    TRUE,
    200,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  area = EXCLUDED.area,
  is_public = EXCLUDED.is_public,
  card_count = EXCLUDED.card_count,
  is_system = EXCLUDED.is_system,
  updated_at = NOW();

