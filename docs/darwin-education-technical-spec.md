# Darwin Education: Technical Specification & SOTA Literature Review

**Version**: 2.0
**Date**: 2026-01-30
**Authors**: Technical Analysis Team

---

## Executive Summary

This document integrates **state-of-the-art (SOTA+) research** from 2024-2025 with the current Darwin Education architecture to provide:

1. **Literature Review**: Recent advances in IRT/CAT, spaced repetition (FSRS-6), learning analytics dashboards, gamification, and healthcare UX
2. **Feature Design**: Detailed specifications for Simulado CAT, Flashcards FSRS, Trilhas, Dashboard analytics
3. **Data Schema**: Optimized PostgreSQL schema for IRT calibration, FSRS, and analytics
4. **Architecture**: Extended monorepo architecture for React Native + Expo mobile support

**Key Recommendations** (prioritized):

| Priority | Action | Expected Impact | Complexity |
|----------|--------|----------------|------------|
| **P0** | Migrate SM-2 → FSRS-6 | -20-30% review volume | Medium |
| **P1** | Implement CAT with MFI selection | -50% test length, same precision | High |
| **P2** | Deploy IRT calibration pipeline (warm-start) | Continuous parameter refinement | High |
| **P3** | Enhance dashboard with theta trajectory | Self-regulated learning support | Low |
| **P4** | Bootstrap React Native with Expo | 80%+ code sharing mobile | Medium |

---

## Part I: Literature Review (SOTA+ 2024-2025)

### 1.1 Item Response Theory & Computerized Adaptive Testing

#### Key Papers

**PMC10624130** (2024): "Developing Computerized Adaptive Testing for a National Health Professionals Exam"
- Demonstrated CAT reducing test length by ~50% while maintaining measurement precision (SE < 0.35)
- 3-PL model preferred over Rasch for medical exams due to guessing parameter
- **Item Selection**: Maximum Fisher Information (MFI) outperformed random selection
- **Stopping Rules**: Fixed SE (e.g., SE < 0.30) more reliable than fixed length for high-stakes exams

**arXiv:2502.19275** (2025): "Deep Computerized Adaptive Testing"
- Novel approach using reinforcement learning for non-myopic item selection
- Integrated Bayesian sparse multivariate IRT with RL principles
- 15% improvement in test efficiency over traditional MFI

**Key Findings**:
- CAT is **highly practical** for educational assessment (JOIV 2024)
- **Challenges**: Item exposure rates on limited banks require exposure control algorithms
- **Termination rules**: SE-based rules can fail on very short tests; hybrid approaches (min length + SE threshold) recommended

#### Implications for Darwin Education

Current state:
- ✅ 3-PL model implemented (`probability3PL`, `estimateThetaEAP`)
- ✅ Information functions ready (`itemInformation`, `testInformation`)
- ❌ **Not implemented**: CAT item selection, adaptive stopping rules

**Recommendation**: Implement CAT with MFI selection + content balancing for the 5 ENAMED areas (see Part II.1).

---

### 1.2 Spaced Repetition: FSRS vs SM-2

#### FSRS-6 Performance Benchmark (Expertium, 2024)

**Dataset**: 9,999 Anki collections, 349,923,850 reviews

**Results**:
- FSRS-6: **99.6% superiority** over SM-2 (lower log loss for 99.6% of users)
- **Success rate**: FSRS 89.6% vs SM-2 47.1%
- **Review reduction**: 20-30% fewer reviews for same retention level

**LECTOR** (arXiv:2508.03275, 2024): "LLM-Enhanced Concept-based Test-Oriented Repetition"
- Integrated LLMs with FSRS for concept-based scheduling
- Outperformed vanilla FSRS by 12% in medical education context

#### How FSRS-6 Works

**Three Component Model**:
- **D** (Difficulty): Item-specific difficulty (0-10)
- **S** (Stability): Time until retrievability drops to 90%
- **R** (Retrievability): Current probability of recall

**Formula**:
```
R(t) = (1 + t/(9*S))^(-1)
```

**Advantages over SM-2**:
1. **Personalized**: Learns individual memory patterns (21 optimizable parameters)
2. **Power-law forgetting**: More accurate than exponential decay
3. **FSRS-6 specific**: Handles reviewing/relearning transitions better

#### Current State in Darwin Education

- ✅ SM-2 implemented (`sm2.ts`, 269 lines)
- ✅ Database table `flashcard_sm2_states` with ease_factor, interval, repetitions
- ❌ **Not implemented**: FSRS-6 algorithm

**Recommendation**: Implement FSRS-6 alongside SM-2, provide migration path (see Part II.2).

---

### 1.3 Learning Analytics Dashboards (LAK 2024)

#### Human-Centered Learning Analytics (HCLA)

**Key Research** (2024):
- **LearningViz** (Springer Smart Learning Environments 2024): Interactive dashboard for identifying/closing performance gaps
- **Design-Based Research** (Educational Technology R&D 2025): 4-step DBR approach with stakeholder interviews, prototyping, usability testing

**Design Principles**:
1. **Usability**: Poor usability → low adoption
2. **Visualization**: Exploit human perceptual capabilities (graphs, color)
3. **Actionability**: Support self-regulation (goal setting, appraisal, adjustment)
4. **Target audience**: Different needs for learners vs teachers

**Effective Visualizations**:
- **Theta trajectory** over time (trend analysis)
- **Radar charts** for multi-dimensional performance (5 ENAMED areas)
- **Confidence intervals** for theta estimates (show uncertainty)
- **Forgetting curves** for flashcard retention
- **Heatmaps** for topic mastery (subspecialties)

