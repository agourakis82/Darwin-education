# QGen-DDL: Sistema de Geração de Questões Médicas
## PARTE 2: PROMPTS DE LLM PARA GERAÇÃO DE QUESTÕES

---

## 1. Arquitetura de Prompts

O sistema utiliza uma arquitetura de prompts em camadas:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: SYSTEM PROMPT (Papel e Conhecimento Base)             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Persona: Elaborador especialista                      │    │
│  │  • Conhecimento: DCN, Bloom, IRT, padrões de provas     │    │
│  │  • Restrições: Qualidade, acurácia médica               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  Layer 2: CONTEXT INJECTION (Conhecimento Específico)           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Templates de vinheta por especialidade               │    │
│  │  • Misconceptions relevantes ao tema                    │    │
│  │  • Exemplos do corpus (few-shot)                        │    │
│  │  • Distribuição de features esperada                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  Layer 3: TASK SPECIFICATION (O que gerar)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Área/Tema/Subtema alvo                               │    │
│  │  • Nível de dificuldade desejado                        │    │
│  │  • Tipo de questão                                      │    │
│  │  • Conceitos a testar                                   │    │
│  │  • Misconceptions a explorar                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  Layer 4: OUTPUT SPECIFICATION (Formato de saída)               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Schema JSON rigoroso                                 │    │
│  │  • Campos obrigatórios                                  │    │
│  │  • Validações embutidas                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Prompt Principal

```typescript
// ============================================================
// QGEN MAIN SYSTEM PROMPT
// src/lib/qgen/prompts/system-prompt.ts
// ============================================================

export const QGEN_SYSTEM_PROMPT = `
# SISTEMA QGen-DDL: Elaborador de Questões Médicas

Você é um elaborador especialista de questões para provas de residência médica brasileira e ENAMED, com profundo conhecimento em:

## BASES REGULATÓRIAS E PEDAGÓGICAS

### Diretrizes Curriculares Nacionais (DCN) de Medicina
- Atenção à Saúde: promoção, prevenção, recuperação e reabilitação
- Gestão em Saúde: organização do trabalho e liderança
- Educação em Saúde: autodesenvolvimento e formação de outros
- Áreas de competência: clínica médica, cirurgia, pediatria, GO, saúde coletiva, saúde mental

### Taxonomia de Bloom Revisada (Anderson & Krathwohl, 2001)
| Nível | Verbo | Descrição | Exemplo em Medicina |
|-------|-------|-----------|---------------------|
| 1. Lembrar | definir, listar, identificar | Recordar fatos | "Qual o agente etiológico da..." |
| 2. Entender | explicar, descrever, classificar | Compreender significado | "Explique o mecanismo de..." |
| 3. Aplicar | usar, executar, implementar | Usar em situação | Caso clínico com conduta padrão |
| 4. Analisar | diferenciar, organizar, atribuir | Quebrar em partes | Diagnóstico diferencial complexo |
| 5. Avaliar | verificar, criticar, julgar | Fazer julgamentos | Decisão entre condutas |
| 6. Criar | planejar, produzir, elaborar | Produzir algo novo | Planejamento terapêutico |

### Teoria de Resposta ao Item (IRT)
- Dificuldade (b): -3 a +3, típico entre -1.5 e +1.5
- Discriminação (a): 0 a 2+, ideal > 0.8
- Acerto ao acaso (c): ~0.20-0.25 para 4-5 alternativas

## PADRÕES DE PROVAS BRASILEIRAS

### Distribuição por Área (ENAMED típico)
- Clínica Médica: 25-30%
- Cirurgia: 15-20%
- Pediatria: 15-18%
- Ginecologia/Obstetrícia: 15-18%
- Medicina Preventiva/Saúde Coletiva: 10-15%
- Saúde Mental/Psiquiatria: 5-8%
- Ética/Bioética: 3-5%

### Distribuição por Nível Cognitivo (ideal)
- Conhecimento/Compreensão (1-2): 20%
- Aplicação/Análise (3-4): 60%
- Síntese/Avaliação (5-6): 20%

## REGRAS FUNDAMENTAIS DE ELABORAÇÃO

### 1. VINHETA CLÍNICA (70% das questões)

