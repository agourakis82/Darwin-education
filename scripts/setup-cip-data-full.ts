/**
 * Setup CIP Sample Data - Full Version
 * =====================================
 *
 * This script creates 10 puzzles across all difficulty levels:
 * - 2x Muito Fácil (3 diagnoses each)
 * - 3x Fácil (4 diagnoses each)
 * - 3x Médio (5 diagnoses each)
 * - 2x Difícil (6 diagnoses each)
 *
 * Usage: pnpm tsx scripts/setup-cip-data-full.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const ALL_DIAGNOSES = [
  // Clínica Médica - Endocrino
  { id: 'diag-dm2', name_pt: 'Diabetes Mellitus tipo 2', icd10_code: 'E11', area: 'clinica_medica', subspecialty: 'endocrinologia', difficulty_tier: 2 },
  { id: 'diag-hipotireoidismo', name_pt: 'Hipotireoidismo Primário', icd10_code: 'E03', area: 'clinica_medica', subspecialty: 'endocrinologia', difficulty_tier: 3 },

  // Clínica Médica - Cardio
  { id: 'diag-has', name_pt: 'Hipertensão Arterial Sistêmica', icd10_code: 'I10', area: 'clinica_medica', subspecialty: 'cardiologia', difficulty_tier: 1 },
  { id: 'diag-icc', name_pt: 'Insuficiência Cardíaca Congestiva', icd10_code: 'I50', area: 'clinica_medica', subspecialty: 'cardiologia', difficulty_tier: 4 },
  { id: 'diag-iam', name_pt: 'Infarto Agudo do Miocárdio', icd10_code: 'I21', area: 'clinica_medica', subspecialty: 'cardiologia', difficulty_tier: 4 },

  // Clínica Médica - Pneumo
  { id: 'diag-pneumonia', name_pt: 'Pneumonia Adquirida na Comunidade', icd10_code: 'J18', area: 'clinica_medica', subspecialty: 'pneumologia', difficulty_tier: 2 },
  { id: 'diag-dpoc', name_pt: 'DPOC (Doença Pulmonar Obstrutiva Crônica)', icd10_code: 'J44', area: 'clinica_medica', subspecialty: 'pneumologia', difficulty_tier: 3 },
  { id: 'diag-asma', name_pt: 'Asma Brônquica', icd10_code: 'J45', area: 'clinica_medica', subspecialty: 'pneumologia', difficulty_tier: 2 },

  // Cirurgia
  { id: 'diag-apendicite', name_pt: 'Apendicite Aguda', icd10_code: 'K35', area: 'cirurgia', subspecialty: 'cirurgia_geral', difficulty_tier: 2 },
  { id: 'diag-colecistite', name_pt: 'Colecistite Aguda', icd10_code: 'K81', area: 'cirurgia', subspecialty: 'cirurgia_geral', difficulty_tier: 3 },
  { id: 'diag-hda', name_pt: 'Hemorragia Digestiva Alta', icd10_code: 'K92', area: 'cirurgia', subspecialty: 'cirurgia_geral', difficulty_tier: 4 },

  // Pediatria
  { id: 'diag-bronquiolite', name_pt: 'Bronquiolite Viral Aguda', icd10_code: 'J21', area: 'pediatria', subspecialty: 'pneumologia', difficulty_tier: 2 },
  { id: 'diag-dda', name_pt: 'Doença Diarreica Aguda', icd10_code: 'A09', area: 'pediatria', subspecialty: 'gastroenterologia', difficulty_tier: 1 },

  // Gineco/Obstétrica
  { id: 'diag-pre-eclampsia', name_pt: 'Pré-eclâmpsia', icd10_code: 'O14', area: 'ginecologia_obstetricia', subspecialty: 'obstetricia', difficulty_tier: 4 },
  { id: 'diag-itu-gestante', name_pt: 'ITU na Gestação', icd10_code: 'O23', area: 'ginecologia_obstetricia', subspecialty: 'obstetricia', difficulty_tier: 2 },
]

const ALL_FINDINGS = [
  // Medical History - Diabetes
  { id: 'find-hist-polidipsia', text_pt: 'Polidipsia, poliúria e perda de peso há 3 meses', section: 'medical_history' },
  { id: 'find-hist-visao-turva', text_pt: 'Visão turva progressiva', section: 'medical_history' },

  // Medical History - HAS
  { id: 'find-hist-cefaleia', text_pt: 'Cefaleia occipital matinal recorrente', section: 'medical_history' },
  { id: 'find-hist-epistaxe', text_pt: 'Epistaxe esporádica', section: 'medical_history' },

  // Medical History - Pneumonia
  { id: 'find-hist-febre-tosse', text_pt: 'Febre alta e tosse produtiva há 5 dias', section: 'medical_history' },
  { id: 'find-hist-dispneia', text_pt: 'Dispneia aos esforços moderados', section: 'medical_history' },

  // Medical History - ICC
  { id: 'find-hist-dispneia-paroxistica', text_pt: 'Dispneia paroxística noturna', section: 'medical_history' },
  { id: 'find-hist-ortopneia', text_pt: 'Ortopneia (dorme com 3 travesseiros)', section: 'medical_history' },

  // Medical History - IAM
  { id: 'find-hist-dor-toracica', text_pt: 'Dor torácica em aperto há 2 horas, irradia para braço esquerdo', section: 'medical_history' },

  // Medical History - DPOC
  { id: 'find-hist-tabagismo', text_pt: 'Tabagismo 40 maços-ano, tosse crônica matinal', section: 'medical_history' },

  // Medical History - Asma
  { id: 'find-hist-sibilancia', text_pt: 'Sibilância e tosse noturna, piora com frio', section: 'medical_history' },

  // Medical History - Hipotireoidismo
  { id: 'find-hist-cansaco', text_pt: 'Cansaço extremo, ganho de peso, intolerância ao frio', section: 'medical_history' },

  // Medical History - Apendicite
  { id: 'find-hist-dor-fid', text_pt: 'Dor abdominal migratória (epigástrio → FID) há 24h', section: 'medical_history' },

  // Medical History - Colecistite
  { id: 'find-hist-colica-biliar', text_pt: 'Dor em HD pós-prandial, principalmente após gordura', section: 'medical_history' },

  // Medical History - HDA
  { id: 'find-hist-melena', text_pt: 'Melena há 2 dias, fraqueza intensa', section: 'medical_history' },

  // Medical History - Pediatria
  { id: 'find-hist-lactente-coriza', text_pt: 'Lactente 6 meses, coriza e tosse há 3 dias', section: 'medical_history' },
  { id: 'find-hist-diarreia-crianca', text_pt: 'Criança 2 anos, diarreia líquida e vômitos há 2 dias', section: 'medical_history' },

  // Medical History - Gineco
  { id: 'find-hist-gestante-pa', text_pt: 'Gestante 34 semanas, PA elevada em 2 consultas', section: 'medical_history' },
  { id: 'find-hist-disuria-gest', text_pt: 'Gestante com disúria, urgência e polaciúria', section: 'medical_history' },

  // Physical Exam - Diabetes
  { id: 'find-exam-acantose', text_pt: 'Acantose nigricans cervical, IMC 32', section: 'physical_exam' },

  // Physical Exam - HAS
  { id: 'find-exam-pa-elevada', text_pt: 'PA 180x110 mmHg (confirmada), fundoscopia com exsudatos', section: 'physical_exam' },

  // Physical Exam - Pneumonia
  { id: 'find-exam-crepitacoes', text_pt: 'Crepitações e macicez à percussão em base direita', section: 'physical_exam' },

  // Physical Exam - ICC
  { id: 'find-exam-turgencia', text_pt: 'Turgência jugular, edema 3+/4+ em MMII', section: 'physical_exam' },
  { id: 'find-exam-b3', text_pt: 'B3 à ausculta cardíaca, hepatomegalia', section: 'physical_exam' },

  // Physical Exam - IAM
  { id: 'find-exam-sudorese', text_pt: 'Sudorese fria, pálido, ansioso', section: 'physical_exam' },

  // Physical Exam - DPOC
  { id: 'find-exam-mv-diminuido', text_pt: 'MV diminuído, expiração prolongada, tórax em tonel', section: 'physical_exam' },

  // Physical Exam - Asma
  { id: 'find-exam-sibilos', text_pt: 'Sibilos difusos bilateralmente', section: 'physical_exam' },

  // Physical Exam - Hipotireoidismo
  { id: 'find-exam-mixedema', text_pt: 'Pele fria e seca, mixedema, bradicardia', section: 'physical_exam' },

  // Physical Exam - Apendicite
  { id: 'find-exam-blumberg', text_pt: 'Blumberg +, Rovsing +, defesa em FID', section: 'physical_exam' },

  // Physical Exam - Colecistite
  { id: 'find-exam-murphy', text_pt: 'Murphy +, massa palpável em HD', section: 'physical_exam' },

  // Physical Exam - HDA
  { id: 'find-exam-palidez', text_pt: 'Palidez ++/4+, taquicardia, hipotensão postural', section: 'physical_exam' },

  // Physical Exam - Pediatria
  { id: 'find-exam-tiragem', text_pt: 'Tiragem subcostal, sibilos difusos, FR 65', section: 'physical_exam' },
  { id: 'find-exam-desidratacao', text_pt: 'Olhos encovados, turgor diminuído, mucosas secas', section: 'physical_exam' },

  // Physical Exam - Gineco
  { id: 'find-exam-edema-gest', text_pt: 'Edema facial e em mãos, ROT aumentados', section: 'physical_exam' },
  { id: 'find-exam-giordano', text_pt: 'Giordano + à direita, temperatura 38.5°C', section: 'physical_exam' },

  // Laboratory - Diabetes
  { id: 'find-lab-glicemia-alta', text_pt: 'Glicemia jejum 280 mg/dL, HbA1c 10.2%', section: 'laboratory' },

  // Laboratory - HAS
  { id: 'find-lab-creatinina', text_pt: 'Creatinina 1.8 mg/dL, proteinúria 500mg/24h', section: 'laboratory' },

  // Laboratory - Pneumonia
  { id: 'find-lab-leucocitose', text_pt: 'Leucócitos 18.000 com desvio, PCR 180 mg/L', section: 'laboratory' },

  // Laboratory - ICC
  { id: 'find-lab-bnp', text_pt: 'BNP 1800 pg/mL, RX: cardiomegalia e congestão', section: 'laboratory' },

  // Laboratory - IAM
  { id: 'find-lab-troponina', text_pt: 'Troponina I 45 ng/mL, ECG: supra ST DII/III/aVF', section: 'laboratory' },

  // Laboratory - DPOC
  { id: 'find-lab-gasometria', text_pt: 'Gasometria: pH 7.32, pCO2 58, HCO3 30 (acidose respiratória compensada)', section: 'laboratory' },

  // Laboratory - Asma
  { id: 'find-lab-espirometria', text_pt: 'Espirometria: VEF1/CVF <70%, reversível com BD', section: 'laboratory' },

  // Laboratory - Hipotireoidismo
  { id: 'find-lab-tsh', text_pt: 'TSH 45 mU/L, T4 livre 0.3 ng/dL', section: 'laboratory' },

  // Laboratory - Apendicite
  { id: 'find-lab-amilase', text_pt: 'Leucocitose 16.000, amilase e lipase normais', section: 'laboratory' },

  // Laboratory - Colecistite
  { id: 'find-lab-bilirrubinas', text_pt: 'Bilirrubinas elevadas, FA 380 U/L, GGT 250 U/L', section: 'laboratory' },

  // Laboratory - HDA
  { id: 'find-lab-hb-baixa', text_pt: 'Hb 6.5 g/dL, ureia 95 mg/dL (ureia/creatinina >100)', section: 'laboratory' },

  // Laboratory - Pediatria
  { id: 'find-lab-sat-o2', text_pt: 'SatO2 88% em ar ambiente, RX: hiperinsuflação', section: 'laboratory' },
  { id: 'find-lab-na-baixo', text_pt: 'Sódio 128 mEq/L, potássio 2.8 mEq/L', section: 'laboratory' },

  // Laboratory - Gineco
  { id: 'find-lab-proteinuria-gest', text_pt: 'Proteinúria 800 mg/24h, plaquetas 95.000, TGO/TGP elevadas', section: 'laboratory' },
  { id: 'find-lab-urocultura', text_pt: 'Urocultura: E. coli >100.000 UFC/mL', section: 'laboratory' },

  // Treatment - Diabetes
  { id: 'find-trat-metformina', text_pt: 'Metformina 850mg 2x/dia + mudança estilo de vida', section: 'treatment' },

  // Treatment - HAS
  { id: 'find-trat-ieca', text_pt: 'IECA (Enalapril 10mg/dia) + hidroclorotiazida 25mg', section: 'treatment' },

  // Treatment - Pneumonia
  { id: 'find-trat-antibiotico', text_pt: 'Amoxicilina + Clavulanato 875mg 12/12h por 7 dias', section: 'treatment' },

  // Treatment - ICC
  { id: 'find-trat-furosemida', text_pt: 'Furosemida + Espironolactona + IECA + Betabloqueador', section: 'treatment' },

  // Treatment - IAM
  { id: 'find-trat-iam', text_pt: 'AAS + Clopidogrel + Angioplastia primária urgente', section: 'treatment' },

  // Treatment - DPOC
  { id: 'find-trat-bd', text_pt: 'Tiotrópio + Formoterol, cessação tabagismo', section: 'treatment' },

  // Treatment - Asma
  { id: 'find-trat-ci', text_pt: 'Corticoide inalatório + LABA, plano de ação', section: 'treatment' },

  // Treatment - Hipotireoidismo
  { id: 'find-trat-levotiroxina', text_pt: 'Levotiroxina 75mcg em jejum', section: 'treatment' },

  // Treatment - Apendicite
  { id: 'find-trat-apendicectomia', text_pt: 'Apendicectomia videolaparoscópica + ATB', section: 'treatment' },

  // Treatment - Colecistite
  { id: 'find-trat-colecistectomia', text_pt: 'Colecistectomia videolaparoscópica + ATB', section: 'treatment' },

  // Treatment - HDA
  { id: 'find-trat-eda', text_pt: 'Reposição volêmica + EDA + IBP EV', section: 'treatment' },

  // Treatment - Pediatria
  { id: 'find-trat-o2', text_pt: 'Oxigenioterapia + aspiração nasal + hidratação', section: 'treatment' },
  { id: 'find-trat-sro', text_pt: 'Soro de reidratação oral + zinco', section: 'treatment' },

  // Treatment - Gineco
  { id: 'find-trat-sulfato-mg', text_pt: 'Sulfato de magnésio + anti-hipertensivos + parto', section: 'treatment' },
  { id: 'find-trat-atb-gest', text_pt: 'Cefalexina 500mg 6/6h por 7 dias', section: 'treatment' },
]

async function setupFullData() {
  console.log('🚀 Setting up FULL CIP data with 10 puzzles...\n')

  // Check tables
  console.log('1️⃣  Checking database tables...')
  const { error: tablesError } = await supabase.from('cip_diagnoses').select('id').limit(1)
  if (tablesError) {
    console.error('❌ CIP tables not found. Run the migration first!')
    console.error('Error:', tablesError.message)
    process.exit(1)
  }
  console.log('✅ CIP tables exist\n')

  // Insert all diagnoses
  console.log('2️⃣  Inserting diagnoses...')
  const { error: diagError } = await supabase
    .from('cip_diagnoses')
    .upsert(ALL_DIAGNOSES, { onConflict: 'id' })
  if (diagError) {
    console.error('❌ Error:', diagError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${ALL_DIAGNOSES.length} diagnoses\n`)

  // Insert all findings
  console.log('3️⃣  Inserting findings...')
  const { error: findError } = await supabase
    .from('cip_findings')
    .upsert(ALL_FINDINGS, { onConflict: 'id' })
  if (findError) {
    console.error('❌ Error:', findError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${ALL_FINDINGS.length} findings\n`)

  // Create puzzles
  console.log('4️⃣  Creating 10 puzzles across all difficulties...')

  const puzzles = [
    // MUITO FÁCIL #1
    {
      id: 'puzzle-muito-facil-01',
      title: 'Iniciante - Doenças Comuns',
      description: 'Puzzle introdutório com 3 diagnósticos muito comuns.',
      difficulty: 'muito_facil',
      diagnosis_ids: ['diag-has', 'diag-dda', 'diag-itu-gestante'],
      areas: ['clinica_medica', 'pediatria', 'ginecologia_obstetricia'],
      settings: { diagnosisCount: 3, sections: ['medical_history', 'physical_exam', 'treatment'], distractorCount: 2, allowReuse: false },
      time_limit_minutes: 15,
      type: 'practice',
      is_public: true,
    },

    // MUITO FÁCIL #2
    {
      id: 'puzzle-muito-facil-02',
      title: 'Básico - Clínica Geral',
      description: 'Condições básicas de clínica médica.',
      difficulty: 'muito_facil',
      diagnosis_ids: ['diag-dm2', 'diag-asma', 'diag-dda'],
      areas: ['clinica_medica', 'pediatria'],
      settings: { diagnosisCount: 3, sections: ['medical_history', 'physical_exam', 'treatment'], distractorCount: 2, allowReuse: false },
      time_limit_minutes: 15,
      type: 'practice',
      is_public: true,
    },

    // FÁCIL #1 (já existente, mas com ID diferente)
    {
      id: 'puzzle-facil-01',
      title: 'Prática - Mix de Especialidades',
      description: 'Puzzle com 4 diagnósticos de diferentes áreas.',
      difficulty: 'facil',
      diagnosis_ids: ['diag-dm2', 'diag-has', 'diag-pneumonia', 'diag-apendicite'],
      areas: ['clinica_medica', 'cirurgia'],
      settings: { diagnosisCount: 4, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 2, allowReuse: false },
      time_limit_minutes: 20,
      type: 'practice',
      is_public: true,
    },

    // FÁCIL #2
    {
      id: 'puzzle-facil-02',
      title: 'Clínica Médica Básica',
      description: 'Condições comuns de clínica médica.',
      difficulty: 'facil',
      diagnosis_ids: ['diag-pneumonia', 'diag-asma', 'diag-hipotireoidismo', 'diag-dm2'],
      areas: ['clinica_medica'],
      settings: { diagnosisCount: 4, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 2, allowReuse: false },
      time_limit_minutes: 20,
      type: 'practice',
      is_public: true,
    },

    // FÁCIL #3
    {
      id: 'puzzle-facil-03',
      title: 'Cirurgia e Pediatria',
      description: 'Mix de casos cirúrgicos e pediátricos.',
      difficulty: 'facil',
      diagnosis_ids: ['diag-apendicite', 'diag-bronquiolite', 'diag-colecistite', 'diag-dda'],
      areas: ['cirurgia', 'pediatria'],
      settings: { diagnosisCount: 4, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 2, allowReuse: false },
      time_limit_minutes: 25,
      type: 'practice',
      is_public: true,
    },

    // MÉDIO #1
    {
      id: 'puzzle-medio-01',
      title: 'Intermediário - Cardiopneumo',
      description: 'Condições cardíacas e pulmonares.',
      difficulty: 'medio',
      diagnosis_ids: ['diag-icc', 'diag-pneumonia', 'diag-dpoc', 'diag-iam', 'diag-asma'],
      areas: ['clinica_medica'],
      settings: { diagnosisCount: 5, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 3, allowReuse: false },
      time_limit_minutes: 30,
      type: 'practice',
      is_public: true,
    },

    // MÉDIO #2
    {
      id: 'puzzle-medio-02',
      title: 'Mix Clínico-Cirúrgico',
      description: 'Casos clínicos e cirúrgicos misturados.',
      difficulty: 'medio',
      diagnosis_ids: ['diag-has', 'diag-apendicite', 'diag-pneumonia', 'diag-colecistite', 'diag-dm2'],
      areas: ['clinica_medica', 'cirurgia'],
      settings: { diagnosisCount: 5, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 3, allowReuse: false },
      time_limit_minutes: 30,
      type: 'practice',
      is_public: true,
    },

    // MÉDIO #3
    {
      id: 'puzzle-medio-03',
      title: 'Todas as Áreas',
      description: 'Representação de todas as especialidades ENAMED.',
      difficulty: 'medio',
      diagnosis_ids: ['diag-iam', 'diag-hda', 'diag-bronquiolite', 'diag-pre-eclampsia', 'diag-dpoc'],
      areas: ['clinica_medica', 'cirurgia', 'pediatria', 'ginecologia_obstetricia'],
      settings: { diagnosisCount: 5, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 3, allowReuse: false },
      time_limit_minutes: 35,
      type: 'practice',
      is_public: true,
    },

    // DIFÍCIL #1
    {
      id: 'puzzle-dificil-01',
      title: 'Desafio Avançado - Urgências',
      description: 'Condições graves e urgentes.',
      difficulty: 'dificil',
      diagnosis_ids: ['diag-iam', 'diag-hda', 'diag-icc', 'diag-pre-eclampsia', 'diag-apendicite', 'diag-colecistite'],
      areas: ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia'],
      settings: { diagnosisCount: 6, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 3, allowReuse: true },
      time_limit_minutes: 40,
      type: 'practice',
      is_public: true,
    },

    // DIFÍCIL #2
    {
      id: 'puzzle-dificil-02',
      title: 'Master Mix - Todas as Áreas',
      description: 'Puzzle desafiador com alta complexidade.',
      difficulty: 'dificil',
      diagnosis_ids: ['diag-icc', 'diag-dpoc', 'diag-hipotireoidismo', 'diag-hda', 'diag-pre-eclampsia', 'diag-iam'],
      areas: ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia'],
      settings: { diagnosisCount: 6, sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'], distractorCount: 4, allowReuse: true },
      time_limit_minutes: 45,
      type: 'practice',
      is_public: true,
    },
  ]

  // Helper to get finding IDs for a diagnosis
  const getDiagnosisFindings = (diagId: string, section: string) => {
    const findingMap: Record<string, Record<string, string>> = {
      'diag-dm2': { medical_history: 'find-hist-polidipsia', physical_exam: 'find-exam-acantose', laboratory: 'find-lab-glicemia-alta', treatment: 'find-trat-metformina' },
      'diag-has': { medical_history: 'find-hist-cefaleia', physical_exam: 'find-exam-pa-elevada', laboratory: 'find-lab-creatinina', treatment: 'find-trat-ieca' },
      'diag-pneumonia': { medical_history: 'find-hist-febre-tosse', physical_exam: 'find-exam-crepitacoes', laboratory: 'find-lab-leucocitose', treatment: 'find-trat-antibiotico' },
      'diag-apendicite': { medical_history: 'find-hist-dor-fid', physical_exam: 'find-exam-blumberg', laboratory: 'find-lab-amilase', treatment: 'find-trat-apendicectomia' },
      'diag-icc': { medical_history: 'find-hist-dispneia-paroxistica', physical_exam: 'find-exam-turgencia', laboratory: 'find-lab-bnp', treatment: 'find-trat-furosemida' },
      'diag-iam': { medical_history: 'find-hist-dor-toracica', physical_exam: 'find-exam-sudorese', laboratory: 'find-lab-troponina', treatment: 'find-trat-iam' },
      'diag-dpoc': { medical_history: 'find-hist-tabagismo', physical_exam: 'find-exam-mv-diminuido', laboratory: 'find-lab-gasometria', treatment: 'find-trat-bd' },
      'diag-asma': { medical_history: 'find-hist-sibilancia', physical_exam: 'find-exam-sibilos', laboratory: 'find-lab-espirometria', treatment: 'find-trat-ci' },
      'diag-hipotireoidismo': { medical_history: 'find-hist-cansaco', physical_exam: 'find-exam-mixedema', laboratory: 'find-lab-tsh', treatment: 'find-trat-levotiroxina' },
      'diag-colecistite': { medical_history: 'find-hist-colica-biliar', physical_exam: 'find-exam-murphy', laboratory: 'find-lab-bilirrubinas', treatment: 'find-trat-colecistectomia' },
      'diag-hda': { medical_history: 'find-hist-melena', physical_exam: 'find-exam-palidez', laboratory: 'find-lab-hb-baixa', treatment: 'find-trat-eda' },
      'diag-bronquiolite': { medical_history: 'find-hist-lactente-coriza', physical_exam: 'find-exam-tiragem', laboratory: 'find-lab-sat-o2', treatment: 'find-trat-o2' },
      'diag-dda': { medical_history: 'find-hist-diarreia-crianca', physical_exam: 'find-exam-desidratacao', laboratory: 'find-lab-na-baixo', treatment: 'find-trat-sro' },
      'diag-pre-eclampsia': { medical_history: 'find-hist-gestante-pa', physical_exam: 'find-exam-edema-gest', laboratory: 'find-lab-proteinuria-gest', treatment: 'find-trat-sulfato-mg' },
      'diag-itu-gestante': { medical_history: 'find-hist-disuria-gest', physical_exam: 'find-exam-giordano', laboratory: 'find-lab-urocultura', treatment: 'find-trat-atb-gest' },
    }
    return findingMap[diagId]?.[section]
  }

  let totalGridCells = 0

  for (const puzzle of puzzles) {
    // Build options_per_section dynamically
    const sections = puzzle.settings.sections as string[]
    const optionsPerSection: Record<string, string[]> = {}

    for (const section of sections) {
      const findingIds: string[] = []
      for (const diagId of puzzle.diagnosis_ids) {
        const findingId = getDiagnosisFindings(diagId, section)
        if (findingId) findingIds.push(findingId)
      }
      optionsPerSection[section] = findingIds
    }

    const puzzleData = { ...puzzle, options_per_section: optionsPerSection }

    // Insert puzzle
    const { error: pErr } = await supabase.from('cip_puzzles').upsert([puzzleData], { onConflict: 'id' })
    if (pErr) {
      console.error(`❌ Error creating puzzle ${puzzle.id}:`, pErr.message)
      continue
    }

    // Create grid
    const grid = []
    for (let rowIdx = 0; rowIdx < puzzle.diagnosis_ids.length; rowIdx++) {
      const diagId = puzzle.diagnosis_ids[rowIdx]
      for (const section of sections) {
        const correctFindingId = getDiagnosisFindings(diagId, section)
        if (correctFindingId) {
          grid.push({
            puzzle_id: puzzle.id,
            row_index: rowIdx,
            section,
            correct_finding_id: correctFindingId,
          })
        }
      }
    }

    const { error: gErr } = await supabase.from('cip_puzzle_grid').upsert(grid, { onConflict: 'puzzle_id,row_index,section' })
    if (gErr) {
      console.error(`❌ Error creating grid for ${puzzle.id}:`, gErr.message)
      continue
    }

    totalGridCells += grid.length
    console.log(`   ✓ ${puzzle.title} (${puzzle.difficulty})`)
  }

  console.log(`\n✅ Created ${puzzles.length} puzzles with ${totalGridCells} total cells\n`)

  console.log('✨ FULL CIP setup complete!\n')
  console.log('📝 Summary:')
  console.log(`   • ${ALL_DIAGNOSES.length} diagnoses`)
  console.log(`   • ${ALL_FINDINGS.length} findings`)
  console.log(`   • ${puzzles.length} puzzles:`)
  console.log('     - 2x Muito Fácil')
  console.log('     - 3x Fácil')
  console.log('     - 3x Médio')
  console.log('     - 2x Difícil')
  console.log(`   • ${totalGridCells} grid cells\n`)
  console.log('🎮 Test at: /cip')
}

setupFullData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
