-- =====================================================
-- Migration 010: Add 'adaptive' to exams.type constraint
-- =====================================================
-- Date: 2026-02-08
-- Description: The CAT (Computerized Adaptive Testing)
--   feature creates exams with type='adaptive', but the
--   CHECK constraint on exams.type only allows:
--   'official_simulation', 'custom', 'practice', 'review'.
--   This migration adds 'adaptive' to the allowed values.
-- =====================================================

-- Drop existing constraint
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_type_check;

-- Re-create with 'adaptive' included
ALTER TABLE exams ADD CONSTRAINT exams_type_check
  CHECK (type IN ('official_simulation', 'custom', 'practice', 'review', 'adaptive'));
