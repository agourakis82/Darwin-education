# 🚀 CIP Enhancement Roadmap

## Current Status ✅

**What Works Now:**
- ✅ Complete puzzle UI with grid, timer, and modal
- ✅ TRI-based scoring (0-1000 scale)
- ✅ Performance breakdowns by section & diagnosis
- ✅ User attempts tracking
- ✅ 1 sample puzzle (Fácil difficulty)

**What's Missing:**
- ❌ Multiple difficulty levels
- ❌ Dynamic puzzle generation
- ❌ Rich medical content integration
- ❌ Gamification features
- ❌ Advanced analytics

---

## 🎯 Enhancement Phases

### Phase 1: Content Expansion (1-2 weeks)
**Goal:** More puzzles for all difficulty levels

#### 1.1 Add More Sample Puzzles
**Priority:** HIGH 🔴
**Effort:** Medium

**Tasks:**
- [ ] Create 2-3 puzzles for each difficulty level:
  - Muito Fácil (2 puzzles)
  - Fácil (3 puzzles) - already have 1
  - Médio (3 puzzles)
  - Difícil (2 puzzles)
  - Muito Difícil (1 puzzle)
- [ ] Diversify medical specialties (not just clínica médica)
- [ ] Add pediatric cases
- [ ] Add surgical cases
- [ ] Add OB/GYN cases

**Implementation:**
```typescript
// Extend scripts/setup-cip-data.ts
const puzzles = [
  createPuzzle('Muito Fácil', ['DM2', 'HAS'], 3),
  createPuzzle('Médio', ['Pneumonia', 'ICC', 'DPOC', 'Asma'], 5),
  createPuzzle('Difícil', ['SepseGrave', 'ChoqueSéptico', ...], 6),
  // etc.
]
```

**Files to modify:**
- `scripts/setup-cip-data.ts` - Add more diagnosis/finding data
- Create `scripts/generate-puzzles-batch.ts` - Automated batch creation

---

#### 1.2 Integrate @darwin-mfc/medical-data
**Priority:** HIGH 🔴
**Effort:** Medium

**Benefits:**
- Access to 368 diseases with rich content
- 690 medications with full pharmacology
- ICD-10 and ATC codes for semantic matching

**Tasks:**
- [ ] Install package: `pnpm add @darwin-mfc/medical-data`
- [ ] Create adapter in `apps/web/lib/adapters/cip-medical-data.ts`
- [ ] Map MFC diseases → CIP diagnoses
- [ ] Extract findings from disease data
- [ ] Use for dynamic puzzle generation

**Implementation:**
```typescript
// apps/web/lib/adapters/cip-medical-data.ts
import { doencasConsolidadas } from '@darwin-mfc/medical-data'

export function convertDoencaToCIPDiagnosis(doenca: Doenca): CIPDiagnosis {
  return {
    id: doenca.id,
    namePt: doenca.titulo,
    icd10Code: doenca.cid10[0],
    area: mapCategoriaToCIPArea(doenca.categoria),
    findings: extractFindingsFromDoenca(doenca),
    // ...
  }
}
```

**Files to create:**
- `apps/web/lib/adapters/cip-medical-data.ts`
- `apps/web/lib/services/cip-generation-service.ts`

---

### Phase 2: Dynamic Generation (2-3 weeks)
**Goal:** AI-powered puzzle creation

#### 2.1 Build Puzzle Generator API
**Priority:** MEDIUM 🟡
**Effort:** High

**Features:**
- Generate puzzles on-demand for any difficulty
- Use semantic similarity for intelligent distractor selection
- Ensure balanced difficulty across sections
- Cache generated puzzles for reuse

**Tasks:**
- [ ] Create API route: `app/api/cip/generate/route.ts`
- [ ] Implement distractor selection algorithm (already exists in `calculators/distractor.ts`)
- [ ] Add ICD-10 and ATC ontology trees
- [ ] Implement caching layer (Redis or database)

**Implementation:**
```typescript
// app/api/cip/generate/route.ts
export async function POST(request: Request) {
  const { difficulty, areas, diagnosisCount } = await request.json()

  // Use existing generator from shared package
  const puzzle = generateCIPPuzzle(
    availableDiagnoses,
    availableFindings,
    { difficulty, areas },
    icdTree,
    atcTree
  )

  // Save to database
  await savePuzzle(puzzle)

  return Response.json({ puzzleId: puzzle.id })
}
```

**Files to create:**
- `apps/web/app/api/cip/generate/route.ts`
- `apps/web/lib/ontology/icd10-tree.ts`
- `apps/web/lib/ontology/atc-tree.ts`

---

#### 2.2 Admin Puzzle Builder UI
**Priority:** LOW 🟢
**Effort:** Medium

