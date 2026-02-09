export { createClient } from './client'
export { createServerClient } from './server'
export type { Database } from './types'
export type { Json } from './types'

// Utility types for table rows
import type { Database } from './types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience type aliases — Core
export type Profile = Tables<'profiles'>
export type QuestionBank = Tables<'question_banks'>
export type Question = Tables<'questions'>
export type Exam = Tables<'exams'>
export type ExamAttempt = Tables<'exam_attempts'>
export type FlashcardDeck = Tables<'flashcard_decks'>
export type Flashcard = Tables<'flashcards'>
export type FlashcardReviewState = Tables<'flashcard_review_states'>

// Study paths & modules
export type StudyPath = Tables<'study_paths'>
export type StudyModule = Tables<'study_modules'>
export type UserPathProgress = Tables<'user_path_progress'>
export type Achievement = Tables<'achievements'>
export type UserAchievement = Tables<'user_achievements'>

// FCR (Fractal Clinical Reasoning)
export type FCRCaseRow = Tables<'fcr_cases'>
export type FCRAttemptRow = Tables<'fcr_attempts'>
export type FCRCalibrationHistory = Tables<'fcr_calibration_history'>

// DDL (Diagnóstico Diferencial de Lacunas)
export type DDLQuestion = Tables<'ddl_questions'>
export type DDLResponse = Tables<'ddl_responses'>
export type DDLSemanticAnalysis = Tables<'ddl_semantic_analysis'>
export type DDLBehavioralAnalysis = Tables<'ddl_behavioral_analysis'>
export type DDLClassification = Tables<'ddl_classification'>
export type DDLFeedback = Tables<'ddl_feedback'>
export type DDLUserBaseline = Tables<'ddl_user_baseline'>

// CIP (Clinical Integrative Puzzles)
export type CIPFinding = Tables<'cip_findings'>
export type CIPDiagnosis = Tables<'cip_diagnoses'>
export type CIPPuzzle = Tables<'cip_puzzles'>
export type CIPAttempt = Tables<'cip_attempts'>
export type CIPAchievement = Tables<'cip_achievements'>

// FSRS / CAT / IRT
export type UserFSRSWeights = Tables<'user_fsrs_weights'>
export type ItemExposureLog = Tables<'item_exposure_log'>
export type IRTResponseLog = Tables<'irt_response_log'>
export type IRTCalibrationBatch = Tables<'irt_calibration_batches'>
export type IRTParameterHistory = Tables<'irt_parameter_history'>
