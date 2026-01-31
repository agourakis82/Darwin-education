-- Migration 006: Access Codes and Admin Features
-- Darwin Education - São Leopoldo Mandic Medical School Pilot
--
-- This migration adds:
-- 1. Access codes table for controlled student registration
-- 2. Study activity tracking for accurate streak calculation
-- 3. Question flags table for student feedback

-- ============================================================================
-- ACCESS CODES TABLE
-- ============================================================================
-- Used for controlled registration during pilot phase
-- Admin generates codes, students use them during signup

CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for code lookups during registration
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON access_codes(expires_at) WHERE expires_at IS NOT NULL;

-- RLS policies for access_codes
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view all codes
CREATE POLICY "Admins can view all access codes"
    ON access_codes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Anyone can check if a code is valid (needed for registration)
CREATE POLICY "Anyone can validate access codes"
    ON access_codes FOR SELECT
    USING (true);

-- Only admins can create codes
CREATE POLICY "Admins can create access codes"
    ON access_codes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can update codes (for marking as used)
CREATE POLICY "System can update access codes"
    ON access_codes FOR UPDATE
    USING (true);

-- ============================================================================
-- STUDY ACTIVITY TABLE
-- ============================================================================
-- Tracks daily study activity for accurate streak calculation
-- One row per user per day

CREATE TABLE IF NOT EXISTS study_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    exams_completed INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- Indexes for study activity
CREATE INDEX IF NOT EXISTS idx_study_activity_user_date ON study_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_study_activity_date ON study_activity(activity_date);

-- RLS policies for study_activity
ALTER TABLE study_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view own study activity"
    ON study_activity FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert/update activity
CREATE POLICY "System can manage study activity"
    ON study_activity FOR ALL
    USING (true);

-- Function to update study activity
CREATE OR REPLACE FUNCTION update_study_activity(
    p_user_id UUID,
    p_exams INTEGER DEFAULT 0,
    p_flashcards INTEGER DEFAULT 0,
    p_questions INTEGER DEFAULT 0,
    p_time_seconds INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO study_activity (user_id, activity_date, exams_completed, flashcards_reviewed, questions_answered, time_spent_seconds)
    VALUES (p_user_id, CURRENT_DATE, p_exams, p_flashcards, p_questions, p_time_seconds)
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET
        exams_completed = study_activity.exams_completed + EXCLUDED.exams_completed,
        flashcards_reviewed = study_activity.flashcards_reviewed + EXCLUDED.flashcards_reviewed,
        questions_answered = study_activity.questions_answered + EXCLUDED.questions_answered,
        time_spent_seconds = study_activity.time_spent_seconds + EXCLUDED.time_spent_seconds,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_activity_exists BOOLEAN;
BEGIN
    -- Check if studied today
    SELECT EXISTS(
        SELECT 1 FROM study_activity
        WHERE user_id = p_user_id
        AND activity_date = v_current_date
        AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
    ) INTO v_activity_exists;

    -- If not studied today, check yesterday
    IF NOT v_activity_exists THEN
        v_current_date := v_current_date - 1;
        SELECT EXISTS(
            SELECT 1 FROM study_activity
            WHERE user_id = p_user_id
            AND activity_date = v_current_date
            AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
        ) INTO v_activity_exists;

        IF NOT v_activity_exists THEN
            RETURN 0;
        END IF;
    END IF;

    -- Count consecutive days
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM study_activity
            WHERE user_id = p_user_id
            AND activity_date = v_current_date
            AND (exams_completed > 0 OR flashcards_reviewed > 0 OR questions_answered > 0)
        ) INTO v_activity_exists;

        EXIT WHEN NOT v_activity_exists;

        v_streak := v_streak + 1;
        v_current_date := v_current_date - 1;
    END LOOP;

    RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- QUESTION FLAGS TABLE
-- ============================================================================
-- Students can flag questions during exams for admin review

CREATE TABLE IF NOT EXISTS question_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL, -- 'incorrect_answer', 'unclear_stem', 'outdated_content', 'other'
    description TEXT,
    exam_attempt_id UUID REFERENCES exam_attempts(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, user_id, exam_attempt_id)
);

-- Indexes for question flags
CREATE INDEX IF NOT EXISTS idx_question_flags_question ON question_flags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_flags_status ON question_flags(status);
CREATE INDEX IF NOT EXISTS idx_question_flags_created ON question_flags(created_at DESC);

-- RLS policies for question_flags
ALTER TABLE question_flags ENABLE ROW LEVEL SECURITY;

-- Users can create flags
CREATE POLICY "Users can create question flags"
    ON question_flags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own flags
CREATE POLICY "Users can view own flags"
    ON question_flags FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view and update all flags
CREATE POLICY "Admins can manage all flags"
    ON question_flags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- ADD ROLE COLUMN TO PROFILES (if not exists)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role VARCHAR(20) DEFAULT 'student';
    END IF;
END $$;

-- Index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- HELPER FUNCTION: Validate access code during registration
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_access_code(p_code VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_code_record RECORD;
BEGIN
    SELECT * INTO v_code_record
    FROM access_codes
    WHERE code = p_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Código não encontrado');
    END IF;

    IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Código expirado');
    END IF;

    IF v_code_record.use_count >= v_code_record.max_uses THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Código já utilizado');
    END IF;

    RETURN jsonb_build_object('valid', true, 'code_id', v_code_record.id);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER FUNCTION: Use access code (call after successful registration)
-- ============================================================================

CREATE OR REPLACE FUNCTION use_access_code(p_code VARCHAR, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE access_codes
    SET
        use_count = use_count + 1,
        used_at = NOW(),
        used_by = p_user_id
    WHERE code = p_code
    AND (expires_at IS NULL OR expires_at > NOW())
    AND use_count < max_uses;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE access_codes IS 'Invitation codes for controlled student registration';
COMMENT ON TABLE study_activity IS 'Daily study activity tracking for streak calculation';
COMMENT ON TABLE question_flags IS 'Student-reported issues with questions';
COMMENT ON FUNCTION calculate_study_streak IS 'Calculate consecutive days of study activity';
COMMENT ON FUNCTION validate_access_code IS 'Check if an access code is valid for registration';
COMMENT ON FUNCTION use_access_code IS 'Mark an access code as used after registration';
