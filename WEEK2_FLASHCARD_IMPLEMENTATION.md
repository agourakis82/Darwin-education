# Week 2: Flashcard FSRS Implementation - Complete

## What Was Implemented

### 1. FSRS-6 API Endpoints ✅

Created four REST API endpoints for flashcard functionality:

#### POST `/api/flashcards/review` ([route.ts](apps/web/app/api/flashcards/review/route.ts))
- Submits flashcard review with FSRS-6 rating (1-4: Again, Hard, Good, Easy)
- Schedules next review using FSRS algorithm
- Supports both new `flashcard_review_states` and legacy `flashcard_sm2_states` tables
- Returns next review date and updated card state

#### GET `/api/flashcards/due` ([route.ts](apps/web/app/api/flashcards/due/route.ts))
- Retrieves due flashcards for review
- Supports filtering by deck and area
- Returns cards sorted by: new cards first, then by days overdue
- Limit parameter (default 50)

#### GET `/api/flashcards/stats` ([route.ts](apps/web/app/api/flashcards/stats/route.ts))
- Returns flashcard statistics:
  - Total cards
  - Cards by state (new, learning, review, relearning)
  - Due today / due this week counts
  - Streak days
  - Reviews today
  - Average retention estimate

#### POST `/api/flashcards/create` ([route.ts](apps/web/app/api/flashcards/create/route.ts))
- Creates new flashcard
- Auto-creates "Erros de Simulado" deck if needed
- Prevents duplicate flashcards from same question
- Links flashcard to original exam question

### 2. Updated UI Components ✅

#### ReviewButtons Component ([ReviewButtons.tsx](apps/web/app/flashcards/components/ReviewButtons.tsx))
- FSRS-6 4-button rating system:
  - 1: Errei (Again - red)
  - 2: Difícil (Hard - orange)
  - 3: Bom (Good - green)
  - 4: Fácil (Easy - blue)
- Keyboard shortcuts (1-4)
- Optional interval display for each button

#### Flashcard Study Page ([page.tsx](apps/web/app/flashcards/study/page.tsx))
- Fetches due cards on load
- Flip animation (Space/Enter)
- Progress tracking
- Session completion screen with stats
- Integrates with FSRS review API

### 3. Exam Review Integration ✅

#### Review Page ([review/page.tsx](apps/web/app/simulado/[examId]/review/page.tsx))
- Shows all questions from completed exam
- Highlights correct/incorrect answers
- "Save to Flashcards" button for wrong answers
- Auto-generates flashcard with:
  - Front: Question stem
  - Back: Correct answer + explanation
  - Links to original question
  - Tagged with area and "erro-simulado"

## Technical Details

### FSRS-6 Algorithm

Uses the `@darwin-education/shared` package FSRS implementation:
- `scheduleCard()` - Schedules next review based on rating
- `createFSRSCard()` - Creates initial card state
- State transitions: new → learning → review → relearning
- Difficulty and stability parameters adjust over time

### Database Schema

Supports migration from SM-2 to FSRS:
- New columns: `fsrs_difficulty`, `fsrs_stability`, `fsrs_reps`, `fsrs_lapses`, `fsrs_state`
- Legacy columns: `ease_factor`, `interval_days`, `repetitions` (kept for compatibility)
- Migration 005 created the schema extensions

### Frontend Architecture

- Next.js 15 App Router
- React Server Components for data fetching
- Client components for interactivity
- Supabase for auth and data persistence

## Testing Instructions

### 1. Test Flashcard Creation from Exam

