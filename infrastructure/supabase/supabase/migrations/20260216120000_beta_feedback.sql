-- Beta feedback table for collecting user feedback during beta testing
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('bug', 'feature', 'usability', 'content', 'general')),
  message text NOT NULL,
  page_url text,
  user_agent text,
  rating smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by user
CREATE INDEX idx_beta_feedback_user ON beta_feedback(user_id);
CREATE INDEX idx_beta_feedback_created ON beta_feedback(created_at DESC);

-- RLS: authenticated users can insert their own feedback
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anon inserts for non-logged-in users (email-only feedback)
CREATE POLICY "Anon can insert feedback"
  ON beta_feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
