# 🎯 Próximos Passos - Deploy Piloto Darwin Education

## Status Atual
✅ Supabase criando...
⏳ Aguardando finalizar (1-2 minutos)

---

## Passo 2: Rodar Migrations (2 minutos)

### Quando Supabase terminar de criar:

1. **Sidebar esquerda** → **SQL Editor**
2. Click **+ New query**
3. Copiar conteúdo de: `infrastructure/supabase/schema.sql`

**Caminho completo:**
```bash
/home/demetrios/Darwin-education/infrastructure/supabase/schema.sql
```

4. **Colar** no SQL Editor
5. Click **RUN** (botão verde, canto inferior direito)
6. Aguardar mensagem: **"Success. No rows returned"**

✅ Tabelas criadas!

---

## Passo 3: Pegar Credenciais (1 minuto)

1. **Settings** (ícone de engrenagem, sidebar)
2. **API** (submenu)
3. Copiar e salvar:

```bash
# Project URL
SUPABASE_URL=https://xxxxx.supabase.co

# anon public key (chave LONGA)
SUPABASE_ANON_KEY=eyJhbGc...
```

**IMPORTANTE:** Guardar essas credenciais! Vão ser usadas no Vercel.

---

## Passo 4: Criar Usuário de Teste (1 minuto)

1. **Authentication** (sidebar)
2. **Users** (submenu)
3. Click **Add user** → **Create new user**
4. Preencher:
   ```
   Email: test@test.com
   Password: Test@123456
   Auto Confirm User: ✅ LIGAR
   ```
5. Click **Create user**

✅ Usuário de teste criado!

---

## Passo 5: Deploy no Vercel (3 minutos)

### 5.1 Push para GitHub (se ainda não estiver)

```bash
cd /home/demetrios/Darwin-education

# Verificar status
git status

# Se tiver mudanças não commitadas:
git add .
git commit -m "Ready for Vercel deploy"
git push origin main
```

### 5.2 Criar Projeto Vercel

1. Acesse: https://vercel.com/new
2. **Import Git Repository**
3. Se primeira vez: Autorize Vercel acessar GitHub
4. Selecione: **darwin-education**
5. Click **Import**

### 5.3 Configurar Variáveis de Ambiente

**ANTES de clicar Deploy**, adicione as variáveis:

**Seção: Root Directory**
```
apps/web
```

**Seção: Environment Variables** → Add:

```bash
# Supabase (colar valores do Passo 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-aqui

# NextAuth (gerar agora)
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://seu-app.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Copiar resultado e colar em NEXTAUTH_SECRET
```

### 5.4 Deploy!

1. Click **Deploy**
2. Aguardar 2-3 minutos
3. Copiar URL do deploy (ex: `https://darwin-education-xxx.vercel.app`)

### 5.5 Atualizar URLs

**No Vercel:**
1. **Settings** → **Environment Variables**
2. Editar `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL`
3. Substituir `https://seu-app.vercel.app` pela URL real
4. **Save**
5. **Deployments** → 3 pontinhos → **Redeploy**

**No Supabase:**
1. **Authentication** → **URL Configuration**
2. **Site URL**: `https://darwin-education-xxx.vercel.app`
3. **Redirect URLs** → Add:
   ```
   https://darwin-education-xxx.vercel.app/auth/callback
   https://darwin-education-xxx.vercel.app/api/auth/callback/*
   ```
4. **Save**

---

## Passo 6: Inserir Dados de Teste (5 minutos)

**Supabase → SQL Editor → New query:**

