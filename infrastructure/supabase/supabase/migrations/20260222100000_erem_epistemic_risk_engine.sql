-- ============================================================
-- EREM: Epistemic Risk Engine for Medical Education
-- Tables for risk snapshots, SHAP values, and intervention tracking
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STUDENT RISK SNAPSHOTS
-- Daily risk assessments with dimensional breakdowns
-- ============================================================

CREATE TABLE IF NOT EXISTS student_risk_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Risk values [0, 1]
    composite_risk REAL NOT NULL CHECK (composite_risk >= 0 AND composite_risk <= 1),
    clinical_reasoning_risk REAL NOT NULL CHECK (clinical_reasoning_risk >= 0 AND clinical_reasoning_risk <= 1),
    engagement_risk REAL NOT NULL CHECK (engagement_risk >= 0 AND engagement_risk <= 1),
    wellbeing_risk REAL NOT NULL CHECK (wellbeing_risk >= 0 AND wellbeing_risk <= 1),
    academic_risk REAL NOT NULL CHECK (academic_risk >= 0 AND academic_risk <= 1),
    
    -- Confidence and bounds
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    lower_bound REAL CHECK (lower_bound >= 0 AND lower_bound <= 1),
    upper_bound REAL CHECK (upper_bound >= 0 AND upper_bound <= 1),
    
    -- Trajectory
    trajectory TEXT CHECK (trajectory IN ('improving', 'stable', 'declining', 'volatile')),
    trajectory_confidence REAL CHECK (trajectory_confidence >= 0 AND trajectory_confidence <= 1),
    
    -- Forecast
    forecast_30day_risk REAL CHECK (forecast_30day_risk >= 0 AND forecast_30day_risk <= 1),
    forecast_lower_bound REAL CHECK (forecast_lower_bound >= 0 AND forecast_lower_bound <= 1),
    forecast_upper_bound REAL CHECK (forecast_upper_bound >= 0 AND forecast_upper_bound <= 1),
    forecast_confidence REAL CHECK (forecast_confidence >= 0 AND forecast_confidence <= 1),
    
    -- Metadata
    data_quality TEXT CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),
    days_of_data INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_bounds CHECK (lower_bound IS NULL OR upper_bound IS NULL OR lower_bound <= upper_bound)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_risk_snapshots_student ON student_risk_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_snapshots_created ON student_risk_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_snapshots_composite ON student_risk_snapshots(composite_risk DESC);

-- Partitioning hint for large-scale deployments (optional)
-- CREATE INDEX IF NOT EXISTS idx_risk_snapshots_student_date ON student_risk_snapshots(student_id, created_at DESC);

-- ============================================================
-- EREM SHAP VALUES
-- Feature importance and explainability data
-- ============================================================

CREATE TABLE IF NOT EXISTS erem_shap_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES student_risk_snapshots(id) ON DELETE CASCADE,
    
    -- Feature and SHAP value
    feature_name TEXT NOT NULL,
    shap_value REAL NOT NULL,
    
    -- Context
    base_value REAL NOT NULL,
    predicted_risk REAL NOT NULL CHECK (predicted_risk >= 0 AND predicted_risk <= 1),
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shap_values_student ON erem_shap_values(student_id);
CREATE INDEX IF NOT EXISTS idx_shap_values_feature ON erem_shap_values(feature_name);
CREATE INDEX IF NOT EXISTS idx_shap_values_created ON erem_shap_values(created_at DESC);

-- ============================================================
-- INTERVENTION RECOMMENDATIONS
-- Recommended interventions for at-risk students
-- ============================================================

CREATE TYPE intervention_type AS ENUM (
    'peer_tutoring',
    'study_skills_coaching',
    'counseling_support',
    'curriculum_adjustment',
    'remedial_content',
    'practice_intensification',
    'wellbeing_check',
    'faculty_consultation'
);

CREATE TYPE intervention_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE intervention_status AS ENUM ('suggested', 'in_progress', 'completed', 'cancelled');
CREATE TYPE intervention_outcome AS ENUM ('success', 'partial', 'no_effect', 'negative');

CREATE TABLE IF NOT EXISTS intervention_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Intervention details
    intervention_type intervention_type NOT NULL,
    priority intervention_priority NOT NULL DEFAULT 'medium',
    status intervention_status NOT NULL DEFAULT 'suggested',
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    rationale TEXT,
    
    -- Expected outcomes
    expected_impact REAL CHECK (expected_impact >= 0 AND expected_impact <= 1),
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Case-based reasoning
    based_on_cases UUID[] DEFAULT '{}',
    
    -- Actual outcome (when completed)
    outcome intervention_outcome,
    actual_improvement REAL CHECK (actual_improvement >= -1 AND actual_improvement <= 1),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interventions_student ON intervention_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON intervention_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_interventions_priority ON intervention_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_interventions_created ON intervention_recommendations(created_at DESC);

-- ============================================================
-- INTERVENTION CASES
-- Historical cases for case-based reasoning
-- ============================================================