```bash
# 1. Login at: http://192.168.3.232:3001/login
# 2. Create exam attempt in Supabase:

INSERT INTO exam_attempts (id, exam_id, user_id, answers, total_time_seconds, theta, standard_error, scaled_score, passed, correct_count, area_breakdown, started_at, completed_at)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::UUID,
  id,
  '{"11111111-1111-1111-1111-111111111111": 0, "22222222-2222-2222-2222-222222222222": 0, "33333333-3333-3333-3333-333333333333": 0, "44444444-4444-4444-4444-444444444444": 1, "55555555-5555-5555-5555-555555555555": 0}'::JSONB,
  600, 0.505, 0.317, 551, false, 4,
  '{"clinica_medica":{"correct":1,"total":1,"percentage":100},"cirurgia":{"correct":1,"total":1,"percentage":100},"pediatria":{"correct":1,"total":1,"percentage":100},"ginecologia_obstetricia":{"correct":0,"total":1,"percentage":0},"saude_coletiva":{"correct":1,"total":1,"percentage":100}}'::JSONB,
  NOW() - INTERVAL '10 minutes', NOW()
FROM auth.users WHERE email = 'test@test';

# 3. Go to: http://192.168.3.232:3001/simulado/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/review
# 4. Click "Salvar" on the wrong answer (GO question)
# 5. Verify flashcard created in "Erros de Simulado" deck
```

### 2. Test Flashcard Review

```bash
# 1. Go to: http://192.168.3.232:3001/flashcards/study
# 2. Verify flashcard appears (should have 1 due)
# 3. Click card to flip
# 4. Rate the flashcard (1-4)
# 5. Verify next review scheduled
# 6. Check stats at: http://192.168.3.232:3001/flashcards
```

### 3. Verify FSRS Calculation

```bash
cd /home/demetrios/Darwin-education/packages/shared
pnpm dlx tsx -e "
import { scheduleCard, createFSRSCard } from './src/calculators/fsrs';

const card = createFSRSCard();
console.log('New card:', card);

const { card: updated, log } = scheduleCard(card, 3, new Date()); // Rating: Good
console.log('After review:');
console.log('  State:', updated.state);
console.log('  Next review:', updated.due);
console.log('  Scheduled days:', log.scheduled_days);
console.log('  Difficulty:', updated.difficulty);
console.log('  Stability:', updated.stability);
"
```

## Next Steps (Week 3)

1. **Docker Deployment**
   - Create `docker-compose.yml` for local dev
   - Update `next.config.ts` for standalone builds
   - Add Dockerfile with multi-stage build

2. **Performance Page**
   - Show TRI progression over time
   - Area performance trends
   - Flashcard retention statistics
   - Study streak visualization

3. **Advanced FSRS Features**
   - Fuzz dates to avoid same-day clumping
   - Load balancing for review scheduling
   - Custom FSRS parameters per user

## Files Modified/Created

### Created:
- `apps/web/app/api/flashcards/review/route.ts` (154 lines)
- `apps/web/app/api/flashcards/due/route.ts` (192 lines)
- `apps/web/app/api/flashcards/stats/route.ts` (198 lines)
- `apps/web/app/api/flashcards/create/route.ts` (142 lines)

### Modified:
- `apps/web/app/flashcards/components/ReviewButtons.tsx` (99 lines)

### Already Exists (No changes needed):
- `apps/web/app/flashcards/study/page.tsx` (294 lines)
- `apps/web/app/simulado/[examId]/review/page.tsx` (477 lines)

## Server Info

Dev server running at: **http://192.168.3.232:3001**

## Architecture Decisions

1. **FSRS over SM-2**: More accurate scheduling, better long-term retention
2. **Backend-only calculation**: Keeps scheduling logic secure and consistent
3. **Backward compatibility**: Supports legacy SM-2 states during migration
4. **Auto-deck creation**: Reduces friction for users creating flashcards from errors
5. **Duplicate prevention**: Prevents creating multiple flashcards for same question

## Known Limitations

1. Migration from SM-2 states is lossy (no direct difficulty/stability mapping)
2. No bulk operations (review multiple cards in one request)
3. No offline support
4. Stats calculation is approximate (not real FSRS retention formula)

---

**Status**: ✅ Week 2 Complete - Ready for testing and Docker deployment (Week 3)
