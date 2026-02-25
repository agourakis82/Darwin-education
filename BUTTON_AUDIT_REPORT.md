# Darwinhub.org - Complete Button Audit Report

**Date:** 2026-02-22  
**Scope:** All Button components across the application  
**Status:** Live Production Build

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Button Instances** | 200+ |
| **Unique Pages with Buttons** | 50+ |
| **Button Variants Used** | 6 |
| **Issues Found** | 15 |
| **Critical Issues** | 2 |

---

## Button Component API

### Current Props Interface
```typescript
interface ButtonProps {
  variant?: 'filled' | 'tinted' | 'glass' | 'plain' | 'bordered' | 'borderless'
  size?: 'small' | 'medium' | 'large'
  color?: 'blue' | 'green' | 'red' | 'gray' | 'darwin'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  asChild?: boolean
}
```

### Default Behavior
- **Default variant:** `filled`
- **Default size:** `medium`
- **Default color:** `darwin` (emerald)

---

## Button Inventory by Page

### 1. Navigation & Layout

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `components/Navigation.tsx` | 0 | - | Uses Link components, not Button |
| `components/BottomNav.tsx` | 0 | - | Uses Link components |
| `components/OnboardingModal.tsx` | 5 | `default`, `tinted`, `plain` | Multi-step modal actions |

#### OnboardingModal.tsx Buttons:
1. `Button` (default/filled) - "Continuar" (Step 1-3)
2. `Button` (default/filled) - "Começar" (Final step)
3. `Button variant="tinted"` - "Voltar" (Steps 2-4)
4. `Button variant="plain"` - "Pular" (All steps)
5. `Button` (default/filled) - "Concluir" (Step 4)

**Issue:** Uses deprecated `variant="secondary"` in FeatureState.tsx (line 78)

---

### 2. Authentication Pages

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/(auth)/login/page.tsx` | 0 | - | No buttons, form uses submit |
| `app/(auth)/signup/page.tsx` | 0 | - | No buttons, form uses submit |
| `components/auth/AuthForm.tsx` | 1 | `default` | Submit button |

#### AuthForm.tsx Buttons:
1. `Button fullWidth` (default/filled) - "Entrar/Criar Conta"

**Status:** ✅ Correct implementation

---

### 3. Home Page (/)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/page.tsx` | 0+ | - | Links wrapped in Button via asChild |

**Note:** Home page uses `asChild` pattern with Next.js Link

---

### 4. Simulado (Exam Simulator)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/simulado/page.tsx` | 2 | `default`, `bordered` | Exam list actions |
| `app/simulado/[examId]/page.tsx` | 6 | `bordered`, `default` | Exam taking actions |
| `app/simulado/[examId]/result/page.tsx` | 4 | `bordered`, `default` | Results actions |
| `app/simulado/[examId]/review/page.tsx` | 7 | `bordered`, `default` | Review mode actions |
| `app/simulado/error.tsx` | 2 | `default`, `tinted` | Error recovery |
| `app/simulado/components/ExamQuestion.tsx` | 1 | `default` | Flag question |
| `app/simulado/adaptive/page.tsx` | 1 | `default` | Start CAT exam |
| `app/simulado/adaptive/[examId]/page.tsx` | 5 | `default`, `bordered` | CAT exam actions |
| `app/simulado/adaptive/components/AdaptiveErrorBoundary.tsx` | 2 | `default`, `bordered` | Error recovery |

#### simulado/page.tsx Buttons:
1. `Button` (wrapped in Link) - "Iniciar Simulado"
2. `Button variant="bordered" size="small"` - Config icon button

#### simulado/[examId]/page.tsx Buttons:
1. `Button variant="bordered" fullWidth` - "Tentar novamente" (Error state)
2. `Button variant="bordered" fullWidth` - "Voltar para Simulados" (Error state)
3. `Button` - "Revisar Questão" (Finished)
4. `Button` - "Bandeirinha" (Flag)
5. `Button variant="bordered"` - "Desistir"
6. `Button` - "Finalizar"

