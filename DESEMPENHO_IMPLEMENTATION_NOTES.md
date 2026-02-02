# Desempenho Page Implementation Notes

## Overview
This document contains technical implementation details, architecture decisions, and integration notes for developers working with the enhanced Desempenho page.

## Architecture

### Component Hierarchy
```
DesempenhoPage (page.tsx)
├─ LoadingSkeleton (conditional)
├─ Header
│  └─ ExportData (conditional)
├─ Main Content
│  ├─ Empty State (if no attempts)
│  ├─ Stats Cards Grid
│  ├─ Main Content Grid (2 columns on desktop)
│  │  ├─ Left Column (2/3 width)
│  │  │  ├─ ScoreHistory with time filter
│  │  │  └─ AreaRadar
│  │  └─ Right Column (1/3 width)
│  │     ├─ PassPrediction
│  │     ├─ StudyStreak
│  │     └─ WeakAreas
│  └─ Exam Attempts Table
└─ Footer
```

## State Management

### Main Page State
```typescript
interface DesempenhoPageState {
  loading: boolean                                      // Data loading state
  attempts: ExamAttempt[]                             // All exam attempts (unfiltered)
  filteredAttempts: ExamAttempt[]                    // Filtered by time period
  stats: PerformanceStats | null                      // Aggregated statistics
  areaPerformance: Record<ENAMEDArea, number>        // Performance by area (%)
  studyActivity: StudyActivity[]                      // Last 7 days activity
  timePeriod: '7days' | '30days' | 'all'             // Current filter
}
```

### Component-Level State

**ExportData Component**:
```typescript
const [isOpen, setIsOpen] = useState(false)           // Dropdown visibility
const [isExporting, setIsExporting] = useState(false) // Export in progress
```

## Data Fetching

### Supabase Queries

**1. Exam Attempts**
```typescript
supabase
  .from('exam_attempts')
  .select('*')
  .eq('user_id', user.id)
  .not('completed_at', 'is', null)
  .order('completed_at', { ascending: false })
```
- Returns: All completed exam attempts sorted by most recent first
- Used by: ScoreHistory, AreaRadar, PassPrediction, stats calculation

**2. User Achievements**
```typescript
supabase
  .from('user_achievements')
  .select('current_streak, last_activity_date')
  .eq('user_id', user.id)
  .single()
```
- Returns: Current streak count and last activity date
- Used by: StudyStreak component, stats calculation

**3. Study Activity**
```typescript
supabase
  .from('study_activity')
  .select('activity_date, exams_completed, flashcards_reviewed, questions_answered')
  .eq('user_id', user.id)
  .gte('activity_date', sevenDaysAgo)
  .order('activity_date', { ascending: false })
```
- Returns: Daily activity for last 7 days
- Used by: StudyStreak component for calendar visualization

## Calculation Methods

### Area Performance Aggregation
```typescript
// Aggregate correct/total for each area across all attempts
const areaStats: Record<ENAMEDArea, { correct: number; total: number }> = {}

for (const attempt of attemptsData) {
  if (attempt.area_breakdown) {
    for (const [area, data] of Object.entries(attempt.area_breakdown)) {
      areaStats[area].correct += data.correct
      areaStats[area].total += data.total
    }
  }
}

// Convert to percentage
const areaPerf = {}
for (const [area, data] of Object.entries(areaStats)) {
  areaPerf[area] = (data.correct / data.total) * 100
}
```

### Pass Probability (Logistic Model)
```typescript
const passingTheta = 0        // Theta at 600 points
const scale = 1.7              // Curve steepness (empirically determined)

// P(pass) = 1 / (1 + e^(-scale * (theta - passingTheta)))
const passProbability = 1 / (1 + Math.exp(-scale * (theta - passingTheta)))
const passPercentage = Math.round(passProbability * 100)
```

**Interpretation**:
- theta < -2: <5% pass probability (very low)
- theta = 0: ~50% pass probability (threshold)
- theta > 2: >95% pass probability (very high)

### Time Period Filtering
```typescript
// Filter attempts based on selected period
useEffect(() => {
  const now = new Date()
  let filtered = attempts

  if (timePeriod === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    filtered = attempts.filter(a => new Date(a.completed_at) >= sevenDaysAgo)
  } else if (timePeriod === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    filtered = attempts.filter(a => new Date(a.completed_at) >= thirtyDaysAgo)
  }
  // else: 'all' - no filtering

  setFilteredAttempts(filtered)
}, [timePeriod, attempts])
```

## Component Details

### ScoreHistory

**Chart Dimensions**:
- Container height: 256px (h-64)
- SVG: 100% width, 100% height with `preserveAspectRatio="none"`
- Y-axis width: 32px (w-8)
- Chart area: flex-1 (remaining width)

