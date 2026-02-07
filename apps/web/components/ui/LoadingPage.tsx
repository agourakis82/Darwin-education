import { Spinner } from './Spinner'

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message }: LoadingPageProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" className="text-emerald-400" />
      {message && (
        <p className="text-label-secondary text-sm">{message}</p>
      )}
    </div>
  )
}
