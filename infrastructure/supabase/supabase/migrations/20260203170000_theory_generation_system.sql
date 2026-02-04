-- Theory Generation System - Database Schema
-- Supports automated generation of 100+ medical theory topics with evidence-based citations

-- Theory topics with versioning and generation metadata
CREATE TABLE IF NOT EXISTS theory_topics_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT UNIQUE NOT NULL,  -- kebab-case like 'hipertensao-arterial'
  version INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL CHECK (area IN ('clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia', 'saude_coletiva')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('basico', 'intermediario', 'avancado')),

  -- 8 content sections
  definition TEXT NOT NULL,
  epidemiology TEXT,
  pathophysiology TEXT,
  clinical_presentation TEXT,
  diagnosis TEXT,
  treatment TEXT,
  complications TEXT,
  prognosis TEXT,

  key_points TEXT[] NOT NULL DEFAULT '{}',
  estimated_read_time INTEGER,

  -- Links to related content
  related_disease_ids TEXT[] DEFAULT '{}',
  related_medication_ids TEXT[] DEFAULT '{}',

  -- Generation metadata
  source_disease_id TEXT,  -- Darwin-MFC disease ID if generated from disease
  source_type TEXT CHECK (source_type IN ('darwin-mfc', 'manual', 'hybrid')) DEFAULT 'manual',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT,  -- User ID who initiated generation
  validation_score NUMERIC(3,2) CHECK (validation_score >= 0 AND validation_score <= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'approved', 'published')) DEFAULT 'draft',

  published_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_topic_version UNIQUE (topic_id, version)
);

-- Citations with evidence levels and accessibility tracking
CREATE TABLE IF NOT EXISTS theory_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  source TEXT,  -- 'Diretriz SBC', 'PubMed', 'UpToDate', 'PubMed', 'Diretriz Brasileira', etc.
  evidence_level TEXT CHECK (evidence_level IN ('A', 'B', 'C', 'unknown')),
  publication_year INTEGER,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  is_accessible BOOLEAN DEFAULT true,
  accessibility_checked_at TIMESTAMPTZ,

  -- Content metadata
  authors TEXT,
  journal TEXT,
  doi TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many relationship: which citations support which sections of which topics
CREATE TABLE IF NOT EXISTS theory_topic_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,
  citation_id UUID NOT NULL REFERENCES theory_citations(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,  -- Which section uses this citation (definition, epidemiology, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_topic_citation_section UNIQUE (topic_id, citation_id, section_name)
);

-- Research cache to avoid re-researching the same topics (7-day TTL)
CREATE TABLE IF NOT EXISTS theory_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_title TEXT NOT NULL,
  search_query TEXT NOT NULL,
  results JSONB NOT NULL,  -- Cached research results
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',

  CONSTRAINT unique_search_query UNIQUE (search_query)
);

-- Batch generation job tracking
CREATE TABLE IF NOT EXISTS theory_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT,
  total_topics INTEGER NOT NULL,
  completed_topics INTEGER DEFAULT 0,
  failed_topics INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  cost_usd NUMERIC(10,4) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation job results
CREATE TABLE IF NOT EXISTS theory_generation_job_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES theory_generation_jobs(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  cost_usd NUMERIC(10,4),
  generated_at TIMESTAMPTZ,

  CONSTRAINT unique_job_topic UNIQUE (job_id, topic_id)
);

-- Validation flags and issues from 5-stage pipeline
CREATE TABLE IF NOT EXISTS theory_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,
  validation_stage TEXT NOT NULL CHECK (validation_stage IN ('structural', 'medical', 'citations', 'readability', 'completeness')),
  passed BOOLEAN NOT NULL,
  score NUMERIC(3,2),
  issues TEXT[],  -- Array of issue descriptions
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citation Verification Audit Trail
-- Tracks every citation verification with verification score and accessibility status
CREATE TABLE IF NOT EXISTS citation_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id UUID NOT NULL REFERENCES theory_citations(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,

  -- Verification results
  is_accessible BOOLEAN NOT NULL,
  http_status_code INTEGER,
  title_match BOOLEAN,
  extracted_title TEXT,
  verification_score NUMERIC(3,2) CHECK (verification_score >= 0 AND verification_score <= 1),

  -- Evidence and authority checks
  is_authoritative BOOLEAN,
  source_type TEXT CHECK (source_type IN ('brazilian_guideline', 'pubmed', 'uptodate', 'web', 'unknown')),

  -- Warnings and issues
  warnings TEXT[],

  -- Audit metadata
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_method TEXT CHECK (verification_method IN ('http_check', 'title_extraction', 'ai_review')),
  verified_by TEXT DEFAULT 'ai-system',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hallucination Detection Audit Trail
-- Tracks claims that were checked against citations and their verification status
CREATE TABLE IF NOT EXISTS hallucination_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL CHECK (section_name IN ('definition', 'epidemiology', 'pathophysiology', 'clinicalPresentation', 'diagnosis', 'treatment', 'complications', 'prognosis')),

  -- The claim that was checked
  claim_text TEXT NOT NULL,
  claim_hash TEXT,  -- Hash for deduplication

  -- Verification results
  claim_supported BOOLEAN NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  supporting_citations UUID[],  -- Array of citation IDs that support this claim

  -- Risk assessment
  is_dangerous_claim BOOLEAN DEFAULT false,  -- True if claim is about dosages, contraindications, etc.
  risk_level TEXT CHECK (risk_level IN ('critical', 'high', 'medium', 'low')) DEFAULT 'low',

  -- Audit metadata
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  checked_by TEXT DEFAULT 'ai-system',
  reviewed_by TEXT,  -- Human reviewer if manually verified
  reviewed_at TIMESTAMPTZ,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'disputed', 'rejected')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citation Provenance Details
