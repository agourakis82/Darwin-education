import type { MinimaxMessage } from '../minimax-client'

export interface CaseStudyInput {
  area: string
  topic?: string
  difficulty?: string
}

const AREA_LABELS_PT: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const DIFFICULTY_LABELS_PT: Record<string, string> = {
  facil: 'fácil',
  medio: 'médio',
  dificil: 'difícil',
}

export function buildCaseStudyMessages(input: CaseStudyInput): MinimaxMessage[] {
  const areaLabel = AREA_LABELS_PT[input.area] ?? input.area
  const dificuldade = DIFFICULTY_LABELS_PT[input.difficulty ?? 'medio'] ?? 'médio'
  const topico = input.topic ? `Tópico específico: ${input.topic}.` : ''

  return [
    {
      role: 'system',
      content:
        'Você é um simulador de casos clínicos para o ENAMED (Exame Nacional de Avaliação da Formação Médica). ' +
        'Responda EXCLUSIVAMENTE com JSON válido, sem markdown, sem texto fora do JSON, em português do Brasil.',
    },
    {
      role: 'user',
      content: [
        `Área: ${areaLabel}.`,
        `Dificuldade: ${dificuldade}.`,
        topico,
        'Crie um caso clínico breve com anamnese, exame físico e exames complementares relevantes.',
        'Em seguida, formule UMA pergunta de múltipla escolha com exatamente 4 alternativas (A, B, C, D) sobre o diagnóstico ou conduta do caso.',
        'Retorne SOMENTE um objeto JSON com as seguintes chaves:',
        '"caso": string com o texto do caso clínico,',
        '"pergunta": string com o enunciado da questão,',
        '"alternativas": array de 4 strings no formato ["A. texto", "B. texto", "C. texto", "D. texto"],',
        '"resposta_correta": número inteiro (0=A, 1=B, 2=C, 3=D) indicando a alternativa correta,',
        '"explicacao": string com justificativa detalhada da resposta correta,',
        '"sinais_alerta": array de strings curtas com sinais de gravidade ou alarme do caso,',
        '"proximos_passos": array de strings curtas com as condutas prioritárias.',
      ]
        .filter(Boolean)
        .join(' '),
    },
  ]
}
