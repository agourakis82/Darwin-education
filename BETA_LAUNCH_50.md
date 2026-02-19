# Beta Launch: 50 Usuários - Darwin Education

**Data de criação**: 2026-02-14
**Objetivo**: Lançar Darwin Education para 50 colegas médicos para beta-testing estruturado
**Duração do beta**: 4 semanas

---

## 📋 PRÉ-REQUISITOS (Checklist Técnico)

### ✅ Infraestrutura
- [ ] **Supabase**: Projeto em produção com migrations aplicadas
- [ ] **Vercel**: Deploy automático configurado (main branch → produção)
- [ ] **Domínio**: URL final definida (ex: `beta.darwineducation.com.br`)
- [ ] **SSL**: Certificado HTTPS ativo
- [ ] **Banco de dados**: Limites do plano gratuito Supabase:
  - 500 MB storage (suficiente para 50 usuários)
  - 2 GB bandwidth/mês (monitorar)
  - Unlimited API requests (OK)

### ✅ Conteúdo Mínimo Viável
- [ ] **Questões**: Pelo menos 200 questões calibradas (40 por área)
- [ ] **Simulado público**: 1 simulado completo (100 questões)
- [ ] **Flashcards**: 1000+ cards (200 por área)
- [ ] **Trilhas de estudo**: 3-5 trilhas básicas
- [ ] **Conteúdo médico**: Doenças e medicamentos do Darwin-MFC importados

**Como verificar**:
```sql
-- Rodar no Supabase SQL Editor
SELECT
  (SELECT COUNT(*) FROM questions) as total_questions,
  (SELECT COUNT(*) FROM questions WHERE area = 'clinica_medica') as clinica,
  (SELECT COUNT(*) FROM questions WHERE area = 'cirurgia') as cirurgia,
  (SELECT COUNT(*) FROM questions WHERE area = 'pediatria') as pediatria,
  (SELECT COUNT(*) FROM questions WHERE area = 'ginecologia_obstetricia') as gineco,
  (SELECT COUNT(*) FROM questions WHERE area = 'saude_coletiva') as saude_col,
  (SELECT COUNT(*) FROM flashcards) as flashcards,
  (SELECT COUNT(*) FROM exams WHERE is_public = true) as public_exams;
```

### ✅ Features Funcionais
- [ ] **Auth**: Signup, login, reset password
- [ ] **Simulado**: Criar, responder, finalizar, ver resultado TRI
- [ ] **Flashcards**: Criar deck, adicionar cards, revisar com SM-2
- [ ] **Desempenho**: Dashboard com breakdown por área
- [ ] **Responsivo**: Mobile-friendly (50%+ dos médicos usam celular)

### ✅ Testes E2E (Playwright)
- [ ] Auth flow completo (signup → login → logout)
- [ ] Simulado end-to-end (criar → responder → resultado)
- [ ] Flashcards (criar deck → adicionar cards → revisar)
- [ ] CI pipeline verde (GitHub Actions)

---

## 🎯 SISTEMA DE CONVITES (Beta Gate)

### Opção 1: Email Allowlist (Recomendado para 50 pessoas)

**Vantagens**: Controle total, sem código adicional necessário

**Setup**:
1. Criar lista de emails dos 50 beta-testers
2. Adicionar no Vercel:
   ```bash
   # Exemplo: separar emails por vírgula
   BETA_TESTER_EMAILS=joao@exemplo.com,maria@exemplo.com,carlos@exemplo.com,...
   ```

3. Criar middleware de verificação:

**Arquivo**: `apps/web/middleware.ts`
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BETA_TESTER_EMAILS = process.env.BETA_TESTER_EMAILS?.split(',').map(e => e.trim()) || []
const BETA_TESTER_DOMAINS = process.env.BETA_TESTER_DOMAINS?.split(',').map(d => d.trim()) || []

