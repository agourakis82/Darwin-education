# Status Atual - Darwin Education (14/02/2026)

## 🔍 AUDITORIA EXECUTADA

**Data**: 2026-02-14
**Banco**: Supabase (jpzkjkwcoudaxscrukye.supabase.co)

---

## ❌ PROBLEMA IDENTIFICADO

### **Banco de Questões VAZIO**

- **Tabelas**: ✅ Criadas (schema aplicado)
- **Question Banks**: ✅ 15 bancos criados
- **Questions**: ❌ **0 questões** (seeds não foram aplicados!)

---

## 🎯 AÇÃO IMEDIATA NECESSÁRIA

### **Aplicar Seeds de Questões**

Você tem **2 migrations de questões** prontas para aplicar:

1. **20260213194000_beta_web_enamed_2025_questions_seed.sql** (131 KB)
   - 90 questões ENAMED 2025 oficiais
   - IRT calibrado
   - ⚠️ Explicações pendentes ("em elaboração")

2. **02_sample_questions.sql** (626 linhas)
   - 50 questões de alta qualidade
   - Explicações completas
   - Metadata preenchida
   - 10 questões por área (balanceado)

---

## 📋 COMO APLICAR OS SEEDS

### **Opção 1: Supabase Dashboard** (Recomendado - mais seguro)

1. Abra [Supabase Dashboard](https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye)
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de cada arquivo:
   ```bash
   # Arquivo 1 (ENAMED 2025 - 90 questões)
   cat infrastructure/supabase/supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql

   # Arquivo 2 (Sample questions - 50 questões)
   cat infrastructure/supabase/seed/02_sample_questions.sql
   ```
4. Execute cada um (pode demorar 30-60s para o maior)
5. Verifique:
   ```sql
   SELECT COUNT(*) FROM questions;
   -- Deve retornar: 140
   ```

### **Opção 2: Supabase CLI** (Se instalado)

```bash
cd infrastructure/supabase
supabase db push  # Aplica todas migrations pendentes
```

### **Opção 3: psql Direto** (Avançado)

```bash
export PGPASSWORD="1111111111Urso1982!"
psql "postgresql://postgres.jpzkjkwcoudaxscrukye:$PGPASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f infrastructure/supabase/supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql

psql "postgresql://postgres.jpzkjkwcoudaxscrukye:$PGPASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f infrastructure/supabase/seed/02_sample_questions.sql
```

---

## 📊 APÓS APLICAR SEEDS

Execute novamente a auditoria:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://jpzkjkwcoudaxscrukye.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...LeVy6egclGWZlPvcnkcgKL8xDojanb4bW6I5gz9U-rI"
pnpm tsx scripts/audit_questions.ts
```

**Resultado esperado**:
- ✅ Total: 140 questões
- ⚠️ 90 sem explicação completa (ENAMED 2025)
- ⚠️ 90 sem metadata (subspecialty/topic)
- ✅ 50 com tudo completo (sample questions)

---

## 📁 ARQUIVOS CRIADOS PARA VOCÊ

### **1. Documentação**
- ✅ `BETA_LAUNCH_50.md` - Guia completo de lançamento beta (50 usuários)
- ✅ `QUICK_BETA_SETUP.md` - Checklist rápido (30 min)
- ✅ `VERIFY_CONTENT_STATUS.sql` - Queries de verificação de conteúdo
- ✅ `CONTENT_BATCHES_4_5.md` - Plano de doenças (Batches 4-5, CODEX ownership)

### **2. Curadoria de Questões** (Sua responsabilidade)
- ✅ `QUESTIONS_CURATION_EXPANSION.md` - Plano completo (110 novas + curadoria)
- ✅ `QUESTIONS_BLUEPRINT.md` - Blueprint detalhado (28 Cirurgia, 27 Saúde Col, etc.)
- ✅ `QUESTIONS_AUDIT.sql` - 13 queries de auditoria completas
- ✅ `scripts/audit_questions.ts` - Script de auditoria automatizada

---

## 🎯 PRÓXIMOS PASSOS (Ordem de Prioridade)

### **1. AGORA (Urgente)**
```bash
# Aplicar seeds de questões (escolha Opção 1, 2 ou 3 acima)
# Tempo: 5 minutos
```

### **2. VERIFICAR (Após seeds)**
```bash
# Rodar auditoria completa
pnpm tsx scripts/audit_questions.ts

