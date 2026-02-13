-- Migration 019: Darwin-MFC medical content tables for web demo
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS medical_diseases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  enamed_area TEXT NOT NULL CHECK (enamed_area IN ('clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia', 'saude_coletiva')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  cid10 TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  search_terms TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_medications (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT[] NOT NULL DEFAULT '{}',
  atc_code TEXT,
  drug_class TEXT NOT NULL,
  subclass TEXT,
  summary TEXT,
  search_terms TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_diseases_enamed_area
  ON medical_diseases (enamed_area);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_categoria
  ON medical_diseases (categoria);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_title
  ON medical_diseases (title);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_search_terms_trgm
  ON medical_diseases USING GIN (search_terms gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medical_diseases_search_terms_fts
  ON medical_diseases USING GIN (to_tsvector('portuguese', search_terms));

CREATE INDEX IF NOT EXISTS idx_medical_medications_drug_class
  ON medical_medications (drug_class);
CREATE INDEX IF NOT EXISTS idx_medical_medications_generic_name
  ON medical_medications (generic_name);
CREATE INDEX IF NOT EXISTS idx_medical_medications_atc_code
  ON medical_medications (atc_code);
CREATE INDEX IF NOT EXISTS idx_medical_medications_search_terms_trgm
  ON medical_medications USING GIN (search_terms gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medical_medications_search_terms_fts
  ON medical_medications USING GIN (to_tsvector('portuguese', search_terms));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at'
      AND pg_function_is_visible(oid)
  ) THEN
    CREATE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_medical_diseases_updated_at ON medical_diseases;
CREATE TRIGGER update_medical_diseases_updated_at
  BEFORE UPDATE ON medical_diseases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_medical_medications_updated_at ON medical_medications;
CREATE TRIGGER update_medical_medications_updated_at
  BEFORE UPDATE ON medical_medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE medical_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medical_diseases_public_select ON medical_diseases;
CREATE POLICY medical_diseases_public_select
  ON medical_diseases
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS medical_medications_public_select ON medical_medications;
CREATE POLICY medical_medications_public_select
  ON medical_medications
  FOR SELECT
  USING (true);
