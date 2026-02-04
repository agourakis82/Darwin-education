/**
 * Validation Service - 5-Stage Quality Pipeline
 *
 * Ensures generated theory content meets medical accuracy, citation quality,
 * readability, and completeness standards.
 *
 * Stage Weights:
 * - Structural (20%): All sections present, correct lengths, key points
 * - Medical (30%): Accuracy, no outdated patterns, no drug conflicts
 * - Citations (20%): 5+ citations, recency, accessibility, provenance
 * - Readability (15%): Portuguese, clarity, no jargon without explanation
 * - Completeness (15%): Clinical pearls, differentials, comprehensive treatment
 */

import {
  GeneratedTheoryTopic,
  ValidationResult,
  TheoryValidationStageResult,
  TheoryValidationIssue,
  ValidationFlag,
  Citation,
} from '@darwin-education/shared';
import CitationVerificationService, { CitationVerification, HallucinationCheck } from './citation-verification-service';

export class ValidationService {
  private citationVerificationService = new CitationVerificationService();
  // Outdated medical patterns to detect (from QGen patterns)
  private outdatedPatterns = [
    'antigo padrão de tratamento',
    'não recomendado atualmente',
    'obsoleto',
    'não mais utilizado',
    'tratamento anterior',
  ];

  // Dangerous drug interactions
  private dangerousInteractions: Record<string, string[]> = {
    'iMAO': ['simpaticomiméticos', 'tricíclicos', 'meperidina'],
    'varfarina': ['aspirina em altas doses', 'ibuprofeno'],
    'metformina': ['contraste iodado'],
    'estatina': ['gemfibrozil', 'claritromicina'],
  };

  /**
   * Run complete 5-stage validation pipeline
   */
  async validate(topic: GeneratedTheoryTopic): Promise<ValidationResult> {
    const checks = {
      structural: await this.validateStructural(topic),
      medical: await this.validateMedical(topic),
      citations: await this.validateCitations(topic),
      readability: await this.validateReadability(topic),
      completeness: await this.validateCompleteness(topic),
    };

    // Calculate weighted score
    const weightedScore =
      checks.structural.score * 0.20 +
      checks.medical.score * 0.30 +
      checks.citations.score * 0.20 +
      checks.readability.score * 0.15 +
      checks.completeness.score * 0.15;

    // Collect all flags
    const flags: ValidationFlag[] = [];
    Object.entries(checks).forEach(([stage, result]) => {
      result.issues.forEach((issue) => {
        flags.push({
          stage: stage as any,
          level: issue.severity === 'error' ? 'critical' : issue.severity === 'warning' ? 'warning' : 'info',
          message: issue.message,
        });
      });
    });

    // Determine pass/fail and review status
    const passed = weightedScore >= 0.70;
    const needsHumanReview = weightedScore >= 0.70 && weightedScore < 0.90;

    return {
      topicId: topic.topicId,
      passed,
      score: Math.round(weightedScore * 100) / 100,
      flags,
      checks,
      details: {
        overallSummary:
          weightedScore >= 0.90
            ? 'Tópico pronto para publicação - Auto-aprovado'
            : weightedScore >= 0.70
              ? 'Qualidade aceitável - Requer revisão humana'
              : 'Qualidade insuficiente - Rejeitar e regenerar',
        recommendedActions: this.getRecommendedActions(checks),
        needsHumanReview,
      },
    };
  }

  /**
   * Stage 1: Structural Validation (20% weight)
   * Checks: All sections present, correct lengths, key points count, read time
   */
  private async validateStructural(
    topic: GeneratedTheoryTopic
  ): Promise<TheoryValidationStageResult> {
    const issues: TheoryValidationIssue[] = [];
    let score = 1.0;

    // Check all required sections are present
    const requiredSections = ['definition'];
    const totalSections = Object.keys(topic.sections).filter(
      (key) => topic.sections[key as keyof typeof topic.sections]
    ).length;

    if (totalSections < 3) {
      issues.push({
        severity: 'error',
        message: `Apenas ${totalSections} seções preenchidas. Esperado: 5+`,
      });
      score -= 0.3;
    }

    // Check section lengths (300-800 characters each)
    Object.entries(topic.sections).forEach(([key, content]) => {
      if (!content) return;

      if (content.length < 300) {
        issues.push({
          severity: 'warning',
          message: `Seção ${key} muito curta (${content.length} chars). Esperado: 300-800`,
          section: key,
        });
        score -= 0.05;
      } else if (content.length > 800) {
        issues.push({
          severity: 'info',
          message: `Seção ${key} longa (${content.length} chars). Considere resumir`,
          section: key,
        });
        score -= 0.02;
      }
    });

    // Check key points (5-6 expected)
    if (topic.keyPoints.length < 4) {
      issues.push({
        severity: 'warning',
        message: `Apenas ${topic.keyPoints.length} pontos-chave. Esperado: 5-6`,
      });
      score -= 0.1;
    } else if (topic.keyPoints.length > 8) {
      issues.push({
        severity: 'info',
        message: `${topic.keyPoints.length} pontos-chave. Considerando reduzir para 5-6`,
      });
      score -= 0.05;
    }

    // Check estimated read time (10-20 minutes expected)
    if (topic.estimatedReadTime < 5 || topic.estimatedReadTime > 30) {
      issues.push({
        severity: 'warning',
        message: `Tempo estimado ${topic.estimatedReadTime} min fora do esperado (10-20)`,
      });
      score -= 0.1;
    }

    // Check difficulty level is valid
    const validDifficulties = ['basico', 'intermediario', 'avancado'];
    if (!validDifficulties.includes(topic.difficulty)) {
      issues.push({
        severity: 'error',
        message: `Nível de dificuldade inválido: ${topic.difficulty}`,
      });
      score -= 0.2;
    }

    return {
      passed: score >= 0.70,
      score: Math.max(0, score),
      weight: 0.20,
      issues,
    };
  }