#### simulado/[examId]/result/page.tsx Buttons:
1. `Button fullWidth` - "Revisar Questões"
2. `Button variant="bordered" fullWidth` - "Novo Simulado"
3. `Button variant="bordered" fullWidth onClick={handleReviewExam}` - Review exam
4. `Button fullWidth onClick={handleNewExam}` - New exam
5. `Button size="small"` - "Ver Flashcards" (Conditional)

**Issues Found:**
- Line 344: Uses `size="small"` which doesn't exist in ButtonSize type
- Line 160-163: Mix of fullWidth buttons without consistent sizing

---

### 5. Flashcards

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/flashcards/page.tsx` | 3 | `default`, `large` | Deck list actions |
| `app/flashcards/[deckId]/page.tsx` | 5 | `plain`, `tinted`, `small` | Deck detail actions |
| `app/flashcards/[deckId]/edit/page.tsx` | 5 | `plain`, `tinted` | Edit actions |
| `app/flashcards/create/page.tsx` | 2 | `default` | Create deck |
| `app/flashcards/study/page.tsx` | 3 | `bordered`, `plain` | Study mode |
| `app/flashcards/error.tsx` | 2 | `default`, `tinted` | Error recovery |

#### flashcards/page.tsx Buttons:
1. `Button` - "Criar Novo Deck"
2. `Button size="large"` - "Estudar Agora" (Featured deck)

**Issue:** Line 250 uses `size="large"` which is valid but inconsistent with other pages using just `default`

#### flashcards/[deckId]/page.tsx Buttons:
1. `Button variant="plain" size="small"` - "Voltar" (Logged in)
2. `Button variant="plain" size="small"` - "Voltar" (Not logged in)
3. `Button variant="tinted" size="small"` - "Editar"
4. `Button size="small"` - "Estudar"
5. `Button variant="tinted" size="small" className="w-full"` - "Editar" (Mobile)
6. `Button size="small" className="w-full"` - "Estudar" (Mobile)

**Issues:**
- Multiple "Voltar" buttons with same props (code duplication)
- Uses both `variant="tinted"` and `default` for similar actions

---

### 6. Trilhas (Learning Paths)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/trilhas/page.tsx` | 2 | `default`, `bordered` | Path listing |
| `app/trilhas/[pathId]/page.tsx` | 3 | `default`, `bordered` | Path detail |
| `app/trilhas/[pathId]/[moduleId]/page.tsx` | 4 | `default`, `bordered` | Module view |
| `app/trilhas/components/ModuleContent.tsx` | 8 | `default`, `bordered` | Module interactions |

#### trilhas/page.tsx Buttons:
1. `Button onClick={() => setFilter('all')} fullWidth` - "Ver Todas"
2. `Button variant="bordered" onClick={() => router.push('/conteudo')} fullWidth` - "Explorar Conteúdo"

#### trilhas/[pathId]/page.tsx Buttons:
1. `Button onClick={() => router.push('/trilhas')} fullWidth` - "Voltar"
2. `Button variant="bordered" onClick={() => router.refresh()} fullWidth` - "Atualizar"
3. `Button className="w-full"` - "Continuar" (Start/Continue module)

#### trilhas/components/ModuleContent.tsx Buttons:
1. `Button onClick={onComplete} loading={isCompleting}` - "Marcar como Concluído"
2. `Button onClick={onComplete} loading={isCompleting}` - "Refazer" (Quiz retry)
3. `Button onClick={() => setShowResults(true)} className="w-full"` - "Ver Resultados"
4. `Button onClick={() => window.open(...)}` - "Abrir Flashcards"
5. `Button onClick={() => window.open(...)}` - "Criar Flashcards"
6. `Button variant="bordered" onClick={onComplete} loading={isCompleting}` - "Pular"
7. `Button` - "Ver Resposta" (Clinical case)
8. `Button onClick={() => setCurrentCaseStep(...)}` - "Próximo"

**Issues:**
- Inconsistent use of `fullWidth` vs `className="w-full"`
- Line 83 vs 112: Same action but different button implementations

---