// Se ambos vazios, beta gate desativado
const BETA_GATE_ACTIVE = BETA_TESTER_EMAILS.length > 0 || BETA_TESTER_DOMAINS.length > 0

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes (sem auth required)
  const publicPaths = ['/login', '/signup', '/reset-password', '/api/auth']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Beta gate check
  if (BETA_GATE_ACTIVE && session?.user?.email) {
    const userEmail = session.user.email.toLowerCase()
    const userDomain = userEmail.split('@')[1]

    const isAllowed =
      BETA_TESTER_EMAILS.includes(userEmail) ||
      BETA_TESTER_DOMAINS.includes(userDomain)

    if (!isAllowed && !isPublicPath) {
      // Redirecionar para página de "beta fechado"
      return NextResponse.redirect(new URL('/beta-waitlist', req.url))
    }
  }

  // Auth redirect
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Página de waitlist** (`apps/web/app/beta-waitlist/page.tsx`):
```typescript
export default function BetaWaitlistPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold">🔒 Beta Fechado</h1>
        <p className="text-label-secondary">
          O Darwin Education está em beta privado. Se você recebeu um convite,
          certifique-se de usar o email cadastrado.
        </p>
        <p className="text-sm text-label-tertiary">
          Dúvidas? Entre em contato: <a href="mailto:suporte@darwineducation.com" className="underline">suporte@darwineducation.com</a>
        </p>
      </div>
    </div>
  )
}
```

### Opção 2: Sistema de Invite Codes (Mais escalável)

Se preferir códigos de convite únicos (um código por pessoa):

**Migration**: `infrastructure/supabase/migrations/20260214000000_beta_invites_enhanced.sql`
```sql
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  CHECK (code ~ '^[A-Z0-9]{8}$') -- Formato: ABCD1234
);

CREATE INDEX idx_beta_invites_code ON beta_invites(code);
CREATE INDEX idx_beta_invites_used_by ON beta_invites(used_by);

-- Gerar 50 códigos
INSERT INTO beta_invites (code, email)
SELECT
  UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
  NULL
FROM generate_series(1, 50);
```

**Signup com código**:
Modificar `apps/web/app/signup/page.tsx` para incluir campo "Código de Convite".

---

## 📊 MONITORAMENTO & ANALYTICS

### 1. Error Tracking: Sentry (Grátis até 5k events/mês)

**Setup**:
```bash
cd apps/web
pnpm add @sentry/nextjs
pnpm sentry:init
```

**Config**: `sentry.client.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de traces (economizar quota)

  beforeSend(event, hint) {
    // Filtrar erros não-críticos
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null
    }
    return event
  },
})
```

**Benefícios**:
- Ver erros em tempo real
- Stack traces completos
- Session replay para reproduzir bugs
- Email alerts para erros críticos

### 2. Product Analytics: PostHog (Self-hosted gratuito)

**Por que**: Entender como usuários navegam, quais features usam mais, onde abandonam.

**Eventos a trackear**:
- `exam_started` (simulado iniciado)
- `exam_completed` (simulado finalizado)
- `flashcard_reviewed` (card revisado)
- `deck_created` (deck criado)
- `feature_clicked` (qual card da home clicaram)

**Setup rápido**:
```typescript
// lib/analytics.ts
import posthog from 'posthog-js'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
    },
  })
}

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    posthog.capture(event, properties)
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits)
  },
}

// Usar em componentes
analytics.track('exam_started', { examId, questionCount })
```

### 3. Database Monitoring

**Supabase Dashboard**: Monitorar queries lentas, RLS policy hits, bandwidth.

**Alertas críticos**:
- Database size > 400 MB (80% do limite)
- Bandwidth > 1.5 GB/mês
- API requests > 1M/mês (se atingir)

---

## 💬 CANAL DE FEEDBACK

### Recomendação: Typeform + Notion

**Formulário de feedback** (embutir no app):

1. Criar Typeform gratuito com 5 perguntas:
   - Qual feature você mais usou? (Simulado, Flashcards, Trilhas, Conteúdo)
   - O que você gostou?
   - O que você NÃO gostou?
   - Encontrou algum bug? Descreva.
   - De 0-10, qual a chance de recomendar?

