# Plano: Deploy + Testes E2E + Features Piloto

**Data**: 2026-02-09
**Contexto**: Usuário quer preparar Darwin Education para piloto com 5-10 usuários
**Prioridades definidas**:
- Deploy: Só banco (Vercel já funciona)
- Testes: E2E com Playwright
- Features: Resume simulado + Onboarding + Polish UX

---

## FASE 1: DEPLOY SUPABASE (30-45 minutos)

### Objetivo
Push das migrations + seeds corrigidos para Supabase de produção.

### Arquivos Envolvidos
- **19 migrations** em `infrastructure/supabase/migrations/`
- **Schema base**: `infrastructure/supabase/schema.sql` (383 linhas)
- **14 seed files** em `infrastructure/supabase/seed/` + `seed/expansion/`
- **Total de dados**: ~700KB de conteúdo médico corrigido

### Etapas

#### 1.1 Criar script de deploy automatizado
**Arquivo**: `infrastructure/supabase/deploy.sh`

```bash
#!/bin/bash
# Deploy Supabase - Migrations + Seeds
# Usage: bash infrastructure/supabase/deploy.sh

set -e

echo "🚀 Darwin Education - Deploy Supabase"
echo "======================================"

# Check if supabase CLI is linked
if ! supabase status &> /dev/null; then
  echo "❌ Supabase não está linkado. Run: pnpm db:link"
  exit 1
fi

# Push migrations
echo ""
echo "📦 Pushing migrations..."
supabase db push

# Run seeds
echo ""
echo "🌱 Running seeds..."

# Core seeds (in order)
supabase db execute < seed/01_question_banks.sql
supabase db execute < seed/02_sample_questions.sql
supabase db execute < seed/03_achievements.sql
supabase db execute < seed/04_study_paths.sql
supabase db execute < seed/05_enamed_2025_questions.sql
supabase db execute < seed/06_cip_sample_data.sql
supabase db execute < seed/07_fcr_cases.sql
supabase db execute < seed/ddl_questions_pilot.sql
supabase db execute < seed/qgen_misconceptions.sql
supabase db execute < seed/pilot_test_data.sql

# Expansion seeds
echo ""
echo "📚 Running expansion seeds..."
supabase db execute < seed/expansion/flashcard_decks_system.sql
supabase db execute < seed/expansion/flashcards_clinica_medica_200.sql
supabase db execute < seed/expansion/flashcards_cirurgia_200.sql
supabase db execute < seed/expansion/flashcards_ginecologia_200.sql
supabase db execute < seed/expansion/flashcards_pediatria_200.sql
supabase db execute < seed/expansion/flashcards_saude_coletiva_200.sql
supabase db execute < seed/expansion/fcr_cases_expansion.sql
supabase db execute < seed/expansion/ddl_cirurgia_20.sql
supabase db execute < seed/expansion/ddl_clinica_medica_20.sql
supabase db execute < seed/expansion/ddl_ginecologia_obstetricia_20.sql
supabase db execute < seed/expansion/ddl_pediatria_20.sql
supabase db execute < seed/expansion/ddl_saude_coletiva_20.sql
supabase db execute < seed/expansion/study_paths_new.sql
supabase db execute < seed/expansion/study_modules_new.sql

echo ""
echo "✅ Deploy completo!"
echo ""
echo "🧪 Próximo passo: Criar usuário de teste"
echo "   Email: test@test.com"
echo "   Password: Test@123456"
```

**Permissões**: `chmod +x infrastructure/supabase/deploy.sh`

#### 1.2 Verificar link com projeto Supabase
```bash
cd infrastructure/supabase
supabase status  # Verificar se está linkado
# Se não: supabase link --project-ref <PROJECT_REF>
```

#### 1.3 Executar deploy
```bash
cd infrastructure/supabase
bash deploy.sh
```

#### 1.4 Criar usuário de teste via Dashboard
1. Authentication → Users → Add user
2. Email: `test@test.com` / Password: `Test@123456`
3. ✅ Auto Confirm User

#### 1.5 Smoke test manual
- Acessar app em produção (Vercel)
- Login com `test@test.com`
- Criar simulado (Montar Prova → 5 questões)
- Responder simulado completo
- Ver resultado TRI
- Criar flashcard de erro
- Revisar flashcard