#### Current State in Darwin Education

✅ Implemented (`apps/web/app/desempenho/page.tsx`):
- Score history chart
- Area radar chart
- Pass prediction
- Study streak
- Weak areas
- Recent attempts table

❌ **Missing HCLA features**:
- Theta trajectory with confidence bands
- Forgetting curve visualization
- Topic-level mastery heatmaps
- Item-level analysis (time per question, difficulty vs performance)
- Personalized recommendations

**Recommendation**: Enhance dashboard with theta trajectory, detailed item analysis, and actionable recommendations (see Part II.4).

---

### 1.4 Gamification in Medical Education

#### Evidence Base (2024-2025)

**Meta-Analysis Findings**:
- **Effect size**: Moderate positive effect (g ≈ 0.49) on cognitive outcomes, smaller (g ≈ 0.26) on motivation
- **RCT** (ResearchGate 2024): Gamification group mean post-test 85.3±8.1 vs control 76.2±7.4 (p < 0.001)
- **Retention**: Gamification improves knowledge retention and engagement

**Market Growth**:
- Healthcare gamification apps: $4.6B (2024) → $10B+ (2030)
- Learning & gamification: $4.83B (2024) → $12.44B (2030), 16.9% CAGR

**Effective Mechanisms**:
- **Streaks**: Daily consistency (Duolingo model)
- **XP/Levels**: Sense of progress
- **Leaderboards**: Social comparison (use with caution in healthcare)
- **Achievements**: Milestone recognition

#### Current State in Darwin Education

✅ Implemented:
- XP system (`profiles.xp`)
- Levels (`profiles.level`)
- Streaks (`profiles.streak_days`)
- Achievements (`user_achievements` table from desempenho page)

❌ **Missing**:
- Leaderboards (optional, privacy-conscious)
- Badge system for milestones (e.g., "100 questions in Pediatria")
- Progress bars with time-to-next-level
- Social features (study groups, peer comparison opt-in)

**Recommendation**: Enhance gamification with badges, progress visualization, and optional social features (see Part II.5).

---

### 1.5 Healthcare Mobile App UX (2024-2025)

#### Top Design Trends

**1. AI-Powered Personalization**
- Smart symptom checkers, virtual health assistants
- Data from devices (blood pressure, heart rate) → personalized recommendations
- **Application**: AI-generated question recommendations based on knowledge gaps

**2. Patient-Centered Design**
- Simple language, seamless navigation, decluttered interfaces
- Large touch targets, readable fonts (accessibility)
- **Application**: Medical students (any digital literacy level)

**3. Gamification for Engagement**
- Progress bars, badges, daily streaks
- Chronic care apps use this for long-term adherence
- **Application**: ENAMED prep is long-term (~6-12 months)

**4. Voice User Interfaces (VUIs)**
- Hands-free interaction, beneficial for disabilities
- **Application**: Flashcard review via voice (accessibility feature)

**5. Mobile-First & Accessibility**
- Responsive design, touch-optimized
- WCAG 2.1 compliance
- **Application**: React Native implementation

#### Current State in Darwin Education

✅ Implemented:
- Next.js 15 responsive web app
- Tailwind CSS with dark mode
- Touch-friendly UI components

❌ **Missing**:
- Native mobile apps (iOS/Android)
- Offline support for flashcards
- Voice interface for accessibility
- Push notifications for study reminders

**Recommendation**: Bootstrap React Native + Expo for mobile, implement offline-first flashcards (see Part IV).

---

## Part II: Feature Design Specifications

### 2.1 Simulado CAT (Computerized Adaptive Testing)

#### Objectives

1. **Efficiency**: Reduce test length by ~50% (100 → 50 questions) while maintaining SE < 0.30
2. **Precision**: Accurate theta estimation across ability range
3. **Content validity**: Ensure coverage of all 5 ENAMED areas
4. **Exposure control**: Prevent item overuse in limited banks

#### Algorithm Design

**Item Selection**: Maximum Fisher Information (MFI) + Content Balancing

```typescript
function selectNextItem(
  theta: number,
  remainingItems: ENAMEDQuestion[],
  attemptHistory: { questionId: string; area: ENAMEDArea }[],
  exposureRates: Map<string, number>
): ENAMEDQuestion {
  // 1. Content balancing constraint
  const areaTarget = getAreaTarget(attemptHistory); // Should be 20% each for 5 areas
  const eligibleItems = remainingItems.filter(
    item => item.ontology.area === areaTarget || isContentBalanced(attemptHistory)
  );

  // 2. Exposure control (Sympson-Hetter method)
  const exposureFiltered = eligibleItems.filter(
    item => exposureRates.get(item.id) < MAX_EXPOSURE_RATE // e.g., 0.25
  );

  // 3. Maximum Fisher Information
  const itemsWithInfo = exposureFiltered.map(item => ({
    item,
    information: itemInformation(theta, item.irt)
  }));

  // 4. Select top-k and randomize (reduce predictability)
  const topK = itemsWithInfo.sort((a, b) => b.information - a.information).slice(0, 5);
  return sample(topK).item;
}
```

**Stopping Rules** (Hybrid):
1. **Minimum length**: 30 questions (ensure content coverage)
2. **SE threshold**: SE(θ) < 0.30 (measurement precision)
3. **Maximum length**: 80 questions (safety cap)