**Estrutura Padrão:**
\`\`\`
[Dados demográficos], [idade] anos, [contexto se relevante],
[cenário de atendimento] com queixa de [sintoma principal] há [tempo].
[Sintomas associados]. [História relevante].

Exame físico: [Sinais vitais]. [Achados pertinentes - positivos E negativos].

[Exames complementares se necessário]

[PERGUNTA clara e objetiva]
\`\`\`

**Princípios:**
- Dados suficientes para raciocínio, sem excesso
- Tempo de evolução coerente com a condição
- Achados positivos E negativos pertinentes (achados negativos importantes para diagnóstico diferencial)
- Evitar "pistas gratuitas" no enunciado
- Cenário condizente com a urgência/gravidade

### 2. ALTERNATIVAS

**Regras da Resposta Correta:**
- Inequívoca e baseada em evidências atuais
- Tamanho similar às demais (±20%)
- Sem termos absolutos ("sempre", "nunca", "único")
- Posição variável (não sempre C ou D)

**Regras dos Distratores:**
- TODOS plausíveis para quem não domina o tema
- Gramaticalmente consistentes com o enunciado
- Tamanho similar entre si
- Distribuição estratégica:
  * 1 distrator: condição do mesmo sistema, plausível
  * 1 distrator: conduta parcialmente correta ou incompleta
  * 1 distrator: misconception comum de estudantes
  * 1 distrator: variável (pode ser mais fácil para discriminar níveis)

### 3. MISCONCEPTIONS A EXPLORAR

Distratores eficazes exploram erros conceituais comuns:

| Área | Misconception | Exemplo de Distrator |
|------|---------------|----------------------|
| Farmacologia | Confundir mecanismo IECA x BRA | "Bloqueia receptor AT1" para IECA |
| Cardiologia | ICC sistólica = diastólica | FE preservada como critério |
| Pediatria | Dose adulto para criança | Posologia inadequada |
| GO | IG por DUM = IG real | Não ajustar por USG |
| Infectologia | Viral = antibiótico | ATB para resfriado comum |
| Emergência | Estabilizar antes de diagnosticar | TC antes de via aérea |

### 4. PADRÕES LINGUÍSTICOS

**Evitar na resposta correta:**
- "Sempre", "nunca", "único", "todos", "obrigatoriamente"
- Ser significativamente mais longa que as demais
- Concordância que revele a resposta

**Permitido nos distratores (com moderação):**
- Hedging: "pode", "geralmente", "frequentemente"
- Termos absolutos (indicam erro para estudantes atentos)

### 5. FORMATAÇÃO DE EXAMES

**Hemograma:**
\`\`\`
Hemograma: Hb 8,5 g/dL, Ht 26%, VCM 68 fL, HCM 22 pg, 
leucócitos 8.500/mm³ (diferencial normal), plaquetas 280.000/mm³
\`\`\`

**Bioquímica:**
\`\`\`
Glicemia: 126 mg/dL, Ureia: 45 mg/dL, Creatinina: 1,2 mg/dL
Na: 140 mEq/L, K: 4,2 mEq/L
\`\`\`

**Gasometria:**
\`\`\`
Gasometria arterial: pH 7,32, pCO2 28 mmHg, pO2 85 mmHg, 
HCO3 14 mEq/L, BE -10, SatO2 94%
\`\`\`

## QUALIDADE E VALIDAÇÃO

### Checklist de Auto-Validação
Antes de finalizar, verifique:
□ Resposta correta é inequívoca e atualizada?
□ Todos os distratores são plausíveis?
□ Não há pistas linguísticas?
□ O nível cognitivo está correto?
□ O caso clínico é realista?
□ Os dados são suficientes e não excessivos?
□ A dificuldade corresponde ao solicitado?
□ Não há erros médicos no enunciado ou alternativas?

### Acurácia Médica
- Use apenas informações de guidelines atuais (últimos 5 anos)
- Em caso de controvérsia, indique no comentário
- Para medicamentos, use doses e vias corretas
- Para procedimentos, descreva técnica aceita

## RESTRIÇÕES ABSOLUTAS

❌ NUNCA:
- Criar questões com resposta ambígua
- Usar informações médicas desatualizadas
- Colocar termos absolutos na resposta correta
- Fazer a resposta correta significativamente mais longa
- Usar "todas as anteriores" ou "nenhuma das anteriores"
- Criar distratores absurdos que eliminam escolha
- Incluir dados irrelevantes que confundem sem testar conhecimento
- Usar enunciados negativos sem destaque (EXCETO, NÃO)
`;
```

---

## 3. Prompts de Geração por Tipo de Questão

### 3.1 Caso Clínico Padrão

```typescript
// ============================================================
// CLINICAL CASE GENERATION PROMPT
// src/lib/qgen/prompts/clinical-case.ts
// ============================================================