**Dynamic Scaling**:
```typescript
const minScore = Math.min(...recentAttempts.map(a => a.scaled_score))
const maxYScore = Math.max(...recentAttempts.map(a => a.scaled_score))
const chartMin = Math.max(0, Math.floor(minScore / 100) * 100 - 100)
const chartMax = Math.min(1000, Math.ceil(maxYScore / 100) * 100 + 100)
```
Ensures Y-axis always includes min/max with padding.

**Point Positioning**:
```typescript
// X: distribute evenly across width
const x = (i / (recentAttempts.length - 1)) * 100

// Y: scale to chart range
const y = (1 - (score - chartMin) / (chartMax - chartMin)) * 100
```

### AreaRadar

**Radar Dimensions**:
- SVG size: 300x300px
- Center: (150, 150)
- Max radius: 120px
- Grid levels: [20, 40, 60, 80, 100] (percentage based)

**Point Calculation**:
```typescript
const angleStep = (2 * Math.PI) / 5  // 5 areas
const getPoint = (angle: number, value: number) => {
  const radius = (value / 100) * maxRadius
  return {
    x: centerX + radius * Math.sin(angle),
    y: centerY - radius * Math.cos(angle),
  }
}
```

**Polygon Rendering**:
- Data polygon connects all 5 area points
- Fill with gradient (emerald + blue overlay)
- Stroke in emerald-400
- Data points colored by area

### PassPrediction

**Circular Progress**:
```typescript
// Circumference: 2πr = 2π(56) ≈ 352px
// Dash offset = 352 * (1 - progress)
const circumference = 352
const offset = circumference * (1 - passPercentage / 100)

<circle
  strokeDasharray={circumference}
  strokeDashoffset={offset}
/>
```

**Trend Chart**:
- Bar height: percentage of max probability
- Color by attempt status (emerald=passed, blue=any)
- Hover shows exact percentage
- Only shows when 2+ attempts exist

### ExportData

**CSV Export**:
```typescript
// Headers
const headers = ['Data', 'Pontuação', 'Acertos', 'Total', 'Taxa', 'Aprovado', 'Tempo (min)']

// For each attempt, create row
[
  date.toLocaleDateString('pt-BR'),
  Math.round(attempt.scaled_score),
  attempt.correct_count,
  totalQuestions,
  `${accuracy}%`,
  attempt.passed ? 'Sim' : 'Não',
  Math.floor(attempt.total_time_seconds / 60),
]

// Generate CSV string and trigger download
```

**PDF Export**:
```typescript
// Generates HTML string
// Opens window.print() for print dialog
// User can save as PDF from browser

// Includes:
// - Professional styling
// - Statistics summary boxes
// - Complete exam history table
// - Footer with generation timestamp
```

## Styling System

### Tailwind Configuration
- Dark theme enabled by default
- Uses Tailwind color palette extended with medical domain colors
- Custom gradients for chart visualizations

### Color Constants
```typescript
const areaColors: Record<ENAMEDArea, string> = {
  clinica_medica: '#3B82F6',          // blue-500
  cirurgia: '#EF4444',                // red-500
  ginecologia_obstetricia: '#EC4899', // pink-500
  pediatria: '#22C55E',               // green-500
  saude_coletiva: '#8B5CF6',          // purple-500
}
```

### Responsive Classes
- `grid-cols-2 md:grid-cols-4`: Stats cards
- `lg:col-span-2`: Main content
- `lg:col-span-3`: Full width layout
- Breakpoint: md (768px), lg (1024px)

## Type Definitions

```typescript
interface ExamAttempt {
  id: string
  exam_id: string
  completed_at: string
  theta: number
  scaled_score: number
  passed: boolean
  correct_count: number
  area_breakdown: Record<ENAMEDArea, { correct: number; total: number }>
  total_time_seconds: number
}

interface PerformanceStats {
  totalExams: number
  averageScore: number
  passRate: number
  totalQuestions: number
  correctQuestions: number
  studyStreak: number
  lastStudyDate: string | null
  bestScore: number
  latestTheta: number
}

interface StudyActivity {
  activity_date: string
  exams_completed: number
  flashcards_reviewed: number
  questions_answered: number
}

type TimePeriod = '7days' | '30days' | 'all'
type ENAMEDArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'ginecologia_obstetricia'
  | 'pediatria'
  | 'saude_coletiva'
```

## Error Handling

### Current Implementation
- User not authenticated: Redirect to `/login?redirectTo=/desempenho`
- No exam attempts: Show empty state with CTA
- No study activity: Use streak data as fallback
- Null area_breakdown: Default to empty object
- Null attempt fields: Default to 0

### Future Improvements
- Error boundary for component failures
- Toast notifications for export failures
- Retry logic for failed Supabase queries
- Graceful degradation if charts fail to render

## Performance Considerations