**Alternative Algorithms** (for experimentation):
- **Kullback-Leibler (KL)**: Minimize KL divergence between prior and posterior
- **a-stratified**: Select items with varying discrimination parameters
- **Bayesian Expected Information**: Non-myopic selection (deep CAT approach)

#### UI/UX Flow

1. **Pre-test**: Inform user "This is an adaptive test. Questions will adjust to your ability."
2. **During test**:
   - Show progress as "Question 15/30-80" (dynamic range)
   - Display SE in real-time: "Precision: 92%" = (1 - SE) * 100
   - Content bar: "Areas covered: 4/5"
3. **Post-test**:
   - "Test completed early due to high precision!" (positive framing)
   - Show theta trajectory across questions

#### Database Schema Extensions

```sql
-- CAT-specific metadata for exam attempts
ALTER TABLE exam_attempts ADD COLUMN is_adaptive BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_attempts ADD COLUMN stopping_reason TEXT; -- 'se_threshold', 'max_length', 'min_length'
ALTER TABLE exam_attempts ADD COLUMN theta_trajectory JSONB; -- [{questionNum: 1, theta: 0.5, se: 0.8}, ...]
ALTER TABLE exam_attempts ADD COLUMN items_administered UUID[];

-- Item exposure tracking
CREATE TABLE IF NOT EXISTS item_exposure_log (
  question_id UUID REFERENCES questions(id),
  administered_at TIMESTAMPTZ DEFAULT NOW(),
  user_theta NUMERIC(5,3)
);

CREATE INDEX idx_item_exposure_question ON item_exposure_log(question_id);
```

#### Implementation Checklist

- [ ] Implement MFI item selection in `packages/shared/src/algorithms/cat.ts`
- [ ] Add content balancing logic for 5 ENAMED areas
- [ ] Implement Sympson-Hetter exposure control
- [ ] Create adaptive exam API endpoint (`POST /api/simulado/adaptive/next-item`)
- [ ] Build CAT UI with dynamic progress bar
- [ ] Add theta trajectory visualization to results page
- [ ] Set up item exposure logging for bank management

---

### 2.2 Flashcards FSRS (Free Spaced Repetition Scheduler)

#### Objectives

1. **Efficiency**: Reduce review volume by 20-30% vs SM-2
2. **Personalization**: Learn individual memory patterns
3. **Accuracy**: Lower prediction error (log loss) on recall probability
4. **Migration**: Seamless migration from SM-2 → FSRS for existing users

#### FSRS-6 Algorithm

**Core Formula**:
```
R(t, S) = (1 + t/(9*S))^(-1)
```
Where:
- R = Retrievability (probability of recall)
- t = Time since last review (days)
- S = Stability (days until R drops to 90%)

**Parameter Update** (after review with rating q ∈ {1,2,3,4}):

```typescript
interface FSRSParameters {
  w: number[]; // 21 weights (optimizable)
}

interface FSRSCard {
  difficulty: number;   // D ∈ [0, 10]
  stability: number;    // S ∈ [0.1, 36500] days
  reps: number;         // Number of reviews
  lapses: number;       // Number of lapses
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview: Date;
  due: Date;
}

function nextStability(d: number, s: number, r: number, rating: number, w: number[]): number {
  if (rating === 1) { // Again
    return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  } else {
    const hard_penalty = rating === 2 ? w[15] : 1;
    const easy_bonus = rating === 4 ? w[16] : 1;
    return s * (Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) *
                (Math.exp(w[10] * (1 - r)) - 1) * hard_penalty * easy_bonus + 1);
  }
}

function nextDifficulty(d: number, rating: number, w: number[]): number {
  const delta_d = w[6] * (rating - 3);
  return constrain(d + delta_d, 1, 10);
}
```

**Default Weights** (optimized on 20k+ users):
```typescript
const DEFAULT_WEIGHTS = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234,
  1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407,
  2.9466, 0.5034, 0.6567, 0.0, 1.0
];
```

#### Migration Strategy: SM-2 → FSRS

**Step 1**: Map SM-2 state to FSRS

```typescript
function migrateSM2toFSRS(sm2: SM2State, w: number[]): FSRSCard {
  // Difficulty estimate from ease factor (inverted)
  const difficulty = constrain(11 - (sm2.easeFactor * 4), 1, 10);

  // Stability from current interval
  const stability = sm2.interval;

  return {
    difficulty,
    stability,
    reps: sm2.repetitions,
    lapses: 0, // Unknown from SM-2
    state: sm2.repetitions === 0 ? 'new' : 'review',
    lastReview: sm2.lastReview || new Date(),
    due: sm2.nextReview
  };
}
```

**Step 2**: Database migration

```sql
-- Add FSRS columns to flashcard states
ALTER TABLE flashcard_sm2_states ADD COLUMN fsrs_difficulty NUMERIC(5,3);
ALTER TABLE flashcard_sm2_states ADD COLUMN fsrs_stability NUMERIC(8,3);
ALTER TABLE flashcard_sm2_states ADD COLUMN fsrs_reps INTEGER DEFAULT 0;
ALTER TABLE flashcard_sm2_states ADD COLUMN fsrs_lapses INTEGER DEFAULT 0;
ALTER TABLE flashcard_sm2_states ADD COLUMN fsrs_state TEXT DEFAULT 'new';
ALTER TABLE flashcard_sm2_states ADD COLUMN algorithm TEXT DEFAULT 'sm2'; -- 'sm2' or 'fsrs'

-- Rename table to be algorithm-agnostic
ALTER TABLE flashcard_sm2_states RENAME TO flashcard_review_states;

-- User-level FSRS weights (personalized)
CREATE TABLE IF NOT EXISTS user_fsrs_weights (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  weights JSONB NOT NULL, -- Array of 21 floats
  training_reviews INTEGER DEFAULT 0,
  last_optimized_at TIMESTAMPTZ,
  log_loss NUMERIC(6,4)
);
```

