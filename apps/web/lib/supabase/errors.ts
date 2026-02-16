import type { PostgrestError } from '@supabase/supabase-js'

const MISSING_TABLE_CODE = '42P01'
const MISSING_TABLE_SCHEMA_CACHE_CODE = 'PGRST205'
const MISSING_COLUMN_CODE = '42703'

export function isMissingTableError(error?: PostgrestError | null) {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  const relationMissing =
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('table') && message.includes('does not exist')) ||
    message.includes('could not find the table')
  return (
    error.code === MISSING_TABLE_CODE ||
    error.code === MISSING_TABLE_SCHEMA_CACHE_CODE ||
    relationMissing
  )
}

export function isMissingColumnError(error?: PostgrestError | null) {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === MISSING_COLUMN_CODE ||
    (message.includes('column') && message.includes('does not exist')) ||
    message.includes('could not find the column')
  )
}

export function isSchemaDriftError(error?: PostgrestError | null) {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return (
    isMissingTableError(error) ||
    isMissingColumnError(error) ||
    message.includes('schema cache') ||
    message.includes('could not find a relationship')
  )
}
