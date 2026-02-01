# Pilot Test Data Setup

## Quick Start

To populate your Supabase database with test data for the pilot:

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard
   - Select your project: jpzkjkwcoudaxscrukye
   - Click "SQL Editor" in the left menu

2. **Run the Test Data Script**
   - Click "New Query"
   - Copy the entire contents of `pilot_test_data.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl+Enter)

3. **Verify Data Loaded**
   - Go to "Table Editor" in left menu
   - Check these tables:
     - `question_banks` - should have 1 row (ENAMED Pilot Test Bank)
     - `questions` - should have 5 rows (sample questions)
     - `exams` - should have 1 row (Simulado ENAMED - Pilot Test)

## What Gets Created

### Question Bank
- **Name**: ENAMED Pilot Test Bank
- **Questions**: 5 sample questions covering all 5 ENAMED areas

### Questions (5 total)

1. **Clínica Médica** - Hipertensão Arterial (Easy)
   - IRT Difficulty: -0.5 (below average)
   - Topic: Adjusting hypertension medication dosage

2. **Cirurgia** - Apendicite Aguda (Medium)
   - IRT Difficulty: 0.2 (average)
   - Topic: Diagnosing acute appendicitis

3. **Pediatria** - Bronquiolite Viral (Hard)
   - IRT Difficulty: 1.2 (above average)
   - Topic: Managing viral bronchiolitis

4. **Ginecologia/Obstetrícia** - Pré-eclâmpsia (Medium)
   - IRT Difficulty: 0.5 (average)
   - Topic: Severe pre-eclampsia management

5. **Saúde Coletiva** - Imunização (Easy)
   - IRT Difficulty: -0.8 (below average)
   - Topic: Vaccine contraindications in pregnancy

### Sample Exam
- **Title**: Simulado ENAMED - Pilot Test
- **Time Limit**: 30 minutes
- **Questions**: All 5 test questions
- **Type**: Official Simulation
- **Public**: Yes (all users can access)

## Testing the TRI Scoring

The questions have different IRT parameters to properly test the TRI scoring system:

- **Easy questions** (-0.8, -0.5): Most users should answer correctly
- **Medium questions** (0.2, 0.5): About 50% success rate
- **Hard question** (1.2): Only high-ability users should answer correctly

This allows you to verify that:
1. TRI scoring accounts for question difficulty
2. Final scores are properly scaled (0-1000 range)
3. Area breakdowns are calculated correctly
4. Pass probability estimation works

## How Users Can Test

1. **Login** to https://your-app.vercel.app
2. **Click "Simulado"** on the home page
3. **Start "Simulado ENAMED - Pilot Test"**
4. **Answer the 5 questions**
5. **View results** with:
   - TRI score (0-1000)
   - Theta ability estimate
   - Area breakdown by specialty
   - Pass probability

## Notes

- The SQL uses PostgreSQL-specific syntax (ARRAY[], ::jsonb, ::uuid)
- These are fully supported by Supabase
- IDE syntax warnings can be ignored - the SQL is valid
- All IDs are fixed UUIDs for consistency across deployments
