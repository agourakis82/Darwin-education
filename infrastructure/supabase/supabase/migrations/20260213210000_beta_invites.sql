-- =====================================================
-- Beta Web: Invite-only Signup (Darwin Education)
-- =====================================================
-- Date: 2026-02-13
-- Goal: Add invite-code infrastructure for closed beta accounts.
--
-- Security notes:
-- - Store only hashes of invite codes (never plaintext).
-- - No public RLS policies; access should be server-side via service_role.
-- - Track redemptions for audit and abuse triage.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) Invites (hashed codes)
-- =====================================================

CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL,
  label TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_beta_invites_code_hash ON beta_invites (code_hash);
CREATE INDEX IF NOT EXISTS idx_beta_invites_expires_at ON beta_invites (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_beta_invites_disabled ON beta_invites (disabled);

ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Intentionally no RLS policies: only service_role should access.

-- =====================================================
-- 2) Redemptions (audit log)
-- =====================================================

CREATE TABLE IF NOT EXISTS beta_invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES beta_invites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT,
  UNIQUE(invite_id, email)
);

CREATE INDEX IF NOT EXISTS idx_beta_invite_redemptions_invite_id ON beta_invite_redemptions(invite_id);
CREATE INDEX IF NOT EXISTS idx_beta_invite_redemptions_user_id ON beta_invite_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_invite_redemptions_redeemed_at ON beta_invite_redemptions(redeemed_at DESC);

ALTER TABLE beta_invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Intentionally no RLS policies: only service_role should access.

COMMENT ON TABLE beta_invites IS 'Invite codes (stored hashed) for closed beta signups.';
COMMENT ON TABLE beta_invite_redemptions IS 'Audit log of beta invite redemptions.';
