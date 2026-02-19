# Demo Seed Workflow (Supabase + Vercel)

This checklist makes the web demo usable end-to-end (content, exams, and flashcards).

## 1) Bootstrap schema + migrations (Supabase Cloud)

### Recommended (one-shot)

From repository root:

```bash
bash deploy.sh --generate
```

1. Open Supabase Dashboard → SQL Editor.
2. Paste `infrastructure/supabase/deploy_consolidated.sql`.
3. Run it once (this includes `schema.sql`, migrations, and the demo seeds).

### Manual (if you prefer)

1. Run `infrastructure/supabase/schema.sql` first.
2. Then run migrations in `infrastructure/supabase/migrations/` (at minimum: `019_medical_content_tables.sql`).
3. Confirm `medical_diseases` and `medical_medications` were created.

## 2) Seed learning baseline (questions + public exam)

Run in SQL Editor:

1. `infrastructure/supabase/seed/pilot_test_data.sql`

This creates the minimum viable exam flow (`/simulado`).

## 3) Seed system flashcards

Run in SQL Editor:

1. `infrastructure/supabase/seed/expansion/flashcard_decks_system.sql`
2. One or more area files:
   - `infrastructure/supabase/seed/expansion/flashcards_clinica_medica_200.sql`
   - `infrastructure/supabase/seed/expansion/flashcards_cirurgia_200.sql`
   - `infrastructure/supabase/seed/expansion/flashcards_pediatria_200.sql`
   - `infrastructure/supabase/seed/expansion/flashcards_ginecologia_200.sql`
   - `infrastructure/supabase/seed/expansion/flashcards_saude_coletiva_200.sql`

## 4) Import Darwin-MFC medical content

From repository root:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
pnpm seed:medical-content
```

This bulk-imports/upserts the full Darwin-MFC diseases/medications dataset into Supabase.

Important: run this after migration 019. Without import, `/conteudo` will show empty states.

## 5) Validate demo routes

Anonymous:

1. `/conteudo`, `/conteudo/doencas`, `/conteudo/medicamentos` load.
2. Search, filters, and pagination work with URL params.
3. Disease/medication detail pages open with valid IDs.

Logged-in user:

1. `/simulado` shows at least one public exam.
2. `/flashcards` shows system decks and allows study session.

## 6) Vercel env vars

Set in Vercel project settings:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Only for local/CLI seeding:

1. `SUPABASE_SERVICE_ROLE_KEY` (do not expose in client-side env).
