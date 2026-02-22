import type { SupabaseClient } from '@supabase/supabase-js';

interface SafeInsertOptions {
  maxRetries?: number;
  logError?: boolean;
  retryDelay?: number;
}

/**
 * Safely inserts data into a Supabase table with retry logic.
 * Fails silently for non-critical operations after exhausting retries.
 * 
 * @param supabase - Supabase client instance
 * @param table - Table name to insert into
 * @param data - Data to insert
 * @param options - Configuration options
 * @returns Promise that resolves when insert completes or fails permanently
 * 
 * @example
 * await safeInsert(supabase, 'item_exposure_log', {
 *   question_id: firstQuestion.id,
 *   user_theta: session.theta,
 *   exam_attempt_id: attempt.id,
 * });
 */
export async function safeInsert(
  supabase: SupabaseClient,
  table: string,
  data: unknown,
  options: SafeInsertOptions = {}
): Promise<void> {
  const { 
    maxRetries = 2, 
    logError = true,
    retryDelay = 100 
  } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { error } = await supabase.from(table).insert(data);
    
    if (!error) return;
    
    if (attempt === maxRetries) {
      if (logError) {
        console.error(`Failed to insert into ${table} after ${maxRetries + 1} attempts:`, {
          error: error.message,
          code: error.code,
          table,
          data,
        });
      }
      return; // Fail silently for non-critical operations
    }
    
    // Exponential backoff: 100ms, 200ms, 400ms...
    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
  }
}

/**
 * Safely inserts multiple rows with retry logic.
 * Uses batch insert for better performance.
 */
export async function safeInsertMany<T>(
  supabase: SupabaseClient,
  table: string,
  data: T[],
  options: SafeInsertOptions = {}
): Promise<void> {
  const { 
    maxRetries = 2, 
    logError = true,
    retryDelay = 100 
  } = options;

  if (data.length === 0) return;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { error } = await supabase.from(table).insert(data);
    
    if (!error) return;
    
    if (attempt === maxRetries) {
      if (logError) {
        console.error(`Failed to batch insert into ${table} after ${maxRetries + 1} attempts:`, {
          error: error.message,
          code: error.code,
          table,
          rowCount: data.length,
        });
      }
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
  }
}