**Features:**
- Web interface for creating custom puzzles
- Select diagnoses from dropdown
- Choose difficulty and sections
- Preview before publishing
- Edit existing puzzles

**Tasks:**
- [ ] Create `/cip/admin/create` page
- [ ] Build diagnosis selector component
- [ ] Build finding selector component
- [ ] Add preview mode
- [ ] Add publish/draft workflow

**Files to create:**
- `apps/web/app/cip/admin/create/page.tsx`
- `apps/web/app/cip/admin/components/DiagnosisSelector.tsx`
- `apps/web/app/cip/admin/components/PuzzlePreview.tsx`

---

### Phase 3: Gamification (1-2 weeks)
**Goal:** Engagement and motivation

#### 3.1 Leaderboard System
**Priority:** MEDIUM 🟡
**Effort:** Medium

**Features:**
- Global leaderboard (top scores)
- Weekly leaderboard (resets every Monday)
- Friends leaderboard
- Specialty-specific leaderboards

**Tasks:**
- [ ] Create `cip_leaderboard` table
- [ ] Create aggregation queries
- [ ] Build leaderboard UI component
- [ ] Add real-time updates (Supabase Realtime)

**Implementation:**
```typescript
// Database view
CREATE VIEW cip_global_leaderboard AS
SELECT
  user_id,
  COUNT(*) as puzzles_completed,
  AVG(scaled_score) as avg_score,
  MAX(scaled_score) as best_score,
  SUM(CASE WHEN passed THEN 1 ELSE 0 END) as puzzles_passed
FROM cip_attempts
WHERE completed_at IS NOT NULL
GROUP BY user_id
ORDER BY avg_score DESC, best_score DESC
LIMIT 100;
```

**Files to create:**
- `apps/web/app/cip/leaderboard/page.tsx`
- `apps/web/components/cip/Leaderboard.tsx`
- Database migration for views

---

#### 3.2 Achievements System
**Priority:** MEDIUM 🟡
**Effort:** Low-Medium

**Achievements:**
- 🏆 **First Puzzle** - Complete your first CIP puzzle
- 🔥 **Perfect Score** - Get 100% on any puzzle
- 📚 **Specialist** - Complete 10 puzzles in one area
- ⚡ **Speed Demon** - Complete a puzzle in under 10 minutes
- 💯 **High Achiever** - Score above 800 on any puzzle
- 🎯 **Master** - Pass all difficulty levels
- 🌟 **Streak Master** - Complete puzzles 7 days in a row

**Tasks:**
- [ ] Create `cip_achievements` table
- [ ] Create `user_cip_achievements` table
- [ ] Implement achievement checker service
- [ ] Add achievement notifications
- [ ] Build achievements showcase page

**Files to create:**
- `apps/web/lib/services/cip-achievements-service.ts`
- `apps/web/app/cip/achievements/page.tsx`
- `apps/web/components/cip/AchievementBadge.tsx`

---

#### 3.3 Daily Challenge
**Priority:** LOW 🟢
**Effort:** Low

**Features:**
- One puzzle per day for all users
- Bonus XP for completing daily challenge
- Streak tracking
- Special rewards for 7-day, 30-day streaks

**Tasks:**
- [ ] Create daily puzzle selection algorithm
- [ ] Add streak tracking to profiles
- [ ] Build daily challenge UI
- [ ] Add countdown timer to next challenge

---

### Phase 4: Advanced Analytics (1-2 weeks)
**Goal:** Deep insights into learning patterns

#### 4.1 Performance Analytics Dashboard
**Priority:** MEDIUM 🟡
**Effort:** Medium-High

**Metrics to Track:**
- Progress over time (score trends)
- Strengths by specialty (which areas you excel in)
- Weaknesses by section (which sections need work)
- Time efficiency (avg time per cell)
- Accuracy by difficulty level
- Learning velocity (improvement rate)

**Visualizations:**
- Line charts (score over time)
- Radar charts (performance by area)
- Heatmaps (section × diagnosis accuracy)
- Bar charts (comparative analysis)

**Tasks:**
- [ ] Create analytics queries
- [ ] Build data aggregation service
- [ ] Integrate charting library (Recharts or Chart.js)
- [ ] Create dashboard page
- [ ] Add filtering (date range, difficulty, area)

**Files to create:**
- `apps/web/app/cip/analytics/page.tsx`
- `apps/web/lib/services/cip-analytics-service.ts`
- `apps/web/components/cip/PerformanceChart.tsx`
- `apps/web/components/cip/StrengthsWeaknessesRadar.tsx`

---

#### 4.2 Adaptive Difficulty
**Priority:** LOW 🟢
**Effort:** High

**Features:**
- Recommend next puzzle based on performance
- Adjust difficulty dynamically
- Focus on weak areas
- Personalized learning path

