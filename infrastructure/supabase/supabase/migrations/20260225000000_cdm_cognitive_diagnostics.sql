-- =====================================================
-- Migration 022: CDM — Cognitive Diagnostic Models
-- =====================================================
-- Date: 2026-02-25
-- Author: Darwin Education
--
-- Adds K=6 cognitive attribute framework, Q-matrix linking
-- questions to attributes, CDM parameter storage (DINA/G-DINA),
-- and per-student attribute mastery snapshots.
--
-- Scientific basis:
--   DINA: Junker & Sijtsma (2001). APM, 25(3), 258-282.
--   G-DINA: de la Torre (2011). Psychometrika, 76, 179-199.
-- =====================================================

-- =====================================================
-- PART 1: Cognitive Attributes (K=6)
-- =====================================================

CREATE TABLE IF NOT EXISTS cognitive_attributes (
  id TEXT PRIMARY KEY,
  -- e.g., 'data_gathering', 'diagnostic_reasoning', etc.
  name_pt TEXT NOT NULL,
  description_pt TEXT,
  ordinal INTEGER NOT NULL,
  -- Corresponding FCR clinical reasoning level
  fcr_level TEXT CHECK (fcr_level IN ('dados', 'padrao', 'hipotese', 'conduta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO cognitive_attributes
  (id, name_pt, description_pt, ordinal, fcr_level)
VALUES
  ('data_gathering',        'Coleta de Dados Clínicos',    'Anamnese e exame físico dirigido',                        1, 'dados'),
  ('diagnostic_reasoning',  'Raciocínio Diagnóstico',      'Diagnóstico diferencial e reconhecimento de padrão',       2, 'padrao'),
  ('clinical_judgment',     'Julgamento Clínico',           'Melhor hipótese diagnóstica e estratificação de risco',    3, 'hipotese'),
  ('therapeutic_decision',  'Decisão Terapêutica',          'Plano terapêutico e seleção racional de fármacos',         4, 'conduta'),
  ('preventive_medicine',   'Medicina Preventiva',           'Saúde populacional, rastreamento e vacinação',             5, 'conduta'),
  ('emergency_management',  'Manejo de Emergências',         'Triagem, protocolos e condutas de urgência',               6, 'conduta')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: Q-Matrix
-- =====================================================
-- Binary mapping of exam questions to cognitive attributes.
-- q_{jk} = 1 means question j requires mastery of attribute k.
--
-- Source provenance:
--   'heuristic'  — seeded from area metadata (initial)
--   'expert'     — validated by a medical educator
--   'empirical_em' — refined via EM algorithm on response data
--   'llm'        — assigned by LLM with expert review

CREATE TABLE IF NOT EXISTS question_q_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attribute_id TEXT NOT NULL REFERENCES cognitive_attributes(id),
  required BOOLEAN NOT NULL DEFAULT true,
  -- Weight for continuous Q-matrix extensions (reserved, always 1.0 for binary DINA)
  weight NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  -- Provenance
  source TEXT NOT NULL DEFAULT 'heuristic'
    CHECK (source IN ('heuristic', 'expert', 'empirical_em', 'llm')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_qmatrix_question_id ON question_q_matrix (question_id);
CREATE INDEX IF NOT EXISTS idx_qmatrix_attribute_id ON question_q_matrix (attribute_id);

-- =====================================================
-- PART 3: CDM Parameters (Calibrated Model)
-- =====================================================
-- Stores EM-estimated DINA or G-DINA parameters for the question bank.
-- A new row is inserted after each re-calibration run.

CREATE TABLE IF NOT EXISTS cdm_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL CHECK (model_type IN ('dina', 'gdina')),
  link_function TEXT DEFAULT 'identity'
    CHECK (link_function IN ('identity', 'logit', 'log')),
  -- Per-item parameters serialized as JSONB
  -- DINA:  [{ itemId, slip, guessing, requiredAttributes: number[] }, ...]
  -- G-DINA: [{ itemId, deltaCoeffs: number[], numRequiredAttributes, requiredAttributes }, ...]
  item_parameters JSONB NOT NULL,
  -- Class prior distribution P(α_c) for c ∈ {0..63} — float[64]
  class_priors JSONB NOT NULL,
  -- EM convergence metadata
  em_iterations INTEGER NOT NULL DEFAULT 0,
  em_converged BOOLEAN NOT NULL DEFAULT false,
  final_log_likelihood NUMERIC(14, 4),
  -- Model fit indices (aic, bic, rmsea, srmr, gSquared, df, pValue)
  fit_indices JSONB,
  -- Calibration context
  calibration_n INTEGER,       -- number of students used
  calibration_items INTEGER,   -- number of items calibrated
  estimated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdm_params_model_type ON cdm_parameters (model_type);
CREATE INDEX IF NOT EXISTS idx_cdm_params_estimated ON cdm_parameters (estimated_at DESC);

-- =====================================================
-- PART 4: CDM Snapshots (Per-Student Classification)
-- =====================================================
-- One row per classification event; multiple rows per user (history).

CREATE TABLE IF NOT EXISTS cdm_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- CDM parameter set used for this classification
  cdm_parameters_id UUID REFERENCES cdm_parameters(id),
  -- MAP: index of most probable latent class ∈ {0..63}
  -- Binary encoding: bit k of latent_class = mastery of attribute k
  latent_class INTEGER NOT NULL CHECK (latent_class >= 0 AND latent_class < 64),
  -- EAP marginal posteriors per attribute — float[6], each ∈ [0,1]
  eap_estimate JSONB NOT NULL,
  -- MAP binary mastery vector — boolean[6]
  map_estimate JSONB NOT NULL,
  -- Full posterior over 64 latent classes — float[64]
  posterior_probabilities JSONB NOT NULL,
  -- Posterior entropy (bits): 0 = perfectly classified, 6 = maximally uncertain
  posterior_entropy NUMERIC(6, 4) NOT NULL,
  -- Model type used
  model_type TEXT NOT NULL CHECK (model_type IN ('dina', 'gdina')),
  -- Derived mastery summary (for fast querying)
  mastered_attributes TEXT[] DEFAULT '{}',
  unmastered_attributes TEXT[] DEFAULT '{}',
  -- Classification confidence = 1 - entropy/log2(64)
  classification_confidence NUMERIC(5, 4),
  -- Number of questions used for this classification
  items_used INTEGER DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdm_snapshots_user_id ON cdm_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_cdm_snapshots_user_time ON cdm_snapshots (user_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdm_snapshots_latent_class ON cdm_snapshots (latent_class);

-- =====================================================
-- PART 5: Add CDM column to learner_model_snapshots
-- =====================================================

ALTER TABLE learner_model_snapshots
  ADD COLUMN IF NOT EXISTS cdm_profile JSONB;

COMMENT ON COLUMN learner_model_snapshots.cdm_profile IS
  'CDM classification snapshot: { mapEstimate: boolean[6], eapEstimate: number[6], latentClass: number, posteriorEntropy: number }';

-- =====================================================
-- PART 6: Row Level Security
-- =====================================================

ALTER TABLE cognitive_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_q_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdm_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdm_snapshots ENABLE ROW LEVEL SECURITY;

-- cognitive_attributes: public read (no PII)
CREATE POLICY "cdm_attrs_public_read"
  ON cognitive_attributes FOR SELECT TO authenticated USING (true);

-- question_q_matrix: public read; service role writes
CREATE POLICY "qmatrix_public_read"
  ON question_q_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "qmatrix_authenticated_insert"
  ON question_q_matrix FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qmatrix_authenticated_update"
  ON question_q_matrix FOR UPDATE TO authenticated USING (true);

-- cdm_parameters: public read; service role writes
CREATE POLICY "cdm_params_public_read"
  ON cdm_parameters FOR SELECT TO authenticated USING (true);
CREATE POLICY "cdm_params_authenticated_insert"
  ON cdm_parameters FOR INSERT TO authenticated WITH CHECK (true);

-- cdm_snapshots: own data only
CREATE POLICY "cdm_snapshots_select_own"
  ON cdm_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "cdm_snapshots_insert_own"
  ON cdm_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 7: Seed Q-Matrix from Question Area Metadata
-- =====================================================
-- Heuristic mapping: area → primary cognitive attributes.
-- These seeds are marked source='heuristic' for expert review.
--
-- Mapping (3 attributes per area, based on clinical competency):
--   clinica_medica          → data_gathering + diagnostic_reasoning + clinical_judgment
--   cirurgia                → clinical_judgment + therapeutic_decision + emergency_management
--   ginecologia_obstetricia → diagnostic_reasoning + therapeutic_decision + preventive_medicine
--   pediatria               → data_gathering + diagnostic_reasoning + preventive_medicine
--   saude_coletiva          → diagnostic_reasoning + preventive_medicine

INSERT INTO question_q_matrix (question_id, attribute_id, required, weight, source)
SELECT
  q.id AS question_id,
  attr.id AS attribute_id,
  true AS required,
  1.0 AS weight,
  'heuristic' AS source
FROM questions q
CROSS JOIN cognitive_attributes attr
WHERE
  (q.area = 'clinica_medica'
    AND attr.id IN ('data_gathering', 'diagnostic_reasoning', 'clinical_judgment'))
  OR
  (q.area = 'cirurgia'
    AND attr.id IN ('clinical_judgment', 'therapeutic_decision', 'emergency_management'))
  OR
  (q.area = 'ginecologia_obstetricia'
    AND attr.id IN ('diagnostic_reasoning', 'therapeutic_decision', 'preventive_medicine'))
  OR
  (q.area = 'pediatria'
    AND attr.id IN ('data_gathering', 'diagnostic_reasoning', 'preventive_medicine'))
  OR
  (q.area = 'saude_coletiva'
    AND attr.id IN ('diagnostic_reasoning', 'preventive_medicine'))
ON CONFLICT (question_id, attribute_id) DO NOTHING;