**Critério de sucesso**: Usuário consegue completar fluxo simulado + flashcard sem erros 400/500.

---

## FASE 2: TESTES E2E COM PLAYWRIGHT (2-3 horas)

### Objetivo
Cobrir os 3 fluxos críticos que beta testers usam:
1. Auth (signup, login, logout)
2. Simulado completo (criar, responder, ver resultado)
3. Flashcards (criar deck, adicionar cards, revisar)

### Arquivos a Criar

#### 2.1 Setup Playwright
**Arquivo**: `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

#### 2.2 Helpers & Fixtures
**Arquivo**: `apps/web/e2e/fixtures/auth.ts`

```typescript
import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Create test user
    const testEmail = `test-${Date.now()}@test.com`
    const testPassword = 'Test@123456'

    await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    // Login via UI
    await page.goto('/login')
    await page.fill('[name="email"]', testEmail)
    await page.fill('[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    await use(page)

    // Cleanup
    await supabase.auth.signOut()
  },
})
```

#### 2.3 Test: Auth Flow
**Arquivo**: `apps/web/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('signup flow completo', async ({ page }) => {
    await page.goto('/signup')

    const email = `test-${Date.now()}@test.com`
    await page.fill('[name="email"]', email)
    await page.fill('[name="password"]', 'Test@123456')
    await page.fill('[name="confirmPassword"]', 'Test@123456')

    await page.click('button[type="submit"]')

    // Redireciona para home após signup
    await expect(page).toHaveURL('/')

    // Verifica que está logado (presença de botão logout ou perfil)
    await expect(page.locator('text=Sair')).toBeVisible({ timeout: 10000 })
  })

  test('login e logout', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'test@test.com')
    await page.fill('[name="password"]', 'Test@123456')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')

    // Logout
    await page.click('text=Sair')
    await expect(page).toHaveURL('/login')
  })

  test('bloqueia acesso sem auth', async ({ page }) => {
    await page.goto('/desempenho')

    // Redireciona para login
    await expect(page).toHaveURL(/\/login/)
  })
})
```

#### 2.4 Test: Simulado Flow
**Arquivo**: `apps/web/e2e/simulado.spec.ts`

```typescript
import { test, expect } from './fixtures/auth'

test.describe('Simulado ENAMED', () => {
  test('criar e completar simulado', async ({ authenticatedPage: page }) => {
    // Ir para Montar Prova
    await page.goto('/montar-prova')

    // Preencher título
    await page.fill('[name="title"]', 'Simulado E2E Test')

    // Ajustar questões (5 mínimo para teste rápido)
    const slider = page.locator('input[type="range"]').first()
    await slider.fill('5')

    // Criar
    await page.click('button:has-text("Criar e Iniciar Simulado")')

    // Aguardar página do simulado carregar
    await expect(page.locator('text=Questão 1')).toBeVisible({ timeout: 15000 })

    // Responder 5 questões
    for (let i = 0; i < 5; i++) {
      // Selecionar primeira opção (A)
      await page.click('[data-option="A"]')

      // Próxima (se não for última)
      if (i < 4) {
        await page.click('button:has-text("Próxima")')
      }
    }

    // Finalizar
    await page.click('button:has-text("Finalizar")')
    await page.click('button:has-text("Finalizar")') // Confirmação no modal

    // Verificar resultado
    await expect(page.locator('text=Resultado do Simulado')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=TRI')).toBeVisible()

    // Pontuação deve estar entre 0-1000
    const scoreElement = page.locator('[data-testid="tri-score"]')
    const scoreText = await scoreElement.textContent()
    const score = parseInt(scoreText || '0')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1000)
  })
})
```

#### 2.5 Test: Flashcards Flow
**Arquivo**: `apps/web/e2e/flashcards.spec.ts`

```typescript
import { test, expect } from './fixtures/auth'