### 7. CIP (Clinical Image Puzzles)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/cip/page.tsx` | 2 | `default`, `bordered` | Puzzle list |
| `app/cip/[puzzleId]/page.tsx` | 7 | `default`, `bordered`, `filled` | Puzzle solving |
| `app/cip/[puzzleId]/result/page.tsx` | 2 | `bordered` | Results |
| `app/cip/pratica/page.tsx` | 2 | `default`, `bordered` | Practice mode |
| `app/cip/achievements/page.tsx` | 3 | `bordered` | Achievement view |
| `app/cip/leaderboard/page.tsx` | 0 | - | No buttons |
| `app/cip/error.tsx` | 2 | `default`, `tinted` | Error recovery |
| `app/cip/components/CIPOptionsModal.tsx` | 2 | `default`, `tinted` | Modal actions |
| `app/cip/components/CIPResults.tsx` | 2 | `bordered`, `filled` | Results actions |
| `app/cip/components/LeaderboardEntry.tsx` | 0 | - | No buttons (Badges only) |
| `app/cip/components/ImageCaseViewer.tsx` | 1 | `default` | Image actions |

#### cip/[puzzleId]/page.tsx Buttons:
1. `Button onClick={() => router.push('/cip')}` - "Voltar" (Error state)
2. `Button fullWidth` - "Voltar para Lista" (Loading/Error)
3. `Button variant="bordered" fullWidth onClick={() => router.refresh()}` - "Tentar Novamente"
4. `Button` - "Pular" (Info modal)
5. `Button` - "Responder"
6. `Button variant="bordered" size="small"` - "Revisar Diagnóstico"
7. `Button variant="filled" onClick={handleSubmit} loading={submitting} fullWidth` - "Submeter"

**Critical Issues:**
- Line 504: Uses `variant="bordered"` but earlier uses `variant="bordered"` with same intent
- Line 640: Explicit `variant="filled"` when `default` is already `filled`

---

### 8. CIP Interpretação (Image Interpretation)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/cip/interpretacao/page.tsx` | 2 | `default`, `bordered` | Case list |
| `app/cip/interpretacao/[caseId]/page.tsx` | 7 | `default`, `bordered`, `filled` | Case solving |
| `app/cip/interpretacao/[caseId]/result/page.tsx` | 3 | `bordered`, `filled` | Results |

#### cip/interpretacao/[caseId]/page.tsx Buttons:
1. `Button onClick={() => router.push('/cip/interpretacao')}` - "Voltar"
2. `Button fullWidth` - "Voltar para Lista"
3. `Button variant="bordered" fullWidth onClick={() => router.refresh()}` - "Tentar Novamente"
4. `Button` - Step navigation (Prev)
5. `Button` - Step navigation (Next)
6. `Button variant="filled"` - "Submeter"
7. `Button` - Final step action

**Issue:** Inconsistent variant naming - uses both explicit `variant="filled"` and default

---

### 9. Caso Clínico (Case Study)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/caso-clinico/page.tsx` | 2 | `filled`, `bordered` | Case generation |
| `app/caso-clinico/components/CaseStudyCard.tsx` | 2 | `filled`, `bordered` | Card actions |

#### caso-clinico/page.tsx Buttons:
1. `Button variant="filled" size="large"` - "Gerar Caso Clínico"
2. `Button variant="bordered" size="small" onClick={handleNewCase}` - "Novo Caso"

#### CaseStudyCard.tsx Buttons:
1. `Button variant="filled" size="small" onClick={() => setSelected(0)}` - "Revelar Resposta"
2. `Button variant="bordered" size="small" onClick={onNewCase}` - "Novo Caso"

**Status:** ✅ Clean implementation, consistent sizing

---

### 10. FCR (Fractal Clinical Reasoning)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/fcr/page.tsx` | 3 | `filled`, `bordered` | Area selection |
| `app/fcr/[caseId]/page.tsx` | 5 | `bordered`, `default` | Case interaction |
| `app/fcr/[caseId]/result/page.tsx` | 3 | `bordered`, `default` | Results |
| `app/fcr/calibracao/page.tsx` | 0 | - | Calibration (no buttons) |

