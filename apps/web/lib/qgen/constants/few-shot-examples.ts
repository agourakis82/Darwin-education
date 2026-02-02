/**
 * QGen Few-Shot Examples
 * ======================
 *
 * Curated examples for LLM prompts organized by specialty and Bloom level
 */

import { BloomLevel } from '@darwin-education/shared';

/**
 * Example question structure for few-shot learning
 */
export interface FewShotExample {
  stem: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  area: string;
  topic: string;
  bloomLevel: BloomLevel;
  difficulty: number;
  questionType: string;
  distractorTypes: Record<string, string>;
  misconceptionsExplored?: string[];
}

/**
 * Few-shot examples by medical specialty
 */
export const FEW_SHOT_EXAMPLES_BY_AREA: Record<string, FewShotExample[]> = {
  clinica_medica: [
    {
      stem: `Homem, 62 anos, tabagista de 40 anos-maço, procura ambulatório com queixa de dispneia progressiva há 2 anos, atualmente aos médios esforços, e tosse produtiva matinal. Nega febre, hemoptise ou emagrecimento.

Exame físico: FR 22 irpm, SpO2 92% em ar ambiente. Tórax em tonel, MV diminuído globalmente, tempo expiratório prolongado, sibilos difusos.

Espirometria: VEF1/CVF = 0,58; VEF1 = 45% do previsto, sem resposta ao broncodilatador.

Qual a classificação da gravidade da doença deste paciente segundo GOLD?`,
      alternatives: {
        A: 'GOLD 1 - Leve',
        B: 'GOLD 2 - Moderada',
        C: 'GOLD 3 - Grave',
        D: 'GOLD 4 - Muito grave',
      },
      correctAnswer: 'C',
      explanation: `O paciente apresenta quadro clássico de DPOC (história, tabagismo, espirometria com padrão obstrutivo não-reversível). Pela classificação GOLD baseada no VEF1: GOLD 1 (≥80%), GOLD 2 (50-79%), GOLD 3 (30-49%), GOLD 4 (<30%). Com VEF1 de 45%, classifica-se como GOLD 3 (grave). Distrator A incorreto pois VEF1 muito baixo. Distrator B incorreto pois VEF1 <50%. Distrator D incorreto pois VEF1 >30%.`,
      area: 'clinica_medica',
      topic: 'Pneumologia',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'PLAUSIBLE_RELATED',
        B: 'PLAUSIBLE_RELATED',
        D: 'PLAUSIBLE_RELATED',
      },
    },
    {
      stem: `Mulher, 55 anos, hipertensa e diabética, procura emergência com dor torácica retroesternal em opressão, iniciada há 3 horas, irradiada para membro superior esquerdo, associada a náuseas e sudorese.

Exame físico: PA 150x90 mmHg, FC 92 bpm, FR 20 irpm. Ausculta cardíaca e pulmonar sem alterações.

ECG: Supradesnivelamento de ST de 3mm em V1-V4.

Qual a conduta imediata mais adequada?`,
      alternatives: {
        A: 'Solicitar troponina e aguardar resultado para definir conduta',
        B: 'Realizar angioplastia primária em até 90 minutos',
        C: 'Iniciar anticoagulação plena e aguardar vaga em UTI coronariana',
        D: 'Administrar trombolítico e transferir para hospital com hemodinâmica',
      },
      correctAnswer: 'B',
      explanation: `Paciente com IAM com supra de ST (IAMCSST) anterior extenso. A reperfusão é mandatória e a estratégia preferencial é a angioplastia primária (ICP) se disponível em até 90 minutos do primeiro contato médico. Aguardar troponina (A) atrasaria reperfusão. Anticoagulação plena sem reperfusão (C) é conduta insuficiente. Trombolítico (D) é alternativa quando ICP não disponível em tempo hábil.`,
      area: 'clinica_medica',
      topic: 'Cardiologia',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'INCOMPLETE',
        C: 'PARTIALLY_CORRECT',
        D: 'DIFFERENT_CONTEXT',
      },
      misconceptionsExplored: ['Confusão sobre timing de marcadores cardíacos'],
    },
    {
      stem: `Homem, 45 anos, etilista crônico, é trazido por familiares com quadro de confusão mental, ataxia e oftalmoparesia há 2 dias.

Qual a conduta inicial mais adequada?`,
      alternatives: {
        A: 'Glicose intravenosa',
        B: 'Tiamina intravenosa',
        C: 'Tomografia de crânio',
        D: 'Punção lombar',
      },
      correctAnswer: 'B',
      explanation: `A tríade de confusão mental, ataxia e oftalmoparesia em etilista é patognomônica de encefalopatia de Wernicke, causada por deficiência de tiamina (vitamina B1). A administração de glicose antes da tiamina pode precipitar ou agravar o quadro. A tiamina deve sempre preceder a glicose em pacientes com risco de deficiência.`,
      area: 'clinica_medica',
      topic: 'Neurologia',
      bloomLevel: BloomLevel.ANALYSIS,
      difficulty: 4,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'COMMON_MISCONCEPTION',
        C: 'PLAUSIBLE_RELATED',
        D: 'PLAUSIBLE_RELATED',
      },
      misconceptionsExplored: ['Ordem de administração glicose x tiamina'],
    },
  ],

  pediatria: [
    {
      stem: `Lactente de 6 meses, em aleitamento materno exclusivo, é trazido para consulta de puericultura. Mãe refere que a criança sustenta a cabeça, senta com apoio, transfere objetos entre as mãos e balbucia. Ao exame: peso e estatura no percentil 50, fontanela anterior normotensa 2x2cm.

Qual a orientação nutricional adequada para este momento?`,
      alternatives: {
        A: 'Manter aleitamento materno exclusivo até 1 ano de idade',
        B: 'Iniciar alimentação complementar mantendo aleitamento materno',
        C: 'Substituir leite materno por fórmula infantil de seguimento',
        D: 'Iniciar leite de vaca integral com engrossantes',
      },
      correctAnswer: 'B',
      explanation: `Aos 6 meses, deve-se iniciar alimentação complementar mantendo aleitamento materno até 2 anos ou mais (OMS/MS). A alternativa A está incorreta pois o AME deve ser até 6 meses, não 1 ano. A alternativa C está incorreta pois não há indicação de substituir leite materno. A alternativa D está incorreta pois leite de vaca integral só após 1 ano.`,
      area: 'pediatria',
      topic: 'Puericultura',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 2,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'COMMON_MISCONCEPTION',
        C: 'PLAUSIBLE_RELATED',
        D: 'OUTDATED',
      },
      misconceptionsExplored: ['Confusão entre duração de AME e duração total de AM'],
    },
    {
      stem: `Criança de 2 anos é trazida à UBS com quadro de diarreia aquosa há 3 dias, sem sangue ou muco, associada a vômitos e febre baixa. Ao exame: irritada, olhos encovados, sinal da prega presente, pulsos cheios.

Qual o grau de desidratação desta criança?`,
      alternatives: {
        A: 'Sem desidratação',
        B: 'Desidratação leve',
        C: 'Desidratação com algum grau',
        D: 'Desidratação grave',
      },
      correctAnswer: 'C',
      explanation: `A criança apresenta dois ou mais sinais de desidratação (olhos encovados, sinal da prega, irritabilidade), o que a classifica como "algum grau de desidratação" segundo a OMS/MS. Não é grave pois os pulsos estão cheios e bebe líquidos. O tratamento é o Plano B (TRO na unidade de saúde sob supervisão).`,
      area: 'pediatria',
      topic: 'Gastroenterologia',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 2,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'INVERTED',
        B: 'PLAUSIBLE_RELATED',
        D: 'PLAUSIBLE_RELATED',
      },
    },
    {
      stem: `Lactente de 4 meses, previamente hígido, é trazido com história de tosse coqueluchoide há 5 dias, que evoluiu para desconforto respiratório nas últimas 24 horas. Ao exame: FR 60 irpm, tiragem subcostal, ausculta com sibilos e crepitações difusos bilateralmente.

Qual o diagnóstico mais provável?`,
      alternatives: {
        A: 'Pneumonia bacteriana',
        B: 'Bronquiolite viral aguda',
        C: 'Asma aguda',
        D: 'Laringotraqueíte',
      },
      correctAnswer: 'B',
      explanation: `Lactente com pródromos de IVAS, seguido de desconforto respiratório com sibilos e crepitações é quadro típico de bronquiolite viral aguda (principalmente VSR). O pico de incidência é nos primeiros 6 meses. A pneumonia bacteriana (A) geralmente apresenta crepitações focais. Asma (C) é diagnóstico de exclusão em <2 anos. Laringotraqueíte (D) apresenta estridor e não sibilos.`,
      area: 'pediatria',
      topic: 'Pneumologia pediátrica',
      bloomLevel: BloomLevel.ANALYSIS,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'PLAUSIBLE_RELATED',
        C: 'COMMON_MISCONCEPTION',
        D: 'PLAUSIBLE_RELATED',
      },
      misconceptionsExplored: ['Confusão entre bronquiolite e asma em lactentes'],
    },
  ],

  ginecologia_obstetricia: [
    {
      stem: `Gestante, 28 anos, G2P1, idade gestacional de 32 semanas pela DUM compatível com USG de 1º trimestre, comparece à emergência obstétrica com queixa de sangramento vaginal vivo, indolor, de início súbito há 2 horas. Nega perda de líquido ou contrações.

Exame físico: PA 120x80 mmHg, FC 88 bpm. Abdome: útero compatível com IG, tônus normal. Especular: sangramento proveniente do canal cervical, colo fechado.

Qual a principal hipótese diagnóstica?`,
      alternatives: {
        A: 'Descolamento prematuro de placenta',
        B: 'Placenta prévia',
        C: 'Rotura uterina',
        D: 'Trabalho de parto prematuro',
      },
      correctAnswer: 'B',
      explanation: `O quadro é clássico de placenta prévia: sangramento vivo, indolor, súbito, no 3º trimestre, sem alteração do tônus uterino. O DPP (alternativa A) apresenta-se com dor, hipertonia uterina e frequentemente sangue escuro. A rotura uterina (C) cursa com dor intensa e sinais de choque. O TPP (D) apresenta contrações regulares. O sangramento indolor é o achado-chave para PP.`,
      area: 'ginecologia_obstetricia',
      topic: 'Hemorragias da gestação',
      bloomLevel: BloomLevel.ANALYSIS,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'COMMON_MISCONCEPTION',
        C: 'PLAUSIBLE_RELATED',
        D: 'PLAUSIBLE_RELATED',
      },
      misconceptionsExplored: ['Confusão DPP x PP pelo sangramento'],
    },
    {
      stem: `Gestante, 35 anos, primigesta, IG de 34 semanas, vem ao pré-natal com PA de 150x100 mmHg confirmada em duas medidas. Nega cefaleia, epigastralgia ou escotomas. Proteinúria de fita ++.

Qual o diagnóstico e a conduta mais adequada?`,
      alternatives: {
        A: 'Hipertensão gestacional; iniciar anti-hipertensivo e manter gestação',
        B: 'Pré-eclâmpsia; interrupção imediata da gestação',
        C: 'Pré-eclâmpsia; iniciar anti-hipertensivo, sulfato de magnésio e corticoide',
        D: 'Pré-eclâmpsia grave; interrupção após corticoterapia',
      },
      correctAnswer: 'C',
      explanation: `Gestante com hipertensão (≥140x90 mmHg) e proteinúria caracteriza pré-eclâmpsia. Sem sinais de gravidade (PA<160x110, sem sintomas, proteinúria <5g). Conduta: anti-hipertensivo para controle da PA, sulfato de magnésio para prevenção de convulsões, e corticoide para maturação pulmonar fetal (entre 24-34 semanas). Não há indicação de interrupção imediata na PE sem gravidade.`,
      area: 'ginecologia_obstetricia',
      topic: 'Síndromes hipertensivas',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 4,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'INCOMPLETE',
        B: 'COMMON_MISCONCEPTION',
        D: 'PARTIALLY_CORRECT',
      },
      misconceptionsExplored: ['Confusão sobre indicações de interrupção na PE'],
    },
  ],

  cirurgia: [
    {
      stem: `Homem, 35 anos, vítima de acidente automobilístico, é trazido ao PS com queixa de dor abdominal difusa. Ao exame: PA 90x60 mmHg, FC 120 bpm, abdome tenso, doloroso difusamente, com sinais de irritação peritoneal.

Qual a sequência correta de atendimento inicial?`,
      alternatives: {
        A: 'Tomografia de abdome → laparotomia se indicada',
        B: 'FAST → laparotomia se positivo e instabilidade',
        C: 'Laparotomia exploradora imediata',
        D: 'Paracentese diagnóstica → laparotomia se positiva',
      },
      correctAnswer: 'B',
      explanation: `No trauma abdominal com instabilidade hemodinâmica, a abordagem segue o ATLS. O FAST (Focused Assessment with Sonography for Trauma) é o exame de escolha para pacientes instáveis, pois é rápido e pode ser feito na sala de reanimação. Se positivo para líquido livre em paciente instável, indica laparotomia. TC (A) é para pacientes estáveis. Laparotomia imediata sem avaliação (C) não é padronizada. Paracentese (D) foi substituída pelo FAST.`,
      area: 'cirurgia',
      topic: 'Trauma',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'DIFFERENT_CONTEXT',
        C: 'PARTIALLY_CORRECT',
        D: 'OUTDATED',
      },
    },
    {
      stem: `Mulher, 45 anos, queixa de dor em hipocôndrio direito há 6 horas, iniciada após refeição gordurosa, associada a náuseas e vômitos. Ao exame: Murphy positivo, temperatura 38,2°C.

Hemograma: leucócitos 14.000/mm³ com desvio à esquerda.
USG: vesícula distendida, parede espessada (5mm), cálculo impactado no infundíbulo.

Qual o diagnóstico e a conduta?`,
      alternatives: {
        A: 'Colelitíase sintomática; colecistectomia eletiva',
        B: 'Colecistite aguda; colecistectomia em até 72 horas',
        C: 'Coledocolitíase; CPRE antes da cirurgia',
        D: 'Pancreatite biliar; jejum e analgesia',
      },
      correctAnswer: 'B',
      explanation: `Quadro clássico de colecistite aguda: dor em HCD, Murphy positivo, febre, leucocitose, vesícula distendida com parede espessada ao USG. O tratamento é colecistectomia precoce (idealmente em até 72h), pois reduz morbimortalidade em comparação com cirurgia tardia. Colelitíase sintomática (A) não apresenta sinais inflamatórios. Coledocolitíase (C) apresentaria icterícia e dilatação de vias biliares. Pancreatite (D) elevaria amilase/lipase.`,
      area: 'cirurgia',
      topic: 'Vias biliares',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 3,
      questionType: 'CLINICAL_CASE',
      distractorTypes: {
        A: 'INCOMPLETE',
        C: 'PLAUSIBLE_RELATED',
        D: 'PLAUSIBLE_RELATED',
      },
    },
  ],

  saude_coletiva: [
    {
      stem: `Em um estudo de coorte sobre tabagismo e câncer de pulmão, foram acompanhados 10.000 fumantes e 10.000 não-fumantes por 10 anos. Ao final, observou-se:
- Fumantes: 200 casos de câncer de pulmão
- Não-fumantes: 20 casos de câncer de pulmão

Qual o risco relativo (RR) de câncer de pulmão associado ao tabagismo?`,
      alternatives: {
        A: '2',
        B: '5',
        C: '10',
        D: '20',
      },
      correctAnswer: 'C',
      explanation: `O risco relativo é calculado pela razão entre a incidência nos expostos e a incidência nos não-expostos. Incidência em fumantes = 200/10.000 = 0,02 (2%). Incidência em não-fumantes = 20/10.000 = 0,002 (0,2%). RR = 0,02/0,002 = 10. Isso significa que fumantes têm 10 vezes mais risco de desenvolver câncer de pulmão que não-fumantes.`,
      area: 'saude_coletiva',
      topic: 'Epidemiologia',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 3,
      questionType: 'CALCULATION',
      distractorTypes: {
        A: 'COMMON_MISCONCEPTION',
        B: 'COMMON_MISCONCEPTION',
        D: 'COMMON_MISCONCEPTION',
      },
      misconceptionsExplored: ['Erros de cálculo de medidas de associação'],
    },
    {
      stem: `A Unidade Básica de Saúde "Jardim das Flores" é responsável por uma população de 12.000 habitantes. No último ano, foram registrados 240 nascidos vivos e 3 óbitos em menores de 1 ano.

Qual a taxa de mortalidade infantil desta área?`,
      alternatives: {
        A: '1,25 por 1.000 habitantes',
        B: '12,5 por 1.000 nascidos vivos',
        C: '25 por 1.000 nascidos vivos',
        D: '0,25 por 1.000 habitantes',
      },
      correctAnswer: 'B',
      explanation: `A taxa de mortalidade infantil é calculada pela razão entre óbitos em menores de 1 ano e nascidos vivos, multiplicada por 1.000. TMI = (3/240) x 1.000 = 12,5 por 1.000 NV. O denominador é sempre nascidos vivos, não habitantes. A taxa de 12,5 está acima da meta da OMS (<12/1.000 NV), indicando necessidade de ações.`,
      area: 'saude_coletiva',
      topic: 'Indicadores de saúde',
      bloomLevel: BloomLevel.APPLICATION,
      difficulty: 2,
      questionType: 'CALCULATION',
      distractorTypes: {
        A: 'COMMON_MISCONCEPTION',
        C: 'COMMON_MISCONCEPTION',
        D: 'COMMON_MISCONCEPTION',
      },
      misconceptionsExplored: ['Confusão sobre denominador em indicadores de saúde'],
    },
    {
      stem: `Um paciente de 50 anos, diabético e hipertenso, vai à UBS para consulta de rotina. Segundo os princípios do SUS, qual característica do sistema garante que ele seja atendido pela mesma equipe de saúde da família que o acompanha?`,
      alternatives: {
        A: 'Universalidade',
        B: 'Integralidade',
        C: 'Equidade',
        D: 'Longitudinalidade',
      },
      correctAnswer: 'D',
      explanation: `A longitudinalidade refere-se ao acompanhamento do paciente ao longo do tempo pela mesma equipe de saúde, estabelecendo vínculo. Universalidade (A) é o acesso a todos. Integralidade (B) é o cuidado completo (prevenção, tratamento, reabilitação). Equidade (C) é tratar desiguais de forma desigual, priorizando quem mais precisa.`,
      area: 'saude_coletiva',
      topic: 'Princípios do SUS',
      bloomLevel: BloomLevel.COMPREHENSION,
      difficulty: 2,
      questionType: 'CONCEPTUAL',
      distractorTypes: {
        A: 'PLAUSIBLE_RELATED',
        B: 'PLAUSIBLE_RELATED',
        C: 'PLAUSIBLE_RELATED',
      },
    },
  ],
};

