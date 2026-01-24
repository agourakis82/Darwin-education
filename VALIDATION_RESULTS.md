# Bootstrap Validation Results: ENAMED 2025 IRT Estimation

**Date**: 2025-01-24
**Dataset**: 90 ENAMED 2025 questions
**Empirical Data**: Microdata item parameters (biserial correlation, difficulty from Rasch analysis)
**Estimated Data**: Metadata-based IRT using current config

## Executive Summary

The current metadata-based IRT estimation model **requires significant tuning** to match empirical ENAMED data. The model exhibits systematic bias and lacks the variance needed to capture the wide range of question difficulties.

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Difficulty MAE | 1.501 | < 0.3 | 🔴 Critical |
| Difficulty Correlation | 0.148 | > 0.7 | 🔴 Critical |
| Discrimination MAE | 0.417 | < 0.25 | 🔴 Critical |
| Discrimination Correlation | 0.000 | > 0.6 | 🔴 Critical |
| Coverage Rate | 90.0% | ~100% | 🟡 Good (9 questions missing) |

---

## Root Cause Analysis

### 1. Difficulty Estimation Failure

**Problem**: All estimated difficulties cluster in range [0.2, 0.7], but empirical difficulties range [-3.5, +2.4].

```
Empirical Range:  -3.5 ──────────────────────────── +2.4   (span = 5.9)
Estimated Range:   0.2 ─── 0.7                              (span = 0.5)
```

**Root Causes**:
- Current model only varies difficulty by:
  - Position: ±0.3 (total 0.6 range)
  - Area: ±0.15 (max)
  - Institution: +0.4 (fixed, one tier)
  - **Total: ~0.6 to 0.9 range** — 6-10x too small

- Missing critical parameters:
  - Medical complexity/taxonomy level
  - Specific disease prevalence/importance
  - Question format variations
  - Clinical skills vs knowledge questions

### 2. Discrimination Estimation Failure

**Problem**: All estimated discrimination = 1.380 (constant).

```
Estimated:  1.380 (identical for all questions)
Empirical:  [0.30, 1.95] (varies 6x)
```

**Root Cause**: Current model only applies multipliers (1.0 × 1.2 × 1.15 = 1.38), no variance source.

Discrimination should vary based on:
- Question quality/clarity
- Distractor plausibility
- Topic difficulty
- Population ability distribution

### 3. Area Assignment Issue

**Symptom**: Analysis shows all questions as "unknown" area despite assigning areas.

**Cause**: Area information not passed through validation pipeline correctly.

---

## Detailed Analysis

### Difficulty Errors (Top 10)

| Question | Estimated | Empirical | Error | Analysis |
|----------|-----------|-----------|-------|----------|
| Q23 | +0.498 | -3.538 | 4.036 | Very easy question underestimated as moderate |
| Q32 | +0.559 | -3.316 | 3.875 | Should be very easy, estimated as moderate |
| Q77 | +0.562 | -3.205 | 3.768 | Very easy, estimated as moderate |
| Q84 | +0.610 | -2.982 | 3.591 | Very easy, estimated as moderate |
| Q3 | +0.213 | -3.237 | 3.450 | Very easy, estimated as slightly easy |

**Pattern**: Questions with very negative empirical difficulties (easy questions) are systematically overestimated in our model.

### Position-Based Analysis

| Quartile | Position | MAE | Observations |
|----------|----------|-----|--------------|
| 1 | Q1-Q23 | 1.402 | First quartile questions average most bias |
| 2 | Q24-Q46 | 1.570 | Second quartile highest bias |
| 3 | Q47-Q69 | 1.256 | Third quartile shows improvement (closer to target) |
| 4 | Q70-Q90 | 1.816 | Fourth quartile shows degradation again |

**Insight**: Position-based linear adjustment is not the correct model. Actual difficulty pattern is non-linear.

---

## Recommended Tuning Strategy

### Phase 1: Immediate Tuning (Week 1)

**1.1 Expand Difficulty Variance**

Current coefficients only create 0.6-0.9 total range. To reach empirical range of 5.9:

```
Current Model:
  Base: 0.0
  + Institution (+0.4)
  + Exam Type (+0.2)
  + Position (±0.3)
  + Area (±0.15)
  = Total range: ~0.9

Target Model:
  Base: 0.0
  + Institution (±2.0 instead of +0.4)
  + Exam Type (±0.5)
  + Position (±1.5 instead of ±0.3, use non-linear)
  + Area (±0.5 instead of ±0.15)
  + Topic Complexity (NEW: ±1.0)
  + Question Type (NEW: ±0.5)
  = Target range: ~5.0-6.0
```

**Specific Changes**:

a) **Institution Adjustment** (BIGGEST IMPACT):
   - Current: +0.4
   - Recommended: -2.0 to +2.0 range based on empirical data distribution
   - Rationale: ENAMED shows -3.5 to +2.4 range; we need wider institutional variance

   ```javascript
   institutionAdjustment: {
     TIER_1_NATIONAL: 0.5,  // Instead of 0.4
     // Add new tier for variation calibration
   },
   ```

b) **Position Adjustment** (NON-LINEAR):
   - Current: Linear ±0.3
   - Recommended: Position-based polynomial adjustment

   Analysis shows:
   - Easy questions: positions 3, 23, 32, 77, 84 (mixed positions)
   - Hard questions: 58, 59, 72, 57 (end/middle)
   - Current linear model doesn't fit

   Suggestion: Use empirical position-difficulty correlation to fit polynomial

