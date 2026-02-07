/**
 * Setup CIP Sample Data
 * ======================
 *
 * This script populates the Supabase database with sample CIP data
 * for testing and development. Run this before using the CIP feature.
 *
 * Usage: npx tsx scripts/setup-cip-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupCIPData() {
  console.log('🚀 Setting up CIP sample data...\n')

  // Step 1: Check if tables exist
  console.log('1️⃣  Checking database tables...')
  const { data: tables, error: tablesError } = await supabase
    .from('cip_diagnoses')
    .select('id')
    .limit(1)

  if (tablesError) {
    console.error('❌ CIP tables not found. Please run the migration first:')
    console.error('   infrastructure/supabase/migrations/001_cip_schema.sql')
    console.error('\nError:', tablesError.message)
    process.exit(1)
  }
  console.log('✅ CIP tables exist\n')

  // Step 2: Sample diagnoses
  console.log('2️⃣  Inserting sample diagnoses...')
  const diagnoses = [
    {
      id: 'diag-dm2',
      name_pt: 'Diabetes Mellitus tipo 2',
      icd10_code: 'E11',
      area: 'clinica_medica',
      subspecialty: 'endocrinologia',
      difficulty_tier: 3,
    },
    {
      id: 'diag-has',
      name_pt: 'Hipertensão Arterial Sistêmica',
      icd10_code: 'I10',
      area: 'clinica_medica',
      subspecialty: 'cardiologia',
      difficulty_tier: 2,
    },
    {
      id: 'diag-pneumonia',
      name_pt: 'Pneumonia Adquirida na Comunidade',
      icd10_code: 'J18',
      area: 'clinica_medica',
      subspecialty: 'pneumologia',
      difficulty_tier: 2,
    },
    {
      id: 'diag-apendicite',
      name_pt: 'Apendicite Aguda',
      icd10_code: 'K35',
      area: 'cirurgia',
      subspecialty: 'cirurgia_geral',
      difficulty_tier: 2,
    },
  ]

  const { error: diagError } = await supabase
    .from('cip_diagnoses')
    .upsert(diagnoses, { onConflict: 'id' })

  if (diagError) {
    console.error('❌ Error inserting diagnoses:', diagError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${diagnoses.length} diagnoses\n`)

  // Step 3: Sample findings
  console.log('3️⃣  Inserting sample findings...')
  const findings = [
    // Medical History
    { id: 'find-hist-polidipsia', text_pt: 'Polidipsia e poliúria há 3 meses', section: 'medical_history' },
    { id: 'find-hist-cefaleia', text_pt: 'Cefaleia occipital matinal', section: 'medical_history' },
    { id: 'find-hist-febre-tosse', text_pt: 'Febre e tosse produtiva há 5 dias', section: 'medical_history' },
    { id: 'find-hist-dor-fid', text_pt: 'Dor abdominal em fossa ilíaca direita há 24h', section: 'medical_history' },
    // Physical Exam
    { id: 'find-exam-acantose', text_pt: 'Acantose nigricans em região cervical', section: 'physical_exam' },
    { id: 'find-exam-pa-elevada', text_pt: 'PA 180x110 mmHg', section: 'physical_exam' },
    { id: 'find-exam-crepitacoes', text_pt: 'Crepitações em base pulmonar direita', section: 'physical_exam' },
    { id: 'find-exam-blumberg', text_pt: 'Sinal de Blumberg positivo', section: 'physical_exam' },
    // Laboratory
    { id: 'find-lab-glicemia-alta', text_pt: 'Glicemia de jejum 280 mg/dL, HbA1c 10%', section: 'laboratory' },
    { id: 'find-lab-creatinina', text_pt: 'Creatinina 1.8 mg/dL, proteinúria', section: 'laboratory' },
    { id: 'find-lab-leucocitose', text_pt: 'Leucócitos 18.000, PCR 150 mg/L', section: 'laboratory' },
    { id: 'find-lab-amilase', text_pt: 'Leucocitose, amilase normal', section: 'laboratory' },
    // Treatment
    { id: 'find-trat-metformina', text_pt: 'Metformina 850mg 2x/dia + orientação dietética', section: 'treatment' },
    { id: 'find-trat-ieca', text_pt: 'IECA + diurético tiazídico', section: 'treatment' },
    { id: 'find-trat-antibiotico', text_pt: 'Amoxicilina + Clavulanato ou Ceftriaxona', section: 'treatment' },
    { id: 'find-trat-apendicectomia', text_pt: 'Apendicectomia + antibioticoterapia', section: 'treatment' },
  ]

  const { error: findError } = await supabase
    .from('cip_findings')
    .upsert(findings, { onConflict: 'id' })

  if (findError) {
    console.error('❌ Error inserting findings:', findError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${findings.length} findings\n`)

  // Step 4: Create a simple practice puzzle
  console.log('4️⃣  Creating practice puzzle...')

  const puzzleId = 'puzzle-practice-facil-01'
  const puzzle = {
    id: puzzleId,
    title: 'Puzzle de Prática - Fácil',
    description: 'Puzzle básico com 4 diagnósticos comuns. Ideal para iniciantes.',
    difficulty: 'facil',
    diagnosis_ids: ['diag-dm2', 'diag-has', 'diag-pneumonia', 'diag-apendicite'],
    areas: ['clinica_medica', 'cirurgia'],
    settings: {
      diagnosisCount: 4,
      sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'],
      distractorCount: 2,
      allowReuse: false,
    },
    options_per_section: {
      medical_history: [
        'find-hist-polidipsia',
        'find-hist-cefaleia',
        'find-hist-febre-tosse',
        'find-hist-dor-fid',
      ],
      physical_exam: [
        'find-exam-acantose',
        'find-exam-pa-elevada',
        'find-exam-crepitacoes',
        'find-exam-blumberg',
      ],
      laboratory: [
        'find-lab-glicemia-alta',
        'find-lab-creatinina',
        'find-lab-leucocitose',
        'find-lab-amilase',
      ],
      treatment: [
        'find-trat-metformina',
        'find-trat-ieca',
        'find-trat-antibiotico',
        'find-trat-apendicectomia',
      ],
    },
    time_limit_minutes: 25,
    type: 'practice',
    is_public: true,
    is_ai_generated: false,
  }

  const { error: puzzleError } = await supabase
    .from('cip_puzzles')
    .upsert([puzzle], { onConflict: 'id' })

  if (puzzleError) {
    console.error('❌ Error creating puzzle:', puzzleError.message)
    process.exit(1)
  }
  console.log('✅ Created practice puzzle\n')

  // Step 5: Create puzzle grid (correct answers)
  console.log('5️⃣  Creating puzzle grid...')
  const grid = [
    // Diabetes (row 0)
    { puzzle_id: puzzleId, row_index: 0, section: 'medical_history', correct_finding_id: 'find-hist-polidipsia' },
    { puzzle_id: puzzleId, row_index: 0, section: 'physical_exam', correct_finding_id: 'find-exam-acantose' },
    { puzzle_id: puzzleId, row_index: 0, section: 'laboratory', correct_finding_id: 'find-lab-glicemia-alta' },
    { puzzle_id: puzzleId, row_index: 0, section: 'treatment', correct_finding_id: 'find-trat-metformina' },
    // Hipertensão (row 1)
    { puzzle_id: puzzleId, row_index: 1, section: 'medical_history', correct_finding_id: 'find-hist-cefaleia' },
    { puzzle_id: puzzleId, row_index: 1, section: 'physical_exam', correct_finding_id: 'find-exam-pa-elevada' },
    { puzzle_id: puzzleId, row_index: 1, section: 'laboratory', correct_finding_id: 'find-lab-creatinina' },
    { puzzle_id: puzzleId, row_index: 1, section: 'treatment', correct_finding_id: 'find-trat-ieca' },
    // Pneumonia (row 2)
    { puzzle_id: puzzleId, row_index: 2, section: 'medical_history', correct_finding_id: 'find-hist-febre-tosse' },
    { puzzle_id: puzzleId, row_index: 2, section: 'physical_exam', correct_finding_id: 'find-exam-crepitacoes' },
    { puzzle_id: puzzleId, row_index: 2, section: 'laboratory', correct_finding_id: 'find-lab-leucocitose' },
    { puzzle_id: puzzleId, row_index: 2, section: 'treatment', correct_finding_id: 'find-trat-antibiotico' },
    // Apendicite (row 3)
    { puzzle_id: puzzleId, row_index: 3, section: 'medical_history', correct_finding_id: 'find-hist-dor-fid' },
    { puzzle_id: puzzleId, row_index: 3, section: 'physical_exam', correct_finding_id: 'find-exam-blumberg' },
    { puzzle_id: puzzleId, row_index: 3, section: 'laboratory', correct_finding_id: 'find-lab-amilase' },
    { puzzle_id: puzzleId, row_index: 3, section: 'treatment', correct_finding_id: 'find-trat-apendicectomia' },
  ]

  const { error: gridError } = await supabase
    .from('cip_puzzle_grid')
    .upsert(grid, { onConflict: 'puzzle_id,row_index,section' })

  if (gridError) {
    console.error('❌ Error creating puzzle grid:', gridError.message)
    process.exit(1)
  }
  console.log(`✅ Created puzzle grid with ${grid.length} cells\n`)

  console.log('✨ CIP setup complete!')
  console.log('\n📝 Summary:')
  console.log(`   • ${diagnoses.length} diagnoses`)
  console.log(`   • ${findings.length} findings`)
  console.log(`   • 1 practice puzzle (difficulty: facil)`)
  console.log(`   • ${grid.length} grid cells`)
  console.log('\n🎮 You can now test the CIP feature at: /cip/pratica?difficulty=facil')
}

setupCIPData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