**Step 3**: UI Toggle

```tsx
// User settings
<Toggle
  label="Spaced Repetition Algorithm"
  options={[
    { value: 'sm2', label: 'SM-2 (Classic)' },
    { value: 'fsrs', label: 'FSRS-6 (Recommended)', badge: 'NEW' }
  ]}
  onChange={handleAlgorithmChange}
/>
```

#### Implementation Checklist

- [ ] Implement FSRS-6 in `packages/shared/src/calculators/fsrs.ts`
- [ ] Add migration utility `migrateSM2toFSRS()`
- [ ] Update database schema with FSRS columns
- [ ] Create parameter optimization service (every 1000 reviews)
- [ ] Build UI toggle for SM-2 vs FSRS
- [ ] Add FSRS documentation to help center
- [ ] Run A/B test (SM-2 vs FSRS) on retention metrics

---

### 2.3 Trilhas Adaptativas (Adaptive Learning Paths)

#### Objectives

1. **Personalization**: Adjust difficulty based on knowledge state
2. **Efficiency**: Skip mastered content, focus on weak areas
3. **Engagement**: Show clear progress, next milestones
4. **Evidence-based**: Use Bayesian Knowledge Tracing (BKT)

#### Bayesian Knowledge Tracing (BKT)

**Model**: For each topic, track mastery probability P(L_t)

