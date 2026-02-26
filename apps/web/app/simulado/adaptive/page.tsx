'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FeatureState } from '@/components/ui/FeatureState';
import { useAdaptiveSetup } from '@/lib/hooks/useAdaptiveSetup';
import { useHydration } from '@/lib/hooks/useHydration';
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList';
import { AreaSelectionGrid } from './components/AreaSelectionGrid';
import { AdaptiveSetupSkeleton } from './components/AdaptiveSetupSkeleton';

/**
 * Adaptive exam setup page.
 * Allows users to configure and start a CAT (Computerized Adaptive Testing) session.
 */
export default function AdaptiveSetupPage() {
  const router = useRouter();
  const hydrated = useHydration();
  
  const {
    selectedAreas,
    minItemsInput,
    maxItemsInput,
    loading,
    error,
    validationErrors,
    isValid,
    toggleArea,
    setMinItemsInput,
    setMaxItemsInput,
    handleMinBlur,
    handleMaxBlur,
    handleStart,
    clearError,
  } = useAdaptiveSetup();

  const shouldReduceMotion = useReducedMotion();

  // Show skeleton until hydration is complete to prevent mismatch
  if (!hydrated) {
    return <AdaptiveSetupSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-separator bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/simulado')}
              className="darwin-focus-ring darwin-nav-link rounded-lg p-2 hover:bg-surface-2"
              aria-label="Voltar para simulados"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Simulado Adaptativo</h1>
              <p className="text-sm text-label-secondary mt-1">
                Teste inteligente que se adapta ao seu nível
              </p>
            </div>
          </div>
        </div>
      </header>

      <AnimatedList className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        <AnimatedItem className="darwin-image-tile relative mb-6 h-44 md:h-52 overflow-hidden">
          <Image
            src="/images/branding/adaptive-hero-apple-v1.png"
            alt="Visual de simulado adaptativo com progressão de dificuldade"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="object-cover object-center opacity-75 transition-transform duration-[10s] ease-linear hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/30" />
          <div className="relative z-10 h-full flex items-end p-5">
            <p className="text-sm md:text-base text-label-secondary max-w-md">
              O algoritmo ajusta a prova em tempo real para estimar seu nível com precisão.
            </p>
          </div>
          {!shouldReduceMotion && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-[shimmer_4s_infinite]" />
            </div>
          )}
        </AnimatedItem>

        <div className="space-y-6">
          {/* Area Selection */}
          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle>Áreas do Conhecimento</CardTitle>
                <CardDescription>
                  {selectedAreas.length === 5
                    ? 'Todas as 5 áreas selecionadas.'
                    : selectedAreas.length === 1
                      ? '1 área selecionada — mínimo atingido.'
                      : `${selectedAreas.length} de 5 áreas selecionadas.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaSelectionGrid 
                  selectedAreas={selectedAreas} 
                  onToggle={toggleArea} 
                />
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Configuration */}
          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle>Configuração</CardTitle>
                <CardDescription>
                  Defina o número mínimo e máximo de questões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Mínimo de itens"
                      type="number"
                      min="10"
                      max={parseInt(maxItemsInput, 10) || 180}
                      value={minItemsInput}
                      onChange={(e) => {
                        setMinItemsInput(e.target.value);
                        clearError();
                      }}
                      onBlur={handleMinBlur}
                      error={validationErrors.minItems}
                      hint={!validationErrors.minItems ? 'Entre 10 e 180' : undefined}
                      aria-describedby="min-items-help"
                    />
                    <p id="min-items-help" className="sr-only">
                      Número mínimo de questões: entre 10 e {maxItemsInput || 180}
                    </p>
                  </div>
                  <div>
                    <Input
                      label="Máximo de itens"
                      type="number"
                      min={parseInt(minItemsInput, 10) || 10}
                      max="180"
                      value={maxItemsInput}
                      onChange={(e) => {
                        setMaxItemsInput(e.target.value);
                        clearError();
                      }}
                      onBlur={handleMaxBlur}
                      error={validationErrors.maxItems}
                      hint={!validationErrors.maxItems ? 'Entre 10 e 180' : undefined}
                      aria-describedby="max-items-help"
                    />
                    <p id="max-items-help" className="sr-only">
                      Número máximo de questões: entre {minItemsInput || 10} e 180
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* How it works */}
          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-label-secondary leading-relaxed">
                    O simulado adaptativo seleciona questões com base no seu desempenho em tempo real.
                    Questões mais difíceis são apresentadas quando você acerta, e mais fáceis quando erra.
                    O teste termina quando a precisão é suficiente ou o número máximo de itens é atingido.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Error message - aria-live for screen readers */}
          <AnimatedItem aria-live="polite" aria-atomic="true">
            {error && (
              <FeatureState
                kind="error"
                title="Falha ao iniciar simulado adaptativo"
                description={error}
                compact
              />
            )}
          </AnimatedItem>

          {/* Session summary */}
          {isValid && (
            <AnimatedItem className="flex items-center justify-center gap-2 text-sm text-label-secondary">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-separator">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedAreas.length} {selectedAreas.length === 1 ? 'área' : 'áreas'}
              </span>
              <span className="text-label-quaternary">·</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-separator">
                {minItemsInput}–{maxItemsInput} questões
              </span>
            </AnimatedItem>
          )}

          {/* Start button */}
          <AnimatedItem>
            <Button
              variant="filled"
              size="lg"
              className="darwin-nav-link"
              fullWidth
              loading={loading}
              disabled={!isValid || loading}
              onClick={handleStart}
              aria-describedby={!isValid ? 'validation-errors' : undefined}
            >
              Iniciar Simulado Adaptativo
            </Button>
            
            {!isValid && (
              <p id="validation-errors" className="sr-only text-center mt-2">
                Corrija os erros de validação antes de iniciar o simulado.
              </p>
            )}
          </AnimatedItem>
        </div>
      </AnimatedList>
    </div>
  );
}
