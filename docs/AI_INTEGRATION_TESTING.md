# AI Integration - Testing Guide

## Quick Start

### 1. Environment Setup

Copy the example environment file and fill in your Minimax API credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your credentials:
```env
MINIMAX_API_KEY=sk_your_actual_key_here
MINIMAX_GROUP_ID=your_actual_group_id
```

### 2. Database Migration

Apply the AI integration migrations:

```bash
# If using Supabase CLI locally
supabase db push

# Or manually run in Supabase dashboard SQL editor:
# - infrastructure/supabase/migrations/003_ai_integration.sql
# - infrastructure/supabase/migrations/004_ml_feature_store.sql
```

### 3. Start Development Server

```bash
pnpm dev
```

The API routes will be available at:
- `http://localhost:3000/api/ai/explain`
- `http://localhost:3000/api/ai/generate-question`
- `http://localhost:3000/api/ai/case-study`
- `http://localhost:3000/api/ai/summarize`

## API Testing

### Using curl

**1. Explain Answer (POST /api/ai/explain):**

```bash
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -d '{
    "stem": "Paciente de 45 anos apresenta dor torácica. Qual diagnóstico?",
    "options": [
      {"letter": "A", "text": "Infarto agudo do miocárdio"},
      {"letter": "B", "text": "Pericardite"},
      {"letter": "C", "text": "Pneumonia"},
      {"letter": "D", "text": "Refluxo gastroesofágico"}
    ],
    "correctIndex": 0,
    "selectedIndex": 3
  }'
```

**Expected Response:**
```json
{
  "text": "A resposta correta é A (Infarto agudo do miocárdio)...",
  "cached": false,
  "remaining": 4,
  "resetAt": "2025-01-29T00:00:00.000Z",
  "tokensUsed": 450,
  "costBRL": 0.0009
}
```

**2. Generate Question (POST /api/ai/generate-question):**

```bash
curl -X POST http://localhost:3000/api/ai/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -d '{
    "area": "clinica_medica",
    "topic": "Cardiologia",
    "difficulty": "medio"
  }'
```

**Expected Response:**
```json
{
  "text": "{\"stem\": \"...\", \"options\": [...]}",
  "parsed": {
    "stem": "Paciente com dispneia...",
    "options": [
      {"letter": "A", "text": "...", "feedback": "..."},
      ...
    ],
    "correct_index": 0,
    "explanation": "...",
    "irt": {
      "difficulty": 0.5,
      "discrimination": 1.2,
      "guessing": 0.25
    }
  },
  "cached": false,
  "remaining": 3,
  "tokensUsed": 850,
  "costBRL": 0.0017
}
```

**3. Test Caching:**

Run the same request again - you should get `"cached": true` and `remaining` count unchanged:

```bash
# Run the explain request again
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -d '{...same payload...}'
```

**Expected Response:**
```json
{
  "text": "A resposta correta é...",
  "cached": true,  // <-- Now cached!
  "tokensUsed": 450,
  "costBRL": 0.0009
}
```

**4. Test Rate Limiting:**

Make 6 requests in a row (free tier limit is 5/day):

```bash
# Request #6 should fail with 429
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/ai/explain \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
    -d '{"stem": "Test '$i'", "options": [{"letter": "A", "text": "A"}], "correctIndex": 0}' \
    | jq .
  echo ""
done
```

**Expected on 6th request:**
```json
{
  "error": "ai_credits_exhausted",
  "remaining": 0,
  "resetAt": "2025-01-29T00:00:00.000Z"
}
```

## Unit Testing (TODO)

Create test files for each module:

```bash
# Shared package tests
packages/shared/src/services/ai/__tests__/
├── minimax-client.test.ts
├── cache.test.ts
└── prompts/
    ├── explanations.test.ts
    └── question-generation.test.ts

# Web app tests
apps/web/lib/ai/__tests__/
├── credits.test.ts
├── cache.test.ts
└── minimax.test.ts
```