# Resultado: Relatório salvo em QUESTIONS_AUDIT_REPORT.txt
```

### **3. DECIDIR ESTRATÉGIA**

#### **Opção A: Curadoria Primeiro** (Recomendado)
**Objetivo**: Elevar 140 questões existentes para alta qualidade

**Plano**:
1. Curar 90 questões ENAMED (explicações + metadata) - **15h**
2. Lançar beta Semana 1 com 140 questões - **OK para 50 usuários**
3. Durante beta: expandir para 250 questões

**Vantagens**:
- ✅ Rápido para lançar (1-2 semanas)
- ✅ Questões oficiais ENAMED (alta validade)
- ⚠️ Desbalanceamento (Cirurgia só 22, Clínica Médica 44)

#### **Opção B: Expansão Primeiro**
**Objetivo**: Balancear 50 questões por área antes do beta

**Plano**:
1. Criar 110 novas questões (ver QUESTIONS_BLUEPRINT.md) - **55h**
2. Curar ENAMED paralelamente
3. Lançar beta com 250 questões balanceadas

**Vantagens**:
- ✅ Balanceamento perfeito (50/área)
- ✅ Maior volume de questões
- ⚠️ Mais tempo (4-6 semanas)

#### **Opção C: Híbrido** (Minha Recomendação)
**Objetivo**: Melhor de ambos

**Semana 1-2**:
1. Curar 30 questões ENAMED prioritárias (Cirurgia, Saúde Coletiva) - **10h**
2. Criar 30 novas questões (Cirurgia +20, Saúde Col +10) - **15h**
3. **Resultado**: 170 questões, mais balanceado

**Semana 3**:
4. Lançar Beta Semana 1 (10 pessoas)

**Durante Beta (Semanas 3-6)**:
5. Curar restante ENAMED (60 questões)
6. Criar +80 questões
7. **Resultado Final**: 250 questões de alta qualidade

---

## 📊 MÉTRICAS ATUAIS

| Métrica | Atual | Meta Beta | Status |
|---------|-------|-----------|--------|
| **Total Questões** | 0 (após seed: 140) | 200-250 | ⚠️ Aplicar seeds primeiro |
| **Clínica Médica** | 0 (após: 44) | 50 | 🟡 Faltam 6 |
| **Cirurgia** | 0 (após: 22) | 50 | 🔴 Faltam 28 |
| **Ginecologia/Obstetrícia** | 0 (após: 26) | 50 | 🟠 Faltam 24 |
| **Pediatria** | 0 (após: 25) | 50 | 🟠 Faltam 25 |
| **Saúde Coletiva** | 0 (após: 23) | 50 | 🔴 Faltam 27 |
| **Flashcards** | ? | 1000 | ✅ Seeded (989) |
| **Study Paths** | ? | 3-5 | ✅ Seeded |
| **Doenças (Darwin-MFC)** | ? | 300+ | ⚠️ Verificar import |

---

## ⚡ AÇÃO IMEDIATA

**Execute AGORA** (escolha um):

```bash
# Via Dashboard (mais fácil)
# 1. Abra: https://supabase.com/dashboard/project/jpzkjkwcoudaxscrukye/sql
# 2. Cole e execute: infrastructure/supabase/supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql
# 3. Cole e execute: infrastructure/supabase/seed/02_sample_questions.sql

# Via psql (se preferir CLI)
export PGPASSWORD="1111111111Urso1982!"
psql "postgresql://postgres.jpzkjkwcoudaxscrukye@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f infrastructure/supabase/supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql
```

**Depois**:
```bash
# Rodar auditoria
pnpm tsx scripts/audit_questions.ts
```

---

**Me avise quando os seeds estiverem aplicados e eu rodo a auditoria completa!** 🚀