**Parameters**:
- P(L_0): Prior probability of initial mastery (default 0.1)
- P(T): Probability of learning (transition) per correct answer (0.3)
- P(S): Slip probability (knows but answers wrong) (0.1)
- P(G): Guess probability (doesn't know but answers right) (0.25)

**Update Rule** (after observing answer):

```typescript
function updateMastery(
  currentMastery: number,
  correct: boolean,
  params: { pT: number; pS: number; pG: number }
): number {
  const { pT, pS, pG } = params;

  const pCorrectGivenLearned = 1 - pS;
  const pCorrectGivenNotLearned = pG;

  const pCorrect = currentMastery * pCorrectGivenLearned +
                   (1 - currentMastery) * pCorrectGivenNotLearned;

  if (correct) {
    const posterior = (currentMastery * pCorrectGivenLearned) / pCorrect;
    return posterior + (1 - posterior) * pT;
  } else {
    const posterior = (currentMastery * pS) / (1 - pCorrect);
    return posterior + (1 - posterior) * pT;
  }
}
```

**Mastery Threshold**: P(L) > 0.95 → Topic mastered

#### Adaptive Path Algorithm

**Prerequisite Check**:
```typescript
function canAccessModule(
  module: StudyModule,
  knowledgeState: Map<string, number>
): boolean {
  return module.prerequisites.every(topic =>
    knowledgeState.get(topic) > 0.95
  );
}
```

**Next Module Selection**:
```typescript
function selectNextModule(
  path: StudyPath,
  knowledgeState: Map<string, number>
): StudyModule | null {
  const eligibleModules = path.modules.filter(m =>
    !m.completed && canAccessModule(m, knowledgeState)
  );

  if (eligibleModules.length === 0) return null;

  // Prefer modules with lowest average mastery on topics
  return eligibleModules.sort((a, b) => {
    const avgA = average(a.topics.map(t => knowledgeState.get(t) || 0));
    const avgB = average(b.topics.map(t => knowledgeState.get(t) || 0));
    return avgA - avgB;
  })[0];
}
```

#### UI/UX Design

**Progress Visualization**:
```
Trilha: Pediatria Essencial
━━━━━━━━━━━━━━━━━━━━ 65%

Módulos:
✅ 1. Crescimento e Desenvolvimento (Mastery: 98%)
✅ 2. Vacinação (Mastery: 96%)
🔄 3. Doenças Infecciosas (Mastery: 45%) ← VOCÊ ESTÁ AQUI
🔒 4. Emergências Pediátricas (Requer: #3 > 95%)
🔒 5. Casos Clínicos Integrados
```

**Knowledge Heatmap** (Topic-level):
```
        Clínica  Cirurgia   GO   Pediatria  Saúde
Topic 1   ███     ██░      ██░     ███       ██░
Topic 2   ██░     ███      ░░░     ██░       ███
...
Legend: ███ Mastered (>95%)  ██░ Learning (50-95%)  ░░░ New (<50%)
```

#### Database Schema

```sql
-- Knowledge states already exists (migration 004_ml_feature_store.sql)
-- Extend with BKT parameters

ALTER TABLE knowledge_states ADD COLUMN bkt_p_learn NUMERIC(4,3) DEFAULT 0.3;
ALTER TABLE knowledge_states ADD COLUMN bkt_p_slip NUMERIC(4,3) DEFAULT 0.1;
ALTER TABLE knowledge_states ADD COLUMN bkt_p_guess NUMERIC(4,3) DEFAULT 0.25;

-- Track module completion
CREATE TABLE IF NOT EXISTS study_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES study_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  mastery_at_completion NUMERIC(4,3),

  UNIQUE(user_id, module_id)
);
```

#### Implementation Checklist

- [ ] Implement BKT update logic in `packages/shared/src/algorithms/bkt.ts`
- [ ] Build adaptive path engine
- [ ] Create knowledge heatmap visualization
- [ ] Implement prerequisite system
- [ ] Add "Skip Module" button (if mastery > 95%)
- [ ] Build path progress dashboard
- [ ] Seed database with 3-5 learning paths

---

### 2.4 Dashboard de Desempenho (Analytics Dashboard)

#### Objectives

1. **Self-regulation**: Support goal setting, monitoring, adjustment
2. **Actionability**: Provide specific, evidence-based recommendations
3. **Transparency**: Show uncertainty (confidence intervals)
4. **Engagement**: Celebrate progress, encourage consistency

#### New Visualizations (Evidence-Based)

**1. Theta Trajectory with Confidence Bands**

```typescript
interface ThetaPoint {
  examNum: number;
  date: string;
  theta: number;
  se: number;
  scaledScore: number;
}

function renderThetaTrajectory(history: ThetaPoint[]) {
  return (
    <LineChart data={history}>
      {/* Main theta line */}
      <Line dataKey="theta" stroke="#10b981" strokeWidth={2} />

      {/* Confidence band (95%: theta ± 1.96*SE) */}
      <Area
        dataKey={(d) => [d.theta - 1.96*d.se, d.theta + 1.96*d.se]}
        fill="#10b981"
        fillOpacity={0.2}
      />

      {/* Pass threshold line */}
      <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="3 3" label="Passing" />
    </LineChart>
  );
}
```

**2. Forgetting Curve Visualization** (for Flashcards)

```typescript
function renderForgettingCurve(card: FSRSCard) {
  const daysSinceReview = daysBetween(card.lastReview, new Date());
  const currentR = retrievability(daysSinceReview, card.stability);

  const curve = Array.from({ length: 60 }, (_, day) => ({
    day,
    r: retrievability(day, card.stability)
  }));

  return (
    <LineChart data={curve}>
      <Line dataKey="r" stroke="#6366f1" />
      <ReferenceLine x={daysSinceReview} stroke="#ef4444" label="Today" />
      <ReferenceLine y={0.9} stroke="#10b981" strokeDasharray="3 3" label="Target Retention" />
    </LineChart>
  );
}
```

**3. Item-Level Analysis Table**

| Question | Area | Difficulty | Your Answer | Time | Compared to Avg |
|----------|------|-----------|-------------|------|-----------------|
| Q42 | Cirurgia | 1.8 (Hard) | ❌ Wrong | 180s | +60s (slower) |
| Q15 | Pediatria | -0.3 (Easy) | ✅ Correct | 45s | -15s (faster) |

**Insights**: "You struggled with hard Surgery questions. Consider reviewing thoracic surgery fundamentals."

**4. Topic Mastery Heatmap**

```
Subspecialty Mastery (100 most recent questions)
                 Clinica  Cirurgia   GO    Pediatria  Saúde
Cardiologia        85%      —        —        72%       —
Pneumologia        90%      78%      —        —         65%
Gastroenterologia  76%      82%      —        —         —
...
```

**5. Personalized Recommendations**

```typescript
function generateRecommendations(
  user: UserProfile,
  attempts: ExamAttempt[],
  knowledgeState: Map<string, number>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Weak areas
  const weakAreas = getAreasBelow(knowledgeState, 70);
  if (weakAreas.length > 0) {
    recommendations.push({
      type: 'weak_area',
      priority: 'high',
      title: `Focus on ${weakAreas[0]}`,
      description: `Your mastery in ${weakAreas[0]} is ${knowledgeState.get(weakAreas[0])}%. Try the "${weakAreas[0]} Essentials" learning path.`,
      action: { type: 'navigate', url: `/trilhas/search?area=${weakAreas[0]}` }
    });
  }

  // Streak reminder
  if (user.streak_days > 0 && daysSinceLastActivity(user) === 1) {
    recommendations.push({
      type: 'streak',
      priority: 'medium',
      title: `🔥 Maintain your ${user.streak_days}-day streak!`,
      description: 'Review 10 flashcards today to keep it going.',
      action: { type: 'navigate', url: '/flashcards' }
    });
  }

  // CAT suggestion
  const avgSE = average(attempts.slice(0, 5).map(a => a.standard_error));
  if (avgSE > 0.5) {
    recommendations.push({
      type: 'test_strategy',
      priority: 'low',
      title: 'Try Adaptive Testing',
      description: 'Adaptive tests can give you more precise results in less time.',
      action: { type: 'navigate', url: '/simulado?mode=adaptive' }
    });
  }

  return recommendations.sort((a, b) => priorityScore(b) - priorityScore(a));
}
```

#### Implementation Checklist

- [ ] Build theta trajectory chart with confidence bands
- [ ] Add forgetting curve to flashcard details
- [ ] Create item-level analysis table
- [ ] Build topic mastery heatmap
- [ ] Implement recommendation engine
- [ ] Add export to PDF (for study planning)
- [ ] Implement goal-setting UI ("My goal: 700+ by June 2026")

---

### 2.5 Gamification Enhancements

#### Objectives

1. **Engagement**: Increase daily active users
2. **Retention**: Reduce dropout rate
3. **Evidence-based**: Use mechanisms with proven effect (g ≈ 0.49)

#### Badge System

**Achievement Types**:

| Badge | Criteria | Reward |
|-------|----------|--------|
| First Steps | Complete 10 questions | 50 XP |
| Streak Master | 7-day streak | 200 XP |
| Area Expert: Pediatria | 90%+ mastery in all Pediatria topics | 500 XP + "Pediatria Expert" title |
| Speed Demon | Complete CAT in <15 min with theta > 1.0 | 300 XP |
| Perfectionist | 100% correct on a 50-question exam | 1000 XP |
| Knowledge Sharer | Create 10 public flashcard decks | 400 XP |

**Database Schema**:

```sql
-- Achievements catalog
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- {type: 'streak', value: 7}
  xp_reward INTEGER NOT NULL,
  badge_icon_url TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- User achievements (already exists, extend it)
ALTER TABLE user_achievements ADD COLUMN unlocked_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_achievements ADD COLUMN seen BOOLEAN DEFAULT FALSE;
```

#### Leaderboards (Privacy-Conscious)

**Opt-in Design**:
```tsx
<Toggle
  label="Leaderboard Participation"
  description="Share your XP anonymously on global leaderboards"
  value={user.preferences.leaderboard_opt_in}
  onChange={handleToggle}
/>
```

**Categories**:
- Weekly XP
- Study streak (current)
- Total questions answered
- Area-specific leaderboards (e.g., "Top Pediatria Students")

**Anonymization**:
```typescript
interface LeaderboardEntry {
  rank: number;
  username: string; // "Student #1234" (hashed)
  xp: number;
  isCurrentUser: boolean;
}
```

#### Progress Bars & Time-to-Next-Level

```tsx
function LevelProgress({ xp, level }: { xp: number; level: number }) {
  const currentLevelXP = getLevelThreshold(level);
  const nextLevelXP = getLevelThreshold(level + 1);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const remaining = nextLevelXP - xp;

  return (
    <div>
      <h3>Level {level}</h3>
      <ProgressBar value={progress} />
      <p>{remaining} XP to Level {level + 1}</p>
      <p className="text-sm text-slate-400">
        Estimated: {estimateDaysToLevel(remaining, user.avgXPPerDay)} days at current pace
      </p>
    </div>
  );
}
```

#### Implementation Checklist

- [ ] Seed 20+ achievements in database
- [ ] Build badge notification system ("You unlocked X!")
- [ ] Create achievement showcase page
- [ ] Implement opt-in leaderboards
- [ ] Add XP breakdown (questions: 10 XP, exams: 100 XP, streaks: 50 XP/day)
- [ ] Build progress bar for level-up
- [ ] A/B test gamification on/off for retention metrics

---

## Part III: Database Schema Optimization

### 3.1 IRT Calibration Schema (Warm-Start)

**Objective**: Enable continuous recalibration of IRT parameters using new response data.

```sql
-- Store raw responses for calibration
CREATE TABLE IF NOT EXISTS irt_response_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  user_theta NUMERIC(5,3), -- Theta at time of response
  response_time_ms INTEGER,
  exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_irt_response_log_question ON irt_response_log(question_id);
CREATE INDEX idx_irt_response_log_created ON irt_response_log(created_at);

-- IRT calibration batches
CREATE TABLE IF NOT EXISTS irt_calibration_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  responses_count INTEGER NOT NULL,
  questions_calibrated INTEGER NOT NULL,
  model_type TEXT DEFAULT '3PL',
  estimation_method TEXT DEFAULT 'marginal_ml', -- 'marginal_ml', 'joint_ml', 'bayesian'
  convergence_criterion NUMERIC(8,6),
  iterations INTEGER,
  log_likelihood NUMERIC,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Track parameter updates
CREATE TABLE IF NOT EXISTS irt_parameter_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  calibration_batch_id UUID REFERENCES irt_calibration_batches(id) ON DELETE CASCADE,

  -- New parameters
  difficulty NUMERIC(5,3),
  discrimination NUMERIC(5,3),
  guessing NUMERIC(5,3),
  infit NUMERIC(5,3),
  outfit NUMERIC(5,3),

  -- Change from previous
  difficulty_delta NUMERIC(5,3),
  discrimination_delta NUMERIC(5,3),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update questions table
CREATE OR REPLACE FUNCTION update_question_irt_params()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET
    irt_difficulty = NEW.difficulty,
    irt_discrimination = NEW.discrimination,
    irt_guessing = NEW.guessing,
    irt_infit = NEW.infit,
    irt_outfit = NEW.outfit,
    updated_at = NOW()
  WHERE id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_irt_params
AFTER INSERT ON irt_parameter_history
FOR EACH ROW
EXECUTE FUNCTION update_question_irt_params();
```

**Calibration Pipeline** (Python/R service):

```python
# Pseudocode for weekly calibration job

import irtq  # R package via rpy2

def run_calibration_batch():
    # 1. Fetch responses from last week
    responses = db.query("""
        SELECT question_id, user_theta, correct
        FROM irt_response_log
        WHERE created_at > NOW() - INTERVAL '7 days'
    """)

    # 2. Group by question
    question_responses = responses.groupby('question_id')

    # 3. Filter questions with min 30 responses
    eligible = question_responses.filter(lambda g: len(g) > 30)

    # 4. Run IRT calibration (marginal MLE)
    results = []
    for qid, group in eligible:
        current_params = get_current_params(qid)

        # Warm-start: use current params as priors
        new_params = irtq.est_3pl(
            data=group['correct'],
            theta_init=group['user_theta'].mean(),
            a_prior=(current_params['discrimination'], 1.0),
            b_prior=(current_params['difficulty'], 1.0),
            c_prior=(current_params['guessing'], 0.1)
        )

        results.append({
            'question_id': qid,
            'difficulty': new_params['b'],
            'discrimination': new_params['a'],
            'guessing': new_params['c'],
            'infit': new_params['infit'],
            'difficulty_delta': new_params['b'] - current_params['difficulty']
        })

    # 5. Store in irt_parameter_history
    batch_id = create_batch(responses_count=len(responses))
    db.bulk_insert('irt_parameter_history', results)

    # 6. Flag questions with large parameter drift (|delta| > 0.5)
    flagged = [r for r in results if abs(r['difficulty_delta']) > 0.5]
    notify_admin(f"{len(flagged)} questions need review")
```

---

### 3.2 FSRS Schema Extensions

Already covered in Part II.2. Key additions:

```sql
ALTER TABLE flashcard_review_states ADD COLUMN fsrs_difficulty NUMERIC(5,3);
ALTER TABLE flashcard_review_states ADD COLUMN fsrs_stability NUMERIC(8,3);
ALTER TABLE flashcard_review_states ADD COLUMN algorithm TEXT DEFAULT 'sm2';

CREATE TABLE user_fsrs_weights (
  user_id UUID PRIMARY KEY,
  weights JSONB NOT NULL,
  training_reviews INTEGER DEFAULT 0,
  log_loss NUMERIC(6,4)
);
```

---

### 3.3 Analytics Views Enhancements

**Extend `ml_pass_prediction_features` view** with more features:

```sql
CREATE OR REPLACE VIEW ml_pass_prediction_features_v2 AS
SELECT
  ea.id AS attempt_id,
  ea.user_id,
  ea.theta,
  ea.standard_error,
  ea.scaled_score,

  -- Historical features
  LAG(ea.theta) OVER (PARTITION BY ea.user_id ORDER BY ea.started_at) AS prev_theta,
  (ea.theta - LAG(ea.theta) OVER (PARTITION BY ea.user_id ORDER BY ea.started_at)) AS theta_delta,
  COUNT(*) OVER (PARTITION BY ea.user_id) AS total_attempts,

  -- Time features
  EXTRACT(HOUR FROM ea.started_at) AS hour_of_day,
  EXTRACT(DOW FROM ea.started_at) AS day_of_week,

  -- Area features
  (ea.area_breakdown->'clinica_medica'->>'correct')::int AS cm_correct,
  (ea.area_breakdown->'clinica_medica'->>'total')::int AS cm_total,
  -- ... repeat for all 5 areas

  -- User features
  p.streak_days,
  p.xp,
  p.level,

  -- Target
  ea.passed AS target

FROM exam_attempts ea
JOIN profiles p ON ea.user_id = p.id
WHERE ea.completed_at IS NOT NULL;
```

---

## Part IV: Architecture - React Native + Expo

### 4.1 Why React Native + Expo?

**Advantages**:
1. **Code Sharing**: 80-90% shared with web app via `@darwin-education/shared`
2. **Expo Ecosystem**: EAS Build, EAS Update, Push Notifications
3. **Developer Experience**: Fast Refresh, Expo Go for testing
4. **Offline-First**: AsyncStorage for flashcards, local databases (WatermelonDB)
5. **Native Features**: Camera (for document scanning), Notifications, Biometric auth

**Evidence from Research**:
- Mobile-first is critical for healthcare apps (2024-2025 trends)
- 70% of medical students prefer mobile for flashcard review (informal surveys)

---

### 4.2 Monorepo Structure (Extended)

```
darwin-education/
├── apps/
│   ├── web/              # Next.js 15 (existing)
│   └── mobile/           # React Native + Expo (NEW)
│       ├── app/          # Expo Router (file-based routing)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx        # Home
│       │   │   ├── simulado.tsx     # Exams
│       │   │   ├── flashcards.tsx   # Flashcards
│       │   │   └── desempenho.tsx   # Performance
│       │   ├── _layout.tsx
│       │   └── +not-found.tsx
│       ├── components/
│       ├── lib/
│       │   ├── supabase.ts          # Supabase client
│       │   └── storage.ts           # AsyncStorage wrapper
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/           # Shared logic (existing)
│   └── ui-mobile/        # Mobile-specific UI components (NEW)
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   └── ...
│       └── package.json
└── package.json
```

---

### 4.3 Key Implementation Details

#### Expo Router Setup

```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#10b981' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="simulado"
        options={{
          title: 'Simulado',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Flashcards',
          tabBarIcon: ({ color }) => <Ionicons name="albums" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="desempenho"
        options={{
          title: 'Desempenho',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
        }}
      />
    </Tabs>
  );
}
```

#### Offline Flashcards (WatermelonDB)

```typescript
// apps/mobile/lib/database.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Flashcard, FlashcardReviewState } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'darwin_education',
  jsi: true, // Use JSI for better performance
});

export const database = new Database({
  adapter,
  modelClasses: [Flashcard, FlashcardReviewState],
});

// Sync with Supabase
export async function syncFlashcards() {
  const supabase = createClient();
  const lastSync = await AsyncStorage.getItem('last_flashcard_sync');

  const { data: remoteCards } = await supabase
    .from('flashcards')
    .select('*')
    .gt('updated_at', lastSync || '1970-01-01');

  await database.write(async () => {
    for (const card of remoteCards) {
      await database.collections.get('flashcards').create(c => {
        c._raw.id = card.id;
        c.front = card.front;
        c.back = card.back;
        // ...
      });
    }
  });

  await AsyncStorage.setItem('last_flashcard_sync', new Date().toISOString());
}
```

#### Push Notifications (Study Reminders)

```typescript
// apps/mobile/lib/notifications.ts
import * as Notifications from 'expo-notifications';

export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Keep your streak alive!',
      body: 'Review 10 flashcards to maintain your study momentum.',
      data: { screen: 'flashcards' }
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true
    }
  });
}
```

---

### 4.4 Implementation Checklist

- [ ] Bootstrap Expo app: `pnpm create expo-app@latest apps/mobile`
- [ ] Setup Expo Router for navigation
- [ ] Install Supabase client, configure auth
- [ ] Implement offline flashcards with WatermelonDB
- [ ] Build mobile UI components (reuse 80% logic from web)
- [ ] Setup EAS Build for iOS/Android
- [ ] Implement push notifications
- [ ] Add biometric auth (Face ID / Touch ID)
- [ ] Test on physical devices
- [ ] Submit to App Store / Play Store

---

## Part V: Implementation Roadmap (Prioritized)

### Phase 1: Quick Wins (1-2 months)

**P0 - FSRS Migration**
- Weeks 1-2: Implement FSRS-6 algorithm
- Week 3: Database migration, UI toggle
- Week 4: A/B test, documentation

**P3 - Dashboard Enhancements**
- Weeks 1-2: Theta trajectory, item-level analysis
- Weeks 3-4: Recommendation engine, export to PDF

**Total**: 4-8 weeks, 1-2 developers

---

### Phase 2: High-Impact Features (2-4 months)

**P1 - CAT Implementation**
- Weeks 1-3: Algorithm (MFI, content balancing, exposure control)
- Weeks 4-6: API endpoints, UI
- Weeks 7-8: Testing, calibration

**P2 - IRT Calibration Pipeline**
- Weeks 1-2: Schema extensions, response logging
- Weeks 3-4: Python/R calibration service
- Weeks 5-6: Cron job, alerting for parameter drift

**Total**: 8-16 weeks, 2-3 developers

---

### Phase 3: Scaling & Mobile (3-6 months)

**Trilhas Adaptativas (BKT)**
- Weeks 1-2: BKT implementation
- Weeks 3-4: Adaptive path engine
- Weeks 5-6: UI (heatmaps, progress bars)

**P4 - React Native + Expo**
- Weeks 1-2: Bootstrap, routing
- Weeks 3-6: Core features (flashcards, exams)
- Weeks 7-10: Offline support, notifications
- Weeks 11-12: App Store submission

**Gamification Enhancements**
- Weeks 1-2: Badge system
- Weeks 3-4: Leaderboards (opt-in)

**Total**: 12-24 weeks, 3-4 developers

---

## Conclusion & Next Steps

This document provides a comprehensive, evidence-based roadmap for advancing Darwin Education from its current strong foundation to a SOTA educational platform.

**Immediate Actions**:
1. Review and approve roadmap priorities with stakeholders
2. Allocate 2-3 developers for Phase 1 (FSRS + Dashboard)
3. Setup weekly calibration cron job for IRT parameters
4. Begin A/B testing framework (FSRS vs SM-2, CAT vs Linear)

**Key Success Metrics**:
- **Engagement**: Daily active users, study streak retention
- **Learning Outcomes**: Average theta improvement, pass rate
- **Efficiency**: Reviews per day (flashcards), test completion time (CAT)
- **User Satisfaction**: NPS score, feature adoption rates

**Research Continuity**:
- Monitor ongoing research in IRT/CAT, spaced repetition
- Attend LAK (Learning Analytics & Knowledge) conferences
- Publish anonymized effectiveness data for academic collaboration

---

## Sources

### IRT & CAT
- [Developing CAT for Health Professionals Exam - PMC10624130](https://pmc.ncbi.nlm.nih.gov/articles/PMC10624130/)
- [Deep Computerized Adaptive Testing - arXiv:2502.19275](https://arxiv.org/html/2502.19275)
- [Optimizing Educational Assessment with CAT - JOIV 2024](https://joiv.org/index.php/joiv/article/view/2217)

### Spaced Repetition
- [FSRS Benchmark - Expertium's Blog](https://expertium.github.io/Benchmark.html)
- [LECTOR: LLM-Enhanced Spaced Learning - arXiv:2508.03275](https://arxiv.org/html/2508.03275v1)
- [SuperMemo Dethroned by FSRS - SuperMemopedia](https://supermemopedia.com/wiki/SuperMemo_dethroned_by_FSRS)

### Learning Analytics Dashboards
- [LearningViz Dashboard - Springer 2024](https://link.springer.com/article/10.1186/s40561-024-00346-1)
- [Dashboard Design to Support Self-Regulation - JLA 2024](https://learning-analytics.info/index.php/JLA/article/view/8529)
- [Human-Centred Learning Analytics - JLA 2024](https://learning-analytics.info/index.php/JLA/article/view/8487)

### Gamification
- [Gamification in Medical Education - PMC10778414](https://pmc.ncbi.nlm.nih.gov/articles/PMC10778414/)
- [Gamification Improves Retention - ResearchGate 2024](https://www.researchgate.net/publication/395422293_Gamification_in_Medical_Education_Does_It_Improve_Retention_and_Engagement_A_Randomized_Trial)

### Healthcare UX
- [Healthcare UX Design Trends 2025 - Webstacks](https://www.webstacks.com/blog/healthcare-ux-design)
- [Healthcare App Design Guide 2025 - Mindster](https://mindster.com/mindster-blogs/healthcare-app-design-guide/)
- [Top UX/UI Trends Healthcare 2025 - Compunnel](https://www.compunnel.com/blogs/ux-ui-trends-in-healthcare/)
