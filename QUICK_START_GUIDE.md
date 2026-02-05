# Darwin Education - Quick Start Guide

**Status**: ✅ **ALL SYSTEMS OPERATIONAL**

---

## 🚀 Access the Application

### Live Deployment
- **URL**: https://darwinhub.org
- **Status**: ✅ Live on Vercel
- **Last Deploy**: 2025-02-04 09:37:54 UTC

### Local Development
```bash
cd /home/demetrios/Darwin-education

# Install dependencies
pnpm install

# Start dev server (Turbopack)
pnpm dev

# Available at: http://localhost:3000
```

---

## 📚 Core Features

### 1. ENAMED Simulado (Practice Exams)
**URL**: `/simulado`

**Features**:
- Full ENAMED exam simulation (100 questions)
- TRI scoring (adaptive difficulty)
- Real-time performance metrics
- Question explanation with AI (Grok)

**How to Use**:
1. Go to `/simulado`
2. Click "Iniciar Simulado"
3. Answer questions at your own pace
4. Submit to see TRI score breakdown

**AI Features**:
- Click "Explicar" on any question to get AI explanation
- AI explains why answer is correct/incorrect
- Cites medical principles

---

### 2. Flashcards (Spaced Repetition)
**URL**: `/flashcards`

**Features**:
- SM-2 spaced repetition algorithm
- Create custom decks
- Study sessions with adaptive scheduling
- Progress tracking

**How to Use**:
1. Go to `/flashcards`
2. Click "Criar Novo Deck"
3. Add cards (medical concepts)
4. Start study session
5. Rate cards 0-5 (5 = easy, 0 = hard)
6. System reschedules based on SM-2

---

### 3. Learning Paths (Trilhas)
**URL**: `/trilhas`

**Features**:
- Structured learning sequences
- 6 study paths by medical specialty
- Module-based progression
- Integrated with simulados and flashcards

**How to Use**:
1. Go to `/trilhas`
2. Select a path (Clínica Médica, Cirurgia, etc.)
3. Complete modules in order
4. Track progress on dashboard

---

### 4. Medical Content Library
**URL**: `/conteudo`

**Features**:
- 368 diseases (Darwin-MFC)
- 690 medications with full pharmacology
- Interactive search and filters
- Theory pages with citations

**How to Use**:
1. Go to `/conteudo/doencas` (diseases)
2. Search or filter by specialty
3. Click disease for detailed view
4. See related medications, ICD codes, treatment protocols

---

### 5. Performance Dashboard
**URL**: `/desempenho`

**Features**:
- Score trends over time
- Area-by-area breakdown (TRI scores)
- Study time analytics
- Weak areas identification

**How to Use**:
1. Go to `/desempenho`
2. View overall metrics
3. Drill down by area
4. See recommended focus areas

---

### 6. Learning Gap Detection (DDL)
**URL**: `/ddl`

**Features**:
- AI-powered gap detection
- Generated test questions based on weak areas
- Focused learning recommendations
- Progress tracking

**How to Use**:
1. Go to `/ddl`
2. Complete gap assessment
3. System identifies weak areas
4. Get targeted questions in those areas

---

## 🤖 AI Features

### Question Generation (`Gerar Questão`)
**URL**: `/gerar-questao`

**How to Use**:
1. Go to `/gerar-questao`
2. Select specialty (Clínica Médica, Cirurgia, etc.)
3. Choose difficulty (1-5)
4. Click "Gerar Questão"
5. AI generates ENAMED-style question (Grok-4-fast)

**Behind the Scenes**:
- Grok API generates question stem and options
- System extracts JSON and validates format
- Question cached for 90 days
- Cost: ~$0.06 per question

**Credits**:
- Each user gets 10 credits/day
- 1 credit = 1 generated question
- Resets daily at midnight

### Question Explanation
**Available on**: Simulado results, Generated questions

**How to Use**:
1. After answering any question
2. Click "Explicar"
3. AI provides explanation
4. Cites medical principles
5. Explains correct answer

---

### Case Study Generation
**URL**: `/caso-clinico`

**Features**:
- Generate clinical cases for study
- Case-based learning
- Structured presentation (diagnosis, workup, treatment)

**How to Use**:
1. Go to `/caso-clinico`
2. Select specialty
3. Click "Gerar Caso"
4. Study case and try to diagnose
5. See expert solution and explanation

---

## 📈 Theory Generation (Admin)
**URL**: `/admin/theory-gen` (admin only)

**Features**:
- Generate 100+ medical theory topics
- Multi-source research (Darwin-MFC + web)
- 5-stage validation pipeline
- Review queue for human approval

### Generate Single Topic

**Steps**:
1. Go to `/admin/theory-gen`
2. Select "Darwin-MFC Disease" source
3. Choose disease from dropdown (368 options)
4. Click "Gerar Tópico"
5. Wait for generation (10-20 seconds)
6. System shows:
   - Generated content (8 sections)
   - Validation score (0-1)
   - Citations (5+ sources)
   - Estimated read time

**Output**:
- Status: "approved" (≥0.90), "review" (0.70-0.89), or "draft" (<0.70)
- Auto-published if score ≥ 0.90
- Human review if 0.70-0.89

### Generate Batch

**Steps**:
1. Go to `/admin/theory-gen`
2. Click "Gerar Lote"
3. Enter topics to generate (5-50)
4. Set concurrency (default: 3 parallel)
5. Click "Iniciar Lote"
6. Monitor progress in real-time
7. Topics auto-approved if score ≥ 0.90

**Costs**:
- ~$0.08 per topic
- 100 topics = ~$8 total
- Batch of 20 topics = ~$1.60

### Review Topics

