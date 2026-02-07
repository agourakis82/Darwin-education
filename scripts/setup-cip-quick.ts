/**
 * Quick CIP Setup - Uses database-generated UUIDs
 * Run: pnpm tsx scripts/setup-cip-quick.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
})

async function main() {
  console.log('🚀 Setting up CIP sample data...\n')

  // Step 1: Insert diagnoses (let DB generate UUIDs)
  console.log('1️⃣  Inserting diagnoses...')
  const { data: diagnoses, error: diagError } = await supabase
    .from('cip_diagnoses')
    .insert([
      { name_pt: 'Diabetes Mellitus tipo 2', icd10_code: 'E11', area: 'clinica_medica', subspecialty: 'endocrinologia', difficulty_tier: 2 },
      { name_pt: 'Hipertensão Arterial Sistêmica', icd10_code: 'I10', area: 'clinica_medica', subspecialty: 'cardiologia', difficulty_tier: 1 },
      { name_pt: 'Pneumonia Adquirida na Comunidade', icd10_code: 'J18', area: 'clinica_medica', subspecialty: 'pneumologia', difficulty_tier: 2 },
      { name_pt: 'Apendicite Aguda', icd10_code: 'K35', area: 'cirurgia', subspecialty: 'cirurgia_geral', difficulty_tier: 2 },
      { name_pt: 'Doença Diarreica Aguda', icd10_code: 'A09', area: 'pediatria', subspecialty: 'gastroenterologia', difficulty_tier: 1 },
    ])
    .select()

  if (diagError) {
    console.error('❌ Error inserting diagnoses:', diagError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${diagnoses.length} diagnoses\n`)

  // Step 2: Insert findings
  console.log('2️⃣  Inserting clinical findings...')
  const { data: findings, error: findError } = await supabase
    .from('cip_findings')
    .insert([
      // Diabetes
      { text_pt: 'Polidipsia, poliúria e perda de peso há 3 meses', section: 'medical_history' },
      { text_pt: 'Glicemia de jejum: 180 mg/dL', section: 'laboratory' },
      { text_pt: 'HbA1c: 8.5%', section: 'laboratory' },
      { text_pt: 'Iniciar metformina 850mg 2x/dia', section: 'treatment' },

      // HAS
      { text_pt: 'Cefaleia occipital matinal recorrente', section: 'medical_history' },
      { text_pt: 'PA: 160/100 mmHg (confirmada em 3 medidas)', section: 'physical_exam' },
      { text_pt: 'Iniciar losartana 50mg/dia', section: 'treatment' },

      // Pneumonia
      { text_pt: 'Febre alta e tosse produtiva há 5 dias', section: 'medical_history' },
      { text_pt: 'MV diminuído em base direita, estertores crepitantes', section: 'physical_exam' },
      { text_pt: 'RX tórax: consolidação lobar inferior direita', section: 'imaging' },
      { text_pt: 'Amoxicilina + clavulanato 875mg 12/12h por 7 dias', section: 'treatment' },

      // Apendicite
      { text_pt: 'Dor abdominal migratória (epigástrio → FID) há 24h', section: 'medical_history' },
      { text_pt: 'Sinal de Blumberg positivo em FID', section: 'physical_exam' },
      { text_pt: 'Leucocitose 18.000 com desvio à esquerda', section: 'laboratory' },
      { text_pt: 'Apendicectomia videolaparoscópica', section: 'treatment' },

      // DDA
      { text_pt: 'Criança 2 anos, diarreia líquida e vômitos há 2 dias', section: 'medical_history' },
      { text_pt: 'Desidratação leve (mucosas levemente secas)', section: 'physical_exam' },
      { text_pt: 'TGO rápido: sem desidrataç ão grave', section: 'laboratory' },
      { text_pt: 'Soro de reidratação oral + zinco', section: 'treatment' },
    ])
    .select()

  if (findError) {
    console.error('❌ Error inserting findings:', findError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${findings.length} findings\n`)

  // Step 3: Create a sample puzzle
  console.log('3️⃣  Creating sample puzzle...')

  const puzzleDiagnoses = diagnoses.slice(0, 4) // Use first 4 diagnoses
  const diagnosisIds = puzzleDiagnoses.map(d => d.id)

  // Map findings to sections
  const findingsBySection: Record<string, string[]> = {
    medical_history: [],
    physical_exam: [],
    laboratory: [],
    treatment: [],
  }

  findings.forEach(f => {
    if (findingsBySection[f.section]) {
      findingsBySection[f.section].push(f.id)
    }
  })

  const { data: puzzle, error: puzzleError } = await supabase
    .from('cip_puzzles')
    .insert({
      title: 'Puzzle de Prática - Fácil',
      difficulty: 'facil',
      diagnosis_ids: diagnosisIds,
      options_per_section: findingsBySection,
      settings: {
        diagnosisCount: 4,
        sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'],
        distractorCount: 2,
        allowReuse: false,
      },
      time_limit_minutes: 25,
      type: 'practice',
      is_public: true,
    })
    .select()
    .single()

  if (puzzleError) {
    console.error('❌ Error creating puzzle:', puzzleError.message)
    process.exit(1)
  }
  console.log(`✅ Created puzzle: ${puzzle.id}\n`)

  // Step 4: Create puzzle grid (correct answers)
  console.log('4️⃣  Creating puzzle grid...')

  const gridCells = []
  const sections = ['medical_history', 'physical_exam', 'laboratory', 'treatment']

  for (let rowIndex = 0; rowIndex < puzzleDiagnoses.length; rowIndex++) {
    for (const section of sections) {
      const sectionFindings = findingsBySection[section]
      if (sectionFindings && sectionFindings.length > rowIndex) {
        gridCells.push({
          puzzle_id: puzzle.id,
          row_index: rowIndex,
          section: section,
          correct_finding_id: sectionFindings[rowIndex % sectionFindings.length],
          irt_difficulty: 0,
        })
      }
    }
  }

  const { error: gridError } = await supabase
    .from('cip_puzzle_grid')
    .insert(gridCells)

  if (gridError) {
    console.error('❌ Error creating grid:', gridError.message)
    process.exit(1)
  }
  console.log(`✅ Created ${gridCells.length} grid cells\n`)

  console.log('🎉 Setup complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Diagnoses: ${diagnoses.length}`)
  console.log(`   - Findings: ${findings.length}`)
  console.log(`   - Puzzles: 1`)
  console.log(`   - Grid cells: ${gridCells.length}`)
  console.log(`\n🧩 Test the puzzle at: /cip/${puzzle.id}`)
}

main().catch(console.error)
