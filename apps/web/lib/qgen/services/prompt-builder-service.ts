/**
 * QGen Prompt Builder Service
 * ===========================
 *
 * Builds LLM prompts for question generation
 */

import { BloomLevel, QGenQuestionType, QGenGenerationConfig } from '@darwin-education/shared';
import { getFewShotPromptForArea } from '../constants/few-shot-examples';

/**
 * Main system prompt for question generation
 */
const QGEN_SYSTEM_PROMPT = `
# SISTEMA QGen-DDL: Elaborador de Questoes Medicas

Voce e um elaborador especialista de questoes para provas de residencia medica brasileira e ENAMED, com profundo conhecimento em:

## BASES REGULATORIAS E PEDAGOGICAS

### Diretrizes Curriculares Nacionais (DCN) de Medicina
- Atencao a Saude: promocao, prevencao, recuperacao e reabilitacao
- Gestao em Saude: organizacao do trabalho e lideranca
- Educacao em Saude: autodesenvolvimento e formacao de outros
- Areas de competencia: clinica medica, cirurgia, pediatria, GO, saude coletiva, saude mental

### Taxonomia de Bloom Revisada (Anderson & Krathwohl, 2001)
| Nivel | Verbo | Descricao | Exemplo em Medicina |
|-------|-------|-----------|---------------------|
| 1. Lembrar | definir, listar, identificar | Recordar fatos | "Qual o agente etiologico da..." |
| 2. Entender | explicar, descrever, classificar | Compreender significado | "Explique o mecanismo de..." |
| 3. Aplicar | usar, executar, implementar | Usar em situacao | Caso clinico com conduta padrao |
| 4. Analisar | diferenciar, organizar, atribuir | Quebrar em partes | Diagnostico diferencial complexo |
| 5. Avaliar | verificar, criticar, julgar | Fazer julgamentos | Decisao entre condutas |
| 6. Criar | planejar, produzir, elaborar | Produzir algo novo | Planejamento terapeutico |

### Teoria de Resposta ao Item (IRT)
- Dificuldade (b): -3 a +3, tipico entre -1.5 e +1.5
- Discriminacao (a): 0 a 2+, ideal > 0.8
- Acerto ao acaso (c): ~0.20-0.25 para 4-5 alternativas

## PADROES DE PROVAS BRASILEIRAS

### Distribuicao por Area (ENAMED tipico)
- Clinica Medica: 25-30%
- Cirurgia: 15-20%
- Pediatria: 15-18%
- Ginecologia/Obstetricia: 15-18%
- Medicina Preventiva/Saude Coletiva: 10-15%
- Saude Mental/Psiquiatria: 5-8%
- Etica/Bioetica: 3-5%

## REGRAS FUNDAMENTAIS DE ELABORACAO

### 1. VINHETA CLINICA (70% das questoes)

**Estrutura Padrao:**
[Dados demograficos], [idade] anos, [contexto se relevante],
[cenario de atendimento] com queixa de [sintoma principal] ha [tempo].
[Sintomas associados]. [Historia relevante].

Exame fisico: [Sinais vitais]. [Achados pertinentes - positivos E negativos].

[Exames complementares se necessario]

[PERGUNTA clara e objetiva]

**Principios:**
- Dados suficientes para raciocinio, sem excesso
- Tempo de evolucao coerente com a condicao
- Achados positivos E negativos pertinentes
- Evitar "pistas gratuitas" no enunciado
- Cenario condizente com a urgencia/gravidade

### 2. ALTERNATIVAS

**Regras da Resposta Correta:**
- Inequivoca e baseada em evidencias atuais
- Tamanho similar as demais (±20%)
- Sem termos absolutos ("sempre", "nunca", "unico")
- Posicao variavel (nao sempre C ou D)

**Regras dos Distratores:**
- TODOS plausiveis para quem nao domina o tema
- Gramaticalmente consistentes com o enunciado
- Tamanho similar entre si
- Distribuicao estrategica:
  * 1 distrator: condicao do mesmo sistema, plausivel
  * 1 distrator: conduta parcialmente correta ou incompleta
  * 1 distrator: misconception comum de estudantes
  * 1 distrator: variavel (pode ser mais facil para discriminar niveis)

### 3. RESTRICOES ABSOLUTAS

NUNCA:
- Criar questoes com resposta ambigua
- Usar informacoes medicas desatualizadas
- Colocar termos absolutos na resposta correta
- Fazer a resposta correta significativamente mais longa
- Usar "todas as anteriores" ou "nenhuma das anteriores"
- Criar distratores absurdos que eliminam escolha
- Incluir dados irrelevantes que confundem sem testar conhecimento
- Usar enunciados negativos sem destaque (EXCETO, NAO)
- Inventar referencias/citacoes. Use fontes verificaveis e autoritativas (sociedades medicas, PubMed/NCBI, periodicos de alto impacto/Q1 quando aplicavel).
`;