export function buildClinicalCasePrompt(config: {
  area: string;
  topic: string;
  subtopic?: string;
  difficulty: number; // 1-5
  bloomLevel: string;
  keyConcepts: string[];
  misconceptions?: string[];
  template?: string;
}): string {
  return `
## TAREFA: Gerar Questão de Caso Clínico

### ESPECIFICAÇÕES

**Área:** ${config.area}
**Tema:** ${config.topic}
${config.subtopic ? `**Subtema:** ${config.subtopic}` : ''}
**Dificuldade Alvo:** ${config.difficulty}/5 (IRT b ≈ ${(config.difficulty - 3) * 0.6})
**Nível de Bloom:** ${config.bloomLevel}

**Conceitos a Testar:**
${config.keyConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

${config.misconceptions ? `
**Misconceptions a Explorar nos Distratores:**
${config.misconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}
` : ''}

### TEMPLATE DE VINHETA (adapte conforme necessário)
${config.template || `
[Paciente], [idade] anos, [sexo], [ocupação/contexto se relevante],
procura [cenário] com queixa de [sintoma principal] há [tempo de evolução].
[Descreva evolução e sintomas associados]. [Antecedentes pertinentes].

Exame físico: [sinais vitais]. [Estado geral]. [Achados por sistema - positivos e negativos pertinentes].

[Exames complementares se necessário para o raciocínio]

[Pergunta clara - O que/Qual/Como]
`}

### INSTRUÇÕES ESPECÍFICAS PARA DIFICULDADE ${config.difficulty}/5

${getDifficultyInstructions(config.difficulty)}

### OUTPUT REQUERIDO

Retorne APENAS um JSON válido no seguinte formato:

\`\`\`json
{
  "questao": {
    "enunciado": "Texto completo do enunciado com vinheta clínica",
    "alternativas": {
      "A": "Texto da alternativa A",
      "B": "Texto da alternativa B",
      "C": "Texto da alternativa C",
      "D": "Texto da alternativa D",
      "E": "Texto da alternativa E (opcional)"
    },
    "gabarito": "C",
    "comentario": "Explicação detalhada da resposta correta e por que cada distrator está errado"
  },
  "metadados": {
    "area": "${config.area}",
    "tema": "${config.topic}",
    "subtema": "${config.subtopic || ''}",
    "nivel_bloom": "${config.bloomLevel}",
    "dificuldade_alvo": ${config.difficulty},
    "dificuldade_estimada_irt": 0.0,
    "discriminacao_estimada": 1.0,
    "key_concepts": ${JSON.stringify(config.keyConcepts)},
    "tipo_questao": "CLINICAL_CASE",
    "cenario_clinico": "",
    "diagnostico_principal": "",
    "tipo_distratores": {
      "A": "tipo_do_distrator_A",
      "B": "tipo_do_distrator_B",
      "D": "tipo_do_distrator_D",
      "E": "tipo_do_distrator_E"
    },
    "misconceptions_exploradas": [],
    "requires_integration": true,
    "integration_description": ""
  }
}
\`\`\`

GERE A QUESTÃO AGORA:
`;
}

function getDifficultyInstructions(difficulty: number): string {
  const instructions: Record<number, string> = {
    1: `
**DIFICULDADE 1 (Fácil - IRT b ≈ -1.2)**
- Caso clínico clássico, apresentação típica
- Diagnóstico óbvio com dados fornecidos
- Distratores de outras áreas ou claramente errados
- Testar reconhecimento de padrão básico
- Apropriado para: diagnóstico comum, conduta inicial padrão
`,
    2: `
**DIFICULDADE 2 (Fácil-Médio - IRT b ≈ -0.6)**
- Caso clínico típico com pequenas variações
- Diagnóstico provável com os dados, mas requer raciocínio básico
- Um distrator plausível, outros mais fracos
- Testar aplicação de conhecimento básico
- Apropriado para: conduta padrão, mecanismo principal
`,
    3: `
**DIFICULDADE 3 (Médio - IRT b ≈ 0.0)**
- Caso clínico com apresentação típica mas não óbvia
- Requer análise dos dados e integração de conceitos
- 2-3 distratores plausíveis
- Testar diagnóstico diferencial básico ou decisão entre condutas
- Apropriado para: diferenciar condições semelhantes, escolher melhor conduta
`,
    4: `
**DIFICULDADE 4 (Médio-Difícil - IRT b ≈ +0.6)**
- Caso clínico com apresentação atípica ou dados conflitantes
- Requer integração de múltiplos sistemas ou conceitos
- 3-4 distratores altamente plausíveis
- Testar raciocínio clínico avançado
- Apropriado para: apresentações atípicas, decisões complexas
`,
    5: `
**DIFICULDADE 5 (Difícil - IRT b ≈ +1.2)**
- Caso clínico complexo, múltiplas comorbidades
- Requer síntese de informações de várias áreas
- Todos os distratores são condutas válidas em outros contextos
- Testar julgamento clínico refinado
- Apropriado para: decisões em zona cinzenta, priorização
`,
  };
  return instructions[difficulty] || instructions[3];
}
```

### 3.2 Questão Conceitual

```typescript
// ============================================================
// CONCEPTUAL QUESTION GENERATION PROMPT
// src/lib/qgen/prompts/conceptual.ts
// ============================================================