CREATE TABLE IF NOT EXISTS intervention_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Risk profile at time of intervention
    risk_profile_snapshot JSONB NOT NULL,
    
    -- Intervention
    intervention_type intervention_type NOT NULL,
    
    -- Outcome
    outcome intervention_outcome NOT NULL,
    improvement_delta REAL NOT NULL CHECK (improvement_delta >= -1 AND improvement_delta <= 1),
    time_to_improvement INTEGER DEFAULT 0, -- days
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intervention_cases_type ON intervention_cases(intervention_type);
CREATE INDEX IF NOT EXISTS idx_intervention_cases_outcome ON intervention_cases(outcome);
CREATE INDEX IF NOT EXISTS idx_intervention_cases_created ON intervention_cases(created_at DESC);

-- ============================================================
-- RISK ALERTS
-- Alerts for high-risk students requiring attention
-- ============================================================

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES student_risk_snapshots(id) ON DELETE SET NULL,
    
    -- Alert details
    severity alert_severity NOT NULL DEFAULT 'warning',
    status alert_status NOT NULL DEFAULT 'active',
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Trigger conditions
    trigger_type TEXT NOT NULL, -- e.g., 'threshold_exceeded', 'trajectory_change', 'anomaly'
    trigger_value REAL,
    threshold_value REAL,
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Resolution
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student ON risk_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_created ON risk_alerts(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE student_risk_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE erem_shap_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

-- Students can view their own data
CREATE POLICY "Students can view own risk snapshots"
    ON student_risk_snapshots FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can view own SHAP values"
    ON erem_shap_values FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can view own interventions"
    ON intervention_recommendations FOR SELECT
    USING (auth.uid() = student_id);

-- Faculty (institutional tier) can view all
CREATE POLICY "Faculty can view all risk snapshots"
    ON student_risk_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.subscription_tier = 'institutional'
        )
    );

CREATE POLICY "Faculty can view all SHAP values"
    ON erem_shap_values FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.subscription_tier = 'institutional'
        )
    );

CREATE POLICY "Faculty can manage interventions"
    ON intervention_recommendations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.subscription_tier = 'institutional'
        )
    );

CREATE POLICY "Faculty can manage alerts"
    ON risk_alerts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.subscription_tier = 'institutional'
        )
    );

-- Service role can do everything (for background jobs)
CREATE POLICY "Service role full access on risk snapshots"
    ON student_risk_snapshots FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on SHAP values"
    ON erem_shap_values FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on interventions"
    ON intervention_recommendations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on intervention cases"
    ON intervention_cases FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on alerts"
    ON risk_alerts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to auto-generate alerts for high-risk students
CREATE OR REPLACE FUNCTION generate_risk_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate alert for critical risk
    IF NEW.composite_risk >= 0.8 THEN
        INSERT INTO risk_alerts (student_id, snapshot_id, severity, title, message, trigger_type, trigger_value, threshold_value)
        VALUES (
            NEW.student_id,
            NEW.id,
            'critical',
            'Estudante em Risco Crítico',
            'O estudante apresenta risco composto de ' || ROUND(NEW.composite_risk * 100) || '%, exigindo atenção imediata.',
            'threshold_exceeded',
            NEW.composite_risk,
            0.8
        );
    ELSIF NEW.composite_risk >= 0.6 THEN
        INSERT INTO risk_alerts (student_id, snapshot_id, severity, title, message, trigger_type, trigger_value, threshold_value)
        VALUES (
            NEW.student_id,
            NEW.id,
            'warning',
            'Estudante em Alto Risco',
            'O estudante apresenta risco composto de ' || ROUND(NEW.composite_risk * 100) || '%.',
            'threshold_exceeded',
            NEW.composite_risk,
            0.6
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-alerts
DROP TRIGGER IF EXISTS trigger_generate_risk_alert ON student_risk_snapshots;
CREATE TRIGGER trigger_generate_risk_alert
    AFTER INSERT ON student_risk_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION generate_risk_alert();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View for current student risk status
CREATE OR REPLACE VIEW current_student_risk AS
SELECT DISTINCT ON (s.student_id)
    s.student_id,
    p.full_name,
    p.email,
    s.composite_risk,
    s.clinical_reasoning_risk,
    s.engagement_risk,
    s.wellbeing_risk,
    s.academic_risk,
    s.trajectory,
    s.confidence,
    s.data_quality,
    s.created_at as last_assessment
FROM student_risk_snapshots s
JOIN profiles p ON p.id = s.student_id
ORDER BY s.student_id, s.created_at DESC;

-- View for cohort-level feature importance
CREATE OR REPLACE VIEW cohort_feature_importance AS
SELECT
    feature_name,
    AVG(ABS(shap_value)) as mean_abs_shap,
    AVG(shap_value) as mean_shap,
    STDDEV(shap_value) as std_shap,
    COUNT(*) as sample_count
FROM erem_shap_values
GROUP BY feature_name
ORDER BY mean_abs_shap DESC;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON current_student_risk TO authenticated;
GRANT SELECT ON cohort_feature_importance TO authenticated;
