'use client'

/**
 * Example Usage: Global UX Patterns
 *
 * This file demonstrates how to use the new global UX components:
 * - Toast notifications
 * - Skeleton loaders
 * - Empty states
 */

import { useState } from 'react'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from './Button'
import {
  SkeletonCard,
  SkeletonList,
  SkeletonText,
  SkeletonAvatar,
  SkeletonTable,
  SkeletonGrid,
} from './Skeleton'
import {
  EmptyState,
  EmptySearchResults,
  EmptyList,
  NoPermissions,
  NoData,
  ServerError,
} from './EmptyState'
import { Card, CardTitle, CardDescription, CardContent } from './Card'

export function ToastExample() {
  const { toast, success, error, warning, info } = useToast()

  return (
    <Card className="max-w-md">
      <CardTitle>Toast Notifications</CardTitle>
      <CardDescription>Click a button to trigger a toast notification</CardDescription>

      <CardContent className="mt-6 space-y-3">
        <Button variant="primary" fullWidth onClick={() => success('Operação realizada com sucesso!')}>
          Success Toast
        </Button>
        <Button variant="danger" fullWidth onClick={() => error('Ocorreu um erro! Tente novamente.')}>
          Error Toast
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => warning('Este é um aviso importante.')}
        >
          Warning Toast
        </Button>
        <Button variant="ghost" fullWidth onClick={() => info('Informação: Algo aconteceu!')}>
          Info Toast
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            toast('Toast customizado!', {
              variant: 'info',
              duration: 5000,
            })
          }
        >
          Custom Toast
        </Button>
      </CardContent>
    </Card>
  )
}

export function SkeletonExample() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Skeleton Loaders</CardTitle>
        <CardDescription>Click to toggle loading state</CardDescription>

        <CardContent className="mt-6">
          <Button
            onClick={() => setIsLoading(!isLoading)}
            fullWidth
            className="mb-6"
          >
            {isLoading ? 'Stop Loading' : 'Start Loading'}
          </Button>

          {isLoading ? (
            <SkeletonCard lines={3} showAvatar />
          ) : (
            <Card>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">Content Loaded</h3>
                  <p className="text-label-secondary text-sm">
                    This is the actual content that appears after loading.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardTitle>List Skeleton</CardTitle>
          <CardContent className="mt-4">
            <SkeletonList items={3} showAvatar />
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardTitle>Table Skeleton</CardTitle>
          <CardContent className="mt-4">
            <SkeletonTable rows={4} columns={3} />
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardTitle>Grid Skeleton</CardTitle>
          <CardContent className="mt-4">
            <SkeletonGrid items={6} columns={3} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function EmptyStateExample() {
  const [activeState, setActiveState] = useState<
    'empty' | 'search' | 'permissions' | 'error' | 'custom'
  >('empty')

  const states = [
    { id: 'empty', label: 'Empty List' },
    { id: 'search', label: 'No Results' },
    { id: 'permissions', label: 'No Permissions' },
    { id: 'error', label: 'Server Error' },
    { id: 'custom', label: 'Custom State' },
  ]

  return (
    <Card>
      <CardTitle>Empty States</CardTitle>
      <CardDescription>Different empty state variations</CardDescription>

      <CardContent className="mt-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {states.map((state) => (
            <button
              key={state.id}
              onClick={() => setActiveState(state.id as typeof activeState)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeState === state.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-2 text-label-primary hover:bg-surface-3'
              }`}
            >
              {state.label}
            </button>
          ))}
        </div>

        <div className="border border-separator rounded-lg bg-surface-1/50 overflow-hidden">
          {activeState === 'empty' && (
            <EmptyList
              title="Nenhuma questão encontrada"
              description="Você ainda não criou nenhuma questão. Comece criando uma nova."
              action={{ label: 'Criar Questão', onClick: () => alert('Create question') }}
            />
          )}

          {activeState === 'search' && (
            <EmptySearchResults
              title="Nenhum resultado encontrado"
              description="Tente ajustar seus critérios de busca."
              action={{ label: 'Limpar Filtros', onClick: () => alert('Clear filters') }}
            />
          )}

          {activeState === 'permissions' && (
            <NoPermissions
              title="Acesso Negado"
              description="Você não tem permissão para acessar este conteúdo."
              action={{ label: 'Voltar', onClick: () => alert('Go back') }}
            />
          )}

          {activeState === 'error' && (
            <ServerError
              title="Erro ao carregar"
              description="Algo deu errado. Por favor, tente novamente mais tarde."
              action={{ label: 'Tentar Novamente', onClick: () => alert('Retry') }}
            />
          )}

          {activeState === 'custom' && (
            <EmptyState
              icon="🎓"
              title="Parabéns!"
              description="Você completou todo o módulo com sucesso!"
              action={{ label: 'Próximo Módulo', onClick: () => alert('Next module') }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function GlobalUXPatternsShowcase() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Global UX Patterns</h1>
        <p className="text-label-secondary">
          Comprehensive examples of Toast notifications, Skeleton loaders, and Empty states
        </p>
      </div>

      <ToastExample />
      <SkeletonExample />
      <EmptyStateExample />
    </div>
  )
}