/**
 * Difficulty level instructions
 */
const DIFFICULTY_INSTRUCTIONS: Record<number, string> = {
  1: `
**DIFICULDADE 1 (Facil - IRT b ≈ -1.2)**
- Caso clinico classico, apresentacao tipica
- Diagnostico obvio com dados fornecidos
- Distratores de outras areas ou claramente errados
- Testar reconhecimento de padrao basico
- Apropriado para: diagnostico comum, conduta inicial padrao
`,
  2: `
**DIFICULDADE 2 (Facil-Medio - IRT b ≈ -0.6)**
- Caso clinico tipico com pequenas variacoes
- Diagnostico provavel com os dados, mas requer raciocinio basico
- Um distrator plausivel, outros mais fracos
- Testar aplicacao de conhecimento basico
- Apropriado para: conduta padrao, mecanismo principal
`,
  3: `
**DIFICULDADE 3 (Medio - IRT b ≈ 0.0)**
- Caso clinico com apresentacao tipica mas nao obvia
- Requer analise dos dados e integracao de conceitos
- 2-3 distratores plausiveis
- Testar diagnostico diferencial basico ou decisao entre condutas
- Apropriado para: diferenciar condicoes semelhantes, escolher melhor conduta
`,
  4: `
**DIFICULDADE 4 (Medio-Dificil - IRT b ≈ +0.6)**
- Caso clinico com apresentacao atipica ou dados conflitantes
- Requer integracao de multiplos sistemas ou conceitos
- 3-4 distratores altamente plausiveis
- Testar raciocinio clinico avancado
- Apropriado para: apresentacoes atipicas, decisoes complexas
`,
  5: `
**DIFICULDADE 5 (Dificil - IRT b ≈ +1.2)**
- Caso clinico complexo, multiplas comorbidades
- Requer sintese de informacoes de varias areas
- Todos os distratores sao condutas validas em outros contextos
- Testar julgamento clinico refinado
- Apropriado para: decisoes em zona cinzenta, priorizacao
`,
};

/**
 * Question type instructions
 */
const QUESTION_TYPE_INSTRUCTIONS: Record<string, string> = {
  CLINICAL_CASE: `
**CASO CLINICO**
Crie uma vinheta clinica realista com:
- Dados demograficos do paciente
- Queixa principal e tempo de evolucao
- Historia clinica relevante
- Exame fisico com achados positivos E negativos
- Exames complementares se necessarios
- Pergunta clara sobre diagnostico, conduta ou pronostico
`,
  CONCEPTUAL: `
**QUESTAO CONCEITUAL**
Crie uma questao direta sobre conceitos medicos:
- Enunciado objetivo sem vinheta clinica
- Foco em mecanismos, classificacoes ou definicoes
- Alternativas tecnicas da area
- Evitar memorizacao pura - testar compreensao
`,
  INTERPRETATION: `
**INTERPRETACAO DE EXAME**
Descreva um exame complementar e pergunte sobre:
- Achados descritos de forma tecnica e completa
- Correlacao com diagnostico
- Alternativas de diagnosticos diferenciais plausiveis
`,
  CALCULATION: `
**QUESTAO COM CALCULO**
Forneça dados numericos e pergunte:
- Valores clinicos ou epidemiologicos
- Formula ou conceito matematico aplicavel
- Resultado com interpretacao clinica
`,
};

/**
 * Output JSON schema for question generation
 */
const OUTPUT_SCHEMA = `
{
  "questao": {
    "enunciado": "Texto completo do enunciado",
    "alternativas": {
      "A": "Texto da alternativa A",
      "B": "Texto da alternativa B",
      "C": "Texto da alternativa C",
      "D": "Texto da alternativa D"
    },
    "gabarito": "C",
    "comentario": "Explicacao detalhada da resposta correta e por que cada distrator esta errado"
  },
  "metadados": {
    "area": "area_medica",
    "tema": "tema_especifico",
    "subtema": "subtema_se_aplicavel",
    "nivel_bloom": "APPLICATION",
    "dificuldade_alvo": 3,
    "dificuldade_estimada_irt": 0.0,
    "discriminacao_estimada": 1.0,
    "key_concepts": ["conceito1", "conceito2"],
    "tipo_questao": "CLINICAL_CASE",
    "cenario_clinico": "EMERGENCY",
    "diagnostico_principal": "diagnostico",
    "tipo_distratores": {
      "A": "PLAUSIBLE_RELATED",
      "B": "COMMON_MISCONCEPTION",
      "D": "PARTIALLY_CORRECT"
    },
    "misconceptions_exploradas": [],
    "requires_integration": true
  }
}
`;