**Steps**:
1. Go to `/admin/theory-gen/review`
2. View topics in "review" status (score 0.70-0.89)
3. Check validation flags
4. Inspect citations (accessibility, recency)
5. Click "Aprovar" or "Rejeitar"
6. Add notes if needed
7. Approved topics auto-published

### View Statistics

**Steps**:
1. Go to `/admin/theory-gen/stats`
2. See dashboard showing:
   - Total topics generated
   - By area (Clínica Médica, Cirurgia, etc.)
   - By difficulty (básico, intermediário, avançado)
   - Average validation score
   - Auto-approval rate
   - Total cost spent
   - Citation metrics

---

## 🔐 Authentication

### Student/User Access
1. Go to `/signup` to create account
2. Provide email + password
3. Verify email (check inbox)
4. Login at `/login`
5. Automatic access to all study features

### Admin Access
**Required**: Set `role = 'admin'` in Supabase auth

**Steps** (for admins):
1. Access `/admin/*` routes
2. Can generate and review theory topics
3. Can view audit trails
4. Can monitor AI costs

---

## 💻 API Endpoints (for developers)

### AI Features
```
POST /api/ai/generate-question
  Body: { area, topic?, difficulty?, focus? }
  Returns: { text, parsed, cached, tokensUsed, costBRL }

POST /api/ai/explain
  Body: { stem, options, correctIndex, selectedIndex? }
  Returns: { text, cached, tokensUsed, costBRL }

POST /api/ai/case-study
  Body: { area, topic?, difficulty? }
  Returns: { text, parsed, cached, tokensUsed, costBRL }

POST /api/ai/summarize
  Body: { sourceText, contentType, name, length? }
  Returns: { text, cached, tokensUsed, costBRL }

GET /api/ai/stats
  Returns: { creditsRemaining, creditsTotal, resetAt, monthlyUsage }
```

### Theory Generation
```
POST /api/theory-gen/generate
  Body: { source, sourceId, topicTitle, area, targetDifficulty? }
  Returns: { topic, validation, status, cost_usd }

POST /api/theory-gen/batch
  Body: { topics: GenerationRequest[], concurrency?, costLimit? }
  Returns: { jobId, totalTopics, status }

GET /api/theory-gen/review
  Returns: AdminReviewQueueItem[]

PATCH /api/theory-gen/review/[topicId]
  Body: { action, notes? }
  Returns: { status, updatedAt }

GET /api/theory-gen/stats
  Returns: GenerationStatistics
```

---

## 📊 Key Metrics

### System Health
- ✅ TypeScript build: 0 errors
- ✅ Next.js build: 48 routes
- ✅ API endpoints: 15 active
- ✅ Database: 12 tables + 8 audit tables
- ✅ Grok API: Connected and working

### Performance
| Operation | Time | Cost |
|-----------|------|------|
| Generate question | 5-10s | $0.06 |
| Generate case study | 10-15s | $0.08 |
| Explain concept | 3-5s | $0.02 |
| Generate theory topic | 10-20s | $0.08 |
| Validate topic | 3-5s | $0.01 |

### Scaling
- Single topic generation: <20 seconds
- Batch generation: 3 topics/minute (3 concurrent)
- 100 topics: ~2-3 hours total
- Cost for 100 topics: ~$8-10 USD

---

## 🐛 Troubleshooting

### "Failed to generate question"
**Cause**: Grok API not responding or credits exhausted
**Fix**:
- Check `/api/ai/stats` for remaining credits
- Credits reset daily at midnight (UTC)
- Wait or contact admin for more credits

### "Topic not found" on search
**Cause**: Medical data package not loaded
**Fix**:
- Fallback: Empty data is shown
- Try refreshing page
- Check browser console for errors

### "Unauthorized" on `/admin/*`
**Cause**: User is not admin
**Fix**:
- Contact system admin to set `role = 'admin'`
- In Supabase auth, update user metadata

### "Validation error" on theory generation
**Cause**: Generated content failed 5-stage validation
**Fix**:
- Check validation score in response
- If 0.70-0.89: Review queue (manual approval needed)
- If <0.70: Regenerate with different parameters

---

## 📞 Support & Next Steps

### Immediate Actions
1. ✅ Test a simulado at `/simulado`
2. ✅ Try AI explanation on a question
3. ✅ Create a flashcard deck at `/flashcards`
4. ✅ Browse medical content at `/conteudo`

### For Admins
1. Generate a theory topic at `/admin/theory-gen`
2. Monitor generation in `/admin/theory-gen/stats`
3. Review topics in `/admin/theory-gen/review`
4. Publish approved topics

### For Developers
1. Deploy: `git push` → auto-deploys to Vercel
2. Local dev: `pnpm dev`
3. Type-check: `pnpm type-check`
4. Build: `pnpm build`

### Documentation
- Deployment status: [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)
- Theory generation details: [THEORY_GENERATION_STATUS.md](./THEORY_GENERATION_STATUS.md)
- Architecture: [CLAUDE.md](./CLAUDE.md)

---

## ✨ Summary

**Darwin Education is fully operational with**:
- ✅ AI-powered question generation (Grok-4-fast)
- ✅ Comprehensive study platform (simulados, flashcards, paths)
- ✅ Medical content library (368 diseases, 690 medications)
- ✅ Learning gap detection system
- ✅ Theory generation pipeline (100+ topics possible)
- ✅ Admin dashboard for content management
- ✅ Audit trails and quality control
- ✅ Cost-effective scaling ($0.08 per topic)

**Ready to**:
1. Take practice exams
2. Study with flashcards
3. Generate custom questions
4. Generate theory content
5. Track performance

**Start at**: https://darwinhub.org
