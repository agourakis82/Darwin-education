import { createClient } from '@supabase/supabase-js';
import { runMinimaxChat } from '../ai/minimax';
import { runConvergencePipeline } from './convergencePipeline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Single-question classification fallback (legacy, uses only Grok).
 * Kept for backward compatibility with individual question reclassification.
 */
export async function classifyQuestion(questionId: string) {
  const { data: question, error: fetchError } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (fetchError || !question) {
    console.error(`[Classifier] Error fetching question ${questionId}:`, fetchError);
    return;
  }

  if (question.status !== 'pending' && question.area !== 'unknown' && question.area !== null) {
    console.log(`[Classifier] Question ${questionId} is already classified.`);
    return;
  }

  const optionsText = (question.options as { letter: string; text: string }[])
    .map(o => `${o.letter}) ${o.text}`)
    .join('\n');

  const prompt = `
    Analyze the following multiple-choice medical question and classify it into exactly one of these 5 major areas:
    - clinica_medica (Internal Medicine)
    - cirurgia (Surgery)
    - ginecologia_obstetricia (OB/GYN)
    - pediatria (Pediatrics)
    - saude_coletiva (Public Health)

    Then, provide up to 3 specific subtopics or tags.

    Question Stem:
    ${question.stem}

    Options:
    ${optionsText}

    Return your response as a strictly valid JSON object with this structure:
    {
      "area": "one of the 5 allowed areas",
      "tags": ["tag1", "tag2", "tag3"]
    }
    Output ONLY JSON. Do not include markdown formatting or comments.
  `;

  try {
    const response = await runMinimaxChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      model: 'grok-4-1-fast-non-reasoning'
    });

    const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    const validAreas = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'];
    const finalArea = validAreas.includes(result.area) ? result.area : 'unknown';

    await supabase
      .from('ingested_questions')
      .update({
        area: finalArea,
        tags: Array.isArray(result.tags) ? result.tags : [],
      })
      .eq('id', questionId);

    console.log(`[Classifier] Classified ${questionId} as ${finalArea}.`);
  } catch (error) {
    console.error(`[Classifier] AI generation failed for ${questionId}:`, error);
  }
}

/**
 * Routine to classify all pending questions using the multi-LLM convergence pipeline.
 * Uses two providers in parallel for cross-validation + quality scoring.
 */
export async function runClassificationRoutine() {
  console.log('[Classifier] Starting multi-LLM convergence classification...');
  const stats = await runConvergencePipeline({
    batchSize: 50,
    concurrency: 3,
  });
  console.log('[Classifier] Pipeline complete:', JSON.stringify(stats, null, 2));
}
