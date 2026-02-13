import { HomeClient } from './HomeClient'
import { createServerClient } from '@/lib/supabase/server'
import { isSchemaDriftError } from '@/lib/supabase/errors'

export default async function HomePage() {
  const supabase = await createServerClient()

  const [questionsResult, diseasesResult, medicationsResult] = await Promise.all([
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase.from('medical_diseases').select('id', { count: 'exact', head: true }),
    supabase.from('medical_medications').select('id', { count: 'exact', head: true }),
  ])

  const errors = [questionsResult.error, diseasesResult.error, medicationsResult.error].filter(Boolean)
  const schemaDrift = errors.some((error) => isSchemaDriftError(error as any))

  return (
    <HomeClient
      questionsCount={questionsResult.count || 0}
      diseasesCount={diseasesResult.count || 0}
      medicationsCount={medicationsResult.count || 0}
      schemaDrift={schemaDrift}
    />
  )
}