### Optimization Done
1. **Memoization**: Area calculations only recalculate on data change
2. **No External Libraries**: Custom SVG charts reduce bundle size
3. **Lazy Loading**: Skeletons show while data loads
4. **Efficient Filtering**: In-memory filter, no re-fetch
5. **Conditional Rendering**: Charts only render when needed

### Potential Bottlenecks
- Large number of attempts (50+) → filtering and calculations slower
- SVG rendering of many data points → browser handles well up to 100+ points
- PDF generation → client-side, fast on modern browsers

### Monitoring Recommendations
- Track page load time in analytics
- Monitor Supabase query latency
- Track export button usage
- Monitor error rates

## Testing Strategy

### Unit Tests
```typescript
// Test time period filtering
test('filters last 7 days correctly', () => {
  const attempts = [...] // mock data spanning 2 months
  const filtered = filterByTimePeriod(attempts, '7days')
  expect(filtered).toHaveLength(5) // 5 attempts in last 7 days
})

// Test probability calculation
test('calculates pass probability correctly', () => {
  const prob = calculatePassProbability(0.5)
  expect(prob).toBeGreaterThan(0.5)
  expect(prob).toBeLessThan(1)
})
```

### Integration Tests
```typescript
// Test full data flow
test('page loads and displays data correctly', async () => {
  render(<DesempenhoPage />)
  expect(screen.getByText('Desempenho')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText(/Pontuação Média/)).toBeInTheDocument()
  })

  // Verify all sections loaded
  expect(screen.getByText('Histórico de Pontuação')).toBeInTheDocument()
  expect(screen.getByText('Desempenho por Área')).toBeInTheDocument()
})
```

### Visual Tests
```typescript
// Test responsive design
test('charts scale on mobile', () => {
  const { container } = render(<ScoreHistory attempts={mockAttempts} />)
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('preserveAspectRatio', 'none')
})
```

### E2E Tests
```typescript
// Test export functionality
test('user can export CSV', async () => {
  const { user } = render(<DesempenhoPage />)
  await user.click(screen.getByText('Exportar'))
  await user.click(screen.getByText('Baixar como CSV'))
  // Verify download was triggered
})
```

## Deployment Checklist

- [ ] All components compile without errors
- [ ] No TypeScript errors in strict mode
- [ ] All imports resolved correctly
- [ ] Tailwind classes properly applied
- [ ] Charts render correctly in production build
- [ ] Export functionality tested manually
- [ ] Time period filter works as expected
- [ ] Empty state displays correctly
- [ ] Loading skeleton shows on page load
- [ ] Mobile responsive tested on real devices
- [ ] Accessibility tested with screen reader
- [ ] Performance metrics acceptable
- [ ] No console errors or warnings
- [ ] Analytics tracking in place (if applicable)

## Migration from Old Version

### Breaking Changes
None - all changes are backward compatible

### Data Migration
None required - uses existing Supabase tables

### Feature Flags (if needed)
```typescript
const FEATURES = {
  TIME_PERIOD_FILTER: true,
  EXPORT_FUNCTIONALITY: true,
  PROBABILITY_TREND: true,
  WEAK_AREAS_RECOMMENDATIONS: true,
}
```

## Future Enhancement Ideas

1. **Advanced Analytics**
   - Trend analysis with linear regression
   - Prediction of exam readiness
   - Comparison with class averages

2. **Customization**
   - User-configurable dashboard widgets
   - Save/load dashboard layouts
   - Dark/light theme toggle

3. **Social Features**
   - Share performance with study group
   - Challenge friends to competitions
   - Leaderboards

4. **Integration**
   - Google Calendar sync
   - Slack notifications
   - Email reports

5. **AI Features**
   - Personalized study recommendations
   - Chatbot for performance Q&A
   - Video content recommendations by weak area

6. **Mobile App**
   - Native charts optimized for small screens
   - Offline support
   - Push notifications for streaks

## Support & Maintenance

### Common Issues

**Charts not rendering**
- Check browser console for SVG errors
- Verify Supabase data structure
- Ensure recentAttempts array is not empty

**Export not working**
- Verify browser allows file downloads
- Check browser console for errors
- Test with different export format

**Time filter not updating**
- Check `timePeriod` state change
- Verify `useEffect` dependency array
- Clear browser cache and reload

### Debugging

Enable console logging in components:
```typescript
console.log('Attempts:', attempts)
console.log('Filtered:', filteredAttempts)
console.log('Area Performance:', areaPerformance)
console.log('Stats:', stats)
```

Access Supabase data directly:
```typescript
const { data } = await supabase
  .from('exam_attempts')
  .select('*')
  .eq('user_id', user.id)
console.log(data)
```

---

**Last Updated**: February 1, 2025
**Version**: 1.0.0
**Maintainer**: Darwin Education Team
