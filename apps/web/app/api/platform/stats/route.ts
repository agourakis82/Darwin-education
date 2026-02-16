import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isSchemaDriftError } from '@/lib/supabase/errors'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const [questionsResult, diseasesResult, medicationsResult] = await Promise.all([
      (supabase as any)
        .from('questions')
        .select('id', { count: 'exact', head: true }),
      (supabase as any)
        .from('medical_diseases')
        .select('id', { count: 'exact', head: true }),
      (supabase as any)
        .from('medical_medications')
        .select('id', { count: 'exact', head: true }),
    ])

    const errors = [questionsResult.error, diseasesResult.error, medicationsResult.error].filter(Boolean)
    const schemaDrift = errors.some((error) => isSchemaDriftError(error as any))

    return NextResponse.json({
      questions: questionsResult.count ?? 0,
      diseases: diseasesResult.count ?? 0,
      medications: medicationsResult.count ?? 0,
      source: errors.length ? 'fallback' : 'supabase',
      schemaDrift,
      errors: errors.length
        ? errors.map((error: any) => ({ code: error.code ?? null, message: error.message ?? 'unknown' }))
        : [],
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        questions: 0,
        diseases: 0,
        medications: 0,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 200 }
    )
  }
}
