# Quick Beta Setup - Darwin Education

**Objetivo**: Verificar e preparar o banco para 50 beta-testers em **30 minutos**.

---

## ✅ CHECKLIST RÁPIDO

Execute cada passo e marque quando concluído:

### **Passo 1: Verificar estado atual do banco** ⏱️ 5 min

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → Seu projeto → **SQL Editor**

2. Cole e execute o conteúdo de `VERIFY_CONTENT_STATUS.sql`

3. Anote os resultados:
   - [ ] Questões: _____ (meta: 90+)
   - [ ] Flashcards: _____ (meta: 1000)
   - [ ] Exames públicos: _____ (meta: 1+)
   - [ ] Study paths públicas: _____ (meta: 3+)
   - [ ] Doenças (medical_diseases): _____ (meta: 300+)
   - [ ] Medicamentos (medical_medications): _____ (meta: 500+)

**Resultado esperado**:
- ✅ Verde: Tudo pronto, pule para Passo 4
- ⚠️ Amarelo: Alguns dados faltando, continue no Passo 2
- ❌ Vermelho: Banco vazio, execute Passo 2 e 3

---

### **Passo 2: Aplicar migrations beta** ⏱️ 10 min

**Se as migrations beta ainda não foram aplicadas:**

#### Opção A: Supabase CLI (Recomendado)

```bash
# 1. Navegar para pasta do Supabase
cd infrastructure/supabase

# 2. Verificar se está linkado ao projeto
supabase status

# 3. Se não estiver linkado:
supabase link --project-ref <SEU_PROJECT_REF>

# 4. Aplicar migrations
supabase db push
```

#### Opção B: Manual via Dashboard (se CLI não funcionar)

Execute **uma por vez** no SQL Editor (ordem importa!):

1. ✅ `supabase/migrations/20260212160000_beta_web_required_tables.sql`
2. ✅ `supabase/migrations/20260213190000_beta_web_learning_content_schema.sql`
3. ✅ `supabase/migrations/20260213191000_beta_web_flashcards_system_decks_seed.sql`
4. ✅ `supabase/migrations/20260213192000_beta_web_flashcards_system_cards_seed.sql` ⚠️ **425 KB - pode demorar 30s**
5. ✅ `supabase/migrations/20260213193000_beta_web_study_paths_seed.sql`
6. ✅ `supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql` ⚠️ **131 KB**
7. ✅ `supabase/migrations/20260213210000_beta_invites.sql`

**Como verificar se deu certo**:
```sql
-- Rodar no SQL Editor
SELECT COUNT(*) as flashcards FROM flashcards;
SELECT COUNT(*) as questions FROM questions;
```

Deve retornar ~989 flashcards e ~90 questões.

---

### **Passo 3: Importar conteúdo médico (Darwin-MFC)** ⏱️ 5 min

**Execute do diretório raiz do projeto**:

```bash
# Verificar se tem env vars configuradas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Se não tiver, exportar:
export NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Importar conteúdo médico
pnpm seed:medical-content
```

**O que esse comando faz**:
- Importa ~368 doenças do Darwin-MFC
- Importa ~690 medicamentos
- Upsert (não duplica se rodar 2x)

**Tempo estimado**: 2-3 minutos para processar todos os dados.

**Como verificar**:
```sql
SELECT COUNT(*) FROM medical_diseases;
SELECT COUNT(*) FROM medical_medications;
```

---

### **Passo 4: Criar simulado público** ⏱️ 3 min

**Se ainda não existe um simulado público completo:**

```sql
-- 1. Criar banco de questões (se não existir)
INSERT INTO question_banks (id, name, description, source, year_start, is_active)
VALUES (
  'e2025000-0000-0000-0000-000000000001',
  'ENAMED 2025',
  'Questões oficiais do ENAMED 2025 calibradas com IRT',
  'official_enamed',
  2025,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar simulado público com 90 questões
INSERT INTO exams (id, title, description, is_public, time_limit_minutes, areas)
VALUES (
  gen_random_uuid(),
  'Simulado ENAMED 2025 - Completo',
  'Simulado com 90 questões oficiais do ENAMED 2025, calibradas com IRT para pontuação precisa.',
  TRUE,
  300, -- 5 horas
  ARRAY['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva']
)
RETURNING id;

-- 3. Anotar o ID retornado (ex: abc123-...)
-- 4. Adicionar questões ao simulado (substitua <EXAM_ID>)
INSERT INTO exam_questions (exam_id, question_id, order_index)
SELECT
  '<EXAM_ID>', -- Substituir pelo ID do passo 2
  id,
  ROW_NUMBER() OVER (ORDER BY area, RANDOM()) - 1
FROM questions
WHERE bank_id = 'e2025000-0000-0000-0000-000000000001'
LIMIT 90;
```

