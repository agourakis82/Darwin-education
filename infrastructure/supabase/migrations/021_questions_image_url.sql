-- Migration 021: Add image_url column to questions
-- =====================================================
-- Enables clinical images (uploaded to exam-images bucket in Supabase Storage)
-- to be linked directly to exam questions.
--
-- Initial images:
--   questao-5-lesao-cutanea.jpg  — skin lesion (esporotricose, questão 5 ENAMED 2025)
--   questao-53-tc-cranio.jpg     — brain CT scan (questão 53 ENAMED 2025)
-- =====================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;

UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-5-lesao-cutanea.jpg'
WHERE id = 'e2025c10-0005-0000-0000-000000000001';

UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-53-tc-cranio.jpg'
WHERE id = 'e2025c10-0053-0000-0000-000000000001';

