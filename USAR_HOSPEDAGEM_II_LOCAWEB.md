# Como Usar sua Hospedagem de Sites II da Locaweb (sem pagar mais)

## 💰 O que você JÁ ESTÁ PAGANDO

**Hospedagem de Sites II - Locaweb**
- Preço: ~R$ 24,90/mês (pagamento mensal) ou ~R$ 16-18/mês (anual)
- Status: **Você já paga por isso!**

### O que está INCLUÍDO no seu plano:

✅ **PostgreSQL**: 3 bancos de 10GB cada
✅ **MySQL**: 10 bancos de 1GB cada
✅ **Espaço em disco**: Ilimitado
✅ **Transferência**: Ilimitada
✅ **50 contas de e-mail**: 10GB cada
✅ **SSL**: Grátis e ilimitado
✅ **Backup diário**: Incluído (1 restore grátis/mês)
✅ **Domínio grátis**: 1 ano (se pagou plano anual)

### ❌ LIMITAÇÕES CRÍTICAS para Next.js:

❌ **Node.js**: Instalação manual, sem suporte oficial
❌ **SSH**: Sem acesso (impossibilita deploy adequado)
❌ **PostgreSQL**: Limite de 30 conexões simultâneas
❌ **Process manager**: Sem PM2, sem controle de processos
❌ **Restart automático**: Não disponível

---

## 🎯 Opção 1: GAMBIARRA (Usar o que você tem)

**Sim, é POSSÍVEL rodar Next.js na sua hospedagem compartilhada, MAS...**

### Método: Static Export + API Routes Externas

```bash
# 1. Build estático do Next.js
cd apps/web
pnpm build

# Resultado: pasta "out/" com HTML/CSS/JS estático
```

**O que funciona**:
✅ Frontend React (páginas estáticas)
✅ CSS, imagens, fontes
✅ Client-side routing
✅ PostgreSQL via conexão externa

