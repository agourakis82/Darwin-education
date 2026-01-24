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

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type QuestionBank = Tables<'question_banks'>
export type Question = Tables<'questions'>
export type Exam = Tables<'exams'>
export type ExamAttempt = Tables<'exam_attempts'>
export type FlashcardDeck = Tables<'flashcard_decks'>
export type Flashcard = Tables<'flashcards'>
export type FlashcardSM2State = Tables<'flashcard_sm2_states'>