/**
 * Prompt Builder Service
 */
export class PromptBuilderService {
  /**
   * Build the complete generation prompt
   */
  buildGenerationPrompt(config: QGenGenerationConfig): string {
    const parts: string[] = [];

    // Context section
    parts.push(this.buildContextSection(config));

    // Few-shot examples
    const fewShot = getFewShotPromptForArea(
      config.targetArea,
      config.targetBloomLevel,
      config.fewShotCount || 2
    );
    if (fewShot) {
      parts.push(`
## EXEMPLOS DE REFERENCIA

${fewShot}
`);
    }

    // Task specification
    parts.push(this.buildTaskSection(config));

    // Output specification
    parts.push(this.buildOutputSection());

    return parts.join('\n\n---\n\n');
  }

  /**
   * Build a prompt to revise a previously generated question, using validation feedback.
   */
  buildRevisionPrompt(params: {
    config: QGenGenerationConfig;
    previous: {
      stem: string;
      alternatives: Record<string, string>;
      correctAnswer: string;
      explanation?: string | null;
    };
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      category: string;
      message: string;
      suggestion?: string;
    }>;
  }): string {
    const issueLines = (params.issues || [])
      .filter((i) => i.severity !== 'info')
      .slice(0, 12)
      .map(
        (i) =>
          `- (${i.severity}/${i.category}) ${i.message}${i.suggestion ? ` | Sugestão: ${i.suggestion}` : ''}`
      );

    const current = {
      questao: {
        enunciado: params.previous.stem,
        alternativas: params.previous.alternatives,
        gabarito: params.previous.correctAnswer,
        comentario: params.previous.explanation || '',
      },
      metadados: {
        area: params.config.targetArea,
        tema: params.config.targetTopic || '',
        nivel_bloom: params.config.targetBloomLevel || 'APPLICATION',
        dificuldade_alvo: params.config.targetDifficulty ?? 3,
        dificuldade_estimada_irt: params.config.targetDifficulty ?? 0.0,
        discriminacao_estimada: 1.0,
        key_concepts: [],
        tipo_questao: params.config.targetQuestionType || 'CLINICAL_CASE',
        tipo_distratores: {},
        misconceptions_exploradas: [],
      },
    };

    return [
      '## TAREFA: Revisar e corrigir questão',
      this.buildContextSection(params.config),
      '## PROBLEMAS DETECTADOS (QUALITY GATE)',
      issueLines.length > 0 ? issueLines.join('\n') : '- (nenhum problema listado)',
      '## QUESTÃO ATUAL (PARA CORRIGIR)',
      '```json',
      JSON.stringify(current, null, 2),
      '```',
      '## INSTRUÇÕES DE CORREÇÃO',
      '- Corrija TODOS os problemas acima.',
      '- Garanta 1 melhor resposta (sem "todas/nenhuma as anteriores", sem combinações tipo "A e B").',
      '- Evite termos absolutos na alternativa correta.',
      '- Mantenha alternativas paralelas (mesma categoria: diagnóstico vs diagnóstico, conduta vs conduta).',
      '- No FINAL do comentário, inclua "Referências:" com 1–3 URLs de fontes confiáveis (diretrizes/sociedades/PubMed).',
      this.buildOutputSection(),
    ].join('\n\n---\n\n');
  }

  /**
   * Build clinical case generation prompt
   */
  buildClinicalCasePrompt(params: {
    area: string;
    topic: string;
    subtopic?: string;
    difficulty: number;
    bloomLevel: BloomLevel;
    keyConcepts: string[];
    misconceptions?: string[];
    template?: string;
  }): string {
    const config: QGenGenerationConfig = {
      targetArea: params.area,
      targetTopic: params.topic,
      targetDifficulty: this.difficultyToIRT(params.difficulty),
      targetBloomLevel: params.bloomLevel,
      targetQuestionType: QGenQuestionType.CLINICAL_CASE,
      targetMisconceptions: params.misconceptions,
    };

    return this.buildGenerationPrompt(config);
  }

  /**
   * Build conceptual question prompt
   */
  buildConceptualPrompt(params: {
    area: string;
    topic: string;
    concept: string;
    difficulty: number;
    bloomLevel: BloomLevel;
    questionType: 'mechanism' | 'classification' | 'definition' | 'comparison';
  }): string {
    const typeInstructions: Record<string, string> = {
      mechanism: 'Pergunte "Como" ou "Por que" algo ocorre - fisiopatologia ou farmacologia',
      classification: 'Pergunte sobre categorizacao ou agrupamento de condicoes',
      definition: 'Pergunte sobre caracteristica definidora ou criterios diagnosticos',
      comparison: 'Pergunte sobre diferenca ou semelhanca entre conceitos',
    };

    const config: QGenGenerationConfig = {
      targetArea: params.area,
      targetTopic: params.topic,
      targetDifficulty: this.difficultyToIRT(params.difficulty),
      targetBloomLevel: params.bloomLevel,
      targetQuestionType: QGenQuestionType.CONCEPTUAL,
    };

    const basePrompt = this.buildGenerationPrompt(config);

    return `${basePrompt}

## INSTRUCOES ESPECIFICAS PARA QUESTAO CONCEITUAL

**Conceito Central:** ${params.concept}
**Tipo:** ${params.questionType.toUpperCase()}
**Instrucao:** ${typeInstructions[params.questionType]}

GERE A QUESTAO AGORA:
`;
  }

  /**
   * Build distractor refinement prompt
   */
  buildDistractorRefinementPrompt(question: {
    stem: string;
    correctAnswer: string;
    currentDistractors: Record<string, string>;
    area: string;
    topic: string;
    availableMisconceptions: string[];
  }): string {
    return `
## TAREFA: Aprimorar Distratores de Questao

Voce recebera uma questao com resposta correta definida e precisa gerar/aprimorar os distratores para maximizar a discriminacao.

### PRINCIPIOS DE DISTRATORES EFICAZES

1. **PLAUSIBILIDADE GRADUADA**
   - Distrator 1: Muito plausivel (confunde ate bons alunos)
   - Distrator 2: Moderadamente plausivel
   - Distrator 3: Menos plausivel (discrimina alunos fracos)

2. **TIPOS DE DISTRATORES (use variedade)**
   | Tipo | Descricao | Quando Usar |
   |------|-----------|-------------|
   | PLAUSIBLE_RELATED | Condicao do mesmo sistema | Sempre ter ao menos 1 |
   | PARTIALLY_CORRECT | Conduta certa mas incompleta | Questoes de conduta |
   | COMMON_MISCONCEPTION | Erro conceitual frequente | Quando identificado |
   | INVERTED | Oposto logico da correta | Com moderacao |
   | DIFFERENT_CONTEXT | Correto em outro cenario | Questoes de conduta |

### QUESTAO PARA APRIMORAR

**Enunciado:**
${question.stem}

**Resposta Correta:**
${question.correctAnswer}

**Distratores Atuais (para aprimorar):**
${Object.entries(question.currentDistractors)
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}

**Area:** ${question.area}
**Tema:** ${question.topic}

**Misconceptions Disponiveis para Este Tema:**
${question.availableMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n') || 'Nenhuma especifica fornecida'}

### OUTPUT REQUERIDO

Retorne um JSON com os distratores aprimorados:

\`\`\`json
{
  "distratores": {
    "A": {
      "texto": "Texto do distrator A aprimorado",
      "tipo": "PLAUSIBLE_RELATED",
      "justificativa": "Por que e plausivel e por que esta errado",
      "misconception_explorada": "nome_da_misconception ou null",
      "plausibilidade_estimada": 0.7
    },
    "B": { ... },
    "D": { ... }
  }
}
\`\`\`

GERE OS DISTRATORES APRIMORADOS AGORA:
`;
  }

  /**
   * Build quality validation prompt
   */
  buildValidationPrompt(question: {
    stem: string;
    alternatives: Record<string, string>;
    correctAnswer: string;
    explanation?: string;
  }): string {
    return `
## TAREFA: Validar Qualidade de Questao Medica

Voce e um revisor especialista de questoes de provas medicas. Avalie a questao fornecida em multiplas dimensoes.

### DIMENSOES DE AVALIACAO

#### 1. ACURACIA MEDICA (Peso: 30%)
- Informacoes medicas corretas e atualizadas?
- Doses, condutas e protocolos corretos?
- Compativel com guidelines vigentes?

#### 2. QUALIDADE LINGUISTICA (Peso: 20%)
- Clareza e objetividade
- Gramatica e ortografia
- Ausencia de pistas linguisticas
- Enunciado nao-ambiguo

#### 3. QUALIDADE DOS DISTRATORES (Peso: 25%)
- Todos plausiveis?
- Tamanhos equilibrados?
- Variedade de tipos?
- Exploram misconceptions?

#### 4. ADEQUACAO PSICOMETRICA (Peso: 25%)
- Nivel cognitivo correto?
- Dificuldade apropriada?
- Discriminacao potencial?

### QUESTAO PARA VALIDAR

**Enunciado:**
${question.stem}

**Alternativas:**
${Object.entries(question.alternatives)
  .map(([k, v]) => `${k}) ${v}`)
  .join('\n')}

**Gabarito:** ${question.correctAnswer}

${question.explanation ? `**Comentario:** ${question.explanation}` : ''}

### OUTPUT REQUERIDO

\`\`\`json
{
  "validacao": {
    "acuracia_medica": {
      "score": 4,
      "problemas": [],
      "sugestoes": []
    },
    "qualidade_linguistica": {
      "score": 5,
      "problemas": [],
      "sugestoes": []
    },
    "qualidade_distratores": {
      "score": 4,
      "problemas": [],
      "sugestoes": []
    },
    "adequacao_psicometrica": {
      "score": 4,
      "problemas": [],
      "sugestoes": []
    },
    "score_geral": 4.25,
    "decisao": "APPROVE",
    "problemas_criticos": []
  }
}
\`\`\`

VALIDE A QUESTAO AGORA:
`;
  }

  /**
   * Build context section of prompt
   */
  private buildContextSection(config: QGenGenerationConfig): string {
    const parts: string[] = ['## CONTEXTO DESTA GERACAO'];

    parts.push(`
### Area e Tema
- **Area:** ${config.targetArea}
${config.targetTopic ? `- **Tema:** ${config.targetTopic}` : ''}
`);

    parts.push(`
### Especificacoes Psicometricas
${config.targetQuestionType ? `- **Tipo de Questao:** ${config.targetQuestionType}` : ''}
${config.targetBloomLevel ? `- **Nivel de Bloom:** ${config.targetBloomLevel}` : ''}
${config.targetDifficulty !== undefined ? `- **Dificuldade Alvo IRT:** ${config.targetDifficulty.toFixed(1)}` : ''}
`);

    if (config.targetMisconceptions && config.targetMisconceptions.length > 0) {
      parts.push(`
### Misconceptions a Explorar nos Distratores
${config.targetMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`);
    }

    if (config.studentProfile) {
      parts.push(`
### Perfil do Estudante (para adaptacao)
- **Theta estimado:** ${config.studentProfile.theta.toFixed(2)}
- **Areas fracas:** ${config.studentProfile.weakAreas.join(', ')}
- **Erros recentes:** ${config.studentProfile.recentErrors.join(', ')}
`);
    }

    return parts.join('\n');
  }

  /**
   * Build task section of prompt
   */
  private buildTaskSection(config: QGenGenerationConfig): string {
    const questionType = config.targetQuestionType || QGenQuestionType.CLINICAL_CASE;
    const difficulty = this.irtToDifficulty(config.targetDifficulty || 0);

    let taskSection = `## TAREFA: Gerar Questao

### Tipo de Questao
${QUESTION_TYPE_INSTRUCTIONS[questionType] || QUESTION_TYPE_INSTRUCTIONS.CLINICAL_CASE}

### Instrucoes de Dificuldade
${DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS[3]}
`;

    return taskSection;
  }

  /**
   * Build output section of prompt
   */
  private buildOutputSection(): string {
    return `## OUTPUT REQUERIDO

Retorne APENAS um JSON valido no seguinte formato:

\`\`\`json
${OUTPUT_SCHEMA}
\`\`\`

IMPORTANTE:
- O JSON deve ser valido e completo
- A resposta correta deve ser inequivoca
- Os distratores devem ser todos plausiveis
- O comentario deve explicar a resposta e os erros dos distratores
- No FINAL do comentario, inclua "Referências:" com 1–3 fontes (com URL) de diretrizes/sociedades/PubMed quando aplicável

GERE A QUESTAO AGORA:
`;
  }

  /**
   * Convert 1-5 difficulty to IRT b parameter
   */
  private difficultyToIRT(difficulty: number): number {
    const map: Record<number, number> = {
      1: -1.2,
      2: -0.6,
      3: 0.0,
      4: 0.6,
      5: 1.2,
    };
    return map[difficulty] ?? 0;
  }

  /**
   * Convert IRT b parameter to 1-5 difficulty
   */
  private irtToDifficulty(irt: number): number {
    if (irt <= -0.9) return 1;
    if (irt <= -0.3) return 2;
    if (irt <= 0.3) return 3;
    if (irt <= 0.9) return 4;
    return 5;
  }

  /**
   * Get the system prompt only
   */
  getSystemPrompt(): string {
    return QGEN_SYSTEM_PROMPT;
  }
}