2. Adicionar link no rodapé do app:
   ```tsx
   <a href="https://typeform.com/to/xxxxx" target="_blank">
     💬 Dar Feedback
   </a>
   ```

3. Respostas vão para Notion database (via Zapier/Make.com).

### Alternativa: Discord ou Telegram Group

**Vantagens**:
- Feedback em tempo real
- Comunidade se ajuda mutuamente
- Você responde dúvidas rapidamente

**Setup**:
1. Criar server Discord privado (ou grupo Telegram)
2. Convidar os 50 beta-testers
3. Canais:
   - `#bem-vindo` (onboarding)
   - `#bugs` (relatar problemas)
   - `#sugestoes` (ideias de features)
   - `#duvidas` (suporte)

---

## 📖 GUIA DO BETA-TESTER

Criar página `/beta-guide` ou PDF para enviar junto com o convite.

**Conteúdo essencial**:

### O que é o Darwin Education?
Plataforma de preparação para o ENAMED com:
- **Simulados TRI**: Pontuação calibrada como na prova real
- **Flashcards SM-2**: Revisão espaçada otimizada
- **Análise de desempenho**: Identifica áreas fracas
- **Conteúdo médico**: 368 doenças, 690 medicamentos

### O que esperamos de você (beta-tester)?
1. **Usar pelo menos 3x/semana** por 4 semanas
2. **Testar todas as features principais**:
   - Criar e finalizar 1 simulado completo
   - Revisar pelo menos 50 flashcards
   - Explorar a seção de Conteúdo Médico
3. **Relatar bugs** via formulário ou Discord
4. **Dar feedback honesto** sobre UX, conteúdo, performance

