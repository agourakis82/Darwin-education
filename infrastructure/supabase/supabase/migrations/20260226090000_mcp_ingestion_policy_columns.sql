-- Migration: MCP ingestion policy + run metrics columns
-- Adds explicit, queryable source-policy and evidence fields.

ALTER TABLE IF EXISTS ingestion_runs
  ADD COLUMN IF NOT EXISTS links_allowed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS links_review INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS links_blocked INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS ingested_questions
  ADD COLUMN IF NOT EXISTS source_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS source_policy_rule_id TEXT,
  ADD COLUMN IF NOT EXISTS source_policy_decision TEXT CHECK (source_policy_decision IN ('allow', 'review', 'block')),
  ADD COLUMN IF NOT EXISTS source_rights_class TEXT,
  ADD COLUMN IF NOT EXISTS source_requires_human_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source_policy_reason TEXT,
  ADD COLUMN IF NOT EXISTS source_discovered_from_url TEXT,
  ADD COLUMN IF NOT EXISTS source_discovery_method TEXT CHECK (source_discovery_method IN ('portal_index', 'domain_crawl', 'seed_page', 'manual')),
  ADD COLUMN IF NOT EXISTS source_raw_text_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS source_extraction_method TEXT,
  ADD COLUMN IF NOT EXISTS source_fetched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at
  ON ingestion_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingested_questions_source_policy_decision
  ON ingested_questions(source_policy_decision);

CREATE INDEX IF NOT EXISTS idx_ingested_questions_source_discovery_method
  ON ingested_questions(source_discovery_method);

CREATE INDEX IF NOT EXISTS idx_ingested_questions_source_requires_review
  ON ingested_questions(source_requires_human_review);
