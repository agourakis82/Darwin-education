-- Public read access for theory topic citation mapping.
-- Needed so the web app can render per-topic references (citations are already public).

DROP POLICY IF EXISTS "Theory topic citations are public" ON theory_topic_citations;
CREATE POLICY "Theory topic citations are public" ON theory_topic_citations
  FOR SELECT
  USING (true);