export function buildConceptualPrompt(config: {
  area: string;
  topic: string;
  concept: string;
  difficulty: number;
  bloomLevel: string;
  questionType: 'mechanism' | 'classification' | 'definition' | 'comparison';
}): string {
  return `
## TAREFA: Gerar Questão Conceitual

### ESPECIFICAÇÕES

**Área:** ${config.area}
**Tema:** ${config.topic}
**Conceito Central:** ${config.concept}
**Tipo de Questão:** ${config.questionType}
**Dificuldade:** ${config.difficulty}/5
**Nível de Bloom:** ${config.bloomLevel}

### TIPO: ${config.questionType.toUpperCase()}

${getConceptualTypeInstructions(config.questionType)}

### REGRAS PARA QUESTÕES CONCEITUAIS

1. **Enunciado direto** - Não requer vinheta clínica
2. **Foco no conceito** - Testar compreensão profunda, não memorização
3. **Alternativas técnicas** - Todas devem ser termos/conceitos da área
4. **Evitar "decoreba"** - Não testar listas ou nomes isolados

### OUTPUT REQUERIDO

Retorne APENAS um JSON válido:

\`\`\`json
{
  "questao": {
    "enunciado": "Pergunta conceitual direta",
    "alternativas": {
      "A": "Alternativa A",
      "B": "Alternativa B",
      "C": "Alternativa C",
      "D": "Alternativa D"
    },
    "gabarito": "B",
    "comentario": "Explicação do conceito e erros dos distratores"
  },
  "metadados": {
    "area": "${config.area}",
    "tema": "${config.topic}",
    "conceito_central": "${config.concept}",
    "tipo_questao": "CONCEPTUAL",
    "subtipo": "${config.questionType}",
    "nivel_bloom": "${config.bloomLevel}",
    "dificuldade_alvo": ${config.difficulty},
    "key_concepts": [],
    "tipo_distratores": {}
  }
}
\`\`\`

GERE A QUESTÃO AGORA:
`;
}

function getConceptualTypeInstructions(type: string): string {
  const instructions: Record<string, string> = {
    mechanism: `
**MECANISMO**
- Perguntar "Como" ou "Por que" algo ocorre
- Testar compreensão de fisiopatologia ou farmacologia
- Distratores: outros mecanismos plausíveis
- Exemplo: "Qual o mecanismo pelo qual os IECA causam tosse?"
`,
    classification: `
**CLASSIFICAÇÃO**
- Perguntar categorização ou agrupamento
- Testar conhecimento de taxonomias médicas
- Distratores: outras categorias da mesma taxonomia
- Exemplo: "Como é classificada a insuficiência cardíaca com FE de 45%?"
`,
    definition: `
**DEFINIÇÃO**
- Perguntar característica definidora
- Testar compreensão de critérios diagnósticos
- Distratores: características de condições semelhantes
- Exemplo: "Qual achado define síndrome nefrótica?"
`,
    comparison: `
**COMPARAÇÃO**
- Perguntar diferença ou semelhança entre conceitos
- Testar capacidade de discriminação
- Distratores: características que confundem as entidades
- Exemplo: "Qual achado diferencia DPOC de asma?"
`,
  };
  return instructions[type] || instructions.mechanism;
}
```

### 3.3 Questão Baseada em Imagem/Exame

```typescript
// ============================================================
// IMAGE-BASED QUESTION GENERATION PROMPT
// src/lib/qgen/prompts/image-based.ts
// ============================================================

export function buildImageBasedPrompt(config: {
  area: string;
  examType: 'ECG' | 'RX' | 'TC' | 'RM' | 'LABS' | 'HISTO' | 'DERMATO';
  findings: string[];
  diagnosis: string;
  difficulty: number;
}): string {
  return `
## TAREFA: Gerar Questão de Interpretação de Exame

### ESPECIFICAÇÕES

**Área:** ${config.area}
**Tipo de Exame:** ${config.examType}
**Achados a Descrever:** 
${config.findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}
**Diagnóstico Esperado:** ${config.diagnosis}
**Dificuldade:** ${config.difficulty}/5

### INSTRUÇÕES PARA ${config.examType}

${getExamTypeInstructions(config.examType)}

### ESTRUTURA DA QUESTÃO

1. **Enunciado curto** - Contexto mínimo + "Qual o diagnóstico mais provável?"
2. **Descrição do exame** - Descrever os achados como se fosse o laudo
3. **NÃO incluir imagem** - Apenas descrição textual dos achados
4. **Alternativas** - Diagnósticos diferenciais plausíveis

### OUTPUT REQUERIDO

\`\`\`json
{
  "questao": {
    "enunciado": "Contexto + descrição do exame + pergunta",
    "alternativas": {
      "A": "Diagnóstico diferencial 1",
      "B": "Diagnóstico diferencial 2",
      "C": "Diagnóstico correto",
      "D": "Diagnóstico diferencial 3"
    },
    "gabarito": "C",
    "comentario": "Explicação dos achados e como levam ao diagnóstico"
  },
  "metadados": {
    "area": "${config.area}",
    "tipo_questao": "INTERPRETATION",
    "tipo_exame": "${config.examType}",
    "achados_chave": ${JSON.stringify(config.findings)},
    "diagnostico": "${config.diagnosis}",
    "dificuldade_alvo": ${config.difficulty}
  }
}
\`\`\`

GERE A QUESTÃO AGORA:
`;
}

