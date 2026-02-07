-- ============================================================
-- CIP Image Explanations: Schema Migration
-- ============================================================
-- Adds columns for image attribution and structured explanations.
-- The per-option explanationPt/clinicalPearlPt fields live inside
-- the existing JSONB option arrays — no column changes needed for those.
-- ============================================================

-- 1. Image attribution (license / source info)
ALTER TABLE cip_image_cases
  ADD COLUMN IF NOT EXISTS image_attribution TEXT;

-- 2. Structured explanation (richer than the single explanation_pt blob)
ALTER TABLE cip_image_cases
  ADD COLUMN IF NOT EXISTS structured_explanation JSONB;

-- Done. Run cip-image-explanations-data.sql next to populate the data.
