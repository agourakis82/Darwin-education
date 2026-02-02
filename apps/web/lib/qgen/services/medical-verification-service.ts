/**
 * Medical Verification Service
 * ============================
 *
 * Verifies medical accuracy of generated questions using LLM-based
 * fact-checking and pattern matching for dangerous/outdated information.
 */

/**
 * Verification result for a medical claim
 */
export interface ClaimVerificationResult {
  claim: string;
  isVerified: boolean;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  evidence: string[];
  concerns: string[];
  category: 'FACTUAL' | 'TREATMENT' | 'DIAGNOSIS' | 'PATHOPHYSIOLOGY' | 'EPIDEMIOLOGY';
}

/**
 * Drug interaction check result
 */
export interface DrugInteractionResult {
  medications: string[];
  hasInteractions: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'SEVERE' | 'MODERATE' | 'MILD' | 'NONE';
    description: string;
  }>;
  contraindications: Array<{
    drug: string;
    condition: string;
    severity: 'ABSOLUTE' | 'RELATIVE';
    description: string;
  }>;
}

/**
 * Clinical scenario validation result
 */
export interface ScenarioValidationResult {
  isPlausible: boolean;
  plausibilityScore: number; // 0-1
  issues: Array<{
    type: 'INCONSISTENCY' | 'IMPOSSIBILITY' | 'UNUSUAL' | 'OUTDATED';
    description: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
  }>;
  suggestions: string[];
}

/**
 * Full medical verification result
 */
export interface MedicalVerificationResult {
  overallScore: number; // 0-1
  isAccurate: boolean;
  claimVerifications: ClaimVerificationResult[];
  drugCheck?: DrugInteractionResult;
  scenarioValidation?: ScenarioValidationResult;
  outdatedTerms: Array<{
    term: string;
    currentTerm: string;
    context: string;
  }>;
  dangerousPatterns: Array<{
    pattern: string;
    reason: string;
    severity: 'CRITICAL' | 'WARNING';
  }>;
  summary: string;
}

/**
 * Common outdated medical terms to check
 */
const OUTDATED_TERMS: Record<string, { current: string; year?: number }> = {
  // Terminology updates
  'diabetes mellitus insulino-dependente': { current: 'diabetes tipo 1', year: 2003 },
  'diabetes mellitus não-insulino-dependente': { current: 'diabetes tipo 2', year: 2003 },
  'retardo mental': { current: 'deficiência intelectual', year: 2013 },
  'demência senil': { current: 'doença de Alzheimer ou demência por outras causas', year: 2000 },
  'surdez': { current: 'deficiência auditiva', year: 2010 },
  'cegueira': { current: 'deficiência visual', year: 2010 },
  'mongolismo': { current: 'síndrome de Down', year: 1970 },
  'lepra': { current: 'hanseníase', year: 1995 },
  'aleijado': { current: 'pessoa com deficiência', year: 2015 },
  'doente mental': { current: 'pessoa com transtorno mental', year: 2015 },
  'toxemia gravídica': { current: 'pré-eclâmpsia', year: 2000 },
  'eclampsia gravídica': { current: 'eclâmpsia', year: 2000 },
  'placenta prévia central': { current: 'placenta prévia total', year: 2005 },
  'cardiopatia reumática': { current: 'doença cardíaca reumática', year: 2000 },

  // Drug names
  'propranolol para hipertireoidismo': { current: 'beta-bloqueador (atenolol, metoprolol preferidos)', year: 2015 },

  // Procedure terminology
  'revascularização miocárdica': { current: 'cirurgia de revascularização do miocárdio (CRM)', year: 2010 },
};

/**
 * Dangerous treatment patterns to flag
 */
