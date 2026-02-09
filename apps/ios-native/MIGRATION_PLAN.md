# Migracao Web -> iOS Nativo

## Objetivo

Migrar os fluxos principais da plataforma web para um app iOS 100% nativo (SwiftUI), priorizando uso diario por estudantes e publicacao na App Store.

## Fase 1 (MVP iOS)

- Login por email/senha (Supabase Auth)
- Home com acesso rapido
- Flashcards (decks pendentes)
- Desempenho (resumo de dominio e atividade)
- Conta (logout)

## Fase 2 (Core Product)

- Simulado completo
- Revisao de questoes
- Resultados detalhados (TRI)
- Trilhas de estudo

## Fase 3 (Diferencial Mobile)

- Push notifications para revisoes
- Offline-first para flashcards
- Widgets iOS (streak/daily goal)
- Biometria (Face ID) para desbloqueio rapido

## Endpoints iniciais usados

- `POST /auth/v1/token?grant_type=password` (Supabase)
- `POST /auth/v1/token?grant_type=refresh_token` (Supabase)
- `GET /api/flashcards/due`
- `GET /api/learner/profile`

## Criterios de pronto para App Store

- Todos os fluxos criticos sem crash em iPhone real
- Time de resposta aceitavel em rede movel
- Assets de App Store completos (icone, screenshots, privacidade)
- TestFlight com feedback de usuarios reais
