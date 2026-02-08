-- ============================================================
-- SYSTEM FLASHCARD DECKS — 5 decks (one per ENAMED area)
-- is_system = true, user_id = NULL (platform-owned)
-- ============================================================

INSERT INTO flashcard_decks (id, user_id, name, description, area, is_public, card_count, is_system)
VALUES
  ('a0000001-0000-0000-0000-000000000001', NULL, 'Clínica Médica — Essenciais', 'Cards essenciais de Clínica Médica para o ENAMED: cardiologia, endocrinologia, pneumologia, nefrologia e gastroenterologia.', 'clinica_medica', true, 200, true),
  ('a0000001-0000-0000-0000-000000000002', NULL, 'Cirurgia — Essenciais', 'Cards essenciais de Cirurgia para o ENAMED: trauma, abdome agudo, cirurgia vascular, urologia e ortopedia.', 'cirurgia', true, 200, true),
  ('a0000001-0000-0000-0000-000000000003', NULL, 'Ginecologia e Obstetrícia — Essenciais', 'Cards essenciais de GO para o ENAMED: pré-natal, parto, ginecologia, oncologia ginecológica e planejamento familiar.', 'ginecologia_obstetricia', true, 200, true),
  ('a0000001-0000-0000-0000-000000000004', NULL, 'Pediatria — Essenciais', 'Cards essenciais de Pediatria para o ENAMED: neonatologia, crescimento, infectologia pediátrica, emergências e imunização.', 'pediatria', true, 200, true),
  ('a0000001-0000-0000-0000-000000000005', NULL, 'Saúde Coletiva — Essenciais', 'Cards essenciais de Saúde Coletiva para o ENAMED: epidemiologia, vigilância, SUS/políticas, atenção primária e saúde do trabalhador.', 'saude_coletiva', true, 200, true)
ON CONFLICT (id) DO NOTHING;