**O que NÃO funciona**:
❌ Server Components (Next.js 15)
❌ API Routes (/api/*)
❌ Middleware
❌ Revalidação (ISR)
❌ Server Actions

### Configuração necessária:

**next.config.ts**:
```typescript
const nextConfig = {
  output: 'export', // Build estático
  trailingSlash: true,
  images: {
    unoptimized: true, // Sem otimização de imagem
  },
}
```

**Estrutura de deploy**:
```
public_html/
  ├── .htaccess          (configurar rotas)
  ├── index.html
  ├── _next/
  │   ├── static/
  │   └── ...
  └── assets/
```

**.htaccess** (para funcionar rotas):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### PROBLEMA: Onde rodar as APIs?

**Solução**: Backend separado (escolha 1):

#### A) Vercel Free (APIs)
```bash
# Criar projeto separado só com APIs
apps/api/
  ├── package.json
  ├── api/
  │   ├── flashcards/
  │   │   ├── review.ts
  │   │   ├── due.ts
  │   │   └── stats.ts
  │   └── exams/
  │       └── submit.ts

# Deploy no Vercel (grátis)
vercel --prod
```

**Custo**: R$ 0/mês (Vercel Free Tier)

#### B) Supabase Edge Functions
```typescript
// supabase/functions/flashcards-review/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Lógica da API aqui
})
```

**Custo**: R$ 0/mês (Supabase Free Tier)

---

## 🎯 Opção 2: MIGRAR PARA VPS (Recomendado)

### Análise de Custo:

| Item | Hospedagem II | VPS 2GB |
|------|---------------|---------|
| **Preço mensal** | R$ 24,90 | R$ 40-60 |
| **Preço anual** | R$ 16-18/mês | R$ 40-60/mês |
| **PostgreSQL** | 3x 10GB (30 conexões) | Ilimitado |
| **Node.js** | ⚠️ Manual | ✅ Completo |
| **SSH** | ❌ Não | ✅ Sim |
| **Controle** | ❌ Baixo | ✅ Total |
| **Next.js 15** | ❌ Limitado | ✅ Completo |

### Conclusão:

**Se você paga MENSAL (R$ 24,90)**:
- VPS custa R$ 15-35/mês A MAIS
- Mas você ganha controle total!

**Se você paga ANUAL (R$ 16-18/mês)**:
- VPS custa R$ 22-44/mês A MAIS
- Diferença: ~R$ 300-500/ano

---

## 🎯 Opção 3: HÍBRIDO (Melhor custo-benefício)

**Usar Hospedagem II + Serviços Grátis**

### Stack Híbrida:

```yaml
Frontend (Hospedagem II Locaweb):
  - Site institucional estático
  - Landing pages
  - Blog/Conteúdo
  - Custo: R$ 0 (já paga)

Backend (Vercel Free):
  - API Routes
  - Server Functions
  - Autenticação
  - Custo: R$ 0

Database (Supabase Free):
  - PostgreSQL 500 MB
  - Row Level Security
  - Backups automáticos
  - Custo: R$ 0

Ou Database (Hospedagem II):
  - PostgreSQL 10 GB
  - Limite 30 conexões
  - Custo: R$ 0 (já paga)
```

**Custo Total**: R$ 24,90/mês (o que você já paga!)

---

## 📊 Comparação Final

| Opção | Complexidade | Custo Extra | Next.js Completo | Recomendado |
|-------|--------------|-------------|------------------|-------------|
| **Gambiarra (Export + API externa)** | 🔴 Alta | R$ 0 | ❌ Parcial | ⚠️ Só se for temporário |
| **Híbrido (II + Vercel + Supabase)** | 🟡 Média | R$ 0 | ✅ Sim | ✅ Melhor custo-zero |
| **VPS 2GB Locaweb** | 🟢 Baixa | R$ 15-35/mês | ✅ Sim | ✅ Melhor longo prazo |
| **Cancelar II + VPS** | 🟢 Baixa | R$ -10 a +20/mês | ✅ Sim | ✅ Se não usar II |

---

## 🚀 RECOMENDAÇÃO PRÁTICA

### Cenário 1: Você USA a Hospedagem II para outros sites

**Solução**: Stack Híbrida (Opção 3)
```
- Mantenha Hospedagem II (outros sites + emails)
- Darwin Education:
  ✅ Vercel (frontend + API) - Grátis
  ✅ Supabase (PostgreSQL) - Grátis
  
Custo extra: R$ 0/mês
```

### Cenário 2: Você SÓ USA para Darwin Education

**Solução**: Cancelar II + VPS 1GB
```
- Cancele Hospedagem II: -R$ 24,90/mês
- Contrate VPS 1GB: +R$ 25-35/mês
  
Custo líquido: +R$ 0-10/mês
Ganho: Controle total, Next.js completo
```

### Cenário 3: Você NÃO quer pagar NADA a mais

**Solução**: Vercel + Supabase (100% grátis)
```
- Cancele Hospedagem II: -R$ 24,90/mês
- Vercel Free: R$ 0
- Supabase Free: R$ 0
  
Economia: R$ 24,90/mês (R$ 298/ano!)
Limitações: 500 MB banco, dados nos EUA
```

---

## ✅ Minha Recomendação Para Você

**Opção Híbrida (Cenário 1)** se você usa emails/outros sites:

1. **Mantenha** Hospedagem II (R$ 24,90/mês - já paga)
2. **Deploy Darwin Education**:
   - Frontend + API: Vercel Free
   - Database: Supabase Free (500 MB) ou PostgreSQL da Hospedagem II (10 GB)
3. **Custo adicional**: R$ 0

**Ou VPS (Cenário 2)** se você só precisa do Darwin:

1. **Cancele** Hospedagem II (-R$ 24,90)
2. **Contrate** VPS 1GB (+R$ 25-35)
3. **Custo líquido**: ~R$ 0-10/mês
4. **Ganho**: Controle total

---

## 🤔 Perguntas para Decidir

1. **Você usa a Hospedagem II para outros sites/emails?**
   - SIM → Opção Híbrida (Vercel + Supabase)
   - NÃO → Cancelar e migrar para VPS

2. **Quantos usuários simultâneos espera no Darwin?**
   - < 50 usuários → Vercel + Supabase Free funciona
   - > 50 usuários → VPS ou Supabase Pro

3. **Quanto tempo tem para configurar?**
   - Pouco tempo → Vercel + Supabase (deploy em 10 min)
   - Tenho tempo → VPS (deploy em 60-90 min)

4. **Dados PRECISAM ficar no Brasil?**
   - SIM → VPS Locaweb ou PostgreSQL da Hospedagem II
   - NÃO → Supabase (servidores nos EUA)

---

## 📞 Próximos Passos

**Me diga**:
1. Você usa a Hospedagem II para outros sites/emails?
2. Quanto você paga (mensal R$ 24,90 ou anual R$ 16-18)?
3. Prefere economia total (R$ 0) ou controle total (VPS)?

**Posso criar para você**:
- Scripts de deploy para a opção escolhida
- Guia de migração de dados
- Configuração de backup automático

**Qual caminho prefere?**