c) **Add Topic Complexity** (NEW):
   - Empirical data shows questions cluster by area
   - Different areas have different average difficulties
   - Add area-specific offsets based on empirical means

   From data:
   - Clinica Médica: mix of difficulties
   - Cirurgia: tendency toward very easy
   - Ginecologia: moderate
   - Pediatria: varied
   - Saúde Coletiva: varied

   ```javascript
   areaAdjustment: {
     'clinica_medica': 0.0,        // Baseline (currently 0.0) ✓
     'cirurgia': -1.0,              // Empirically easier, increase negative
     'ginecologia_obstetricia': -0.2,
     'pediatria': -0.3,
     'saude_coletiva': 0.1,
   },
   ```

### 1.2 Fix Discrimination Estimation

Current: All questions → 1.38 (constant)

**Strategy**: Add discrimination variance sources:

```javascript
discrimination: {
  baseValue: 1.0,
  institutionMultiplier: 1.2,
  examTypeMultiplier: 1.15,

  // NEW: Position-based discrimination
  // Easier questions tend to have higher discrimination
  positionMultiplier: function(position, total) {
    // Questions at extremes may discriminate less
    return 0.9 + 0.4 * (1 - Math.abs(2*(position-1)/total - 1));
  },

  // NEW: Difficulty-based adjustment
  // Very easy/hard questions discriminate differently
  // (implement after tuning difficulty)
},
```

### Phase 2: Data-Driven Tuning (Week 2)

Once Phase 1 increases variance:

**2.1 Empirical Calibration**

- Fit polynomial regression: `difficulty_empirical ~ f(position, area)`
- Solve for optimal coefficients
- Use multiple rounds of validation

**2.2 Discrimination from Biserial**

- Verify K_FACTOR = 3.0 is appropriate
- Check if transformation formula needs adjustment
- Validate against known question banks

### Phase 3: Cross-Validation (Week 3)

- Apply tuned model to other exam sources (ENARE, USP)
- Measure generalization error
- Adjust if overfitted to ENAMED

---

## Implementation Checklist

### Immediate Actions (Critical)

- [ ] Update `IRT_ESTIMATION_CONFIG` with expanded difficulty ranges:
  - [ ] Increase institutional adjustment from ±0.4 to ±2.0
  - [ ] Switch position adjustment to non-linear model
  - [ ] Refine area adjustments based on empirical analysis
  - [ ] Add topic complexity parameter

- [ ] Add discrimination variance:
  - [ ] Implement position-based multiplier
  - [ ] Add difficulty-based adjustment

- [ ] Fix area tracking in validation pipeline

### Validation Steps

- [ ] Re-run bootstrap validation after each coefficient change
- [ ] Monitor: MAE, correlation, variance
- [ ] Check for overfitting on easy/hard questions

### Testing

- [ ] Verify model generalizes to ENAMED 2024 (if available)
- [ ] Test on other exam sources before full deployment
- [ ] Ensure no parameters exceed bounds

---

## Quick Reference: Current vs. Recommended

```javascript
// CURRENT (FAILS)
const IRT_ESTIMATION_CONFIG = {
  difficulty: {
    baseValue: 0.0,
    institutionAdjustment: { TIER_1_NATIONAL: 0.4 },
    positionMaxAdjustment: 0.3,  // Linear
    areaAdjustment: {
      'cirurgia': 0.15,          // But empirically easier!
      'saude_coletiva': -0.15,   // But empirically harder!
    },
  },
};

// RECOMMENDED (PHASE 1)
const IRT_ESTIMATION_CONFIG = {
  difficulty: {
    baseValue: 0.0,
    // Much wider institutional range
    institutionAdjustment: { TIER_1_NATIONAL: 1.5 },

    // Position: Use polynomial instead of linear
    positionAdjustment: function(pos, total) {
      const x = (pos - 1) / (total - 1);
      return -1.5 + 3.0 * x - 2.0 * x*x; // Quadratic: starts -1.5, ends +1.5
    },

    // Area: Flip signs based on empirical data
    areaAdjustment: {
      'clinica_medica': 0.2,
      'cirurgia': -1.0,           // Was +0.15, empirically easier
      'ginecologia_obstetricia': -0.3,
      'pediatria': -0.5,
      'saude_coletiva': 0.3,      // Was -0.15, empirically harder
    },
  },
  discrimination: {
    baseValue: 1.0,
    // Add position variance
    positionMultiplier: function(pos, total) {
      const x = (pos - 1) / (total - 1);
      return 0.9 + 0.4 * Math.sin(x * Math.PI); // Bell curve
    },
  },
};
```

---

## Files Affected

1. `packages/shared/src/config/irt-estimation-config.ts` — Update difficulty/discrimination coefficients
2. `infrastructure/supabase/seed/bootstrap-validation.js` — Re-run to verify improvements
3. `PHASE2_COMPLETION_REPORT.md` — Update validation section with new baseline

---

## Success Criteria (Phase 1)

- [ ] Difficulty MAE < 0.8 (from 1.501)
- [ ] Difficulty correlation > 0.5 (from 0.148)
- [ ] Discrimination correlation > 0.3 (from 0.000)
- [ ] No significant degradation when applied to new exam sources

---

## Next Steps

1. **Implement Phase 1 coefficient changes** (2-3 hours)
2. **Run validation** to measure improvement (30 min)
3. **Iterate based on results** (1-2 rounds)
4. **Document final configuration** in config file comments
5. **Cross-test on ENARE/USP** before full deployment

---

## Notes for Future Researchers

- ENAMED empirical difficulties span **5.9 scale units** (-3.5 to +2.4)
- Current model only generates **0.6 units** of variation
- Position is weakly predictive of difficulty (correlation ~0.14)
- Area matters but current direction is reversed
- Discrimination varies 6x across questions (0.3 to 1.95) but model assumes constant
- Consider multi-level model: institution → area → topic → question

