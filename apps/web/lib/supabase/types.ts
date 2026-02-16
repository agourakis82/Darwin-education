/**
 * Database Types
 *
 * This file should be regenerated using:
 * supabase gen types typescript --local > apps/web/lib/supabase/types.ts
 *
 * Comprehensive types covering all tables from schema.sql + migrations 001-015.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ============================================
      // BETA FEEDBACK
      // ============================================

      beta_feedback: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          category: 'bug' | 'feature' | 'usability' | 'content' | 'general'
          message: string
          page_url: string | null
          user_agent: string | null
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          category?: 'bug' | 'feature' | 'usability' | 'content' | 'general'
          message: string
          page_url?: string | null
          user_agent?: string | null
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string | null
          category?: 'bug' | 'feature' | 'usability' | 'content' | 'general'
          message?: string
          page_url?: string | null
          user_agent?: string | null
          rating?: number | null
          created_at?: string
        }
      }

      // ============================================
      // CORE TABLES (schema.sql)
      // ============================================

      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          xp: number
          level: number
          streak_days: number
          last_activity_at: string
          subscription_tier: 'free' | 'premium' | 'institutional'
          subscription_expires_at: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak_days?: number
          last_activity_at?: string
          subscription_tier?: 'free' | 'premium' | 'institutional'
          subscription_expires_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak_days?: number
          last_activity_at?: string
          subscription_tier?: 'free' | 'premium' | 'institutional'
          subscription_expires_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }

      question_banks: {
        Row: {
          id: string
          name: string
          description: string | null
          source: 'official_enamed' | 'residencia' | 'concurso' | 'ai_generated' | 'community'
          year_start: number | null
          year_end: number | null
          question_count: number
          areas: string[]
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          source: 'official_enamed' | 'residencia' | 'concurso' | 'ai_generated' | 'community'
          year_start?: number | null
          year_end?: number | null
          question_count?: number
          areas?: string[]
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          source?: 'official_enamed' | 'residencia' | 'concurso' | 'ai_generated' | 'community'
          year_start?: number | null
          year_end?: number | null
          question_count?: number
          areas?: string[]
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      questions: {
        Row: {
          id: string
          bank_id: string
          year: number | null
          stem: string
          options: Json
          correct_index: number
          explanation: string
          references: string[] | null
          irt_difficulty: number
          irt_discrimination: number
          irt_guessing: number
          irt_infit: number | null
          irt_outfit: number | null
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty: string | null
          topic: string | null
          difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          icd10_codes: string[]
          atc_codes: string[]
          is_ai_generated: boolean
          validated_by: 'community' | 'expert' | 'both' | null
          times_answered: number
          times_correct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bank_id: string
          year?: number | null
          stem: string
          options: Json
          correct_index: number
          explanation: string
          references?: string[] | null
          irt_difficulty: number
          irt_discrimination: number
          irt_guessing?: number
          irt_infit?: number | null
          irt_outfit?: number | null
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty?: string | null
          topic?: string | null
          difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          icd10_codes?: string[]
          atc_codes?: string[]
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          times_answered?: number
          times_correct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bank_id?: string
          year?: number | null
          stem?: string
          options?: Json
          correct_index?: number
          explanation?: string
          references?: string[] | null
          irt_difficulty?: number
          irt_discrimination?: number
          irt_guessing?: number
          irt_infit?: number | null
          irt_outfit?: number | null
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty?: string | null
          topic?: string | null
          difficulty?: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          icd10_codes?: string[]
          atc_codes?: string[]
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          times_answered?: number
          times_correct?: number
          created_at?: string
          updated_at?: string
        }
      }

      medical_diseases: {
        Row: {
          id: string
          title: string
          enamed_area:
            | 'clinica_medica'
            | 'cirurgia'
            | 'pediatria'
            | 'ginecologia_obstetricia'
            | 'saude_coletiva'
          categoria: string
          subcategoria: string | null
          cid10: string[]
          summary: string | null
          search_terms: string
          payload: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          enamed_area:
            | 'clinica_medica'
            | 'cirurgia'
            | 'pediatria'
            | 'ginecologia_obstetricia'
            | 'saude_coletiva'
          categoria: string
          subcategoria?: string | null
          cid10?: string[]
          summary?: string | null
          search_terms: string
          payload: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          enamed_area?:
            | 'clinica_medica'
            | 'cirurgia'
            | 'pediatria'
            | 'ginecologia_obstetricia'
            | 'saude_coletiva'
          categoria?: string
          subcategoria?: string | null
          cid10?: string[]
          summary?: string | null
          search_terms?: string
          payload?: Json
          created_at?: string
          updated_at?: string
        }
      }

      medical_medications: {
        Row: {
          id: string
          generic_name: string
          brand_names: string[]
          atc_code: string | null
          drug_class: string
          subclass: string | null
          summary: string | null
          search_terms: string
          payload: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          generic_name: string
          brand_names?: string[]
          atc_code?: string | null
          drug_class: string
          subclass?: string | null
          summary?: string | null
          search_terms: string
          payload: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          generic_name?: string
          brand_names?: string[]
          atc_code?: string | null
          drug_class?: string
          subclass?: string | null
          summary?: string | null
          search_terms?: string
          payload?: Json
          created_at?: string
          updated_at?: string
        }
      }

      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          question_count: number
          time_limit_minutes: number
          question_ids: string[]
          type: 'official_simulation' | 'custom' | 'practice' | 'review' | 'adaptive'
          created_by: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          question_count: number
          time_limit_minutes: number
          question_ids: string[]
          type: 'official_simulation' | 'custom' | 'practice' | 'review' | 'adaptive'
          created_by?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          question_count?: number
          time_limit_minutes?: number
          question_ids?: string[]
          type?: 'official_simulation' | 'custom' | 'practice' | 'review' | 'adaptive'
          created_by?: string | null
          is_public?: boolean
          created_at?: string
        }
      }

      exam_attempts: {
        Row: {
          id: string
          exam_id: string
          user_id: string
          answers: Json
          marked_for_review: string[]
          time_per_question: Json
          total_time_seconds: number
          started_at: string
          completed_at: string | null
          theta: number | null
          standard_error: number | null
          scaled_score: number | null
          passed: boolean | null
          correct_count: number | null
          area_breakdown: Json | null
          is_adaptive: boolean
          stopping_reason: string | null
          theta_trajectory: Json | null
          items_administered: string[] | null
        }
        Insert: {
          id?: string
          exam_id: string
          user_id: string
          answers?: Json
          marked_for_review?: string[]
          time_per_question?: Json
          total_time_seconds?: number
          started_at?: string
          completed_at?: string | null
          theta?: number | null
          standard_error?: number | null
          scaled_score?: number | null
          passed?: boolean | null
          correct_count?: number | null
          area_breakdown?: Json | null
          is_adaptive?: boolean
          stopping_reason?: string | null
          theta_trajectory?: Json | null
          items_administered?: string[] | null
        }
        Update: {
          id?: string
          exam_id?: string
          user_id?: string
          answers?: Json
          marked_for_review?: string[]
          time_per_question?: Json
          total_time_seconds?: number
          started_at?: string
          completed_at?: string | null
          theta?: number | null
          standard_error?: number | null
          scaled_score?: number | null
          passed?: boolean | null
          correct_count?: number | null
          area_breakdown?: Json | null
          is_adaptive?: boolean
          stopping_reason?: string | null
          theta_trajectory?: Json | null
          items_administered?: string[] | null
        }
      }

      flashcard_decks: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string | null
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public: boolean
          is_system: boolean
          card_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description?: string | null
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public?: boolean
          is_system?: boolean
          card_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string | null
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public?: boolean
          is_system?: boolean
          card_count?: number
          created_at?: string
          updated_at?: string
        }
      }

      flashcards: {
        Row: {
          id: string
          deck_id: string
          front: string
          back: string
          question_id: string | null
          tags: string[]
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          subspecialty: string | null
          topic: string | null
          ease_factor: number
          interval: number
          repetitions: number
          next_review: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          front: string
          back: string
          question_id?: string | null
          tags?: string[]
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          subspecialty?: string | null
          topic?: string | null
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          front?: string
          back?: string
          question_id?: string | null
          tags?: string[]
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          subspecialty?: string | null
          topic?: string | null
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          created_at?: string
          updated_at?: string
        }
      }

      flashcard_review_states: {
        Row: {
          id: string
          user_id: string
          card_id: string
          ease_factor: number
          interval_days: number
          repetitions: number
          next_review_at: string
          last_review_at: string | null
          last_quality: number | null
          fsrs_difficulty: number | null
          fsrs_stability: number | null
          fsrs_reps: number
          fsrs_lapses: number
          fsrs_state: 'new' | 'learning' | 'review' | 'relearning'
          algorithm: 'sm2' | 'fsrs'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          next_review_at?: string
          last_review_at?: string | null
          last_quality?: number | null
          fsrs_difficulty?: number | null
          fsrs_stability?: number | null
          fsrs_reps?: number
          fsrs_lapses?: number
          fsrs_state?: 'new' | 'learning' | 'review' | 'relearning'
          algorithm?: 'sm2' | 'fsrs'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          next_review_at?: string
          last_review_at?: string | null
          last_quality?: number | null
          fsrs_difficulty?: number | null
          fsrs_stability?: number | null
          fsrs_reps?: number
          fsrs_lapses?: number
          fsrs_state?: 'new' | 'learning' | 'review' | 'relearning'
          algorithm?: 'sm2' | 'fsrs'
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // STUDY PATHS & GAMIFICATION (schema.sql)
      // ============================================

      study_paths: {
        Row: {
          id: string
          title: string
          description: string | null
          areas: string[]
          estimated_hours: number | null
          difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil' | null
          prerequisites: string[]
          is_public: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          areas: string[]
          estimated_hours?: number | null
          difficulty?: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil' | null
          prerequisites?: string[]
          is_public?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          areas?: string[]
          estimated_hours?: number | null
          difficulty?: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil' | null
          prerequisites?: string[]
          is_public?: boolean
          created_by?: string | null
          created_at?: string
        }
      }

      study_modules: {
        Row: {
          id: string
          path_id: string | null
          title: string
          type: 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study'
          content: string | null
          estimated_minutes: number | null
          question_ids: string[]
          flashcard_ids: string[]
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          path_id?: string | null
          title: string
          type: 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study'
          content?: string | null
          estimated_minutes?: number | null
          question_ids?: string[]
          flashcard_ids?: string[]
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          path_id?: string | null
          title?: string
          type?: 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study'
          content?: string | null
          estimated_minutes?: number | null
          question_ids?: string[]
          flashcard_ids?: string[]
          order_index?: number
          created_at?: string
        }
      }

      user_path_progress: {
        Row: {
          id: string
          user_id: string
          path_id: string
          completed_modules: string[]
          current_module_id: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          path_id: string
          completed_modules?: string[]
          current_module_id?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          path_id?: string
          completed_modules?: string[]
          current_module_id?: string | null
          started_at?: string
          completed_at?: string | null
        }
      }

      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string | null
          xp_reward: number
          category: 'learning' | 'streak' | 'exam' | 'social' | 'milestone' | null
        }
        Insert: {
          id: string
          name: string
          description: string
          icon?: string | null
          xp_reward?: number
          category?: 'learning' | 'streak' | 'exam' | 'social' | 'milestone' | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string | null
          xp_reward?: number
          category?: 'learning' | 'streak' | 'exam' | 'social' | 'milestone' | null
        }
      }

      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }

      // ============================================
      // CIP — Clinical Integrative Puzzles (migration 001)
      // ============================================

      cip_findings: {
        Row: {
          id: string
          text_pt: string
          text_en: string | null
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          icd10_codes: string[]
          atc_codes: string[]
          tags: string[]
          is_ai_generated: boolean
          validated_by: 'community' | 'expert' | 'both' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          text_pt: string
          text_en?: string | null
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          icd10_codes?: string[]
          atc_codes?: string[]
          tags?: string[]
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          text_pt?: string
          text_en?: string | null
          section?: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          icd10_codes?: string[]
          atc_codes?: string[]
          tags?: string[]
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          created_at?: string
          updated_at?: string
        }
      }

      cip_diagnoses: {
        Row: {
          id: string
          name_pt: string
          name_en: string | null
          icd10_code: string
          icd10_codes_secondary: string[]
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty: string | null
          difficulty_tier: number
          keywords: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_pt: string
          name_en?: string | null
          icd10_code: string
          icd10_codes_secondary?: string[]
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty?: string | null
          difficulty_tier?: number
          keywords?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_pt?: string
          name_en?: string | null
          icd10_code?: string
          icd10_codes_secondary?: string[]
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva'
          subspecialty?: string | null
          difficulty_tier?: number
          keywords?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      cip_diagnosis_findings: {
        Row: {
          id: string
          diagnosis_id: string
          finding_id: string
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          priority: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          diagnosis_id: string
          finding_id: string
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          priority?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          diagnosis_id?: string
          finding_id?: string
          section?: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          priority?: number
          is_primary?: boolean
          created_at?: string
        }
      }

      cip_puzzles: {
        Row: {
          id: string
          title: string
          description: string | null
          difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          settings: Json
          diagnosis_ids: string[]
          areas: string[]
          options_per_section: Json
          irt_difficulty: number
          irt_discrimination: number
          irt_guessing: number
          time_limit_minutes: number
          type: 'practice' | 'exam' | 'custom'
          is_public: boolean
          is_ai_generated: boolean
          validated_by: 'community' | 'expert' | 'both' | null
          created_by: string | null
          times_attempted: number
          times_completed: number
          avg_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          settings?: Json
          diagnosis_ids: string[]
          areas: string[]
          options_per_section: Json
          irt_difficulty?: number
          irt_discrimination?: number
          irt_guessing?: number
          time_limit_minutes?: number
          type?: 'practice' | 'exam' | 'custom'
          is_public?: boolean
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          created_by?: string | null
          times_attempted?: number
          times_completed?: number
          avg_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          difficulty?: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
          settings?: Json
          diagnosis_ids?: string[]
          areas?: string[]
          options_per_section?: Json
          irt_difficulty?: number
          irt_discrimination?: number
          irt_guessing?: number
          time_limit_minutes?: number
          type?: 'practice' | 'exam' | 'custom'
          is_public?: boolean
          is_ai_generated?: boolean
          validated_by?: 'community' | 'expert' | 'both' | null
          created_by?: string | null
          times_attempted?: number
          times_completed?: number
          avg_score?: number | null
          created_at?: string
        }
      }

      cip_puzzle_grid: {
        Row: {
          id: string
          puzzle_id: string
          row_index: number
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          correct_finding_id: string
          irt_difficulty: number | null
        }
        Insert: {
          id?: string
          puzzle_id: string
          row_index: number
          section: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          correct_finding_id: string
          irt_difficulty?: number | null
        }
        Update: {
          id?: string
          puzzle_id?: string
          row_index?: number
          section?: 'medical_history' | 'physical_exam' | 'laboratory' | 'imaging' | 'pathology' | 'treatment'
          correct_finding_id?: string
          irt_difficulty?: number | null
        }
      }

      cip_attempts: {
        Row: {
          id: string
          puzzle_id: string
          user_id: string
          grid_state: Json
          time_per_cell: Json
          total_time_seconds: number | null
          theta: number | null
          standard_error: number | null
          scaled_score: number | null
          passed: boolean | null
          correct_count: number | null
          total_cells: number | null
          section_breakdown: Json | null
          diagnosis_breakdown: Json | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          puzzle_id: string
          user_id: string
          grid_state?: Json
          time_per_cell?: Json
          total_time_seconds?: number | null
          theta?: number | null
          standard_error?: number | null
          scaled_score?: number | null
          passed?: boolean | null
          correct_count?: number | null
          total_cells?: number | null
          section_breakdown?: Json | null
          diagnosis_breakdown?: Json | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          puzzle_id?: string
          user_id?: string
          grid_state?: Json
          time_per_cell?: Json
          total_time_seconds?: number | null
          theta?: number | null
          standard_error?: number | null
          scaled_score?: number | null
          passed?: boolean | null
          correct_count?: number | null
          total_cells?: number | null
          section_breakdown?: Json | null
          diagnosis_breakdown?: Json | null
          started_at?: string
          completed_at?: string | null
        }
      }

      cip_achievements: {
        Row: {
          id: string
          key: string
          title: string
          description: string
          icon: string
          category: 'mastery' | 'streak' | 'speed' | 'explorer' | 'special'
          requirement_type: string
          requirement_value: number
          xp_reward: number
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          title: string
          description: string
          icon: string
          category: 'mastery' | 'streak' | 'speed' | 'explorer' | 'special'
          requirement_type: string
          requirement_value: number
          xp_reward?: number
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          title?: string
          description?: string
          icon?: string
          category?: 'mastery' | 'streak' | 'speed' | 'explorer' | 'special'
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
      }

      user_cip_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: number
          unlocked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: number
          unlocked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: number
          unlocked_at?: string | null
          created_at?: string
        }
      }

      // ============================================
      // FSRS & CAT & IRT (migration 005)
      // ============================================

      user_fsrs_weights: {
        Row: {
          user_id: string
          weights: Json
          training_reviews: number
          last_optimized_at: string | null
          log_loss: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          weights: Json
          training_reviews?: number
          last_optimized_at?: string | null
          log_loss?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          weights?: Json
          training_reviews?: number
          last_optimized_at?: string | null
          log_loss?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      item_exposure_log: {
        Row: {
          id: string
          question_id: string | null
          administered_at: string
          user_theta: number | null
          exam_attempt_id: string | null
        }
        Insert: {
          id?: string
          question_id?: string | null
          administered_at?: string
          user_theta?: number | null
          exam_attempt_id?: string | null
        }
        Update: {
          id?: string
          question_id?: string | null
          administered_at?: string
          user_theta?: number | null
          exam_attempt_id?: string | null
        }
      }

      irt_response_log: {
        Row: {
          id: string
          question_id: string | null
          user_id: string | null
          correct: boolean
          user_theta: number | null
          response_time_ms: number | null
          exam_attempt_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id?: string | null
          user_id?: string | null
          correct: boolean
          user_theta?: number | null
          response_time_ms?: number | null
          exam_attempt_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string | null
          user_id?: string | null
          correct?: boolean
          user_theta?: number | null
          response_time_ms?: number | null
          exam_attempt_id?: string | null
          created_at?: string
        }
      }

      irt_calibration_batches: {
        Row: {
          id: string
          batch_name: string
          responses_count: number
          questions_calibrated: number
          model_type: '1PL' | '2PL' | '3PL' | '4PL'
          estimation_method: 'marginal_ml' | 'joint_ml' | 'bayesian' | 'warm_start'
          convergence_criterion: number | null
          iterations: number | null
          log_likelihood: number | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          batch_name: string
          responses_count: number
          questions_calibrated: number
          model_type?: '1PL' | '2PL' | '3PL' | '4PL'
          estimation_method?: 'marginal_ml' | 'joint_ml' | 'bayesian' | 'warm_start'
          convergence_criterion?: number | null
          iterations?: number | null
          log_likelihood?: number | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          batch_name?: string
          responses_count?: number
          questions_calibrated?: number
          model_type?: '1PL' | '2PL' | '3PL' | '4PL'
          estimation_method?: 'marginal_ml' | 'joint_ml' | 'bayesian' | 'warm_start'
          convergence_criterion?: number | null
          iterations?: number | null
          log_likelihood?: number | null
          started_at?: string
          completed_at?: string | null
        }
      }

      irt_parameter_history: {
        Row: {
          id: string
          question_id: string | null
          calibration_batch_id: string | null
          difficulty: number | null
          discrimination: number | null
          guessing: number | null
          infit: number | null
          outfit: number | null
          difficulty_delta: number | null
          discrimination_delta: number | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id?: string | null
          calibration_batch_id?: string | null
          difficulty?: number | null
          discrimination?: number | null
          guessing?: number | null
          infit?: number | null
          outfit?: number | null
          difficulty_delta?: number | null
          discrimination_delta?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string | null
          calibration_batch_id?: string | null
          difficulty?: number | null
          discrimination?: number | null
          guessing?: number | null
          infit?: number | null
          outfit?: number | null
          difficulty_delta?: number | null
          discrimination_delta?: number | null
          created_at?: string
        }
      }

      // ============================================
      // DDL — Diagnostico Diferencial de Lacunas (migration 008)
      // ============================================

      ddl_questions: {
        Row: {
          id: string
          question_code: string
          question_text: string
          discipline: string
          topic: string
          subtopic: string | null
          difficulty_level: number | null
          cognitive_level: string | null
          reference_answer: string
          key_concepts: Json
          required_integrations: Json
          irt_difficulty: number | null
          irt_discrimination: number | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          question_code: string
          question_text: string
          discipline: string
          topic: string
          subtopic?: string | null
          difficulty_level?: number | null
          cognitive_level?: string | null
          reference_answer: string
          key_concepts?: Json
          required_integrations?: Json
          irt_difficulty?: number | null
          irt_discrimination?: number | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          question_code?: string
          question_text?: string
          discipline?: string
          topic?: string
          subtopic?: string | null
          difficulty_level?: number | null
          cognitive_level?: string | null
          reference_answer?: string
          key_concepts?: Json
          required_integrations?: Json
          irt_difficulty?: number | null
          irt_discrimination?: number | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }

      ddl_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          session_id: string
          response_text: string
          behavioral_data: Json
          created_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          session_id: string
          response_text: string
          behavioral_data?: Json
          created_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          session_id?: string
          response_text?: string
          behavioral_data?: Json
          created_at?: string
          submitted_at?: string | null
        }
      }

      ddl_semantic_analysis: {
        Row: {
          id: string
          response_id: string
          semantic_similarity_score: number | null
          concept_coverage: Json
          integration_score: number | null
          detected_integrations: Json
          linguistic_markers: Json
          semantic_entropy: number | null
          llm_raw_response: Json | null
          llm_model_version: string | null
          analyzed_at: string
        }
        Insert: {
          id?: string
          response_id: string
          semantic_similarity_score?: number | null
          concept_coverage?: Json
          integration_score?: number | null
          detected_integrations?: Json
          linguistic_markers?: Json
          semantic_entropy?: number | null
          llm_raw_response?: Json | null
          llm_model_version?: string | null
          analyzed_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          semantic_similarity_score?: number | null
          concept_coverage?: Json
          integration_score?: number | null
          detected_integrations?: Json
          linguistic_markers?: Json
          semantic_entropy?: number | null
          llm_raw_response?: Json | null
          llm_model_version?: string | null
          analyzed_at?: string
        }
      }

      ddl_behavioral_analysis: {
        Row: {
          id: string
          response_id: string
          response_time_ms: number
          time_per_word_ms: number | null
          time_to_first_keystroke_ms: number | null
          hesitation_pattern: Json
          revision_pattern: Json
          anxiety_indicators: Json
          deviation_from_baseline: Json | null
          analyzed_at: string
        }
        Insert: {
          id?: string
          response_id: string
          response_time_ms: number
          time_per_word_ms?: number | null
          time_to_first_keystroke_ms?: number | null
          hesitation_pattern?: Json
          revision_pattern?: Json
          anxiety_indicators?: Json
          deviation_from_baseline?: Json | null
          analyzed_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          response_time_ms?: number
          time_per_word_ms?: number | null
          time_to_first_keystroke_ms?: number | null
          hesitation_pattern?: Json
          revision_pattern?: Json
          anxiety_indicators?: Json
          deviation_from_baseline?: Json | null
          analyzed_at?: string
        }
      }

      ddl_classification: {
        Row: {
          id: string
          response_id: string
          semantic_analysis_id: string | null
          behavioral_analysis_id: string | null
          primary_lacuna_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          primary_confidence: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          primary_probability: number
          secondary_lacuna_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          secondary_probability: number | null
          probabilities: Json
          supporting_evidence: Json
          classifier_version: string
          classification_method: string
          human_validated: boolean
          human_classification: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          validator_id: string | null
          validated_at: string | null
          validation_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          semantic_analysis_id?: string | null
          behavioral_analysis_id?: string | null
          primary_lacuna_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          primary_confidence: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          primary_probability: number
          secondary_lacuna_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          secondary_probability?: number | null
          probabilities: Json
          supporting_evidence?: Json
          classifier_version: string
          classification_method?: string
          human_validated?: boolean
          human_classification?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          validator_id?: string | null
          validated_at?: string | null
          validation_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          semantic_analysis_id?: string | null
          behavioral_analysis_id?: string | null
          primary_lacuna_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          primary_confidence?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          primary_probability?: number
          secondary_lacuna_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          secondary_probability?: number | null
          probabilities?: Json
          supporting_evidence?: Json
          classifier_version?: string
          classification_method?: string
          human_validated?: boolean
          human_classification?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          validator_id?: string | null
          validated_at?: string | null
          validation_notes?: string | null
          created_at?: string
        }
      }

      ddl_feedback: {
        Row: {
          id: string
          classification_id: string
          user_id: string
          feedback_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          feedback_content: Json
          delivered_at: string | null
          viewed_at: string | null
          user_rating: number | null
          user_feedback_helpful: boolean | null
          user_comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          classification_id: string
          user_id: string
          feedback_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          feedback_content: Json
          delivered_at?: string | null
          viewed_at?: string | null
          user_rating?: number | null
          user_feedback_helpful?: boolean | null
          user_comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          classification_id?: string
          user_id?: string
          feedback_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
          feedback_content?: Json
          delivered_at?: string | null
          viewed_at?: string | null
          user_rating?: number | null
          user_feedback_helpful?: boolean | null
          user_comments?: string | null
          created_at?: string
        }
      }

      ddl_user_baseline: {
        Row: {
          id: string
          user_id: string
          total_responses: number
          avg_response_time_ms: number | null
          std_response_time_ms: number | null
          avg_time_per_word_ms: number | null
          std_time_per_word_ms: number | null
          avg_hesitation_index: number | null
          std_hesitation_index: number | null
          avg_pause_ratio: number | null
          std_pause_ratio: number | null
          avg_revision_ratio: number | null
          std_revision_ratio: number | null
          avg_semantic_similarity: number | null
          avg_concept_coverage: number | null
          avg_hedging_index: number | null
          calculated_from_responses: number
          last_calculated_at: string | null
          baseline_by_difficulty: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_responses?: number
          avg_response_time_ms?: number | null
          std_response_time_ms?: number | null
          avg_time_per_word_ms?: number | null
          std_time_per_word_ms?: number | null
          avg_hesitation_index?: number | null
          std_hesitation_index?: number | null
          avg_pause_ratio?: number | null
          std_pause_ratio?: number | null
          avg_revision_ratio?: number | null
          std_revision_ratio?: number | null
          avg_semantic_similarity?: number | null
          avg_concept_coverage?: number | null
          avg_hedging_index?: number | null
          calculated_from_responses?: number
          last_calculated_at?: string | null
          baseline_by_difficulty?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_responses?: number
          avg_response_time_ms?: number | null
          std_response_time_ms?: number | null
          avg_time_per_word_ms?: number | null
          std_time_per_word_ms?: number | null
          avg_hesitation_index?: number | null
          std_hesitation_index?: number | null
          avg_pause_ratio?: number | null
          std_pause_ratio?: number | null
          avg_revision_ratio?: number | null
          std_revision_ratio?: number | null
          avg_semantic_similarity?: number | null
          avg_concept_coverage?: number | null
          avg_hedging_index?: number | null
          calculated_from_responses?: number
          last_calculated_at?: string | null
          baseline_by_difficulty?: Json
          created_at?: string
          updated_at?: string
        }
      }

      ddl_batch_jobs: {
        Row: {
          id: string
          batch_name: string | null
          created_by: string | null
          source_type: string
          source_id: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          total_items: number
          processed_items: number
          failed_items: number
          xai_batch_id: string | null
          xai_batch_status: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          retry_count: number
        }
        Insert: {
          id?: string
          batch_name?: string | null
          created_by?: string | null
          source_type?: string
          source_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_items?: number
          processed_items?: number
          failed_items?: number
          xai_batch_id?: string | null
          xai_batch_status?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          retry_count?: number
        }
        Update: {
          id?: string
          batch_name?: string | null
          created_by?: string | null
          source_type?: string
          source_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_items?: number
          processed_items?: number
          failed_items?: number
          xai_batch_id?: string | null
          xai_batch_status?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          retry_count?: number
        }
      }

      ddl_batch_items: {
        Row: {
          id: string
          batch_job_id: string
          response_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          classification_id: string | null
          feedback_id: string | null
          created_at: string
          processed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          batch_job_id: string
          response_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          classification_id?: string | null
          feedback_id?: string | null
          created_at?: string
          processed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          batch_job_id?: string
          response_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          classification_id?: string | null
          feedback_id?: string | null
          created_at?: string
          processed_at?: string | null
          error_message?: string | null
        }
      }

      exam_ddl_responses: {
        Row: {
          id: string
          exam_attempt_id: string
          ddl_response_id: string
          ddl_question_id: string
          question_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_attempt_id: string
          ddl_response_id: string
          ddl_question_id: string
          question_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_attempt_id?: string
          ddl_response_id?: string
          ddl_question_id?: string
          question_order?: number | null
          created_at?: string
        }
      }

      exam_ddl_summary: {
        Row: {
          id: string
          exam_attempt_id: string
          user_id: string
          batch_job_id: string | null
          total_ddl_questions: number
          analyzed_count: number
          le_count: number
          lem_count: number
          lie_count: number
          none_count: number
          avg_concept_coverage: number | null
          avg_integration_score: number | null
          avg_anxiety_score: number | null
          dominant_lacuna_type: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          overall_recommendation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_attempt_id: string
          user_id: string
          batch_job_id?: string | null
          total_ddl_questions?: number
          analyzed_count?: number
          le_count?: number
          lem_count?: number
          lie_count?: number
          none_count?: number
          avg_concept_coverage?: number | null
          avg_integration_score?: number | null
          avg_anxiety_score?: number | null
          dominant_lacuna_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          overall_recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_attempt_id?: string
          user_id?: string
          batch_job_id?: string | null
          total_ddl_questions?: number
          analyzed_count?: number
          le_count?: number
          lem_count?: number
          lie_count?: number
          none_count?: number
          avg_concept_coverage?: number | null
          avg_integration_score?: number | null
          avg_anxiety_score?: number | null
          dominant_lacuna_type?: 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE' | null
          overall_recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================
      // FCR — Fractal Clinical Reasoning (migration 011)
      // ============================================

      fcr_cases: {
        Row: {
          id: string
          title_pt: string
          clinical_presentation_pt: string
          area: string
          difficulty: string
          dados_options: Json
          padrao_options: Json
          hipotese_options: Json
          conduta_options: Json
          correct_dados: string[]
          correct_padrao: string
          correct_hipotese: string
          correct_conduta: string
          structured_explanation: Json | null
          irt_difficulty: number
          irt_discrimination: number
          irt_guessing: number
          is_public: boolean
          is_ai_generated: boolean
          times_attempted: number
          times_completed: number
          avg_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_pt: string
          clinical_presentation_pt: string
          area: string
          difficulty: string
          dados_options: Json
          padrao_options: Json
          hipotese_options: Json
          conduta_options: Json
          correct_dados: string[]
          correct_padrao: string
          correct_hipotese: string
          correct_conduta: string
          structured_explanation?: Json | null
          irt_difficulty?: number
          irt_discrimination?: number
          irt_guessing?: number
          is_public?: boolean
          is_ai_generated?: boolean
          times_attempted?: number
          times_completed?: number
          avg_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_pt?: string
          clinical_presentation_pt?: string
          area?: string
          difficulty?: string
          dados_options?: Json
          padrao_options?: Json
          hipotese_options?: Json
          conduta_options?: Json
          correct_dados?: string[]
          correct_padrao?: string
          correct_hipotese?: string
          correct_conduta?: string
          structured_explanation?: Json | null
          irt_difficulty?: number
          irt_discrimination?: number
          irt_guessing?: number
          is_public?: boolean
          is_ai_generated?: boolean
          times_attempted?: number
          times_completed?: number
          avg_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      fcr_attempts: {
        Row: {
          id: string
          case_id: string | null
          user_id: string | null
          selected_dados: string[] | null
          selected_padrao: string | null
          selected_hipotese: string | null
          selected_conduta: string | null
          confidence_dados: number | null
          confidence_padrao: number | null
          confidence_hipotese: number | null
          confidence_conduta: number | null
          level_results: Json | null
          theta: number | null
          scaled_score: number | null
          calibration_score: number | null
          overconfidence_index: number | null
          detected_lacunas: Json | null
          step_times: Json | null
          total_time_seconds: number | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          user_id?: string | null
          selected_dados?: string[] | null
          selected_padrao?: string | null
          selected_hipotese?: string | null
          selected_conduta?: string | null
          confidence_dados?: number | null
          confidence_padrao?: number | null
          confidence_hipotese?: number | null
          confidence_conduta?: number | null
          level_results?: Json | null
          theta?: number | null
          scaled_score?: number | null
          calibration_score?: number | null
          overconfidence_index?: number | null
          detected_lacunas?: Json | null
          step_times?: Json | null
          total_time_seconds?: number | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string | null
          user_id?: string | null
          selected_dados?: string[] | null
          selected_padrao?: string | null
          selected_hipotese?: string | null
          selected_conduta?: string | null
          confidence_dados?: number | null
          confidence_padrao?: number | null
          confidence_hipotese?: number | null
          confidence_conduta?: number | null
          level_results?: Json | null
          theta?: number | null
          scaled_score?: number | null
          calibration_score?: number | null
          overconfidence_index?: number | null
          detected_lacunas?: Json | null
          step_times?: Json | null
          total_time_seconds?: number | null
          started_at?: string
          completed_at?: string | null
        }
      }

      fcr_calibration_history: {
        Row: {
          id: string
          user_id: string
          area: string
          calibration_score: number | null
          overconfidence_index: number | null
          illusion_count: number
          total_levels: number
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area: string
          calibration_score?: number | null
          overconfidence_index?: number | null
          illusion_count?: number
          total_levels?: number
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area?: string
          calibration_score?: number | null
          overconfidence_index?: number | null
          illusion_count?: number
          total_levels?: number
          recorded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