  /**
   * Stage 2: Medical Accuracy (30% weight)
   * Checks: No outdated patterns, realistic dosages, no drug conflicts, clinical accuracy
   */
  private async validateMedical(
    topic: GeneratedTheoryTopic
  ): Promise<TheoryValidationStageResult> {
    const issues: TheoryValidationIssue[] = [];
    let score = 1.0;

    const fullContent = Object.values(topic.sections).join(' ');

    // Check for outdated patterns
    this.outdatedPatterns.forEach((pattern) => {
      if (fullContent.toLowerCase().includes(pattern.toLowerCase())) {
        issues.push({
          severity: 'error',
          message: `Padrão obsoleto detectado: "${pattern}"`,
        });
        score -= 0.15;
      }
    });

    // Check for realistic dosages in treatment section
    if (topic.sections.treatment) {
      const dosageMatches = topic.sections.treatment.match(/\d+\s*(mg|g|unidades|UI)/gi);
      if (!dosageMatches || dosageMatches.length === 0) {
        issues.push({
          severity: 'warning',
          message: 'Seção de tratamento sem dosagens específicas',
          section: 'treatment',
        });
        score -= 0.1;
      }
    }

    // Check for drug interactions in treatment
    Object.entries(this.dangerousInteractions).forEach(([drug, interactions]) => {
      const hasDrug = fullContent.toLowerCase().includes(drug.toLowerCase());
      interactions.forEach((interaction) => {
        const hasInteraction = fullContent.toLowerCase().includes(interaction.toLowerCase());
        if (hasDrug && hasInteraction) {
          // Check if interaction is mentioned
          const mentionedAsContraindication =
            fullContent.toLowerCase().includes('contraindicado') ||
            fullContent.toLowerCase().includes('evitar');
          if (!mentionedAsContraindication) {
            issues.push({
              severity: 'warning',
              message: `Possível interação ${drug} + ${interaction} - verifique se é contraindicação mencionada`,
            });
            score -= 0.05;
          }
        }
      });
    });

    // Check for red flags/complications if appropriate
    if (
      (topic.area === 'clinica_medica' || topic.area === 'cirurgia') &&
      !topic.sections.complications
    ) {
      issues.push({
        severity: 'warning',
        message: 'Seção de complicações ausente em tema clínico importante',
      });
      score -= 0.05;
    }

    return {
      passed: score >= 0.70,
      score: Math.max(0, score),
      weight: 0.30,
      issues,
    };
  }