#### fcr/page.tsx Buttons:
1. `Button` - "Iniciar Caso" (Area selected)
2. `Button onClick={() => setSelectedArea(null)} fullWidth` - "Voltar"
3. `Button variant="bordered" onClick={() => router.push('/simulado')} fullWidth` - "Ir para Simulado"

#### fcr/[caseId]/page.tsx Buttons:
1. `Button variant="bordered" fullWidth` - "Tentar Novamente" (Error)
2. `Button` - "Responder"
3. `Button variant="bordered" fullWidth onClick={goBackLevel}` - "Voltar"
4. `Button` - "Próximo Nível"
5. `Button` - "Finalizar"

**Note:** Uses deprecated `className="darwin-nav-link"` on buttons (lines 341, 471)

---

### 11. Gerar Questão (AI Question Generator)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/gerar-questao/page.tsx` | 1 | `default` | Page link |
| `app/gerar-questao/components/GeneratedQuestionPreview.tsx` | 2 | `filled`, `bordered` | Preview actions |

#### GeneratedQuestionPreview.tsx Buttons:
1. `Button` - "Salvar Questão"
2. `Button variant="bordered"` - "Gerar Nova"

---

### 12. QGen (Question Generation Admin)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/qgen/page.tsx` | 0 | - | Tabs only |
| `app/qgen/components/QGenGenerateTab.tsx` | 1 | `default` | Generate |
| `app/qgen/components/QGenBatchTab.tsx` | 1 | `default` | Batch generate |
| `app/qgen/components/QGenExamTab.tsx` | 1 | `default` | Create exam |
| `app/qgen/components/QGenReviewTab.tsx` | 4 | `default`, `filled` | Review actions |

#### QGenReviewTab.tsx Buttons:
1. `Button` - "Atualizar"
2. `Button` - "Aprovar"
3. `Button` - "Rejeitar"
4. `Button` - "Editar"

**Critical Issue:** Line 288 uses `variant="filled" color="red"` but our Button doesn't support color on non-filled variants properly

---

### 13. DDL (Learning Gap Detection)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/ddl/page.tsx` | 8 | `default`, `tinted`, `bordered`, `plain` | DDL assessment |
| `app/ddl/test/page.tsx` | 3 | `default`, `plain` | DDL test mode |
| `components/ddl/ExamDDLResults.tsx` | 1 | `default` | Results action |
| `components/ddl/DDLQuestion.tsx` | 0 | - | Uses different UI |

#### ddl/page.tsx Buttons (CRITICAL ISSUES):
1. `Button` - "Ver Lacunas de Aprendizado"
2. `Button` - "Iniciar" (Assessment)
3. `Button` - "Responder"
4. `Button` - Navigation
5. `Button` - "Ver Resposta"
6. `Button onClick={handleReset}` - "Reiniciar"
7. `Button className="bg-indigo-600..." asChild>` - Custom styled ❌
8. `Button variant="tinted" asChild>` - Link wrapper
9. `Button variant="bordered" asChild>` - Link wrapper

**Critical Issues:**
- Line 564: Overrides button styles with `className` containing `bg-indigo-600` - breaks Apple Design System
- Line 564: Also uses `from-indigo-600 to-indigo-600` gradient classes
- Mix of `asChild` pattern and direct button usage

---

### 14. Conteúdo (Content)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/conteudo/page.tsx` | 0 | - | Grid of links |
| `app/conteudo/doencas/[id]/page.tsx` | 0 | - | Content display |
| `app/conteudo/medicamentos/[id]/page.tsx` | 0 | - | Content display |
| `app/conteudo/teoria/page.tsx` | 0 | - | Theory grid |
| `app/conteudo/teoria/[id]/page.tsx` | 3 | `plain`, `tinted`, `bordered` | Theory detail |
| `app/conteudo/teoria/[id]/QuestionGenerator.tsx` | 6 | `default`, `bordered` | Generate questions |