### Como começar?
1. Acesse [beta.darwineducation.com.br](https://beta.darwineducation.com.br)
2. Faça signup com o email cadastrado
3. Siga o tour de onboarding (3 passos)
4. Recomendamos: comece com um simulado rápido (20 questões)

### Problemas conhecidos (transparência)
- [ ] Algumas questões ainda estão sendo calibradas (IRT)
- [ ] Mobile: layout do simulado pode ter pequenos ajustes
- [ ] Conteúdo médico: referências bibliográficas em progresso

### Suporte
- **Discord**: [link do server]
- **Email**: suporte@darwineducation.com
- **Resposta esperada**: <24h (dias úteis)

---

## 🚀 CRONOGRAMA DE ROLLOUT (Gradual)

### Semana 1: 10 pessoas (Early Access)
**Objetivo**: Validar infraestrutura e features core

**Seleção**: 10 colegas próximos, que possam dar feedback rápido

**Tarefas**:
- [ ] Enviar convites (email + instruções)
- [ ] Monitorar Sentry diariamente (primeiros 3 dias críticos)
- [ ] Responder dúvidas no Discord em <2h
- [ ] Coletar feedback após 3 dias

**Critérios para avançar para Semana 2**:
- ✅ Zero erros críticos (500s, data loss)
- ✅ TRI scoring funcionando corretamente
- ✅ Pelo menos 5 simulados completados
- ✅ Feedback geral positivo (NPS > 6)

### Semana 2: +15 pessoas (Total: 25)
**Objetivo**: Escalar e testar carga

**Tarefas**:
- [ ] Adicionar 15 emails no `BETA_TESTER_EMAILS`
- [ ] Redeploy Vercel (env vars atualizadas)
- [ ] Monitorar bandwidth e DB size
- [ ] Fixar bugs reportados na Semana 1

**Critérios para avançar**:
- ✅ Database size < 200 MB
- ✅ Bandwidth < 500 MB/semana
- ✅ Pelo menos 15 simulados completados (acumulado)
- ✅ Taxa de bugs críticos < 5%

### Semana 3: +25 pessoas (Total: 50)
**Objetivo**: Beta completo

**Tarefas**:
- [ ] Adicionar todos os 50 emails
- [ ] Enviar email de boas-vindas em lote
- [ ] Preparar FAQ baseado em dúvidas da Semana 1-2
- [ ] Agendar sessão de Q&A ao vivo (opcional: Zoom/Meet)

**Métricas de sucesso**:
- ✅ 70%+ dos beta-testers fizeram login
- ✅ 50%+ completaram pelo menos 1 simulado
- ✅ 30%+ revisaram flashcards
- ✅ NPS geral > 7

### Semana 4: Iteração & Preparação para Launch
**Objetivo**: Polir para lançamento público

**Tarefas**:
- [ ] Consolidar todo feedback recebido
- [ ] Priorizar top 5 bugs/features para fixar
- [ ] Preparar release notes (o que mudou desde beta)
- [ ] Planejar estratégia de lançamento público

---

## 📧 TEMPLATES DE EMAIL

### Email 1: Convite Inicial
**Assunto**: Você foi selecionado para o beta do Darwin Education 🎓

Olá [Nome],

Você está entre os 50 colegas selecionados para testar **Darwin Education**, a plataforma de preparação para o ENAMED que desenvolvi com tecnologia de ponta:

✅ **Simulados com TRI** (pontuação calibrada como na prova real)
✅ **Flashcards inteligentes** (algoritmo de repetição espaçada)
✅ **Análise de desempenho** por área médica
✅ **1000+ questões** já calibradas

**Como participar:**
1. Acesse: https://beta.darwineducation.com.br
2. Faça signup com este email
3. Explore a plataforma por 4 semanas
4. Dê seu feedback honesto

**O que esperamos:**
- Use pelo menos 3x/semana
- Complete 1 simulado e revise alguns flashcards
- Relate bugs e sugestões (via Discord ou formulário)

**Link do Discord**: [link privado]
**Guia completo**: [link do PDF ou página /beta-guide]

Obrigado por nos ajudar a construir a melhor ferramenta de preparação para ENAMED! 🚀

Abraço,
[Seu nome]

---

### Email 2: Lembrete (3 dias após convite, para quem não fez login)
**Assunto**: Lembrete: Seu acesso ao beta do Darwin Education

Olá [Nome],

Notei que você ainda não fez login no Darwin Education. Gostaria de reforçar o convite!

Seu acesso beta expira em **25 dias**. Para participar:
👉 https://beta.darwineducation.com.br

Qualquer dúvida, estou à disposição no Discord ou por email.

Abraço,
[Seu nome]

---

### Email 3: Pedido de feedback (após 2 semanas)
**Assunto**: Como está sendo sua experiência com o Darwin Education?

Olá [Nome],

Você está usando o Darwin Education há 2 semanas. Adoraria saber sua opinião!

**Formulário rápido (2 min)**: [link Typeform]

Seu feedback é essencial para melhorarmos a plataforma antes do lançamento oficial.

Muito obrigado! 🙏
[Seu nome]

---

## 🛠️ CHECKLIST TÉCNICO PRÉ-LAUNCH

### Deploy & Infraestrutura
- [ ] Migrations aplicadas no Supabase de produção
- [ ] Seeds executados (questões, flashcards, trilhas)
- [ ] Env vars configuradas no Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `BETA_TESTER_EMAILS` (ou `BETA_TESTER_DOMAINS`)
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` (se usando Sentry)
  - [ ] `NEXT_PUBLIC_POSTHOG_KEY` (se usando PostHog)
- [ ] Vercel domain configurado e SSL ativo
- [ ] Backup manual do banco (antes do beta, por segurança)

### Conteúdo
- [ ] Pelo menos 200 questões calibradas
- [ ] 1000+ flashcards system decks
- [ ] Conteúdo médico importado (Darwin-MFC)
- [ ] 1 simulado público completo (100 questões)

### Testes
- [ ] E2E tests passando (auth, simulado, flashcards)
- [ ] Smoke test manual em produção:
  - [ ] Signup funciona
  - [ ] Login funciona
  - [ ] Criar e completar simulado
  - [ ] Revisar flashcard
  - [ ] Ver desempenho

### Monitoramento
- [ ] Sentry configurado e testado
- [ ] PostHog (ou alternativa) configurado
- [ ] Supabase Dashboard aberto para monitorar DB size/bandwidth

### Comunicação
- [ ] Lista de 50 emails validada
- [ ] Templates de email preparados
- [ ] Discord/Telegram criado (se aplicável)
- [ ] Página `/beta-guide` ou PDF criado
- [ ] Formulário de feedback (Typeform) criado

---

## 📈 MÉTRICAS DE SUCESSO DO BETA

### Engajamento
- **Taxa de ativação**: 70%+ dos convidados fizeram login
- **Frequência de uso**: 50%+ usaram 3+ vezes/semana
- **Feature adoption**:
  - 60%+ completaram pelo menos 1 simulado
  - 40%+ revisaram flashcards
  - 30%+ exploraram Conteúdo Médico

### Qualidade
- **Taxa de bugs críticos**: < 5% dos usuários reportaram bugs bloqueantes
- **Tempo de resposta a bugs**: < 48h para fix de bugs críticos
- **NPS (Net Promoter Score)**: > 7/10

### Performance Técnica
- **Uptime**: 99%+ (tolerável 1-2h de downtime para hotfixes)
- **Tempo de carregamento**: < 3s para primeira página
- **Erro rate**: < 1% de requests com erro 500

### Feedback Qualitativo
- **Top 3 features mais usadas**: [a preencher após beta]
- **Top 3 pain points**: [a preencher]
- **Feature requests mais pedidas**: [a preencher]

---

## 🎯 PRÓXIMOS PASSOS (Action Items)

### Esta semana (antes de enviar convites)
1. [ ] **Rodar checklist técnico** (seção acima)
2. [ ] **Criar middleware de beta gate** (`apps/web/middleware.ts`)
3. [ ] **Criar página `/beta-waitlist`**
4. [ ] **Configurar Sentry** (15 min)
5. [ ] **Criar Discord/Telegram** e preparar canais
6. [ ] **Escrever guia do beta-tester** (`/beta-guide` ou PDF)
7. [ ] **Preparar lista de 10 early access** (Semana 1)

### Semana 1: Lançamento para 10 pessoas
1. [ ] Enviar convites (email template 1)
2. [ ] Monitorar Sentry diariamente
3. [ ] Responder dúvidas no Discord
4. [ ] Coletar feedback informal após 3 dias

### Semana 2-4: Escalar para 50
1. [ ] Adicionar mais 15 emails (Semana 2)
2. [ ] Adicionar restante (Semana 3)
3. [ ] Enviar email de pedido de feedback (Semana 3)
4. [ ] Compilar learnings e planejar v2 (Semana 4)

---

## 🚨 PLANO DE CONTINGÊNCIA

### Se houver bug crítico durante beta
1. **Comunicar imediatamente** no Discord/email
2. **Estimar tempo de fix** (< 4h, 4-24h, > 24h)
3. **Deploy hotfix** se possível em < 2h
4. **Comunicar resolução** quando fixado

### Se banco de dados encher (> 450 MB)
1. **Investigar** quais tabelas estão grandes (SQL query)
2. **Limpar** dados desnecessários:
   - Logs antigos (> 30 dias)
   - Tentativas de simulado abandonadas (> 7 dias)
3. **Considerar upgrade** para plano Pro do Supabase ($25/mês)

### Se bandwidth exceder limite
1. **Otimizar queries** (adicionar indexes, usar RLS cache)
2. **Implementar rate limiting** para API calls
3. **Upgrade de plano** se necessário

---

## 💡 DICAS FINAIS

1. **Seja transparente**: Diga que é beta, bugs são esperados.
2. **Responda rápido**: Beta-testers valorizam atenção.
3. **Celebre milestones**: "10 usuários completaram simulados! 🎉"
4. **Itere rapidamente**: Fix bugs em < 48h quando possível.
5. **Agradeça**: Beta-testers estão te ajudando de graça.

---

**Boa sorte com o lançamento! 🚀**

Se precisar de ajuda durante o beta, revise este documento e os arquivos técnicos de suporte.