-- Maps specific claims in sections to their supporting citations with confidence scores
CREATE TABLE IF NOT EXISTS citation_provenance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES theory_topics_generated(id) ON DELETE CASCADE,
  hallucination_audit_id UUID NOT NULL REFERENCES hallucination_audit(id) ON DELETE CASCADE,
  citation_id UUID NOT NULL REFERENCES theory_citations(id) ON DELETE CASCADE,

  -- Confidence that this citation actually supports the claim
  support_confidence NUMERIC(3,2) CHECK (support_confidence >= 0 AND support_confidence <= 1),
  evidence_strength TEXT CHECK (evidence_strength IN ('direct', 'indirect', 'speculative')),

  -- Notes on how the citation supports this claim
  justification TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_theory_topics_status ON theory_topics_generated(status);
CREATE INDEX IF NOT EXISTS idx_theory_topics_area ON theory_topics_generated(area);
CREATE INDEX IF NOT EXISTS idx_theory_topics_difficulty ON theory_topics_generated(difficulty);
CREATE INDEX IF NOT EXISTS idx_theory_topics_source_type ON theory_topics_generated(source_type);
CREATE INDEX IF NOT EXISTS idx_theory_topics_generated_at ON theory_topics_generated(generated_at);
CREATE INDEX IF NOT EXISTS idx_theory_research_cache_expires ON theory_research_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_theory_citations_url ON theory_citations(url);
CREATE INDEX IF NOT EXISTS idx_theory_citations_source ON theory_citations(source);
CREATE INDEX IF NOT EXISTS idx_theory_topic_citations_topic ON theory_topic_citations(topic_id);
CREATE INDEX IF NOT EXISTS idx_theory_topic_citations_citation ON theory_topic_citations(citation_id);
CREATE INDEX IF NOT EXISTS idx_theory_generation_jobs_status ON theory_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_theory_validation_results_topic ON theory_validation_results(topic_id);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_citation_verification_audit_topic ON citation_verification_audit(topic_id);
CREATE INDEX IF NOT EXISTS idx_citation_verification_audit_citation ON citation_verification_audit(citation_id);
CREATE INDEX IF NOT EXISTS idx_citation_verification_audit_verified_at ON citation_verification_audit(verified_at);
CREATE INDEX IF NOT EXISTS idx_citation_verification_audit_score ON citation_verification_audit(verification_score);
CREATE INDEX IF NOT EXISTS idx_hallucination_audit_topic ON hallucination_audit(topic_id);
CREATE INDEX IF NOT EXISTS idx_hallucination_audit_section ON hallucination_audit(section_name);
CREATE INDEX IF NOT EXISTS idx_hallucination_audit_risk_level ON hallucination_audit(risk_level);
CREATE INDEX IF NOT EXISTS idx_hallucination_audit_claim_hash ON hallucination_audit(claim_hash);
CREATE INDEX IF NOT EXISTS idx_citation_provenance_audit_topic ON citation_provenance_audit(topic_id);
CREATE INDEX IF NOT EXISTS idx_citation_provenance_audit_hallucination ON citation_provenance_audit(hallucination_audit_id);
CREATE INDEX IF NOT EXISTS idx_citation_provenance_audit_citation ON citation_provenance_audit(citation_id);

-- Enable RLS (Row Level Security)
ALTER TABLE theory_topics_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_topic_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_generation_job_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE theory_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_verification_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallucination_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_provenance_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read published topics
CREATE POLICY "Published theory topics are public" ON theory_topics_generated
  FOR SELECT USING (status = 'published');

-- RLS Policy: Admins can manage topics
CREATE POLICY "Admins can manage theory topics" ON theory_topics_generated
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid()::text = generated_by
  );

-- RLS Policy: Everyone can read citations
CREATE POLICY "Citations are public" ON theory_citations
  FOR SELECT USING (true);

-- RLS Policy: Admins can manage citations
CREATE POLICY "Admins can manage citations" ON theory_citations
  FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policy: Research cache is public
CREATE POLICY "Research cache is public" ON theory_research_cache
  FOR SELECT USING (true);

-- RLS Policies for Audit Tables
-- Admins can read all audit data
CREATE POLICY "Admins can read audit data" ON citation_verification_audit
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can read hallucination audit" ON hallucination_audit
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can read provenance audit" ON citation_provenance_audit
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- System can write audit data
CREATE POLICY "System can write citation verification audit" ON citation_verification_audit
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can write hallucination audit" ON hallucination_audit
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can write provenance audit" ON citation_provenance_audit
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Auto-cleanup of expired research cache (optional - can be done via scheduled job)
-- SELECT cleanup_expired_research_cache(); -- Call periodically

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_theory_topics_generated_updated_at
  BEFORE UPDATE ON theory_topics_generated
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theory_citations_updated_at
  BEFORE UPDATE ON theory_citations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theory_generation_jobs_updated_at
  BEFORE UPDATE ON theory_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for schema verification (optional)
-- INSERT INTO theory_citations (url, title, source, evidence_level, publication_year)
-- VALUES (
--   'https://example.com/guideline',
--   'Example Guideline',
--   'Diretriz SBC',
--   'A',
--   2024
-- );