#### conteudo/teoria/[id]/page.tsx Buttons:
1. `Button variant="plain"` - "Voltar"
2. `Button variant="tinted" asChild>` - "Ver Referências"
3. `Button variant="bordered" asChild>` - "Gerar Questões"

#### QuestionGenerator.tsx Buttons:
1. `Button` - "Gerar Questão"
2. `Button` - "Salvar Questão"
3. `Button variant="bordered"` - "Gerar Nova"
4. `Button` - "Tentar Novamente" (Error)
5. `Button` - "Fechar" (Modal)

---

### 15. Desempenho (Performance Dashboard)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/desempenho/page.tsx` | 1 | `default` | Dashboard actions |

#### desempenho/page.tsx Buttons:
1. `Button` - "Ver Recomendações" (in WeakAreasCard)

---

### 16. IA Orientação (AI Guidance)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/ia-orientacao/page.tsx` | 2 | `default`, `tinted` | Analysis actions |

#### ia-orientacao/page.tsx Buttons:
1. `Button onClick={handleLoadPerformance} loading={loadingPerformance}` - "Analisar Desempenho"
2. `Button` - "Ver Análise Completa"

---

### 17. Métodos de Estudo (Study Methods)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/metodos-estudo/page.tsx` | 0 | - | Method cards |
| `app/metodos-estudo/[method]/page.tsx` | 0 | - | Method detail |
| `app/metodos-estudo/pomodoro/components/PomodoroTimer.tsx` | 2 | `plain`, `small` | Timer controls |
| `app/metodos-estudo/gestao-tempo/components/WeeklyPlanner.tsx` | 3 | `plain`, `small` | Planner actions |

#### PomodoroTimer.tsx Buttons:
1. `Button variant="plain" size="small"` - "Cancelar"
2. `Button size="small"` - "Salvar"

#### WeeklyPlanner.tsx Buttons:
1. `Button variant="plain" size="small"` - "Cancelar"
2. `Button size="small"` - "Adicionar"
3. `Button variant="plain" size="small"` - "Imprimir"

---

### 18. Montar Prova (Custom Exam)

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `app/montar-prova/page.tsx` | 2 | `default`, `bordered` | Exam builder |

#### montar-prova/page.tsx Buttons:
1. `Button` - "Iniciar Prova"
2. `Button variant="bordered"` - "Voltar"

---

### 19. Global UI Components

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `components/ui/EmptyState.tsx` | 1 | `default` | Empty state action |
| `components/ui/Error.tsx` | 0 | - | No buttons |
| `components/ui/FeatureState.tsx` | 1 | dynamic | Feature actions |
| `components/ui/ExampleUsage.tsx` | 5 | various | Demo buttons |

#### ExampleUsage.tsx Buttons (NOT PRODUCTION):
1. `Button variant="filled" fullWidth` - Success demo
2. `Button variant="filled" color="red" fullWidth` - Error demo
3. `Button variant="bordered"` - Cancel
4. `Button variant="plain" fullWidth` - Info
5. `Button variant="tinted"` - Help

**Note:** This file is for documentation only, not production

#### FeatureState.tsx Buttons:
1. `Button variant={action.variant ?? 'secondary'}` - Dynamic variant

**CRITICAL ISSUE:** Uses deprecated `variant="secondary"` as fallback

---

### 20. AI Components

| File | Button Count | Variants Used | Notes |
|------|--------------|---------------|-------|
| `components/ai/ExplanationPanel.tsx` | 3 | `plain`, `bordered` | Explanation actions |

#### ExplanationPanel.tsx Buttons:
1. `Button variant="plain" size="small"` - "Explicar"
2. `Button variant="plain" size="small"` - "Tentar novamente" (Error)
3. `Button variant="bordered" size="small"` - "Explicar com IA"

**Issue:** Line 71 has custom styling `className="text-xs text-red-400..."` that overrides button styles

---

## Issue Summary

### Critical Issues (Must Fix) - ✅ FIXED

