/**
 * Theory Generation Prompt Builder
 *
 * Constructs context-rich prompts for theory content generation
 * Based on QGen prompt engineering patterns
 */

import {
  GenerationRequest,
  ResearchResult,
  GeneratedTheoryTopic,
  PromptContext,
} from '@darwin-education/shared';

export class TheoryPromptBuilder {
  /**
   * Build complete generation prompt with context
   */
  buildGenerationPrompt(context: PromptContext): string {
    const {
      request,
      research,
      baseContent,
      examples,
      darwinMFCData,
    } = context;

    return `
${this.buildSystemPrompt()}

${this.buildContextSection(request, research, darwinMFCData)}

${this.buildExamplesSection(examples)}

${this.buildTaskSection(request)}

${this.buildConstraintsSection()}
`;
  }

  /**
   * System prompt defining the AI's role
   */
  private buildSystemPrompt(): string {
    return `## SISTEMA
Você é um educador médico especializado em preparação para ENAMED.
Sua tarefa é gerar conteúdo teórico de alta qualidade baseado em evidências.

Princípios:
- Precisão médica acima de tudo
- Conteúdo baseado em diretrizes brasileiras e internacionais
- Linguagem clara e acessível para estudantes de medicina
- Estrutura consistente e bem organizada
- Integração com citações e evidências
`;
  }

  /**
   * Context section with research data
   */
  private buildContextSection(
    request: GenerationRequest,
    research: ResearchResult,
    darwinMFCData?: any
  ): string {
    let context = `## CONTEXTO DO TÓPICO

Título: ${request.topicTitle}
Área: ${this.getAreaLabel(request.area)}
Dificuldade Alvo: ${this.getDifficultyLabel(request.targetDifficulty || 'intermediario')}
`;

    if (darwinMFCData) {
      context += `

### Dados Darwin-MFC
${darwinMFCData.definition ? `**Definição Base:** ${darwinMFCData.definition.substring(0, 200)}...` : ''}
${darwinMFCData.relatedDiseases ? `**Doenças Relacionadas:** ${darwinMFCData.relatedDiseases.join(', ')}` : ''}
`;
    }

    if (research.citations.length > 0) {
      context += `

### Citações Disponíveis
${research.citations
  .slice(0, 5)
  .map(
    (c) =>
      `- [${c.source}] ${c.title} (${c.evidenceLevel}, ${c.publicationYear})`
  )
  .join('\n')}
`;
    }

    return context;
  }

  /**
   * Examples section with few-shot learning
   */
  private buildExamplesSection(examples: GeneratedTheoryTopic[]): string {
    if (examples.length === 0) {
      return '';
    }

    return `## EXEMPLOS DE QUALIDADE

### Exemplo 1: ${examples[0]?.title || 'Exemplo'}
**Estrutura esperada:**
- Definição: 300-500 caracteres, clara e precisa
- Epidemiologia: dados relevantes quando disponíveis
- Fisiopatologia: mecanismos explicados para estudantes
- Diagnóstico: critérios e investigações
- Tratamento: recomendações baseadas em evidências
- 5-6 pontos-chave memoráveis

**Tom:** Profissional mas acessível, sem jargão desnecessário
`;
  }

  /**
   * Task definition section
   */
  private buildTaskSection(request: GenerationRequest): string {
    return `## TAREFA

Gere conteúdo teórico completo estruturado em 8 seções:

1. **Definição** (400-600 caracteres)
   - Explicação concisa e precisa
   - Contexto clínico importante

2. **Epidemiologia** (300-400 caracteres)
   - Prevalência, incidência
   - Grupos de risco

3. **Fisiopatologia** (400-600 caracteres)
   - Mecanismos fisiopatológicos
   - Explicação compreensível

4. **Apresentação Clínica** (400-600 caracteres)
   - Sinais e sintomas
   - Apresentações atípicas se relevante

5. **Diagnóstico** (400-600 caracteres)
   - Critérios diagnósticos
   - Investigações importantes
   - Diagnóstico diferencial

6. **Tratamento** (400-600 caracteres)
   - Primeira linha
   - Alternativas
   - Doses e duração quando aplicável

7. **Complicações** (300-400 caracteres)
   - Complicações potenciais
   - Bandeiras vermelhas

8. **Prognóstico** (300-400 caracteres)
   - Evolução esperada
   - Fatores prognósticos

Inclua também:
- **5-6 pontos-chave:** Elementos memoráveis para ENAMED
- **Tempo de leitura estimado:** 10-20 minutos

IMPORTANTE: Responda em JSON válido com exatamente esta estrutura:
{
  "topicId": "string-kebab-case",
  "title": "string",
  "description": "string",
  "sections": {
    "definition": "string",
    "epidemiology": "string",
    "pathophysiology": "string",
    "clinicalPresentation": "string",
    "diagnosis": "string",
    "treatment": "string",
    "complications": "string",
    "prognosis": "string"
  },
  "keyPoints": ["string", "string", ...],
  "estimatedReadTime": number
}
`;
  }

  /**
   * Constraints section
   */
  private buildConstraintsSection(): string {
    return `## RESTRIÇÕES

1. **Linguagem:** Português brasileiro, terminologia médica consistente
2. **Comprimento:** Respeite os limites de caracteres para cada seção
3. **Precisão:** Use apenas informações clinicamente precisas
4. **Formato:** JSON válido somente
5. **Evite:**
   - Padrões obsoletos de tratamento
   - Interações medicamentosas perigosas sem mencionar
   - Generalizações excessivas
   - Termos não explicados
6. **Priorize:**
   - Conteúdo baseado em diretrizes
   - Relevância para ENAMED
   - Clareza para estudantes de medicina
   - Integração com citações fornecidas

## RESPOSTA

Forneça apenas o JSON estruturado acima, sem texto adicional.
`;
  }

  /**
   * Get area label
   */
  private getAreaLabel(area: string): string {
    const labels: Record<string, string> = {
      clinica_medica: 'Clínica Médica',
      cirurgia: 'Cirurgia',
      pediatria: 'Pediatria',
      ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
      saude_coletiva: 'Saúde Coletiva',
    };
    return labels[area] || area;
  }

  /**
   * Get difficulty label
   */
  private getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      basico: 'Básico',
      intermediario: 'Intermediário',
      avancado: 'Avançado',
    };
    return labels[difficulty] || difficulty;
  }
}

export const theoryPromptBuilder = new TheoryPromptBuilder();