test.describe('Flashcards', () => {
  test('criar deck e revisar cards', async ({ authenticatedPage: page }) => {
    await page.goto('/flashcards/create')

    // Preencher deck
    await page.fill('input[name="title"]', 'Deck E2E Test')
    await page.fill('textarea[name="description"]', 'Deck de teste automatizado')

    // Selecionar área
    await page.selectOption('select', 'clinica_medica')

    // Card 1
    await page.fill('textarea[placeholder*="pergunta"]', 'Qual o tratamento de IAM?')
    await page.fill('textarea[placeholder*="resposta"]', 'AAS + Clopidogrel + Heparina')

    // Adicionar mais 1 card
    await page.click('button:has-text("Adicionar Card")')

    // Card 2
    const cards = page.locator('textarea[placeholder*="pergunta"]')
    await cards.nth(1).fill('O que é diabetes tipo 2?')
    await page.locator('textarea[placeholder*="resposta"]').nth(1).fill('Resistência à insulina')

    // Criar deck
    await page.click('button:has-text("Criar Deck")')

    // Redireciona para página do deck
    await expect(page.locator('text=Deck E2E Test')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=2 cards')).toBeVisible()

    // Estudar cards
    await page.click('button:has-text("Estudar")')

    // Revisar primeiro card
    await expect(page.locator('text=Qual o tratamento de IAM?')).toBeVisible()

    // Clicar para ver resposta
    await page.click('button:has-text("Ver Resposta")')
    await expect(page.locator('text=AAS + Clopidogrel')).toBeVisible()

    // Avaliar como "Fácil" (rating 4)
    await page.click('[data-rating="4"]')

    // Segundo card
    await expect(page.locator('text=O que é diabetes tipo 2?')).toBeVisible()
  })
})
```

#### 2.6 package.json scripts
Adicionar ao `apps/web/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0"
  }
}
```

#### 2.7 CI integration
**Arquivo**: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 10
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm --filter @darwin-education/web exec playwright install chromium

      - name: Run E2E tests
        run: pnpm --filter @darwin-education/web test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7
```

**Critério de sucesso**: 3 test suites passam (auth, simulado, flashcards) em <5 min.

---

## FASE 3: FEATURES PILOTO (4-6 horas)

### 3.1 Resume Simulado (1.5h)

**Problema**: Usuário sai do simulado e perde progresso. TODO na linha 148 de `simulado/[examId]/page.tsx`.

**Solução**: Restaurar `answers` do `existingAttempt` no Zustand store.

**Arquivos**:
1. `apps/web/app/simulado/[examId]/page.tsx` (linha 145-148)
2. `apps/web/lib/stores/examStore.ts` (adicionar `restoreExam()`)

**Implementação**:

```typescript
// examStore.ts - adicionar action
restoreExam: (exam, attemptId, savedAnswers) => {
  const answers: Record<string, ExamAnswer> = {}
  exam.questions.forEach((q) => {
    const savedAnswer = savedAnswers[q.id]
    answers[q.id] = savedAnswer || {
      questionId: q.id,
      selectedAnswer: null,
      timeSpent: 0,
      flagged: false,
    }
  })

  set({
    currentExam: exam,
    attemptId,
    answers,
    currentQuestionIndex: 0,
    remainingTime: exam.timeLimit,
    startedAt: new Date(),
    isSubmitted: false,
  })
}

// simulado/[examId]/page.tsx - linha 148
if (existingAttempt) {
  attemptId = existingAttempt.id

  // Restaurar answers
  const savedAnswers: Record<string, ExamAnswer> = {}
  Object.entries(existingAttempt.answers).forEach(([qId, optionIndex]) => {
    const question = orderedQuestions.find(q => q.id === qId)
    if (question && typeof optionIndex === 'number' && optionIndex >= 0) {
      savedAnswers[qId] = {
        questionId: qId,
        selectedAnswer: question.options[optionIndex]?.text || null,
        timeSpent: 0,
        flagged: false,
      }
    }
  })

  restoreExam(
    { id: examId, title: exam.title, questions: orderedQuestions, timeLimit: exam.time_limit_minutes * 60 },
    attemptId,
    savedAnswers
  )
} else {
  // Código existente para novo attempt...
}
```

**Teste manual**:
1. Iniciar simulado
2. Responder 3 questões
3. Fechar tab/navegador
4. Voltar `/simulado/{examId}`
5. Verificar que as 3 respostas estão lá

---

### 3.2 Onboarding Flow (2h)

**Problema**: Novos usuários não sabem por onde começar. Sem tutorial/walkthrough.