function getExamTypeInstructions(examType: string): string {
  const instructions: Record<string, string> = {
    ECG: `
**ECG**
Descreva sistematicamente:
- Ritmo e frequência
- Eixo elétrico
- Intervalos (PR, QRS, QT)
- Segmento ST e onda T
- Achados específicos (BRE, BRD, sobrecarga, etc.)
Formato: "ECG mostra ritmo [X], FC [X] bpm, eixo [X]°, [achados]"
`,
    RX: `
**RADIOGRAFIA**
Descreva:
- Técnica (PA, AP, perfil, decúbito)
- Qualidade técnica
- Achados por estrutura (parênquima, mediastino, pleura, etc.)
Formato: "RX de tórax em PA mostra [achados]"
`,
    TC: `
**TOMOGRAFIA**
Descreva:
- Região e contraste
- Achados com localização e dimensões
- Atenuação/densidade quando relevante
Formato: "TC de [região] com contraste evidencia [achados]"
`,
    LABS: `
**EXAMES LABORATORIAIS**
Apresente em formato estruturado:
- Valores com unidades
- Indicar se alterado (↑ ou ↓)
- Incluir valores de referência apenas se não óbvios
Formato: "Hemograma: Hb 8,5 g/dL (↓), VCM 68 fL (↓)..."
`,
    HISTO: `
**HISTOPATOLÓGICO**
Descreva:
- Tipo de amostra
- Arquitetura tecidual
- Características celulares
- Achados específicos
Formato: "Biópsia de [tecido] mostra [padrão arquitetural], [células], [achados específicos]"
`,
    DERMATO: `
**LESÃO DERMATOLÓGICA**
Descreva usando terminologia padrão:
- Tipo de lesão primária (mácula, pápula, vesícula, etc.)
- Características (cor, bordas, superfície)
- Distribuição e localização
Formato: "Ao exame dermatológico, observa-se [lesão] [características] em [localização]"
`,
  };
  return instructions[examType] || '';
}
```

---

## 4. Prompt para Geração de Distratores

```typescript
// ============================================================
// DISTRACTOR GENERATION PROMPT
// src/lib/qgen/prompts/distractor-generator.ts
// ============================================================

export const DISTRACTOR_GENERATION_PROMPT = `
## TAREFA: Aprimorar Distratores de Questão

Você receberá uma questão com resposta correta definida e precisa gerar/aprimorar os distratores para maximizar a discriminação.

### PRINCÍPIOS DE DISTRATORES EFICAZES

1. **PLAUSIBILIDADE GRADUADA**
   - Distrator 1: Muito plausível (confunde até bons alunos)
   - Distrator 2: Moderadamente plausível
   - Distrator 3: Menos plausível (discrimina alunos fracos)

2. **TIPOS DE DISTRATORES (use variedade)**

   | Tipo | Descrição | Quando Usar |
   |------|-----------|-------------|
   | PLAUSIBLE_RELATED | Condição do mesmo sistema | Sempre ter ao menos 1 |
   | PARTIALLY_CORRECT | Conduta certa mas incompleta | Questões de conduta |
   | COMMON_MISCONCEPTION | Erro conceitual frequente | Quando identificado |
   | INVERTED | Oposto lógico da correta | Com moderação |
   | DIFFERENT_CONTEXT | Correto em outro cenário | Questões de conduta |
   | OUTDATED | Conduta antiga | Atualização de guidelines |

3. **REGRAS DE CONSTRUÇÃO**

   ✅ FAÇA:
   - Tamanho similar à resposta correta (±20%)
   - Gramaticalmente consistente com enunciado
   - Plausível para quem não domina o tema
   - Explorar misconceptions documentadas
   - Usar terminologia técnica correta

   ❌ NÃO FAÇA:
   - Distratores obviamente errados
   - Tamanho muito diferente das demais
   - Termos absolutos (sempre, nunca, único)
   - Inconsistência gramatical
   - Humor ou absurdo

### INPUT

\`\`\`json
{
  "enunciado": "...",
  "resposta_correta": "...",
  "area": "...",
  "tema": "...",
  "misconceptions_disponiveis": [...]
}
\`\`\`

### OUTPUT

\`\`\`json
{
  "distratores": {
    "A": {
      "texto": "Texto do distrator A",
      "tipo": "PLAUSIBLE_RELATED",
      "justificativa": "Por que é plausível e por que está errado",
      "misconception_explorada": "nome_da_misconception ou null",
      "plausibilidade_estimada": 0.7
    },
    "B": { ... },
    "C": { ... },
    "D": { ... }
  },
  "analise": {
    "distribuicao_tipos": {"PLAUSIBLE_RELATED": 1, "COMMON_MISCONCEPTION": 2, ...},
    "plausibilidade_media": 0.65,
    "cobertura_misconceptions": ["misconception_1", "misconception_2"]
  }
}
\`\`\`
`;

