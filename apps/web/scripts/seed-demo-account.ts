/**
 * seed-demo-account.ts
 *
 * Creates a demo account with pre-populated data for evaluation purposes.
 * Run: cd apps/web && npx tsx scripts/seed-demo-account.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local FIRST
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ─── Config ────────────────────────────────────────
const DEMO_EMAIL = 'demo@darwin.education';
const DEMO_PASSWORD = 'DarwinDemo2026!';
const DEMO_NAME = 'Maria Avaliadora (Demo)';

// ─── ENAMED areas ──────────────────────────────────
const AREAS = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
] as const;

const AREA_LABELS: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
};

// ─── System flashcard deck IDs ─────────────────────
const SYSTEM_DECK_IDS = [
  'a0000001-0000-0000-0000-000000000001', // Clínica Médica
  'a0000001-0000-0000-0000-000000000002', // Cirurgia
  'a0000001-0000-0000-0000-000000000003', // Ginecologia e Obstetrícia
];

// ─── CDM cognitive attribute IDs ───────────────────
const CDM_ATTRIBUTES = [
  'data_gathering',
  'diagnostic_reasoning',
  'clinical_judgment',
  'therapeutic_decision',
  'preventive_medicine',
  'emergency_management',
];

// ─── Helpers ───────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Main ──────────────────────────────────────────
async function main() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('🌱 Darwin Education — Demo Account Seeder\n');

  // ─── Step 1: Create or find demo user ────────────
  console.log('1. Creating demo user...');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`   User already exists: ${userId}`);

    // Clean up old demo data
    console.log('   Cleaning old demo data...');
    await supabase.from('exam_attempts').delete().eq('user_id', userId);
    await supabase.from('study_activity').delete().eq('user_id', userId);
    await supabase.from('flashcard_sm2_states').delete().eq('user_id', userId);
    await supabase.from('cdm_snapshots').delete().eq('user_id', userId);
    await supabase.from('user_path_progress').delete().eq('user_id', userId);
    await supabase.from('learner_model_snapshots').delete().eq('user_id', userId);
    // Clean up demo-created exams
    await supabase.from('exams').delete().eq('created_by', userId);
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });

    if (authError || !authData.user) {
      console.error('Failed to create user:', authError?.message);
      process.exit(1);
    }

    userId = authData.user.id;
    console.log(`   Created user: ${userId}`);
  }

  // ─── Step 2: Update profile ──────────────────────
  console.log('2. Updating profile...');
  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: DEMO_EMAIL,
      full_name: DEMO_NAME,
      xp: 4250,
      level: 8,
      streak_days: 12,
      last_activity_at: new Date().toISOString(),
      subscription_tier: 'free',
      ai_credits_remaining: 5,
    })
    .eq('id', userId);

  // ─── Step 3: Get real questions from DB ──────────
  console.log('3. Fetching questions from database...');
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, area, irt_difficulty, correct_index')
    .limit(200);

  if (qErr || !questions || questions.length < 20) {
    console.error('Not enough questions in DB:', qErr?.message ?? `found ${questions?.length ?? 0}`);
    process.exit(1);
  }

  console.log(`   Found ${questions.length} questions`);

  // Group questions by area
  const questionsByArea: Record<string, typeof questions> = {};
  for (const q of questions) {
    const area = q.area || 'clinica_medica';
    if (!questionsByArea[area]) questionsByArea[area] = [];
    questionsByArea[area].push(q);
  }

  // ─── Step 4: Create exams and attempts ───────────
  console.log('4. Creating exam attempts (12 with improving scores)...');

  // Improvement trajectory over 30 days
  const attemptConfigs = [
    { daysAgo: 30, theta: -0.5, scaledScore: 450, correctRate: 0.35 },
    { daysAgo: 27, theta: -0.2, scaledScore: 480, correctRate: 0.40 },
    { daysAgo: 24, theta: 0.0, scaledScore: 500, correctRate: 0.45 },
    { daysAgo: 21, theta: 0.1, scaledScore: 510, correctRate: 0.47 },
    { daysAgo: 18, theta: 0.3, scaledScore: 530, correctRate: 0.50 },
    { daysAgo: 16, theta: 0.4, scaledScore: 540, correctRate: 0.52 },
    { daysAgo: 13, theta: 0.5, scaledScore: 550, correctRate: 0.55 },
    { daysAgo: 10, theta: 0.6, scaledScore: 560, correctRate: 0.58 },
    { daysAgo: 8, theta: 0.7, scaledScore: 570, correctRate: 0.60 },
    { daysAgo: 5, theta: 0.8, scaledScore: 580, correctRate: 0.63 },
    { daysAgo: 3, theta: 0.9, scaledScore: 590, correctRate: 0.65 },
    { daysAgo: 1, theta: 1.0, scaledScore: 600, correctRate: 0.68 },
  ];

  for (const config of attemptConfigs) {
    // Pick 40 random questions for each exam
    const examQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 40);
    const questionIds = examQuestions.map((q) => q.id);

    // Create exam
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .insert({
        title: `Simulado Demo — ${daysAgo(config.daysAgo).toLocaleDateString('pt-BR')}`,
        question_count: 40,
        time_limit_minutes: 120,
        question_ids: questionIds,
        type: 'practice',
        created_by: userId,
        is_public: false,
      })
      .select('id')
      .single();

    if (examErr || !exam) {
      console.error(`   Failed to create exam:`, examErr?.message);
      continue;
    }

    // Generate answers based on correctRate
    const answers: Record<string, number> = {};
    let correctCount = 0;
    const areaCorrect: Record<string, number> = {};
    const areaTotal: Record<string, number> = {};

    for (const q of examQuestions) {
      const isCorrect = Math.random() < config.correctRate;
      const area = q.area || 'clinica_medica';

      if (!areaTotal[area]) areaTotal[area] = 0;
      if (!areaCorrect[area]) areaCorrect[area] = 0;
      areaTotal[area]++;

      if (isCorrect) {
        answers[q.id] = q.correct_index;
        correctCount++;
        areaCorrect[area]++;
      } else {
        // Pick a wrong answer
        const wrongIndex = (q.correct_index + 1 + Math.floor(Math.random() * 3)) % 4;
        answers[q.id] = wrongIndex;
      }
    }

    // Build area breakdown
    const areaBreakdown: Record<string, { correct: number; total: number; score: number }> = {};
    for (const area of AREAS) {
      const total = areaTotal[area] || 0;
      const correct = areaCorrect[area] || 0;
      if (total > 0) {
        areaBreakdown[area] = { correct, total, score: Math.round((correct / total) * 100) };
      }
    }

    const startedAt = daysAgo(config.daysAgo);
    const totalTime = randomBetween(4800, 7200); // 80-120 min

    await supabase.from('exam_attempts').insert({
      exam_id: exam.id,
      user_id: userId,
      answers,
      total_time_seconds: totalTime,
      theta: config.theta,
      standard_error: 0.3 - config.daysAgo * 0.005,
      scaled_score: config.scaledScore,
      passed: config.scaledScore >= 600,
      correct_count: correctCount,
      area_breakdown: areaBreakdown,
      started_at: startedAt.toISOString(),
      completed_at: new Date(startedAt.getTime() + totalTime * 1000).toISOString(),
    });
  }

  console.log('   Created 12 exam attempts');

  // ─── Step 5: Create flashcard SM2 states ─────────
  console.log('5. Setting up flashcard review states...');

  let totalCards = 0;
  for (const deckId of SYSTEM_DECK_IDS) {
    // Get cards from system decks
    const { data: cards } = await supabase
      .from('flashcards')
      .select('id')
      .eq('deck_id', deckId)
      .limit(20);

    if (!cards || cards.length === 0) continue;

    const sm2States = cards.map((card, i) => {
      // Varied review states: some new, some learning, some mature
      const phase = i % 3;
      const now = new Date();

      if (phase === 0) {
        // New / just started
        return {
          user_id: userId,
          card_id: card.id,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          next_review_at: now.toISOString(),
        };
      } else if (phase === 1) {
        // Learning (interval 1-6 days)
        const interval = randomBetween(1, 6);
        const nextReview = new Date(now.getTime() + interval * 86400000);
        return {
          user_id: userId,
          card_id: card.id,
          ease_factor: 2.3 + Math.random() * 0.4,
          interval_days: interval,
          repetitions: randomBetween(1, 3),
          next_review_at: nextReview.toISOString(),
          last_review_at: daysAgo(randomBetween(1, 3)).toISOString(),
        };
      } else {
        // Mature (interval 15+ days)
        const interval = randomBetween(15, 45);
        const dueIn = randomBetween(-3, 10); // Some overdue, some upcoming
        const nextReview = new Date(now.getTime() + dueIn * 86400000);
        return {
          user_id: userId,
          card_id: card.id,
          ease_factor: 2.5 + Math.random() * 0.5,
          interval_days: interval,
          repetitions: randomBetween(4, 10),
          next_review_at: nextReview.toISOString(),
          last_review_at: daysAgo(randomBetween(5, 15)).toISOString(),
        };
      }
    });

    const { error: sm2Err } = await supabase.from('flashcard_sm2_states').insert(sm2States);
    if (sm2Err) {
      console.error(`   SM2 insert error for deck ${deckId}:`, sm2Err.message);
    } else {
      totalCards += sm2States.length;
    }
  }

  console.log(`   Created ${totalCards} flashcard review states across 3 decks`);

  // ─── Step 6: Create study activity ───────────────
  console.log('6. Creating 30 days of study activity...');

  const activityRows = [];
  for (let i = 0; i < 30; i++) {
    // 20+ active days out of 30
    const isActive = i < 22 || Math.random() > 0.3;
    if (!isActive) continue;

    const date = daysAgo(i);
    const dateStr = date.toISOString().split('T')[0];

    activityRows.push({
      user_id: userId,
      activity_date: dateStr,
      exams_completed: i % 3 === 0 ? 1 : 0,
      flashcards_reviewed: randomBetween(5, 40),
      questions_answered: randomBetween(10, 50),
      time_spent_seconds: randomBetween(1800, 7200), // 30min-2hr
    });
  }

  const { error: actErr } = await supabase.from('study_activity').insert(activityRows);
  if (actErr) {
    console.error('   Activity insert error:', actErr.message);
  } else {
    console.log(`   Created ${activityRows.length} activity days`);
  }

  // ─── Step 7: Create CDM snapshot ─────────────────
  console.log('7. Creating CDM cognitive diagnostic snapshot...');

  // Realistic attribute mastery — some strong, some weak
  const eapEstimate = [0.85, 0.72, 0.68, 0.55, 0.78, 0.42];
  const mapEstimate = [true, true, true, false, true, false];
  const masteredAttrs = CDM_ATTRIBUTES.filter((_, i) => mapEstimate[i]);
  const unmasteredAttrs = CDM_ATTRIBUTES.filter((_, i) => !mapEstimate[i]);

  // Generate posterior probabilities for 64 classes
  const posteriorProbs = Array.from({ length: 64 }, () => Math.random());
  const sum = posteriorProbs.reduce((a, b) => a + b, 0);
  const normalizedProbs = posteriorProbs.map((p) => p / sum);

  // Set highest probability for the correct latent class
  const latentClass = mapEstimate.reduce((acc, m, i) => acc + (m ? 1 << i : 0), 0);
  normalizedProbs[latentClass] = 0.35;
  const reSum = normalizedProbs.reduce((a, b) => a + b, 0);
  const finalProbs = normalizedProbs.map((p) => p / reSum);

  const { error: cdmErr } = await supabase.from('cdm_snapshots').insert({
    user_id: userId,
    latent_class: latentClass,
    eap_estimate: eapEstimate,
    map_estimate: mapEstimate,
    posterior_probabilities: finalProbs,
    posterior_entropy: 2.1,
    model_type: 'dina',
    mastered_attributes: masteredAttrs,
    unmastered_attributes: unmasteredAttrs,
    classification_confidence: 0.78,
    items_used: 45,
  });

  if (cdmErr) {
    console.error('   CDM insert error:', cdmErr.message);
  } else {
    console.log('   Created CDM snapshot (4/6 attributes mastered)');
  }

  // ─── Step 8: Create study path progress ──────────
  console.log('8. Creating study path progress...');

  const { data: paths } = await supabase
    .from('study_paths')
    .select('id, title')
    .eq('is_public', true)
    .limit(3);

  if (paths && paths.length > 0) {
    for (let i = 0; i < Math.min(paths.length, 3); i++) {
      const path = paths[i];

      // Get modules for this path
      const { data: modules } = await supabase
        .from('study_modules')
        .select('id')
        .eq('path_id', path.id)
        .order('order_index', { ascending: true });

      if (!modules || modules.length === 0) continue;

      // Complete different portions: 80%, 40%, 10%
      const completionRates = [0.8, 0.4, 0.1];
      const rate = completionRates[i] || 0.1;
      const completedCount = Math.max(1, Math.floor(modules.length * rate));
      const completedModules = modules.slice(0, completedCount).map((m) => m.id);
      const currentModule = modules[completedCount] || modules[completedCount - 1];

      await supabase.from('user_path_progress').insert({
        user_id: userId,
        path_id: path.id,
        completed_modules: completedModules,
        current_module_id: currentModule?.id,
        started_at: daysAgo(25 - i * 5).toISOString(),
        completed_at: rate >= 1.0 ? new Date().toISOString() : null,
      });

      console.log(`   Path "${path.title}": ${Math.round(rate * 100)}% complete`);
    }
  } else {
    console.log('   No public study paths found — skipping');
  }

  // ─── Step 9: Create learner model snapshot ───────
  console.log('9. Creating learner model snapshot...');

  const areaCompetency: Record<string, number> = {};
  for (const area of AREAS) {
    areaCompetency[area] = 0.4 + Math.random() * 0.4;
  }

  await supabase.from('learner_model_snapshots').insert({
    user_id: userId,
    irt_theta: 1.0,
    irt_se: 0.25,
    bkt_overall_mastery: 0.62,
    overall_competency: 0.58,
    pass_probability: 0.55,
    area_competency: areaCompetency,
    strengths: [
      { attribute: 'clinica_medica', score: 0.78 },
      { attribute: 'saude_coletiva', score: 0.72 },
    ],
    weaknesses: [
      { attribute: 'cirurgia', score: 0.42 },
      { attribute: 'ginecologia_obstetricia', score: 0.48 },
    ],
    recommendations: [
      { action: 'Revisar questões de Cirurgia', priority: 'high' },
      { action: 'Completar trilha de Ginecologia', priority: 'medium' },
      { action: 'Praticar flashcards de Pediatria', priority: 'medium' },
    ],
    engagement_score: 0.75,
    study_streak: 12,
    weekly_hours: 14.5,
  });

  console.log('   Created learner model snapshot');

  // ─── Done ────────────────────────────────────────
  console.log('\n✅ Demo account ready!\n');
  console.log('   ┌─────────────────────────────────────────┐');
  console.log(`   │  Email:    ${DEMO_EMAIL.padEnd(28)}│`);
  console.log(`   │  Password: ${DEMO_PASSWORD.padEnd(28)}│`);
  console.log('   └─────────────────────────────────────────┘');
  console.log('');
  console.log('   Seeded:');
  console.log('     12 exam attempts (theta: -0.5 → 1.0, scores: 450 → 600)');
  console.log(`     ${totalCards} flashcard review states across 3 decks`);
  console.log(`     ${activityRows.length} days of study activity (streak: 12)`);
  console.log('     1 CDM snapshot (4/6 attributes mastered)');
  console.log(`     ${paths?.length ?? 0} study path enrollments`);
  console.log('     1 learner model snapshot');
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