**Example test case (cache.test.ts):**

```typescript
import { AICache } from '@darwin-education/shared';

describe('AICache', () => {
  it('generates consistent cache keys', () => {
    const cache = new AICache();
    const key1 = cache.generateKey('explain', { stem: 'Test', options: ['A'] });
    const key2 = cache.generateKey('explain', { options: ['A'], stem: 'Test' });
    expect(key1).toBe(key2);
  });

  it('calculates cost correctly', () => {
    const cache = new AICache();
    expect(cache.calculateCost(1000)).toBe(0.002);
    expect(cache.calculateCost(500)).toBe(0.001);
  });
});
```

## Integration Testing Checklist

- [ ] ✅ All API routes return 401 when unauthenticated
- [ ] ✅ Rate limiting enforces 5/day for free tier
- [ ] ✅ Cache hit returns cached response without calling Minimax
- [ ] ✅ Cost calculation matches expected value (R$0.002/1K tokens)
- [ ] ✅ Question generation returns valid JSON
- [ ] ✅ Explanations are in Portuguese (pt-BR)
- [ ] ✅ Cache entries have correct TTL
- [ ] ✅ Admin Supabase client can write to ai_response_cache
- [ ] ✅ Token usage tracked correctly

## Manual UI Testing (TODO - Week 12-13)

Once question generation UI is built:

1. Navigate to `/generate-question` page
2. Select area: "Clínica Médica"
3. Select topic: "Cardiologia"
4. Click "Gerar Questão"
5. Verify question appears with 4 options
6. Verify IRT parameters displayed
7. Submit to validation queue
8. Expert reviews and approves/rejects

## Performance Testing

### Cache Hit Rate Monitoring

Query Supabase to calculate cache hit rate:

```sql
SELECT
  request_type,
  COUNT(*) AS total_entries,
  SUM(hits) AS total_hits,
  ROUND(SUM(hits)::numeric / (COUNT(*) + SUM(hits)) * 100, 2) AS hit_rate_pct
FROM ai_response_cache
GROUP BY request_type;
```

**Target:** >80% hit rate after 1 week of usage

### Cost Tracking

Query total AI costs:

```sql
SELECT
  DATE(created_at) AS date,
  request_type,
  COUNT(*) AS requests,
  SUM(tokens_used) AS total_tokens,
  SUM(cost_brl) AS total_cost_brl
FROM ai_response_cache
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), request_type
ORDER BY date DESC;
```

**Target:** <R$100/month total spend

## Troubleshooting

### Issue: "Missing MINIMAX_API_KEY"

**Solution:** Add environment variable to `.env.local`:
```env
MINIMAX_API_KEY=sk_your_key_here
```

### Issue: "Unable to load AI credit profile"

**Solution:** Check that migrations 003/004 are applied:
```sql
-- Verify profiles table has AI columns
SELECT ai_credits_remaining, ai_credits_reset_at
FROM profiles
LIMIT 1;
```

### Issue: Cache not working

**Solution:** Check that `ai_response_cache` table exists and admin client has permissions:
```sql
SELECT * FROM ai_response_cache LIMIT 1;
```

### Issue: JSON parsing fails

**Solution:** Check Minimax API response format. The `extractJsonFromText()` function looks for JSON between `{` and `}`. If LLM returns invalid JSON, it will return `null`.

## Next Steps

1. **Week 12-13:** Build question generation UI
2. **Week 14:** Integrate explanations into exam results
3. **Week 15:** Build case study interactive UI
4. **Week 16:** Build cost tracking dashboard

## Monitoring

Set up alerts for:
- Daily AI spend >R$10
- Cache hit rate <50%
- API error rate >5%
- Average response time >5s

## Documentation

- API docs: See `docs/AI_INTEGRATION_SPRINT_COMPLETE.md`
- Environment: `apps/web/.env.example`
- Types: `packages/shared/src/types/ai.ts`
- Database: `infrastructure/supabase/migrations/003_ai_integration.sql`
