-- Migration 020: Allow authenticated users to insert into item_exposure_log
-- =====================================================
-- Migration 005 created item_exposure_log with an admin-only policy for ALL
-- operations. The CAT API routes run as the authenticated user (anon key +
-- session cookie), so they cannot insert exposure rows.
--
-- This migration adds a dedicated INSERT policy that allows any authenticated
-- user to log their own item exposures, while keeping read/update/delete
-- restricted to admins.
-- =====================================================

-- Drop the overly-broad ALL policy that blocks non-admin inserts
DROP POLICY IF EXISTS "Only admins can access exposure logs" ON item_exposure_log;

-- Admins can do everything (SELECT, UPDATE, DELETE)
CREATE POLICY "Admins can manage exposure logs"
  ON item_exposure_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Any authenticated user (i.e. the CAT API route acting on behalf of the user)
-- can INSERT a row. No WITH CHECK restriction needed beyond authentication.
CREATE POLICY "Authenticated users can insert exposure logs"
  ON item_exposure_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

