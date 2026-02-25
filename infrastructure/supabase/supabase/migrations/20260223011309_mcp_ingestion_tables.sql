-- Migration: MCP Ingestion Tables
-- Handles the automated data ingestion system for medical exam questions

-- Table for storing search queries and sources configurations
CREATE TABLE IF NOT EXISTS ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    search_terms TEXT[] NOT NULL,
    trusted_domains TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking individual search/extraction runs
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES ingestion_sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'paused')),
    links_found INTEGER DEFAULT 0,
    questions_extracted INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table for storing the raw and structured questions before they hit the main `questions` table
CREATE TABLE IF NOT EXISTS ingested_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES ingestion_runs(id) ON DELETE SET NULL,
    
    -- Source info
    source_url TEXT NOT NULL,
    institution TEXT,
    year INTEGER,
    exam_type TEXT, -- e.g. ENARE, REVALIDA
    
    -- Content extracted
    raw_text TEXT,
    stem TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of {letter, text}
    correct_index INTEGER,  -- Can be NULL if not yet associated
    image_url TEXT,
    
    -- Classification
    area TEXT CHECK (area IN ('clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva', 'unknown')),
    tags TEXT[] DEFAULT '{}',
    
    -- Curation status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'conflict', 'needs_review')),
    curator_notes TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Final mapped ID in the main questions table
    target_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and dashboard filtering
CREATE INDEX idx_ingestion_runs_source ON ingestion_runs(source_id);
CREATE INDEX idx_ingested_questions_status ON ingested_questions(status);
CREATE INDEX idx_ingested_questions_area ON ingested_questions(area);
CREATE INDEX idx_ingested_questions_exam_type ON ingested_questions(exam_type);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_ingestion_sources
BEFORE UPDATE ON ingestion_sources
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_ingested_questions
BEFORE UPDATE ON ingested_questions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