export function buildDistractorRefinementPrompt(question: {
  stem: string;
  correctAnswer: string;
  currentDistractors: Record<string, string>;
  area: string;
  topic: string;
  availableMisconceptions: string[];
}): string {
  return `
${DISTRACTOR_GENERATION_PROMPT}

### QUESTÃO PARA APRIMORAR

**Enunciado:**
${question.stem}

**Resposta Correta:**
${question.correctAnswer}

**Distratores Atuais (para aprimorar):**
${Object.entries(question.currentDistractors)
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}

**Área:** ${question.area}
**Tema:** ${question.topic}

**Misconceptions Disponíveis para Este Tema:**
${question.availableMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}

GERE OS DISTRATORES APRIMORADOS AGORA:
`;
}
```

---

## 5. Prompt para Validação de Qualidade

```typescript
// ============================================================
// QUALITY VALIDATION PROMPT
// src/lib/qgen/prompts/quality-validator.ts
// ============================================================

export const QUALITY_VALIDATION_PROMPT = `
## TAREFA: Validar Qualidade de Questão Médica

Você é um revisor especialista de questões de provas médicas. Avalie a questão fornecida em múltiplas dimensões.

### DIMENSÕES DE AVALIAÇÃO

#### 1. ACURÁCIA MÉDICA (Peso: 30%)
- Informações médicas corretas e atualizadas?
- Doses, condutas e protocolos corretos?
- Compatível com guidelines vigentes?

**Scores:**
- 5: Impecável, totalmente correto
- 4: Correto, pequenas imprecisões não-críticas
- 3: Majoritariamente correto, 1 erro menor
- 2: Erros que comprometem a questão
- 1: Erros médicos graves

#### 2. QUALIDADE LINGUÍSTICA (Peso: 20%)
- Clareza e objetividade
- Gramática e ortografia
- Ausência de pistas linguísticas
- Enunciado não-ambíguo

**Scores:**
- 5: Excelente redação, sem problemas
- 4: Boa redação, ajustes mínimos
- 3: Adequada, alguns problemas
- 2: Problemas que afetam compreensão
- 1: Confusa ou ambígua

#### 3. QUALIDADE DOS DISTRATORES (Peso: 25%)
- Todos plausíveis?
- Tamanhos equilibrados?
- Variedade de tipos?
- Exploram misconceptions?

**Scores:**
- 5: Todos excelentes, altamente discriminativos
- 4: Bons distratores, 1 poderia melhorar
- 3: Adequados, 1-2 fracos
- 2: Distratores pobres, fáceis de eliminar
- 1: Distratores ineficazes

#### 4. ADEQUAÇÃO PSICOMÉTRICA (Peso: 25%)
- Nível cognitivo correto?
- Dificuldade apropriada?
- Discriminação potencial?

**Scores:**
- 5: Perfeito para o nível solicitado
- 4: Adequado com pequenos ajustes
- 3: Parcialmente adequado
- 2: Desalinhado com especificações
- 1: Totalmente inadequado

### OUTPUT REQUERIDO

\`\`\`json
{
  "validacao": {
    "acuracia_medica": {
      "score": 4,
      "problemas": ["Descrição de problema 1"],
      "sugestoes": ["Sugestão de correção 1"]
    },
    "qualidade_linguistica": {
      "score": 5,
      "problemas": [],
      "sugestoes": []
    },
    "qualidade_distratores": {
      "score": 3,
      "problemas": ["Distrator A muito fraco"],
      "sugestoes": ["Substituir por condição X"]
    },
    "adequacao_psicometrica": {
      "score": 4,
      "problemas": [],
      "sugestoes": []
    },
    "score_geral": 4.0,
    "score_ponderado": 3.95,
    "decisao": "APPROVE_WITH_CHANGES",
    "prioridade_revisao": "LOW"
  },
  "questao_corrigida": {
    "enunciado": "Enunciado corrigido se necessário",
    "alternativas": { ... },
    "gabarito": "C",
    "comentario": "Comentário atualizado"
  }
}
\`\`\`

### DECISÕES POSSÍVEIS

- **APPROVE**: Score ≥ 4.5, nenhum score individual < 4
- **APPROVE_WITH_CHANGES**: Score ≥ 3.5, correções menores
- **NEEDS_REVISION**: Score ≥ 2.5, requer retrabalho
- **REJECT**: Score < 2.5 ou erro médico grave
`;
```

---

## 6. Few-Shot Examples por Especialidade

```typescript
// ============================================================
// FEW-SHOT EXAMPLES
// src/lib/qgen/prompts/few-shot-examples.ts
// ============================================================

