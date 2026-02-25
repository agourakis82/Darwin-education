const fs = require('fs');

let content = fs.readFileSync('apps/web/lib/supabase/types.ts', 'utf8');

// New EREM tables to add
const newTables = `
      // ============================================
      // EREM - EPISTEMIC RISK ENGINE
      // ============================================
      cat_sessions: {
        Row: {
          id: string
          student_id: string
          exam_id: string | null
          current_theta: number
          current_se: number
          status: 'active' | 'completed' | 'abandoned'
          started_at: string
          completed_at: string | null
          theta_history: { itemNum: number; theta: number; se: number }[]
          metadata: Json | null
          attempt_id?: string | null
        }
        Insert: {
          id?: string
          student_id: string
          exam_id?: string | null
          current_theta?: number
          current_se?: number
          status?: 'active' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          theta_history?: { itemNum: number; theta: number; se: number }[]
          metadata?: Json | null
          attempt_id?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          exam_id?: string | null
          current_theta?: number
          current_se?: number
          status?: 'active' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          theta_history?: { itemNum: number; theta: number; se: number }[]
          metadata?: Json | null
          attempt_id?: string | null
        }
      }
      cat_telemetry: {
        Row: {
          id: string
          session_id: string
          question_id: string
          time_spent_ms: number
          is_correct: boolean
          mouse_movements: Json | null
          created_at: string
          attempt_id?: string | null
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          time_spent_ms: number
          is_correct: boolean
          mouse_movements?: Json | null
          created_at?: string
          attempt_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          time_spent_ms?: number
          is_correct?: boolean
          mouse_movements?: Json | null
          created_at?: string
          attempt_id?: string | null
        }
      }
      student_risk_snapshots: {
        Row: {
          id: string
          student_id: string
          composite_risk: number
          epistemic_confidence: number
          risk_components: Json
          calculated_at: string
          model_version: string
        }
        Insert: {
          id?: string
          student_id: string
          composite_risk: number
          epistemic_confidence: number
          risk_components: Json
          calculated_at?: string
          model_version?: string
        }
        Update: {
          id?: string
          student_id?: string
          composite_risk?: number
          epistemic_confidence?: number
          risk_components?: Json
          calculated_at?: string
          model_version?: string
        }
      }
      erem_shap_values: {
        Row: {
          id: string
          snapshot_id: string
          feature_name: string
          shap_value: number
          feature_value: number | null
          calculated_at: string
        }
        Insert: {
          id?: string
          snapshot_id: string
          feature_name: string
          shap_value: number
          feature_value?: number | null
          calculated_at?: string
        }
        Update: {
          id?: string
          snapshot_id?: string
          feature_name?: string
          shap_value?: number
          feature_value?: number | null
          calculated_at?: string
        }
      }
      intervention_cases: {
        Row: {
          id: string
          student_id: string
          baseline_snapshot_id: string
          intervention_type: string
          delivered_at: string
          success_score: number | null
          follow_up_snapshot_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          student_id: string
          baseline_snapshot_id: string
          intervention_type: string
          delivered_at?: string
          success_score?: number | null
          follow_up_snapshot_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          student_id?: string
          baseline_snapshot_id?: string
          intervention_type?: string
          delivered_at?: string
          success_score?: number | null
          follow_up_snapshot_id?: string | null
          metadata?: Json | null
        }
      }
      intervention_recommendations: {
        Row: {
          id: string
          student_id: string
          snapshot_id: string
          recommended_type: string
          confidence_score: number
          expected_improvement: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          snapshot_id: string
          recommended_type: string
          confidence_score: number
          expected_improvement: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          snapshot_id?: string
          recommended_type?: string
          confidence_score?: number
          expected_improvement?: number
          status?: string
          created_at?: string
        }
      }
      risk_alerts: {
        Row: {
          id: string
          student_id: string
          snapshot_id: string
          alert_level: 'critical' | 'high' | 'medium' | 'low'
          status: 'active' | 'acknowledged' | 'resolved'
          triggered_at: string
          acknowledged_by: string | null
          acknowledged_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          snapshot_id: string
          alert_level: 'critical' | 'high' | 'medium' | 'low'
          status?: 'active' | 'acknowledged' | 'resolved'
          triggered_at?: string
          acknowledged_by?: string | null
          acknowledged_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          snapshot_id?: string
          alert_level?: 'critical' | 'high' | 'medium' | 'low'
          status?: 'active' | 'acknowledged' | 'resolved'
          triggered_at?: string
          acknowledged_by?: string | null
          acknowledged_at?: string | null
        }
      }
`;

// Find the end of Tables object - it's the line with just "    }" before "Views: {"
// We'll insert before that line

const tablesEndMarker = '    }';
const viewsStartMarker = '    Views: {';
const insertPos = content.indexOf(viewsStartMarker);

if (insertPos === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

content = content.slice(0, insertPos) + newTables + '\n' + content.slice(insertPos);

// Add idempotency_key to exams table (Row, Insert, Update)
const examsRowMarker = '        Row: {\n          id: string\n          title: string';
const examsInsertMarker = '        Insert: {\n          id?: string\n          title: string';
const examsUpdateMarker = '        Update: {\n          id?: string\n          title?: string';

const idempotencyKeyRow = '        Row: {\n          id: string\n          title: string\n          idempotency_key: string | null';
const idempotencyKeyInsert = '        Insert: {\n          id?: string\n          title: string\n          idempotency_key?: string | null';
const idempotencyKeyUpdate = '        Update: {\n          id?: string\n          title?: string\n          idempotency_key?: string | null';

content = content.replace(examsRowMarker, idempotencyKeyRow);
content = content.replace(examsInsertMarker, idempotencyKeyInsert);
content = content.replace(examsUpdateMarker, idempotencyKeyUpdate);

// Add subscription_tier to profiles table
const profilesRowMarker = '        Row: {\n          id: string\n          user_id: string\n          full_name: string | null\n          email: string | null';
const profilesInsertMarker = '        Insert: {\n          id?: string\n          user_id: string\n          full_name?: string | null\n          email?: string | null';
const profilesUpdateMarker = '        Update: {\n          id?: string\n          user_id?: string\n          full_name?: string | null\n          email?: string | null';

const subscriptionTierRow = '        Row: {\n          id: string\n          user_id: string\n          full_name: string | null\n          email: string | null\n          subscription_tier: string | null';
const subscriptionTierInsert = '        Insert: {\n          id?: string\n          user_id: string\n          full_name?: string | null\n          email?: string | null\n          subscription_tier?: string | null';
const subscriptionTierUpdate = '        Update: {\n          id?: string\n          user_id?: string\n          full_name?: string | null\n          email?: string | null\n          subscription_tier?: string | null';

content = content.replace(profilesRowMarker, subscriptionTierRow);
content = content.replace(profilesInsertMarker, subscriptionTierInsert);
content = content.replace(profilesUpdateMarker, subscriptionTierUpdate);

fs.writeFileSync('apps/web/lib/supabase/types.ts', content);
console.log('Patched types.ts successfully');
