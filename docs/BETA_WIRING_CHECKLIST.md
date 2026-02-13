# Darwin Education — Beta Wiring Checklist (Web)

Este checklist garante que o **web app** está “beta-ready” (V6 UI + wiring Supabase) com degradação elegante para recursos opcionais.

## 1) Ambiente (`apps/web/.env.local`)

**Obrigatório (web + auth + dados):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Recomendado (server-side/admin tooling):**
- `SUPABASE_SERVICE_ROLE_KEY`
  - Usado para operações administrativas (ex.: cache/telemetria de IA e alguns fluxos batch).
  - Se não estiver definido, o app mantém UX (V6) e recursos de IA podem operar **sem cache** (quando aplicável).

**IA (opcional):**
- Para Grok (xAI, OpenAI-compatible):
  - `XAI_API_KEY` **ou** `GROK_API_KEY`
- Para Minimax (API nativa):
  - `MINIMAX_API_KEY`
  - `MINIMAX_API_URL` (default do SDK: `https://api.minimax.chat/v1`)
  - `MINIMAX_MODEL` (opcional)
  - `MINIMAX_GROUP_ID` (opcional)
  - `MINIMAX_API_STYLE` (`minimax` | `openai`, opcional)
- Cache TTLs (opcional):
  - `AI_CACHE_TTL_EXPLAIN_DAYS`, `AI_CACHE_TTL_GENERATE_QUESTION_DAYS`, `AI_CACHE_TTL_CASE_STUDY_DAYS`, `AI_CACHE_TTL_SUMMARY_DAYS`

**Flags UX (opcional):**
- `NEXT_PUBLIC_ENABLE_ONBOARDING=false` (recomendado para beta para não bloquear o hero no primeiro acesso)

## 2) Supabase — migrações

Para evitar drift de schema entre features, trate o Supabase como **fonte de verdade** e aplique migrações/seed.

### Recomendado (produção Supabase, “CLI puro”)

Este repo mantém as migrações “beta web” no formato padrão do Supabase CLI em:

- `infrastructure/supabase/supabase/migrations/`

Para aplicar no seu projeto hospedado (remoto):

```bash
# (Opcional) 1 comando para beta
bash scripts/db/bootstrap_beta_supabase_cli.sh

# OU o passo-a-passo abaixo:

# 1) Autentique o Supabase CLI
./apps/web/node_modules/.bin/supabase login

# 2) Link no projeto (usa o ref extraído do NEXT_PUBLIC_SUPABASE_URL)
./apps/web/node_modules/.bin/supabase link --workdir infrastructure/supabase --project-ref <seu_project_ref>

# 3) Push das migrações pendentes
./apps/web/node_modules/.bin/supabase db push --workdir infrastructure/supabase --linked --yes

# 4) Seed do Darwin-MFC (215 doenças + 602 meds)
set -a && source apps/web/.env.local && set +a
pnpm seed:medical-content
```

Migração-chave para a beta web (mínimo necessário para Conteúdo + AI cache + streaks + logs):
- `infrastructure/supabase/supabase/migrations/20260212160000_beta_web_required_tables.sql`

> Nota: `supabase link` pode pedir **database password** no prompt (não precisa passar por argumento).

### Alternativa (SQL Editor, sem Supabase CLI)

Rode a partir da raiz do repo:

```bash
bash deploy.sh --generate
```

Isso gera `infrastructure/supabase/deploy_consolidated.sql` com **schema + migrações + seeds**.  
Depois, cole o arquivo inteiro no **Supabase Dashboard → SQL Editor** e clique **Run**.

Sugestão: considere “beta mínimo” como **até a última migration existente** (ex.: `019_medical_content_tables.sql`), mas inclua `016_research_psychometrics.sql` se quiser habilitar a camada Pesquisa/Psicometria (BKT/HLR/DIF/RT-IRT).

## 3) Feature → tabelas (contrato prático)

**Core (beta testers):**
- Home (contadores): `questions`, `medical_diseases`, `medical_medications`
- Simulado (clássico + CAT): `exams`, `exam_attempts`, `questions`
- Flashcards: `flashcard_decks`, `flashcards`, `flashcard_review_states`, `flashcard_review_logs`
- Trilhas: `study_paths`, `study_modules`, `user_path_progress`
- Conteúdo:
  - Doenças: `medical_diseases`
  - Medicamentos: `medical_medications`
  - Teoria: `theory_topics_generated` (tem fallback local quando a tabela não existe)

**Recursos avançados (opcionais na beta):**
- Pesquisa/Psicometria (BKT/HLR/DIF/RT-IRT): `study_activity_log` (se ausente, endpoints degradam/retornam vazio com logs informativos)
- Perfis MIRT / previsões: `exam_attempts`
- Cache de IA / métricas de custo: `ai_response_cache`

## 4) Health checks rápidos

**API de contadores (fonte Supabase com fallback):**
- `GET /api/platform/stats`

**Smoke test automatizado (V6 + wiring, público + auth):**
- `pnpm --filter @darwin-education/web test:e2e -- e2e/v6-wiring.spec.ts`
  - Requer `apps/web/e2e/.auth/user.json` para o sweep autenticado (o teste já faz `skip` se não existir).

**Build sanity:**
- `pnpm --filter @darwin-education/web type-check`
- `pnpm --filter @darwin-education/web build`

## 5) Sem chave de IA (comportamento esperado)

Quando nenhuma chave de IA está definida, rotas de IA retornam `503` com:
- `error: "servico_de_ia_indisponivel"`
- `message` + `instructions` + `requiredKeys`

Isso evita UX “quebrada” (500/stacktrace) e mantém o restante do app operável para beta.
