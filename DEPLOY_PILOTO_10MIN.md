# 🚀 Deploy Piloto Darwin Education (10 minutos)

## Objetivo
Colocar Darwin Education no ar para testar com usuários reais, **SEM custo e SEM risco**.

---

## ✅ Pré-requisitos (5 minutos de cadastro)

1. **Conta GitHub** (se não tiver): https://github.com/signup
2. **Conta Vercel** (login com GitHub): https://vercel.com/signup
3. **Conta Supabase** (login com GitHub): https://supabase.com

---

## 📋 Passo 1: Configurar Supabase (3 minutos)

### 1.1 Criar Projeto

1. Acesse: https://supabase.com/dashboard
2. Click **"New Project"**
3. Preencha:
   - **Name**: `darwin-education`
   - **Database Password**: Gere uma senha forte (GUARDAR!)
   - **Region**: `South America (São Paulo)` ← Mais próximo do Brasil!
   - **Plan**: Free
4. Click **"Create new project"**
5. Aguarde 2 minutos (criando banco)

### 1.2 Rodar Migrations

1. Na sidebar: **SQL Editor**
2. Click **"+ New query"**
3. Copie TODO o conteúdo de: `infrastructure/supabase/schema.sql`
4. Cole no editor
5. Click **"Run"** (canto inferior direito)
6. Aguarde mensagem: **"Success. No rows returned"**

### 1.3 Pegar Credenciais

1. Na sidebar: **Settings** → **API**
2. Copie:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (chave longa)

---

## 🚀 Passo 2: Deploy no Vercel (5 minutos)

### 2.1 Push para GitHub (se ainda não estiver)

```bash
cd /home/demetrios/Darwin-education

# Verificar se tem remote
git remote -v

# Se NÃO tiver, criar repo no GitHub e:
git remote add origin https://github.com/SEU-USUARIO/darwin-education.git
git branch -M main
git push -u origin main
```

### 2.2 Conectar Vercel ao GitHub

1. Acesse: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Autorize Vercel acessar seu GitHub (se primeira vez)
4. Selecione: `darwin-education`
5. Click **"Import"**

### 2.3 Configurar Variáveis de Ambiente

**ANTES de clicar Deploy**, configure:

1. Expanda **"Environment Variables"**
2. Adicione cada variável abaixo:

```bash
# Supabase (copiar do Supabase → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-aqui

# NextAuth (gerar senha aleatória)
NEXTAUTH_SECRET=cole-resultado-do-comando-abaixo
NEXTAUTH_URL=https://seu-app.vercel.app

# App Config
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

3. Click **"Deploy"**
4. Aguarde 2-3 minutos

### 2.4 Pegar URL do Deploy

Após deploy concluir:
- URL será algo como: `https://darwin-education-xxx.vercel.app`
- Copie a URL

### 2.5 Atualizar NEXTAUTH_URL

1. Vercel Dashboard → Seu projeto
2. **Settings** → **Environment Variables**
3. Edite `NEXTAUTH_URL`:
   - Valor: `https://darwin-education-xxx.vercel.app` (sua URL real)
4. **Save**
5. **Deployments** → Click nos 3 pontinhos do último deploy → **Redeploy**

---

## 🎓 Passo 3: Configurar Autenticação Supabase (2 minutos)

### 3.1 Adicionar URL do Vercel no Supabase

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://darwin-education-xxx.vercel.app`
3. **Redirect URLs** → Add URL:
   ```
   https://darwin-education-xxx.vercel.app/auth/callback
   https://darwin-education-xxx.vercel.app/api/auth/callback/*
   ```
4. **Save**

### 3.2 Criar Usuário de Teste

1. Supabase → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: `test@test.com`
   - **Password**: `Test@123456`
   - **Auto Confirm User**: ✅ ON
4. Click **"Create user"**

---

## ✅ Passo 4: Inserir Dados de Teste (5 minutos)

### 4.1 Criar Exam de Teste