const DANGEROUS_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  severity: 'CRITICAL' | 'WARNING';
}> = [
  {
    pattern: /aspirina.*para.*crian[çc]as?.*com.*febre/i,
    reason: 'Risco de síndrome de Reye - AAS contraindicado em crianças com febre viral',
    severity: 'CRITICAL',
  },
  {
    pattern: /metoclopramida.*crian[çc]as?.*menores?\s*de?\s*1\s*ano/i,
    reason: 'Metoclopramida contraindicada em menores de 1 ano - risco de efeitos extrapiramidais',
    severity: 'CRITICAL',
  },
  {
    pattern: /dipirona.*crian[çc]as?.*menores?\s*de?\s*3\s*meses/i,
    reason: 'Dipirona contraindicada em menores de 3 meses',
    severity: 'CRITICAL',
  },
  {
    pattern: /cetoacidose.*tratar.*com.*insulina.*regular.*EV.*sem.*monitorar.*pot[áa]ssio/i,
    reason: 'Insulina em CAD deve ser acompanhada de monitorização de potássio sérico',
    severity: 'CRITICAL',
  },
  {
    pattern: /sangramento.*digestivo.*usar.*AINEs/i,
    reason: 'AINEs são contraindicados em sangramento digestivo ativo',
    severity: 'CRITICAL',
  },
  {
    pattern: /gestante.*usar.*IECA|IECA.*para.*gestante/i,
    reason: 'IECAs são contraindicados na gestação - risco de malformações fetais',
    severity: 'CRITICAL',
  },
  {
    pattern: /gestante.*usar.*BRA|BRA.*para.*gestante/i,
    reason: 'BRAs são contraindicados na gestação',
    severity: 'CRITICAL',
  },
  {
    pattern: /meningite.*iniciar.*antibi[óo]tico.*ap[óo]s.*punção/i,
    reason: 'Em meningite bacteriana suspeita, ATB deve ser iniciado imediatamente, não aguardar punção',
    severity: 'CRITICAL',
  },
  {
    pattern: /infarto.*usar.*trombol[íi]tico.*após.*24\s*horas/i,
    reason: 'Trombólise no IAM tem janela de até 12 horas, idealmente até 3 horas',
    severity: 'CRITICAL',
  },
  {
    pattern: /apendicite.*observar.*sem.*cirurgia/i,
    reason: 'Apendicite aguda requer tratamento cirúrgico',
    severity: 'WARNING',
  },
  {
    pattern: /hemorragia.*subaracn[óo]ide.*punção.*lombar.*primeira.*escolha/i,
    reason: 'TC de crânio é exame inicial de escolha para HSA, não punção lombar',
    severity: 'WARNING',
  },
  {
    pattern: /varfarina.*iniciar.*dose.*alta/i,
    reason: 'Varfarina deve ser iniciada em doses baixas com ajuste gradual',
    severity: 'WARNING',
  },
];

/**
 * Medical Verification Service
 */
export class MedicalVerificationService {
  private grokApiKey: string;
  private grokApiUrl: string;

  constructor() {
    this.grokApiKey = process.env.GROK_API_KEY || '';
    this.grokApiUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1';
  }

  /**
   * Perform full medical verification of a generated question
   */
  async verifyQuestion(
    questionText: string,
    options: string[],
    correctAnswer: string,
    explanation?: string
  ): Promise<MedicalVerificationResult> {
    const fullText = `${questionText}\n${options.join('\n')}\n${explanation || ''}`;

    // Run parallel checks
    const [
      outdatedTerms,
      dangerousPatterns,
      claimVerifications,
      scenarioValidation,
    ] = await Promise.all([
      this.checkOutdatedTerms(fullText),
      this.checkDangerousPatterns(fullText),
      this.verifyMedicalClaims(questionText, options, correctAnswer),
      this.validateClinicalScenario(questionText),
    ]);

    // Check for drug interactions if medications are mentioned
    const medications = this.extractMedications(fullText);
    let drugCheck: DrugInteractionResult | undefined;
    if (medications.length > 1) {
      drugCheck = await this.checkDrugInteractions(medications);
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      outdatedTerms,
      dangerousPatterns,
      claimVerifications,
      scenarioValidation,
      drugCheck,
    });

