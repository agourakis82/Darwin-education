# 🚀 Deployment Checklist: FSRS-6 & CAT

**Data Criação**: 2026-01-30
**Status**: Pronto para deployment

---

## ✅ Pré-requisitos

- [ ] Revisar [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- [ ] Ler [docs/implementation-summary.md](docs/implementation-summary.md)
- [ ] Confirmar orçamento para A/B testing
- [ ] Alinhar timeline com stakeholders

---

## 📦 Fase 1: FSRS-6 Deployment (P0 - 4-8 semanas)

### Semana 1-2: Database & Backend

#### Database Migration
- [ ] **Backup completo do database** (CRITICAL)
- [ ] Executar em staging: `005_fsrs_and_cat_extensions.sql`
- [ ] Validar schema:
  ```sql
  -- Verificar tabelas criadas
  \dt flashcard_review_states
  \dt user_fsrs_weights
  \dt irt_response_log

  -- Verificar triggers
  \df update_user_fsrs_weights_updated_at
  \df update_question_irt_params

  -- Verificar views
  \dv v_algorithm_performance
  \dv v_item_statistics
  ```
- [ ] Testar RLS policies com usuário de teste
- [ ] Executar em production após validação

#### API Endpoints
- [ ] Criar `POST /api/flashcards/review` (FSRS scheduling)
- [ ] Criar `GET /api/flashcards/due` (Due cards queue)
- [ ] Criar `POST /api/flashcards/migrate-to-fsrs` (Migration endpoint)
- [ ] Criar `GET /api/flashcards/stats` (Statistics)
- [ ] Adicionar rate limiting (ex: 100 req/min por usuário)
- [ ] Adicionar logging (response time, errors)

#### Testing Backend
```bash
# Unit tests
cd packages/shared
pnpm test -- fsrs.test.ts

# Integration tests (criar em apps/web/tests/)
pnpm test:integration -- fsrs-api.test.ts
```

---

### Semana 2-3: Frontend UI

#### Settings Page
- [ ] Adicionar toggle SM-2 vs FSRS em `/app/configuracoes`
  ```tsx
  <Toggle
    label="Algoritmo de Repetição Espaçada"
    options={[
      { value: 'sm2', label: 'SM-2 (Clássico)' },
      { value: 'fsrs', label: 'FSRS-6 (Recomendado)', badge: 'NOVO' }
    ]}
    onChange={handleAlgorithmChange}
  />
  ```
- [ ] Adicionar modal explicativo "O que é FSRS?"
- [ ] Adicionar botão "Migrar meus cartões para FSRS"
- [ ] Mostrar estatísticas comparativas (SM-2 vs FSRS)

#### Flashcard Review UI
- [ ] Atualizar botões de rating (1-4 ao invés de 0-5)
- [ ] Mostrar próximos intervalos para cada rating
  ```tsx
  <button>Novamente (1d)</button>
  <button>Difícil (3d)</button>
  <button>Bom (7d)</button>
  <button>Fácil (14d)</button>
  ```
- [ ] Adicionar visualização da curva de esquecimento
- [ ] Mostrar retrievability atual

#### Dashboard Stats
- [ ] Adicionar widget "Algoritmo em uso" (SM-2 ou FSRS)
- [ ] Comparar eficiência: "Você está revisando 25% menos com FSRS"
- [ ] Mostrar stability média e difficulty média

---

### Semana 3-4: A/B Testing Setup

#### Feature Flags
- [ ] Configurar feature flag `enable_fsrs` (ex: Posthog, LaunchDarkly)
- [ ] Criar variante "control" (SM-2) e "treatment" (FSRS)
- [ ] Distribuição: 50/50 (randomizado por user_id)

#### Tracking Events
```typescript
// Implementar tracking
analytics.track('flashcard_reviewed', {
  algorithm: 'fsrs', // ou 'sm2'
  rating: 3,
  scheduled_days: 7,
  stability: 10.5,
  difficulty: 5.2,
  user_id: userId,
});
```

#### Métricas de Sucesso
- [ ] Setup dashboard de métricas (Grafana, Metabase)
- [ ] Monitorar:
  - Reviews per day (esperado: -20-30%)
  - Session duration
  - Retention rate (7-day, 30-day)
  - User satisfaction (NPS)
- [ ] Alarmes para anomalias (ex: review volume > +50%)

---

### Semana 4: Testing & Validation

#### Beta Testing
- [ ] Recrutar 50-100 usuários beta
- [ ] Enviar email explicativo sobre FSRS
- [ ] Oferecer incentivo (ex: 1 mês premium grátis)
- [ ] Coletar feedback via formulário

#### QA Checklist
- [ ] Testar migração SM-2 → FSRS (10 usuários reais)
- [ ] Validar que intervalos fazem sentido (não muito curtos/longos)
- [ ] Testar edge cases:
  - Cartão com 0 reviews
  - Cartão com 100+ reviews
  - Usuário com 1000+ cartões
- [ ] Testar performance (tempo de response < 200ms)
- [ ] Testar em mobile (iOS, Android)

---

### Semana 5-8: Monitoring & Rollout

#### Week 5-6: Monitor Beta
- [ ] Revisar métricas diariamente
- [ ] Ajustar parâmetros se necessário (weights FSRS)
- [ ] Resolver bugs críticos

#### Week 7: Rollout Gradual
- [ ] 10% usuários → FSRS (monitorar 2 dias)
- [ ] 25% usuários → FSRS (monitorar 2 dias)
- [ ] 50% usuários → FSRS (monitorar 3 dias)
- [ ] 100% usuários → FSRS (se métricas positivas)

#### Week 8: Post-Rollout
- [ ] Publicar blog post: "Apresentando FSRS-6"
- [ ] Criar video tutorial (YouTube)
- [ ] Update FAQ com perguntas sobre FSRS
- [ ] Enviar newsletter para todos os usuários

---

## 📦 Fase 2: CAT Deployment (P1 - 8-16 semanas)

### Semana 1-3: Core Algorithm

#### API Endpoints
- [ ] `POST /api/simulado/adaptive/start` (Initialize CAT session)
- [ ] `POST /api/simulado/adaptive/next-item` (Get next item)
- [ ] `POST /api/simulado/adaptive/submit-answer` (Update session)
- [ ] `GET /api/simulado/adaptive/session/:id` (Get current state)
- [ ] `POST /api/simulado/adaptive/complete` (Finalize test)

#### Database
- [ ] Validar schema extensions (já migrado na Fase 1)
- [ ] Criar índices para queries frequentes:
  ```sql
  CREATE INDEX idx_item_exposure_recent
    ON item_exposure_log(administered_at DESC);

  CREATE INDEX idx_questions_area_difficulty
    ON questions(area, irt_difficulty);
  ```

#### Item Bank Management
- [ ] Criar dashboard admin para item bank
- [ ] Visualizar exposure rates por questão
- [ ] Marcar questões overexposed (> 0.25)
- [ ] Tool para gerar novas questões (mitigar exposure)

---

### Semana 4-6: Frontend UI

#### CAT Exam UI
- [ ] Criar `/app/simulado/adaptativo/page.tsx`
- [ ] Progress bar dinâmico:
  ```tsx
  <div>
    <span>Questão {itemNum}/30-80</span>
    <ProgressBar value={precision} label={`Precisão: ${precision}%`} />
  </div>
  ```
- [ ] Mostrar cobertura de áreas em tempo real:
  ```
  Áreas Cobertas:
  ✅ Clínica Médica (6)
  ✅ Cirurgia (5)
  ✅ GO (5)
  ✅ Pediatria (6)
  ✅ Saúde Coletiva (5)
  ```
- [ ] Mensagem de conclusão:
  ```
  "Teste concluído em 35 questões! 🎉
  Sua precisão foi alta o suficiente para parar mais cedo."
  ```

#### Results Page
- [ ] Theta trajectory chart (linha + confidence band)
- [ ] Comparação com usuários similares
- [ ] Recomendações baseadas em weak areas
- [ ] Botão "Compartilhar Resultado" (social media)

---

### Semana 7-10: Testing

#### Simulation Testing
- [ ] Criar script de simulação (1000 virtual users)
  ```python
  # simulate_cat.py
  for user in virtual_users:
      session = initialize_cat()
      while not session.complete:
          item = select_item(session)
          answer = simulate_answer(user.theta, item)
          session = update_session(session, answer)

      assert session.items_administered >= MIN_ITEMS
      assert session.se < SE_THRESHOLD
      assert content_balanced(session)
  ```
- [ ] Validar que stopping rules funcionam corretamente
- [ ] Validar content balancing (todas áreas > 15%)
- [ ] Validar exposure control (nenhum item > 30%)

#### Beta Testing
- [ ] Recrutar 200 usuários beta
- [ ] 50% fazem CAT, 50% fazem linear (100 questões)
- [ ] Comparar:
  - Tempo total
  - SE final
  - User satisfaction
  - Pass rate

---

### Semana 11-16: Rollout

#### Week 11-12: Soft Launch
- [ ] Lançar CAT como "Modo Beta"
- [ ] Opt-in (usuário escolhe CAT ou Linear)
- [ ] Coletar feedback via formulário in-app
- [ ] Monitorar session abandonment rate

#### Week 13-14: Optimize
- [ ] Ajustar stopping rules se necessário
- [ ] Calibrar exposure rates
- [ ] Adicionar mais questões ao bank se necessário
- [ ] Resolver bugs

#### Week 15-16: Full Rollout
- [ ] Tornar CAT o padrão para novos simulados
- [ ] Manter opção de Linear para quem preferir
- [ ] Marketing: "Simulados 50% mais rápidos com CAT"
- [ ] Blog post técnico explicando como CAT funciona

---

## 📦 Fase 3: IRT Calibration Pipeline (P2 - 8-16 semanas)

### Python/R Service Setup

#### Week 1-2: Infrastructure
- [ ] Setup Python environment (Docker container)
- [ ] Instalar dependências: `irtQ`, `psycopg2`, `numpy`, `pandas`
- [ ] Criar script `calibration_service.py`
- [ ] Configurar acesso ao database (read-only para queries)

#### Week 3-4: Calibration Logic
- [ ] Implementar warm-start calibration
- [ ] Configurar priors baseados em params atuais
- [ ] Adicionar validação (infit/outfit < 1.5)
- [ ] Logging detalhado (convergence, iterations)

#### Week 5-6: Automation
- [ ] Setup cron job (toda segunda-feira às 2am)
- [ ] Notificações (Slack, email) para:
  - Batch concluído
  - Questões com parameter drift > 0.5
  - Falhas de convergência
- [ ] Dashboard de monitoramento (Grafana)

#### Week 7-8: Testing & Validation
- [ ] Rodar calibration em staging com dados reais
- [ ] Comparar novos params vs antigos (não devem divergir muito)
- [ ] Validar que trigger atualiza questions table
- [ ] Revisar questões flagged (drift alto) manualmente

---

## 📦 Fase 4: Dashboard Enhancements (P3 - 4-8 semanas)

### Week 1-2: Theta Trajectory
- [ ] Implementar LineChart com Recharts
- [ ] Adicionar confidence bands (±1.96 SE)
- [ ] Reference line para passing threshold
- [ ] Hover tooltip com detalhes do exam

### Week 3-4: Forgetting Curve
- [ ] Visualizar curva para cada flashcard
- [ ] Mostrar "Today" marker
- [ ] Mostrar retrievability atual
- [ ] Highlight quando R < 0.8 (review recomendado)

### Week 5-6: Recommendations Engine
- [ ] Algoritmo de weak areas detection
- [ ] Sugestões de learning paths
- [ ] Streak reminders
- [ ] Goal-setting UI

### Week 7-8: Export & Sharing
- [ ] Export dashboard to PDF (jsPDF)
- [ ] Share on social media (Open Graph tags)
- [ ] Weekly email summary (automated)

---

## 📦 Fase 5: React Native Mobile (P4 - 12 semanas)

### Week 1-3: Bootstrap
- [ ] `pnpm create expo-app@latest apps/mobile`
- [ ] Setup Expo Router
- [ ] Configurar TypeScript
- [ ] Setup Supabase client
- [ ] Implementar auth flow

### Week 4-6: Offline Flashcards
- [ ] Install WatermelonDB
- [ ] Implement sync logic
- [ ] Offline queue for reviews
- [ ] Background sync when online

### Week 7-9: Core Features
- [ ] Flashcard review UI (swipe gestures)
- [ ] Exam taking (CAT mode)
- [ ] Dashboard (read-only)
- [ ] Settings

### Week 10: Push Notifications
- [ ] Setup Expo Notifications
- [ ] Daily study reminder (8pm)
- [ ] Streak about to break (23:30)
- [ ] New content available

### Week 11-12: Testing & Launch
- [ ] Internal testing (TestFlight, Internal Testing)
- [ ] Beta testing (100 users)
- [ ] Fix critical bugs
- [ ] Submit to App Store / Play Store
- [ ] Marketing campaign

---

## 🎯 Success Criteria

### FSRS Adoption
- [ ] ≥ 60% active users migrated to FSRS (3 meses)
- [ ] Review volume -20% vs SM-2 baseline
- [ ] User satisfaction (NPS) ≥ 50
- [ ] < 5% revert back to SM-2

### CAT Performance
- [ ] ≥ 40% users opt-in for CAT (6 meses)
- [ ] Average test length: 45-55 questões (vs 100)
- [ ] SE < 0.30 achieved in 95% of sessions
- [ ] Content balance: all areas ≥ 15% (tolerance 5%)
- [ ] Time savings: 40-50% vs linear

### Platform Health
- [ ] Database performance: p95 query time < 200ms
- [ ] API uptime: ≥ 99.5%
- [ ] Mobile crash-free rate: ≥ 99%
- [ ] User growth: +20% MoM after launch

---

## ⚠️ Riscos & Mitigação

### Risco 1: FSRS intervals muito longos
**Mitigação**:
- Monitorar average stability
- Ajustar requestRetention (0.9 → 0.85 se necessário)
- Permitir usuário ajustar target retention

### Risco 2: CAT item bank esgotamento
**Mitigação**:
- Monitorar exposure rates semanalmente
- Adicionar 50+ novas questões por área trimestralmente
- Fallback para linear se bank < 200 questões

### Risco 3: Calibration divergence
**Mitigação**:
- Alertas para drift > 0.5
- Revisão manual mensal
- Rollback mechanism para params ruins

### Risco 4: User confusion (mudança de algoritmo)
**Mitigação**:
- Onboarding tutorial
- Video explicativo
- FAQ detalhado
- Suporte proativo

---

## 📞 Contatos de Emergência

### Technical Lead
- Nome: [Seu Nome]
- Email: [email]
- Phone: [phone]

### DevOps
- On-call: [Pagerduty/Oncall link]

### Database Admin
- DBA: [Nome]
- Backup restore: [Procedimento]

---

## ✅ Sign-off

### Product Manager
- [ ] Aprovado para Fase 1 (FSRS)
- [ ] Aprovado para Fase 2 (CAT)
- [ ] Orçamento confirmado
- Data: ___________  Assinatura: ___________

### Tech Lead
- [ ] Revisão técnica completa
- [ ] Infraestrutura pronta
- [ ] Equipe alocada (2-3 devs)
- Data: ___________  Assinatura: ___________

### QA Lead
- [ ] Test plan aprovado
- [ ] Recursos de QA alocados
- Data: ___________  Assinatura: ___________

---

**Último Update**: 2026-01-30
**Próxima Revisão**: [Agendar weekly sync]
