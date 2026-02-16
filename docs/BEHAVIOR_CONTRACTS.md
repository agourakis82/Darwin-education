# Cross-Platform Behavior Contracts (Web + iOS)

This document defines behavior-level parity between `apps/web` and `apps/ios-native`.
UI can differ by platform conventions, but outcomes must remain equivalent.

## 1. Auth

- Sign in with Supabase email/password returns an authenticated session.
- Invalid credentials return a user-safe error state.
- Expired refresh token forces sign-out and requires login.
- Protected resources require bearer auth and produce an unauthorized state when missing.

## 2. Home

- Home summarizes learner state using current backend data.
- Metrics must come from runtime data, not static targets.
- Loading, empty, and error states are explicitly represented.

## 3. Simulados

- Public exams list only exams marked public.
- Exam metadata parity: title, question count, time limit.
- Unauthorized users see access guard and clear guidance.

## 4. Flashcards

- Due cards/decks represent current review state.
- Zero due cards produce a successful empty state, not an error.
- Failed fetch produces recoverable error with retry.

## 5. Conteudo Medico

- Disease/medication search is query-driven and paginated.
- When medical tables are not yet seeded, show explicit empty state.
- Results derive from Supabase-backed source of truth.

## 6. Desempenho

- Summary uses learner profile metrics from backend.
- Missing metrics default to safe fallback values.
- Error state cannot block navigation.

## 7. CIP and Trilhas

- Feature flags can gate module rollout.
- Disabled modules must fail closed with user-facing explanation.
- Enabled modules must keep auth and error semantics aligned with web.

## 8. State Model and Failures

Every feature must map these states consistently:

1. `loading`
2. `content`
3. `empty`
4. `error`
5. `offline` (where supported)
6. `unauthorized`

## 9. Acceptance Checklist

For each feature before rollout:

1. Auth rules match web.
2. Success output matches backend records.
3. Empty state uses explicit messaging.
4. Error state includes retry or safe fallback.
5. Accessibility labels and Dynamic Type are validated on iOS.
