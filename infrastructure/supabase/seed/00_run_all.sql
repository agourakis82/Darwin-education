-- Darwin Education - Run All Seeds
-- ==================================
-- Execute this file to run all seed files in order

-- Make sure schema is created first
-- \i ../schema.sql

-- Run seeds in order
\i 01_question_banks.sql
\i 02_sample_questions.sql
\i 03_achievements.sql
\i 04_study_paths.sql
\i 06_cip_sample_data.sql

-- Verify data
SELECT 'Question Banks' as table_name, COUNT(*) as count FROM question_banks
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'Study Paths', COUNT(*) FROM study_paths
UNION ALL
SELECT 'Study Modules', COUNT(*) FROM study_modules
UNION ALL
SELECT 'CIP Diagnoses', COUNT(*) FROM cip_diagnoses
UNION ALL
SELECT 'CIP Findings', COUNT(*) FROM cip_findings
UNION ALL
SELECT 'CIP Puzzles', COUNT(*) FROM cip_puzzles
UNION ALL
SELECT 'CIP Puzzle Grid', COUNT(*) FROM cip_puzzle_grid;