/**
 * Get few-shot examples for a specific area and optional Bloom level
 */
export function getFewShotExamples(
  area: string,
  bloomLevel?: BloomLevel,
  count: number = 2
): FewShotExample[] {
  const normalizedArea = area.toLowerCase().replace(/[\s-]/g, '_');
  const areaExamples = FEW_SHOT_EXAMPLES_BY_AREA[normalizedArea] || [];

  if (bloomLevel) {
    const filtered = areaExamples.filter(e => e.bloomLevel === bloomLevel);
    return filtered.slice(0, count);
  }

  return areaExamples.slice(0, count);
}

/**
 * Format few-shot examples as prompt text
 */
export function formatFewShotExamples(examples: FewShotExample[]): string {
  return examples.map((ex, index) => {
    const altText = Object.entries(ex.alternatives)
      .map(([letter, text]) => `${letter}) ${text}`)
      .join('\n');

    return `
### EXEMPLO ${index + 1}: ${ex.area.toUpperCase()} (${ex.topic})

**Questão:**
${ex.stem}

${altText}

**Gabarito:** ${ex.correctAnswer}

**Comentário:** ${ex.explanation}

**Tipo:** ${ex.questionType}
**Bloom:** ${ex.bloomLevel}
**Dificuldade:** ${ex.difficulty}/5
${ex.misconceptionsExplored ? `**Misconceptions exploradas:** ${ex.misconceptionsExplored.join(', ')}` : ''}
`;
  }).join('\n---\n');
}

/**
 * Get formatted few-shot prompt for an area
 */
export function getFewShotPromptForArea(
  area: string,
  bloomLevel?: BloomLevel,
  count: number = 2
): string {
  const examples = getFewShotExamples(area, bloomLevel, count);
  if (examples.length === 0) {
    return '';
  }
  return formatFewShotExamples(examples);
}