**Solução**: Modal de boas-vindas com 3 etapas:
1. Bem-vindo ao Darwin
2. Escolha sua meta (passar no ENAMED, revisar conteúdo, treinar áreas fracas)
3. Começar com simulado rápido ou flashcards

**Arquivos a criar**:
1. `apps/web/components/onboarding/OnboardingModal.tsx`
2. `apps/web/app/page.tsx` (integrar modal)
3. `apps/web/lib/stores/userPreferencesStore.ts` (persist `hasSeenOnboarding`)

**Implementação**:

```typescript
// userPreferencesStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferencesState {
  hasSeenOnboarding: boolean
  studyGoal: 'exam_prep' | 'content_review' | 'weak_areas' | null
  markOnboardingComplete: () => void
  setStudyGoal: (goal: string) => void
}

export const useUserPreferences = create<UserPreferencesState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      studyGoal: null,
      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      setStudyGoal: (goal) => set({ studyGoal: goal as any }),
    }),
    { name: 'darwin-user-prefs' }
  )
)

// OnboardingModal.tsx (300 linhas)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useUserPreferences } from '@/lib/stores/userPreferencesStore'

export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const { markOnboardingComplete, setStudyGoal } = useUserPreferences()

  const handleComplete = (action: string) => {
    markOnboardingComplete()
    if (action === 'simulado') {
      router.push('/montar-prova?count=20&time=60')
    } else {
      router.push('/flashcards')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="lg">
      {step === 1 && (
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4">Bem-vindo ao Darwin Education! 🎓</h2>
          <p className="text-label-secondary mb-6">
            Plataforma completa de preparação para o ENAMED com TRI, spaced repetition e IA.
          </p>
          <Button onClick={() => setStep(2)}>Começar Tour</Button>
        </div>
      )}

      {step === 2 && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Qual é seu objetivo?</h2>
          <div className="grid gap-4">
            <button
              onClick={() => { setStudyGoal('exam_prep'); setStep(3) }}
              className="p-6 border border-separator rounded-lg hover:border-emerald-500 text-left"
            >
              <h3 className="font-semibold mb-2">📝 Passar no ENAMED</h3>
              <p className="text-sm text-label-secondary">
                Simulados com TRI, análise de desempenho por área
              </p>
            </button>
            <button
              onClick={() => { setStudyGoal('content_review'); setStep(3) }}
              className="p-6 border border-separator rounded-lg hover:border-emerald-500 text-left"
            >
              <h3 className="font-semibold mb-2">📚 Revisar Conteúdo</h3>
              <p className="text-sm text-label-secondary">
                Flashcards com repetição espaçada, 1000+ cards
              </p>
            </button>
            <button
              onClick={() => { setStudyGoal('weak_areas'); setStep(3) }}
              className="p-6 border border-separator rounded-lg hover:border-emerald-500 text-left"
            >
              <h3 className="font-semibold mb-2">🎯 Treinar Áreas Fracas</h3>
              <p className="text-sm text-label-secondary">
                Diagnóstico de lacunas + recomendações personalizadas
              </p>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Por onde começar?</h2>
          <p className="text-label-secondary mb-6">
            Recomendamos fazer um simulado rápido para calibrar seu nível.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleComplete('simulado')} size="lg">
              Fazer Simulado Rápido (20 questões)
            </Button>
            <Button onClick={() => handleComplete('flashcards')} variant="secondary" size="lg">
              Começar com Flashcards
            </Button>
          </div>
          <button
            onClick={() => { markOnboardingComplete(); router.push('/') }}
            className="mt-4 text-sm text-label-tertiary hover:text-label-primary"
          >
            Pular e explorar sozinho
          </button>
        </div>
      )}
    </Modal>
  )
}

// page.tsx - adicionar no HomePage
import { useUserPreferences } from '@/lib/stores/userPreferencesStore'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

export default function HomePage() {
  const { hasSeenOnboarding } = useUserPreferences()

  return (
    <>
      <OnboardingModal isOpen={!hasSeenOnboarding} />
      {/* resto do conteúdo */}
    </>
  )
}
```

**Teste manual**:
1. Limpar localStorage
2. Reload página
3. Ver modal de onboarding
4. Completar 3 steps
5. Verificar que não aparece de novo

---

### 3.3 Polish UX (1.5h)

**Objetivo**: Melhorar estados de loading, mensagens de erro, validações.