| Issue | Location | Problem | Fix | Status |
|-------|----------|---------|-----|--------|
| 1 | `ddl/page.tsx:564` | Custom `className` overrides button styles with `bg-indigo-600` | Changed to `color="blue"` | ✅ Fixed |
| 2 | `FeatureState.tsx:78` | Uses deprecated `variant="secondary"` | Changed to `variant="tinted"` | ✅ Fixed |
| 3 | `ExplanationPanel.tsx:71` | Custom styled Button breaking design system | Changed to native `<button>` | ✅ Fixed |

### Remaining Issues (Non-Critical)

| Issue | Location | Problem | Priority |
|-------|----------|---------|----------|
| 4 | `simulado/[examId]/result/page.tsx:344` | Invalid `size="small"` prop | Low |
| 5 | `qgen/components/QGenReviewTab.tsx:288` | `variant="filled" color="red"` verify | Low |

### Minor Issues (Should Fix)

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| 5 | Multiple files | Uses deprecated `className="darwin-nav-link"` | Remove or replace with standard styling |
| 6 | Multiple files | Inconsistent `fullWidth` vs `className="w-full"` | Standardize on `fullWidth` prop |
| 7 | `simulado/[examId]/page.tsx:640` | Explicit `variant="filled"` when it's the default | Remove unnecessary prop |
| 8 | `cip/[puzzleId]/page.tsx:640` | Same as above | Remove unnecessary prop |
| 9 | `ExplanationPanel.tsx:71` | Custom text color override | Use standard error button pattern |
| 10 | Multiple files | Duplicate "Voltar" button implementations | Create reusable BackButton component |

### Code Quality Issues

| Issue | Count | Description |
|-------|-------|-------------|
| Duplicate back buttons | 15+ | Same "Voltar" pattern repeated |
| Inconsistent error handling | 8 | Error states use different button patterns |
| Mixed size props | 5 | Some use `size="small"`, others implicit |

---

## Recommendations

### 1. Standardize Button Patterns

Create reusable button patterns for common actions:

```tsx
// BackButton.tsx
export const BackButton = ({ onClick }: { onClick?: () => void }) => (
  <Button variant="bordered" onClick={onClick} leftIcon={<ArrowLeft />}>
    Voltar
  </Button>
)

// PrimaryAction.tsx
export const PrimaryAction = ({ children, ...props }: ButtonProps) => (
  <Button variant="filled" {...props}>{children}</Button>
)

// ErrorRetry.tsx
export const ErrorRetry = ({ onRetry }: { onRetry: () => void }) => (
  <Button variant="bordered" onClick={onRetry} leftIcon={<RefreshCw />}>
    Tentar Novamente
  </Button>
)
```

### 2. Fix Critical Issues Immediately

1. Remove custom `bg-indigo-600` class from `ddl/page.tsx:564`
2. Update `FeatureState.tsx` to use `variant="tinted"`
3. Verify color prop works correctly with `variant="filled"`

### 3. Remove Deprecated Patterns

- Remove all `darwin-nav-link` className usage from buttons
- Standardize on `fullWidth` prop instead of `className="w-full"`

### 4. Documentation

Add JSDoc comments to Button component explaining:
- When to use each variant
- Default values
- Proper usage patterns

---

## Button Variant Usage Statistics

| Variant | Count | Percentage | Notes |
|---------|-------|------------|-------|
| `filled` (default) | ~120 | 60% | Primary actions |
| `bordered` | ~50 | 25% | Secondary actions |
| `tinted` | ~15 | 7.5% | Subtle actions |
| `plain` | ~12 | 6% | Text actions |
| `glass` | ~0 | 0% | Not used |
| `borderless` | ~0 | 0% | Not used |

---

## Appendix: Button Size Usage

| Size | Count | Notes |
|------|-------|-------|
| `small` | ~25 | Compact UIs |
| `medium` (default) | ~170 | Standard |
| `large` | ~2 | Featured actions |

---

## Audit Completed By
**AI Agent** - Comprehensive code analysis  
**Date:** 2026-02-22  
**Total Files Analyzed:** 50+  
**Total Button Instances:** 200+