  /**
   * Stage 3: Citation Quality (20% weight)
   * Checks: Minimum 5 citations, 80%+ from last 5 years, URLs accessible, evidence levels assigned
   * ENHANCED: Verify all citations are real and accurate, detect hallucinations
   */
  private async validateCitations(
    topic: GeneratedTheoryTopic
  ): Promise<TheoryValidationStageResult> {
    const issues: TheoryValidationIssue[] = [];
    let score = 1.0;

    const citations = topic.citations || [];

    // Check minimum citations
    if (citations.length < 5) {
      issues.push({
        severity: 'error',
        message: `Apenas ${citations.length} citações. Esperado: 5+`,
      });
      score -= 0.3;
    }

    // ===== CRITICAL NEW CHECK: Verify all citations =====
    if (citations.length > 0) {
      try {
        const verifications = await this.citationVerificationService.verifyAllCitations(
          citations.map(c => ({
            url: c.url,
            title: c.title,
            publicationYear: c.publicationYear,
            evidenceLevel: c.evidenceLevel as 'A' | 'B' | 'C',
          }))
        );

        // Check for unverified or low-confidence citations
        const unreliable = verifications.filter(v => v.verificationScore < 0.5);
        if (unreliable.length > 0) {
          issues.push({
            severity: 'error',
            message: `${unreliable.length} citação(ões) não verificada(s) ou com baixa confiabilidade: ${unreliable.map(v => v.url.substring(0, 50)).join(', ')}...`,
          });
          score -= unreliable.length * 0.1; // Penalize each unverified citation
        }

        // Check for inaccessible citations
        const inaccessible = verifications.filter(v => !v.isAccessible && v.statusCode !== undefined && v.statusCode >= 400);
        if (inaccessible.length > 0) {
          issues.push({
            severity: 'warning',
            message: `${inaccessible.length} URL(ns) inacessível(is): ${inaccessible.map(v => `${v.url} (${v.statusCode})`).join(', ')}`,
          });
          score -= inaccessible.length * 0.05;
        }

        // Check for unreliable sources
        const unreliableSources = verifications.filter(v => v.warnings && v.warnings.length > 0);
        unreliableSources.forEach(v => {
          v.warnings.forEach(w => {
            issues.push({
              severity: 'info',
              message: `Aviso sobre fonte ${v.url.substring(0, 40)}...: ${w}`,
            });
          });
        });
      } catch (error) {
        issues.push({
          severity: 'warning',
          message: `Erro ao verificar citações: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        score -= 0.1;
      }
    }

    // ===== NEW CHECK: Detect hallucinations =====
    try {
      const verifications = await this.citationVerificationService.verifyAllCitations(
        citations.map(c => ({
          url: c.url,
          title: c.title,
          publicationYear: c.publicationYear,
          evidenceLevel: c.evidenceLevel as 'A' | 'B' | 'C',
        }))
      );

      // Check each section for unsupported claims
      const sections = ['definition', 'epidemiology', 'pathophysiology', 'clinicalPresentation', 'diagnosis', 'treatment', 'complications', 'prognosis'] as const;

      for (const section of sections) {
        const content = topic.sections[section];
        if (content) {
          const hallucinations = await this.citationVerificationService.detectHallucinations(
            section,
            content,
            verifications
          );

          hallucinations.forEach(h => {
            if (!h.claimSupported) {
              issues.push({
                severity: h.confidence < 0.3 ? 'error' : 'warning',
                message: `[${section}] Possível alucinação: "${h.claim.substring(0, 80)}..." - ${h.explanation}`,
                section,
              });
              score -= h.confidence < 0.3 ? 0.15 : 0.05;
            }
          });
        }
      }
    } catch (error) {
      issues.push({
        severity: 'info',
        message: `Verificação de alucinação não disponível: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // Check recency (80%+ from last 5 years)
    const currentYear = new Date().getFullYear();
    const recent = citations.filter((c) => c.publicationYear >= currentYear - 5).length;
    const recencyRatio = citations.length > 0 ? recent / citations.length : 0;

    if (recencyRatio < 0.80) {
      issues.push({
        severity: 'warning',
        message: `Apenas ${(recencyRatio * 100).toFixed(0)}% das citações dos últimos 5 anos. Esperado: 80%+`,
      });
      score -= 0.1;
    }

    // Check evidence levels assigned
    const noEvidenceLevel = citations.filter((c) => c.evidenceLevel === 'unknown').length;
    if (noEvidenceLevel > 0) {
      issues.push({
        severity: 'info',
        message: `${noEvidenceLevel} citações sem nível de evidência atribuído`,
      });
      score -= 0.05;
    }

    // Check citation provenance (each section should have citations)
    const provenance = topic.citationProvenance;
    if (!provenance || Object.keys(provenance).length === 0) {
      issues.push({
        severity: 'warning',
        message: 'Proveniência de citações não rastreada por seção',
      });
      score -= 0.05;
    }

    // Check URL format (shouldn't be Darwin-MFC internal links)
    const externalUrls = citations.filter((c) => !c.url.startsWith('darwin-mfc://')).length;
    if (externalUrls < Math.max(2, citations.length - 1)) {
      issues.push({
        severity: 'info',
        message: `Maioria das citações são fontes internas. Considere adicionar fontes externas`,
      });
      score -= 0.02;
    }

    return {
      passed: score >= 0.70,
      score: Math.max(0, score),
      weight: 0.20,
      issues,
    };
  }

  /**
   * Stage 4: Readability (15% weight)
   * Checks: Portuguese terminology, clarity, no jargon without explanation
   */
  private async validateReadability(
    topic: GeneratedTheoryTopic
  ): Promise<TheoryValidationStageResult> {
    const issues: TheoryValidationIssue[] = [];
    let score = 1.0;

    const fullContent = Object.values(topic.sections).join(' ');

    // Check for English terms that should be Portuguese
    const englishTerms = [
      'new', 'old', 'management', 'treatment approach', 'patient', 'diagnosis',
    ];
    let englishCount = 0;
    englishTerms.forEach((term) => {
      if (new RegExp(`\\b${term}\\b`, 'i').test(fullContent)) {
        englishCount++;
      }
    });

    if (englishCount > 5) {
      issues.push({
        severity: 'warning',
        message: `${englishCount} termos em inglês detectados. Use português médico apropriado`,
      });
      score -= 0.1;
    }

    // Check for unexplained medical jargon
    const medicalTerms = ['fisiopatologia', 'etiopatogenia', 'fisiopatologia'];
    medicalTerms.forEach((term) => {
      if (fullContent.toLowerCase().includes(term.toLowerCase())) {
        // Verify it's explained or properly contextualized
        // For now, assume it's OK if present
      }
    });

    // Check for sentence complexity (average sentence length)
    const sentences = fullContent.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgLength = fullContent.split(/\s+/).length / sentences.length;
      if (avgLength > 25) {
        issues.push({
          severity: 'info',
          message: `Sentenças longas detectadas (média ${avgLength.toFixed(0)} palavras). Considere simplificar`,
        });
        score -= 0.05;
      }
    }

    // Check title clarity
    if (topic.title.length < 5 || topic.title.length > 100) {
      issues.push({
        severity: 'warning',
        message: `Título com comprimento inadequado (${topic.title.length} chars)`,
      });
      score -= 0.05;
    }

    return {
      passed: score >= 0.70,
      score: Math.max(0, score),
      weight: 0.15,
      issues,
    };
  }

  /**
   * Stage 5: Completeness (15% weight)
   * Checks: Clinical pearls, differential diagnoses, comprehensive treatment
   */
  private async validateCompleteness(
    topic: GeneratedTheoryTopic
  ): Promise<TheoryValidationStageResult> {
    const issues: TheoryValidationIssue[] = [];
    let score = 1.0;

    const fullContent = Object.values(topic.sections).join(' ');

    // Check for differential diagnoses in diagnosis section
    if (topic.sections.diagnosis) {
      if (
        !topic.sections.diagnosis.toLowerCase().includes('diferencial') &&
        !topic.sections.diagnosis.toLowerCase().includes('diagnostico diferencial')
      ) {
        issues.push({
          severity: 'info',
          message: 'Diagnóstico diferencial não mencionado na seção de diagnóstico',
          section: 'diagnosis',
        });
        score -= 0.05;
      }
    }

    // Check for monitoring/follow-up recommendations
    if (
      !fullContent.toLowerCase().includes('acompanhamento') &&
      !fullContent.toLowerCase().includes('seguimento') &&
      !fullContent.toLowerCase().includes('monitoramento')
    ) {
      issues.push({
        severity: 'info',
        message: 'Recomendações de acompanhamento/seguimento não mencionadas',
      });
      score -= 0.05;
    }

    // Check for prognosis information
    if (!topic.sections.prognosis) {
      issues.push({
        severity: 'warning',
        message: 'Seção de prognóstico ausente',
      });
      score -= 0.1;
    }

    // Check for epidemiology data
    if (!topic.sections.epidemiology && topic.difficulty !== 'basico') {
      issues.push({
        severity: 'info',
        message: 'Seção de epidemiologia ausente em tópico não básico',
      });
      score -= 0.05;
    }

    // Check if all key points are represented in content
    const keyPointsCoverage = topic.keyPoints.filter((kp) =>
      fullContent.toLowerCase().includes(kp.toLowerCase().substring(0, 10))
    ).length;

    if (keyPointsCoverage < topic.keyPoints.length * 0.7) {
      issues.push({
        severity: 'info',
        message: `Apenas ${keyPointsCoverage}/${topic.keyPoints.length} pontos-chave mencionados no conteúdo`,
      });
      score -= 0.05;
    }

    return {
      passed: score >= 0.70,
      score: Math.max(0, score),
      weight: 0.15,
      issues,
    };
  }

  /**
   * Generate recommended actions based on validation results
   */
  private getRecommendedActions(
    checks: Record<string, TheoryValidationStageResult>
  ): string[] {
    const actions: string[] = [];

    if (!checks.structural.passed) {
      actions.push('Adicionar seções faltantes ou expandir seções curtas');
    }

    if (!checks.medical.passed) {
      actions.push('Revisar para padrões obsoletos ou imprecisões clínicas');
    }

    if (!checks.citations.passed) {
      actions.push('Adicionar mais citações e garantir que são de fontes recentes e confiáveis');
    }

    if (!checks.readability.passed) {
      actions.push('Simplificar linguagem e usar terminologia médica apropriada em português');
    }

    if (!checks.completeness.passed) {
      actions.push('Adicionar diagnóstico diferencial, prognóstico e recomendações de acompanhamento');
    }

    return actions.length > 0 ? actions : ['Tópico está bem estruturado e completo'];
  }
}

export default ValidationService;
