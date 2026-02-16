import { FeatureState } from './FeatureState'

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message }: LoadingPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <FeatureState
        kind="loading"
        title="Carregando"
        description={message || 'Aguarde um instante enquanto preparamos esta experiência.'}
        className="w-full max-w-xl"
      />
    </div>
  )
}