```sql
-- Supabase → SQL Editor → New query

-- 1. Criar banco de questões
INSERT INTO question_banks (id, name, source_type, description, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Teste Piloto',
  'official_enamed',
  'Questões de teste para validação',
  true
);

-- 2. Criar questões (5 questões simples)
INSERT INTO questions (id, bank_id, year, stem, options, correct_index, explanation, irt_difficulty, irt_discrimination, irt_guessing, area, difficulty)
VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual é o órgão responsável pela produção de insulina?',
  '[
    {"letter": "A", "text": "Fígado"},
    {"letter": "B", "text": "Pâncreas"},
    {"letter": "C", "text": "Rim"},
    {"letter": "D", "text": "Estômago"}
  ]'::jsonb,
  1,
  'O pâncreas é o órgão responsável pela produção de insulina através das células beta das ilhotas de Langerhans.',
  0.0,
  1.2,
  0.25,
  'clinica_medica',
  'facil'
),
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual antibiótico é primeira linha para pneumonia comunitária?',
  '[
    {"letter": "A", "text": "Amoxicilina"},
    {"letter": "B", "text": "Ciprofloxacino"},
    {"letter": "C", "text": "Vancomicina"},
    {"letter": "D", "text": "Gentamicina"}
  ]'::jsonb,
  0,
  'Amoxicilina é o antibiótico de primeira escolha para pneumonia adquirida na comunidade em pacientes ambulatoriais.',
  0.3,
  1.0,
  0.25,
  'clinica_medica',
  'medio'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual a idade gestacional ideal para o parto cesáreo eletivo?',
  '[
    {"letter": "A", "text": "37 semanas"},
    {"letter": "B", "text": "38 semanas"},
    {"letter": "C", "text": "39 semanas"},
    {"letter": "D", "text": "40 semanas"}
  ]'::jsonb,
  2,
  'O parto cesáreo eletivo deve ser realizado preferencialmente com 39 semanas completas para reduzir morbidade respiratória neonatal.',
  -0.2,
  1.1,
  0.25,
  'ginecologia_obstetricia',
  'medio'
),
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual o esquema vacinal da BCG?',
  '[
    {"letter": "A", "text": "Dose única ao nascer"},
    {"letter": "B", "text": "Duas doses no primeiro ano"},
    {"letter": "C", "text": "Três doses aos 2, 4 e 6 meses"},
    {"letter": "D", "text": "Dose única aos 12 meses"}
  ]'::jsonb,
  0,
  'A vacina BCG é administrada em dose única, preferencialmente ao nascer ou até os 4 anos e 11 meses.',
  -0.5,
  0.9,
  0.25,
  'pediatria',
  'facil'
),
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual incisão é mais utilizada para apendicectomia aberta?',
  '[
    {"letter": "A", "text": "McBurney"},
    {"letter": "B", "text": "Pfannenstiel"},
    {"letter": "C", "text": "Mediana"},
    {"letter": "D", "text": "Kocher"}
  ]'::jsonb,
  0,
  'A incisão de McBurney (oblíqua no quadrante inferior direito) é a mais utilizada para apendicectomia aberta.',
  0.1,
  1.0,
  0.25,
  'cirurgia',
  'facil'
);

-- 3. Criar exame
INSERT INTO exams (id, title, description, question_count, duration_minutes, pass_threshold, is_active, question_ids)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Simulado Piloto - 5 Questões',
  'Simulado de teste para validação do sistema',
  5,
  30,
  600,
  true,
  ARRAY[
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  ]::uuid[]
);
```

**Click RUN!**

---

## 🎉 Passo 5: TESTAR! (2 minutos)

### 5.1 Acessar Aplicação

1. Abra: `https://darwin-education-xxx.vercel.app`
2. Deve ver homepage do Darwin Education

### 5.2 Login

1. Click **"Login"** ou acesse `/login`
2. Email: `test@test.com`
3. Senha: `Test@123456`
4. Login deve funcionar!

### 5.3 Fazer Simulado

1. Homepage → Click **"Simulado"**
2. Deve ver: "Simulado Piloto - 5 Questões"
3. Click **"Iniciar Simulado"**
4. Responda as 5 questões
5. Click **"Finalizar"**
6. Veja resultado com TRI score!

### 5.4 Testar Flashcards

1. Vá para página de Review do simulado
2. Click **"Salvar"** em uma questão errada
3. Vá para `/flashcards/study`
4. Deve ver o flashcard criado!
5. Avalie (1-4)
6. Próxima revisão agendada!

---

## ✅ Checklist Piloto Funcionando

- [ ] Deploy Vercel funcionando
- [ ] Supabase conectado
- [ ] Login funcionando
- [ ] 5 questões inseridas
- [ ] Simulado aparece na lista
- [ ] Consegue fazer simulado completo
- [ ] Score TRI calculado corretamente
- [ ] Review de questões funciona
- [ ] Salvar flashcard funciona
- [ ] Revisar flashcard funciona

---

## 📊 Métricas do Piloto

### Free Tier Limits:

```yaml
Supabase Free:
  PostgreSQL: 500 MB
  Usuários: 50,000 ativos/mês
  Storage: 1 GB
  Bandwidth: 2 GB

Vercel Free:
  Builds: 100/mês
  Bandwidth: 100 GB/mês
  Execuções: 100 GB-Horas/mês
  Serverless: 1000 horas/mês
```

### Capacidade Estimada:

```
✅ 100-200 alunos ativos/mês
✅ 1.000-2.000 questões no banco
✅ 500-1.000 flashcards
✅ 50-100 simulados simultâneos
✅ 10.000-20.000 page views/mês
```

**Suficiente para validar completamente o sistema!**

---

## 🚀 Após Validar o Piloto

### Se funcionar bem (usuários satisfeitos):

**Opção 1**: Continuar no Free até atingir limites
- Custo: R$ 0/mês
- Quando: Até ~100-200 alunos ativos

**Opção 2**: Migrar para Proxmox (economizar)
- Custo: R$ 0/mês
- Quando: Quer controle total
- Tempo: ~30 minutos de migração

**Opção 3**: Escalar no Vercel/Supabase
- Custo: ~R$ 200/mês (quando necessário)
- Quando: > 200 alunos ativos
- Vantagem: Zero gerenciamento

---

## 🆘 Troubleshooting

### Deploy falhou no Vercel

```bash
# Ver logs no Vercel Dashboard → Deployments → Click no deploy → Logs
# Erros comuns:
# - Build error: Verificar next.config.ts
# - Type error: Rodar pnpm type-check local
```

### Não conecta no Supabase

```bash
# Verificar variáveis ambiente no Vercel
# Devem ser NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
# Verificar se não tem espaços ou quebras de linha
```

### Login não funciona

```bash
# Supabase → Authentication → URL Configuration
# Verificar se adicionou URL do Vercel em "Redirect URLs"
```

### Questões não aparecem

```bash
# Supabase → SQL Editor → Rodar:
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM exams;
# Se retornar 0, rodar o INSERT novamente
```

---

## 🎯 Próximo Passo

**Validou o piloto? Ótimo!**

Então escolha:
1. **Ficar no Free** (enquanto funcionar)
2. **Migrar para Proxmox** (seguir GUIA_PROXMOX_COMPLETO.md)
3. **Escalar no Vercel** (quando crescer)

**Algum problema? Me avise que resolvo!** 🚀