```sql
-- 1. Banco de questões
INSERT INTO question_banks (id, name, source_type, description, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Teste Piloto',
  'official_enamed',
  'Questões de validação',
  true
);

-- 2. Questões (5 questões de teste)
INSERT INTO questions (id, bank_id, year, stem, options, correct_index, explanation, irt_difficulty, irt_discrimination, irt_guessing, area, difficulty)
VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Qual órgão produz insulina?',
  '[{"letter":"A","text":"Fígado"},{"letter":"B","text":"Pâncreas"},{"letter":"C","text":"Rim"},{"letter":"D","text":"Estômago"}]'::jsonb,
  1,
  'O pâncreas produz insulina através das células beta.',
  0.0, 1.2, 0.25,
  'clinica_medica',
  'facil'
),
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Antibiótico para pneumonia comunitária?',
  '[{"letter":"A","text":"Amoxicilina"},{"letter":"B","text":"Ciprofloxacino"},{"letter":"C","text":"Vancomicina"},{"letter":"D","text":"Gentamicina"}]'::jsonb,
  0,
  'Amoxicilina é primeira linha para pneumonia comunitária.',
  0.3, 1.0, 0.25,
  'clinica_medica',
  'medio'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Idade ideal para cesárea eletiva?',
  '[{"letter":"A","text":"37 semanas"},{"letter":"B","text":"38 semanas"},{"letter":"C","text":"39 semanas"},{"letter":"D","text":"40 semanas"}]'::jsonb,
  2,
  'Cesárea eletiva deve ser com 39 semanas completas.',
  -0.2, 1.1, 0.25,
  'ginecologia_obstetricia',
  'medio'
),
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Esquema vacinal da BCG?',
  '[{"letter":"A","text":"Dose única ao nascer"},{"letter":"B","text":"Duas doses no primeiro ano"},{"letter":"C","text":"Três doses"},{"letter":"D","text":"Dose aos 12 meses"}]'::jsonb,
  0,
  'BCG é dose única ao nascer.',
  -0.5, 0.9, 0.25,
  'pediatria',
  'facil'
),
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  2024,
  'Incisão para apendicectomia?',
  '[{"letter":"A","text":"McBurney"},{"letter":"B","text":"Pfannenstiel"},{"letter":"C","text":"Mediana"},{"letter":"D","text":"Kocher"}]'::jsonb,
  0,
  'McBurney é a incisão padrão para apendicectomia.',
  0.1, 1.0, 0.25,
  'cirurgia',
  'facil'
);

-- 3. Exame
INSERT INTO exams (id, title, description, question_count, duration_minutes, pass_threshold, is_active, question_ids)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Simulado Piloto - 5 Questões',
  'Simulado de teste para validação',
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

-- 4. Criar deck de flashcards padrão
INSERT INTO flashcard_decks (id, user_id, name, description, is_public)
SELECT 
  '77777777-7777-7777-7777-777777777777'::uuid,
  id,
  'Erros de Simulado',
  'Questões que errei nos simulados',
  false
FROM auth.users 
WHERE email = 'test@test.com';
```

**Click RUN!**

---

## Passo 7: TESTAR! (2 minutos)

### 7.1 Acessar App

```
https://darwin-education-xxx.vercel.app
```

### 7.2 Login

```
Email: test@test.com
Senha: Test@123456
```

### 7.3 Fazer Simulado

1. Homepage → **Simulado**
2. "Simulado Piloto - 5 Questões"
3. **Iniciar**
4. Responder 5 questões
5. **Finalizar**
6. Ver score TRI!

### 7.4 Testar Flashcards

1. Ir para Review do simulado
2. Salvar questão errada
3. `/flashcards/study`
4. Revisar flashcard (1-4)

---

## ✅ Checklist

- [ ] Supabase criado
- [ ] Migrations rodadas
- [ ] Usuário test@test criado
- [ ] Deploy Vercel funcionando
- [ ] URLs atualizadas
- [ ] Dados de teste inseridos
- [ ] Login funciona
- [ ] Simulado funciona
- [ ] TRI score calcula
- [ ] Flashcards funcionam

---

## 🎉 Piloto NO AR!

**Próximos passos após validar:**
1. Convidar 5-10 alunos testar
2. Coletar feedback 1-2 semanas
3. Decidir: Continuar Free, Proxmox, ou Escalar

**Dúvidas ou problemas? Me avise!** 🚀
