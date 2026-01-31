/**
 * Database Migration: AI Integration Support
 * Adds AI metadata columns, caching table, and rate limiting fields.
 */

-- Track AI generation metadata on questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS ai_generation_cost NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'minimax',
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validation_score INTEGER CHECK (validation_score BETWEEN 1 AND 5);

-- Cache AI responses to reduce cost
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type TEXT NOT NULL,
  request_hash TEXT UNIQUE NOT NULL,
  response_text TEXT NOT NULL,
  tokens_used INTEGER,
  cost_brl NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hits INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_response_cache(request_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_response_cache(expires_at);

-- Rate limiting and credits per user
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day';

-- Protect AI cache from direct client access
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_cache_no_access ON ai_response_cache;
CREATE POLICY ai_cache_no_access ON ai_response_cache
  FOR ALL USING (false);