**Verificar**:
```sql
SELECT
  e.title,
  COUNT(eq.question_id) as total_questions
FROM exams e
LEFT JOIN exam_questions eq ON eq.exam_id = e.id
WHERE e.is_public = TRUE
GROUP BY e.id, e.title;
```

Deve mostrar 1 exame com 90 questões.

---

### **Passo 5: Testar app em produção** ⏱️ 5 min

1. **Criar usuário de teste**:
   - Supabase Dashboard → Authentication → Users → **Add user**
   - Email: `beta.test@darwineducation.com`
   - Password: `Test@Beta2026`
   - ✅ **Auto Confirm User**

2. **Acessar app em produção**:
   - URL: Seu deploy no Vercel (ex: `darwin-education.vercel.app`)
   - Login com o usuário de teste

3. **Smoke test** (testar rapidamente):
   - [ ] Login funcionou?
   - [ ] Home carrega 6 cards de features?
   - [ ] `/simulado` mostra pelo menos 1 simulado público?
   - [ ] Consegue criar e responder 1 questão?
   - [ ] `/flashcards` mostra decks do sistema?
   - [ ] `/conteudo/doencas` carrega lista de doenças?

**Se algum item falhou**:
- Checar console do navegador (F12) por erros
- Verificar Vercel logs
- Verificar env vars no Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 📊 RESULTADO ESPERADO

Após completar todos os passos, rode `VERIFY_CONTENT_STATUS.sql` novamente.

Deve mostrar:

```
Tipo                          | Total | Status
------------------------------|-------|------------------
Questões                      | 90    | ✅ MÍNIMO VIÁVEL
Flashcards                    | 989   | ✅ PRONTO
Exames Públicos              | 1     | ✅ PRONTO
Study Paths Públicas         | 3-5   | ✅ PRONTO
Doenças (Darwin-MFC)         | 368   | ✅ PRONTO
Medicamentos (Darwin-MFC)    | 690   | ✅ PRONTO
```

**Tamanho do banco**: ~50-100 MB (bem dentro do limite gratuito de 500 MB)

---

## ⚠️ TROUBLESHOOTING

### Erro: "relation does not exist"
**Causa**: Migration não foi aplicada
**Fix**: Volte ao Passo 2 e aplique as migrations na ordem correta

### Erro: "permission denied for table X"
**Causa**: RLS policies não foram criadas
**Fix**: Verifique se `20260212160000_beta_web_required_tables.sql` rodou completamente

### Import médico falha com "SUPABASE_SERVICE_ROLE_KEY not found"
**Causa**: Env var não configurada
**Fix**:
```bash
# Copie a service role key do Supabase Dashboard → Settings → API
export SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Simulado público não aparece no app
**Causa**: Cache do frontend ou query incorreta
**Fix**:
1. Hard refresh (Ctrl+Shift+R)
2. Verificar se `is_public = TRUE` no banco
3. Verificar se há questões linkadas em `exam_questions`

---

## 🚀 PRÓXIMO PASSO

Com o conteúdo pronto, você pode:

1. ✅ **Configurar beta gate** (ver `BETA_LAUNCH_50.md` - seção "Sistema de Convites")
2. ✅ **Configurar monitoramento** (Sentry para erros)
3. ✅ **Preparar comunicação** (email templates, Discord/Telegram)
4. ✅ **Lançar para primeira onda** (10 pessoas)

**Arquivo de referência completo**: `BETA_LAUNCH_50.md`

---

## 📝 NOTAS IMPORTANTES

- **Questões**: 90 é suficiente para beta, mas considere adicionar mais questões por área se possível (meta: 200 total)
- **Simulado público**: Com 90 questões, o simulado é viável mas não representa o ENAMED completo (100 questões). Considere criar um simulado "reduzido" de 50 questões também para testes mais rápidos.
- **Backup**: Antes de aplicar migrations em produção, faça backup do banco via Supabase Dashboard → Database → Backups

---

**Tempo total estimado**: 30-40 minutos
**Pré-requisitos**: Acesso ao Supabase Dashboard, Vercel, env vars configuradas