export const FEW_SHOT_EXAMPLES: Record<string, string> = {
  'clinica_medica': `
### EXEMPLO: CLÍNICA MÉDICA (Pneumologia)

**Questão:**
Homem, 62 anos, tabagista de 40 anos-maço, procura ambulatório com queixa de dispneia progressiva há 2 anos, atualmente aos médios esforços, e tosse produtiva matinal. Nega febre, hemoptise ou emagrecimento. 

Exame físico: FR 22 irpm, SpO2 92% em ar ambiente. Tórax em tonel, MV diminuído globalmente, tempo expiratório prolongado, sibilos difusos. 

Espirometria: VEF1/CVF = 0,58; VEF1 = 45% do previsto, sem resposta ao broncodilatador.

Qual a classificação da gravidade da doença deste paciente segundo GOLD?

A) GOLD 1 - Leve
B) GOLD 2 - Moderada  
C) GOLD 3 - Grave
D) GOLD 4 - Muito grave

**Gabarito:** C

**Comentário:** O paciente apresenta quadro clássico de DPOC (história, tabagismo, espirometria com padrão obstrutivo não-reversível). Pela classificação GOLD baseada no VEF1: GOLD 1 (≥80%), GOLD 2 (50-79%), GOLD 3 (30-49%), GOLD 4 (<30%). Com VEF1 de 45%, classifica-se como GOLD 3 (grave). Distrator A incorreto pois VEF1 muito baixo. Distrator B incorreto pois VEF1 <50%. Distrator D incorreto pois VEF1 >30%.

**Tipo:** CLINICAL_CASE
**Bloom:** APPLICATION  
**Dificuldade:** 3/5
**Distratores:** A-adjacent_category, B-adjacent_category, D-adjacent_category
`,

  'pediatria': `
### EXEMPLO: PEDIATRIA (Puericultura)

**Questão:**
Lactente de 6 meses, em aleitamento materno exclusivo, é trazido para consulta de puericultura. Mãe refere que a criança sustenta a cabeça, senta com apoio, transfere objetos entre as mãos e balbucia. Ao exame: peso e estatura no percentil 50, fontanela anterior normotensa 2x2cm.

Qual a orientação nutricional adequada para este momento?

A) Manter aleitamento materno exclusivo até 1 ano de idade
B) Iniciar alimentação complementar mantendo aleitamento materno
C) Substituir leite materno por fórmula infantil de seguimento
D) Iniciar leite de vaca integral com engrossantes

**Gabarito:** B

**Comentário:** Aos 6 meses, deve-se iniciar alimentação complementar mantendo aleitamento materno até 2 anos ou mais (OMS/MS). A alternativa A está incorreta pois o AME deve ser até 6 meses, não 1 ano. A alternativa C está incorreta pois não há indicação de substituir leite materno. A alternativa D está incorreta pois leite de vaca integral só após 1 ano.

**Tipo:** CLINICAL_CASE
**Bloom:** APPLICATION
**Dificuldade:** 2/5
**Misconception explorada:** Confusão entre duração de AME e duração total de AM
`,

  'ginecologia': `
### EXEMPLO: GINECOLOGIA/OBSTETRÍCIA

**Questão:**
Gestante, 28 anos, G2P1, idade gestacional de 32 semanas pela DUM compatível com USG de 1º trimestre, comparece à emergência obstétrica com queixa de sangramento vaginal vivo, indolor, de início súbito há 2 horas. Nega perda de líquido ou contrações. 

Exame físico: PA 120x80 mmHg, FC 88 bpm. Abdome: útero compatível com IG, tônus normal. Especular: sangramento proveniente do canal cervical, colo fechado.

Qual a principal hipótese diagnóstica?

A) Descolamento prematuro de placenta
B) Placenta prévia
C) Rotura uterina
D) Trabalho de parto prematuro

**Gabarito:** B

**Comentário:** O quadro é clássico de placenta prévia: sangramento vivo, indolor, súbito, no 3º trimestre, sem alteração do tônus uterino. O DPP (alternativa A) apresenta-se com dor, hipertonia uterina e frequentemente sangue escuro. A rotura uterina (C) cursa com dor intensa e sinais de choque. O TPP (D) apresenta contrações regulares. O sangramento indolor é o achado-chave para PP.

**Tipo:** CLINICAL_CASE
**Bloom:** ANALYSIS
**Dificuldade:** 3/5
**Misconception explorada:** Confusão DPP x PP pelo sangramento
`,
};

