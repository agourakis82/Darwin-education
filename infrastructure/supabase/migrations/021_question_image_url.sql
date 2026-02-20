-- Migration 021: Add image_url column to questions table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye/sql

ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN questions.image_url IS 'Public URL of a clinical image in Supabase Storage (exam-images bucket)';

-- Update ENAMED 2025 questions with their clinical images
UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-5-lesao-cutanea.jpg'
WHERE id = 'e2025c10-0005-0000-0000-000000000001';

UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-53-tc-cranio.jpg'
WHERE id = 'e2025c10-0053-0000-0000-000000000001';

-- Caderno 2 counterparts (same clinical images, different question order)
-- questao 100 in C2 = questao 5 in C1 (skin lesion)
UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-5-lesao-cutanea.jpg'
WHERE id = 'e2025c20-0100-0000-0000-000000000001';

-- questao 47 in C2 = questao 53 in C1 (brain CT)
UPDATE questions
SET image_url = 'https://jpzkjkwcoudaxscrukye.supabase.co/storage/v1/object/public/exam-images/enamed-2025/questao-53-tc-cranio.jpg'
WHERE id = 'e2025c20-0047-0000-0000-000000000001';

-- Verify
SELECT id, year, image_url FROM questions WHERE image_url IS NOT NULL;
