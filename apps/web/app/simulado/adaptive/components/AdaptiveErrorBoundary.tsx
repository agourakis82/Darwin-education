// ============================================================
// ADAPTIVE ERROR BOUNDARY
// Graceful error recovery for CAT sessions with resume capability
// ============================================================

'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  sessionId: string | null
  onResume: () => void
  onReset: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isResuming: boolean
}

/**
 * AdaptiveErrorBoundary - Specialized error boundary for CAT sessions.
 *
 * Features:
 * - Catches errors during adaptive testing
 * - Provides "Resume Attempt" functionality using sessionId
 * - Shows user-friendly error messages
 * - Logs errors for monitoring
 */
export class AdaptiveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, isResuming: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, isResuming: false }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('AdaptiveErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })

    // TODO: Send to error tracking service (Sentry, etc.)
    // captureException(error, { extra: { errorInfo, sessionId: this.props.sessionId } })
  }

  private handleResume = async () => {
    const { sessionId, onResume } = this.props

    if (!sessionId) {
      // No session to resume, just reset
      this.handleReset()
      return
    }

    this.setState({ isResuming: true })

    try {
      await onResume()
      // Clear error state on successful resume
      this.setState({ hasError: false, error: null, errorInfo: null, isResuming: false })
    } catch (resumeError) {
      console.error('Failed to resume session:', resumeError)
      this.setState({ isResuming: false })
      // Keep error state, show resume failure message
    }
  }

  private handleReset = () => {
    this.props.onReset()
    this.setState({ hasError: false, error: null, errorInfo: null, isResuming: false })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-1 rounded-xl border border-separator p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Algo deu errado
            </h2>

            <p className="text-label-secondary mb-6">
              Ocorreu um erro durante o simulado. Não se preocupe, seu progresso foi salvo.
            </p>

            {this.props.sessionId && (
              <div className="bg-surface-2 rounded-lg p-3 mb-6 text-sm text-label-secondary">
                <span className="font-medium">Sessão:</span>{' '}
                <code className="text-label-primary">{this.props.sessionId.slice(0, 8)}...{this.props.sessionId.slice(-8)}</code>
              </div>
            )}

            <div className="space-y-3">
              {this.props.sessionId && (
                <Button
                  variant="filled"
                  fullWidth
                  loading={this.state.isResuming}
                  onClick={this.handleResume}
                >
                  {this.state.isResuming ? 'Retomando...' : 'Retomar Tentativa'}
                </Button>
              )}

              <Button
                variant="bordered"
                fullWidth
                disabled={this.state.isResuming}
                onClick={this.handleReset}
              >
                Voltar ao Início
              </Button>
            </div>

            {/* Debug info (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-label-secondary cursor-pointer">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 p-3 bg-surface-2 rounded-lg text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