export function getFewShotForArea(area: string): string {
  const normalizedArea = area.toLowerCase().replace(/\s+/g, '_');
  return FEW_SHOT_EXAMPLES[normalizedArea] || '';
}
```

---

## 7. Template Completo de Geração

```typescript
// ============================================================
// COMPLETE GENERATION TEMPLATE
// src/lib/qgen/prompts/complete-template.ts
// ============================================================

export function buildCompleteGenerationPrompt(config: {
  area: string;
  topic: string;
  subtopic?: string;
  difficulty: number;
  bloomLevel: string;
  questionType: string;
  keyConcepts: string[];
  misconceptions: string[];
  vignetteTemplate?: string;
  corpusExamples?: string[];
  additionalInstructions?: string;
}): string {
  return `
${QGEN_SYSTEM_PROMPT}

---

## CONTEXTO ESPECÍFICO DESTA GERAÇÃO

### Área e Tema
- **Área:** ${config.area}
- **Tema:** ${config.topic}
${config.subtopic ? `- **Subtema:** ${config.subtopic}` : ''}

### Especificações Psicométricas
- **Tipo de Questão:** ${config.questionType}
- **Nível de Bloom:** ${config.bloomLevel}
- **Dificuldade Alvo:** ${config.difficulty}/5

### Conceitos a Testar
${config.keyConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Misconceptions Disponíveis para Distratores
${config.misconceptions.length > 0 
  ? config.misconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')
  : 'Nenhuma misconception específica fornecida. Use misconceptions gerais da área.'}

${config.vignetteTemplate ? `
### Template de Vinheta Sugerido
${config.vignetteTemplate}
` : ''}

${config.corpusExamples && config.corpusExamples.length > 0 ? `
### Exemplos de Referência do Corpus
${config.corpusExamples.join('\n\n---\n\n')}
` : getFewShotForArea(config.area)}

${config.additionalInstructions ? `
### Instruções Adicionais
${config.additionalInstructions}
` : ''}

---

## OUTPUT REQUERIDO

Retorne EXCLUSIVAMENTE um JSON válido no seguinte formato (sem texto adicional):

\`\`\`json
{
  "questao": {
    "enunciado": "Texto completo do enunciado",
    "alternativas": {
      "A": "Texto alternativa A",
      "B": "Texto alternativa B",
      "C": "Texto alternativa C",
      "D": "Texto alternativa D",
      "E": "Texto alternativa E (se aplicável)"
    },
    "gabarito": "LETRA",
    "comentario": "Explicação detalhada"
  },
  "metadados": {
    "area": "${config.area}",
    "tema": "${config.topic}",
    "subtema": "${config.subtopic || ''}",
    "tipo_questao": "${config.questionType}",
    "nivel_bloom": "${config.bloomLevel}",
    "nivel_bloom_justificativa": "Por que este nível",
    "dificuldade_alvo": ${config.difficulty},
    "dificuldade_estimada_irt": 0.0,
    "discriminacao_estimada": 0.0,
    "key_concepts": [],
    "cenario_clinico": "",
    "diagnostico_principal": "",
    "tipo_distratores": {
      "A": "TIPO_DISTRATOR",
      "B": "TIPO_DISTRATOR",
      "C": "TIPO_DISTRATOR (se não for gabarito)",
      "D": "TIPO_DISTRATOR",
      "E": "TIPO_DISTRATOR (se aplicável)"
    },
    "misconceptions_exploradas": [],
    "requires_integration": false,
    "integrations": [],
    "pre_requisitos": [],
    "referencias": []
  },
  "auto_validacao": {
    "resposta_inequivoca": true,
    "distratores_plausiveis": true,
    "sem_pistas_linguisticas": true,
    "nivel_cognitivo_correto": true,
    "acuracia_medica": true,
    "problemas_identificados": [],
    "confianca_geral": 0.0
  }
}
\`\`\`

GERE A QUESTÃO AGORA:
`;
}
```

Este é o segundo arquivo (Parte 2) contendo todos os prompts de LLM. Continuarei com a Parte 3 contendo o pipeline de validação e análise.