**Áreas prioritárias**:
1. Loading skeletons nos card grids
2. Mensagens de erro mais descritivas
3. Toast notifications para ações de sucesso
4. Validações de formulário inline

**Arquivos**:
1. `apps/web/components/ui/Toast.tsx` (novo)
2. `apps/web/components/ui/Skeleton.tsx` (novo)
3. Adicionar toasts em: flashcard create, simulado submit, deck delete

**Implementação**:

```typescript
// Toast.tsx (100 linhas)
'use client'

import { createContext, useContext, useState } from 'react'

type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{
  showToast: (message: string, type: Toast['type']) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: Toast['type']) => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600' :
              toast.type === 'error' ? 'bg-red-600' :
              'bg-blue-600'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

// Skeleton.tsx (50 linhas)
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-2 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 border border-separator rounded-xl space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

// Usar em flashcards/page.tsx loading state
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
) : (
  // cards reais
)}

// Usar toast em flashcards/create/page.tsx após criar deck
import { useToast } from '@/components/ui/Toast'

const { showToast } = useToast()

// Após sucesso:
showToast('Deck criado com sucesso!', 'success')
router.push(`/flashcards/${deckData.id}`)

// Após erro:
showToast('Erro ao criar deck. Tente novamente.', 'error')
```

**Áreas a polir**:
- ✅ Flashcards create/edit: Toast de sucesso/erro
- ✅ Simulado submit: Toast + loading spinner
- ✅ Deck delete: Confirmação + toast
- ✅ Loading states: Skeletons em vez de spinner genérico
- ✅ Validação inline: Mostrar erros abaixo dos campos (não só no topo)

---

## CHECKLIST DE ENTREGA

### Deploy ✅
- [ ] Script `deploy.sh` criado
- [ ] Migrations pushed para Supabase
- [ ] Seeds executados (14 arquivos)
- [ ] Usuário de teste criado
- [ ] Smoke test manual passou

### Testes E2E ✅
- [ ] Playwright config criado
- [ ] 3 test suites implementados (auth, simulado, flashcards)
- [ ] CI workflow criado (`.github/workflows/e2e.yml`)
- [ ] Testes passam localmente (`pnpm test:e2e`)
- [ ] Testes passam no CI

### Features ✅
- [ ] Resume simulado funciona
- [ ] Onboarding modal aparece para novos usuários
- [ ] Toast component funcional
- [ ] Skeleton loading states em 3+ páginas
- [ ] Validações inline em forms

---

## MÉTRICAS DE SUCESSO

### Deploy
- ✅ 0 erros 500 no smoke test
- ✅ TRI score calculado corretamente (entre 0-1000)
- ✅ Flashcards salvam e aparecem na listagem

### Testes
- ✅ Cobertura E2E: 3 fluxos críticos
- ✅ Tempo de execução: <5 minutos
- ✅ Taxa de sucesso CI: 100% (sem flakiness)

### Features
- ✅ Resume: 100% das respostas restauradas
- ✅ Onboarding: <5% skip rate (usuários pulam)
- ✅ UX: 0 reclamações sobre loading states na primeira semana de piloto

---

## TEMPO ESTIMADO TOTAL: 7-10 horas

- Deploy Supabase: 0.5h (script) + 0.5h (execução/verificação)
- Testes E2E: 2h (setup) + 1h (implementação)
- Features: 1.5h (resume) + 2h (onboarding) + 1.5h (polish)

---

## DEPENDÊNCIAS

- ✅ Supabase project já criado
- ✅ Vercel auto-deploy configurado
- ✅ GitHub repo com main branch
- ⚠️ Playwright: precisa instalar `pnpm add -D @playwright/test -w` + `pnpm --filter @darwin-education/web exec playwright install`

---

## RISCOS

1. **Migrations podem falhar** se houver data incompatível
   - Mitigação: Testar em DB staging primeiro

2. **E2E tests podem ser flaky** (timeouts, race conditions)
   - Mitigação: Usar `waitFor` adequadamente, retries no CI

3. **Onboarding modal pode atrapalhar usuários avançados**
   - Mitigação: Botão "Pular" visível + só aparece 1x

---

**Próximo passo após aprovação**: Começar implementação pela Fase 1 (Deploy).
