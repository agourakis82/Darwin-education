# Darwin Education: Usage Examples

Code examples for integrating FSRS-6 and CAT algorithms.

---

## Table of Contents

1. [FSRS-6 Flashcard Review](#fsrs-6-flashcard-review)
2. [CAT Adaptive Exam](#cat-adaptive-exam)
3. [Migrating SM-2 to FSRS](#migrating-sm-2-to-fsrs)
4. [IRT Calibration Pipeline](#irt-calibration-pipeline)
5. [Dashboard Components](#dashboard-components)

---

## FSRS-6 Flashcard Review

### Basic Review Flow

```typescript
import {
  createFSRSCard,
  scheduleCard,
  getDueCards,
  FSRS_RATING_LABELS,
  type FSRSCard,
  type FSRSRating
} from '@darwin-education/shared/calculators/fsrs';

// 1. Create new card for user
const newCard: FSRSCard = createFSRSCard();

// Save to database
await supabase.from('flashcard_review_states').insert({
  user_id: userId,
  flashcard_id: flashcardId,
  algorithm: 'fsrs',
  fsrs_difficulty: newCard.difficulty,
  fsrs_stability: newCard.stability,
  fsrs_reps: newCard.reps,
  fsrs_lapses: newCard.lapses,
  fsrs_state: newCard.state,
  next_review: newCard.due,
  last_review: null
});

// 2. User reviews card, rates it (1-4)
const rating: FSRSRating = 3; // "Good"
const now = new Date();

const { card: updatedCard, log } = scheduleCard(
  newCard,
  rating,
  now,
  DEFAULT_FSRS_PARAMETERS
);

// 3. Update database
await supabase
  .from('flashcard_review_states')
  .update({
    fsrs_difficulty: updatedCard.difficulty,
    fsrs_stability: updatedCard.stability,
    fsrs_reps: updatedCard.reps,
    fsrs_lapses: updatedCard.lapses,
    fsrs_state: updatedCard.state,
    next_review: updatedCard.due,
    last_review: updatedCard.lastReview,
  })
  .eq('flashcard_id', flashcardId)
  .eq('user_id', userId);

// 4. Log review for later parameter optimization
await supabase.from('flashcard_review_log').insert({
  flashcard_id: flashcardId,
  user_id: userId,
  rating: log.rating,
  stability: log.stability,
  difficulty: log.difficulty,
  scheduled_days: log.scheduled_days,
});
```

### Review Queue with Due Cards

```typescript
import { getDueCards, calculateFSRSStats } from '@darwin-education/shared/calculators/fsrs';

// Fetch user's cards from database
const { data: cardsData } = await supabase
  .from('flashcard_review_states')
  .select('*')
  .eq('user_id', userId)
  .eq('algorithm', 'fsrs');

// Convert to FSRSCard format
const cards: FSRSCard[] = cardsData.map(row => ({
  difficulty: row.fsrs_difficulty,
  stability: row.fsrs_stability,
  reps: row.fsrs_reps,
  lapses: row.fsrs_lapses,
  state: row.fsrs_state,
  lastReview: new Date(row.last_review),
  due: new Date(row.next_review),
}));

// Get cards due today
const dueCards = getDueCards(cards);

console.log(`${dueCards.length} cards due for review`);

// Show statistics
const stats = calculateFSRSStats(cards);
console.log(`
  Total: ${stats.total}
  New: ${stats.new}
  Learning: ${stats.learning}
  Review: ${stats.review}
  Due today: ${stats.dueToday}
  Avg difficulty: ${stats.averageDifficulty.toFixed(2)}
  Avg stability: ${stats.averageStability.toFixed(2)} days
  Avg retrievability: ${(stats.averageRetrievability * 100).toFixed(1)}%
`);
```

### Show Next Review Intervals (UI)

```tsx
import { getReviewIntervals, FSRS_RATING_LABELS, FSRS_RATING_COLORS } from '@darwin-education/shared/calculators/fsrs';

function FlashcardReviewButtons({ card }: { card: FSRSCard }) {
  const intervals = getReviewIntervals(card);

  return (
    <div className="flex gap-2">
      {([1, 2, 3, 4] as FSRSRating[]).map(rating => (
        <button
          key={rating}
          onClick={() => handleReview(card, rating)}
          className={`btn btn-${FSRS_RATING_COLORS[rating]}`}
        >
          {FSRS_RATING_LABELS[rating]}
          <span className="text-xs">({intervals[rating]}d)</span>
        </button>
      ))}
    </div>
  );
}

// Example output:
// [Novamente (1d)] [Difícil (3d)] [Bom (7d)] [Fácil (14d)]
```

---

## CAT Adaptive Exam

### Starting a CAT Session

```typescript
import {
  initCATSession,
  selectNextItem,
  updateCATSession,
  DEFAULT_CAT_CONFIG,
  type CATSession
} from '@darwin-education/shared/algorithms/cat';
import type { ENAMEDQuestion } from '@darwin-education/shared';

// 1. Initialize session
let session: CATSession = initCATSession();

// 2. Load item bank
const { data: itemBank } = await supabase
  .from('questions')
  .select('*')
  .eq('bank_id', selectedBankId);

// 3. Load exposure rates (from view)
const { data: exposureData } = await supabase
  .from('v_item_exposure_rates')
  .select('question_id, exposure_rate');

const exposureRates = new Map(
  exposureData.map(row => [row.question_id, row.exposure_rate])
);

// 4. Select first item
const firstItem = selectNextItem(
  session,
  itemBank as ENAMEDQuestion[],
  exposureRates,
  DEFAULT_CAT_CONFIG
);

// 5. Save CAT session to database
const { data: attemptData } = await supabase
  .from('exam_attempts')
  .insert({
    user_id: userId,
    exam_id: null, // CAT doesn't use predefined exam
    is_adaptive: true,
    started_at: new Date(),
  })
  .select()
  .single();

const attemptId = attemptData.id;
```

### Updating After Each Response

```typescript
// User answers question
const userAnswer = 2; // Selected option index
const isCorrect = userAnswer === currentItem.correctIndex;

// Update session
session = updateCATSession(
  session,
  currentItem.id,
  isCorrect,
  currentItem.ontology.area,
  currentItem.irt,
  DEFAULT_CAT_CONFIG
);

// Log item exposure
await supabase.from('item_exposure_log').insert({
  question_id: currentItem.id,
  exam_attempt_id: attemptId,
  user_theta: session.theta,
  administered_at: new Date(),
});

// Update exam attempt
await supabase
  .from('exam_attempts')
  .update({
    theta_trajectory: session.thetaHistory,
    items_administered: session.itemsAdministered,
  })
  .eq('id', attemptId);

// Check if complete
if (session.isComplete) {
  // Finalize exam
  await supabase
    .from('exam_attempts')
    .update({
      completed_at: new Date(),
      theta: session.theta,
      standard_error: session.se,
      scaled_score: 500 + session.theta * 100,
      passed: (500 + session.theta * 100) >= 600,
      stopping_reason: session.stoppingReason,
    })
    .eq('id', attemptId);

  console.log(`CAT completed: ${session.itemsAdministered.length} items`);
  console.log(`Final theta: ${session.theta.toFixed(3)}, SE: ${session.se.toFixed(3)}`);
  console.log(`Stopping reason: ${session.stoppingReason}`);
} else {
  // Select next item
  const nextItem = selectNextItem(
    session,
    itemBank as ENAMEDQuestion[],
    exposureRates,
    DEFAULT_CAT_CONFIG
  );

  // Present next item to user...
}
```

### CAT Progress Display (UI)

```tsx
import { getPrecisionPercentage, getAreaCoverage } from '@darwin-education/shared/algorithms/cat';

function CATProgress({ session }: { session: CATSession }) {
  const precision = getPrecisionPercentage(session.se);
  const areaCoverage = getAreaCoverage(session);
  const totalItems = session.itemsAdministered.length;

  return (
    <div className="cat-progress">
      <div className="progress-bar">
        <span>Question {totalItems}/30-80</span>
        <span>Precision: {precision.toFixed(1)}%</span>
      </div>

      <div className="area-coverage">
        <h4>Areas Covered:</h4>
        {Object.entries(areaCoverage).map(([area, count]) => (
          <div key={area}>
            {areaLabels[area]}: {count} questions
          </div>
        ))}
      </div>

      {session.isComplete && (
        <div className="completion-message">
          ✅ Test completed! ({session.stoppingReason})
        </div>
      )}
    </div>
  );
}
```

---

## Migrating SM-2 to FSRS

### Single Card Migration

```typescript
import { migrateSM2toFSRS } from '@darwin-education/shared/calculators/fsrs';
import type { SM2State } from '@darwin-education/shared';

// Fetch SM-2 card
const { data: sm2Card } = await supabase
  .from('flashcard_review_states')
  .select('*')
  .eq('flashcard_id', flashcardId)
  .eq('user_id', userId)
  .eq('algorithm', 'sm2')
  .single();

// Convert SM-2 state
const sm2State: SM2State = {
  cardId: sm2Card.flashcard_id,
  easeFactor: sm2Card.ease_factor,
  interval: sm2Card.interval,
  repetitions: sm2Card.repetitions,
  nextReview: new Date(sm2Card.next_review),
  lastReview: sm2Card.last_review ? new Date(sm2Card.last_review) : null,
};

// Migrate to FSRS
const fsrsCard = migrateSM2toFSRS(sm2State);

// Update database
await supabase
  .from('flashcard_review_states')
  .update({
    algorithm: 'fsrs',
    fsrs_difficulty: fsrsCard.difficulty,
    fsrs_stability: fsrsCard.stability,
    fsrs_reps: fsrsCard.reps,
    fsrs_lapses: fsrsCard.lapses,
    fsrs_state: fsrsCard.state,
    next_review: fsrsCard.due,
  })
  .eq('flashcard_id', flashcardId)
  .eq('user_id', userId);

console.log(`Migrated card from SM-2 to FSRS`);
console.log(`  SM-2: EF=${sm2State.easeFactor}, interval=${sm2State.interval}d`);
console.log(`  FSRS: D=${fsrsCard.difficulty.toFixed(2)}, S=${fsrsCard.stability.toFixed(2)}d`);
```

### Bulk User Migration (via SQL function)

```sql
-- Migrate all of user's cards to FSRS
SELECT migrate_user_cards_to_fsrs('user-uuid-here');
-- Returns: 42 (number of cards migrated)
```

Or via Supabase client:

```typescript
const { data, error } = await supabase.rpc('migrate_user_cards_to_fsrs', {
  p_user_id: userId
});

if (data) {
  console.log(`Migrated ${data} cards to FSRS`);
}
```

---

## IRT Calibration Pipeline

### Logging Responses (Automatic)

```typescript
// After user submits exam
for (const response of userResponses) {
  await supabase.from('irt_response_log').insert({
    question_id: response.questionId,
    user_id: userId,
    correct: response.correct,
    user_theta: finalTheta, // From exam scoring
    response_time_ms: response.timeMs,
    exam_attempt_id: attemptId,
  });
}
```

### Weekly Calibration Job (Python/R Service)

```python
# calibration_service.py
import psycopg2
from irtq import est_3pl
import json

def run_weekly_calibration():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # 1. Create calibration batch
    cur.execute("""
        INSERT INTO irt_calibration_batches (batch_name, responses_count, questions_calibrated)
        SELECT
            'weekly_' || CURRENT_DATE,
            COUNT(*),
            COUNT(DISTINCT question_id)
        FROM irt_response_log
        WHERE created_at > NOW() - INTERVAL '7 days'
        RETURNING id
    """)
    batch_id = cur.fetchone()[0]

    # 2. Fetch responses
    cur.execute("""
        SELECT question_id, user_theta, correct
        FROM irt_response_log
        WHERE created_at > NOW() - INTERVAL '7 days'
    """)
    responses = cur.fetchall()

    # 3. Group by question
    question_responses = {}
    for qid, theta, correct in responses:
        if qid not in question_responses:
            question_responses[qid] = []
        question_responses[qid].append((theta, correct))

    # 4. Calibrate questions with >30 responses
    for qid, data in question_responses.items():
        if len(data) < 30:
            continue

        # Get current params (warm-start)
        cur.execute("SELECT irt_difficulty, irt_discrimination, irt_guessing FROM questions WHERE id = %s", (qid,))
        current_params = cur.fetchone()

        # Run IRT calibration (simplified - use irtQ in practice)
        new_params = est_3pl(
            data=data,
            a_prior=(current_params[1], 1.0),
            b_prior=(current_params[0], 1.0),
            c_prior=(current_params[2], 0.1)
        )

        # Store in history
        cur.execute("""
            INSERT INTO irt_parameter_history
            (question_id, calibration_batch_id, difficulty, discrimination, guessing, difficulty_delta)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (qid, batch_id, new_params['b'], new_params['a'], new_params['c'],
              new_params['b'] - current_params[0]))

    conn.commit()
    print(f"Calibration batch {batch_id} complete")
```

---

## Dashboard Components

### Theta Trajectory Chart

```tsx
import { LineChart, Line, Area, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts';

function ThetaTrajectoryChart({ attempts }: { attempts: ExamAttempt[] }) {
  const data = attempts.map((attempt, idx) => ({
    examNum: idx + 1,
    date: new Date(attempt.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    theta: attempt.theta,
    se: attempt.standard_error,
    upperBound: attempt.theta + 1.96 * attempt.standard_error,
    lowerBound: attempt.theta - 1.96 * attempt.standard_error,
  }));

  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis domain={[-4, 4]} />
      <Tooltip />

      {/* Confidence band (95% CI) */}
      <Area
        type="monotone"
        dataKey="lowerBound"
        stroke="none"
        fill="#10b981"
        fillOpacity={0.2}
      />
      <Area
        type="monotone"
        dataKey="upperBound"
        stroke="none"
        fill="#10b981"
        fillOpacity={0.2}
      />

      {/* Theta line */}
      <Line
        type="monotone"
        dataKey="theta"
        stroke="#10b981"
        strokeWidth={2}
        dot={{ r: 4 }}
      />

      {/* Pass threshold (theta = 1.0 → scaled score 600) */}
      <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="3 3" label="Passing" />
    </LineChart>
  );
}
```

### Forgetting Curve (FSRS)

```tsx
import { retrievability } from '@darwin-education/shared/calculators/fsrs';

function ForgettingCurveChart({ card }: { card: FSRSCard }) {
  const daysSinceReview = Math.floor(
    (Date.now() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24)
  );

  const data = Array.from({ length: 60 }, (_, day) => ({
    day,
    retrievability: retrievability(day, card.stability) * 100,
  }));

  return (
    <div>
      <h3>Forgetting Curve</h3>
      <LineChart width={400} height={200} data={data}>
        <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: 'Recall %', angle: -90, position: 'insideLeft' }} />
        <Tooltip />

        <Line type="monotone" dataKey="retrievability" stroke="#6366f1" strokeWidth={2} />

        {/* Current day */}
        <ReferenceLine x={daysSinceReview} stroke="#ef4444" label="Today" />

        {/* Target retention (90%) */}
        <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label="Target" />
      </LineChart>

      <p className="text-sm text-slate-400 mt-2">
        Current retrievability: {(retrievability(daysSinceReview, card.stability) * 100).toFixed(1)}%
      </p>
    </div>
  );
}
```

---

## Testing Examples

### Unit Test: FSRS Scheduling

```typescript
import { describe, it, expect } from 'vitest';
import { createFSRSCard, scheduleCard } from '@darwin-education/shared/calculators/fsrs';

describe('FSRS Scheduling', () => {
  it('should increase stability after good review', () => {
    const card = createFSRSCard();

    // First review (rating = 3, "Good")
    const { card: card1 } = scheduleCard(card, 3, new Date());

    expect(card1.stability).toBeGreaterThan(0);
    expect(card1.reps).toBe(1);
    expect(card1.state).toBe('review');

    // Second review (rating = 3, "Good")
    const { card: card2 } = scheduleCard(card1, 3, new Date());

    expect(card2.stability).toBeGreaterThan(card1.stability);
    expect(card2.reps).toBe(2);
  });

  it('should reset to relearning on lapse', () => {
    const card = createFSRSCard();

    // Graduate to review
    const { card: reviewCard } = scheduleCard(card, 3, new Date());

    expect(reviewCard.state).toBe('review');

    // Lapse (rating = 1, "Again")
    const { card: lapsedCard } = scheduleCard(reviewCard, 1, new Date());

    expect(lapsedCard.state).toBe('relearning');
    expect(lapsedCard.lapses).toBe(1);
  });
});
```

### Integration Test: CAT Session

```typescript
describe('CAT Session', () => {
  it('should complete after reaching SE threshold', () => {
    let session = initCATSession();

    // Mock item bank with known parameters
    const itemBank: ENAMEDQuestion[] = generateMockItems(100);

    // Simulate perfect performance (all correct)
    for (let i = 0; i < 50; i++) {
      const item = selectNextItem(session, itemBank, new Map(), DEFAULT_CAT_CONFIG);

      if (!item) break;

      session = updateCATSession(session, item.id, true, item.ontology.area, item.irt);

      if (session.isComplete) break;
    }

    expect(session.isComplete).toBe(true);
    expect(session.se).toBeLessThan(0.30);
    expect(session.stoppingReason).toBe('se_threshold');
  });
});
```

---

## API Endpoint Examples

### FSRS Review Endpoint

```typescript
// app/api/flashcards/review/route.ts
import { scheduleCard } from '@darwin-education/shared/calculators/fsrs';

export async function POST(req: Request) {
  const { flashcardId, rating } = await req.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current state
  const { data: cardData } = await supabase
    .from('flashcard_review_states')
    .select('*')
    .eq('flashcard_id', flashcardId)
    .eq('user_id', user.id)
    .single();

  const currentCard = {
    difficulty: cardData.fsrs_difficulty,
    stability: cardData.fsrs_stability,
    reps: cardData.fsrs_reps,
    lapses: cardData.fsrs_lapses,
    state: cardData.fsrs_state,
    lastReview: new Date(cardData.last_review),
    due: new Date(cardData.next_review),
  };

  // Schedule review
  const { card: updatedCard } = scheduleCard(currentCard, rating, new Date());

  // Update database
  await supabase
    .from('flashcard_review_states')
    .update({
      fsrs_difficulty: updatedCard.difficulty,
      fsrs_stability: updatedCard.stability,
      fsrs_reps: updatedCard.reps,
      fsrs_lapses: updatedCard.lapses,
      fsrs_state: updatedCard.state,
      next_review: updatedCard.due,
      last_review: updatedCard.lastReview,
    })
    .eq('flashcard_id', flashcardId)
    .eq('user_id', user.id);

  return Response.json({ success: true, nextReview: updatedCard.due });
}
```

### CAT Next Item Endpoint

```typescript
// app/api/simulado/adaptive/next-item/route.ts
import { selectNextItem } from '@darwin-education/shared/algorithms/cat';

export async function POST(req: Request) {
  const { attemptId } = await req.json();
  const supabase = createClient();

  // Fetch current session state
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*, theta_trajectory')
    .eq('id', attemptId)
    .single();

  const session = {
    theta: attempt.theta_trajectory[attempt.theta_trajectory.length - 1]?.theta || 0,
    se: attempt.standard_error,
    itemsAdministered: attempt.items_administered || [],
    // ... other fields
  };

  // Load item bank and exposure rates
  const { data: itemBank } = await supabase.from('questions').select('*');
  const { data: exposureData } = await supabase.from('v_item_exposure_rates').select('*');
  const exposureRates = new Map(exposureData.map(r => [r.question_id, r.exposure_rate]));

  // Select next item
  const nextItem = selectNextItem(session, itemBank, exposureRates);

  return Response.json({ item: nextItem });
}
```

---

**For more examples, see the test files in `packages/shared/__tests__/`**.