**Algorithm:**
```typescript
function recommendNextPuzzle(userHistory: CIPAttempt[]): {
  difficulty: DifficultyLevel
  areas: ENAMEDArea[]
} {
  const recentScores = userHistory.slice(-5)
  const avgScore = mean(recentScores.map(a => a.scaled_score))

  // If doing well, increase difficulty
  if (avgScore > 700) return { difficulty: 'dificil', areas: weakAreas }
  if (avgScore > 600) return { difficulty: 'medio', areas: weakAreas }
  return { difficulty: 'facil', areas: weakAreas }
}
```

---

### Phase 5: Social Features (2-3 weeks)
**Goal:** Collaborative learning

#### 5.1 Study Groups
**Priority:** LOW 🟢
**Effort:** High

**Features:**
- Create/join study groups
- Group leaderboards
- Share puzzles within group
- Group challenges
- Discussion threads

---

#### 5.2 Puzzle Sharing & Collaboration
**Priority:** LOW 🟢
**Effort:** Medium

**Features:**
- Share custom puzzles with friends
- Public puzzle library (community puzzles)
- Rate and review puzzles
- Comment on puzzles
- Report issues with puzzles

---

### Phase 6: Mobile & Offline (3-4 weeks)
**Goal:** Learn anywhere, anytime

#### 6.1 Progressive Web App (PWA)
**Priority:** MEDIUM 🟡
**Effort:** Medium

**Features:**
- Offline mode
- Service worker for caching
- Install as app on mobile
- Push notifications for daily challenges

**Tasks:**
- [ ] Add PWA manifest
- [ ] Implement service worker
- [ ] Add offline detection
- [ ] Cache puzzles for offline play

---

#### 6.2 React Native Mobile App
**Priority:** LOW 🟢
**Effort:** Very High

**Benefits:**
- Native mobile experience
- Better performance
- App store presence
- Native notifications

---

## 🎨 UI/UX Enhancements

### Immediate Improvements (Quick Wins)
- [ ] Add animations when answering cells
- [ ] Add sound effects (optional, toggleable)
- [ ] Add confetti on puzzle completion
- [ ] Add hints system (costs XP)
- [ ] Add "explanation" mode (shows why answers are correct)
- [ ] Add keyboard shortcuts (arrow keys to navigate, Enter to select)
- [ ] Add dark mode toggle (already dark by default)
- [ ] Add accessibility improvements (screen reader support)

---

## 📊 Success Metrics

### Track These KPIs:
- Daily Active Users (DAU)
- Weekly puzzle completion rate
- Average score improvement over time
- Retention rate (7-day, 30-day)
- Time spent per session
- Most popular difficulty levels
- Most popular medical areas
- Achievement unlock rate

---

## 🗓️ Suggested Timeline

### Week 1-2: Foundation
- ✅ CIP feature fully functional (DONE!)
- Phase 1.1: Add more sample puzzles (5-10 total)
- Phase 1.2: Integrate medical data package

### Week 3-4: Generation
- Phase 2.1: Build puzzle generator API
- Phase 3.2: Achievements system (quick win)

### Week 5-6: Engagement
- Phase 3.1: Leaderboard system
- Phase 3.3: Daily challenge
- Phase 4.1: Analytics dashboard

### Week 7-8: Polish
- UI/UX enhancements
- Mobile optimization
- Performance improvements
- Beta testing feedback integration

### Week 9+: Advanced
- Adaptive difficulty
- Social features
- Mobile app consideration

---

## 💻 Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive tests for CIP calculators
- [ ] Add E2E tests for puzzle flow
- [ ] Add error boundaries for better error handling
- [ ] Add loading skeletons for better UX
- [ ] Optimize bundle size (lazy load components)

### Performance
- [ ] Add database indexes for common queries
- [ ] Implement puzzle caching (Redis or CDN)
- [ ] Add pagination for puzzle lists
- [ ] Optimize image loading (if adding images to findings)

### Security
- [ ] Rate limiting on API routes
- [ ] Validate all user inputs
- [ ] Add CAPTCHA for high-value actions
- [ ] Audit RLS policies

---

## 🚀 Quick Wins (Do First!)

These can be done in 1-2 hours each:

1. **Add 2-3 more sample puzzles** (different difficulties)
2. **Add confetti on completion** (use `canvas-confetti`)
3. **Add explanation mode** (show correct answers with reasoning)
4. **Add keyboard navigation** (improve UX)
5. **Add achievement badges** (visual recognition)
6. **Add streak tracking** (motivation)

---

## 📝 Next Steps

1. **Review this plan** - Which phases are priorities?
2. **Set milestones** - What do you want in 2 weeks? 4 weeks?
3. **Assign resources** - Who's working on what?
4. **Start with Quick Wins** - Build momentum!
5. **Iterate based on beta feedback** - Let users guide priorities

---

**Let's prioritize! Which phase should we tackle first?**
