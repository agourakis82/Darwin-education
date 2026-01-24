/**
 * Database Types
 *
 * This file should be regenerated using:
 * supabase gen types typescript --local > apps/web/lib/supabase/types.ts
 *
 * For now, we define the core types based on our schema.
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
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          question_count: number
          time_limit_minutes: number
          question_ids: string[]
          type: 'official_simulation' | 'custom' | 'practice' | 'review'
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
          type: 'official_simulation' | 'custom' | 'practice' | 'review'
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
          type?: 'official_simulation' | 'custom' | 'practice' | 'review'
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
        }
      }
      flashcard_decks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public: boolean
          card_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public?: boolean
          card_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          area?: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | null
          is_public?: boolean
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
      flashcard_sm2_states: {
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
          created_at?: string
          updated_at?: string
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
