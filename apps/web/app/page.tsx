import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/marketing/HeroSection'
import { StatsRow } from '@/components/marketing/StatsRow'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { MethodologySection } from '@/components/marketing/MethodologySection'
import { FinalCTA } from '@/components/marketing/FinalCTA'

export default async function LandingPage() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Authenticated users go straight to the app
  if (session) redirect('/simulado')

  // Fetch live question count for social proof
  const { count: questionsCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-system-background">
      <HeroSection />
      <StatsRow questionsCount={questionsCount ?? 3847} />
      <FeatureGrid />
      <MethodologySection />
      <FinalCTA />
    </div>
  )
}