    return {
      overallScore,
      isAccurate: overallScore >= 0.7 && dangerousPatterns.length === 0,
      claimVerifications,
      drugCheck,
      scenarioValidation,
      outdatedTerms,
      dangerousPatterns,
      summary: this.generateSummary(overallScore, dangerousPatterns, outdatedTerms),
    };
  }

  /**
   * Verify individual medical claims in the question
   */
  async verifyMedicalClaims(
    questionText: string,
    options: string[],
    correctAnswer: string
  ): Promise<ClaimVerificationResult[]> {
    const claims = this.extractClaims(questionText, options, correctAnswer);

    if (claims.length === 0) {
      return [];
    }

    try {
      const response = await this.callLLMForVerification(claims);
      return response;
    } catch (error) {
      console.error('Error verifying claims:', error);
      // Return unverified claims on error
      return claims.map(claim => ({
        claim,
        isVerified: false,
        confidence: 'LOW' as const,
        evidence: [],
        concerns: ['Não foi possível verificar automaticamente'],
        category: 'FACTUAL' as const,
      }));
    }
  }

  /**
   * Check for drug interactions
   */
  async checkDrugInteractions(medications: string[]): Promise<DrugInteractionResult> {
    // For now, use a heuristic approach with known interactions
    // In production, this would call a drug interaction API
    const interactions = this.checkKnownInteractions(medications);
    const contraindications = this.checkKnownContraindications(medications);

    return {
      medications,
      hasInteractions: interactions.length > 0 || contraindications.length > 0,
      interactions,
      contraindications,
    };
  }

  /**
   * Validate the clinical scenario for plausibility
   */
  async validateClinicalScenario(questionText: string): Promise<ScenarioValidationResult> {
    const issues: ScenarioValidationResult['issues'] = [];
    const suggestions: string[] = [];

    // Extract clinical elements
    const ageMatch = questionText.match(/(\d+)\s*(anos?|meses?|dias?)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    const ageUnit = ageMatch ? ageMatch[2].toLowerCase() : null;

    // Check for age-related inconsistencies
    if (age !== null && ageUnit) {
      const ageIssues = this.checkAgeConsistency(questionText, age, ageUnit);
      issues.push(...ageIssues);
    }

    // Check for vital sign consistency
    const vitalIssues = this.checkVitalSignConsistency(questionText);
    issues.push(...vitalIssues);

    // Check for timing inconsistencies
    const timingIssues = this.checkTimingConsistency(questionText);
    issues.push(...timingIssues);

    // Calculate plausibility score
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const plausibilityScore = Math.max(0, 1 - (criticalCount * 0.3) - (warningCount * 0.1));

    return {
      isPlausible: criticalCount === 0 && plausibilityScore >= 0.7,
      plausibilityScore,
      issues,
      suggestions,
    };
  }

  /**
   * Check for outdated medical terms
   */
  async checkOutdatedTerms(text: string): Promise<MedicalVerificationResult['outdatedTerms']> {
    const found: MedicalVerificationResult['outdatedTerms'] = [];
    const lowerText = text.toLowerCase();

    for (const [outdated, info] of Object.entries(OUTDATED_TERMS)) {
      if (lowerText.includes(outdated.toLowerCase())) {
        found.push({
          term: outdated,
          currentTerm: info.current,
          context: this.extractContext(text, outdated),
        });
      }
    }

    return found;
  }

  /**
   * Check for dangerous treatment patterns
   */
  async checkDangerousPatterns(text: string): Promise<MedicalVerificationResult['dangerousPatterns']> {
    const found: MedicalVerificationResult['dangerousPatterns'] = [];

    for (const { pattern, reason, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(text)) {
        found.push({ pattern: pattern.source, reason, severity });
      }
    }

    return found;
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  private extractClaims(
    questionText: string,
    options: string[],
    correctAnswer: string
  ): string[] {
    const claims: string[] = [];

    // The correct answer usually contains a medical claim
    claims.push(correctAnswer);

    // Extract claims from question stem
    const sentencePattern = /[^.!?]+[.!?]/g;
    const sentences = questionText.match(sentencePattern) || [];

    for (const sentence of sentences) {
      // Look for declarative medical statements
      if (this.isMedicalClaim(sentence)) {
        claims.push(sentence.trim());
      }
    }

    return claims.slice(0, 5); // Limit to 5 claims for efficiency
  }

  private isMedicalClaim(sentence: string): boolean {
    const claimIndicators = [
      /é caracterizada por/i,
      /é causada por/i,
      /é tratada com/i,
      /apresenta.*como/i,
      /está associada?/i,
      /tem como sintomas?/i,
      /o diagnóstico/i,
      /a conduta/i,
      /o tratamento/i,
      /a fisiopatologia/i,
    ];

    return claimIndicators.some(pattern => pattern.test(sentence));
  }

  private extractMedications(text: string): string[] {
    // Common medication patterns
    const medicationPatterns = [
      /\b(metformina|glibenclamida|insulina|sitagliptina)\b/gi,
      /\b(enalapril|captopril|losartana|valsartana|amlodipina)\b/gi,
      /\b(atenolol|propranolol|carvedilol|bisoprolol|metoprolol)\b/gi,
      /\b(hidroclorotiazida|furosemida|espironolactona|indapamida)\b/gi,
      /\b(omeprazol|pantoprazol|esomeprazol|ranitidina)\b/gi,
      /\b(amoxicilina|azitromicina|ciprofloxacino|ceftriaxona)\b/gi,
      /\b(dipirona|paracetamol|ibuprofeno|diclofenaco|AAS)\b/gi,
      /\b(prednisona|prednisolona|dexametasona|hidrocortisona)\b/gi,
      /\b(varfarina|heparina|enoxaparina|rivaroxabana)\b/gi,
      /\b(levotiroxina|metimazol|propiltiouracil)\b/gi,
      /\b(morfina|tramadol|codeína|fentanil)\b/gi,
      /\b(diazepam|clonazepam|lorazepam|midazolam)\b/gi,
      /\b(fluoxetina|sertralina|paroxetina|escitalopram)\b/gi,
      /\b(haloperidol|risperidona|olanzapina|quetiapina)\b/gi,
    ];

    const medications = new Set<string>();

    for (const pattern of medicationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(med => medications.add(med.toLowerCase()));
      }
    }

    return Array.from(medications);
  }

  private checkKnownInteractions(medications: string[]): DrugInteractionResult['interactions'] {
    const interactions: DrugInteractionResult['interactions'] = [];
    const meds = medications.map(m => m.toLowerCase());

    // Known interaction pairs
    const knownInteractions: Array<{
      drugs: [string, string];
      severity: DrugInteractionResult['interactions'][0]['severity'];
      description: string;
    }> = [
      {
        drugs: ['varfarina', 'aspirina'],
        severity: 'SEVERE',
        description: 'Aumento do risco de sangramento',
      },
      {
        drugs: ['enalapril', 'espironolactona'],
        severity: 'MODERATE',
        description: 'Risco de hipercalemia',
      },
      {
        drugs: ['metformina', 'contraste iodado'],
        severity: 'MODERATE',
        description: 'Risco de acidose láctica',
      },
      {
        drugs: ['digoxina', 'amiodarona'],
        severity: 'SEVERE',
        description: 'Aumento dos níveis de digoxina',
      },
      {
        drugs: ['fluoxetina', 'tramadol'],
        severity: 'SEVERE',
        description: 'Risco de síndrome serotoninérgica',
      },
      {
        drugs: ['lítio', 'diuréticos'],
        severity: 'MODERATE',
        description: 'Aumento dos níveis de lítio',
      },
    ];

    for (const interaction of knownInteractions) {
      const [drug1, drug2] = interaction.drugs;
      if (meds.includes(drug1) && meds.includes(drug2)) {
        interactions.push({
          drug1,
          drug2,
          severity: interaction.severity,
          description: interaction.description,
        });
      }
    }

    return interactions;
  }

  private checkKnownContraindications(
    medications: string[]
  ): DrugInteractionResult['contraindications'] {
    // This would be expanded with actual contraindication database
    // For now, returning empty array
    return [];
  }

  private checkAgeConsistency(
    text: string,
    age: number,
    unit: string
  ): ScenarioValidationResult['issues'] {
    const issues: ScenarioValidationResult['issues'] = [];

    // Convert to months for comparison
    let ageInMonths = age;
    if (unit.includes('ano')) {
      ageInMonths = age * 12;
    } else if (unit.includes('dia')) {
      ageInMonths = age / 30;
    }

    // Check for age-inappropriate conditions
    if (ageInMonths < 12) {
      // Infant
      if (/infarto agudo do miocárdio/i.test(text)) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: 'IAM é extremamente raro em lactentes',
          severity: 'CRITICAL',
        });
      }
      if (/menopausa/i.test(text)) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: 'Menopausa não ocorre em lactentes',
          severity: 'CRITICAL',
        });
      }
    }

    if (ageInMonths > 600) {
      // > 50 years
      if (/bronquiolite/i.test(text) && !/bronquiolite obliterante/i.test(text)) {
        issues.push({
          type: 'UNUSUAL',
          description: 'Bronquiolite viral é típica de lactentes, não de adultos',
          severity: 'WARNING',
        });
      }
    }

    return issues;
  }

  private checkVitalSignConsistency(text: string): ScenarioValidationResult['issues'] {
    const issues: ScenarioValidationResult['issues'] = [];

    // Extract vital signs
    const bpMatch = text.match(/PA\s*[:=]?\s*(\d+)\s*[xX\/]\s*(\d+)/);
    const hrMatch = text.match(/FC\s*[:=]?\s*(\d+)/);

    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);

      // Check for impossible values
      if (systolic < 40 || systolic > 300) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: `PA sistólica ${systolic} mmHg é impossível`,
          severity: 'CRITICAL',
        });
      }
      if (diastolic < 20 || diastolic > 200) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: `PA diastólica ${diastolic} mmHg é impossível`,
          severity: 'CRITICAL',
        });
      }
      if (systolic <= diastolic) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: 'PA sistólica deve ser maior que diastólica',
          severity: 'CRITICAL',
        });
      }
    }

    if (hrMatch) {
      const hr = parseInt(hrMatch[1]);
      if (hr < 20 || hr > 300) {
        issues.push({
          type: 'IMPOSSIBILITY',
          description: `FC ${hr} bpm é impossível`,
          severity: 'CRITICAL',
        });
      }
    }

    return issues;
  }

  private checkTimingConsistency(text: string): ScenarioValidationResult['issues'] {
    const issues: ScenarioValidationResult['issues'] = [];

    // Check for temporal inconsistencies
    if (/há\s*(\d+)\s*horas?/.test(text) && /há\s*(\d+)\s*dias?/.test(text)) {
      const hoursMatch = text.match(/há\s*(\d+)\s*horas?/);
      const daysMatch = text.match(/há\s*(\d+)\s*dias?/);

      if (hoursMatch && daysMatch) {
        const hours = parseInt(hoursMatch[1]);
        const days = parseInt(daysMatch[1]);

        // Check if hours reference is newer than days reference for different symptoms
        // This is a simplified check - would need context analysis for accuracy
      }
    }

    return issues;
  }

  private extractContext(text: string, term: string): string {
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + term.length + 50);

    return `...${text.slice(start, end)}...`;
  }

  private async callLLMForVerification(claims: string[]): Promise<ClaimVerificationResult[]> {
    if (!this.grokApiKey) {
      // Return unverified if no API key
      return claims.map(claim => ({
        claim,
        isVerified: false,
        confidence: 'LOW' as const,
        evidence: [],
        concerns: ['API key não configurada'],
        category: 'FACTUAL' as const,
      }));
    }

    const prompt = `Você é um médico especialista verificando afirmações médicas.
Para cada afirmação abaixo, determine se é medicamente correta.

Afirmações:
${claims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Responda em JSON com o seguinte formato:
{
  "verifications": [
    {
      "claim_index": 1,
      "is_verified": true|false,
      "confidence": "HIGH"|"MODERATE"|"LOW",
      "evidence": ["evidência 1", "evidência 2"],
      "concerns": ["preocupação 1"] (se houver),
      "category": "FACTUAL"|"TREATMENT"|"DIAGNOSIS"|"PATHOPHYSIOLOGY"|"EPIDEMIOLOGY"
    }
  ]
}`;

    try {
      const response = await fetch(`${this.grokApiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.grokApiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: 'Você é um verificador de fatos médicos.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.verifications.map((v: {
        claim_index: number;
        is_verified: boolean;
        confidence: string;
        evidence: string[];
        concerns: string[];
        category: string;
      }, i: number) => ({
        claim: claims[v.claim_index - 1] || claims[i],
        isVerified: v.is_verified,
        confidence: v.confidence as ClaimVerificationResult['confidence'],
        evidence: v.evidence || [],
        concerns: v.concerns || [],
        category: v.category as ClaimVerificationResult['category'],
      }));
    } catch (error) {
      console.error('LLM verification error:', error);
      return claims.map(claim => ({
        claim,
        isVerified: false,
        confidence: 'LOW' as const,
        evidence: [],
        concerns: ['Erro na verificação automática'],
        category: 'FACTUAL' as const,
      }));
    }
  }

  private calculateOverallScore(results: {
    outdatedTerms: MedicalVerificationResult['outdatedTerms'];
    dangerousPatterns: MedicalVerificationResult['dangerousPatterns'];
    claimVerifications: ClaimVerificationResult[];
    scenarioValidation: ScenarioValidationResult;
    drugCheck?: DrugInteractionResult;
  }): number {
    let score = 1.0;

    // Penalize outdated terms
    score -= results.outdatedTerms.length * 0.05;

    // Heavily penalize dangerous patterns
    for (const pattern of results.dangerousPatterns) {
      score -= pattern.severity === 'CRITICAL' ? 0.3 : 0.15;
    }

    // Consider claim verification
    if (results.claimVerifications.length > 0) {
      const verifiedRatio = results.claimVerifications.filter(c => c.isVerified).length /
        results.claimVerifications.length;
      score *= (0.7 + 0.3 * verifiedRatio); // 30% weight on verification
    }

    // Consider scenario plausibility
    if (results.scenarioValidation) {
      score *= (0.8 + 0.2 * results.scenarioValidation.plausibilityScore);
    }

    // Consider drug interactions
    if (results.drugCheck?.hasInteractions) {
      const severeCount = results.drugCheck.interactions.filter(
        i => i.severity === 'SEVERE'
      ).length;
      score -= severeCount * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateSummary(
    overallScore: number,
    dangerousPatterns: MedicalVerificationResult['dangerousPatterns'],
    outdatedTerms: MedicalVerificationResult['outdatedTerms']
  ): string {
    const parts: string[] = [];

    if (overallScore >= 0.9) {
      parts.push('Questão medicamente precisa.');
    } else if (overallScore >= 0.7) {
      parts.push('Questão aceitável com pequenas ressalvas.');
    } else if (overallScore >= 0.5) {
      parts.push('Questão necessita revisão médica.');
    } else {
      parts.push('Questão com problemas significativos de precisão médica.');
    }

    if (dangerousPatterns.length > 0) {
      parts.push(`ALERTA: ${dangerousPatterns.length} padrão(ões) potencialmente perigoso(s) detectado(s).`);
    }

    if (outdatedTerms.length > 0) {
      parts.push(`${outdatedTerms.length} termo(s) desatualizado(s) encontrado(s).`);
    }

    return parts.join(' ');
  }
}

// Export singleton instance
export const medicalVerificationService = new MedicalVerificationService();
