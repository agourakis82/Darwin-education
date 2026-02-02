/**
 * QGen Corpus Analysis Service
 * ============================
 *
 * Extracts features from medical questions for corpus analysis
 */

import {
  ExtractedFeatures,
  StructuralFeatures,
  ClinicalFeatures,
  CognitiveFeatures,
  LinguisticFeatures,
  DistractorFeatures,
  BloomLevel,
  ClinicalScenario,
  PatientAgeCategory,
  DistractorType,
} from '@darwin-education/shared';

import {
  LINGUISTIC_PATTERNS,
  CLINICAL_PATTERNS,
  MEDICAL_CONCEPT_MAP,
  BLOOM_INDICATORS,
  QUESTION_TARGET_KEYWORDS,
  READABILITY_CONSTANTS,
} from '../constants/patterns';

/**
 * Corpus Analysis Service for extracting features from questions
 */
export class CorpusAnalysisService {
  private extractorVersion = '1.0.0';

  /**
   * Analyze a complete question and extract all features
   */
  async analyzeQuestion(
    questionId: string,
    stem: string,
    alternatives: Record<string, string>,
    correctAnswer: string,
    explanation?: string
  ): Promise<ExtractedFeatures> {
    const startTime = Date.now();
    const warnings: string[] = [];

    const structural = this.extractStructuralFeatures(stem, alternatives);
    const clinical = this.extractClinicalFeatures(stem);
    const cognitive = this.extractCognitiveFeatures(stem, alternatives, correctAnswer);
    const linguistic = this.extractLinguisticFeatures(stem, alternatives, correctAnswer);
    const distractors = this.extractDistractorFeatures(alternatives, correctAnswer);

    // Estimate IRT parameters based on features
    const irt = this.estimateIRTFromFeatures(structural, cognitive, linguistic);

    // Calculate confidence
    const confidence = this.calculateExtractionConfidence(structural, cognitive, linguistic);

    return {
      questionId,
      extractionTimestamp: new Date().toISOString(),
      extractorVersion: this.extractorVersion,
      structural,
      clinical: clinical.scenario.type !== ClinicalScenario.OTHER ? clinical : null,
      cognitive,
      linguistic,
      distractors,
      irt,
      extractionMetadata: {
        confidence,
        warnings,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Extract structural features from question
   */
  extractStructuralFeatures(
    stem: string,
    alternatives: Record<string, string>
  ): StructuralFeatures {
    const sentences = stem.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = stem.split(/\s+/).filter(w => w.length > 0);
    const stemWordCount = words.length;
    const stemSentenceCount = sentences.length;
    const stemCharCount = stem.length;
    const avgWordsPerSentence = stemSentenceCount > 0 ? stemWordCount / stemSentenceCount : 0;

    // Alternatives analysis
    const alternativesWordCounts: Record<string, number> = {};
    let longestAlt = '';
    let shortestAlt = '';
    let maxLen = 0;
    let minLen = Infinity;

    for (const [letter, text] of Object.entries(alternatives)) {
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      alternativesWordCounts[letter] = wordCount;
      if (wordCount > maxLen) {
        maxLen = wordCount;
        longestAlt = letter;
      }
      if (wordCount < minLen) {
        minLen = wordCount;
        shortestAlt = letter;
      }
    }

    const altLengths = Object.values(alternativesWordCounts);
    const avgAltLength = altLengths.reduce((a, b) => a + b, 0) / altLengths.length;
    const variance = altLengths.reduce((sum, len) => sum + Math.pow(len - avgAltLength, 2), 0) / altLengths.length;

    // Components detection
    const lowerStem = stem.toLowerCase();
    const components = {
      hasPatientDemographics: /\b(homem|mulher|masculino|feminino|paciente)\b/i.test(stem),
      hasChiefComplaint: /\b(queixa|queixando|refere|relata|apresenta)\b/i.test(stem),
      hasTimeEvolution: CLINICAL_PATTERNS.timeEvolution.test(stem),
      hasPhysicalExam: /\b(exame físico|ao exame|ausculta|palpação|inspeção)\b/i.test(stem),
      hasVitalSigns: /\b(PA|FC|FR|Tax|SpO2|sinais vitais)\b/i.test(stem),
      hasLabResults: /\b(hemograma|bioquímica|exames laboratoriais|Hb|Ht|leucócitos)\b/i.test(stem),
      hasImaging: /\b(raio.?x|rx|tomografia|tc|ressonância|rm|ultrassom|usg)\b/i.test(stem),
      hasPathology: /\b(biópsia|histopatológico|anatomopatológico)\b/i.test(stem),
      hasMedicationHistory: /\b(uso de|em uso|medicamentos|medicações)\b/i.test(stem),
      hasFamilyHistory: /\b(história familiar|antecedentes familiares)\b/i.test(stem),
      hasSocialHistory: /\b(tabagista|etilista|drogas|ocupação|profissão)\b/i.test(stem),
    };

    // Question format detection
    let questionFormat = 'Outro';
    for (const [format, pattern] of Object.entries(LINGUISTIC_PATTERNS.questionFormats)) {
      if (pattern.test(stem)) {
        questionFormat = format;
        break;
      }
    }

    // Negative stem detection
    const isNegativeStem = LINGUISTIC_PATTERNS.negativeStems.some(marker =>
      new RegExp(`\\b${marker}`, 'i').test(stem)
    );

    // Question target detection
    const questionTarget = {
      asksDiagnosis: QUESTION_TARGET_KEYWORDS.diagnosis.some(kw => lowerStem.includes(kw)),
      asksTreatment: QUESTION_TARGET_KEYWORDS.treatment.some(kw => lowerStem.includes(kw)),
      asksNextStep: QUESTION_TARGET_KEYWORDS.nextStep.some(kw => lowerStem.includes(kw)),
      asksMechanism: QUESTION_TARGET_KEYWORDS.mechanism.some(kw => lowerStem.includes(kw)),
      asksPrognosis: QUESTION_TARGET_KEYWORDS.prognosis.some(kw => lowerStem.includes(kw)),
      asksEpidemiologic: QUESTION_TARGET_KEYWORDS.epidemiologic.some(kw => lowerStem.includes(kw)),
      asksEthical: QUESTION_TARGET_KEYWORDS.ethical.some(kw => lowerStem.includes(kw)),
    };

    return {
      stemWordCount,
      stemSentenceCount,
      stemCharCount,
      avgWordsPerSentence,
      numAlternatives: Object.keys(alternatives).length,
      alternativesWordCounts,
      alternativesLengthVariance: variance,
      longestAlternative: longestAlt,
      shortestAlternative: shortestAlt,
      components,
      questionFormat,
      isNegativeStem,
      questionTarget,
    };
  }

  /**
   * Extract clinical features from stem (for clinical cases)
   */
  extractClinicalFeatures(stem: string): ClinicalFeatures {
    // Patient demographics
    const ageMatch = stem.match(CLINICAL_PATTERNS.age);
    let ageValue: number | null = null;
    let ageUnit: 'days' | 'months' | 'years' | null = null;
    let ageCategory: PatientAgeCategory | null = null;

    if (ageMatch) {
      ageValue = parseInt(ageMatch[1]);
      const unitStr = ageMatch[2].toLowerCase();
      if (unitStr.startsWith('dia')) ageUnit = 'days';
      else if (unitStr.startsWith('mes')) ageUnit = 'months';
      else ageUnit = 'years';
      ageCategory = this.categorizeAge(ageValue, ageUnit);
    }

    let sex: 'male' | 'female' | 'unspecified' = 'unspecified';
    if (CLINICAL_PATTERNS.sex.male.test(stem)) sex = 'male';
    else if (CLINICAL_PATTERNS.sex.female.test(stem)) sex = 'female';

    const isPregnant = /\b(gestante|grávida|gravidez|gestação)\b/i.test(stem);
    const gestationalAgeMatch = stem.match(/(\d+)\s*semanas?\s*(?:de\s*)?(?:gestação|IG)/i);
    const gestationalAge = gestationalAgeMatch ? parseInt(gestationalAgeMatch[1]) : null;

    // Clinical scenario
    let scenarioType = ClinicalScenario.OTHER;
    for (const [scenario, pattern] of Object.entries(CLINICAL_PATTERNS.scenarios)) {
      if (pattern.test(stem)) {
        scenarioType = scenario.toUpperCase() as ClinicalScenario;
        break;
      }
    }

    // Urgency level
    let urgencyLevel: 'elective' | 'urgent' | 'emergent' = 'elective';
    if (/\b(emergência|PS|SAMU|parada|choque)\b/i.test(stem)) urgencyLevel = 'emergent';
    else if (/\b(urgência|UPA)\b/i.test(stem)) urgencyLevel = 'urgent';

    // Time evolution
    const timeMatch = stem.match(CLINICAL_PATTERNS.timeEvolution);
    let timeEvolutionValue: number | null = null;
    let timeEvolutionUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years' | null = null;

    if (timeMatch) {
      timeEvolutionValue = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      if (unit.startsWith('minuto')) timeEvolutionUnit = 'minutes';
      else if (unit.startsWith('hora')) timeEvolutionUnit = 'hours';
      else if (unit.startsWith('dia')) timeEvolutionUnit = 'days';
      else if (unit.startsWith('semana')) timeEvolutionUnit = 'weeks';
      else if (unit.startsWith('mes')) timeEvolutionUnit = 'months';
      else if (unit.startsWith('ano')) timeEvolutionUnit = 'years';
    }

    // Vital signs extraction
    let vitalSigns = null;
    const hasVitals = Object.values(CLINICAL_PATTERNS.vitalSigns).some(p => p.test(stem));
    if (hasVitals) {
      const bpMatch = stem.match(CLINICAL_PATTERNS.vitalSigns.bp);
      const hrMatch = stem.match(CLINICAL_PATTERNS.vitalSigns.hr);
      const rrMatch = stem.match(CLINICAL_PATTERNS.vitalSigns.rr);
      const tempMatch = stem.match(CLINICAL_PATTERNS.vitalSigns.temp);
      const spo2Match = stem.match(CLINICAL_PATTERNS.vitalSigns.spo2);

      vitalSigns = {
        bloodPressure: bpMatch ? `${bpMatch[1]}x${bpMatch[2]}` : null,
        heartRate: hrMatch ? parseInt(hrMatch[1]) : null,
        respiratoryRate: rrMatch ? parseInt(rrMatch[1]) : null,
        temperature: tempMatch ? parseFloat(tempMatch[1].replace(',', '.')) : null,
        oxygenSaturation: spo2Match ? parseInt(spo2Match[1]) : null,
        weight: null,
        height: null,
        bmi: null,
      };
    }

    return {
      patient: {
        sex,
        ageValue,
        ageUnit,
        ageCategory,
        occupation: null,
        ethnicity: null,
        isPregnant,
        gestationalAge,
      },
      scenario: {
        type: scenarioType,
        urgencyLevel,
        setting: '',
      },
      presentation: {
        chiefComplaint: null,
        timeEvolutionValue,
        timeEvolutionUnit,
        isAcute: (timeEvolutionUnit === 'minutes' || timeEvolutionUnit === 'hours' ||
                  (timeEvolutionUnit === 'days' && (timeEvolutionValue || 0) <= 7)),
        isChronic: (timeEvolutionUnit === 'months' || timeEvolutionUnit === 'years'),
        isRecurrent: /\b(recorrente|recidivante|crises repetidas)\b/i.test(stem),
        associatedSymptoms: [],
      },
      vitalSigns,
      physicalExam: null,
      labTests: null,
      imagingTests: null,
      diagnosis: {
        primary: null,
        differentials: [],
        icd10Codes: [],
      },
    };
  }

  /**
   * Extract cognitive features
   */
  extractCognitiveFeatures(
    stem: string,
    alternatives: Record<string, string>,
    correctAnswer: string
  ): CognitiveFeatures {
    const lowerStem = stem.toLowerCase();

    // Bloom level detection
    let bloomLevel = BloomLevel.KNOWLEDGE;
    let maxScore = 0;

    for (const [level, indicators] of Object.entries(BLOOM_INDICATORS)) {
      const score = indicators.filter(ind => lowerStem.includes(ind)).length;
      if (score > maxScore) {
        maxScore = score;
        bloomLevel = level as BloomLevel;
      }
    }

    // If no indicators found, infer from question complexity
    if (maxScore === 0) {
      const hasClinicalCase = stem.length > 200 && /paciente|anos?/i.test(stem);
      const hasMultipleSteps = /primeiro|depois|em seguida|próximo/i.test(stem);

      if (hasMultipleSteps) bloomLevel = BloomLevel.ANALYSIS;
      else if (hasClinicalCase) bloomLevel = BloomLevel.APPLICATION;
      else bloomLevel = BloomLevel.COMPREHENSION;
    }

    const bloomConfidence = maxScore > 0 ? Math.min(0.5 + maxScore * 0.15, 0.95) : 0.6;

    // Cognitive domains
    const cognitiveDomains = {
      requiresRecall: /defina|liste|cite|nomeie/i.test(lowerStem),
      requiresUnderstanding: /explique|descreva|interprete/i.test(lowerStem),
      requiresApplication: /qual a conduta|como tratar|aplique/i.test(lowerStem),
      requiresAnalysis: /diagnóstico diferencial|diferencie|analise/i.test(lowerStem),
      requiresSynthesis: /planeje|elabore|proponha/i.test(lowerStem),
      requiresEvaluation: /avalie|julgue|qual a melhor/i.test(lowerStem),
    };

    // Knowledge types
    const knowledgeTypes = {
      factual: /\b(defina|qual o agente|qual a dose)\b/i.test(stem),
      conceptual: /\b(mecanismo|fisiopatologia|princípio)\b/i.test(stem),
      procedural: /\b(como fazer|técnica|procedimento|conduta)\b/i.test(stem),
      metacognitive: false,
    };

    // Required skills
    const requiredSkills = {
      calculation: /\b(calcule|qual o valor|taxa|risco relativo)\b/i.test(stem),
      interpretation: /\b(interprete|o que indica|significado)\b/i.test(stem),
      clinicalReasoning: stem.length > 150 && /paciente/i.test(stem),
      ethicalReasoning: /\b(ética|bioética|autonomia|sigilo)\b/i.test(stem),
      integration: Object.values(cognitiveDomains).filter(Boolean).length >= 2,
      patternRecognition: /\b(quadro clássico|típico|patognomônico)\b/i.test(stem),
    };

    // Estimate complexity
    const conceptCount = this.countMedicalConcepts(stem);
    const integrationCount = Object.values(requiredSkills).filter(Boolean).length;
    const cognitiveLoadEstimate = Math.min(
      (conceptCount * 0.1 + integrationCount * 0.15 + stem.length / 1000) / 2,
      1
    );

    return {
      bloomLevel,
      bloomConfidence,
      cognitiveDomains,
      knowledgeTypes,
      requiredSkills,
      keyConcepts: [],
      requiredIntegrations: [],
      prerequisiteConcepts: [],
      complexity: {
        conceptCount,
        integrationCount,
        cognitiveLoadEstimate,
        estimatedTimeSeconds: Math.round(stem.length / 10 + 30),
      },
    };
  }

  /**
   * Extract linguistic features
   */
  extractLinguisticFeatures(
    stem: string,
    alternatives: Record<string, string>,
    correctAnswer: string
  ): LinguisticFeatures {
    const lowerStem = stem.toLowerCase();
    const words = stem.split(/\s+/).filter(w => w.length > 0);

    // Hedging analysis
    const hedgingMarkers = LINGUISTIC_PATTERNS.hedgingMarkers.filter(marker =>
      lowerStem.includes(marker)
    );
    const hedgingCount = hedgingMarkers.length;
    const hedgingDensity = words.length > 0 ? hedgingCount / words.length : 0;

    // Absolute terms analysis
    const absoluteMarkers = LINGUISTIC_PATTERNS.absoluteMarkers.filter(marker =>
      lowerStem.includes(marker)
    );
    const absoluteCount = absoluteMarkers.length;

    // Check if absolute terms in correct answer
    const correctText = alternatives[correctAnswer]?.toLowerCase() || '';
    const absoluteInCorrect = LINGUISTIC_PATTERNS.absoluteMarkers.some(marker =>
      correctText.includes(marker)
    );

    // Logical connectives
    const allConnectives: string[] = [];
    const connectiveTypes: ('causal' | 'adversative' | 'additive' | 'temporal')[] = [];
    for (const [type, connectives] of Object.entries(LINGUISTIC_PATTERNS.logicalConnectives)) {
      const found = connectives.filter(c => lowerStem.includes(c));
      if (found.length > 0) {
        allConnectives.push(...found);
        connectiveTypes.push(type as 'causal' | 'adversative' | 'additive' | 'temporal');
      }
    }

    // Alternatives analysis
    const alternativesAnalysis: Record<string, {
      hedgingCount: number;
      absoluteCount: number;
      wordCount: number;
      avgWordLength: number;
      hasNegation: boolean;
    }> = {};

    for (const [letter, text] of Object.entries(alternatives)) {
      const altWords = text.split(/\s+/).filter(w => w.length > 0);
      const altLower = text.toLowerCase();
      alternativesAnalysis[letter] = {
        hedgingCount: LINGUISTIC_PATTERNS.hedgingMarkers.filter(m => altLower.includes(m)).length,
        absoluteCount: LINGUISTIC_PATTERNS.absoluteMarkers.filter(m => altLower.includes(m)).length,
        wordCount: altWords.length,
        avgWordLength: altWords.length > 0
          ? altWords.reduce((sum, w) => sum + w.length, 0) / altWords.length
          : 0,
        hasNegation: /\bnão\b|nunca|jamais/i.test(text),
      };
    }

    // Linguistic cues detection
    const altLengths = Object.entries(alternativesAnalysis).map(([k, v]) => ({
      letter: k,
      length: v.wordCount,
    }));
    const avgLength = altLengths.reduce((sum, a) => sum + a.length, 0) / altLengths.length;
    const correctLength = alternativesAnalysis[correctAnswer]?.wordCount || avgLength;
    const lengthCue = Math.abs(correctLength - avgLength) > avgLength * 0.3;

    // Readability metrics (simplified)
    const sentences = stem.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSyllablesPerWord = this.estimateAvgSyllables(words);

    // Flesch Reading Ease (Portuguese adaptation)
    const fleschReadingEase = Math.max(0, Math.min(100,
      READABILITY_CONSTANTS.fleschConstants.base +
      READABILITY_CONSTANTS.fleschConstants.sentenceWeight * avgWordsPerSentence +
      READABILITY_CONSTANTS.fleschConstants.syllableWeight * avgSyllablesPerWord
    ));

    // Gunning Fog Index
    const complexWords = words.filter(w => this.countSyllables(w) >= 3).length;
    const gunningFogIndex = 0.4 * (avgWordsPerSentence + (100 * complexWords / words.length));

    // Medical vocabulary
    const medicalTerms = this.extractMedicalTerms(stem);
    const abbreviations = this.extractAbbreviations(stem);
    const technicalTermDensity = words.length > 0 ? medicalTerms.length / words.length : 0;

    return {
      hedging: {
        count: hedgingCount,
        markers: hedgingMarkers,
        density: hedgingDensity,
      },
      absoluteTerms: {
        count: absoluteCount,
        markers: absoluteMarkers,
        inCorrectAnswer: absoluteInCorrect,
      },
      logicalConnectives: {
        connectives: allConnectives,
        count: allConnectives.length,
        types: [...new Set(connectiveTypes)],
      },
      alternativesAnalysis,
      linguisticCues: {
        grammaticalCues: false, // Would require NLP analysis
        lengthCue,
        absoluteInCorrect,
        issues: absoluteInCorrect ? ['Termo absoluto na resposta correta'] : [],
      },
      readability: {
        fleschReadingEase,
        gunningFogIndex,
        avgSyllablesPerWord,
        avgWordsPerSentence,
      },
      vocabulary: {
        medicalTerms,
        abbreviations,
        eponyms: [],
        technicalTermDensity,
      },
    };
  }

  /**
   * Extract distractor features for each alternative
   */
  extractDistractorFeatures(
    alternatives: Record<string, string>,
    correctAnswer: string
  ): DistractorFeatures[] {
    const features: DistractorFeatures[] = [];
    const correctText = alternatives[correctAnswer] || '';

    for (const [letter, text] of Object.entries(alternatives)) {
      const isCorrect = letter === correctAnswer;

      // Basic type classification (would need LLM for accurate classification)
      let type = DistractorType.PLAUSIBLE_RELATED;
      const lowerText = text.toLowerCase();

      if (LINGUISTIC_PATTERNS.absoluteMarkers.some(m => lowerText.includes(m))) {
        type = DistractorType.ABSOLUTE_TERM;
      } else if (text.length < 10) {
        type = DistractorType.OBVIOUS_WRONG;
      }

      // Calculate semantic similarity (simplified - word overlap)
      const correctWords = new Set(correctText.toLowerCase().split(/\s+/));
      const altWords = text.toLowerCase().split(/\s+/);
      const overlap = altWords.filter(w => correctWords.has(w)).length;
      const semanticSimilarity = correctWords.size > 0
        ? overlap / Math.max(correctWords.size, altWords.length)
        : 0;

      features.push({
        alternative: letter,
        isCorrect,
        type: isCorrect ? DistractorType.PLAUSIBLE_RELATED : type, // Correct answer gets default
        typeConfidence: 0.6,
        plausibilityScore: isCorrect ? 1 : 0.5,
        semanticSimilarityToCorrect: isCorrect ? 1 : semanticSimilarity,
        sharesKeyConcepts: overlap > 1,
        conceptOverlapCount: overlap,
        targetsMisconception: false,
        misconceptionId: null,
        misconceptionDescription: null,
        conductAnalysis: null,
        empiricalMetrics: null,
      });
    }

    return features;
  }

  /**
   * Estimate IRT parameters from extracted features
   */
  private estimateIRTFromFeatures(
    structural: StructuralFeatures,
    cognitive: CognitiveFeatures,
    linguistic: LinguisticFeatures
  ): { difficulty: number; discrimination: number; guessing: number; source: 'estimated' } {
    // Difficulty estimation based on:
    // - Bloom level (higher = harder)
    // - Question length (longer = harder)
    // - Negative stem (harder)
    // - Technical density (higher = harder)

    const bloomDifficultyMap: Record<BloomLevel, number> = {
      [BloomLevel.KNOWLEDGE]: -1.0,
      [BloomLevel.COMPREHENSION]: -0.5,
      [BloomLevel.APPLICATION]: 0,
      [BloomLevel.ANALYSIS]: 0.5,
      [BloomLevel.SYNTHESIS]: 1.0,
      [BloomLevel.EVALUATION]: 1.2,
    };

    let difficulty = bloomDifficultyMap[cognitive.bloomLevel] || 0;

    // Adjust for length
    if (structural.stemWordCount > 150) difficulty += 0.3;
    if (structural.stemWordCount > 250) difficulty += 0.2;

    // Adjust for negative stem
    if (structural.isNegativeStem) difficulty += 0.3;

    // Adjust for technical density
    difficulty += linguistic.vocabulary.technicalTermDensity * 0.5;

    // Clamp to IRT range
    difficulty = Math.max(-3, Math.min(3, difficulty));

    // Discrimination estimation (simplified)
    const discrimination = 1.0; // Would need empirical data

    // Guessing parameter
    const guessing = 1 / structural.numAlternatives;

    return {
      difficulty,
      discrimination,
      guessing,
      source: 'estimated',
    };
  }

  /**
   * Calculate extraction confidence
   */
  private calculateExtractionConfidence(
    structural: StructuralFeatures,
    cognitive: CognitiveFeatures,
    linguistic: LinguisticFeatures
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase if clear patterns found
    if (cognitive.bloomConfidence > 0.7) confidence += 0.1;
    if (linguistic.vocabulary.medicalTerms.length > 0) confidence += 0.05;
    if (Object.values(structural.components).some(Boolean)) confidence += 0.1;

    // Decrease for potential issues
    if (linguistic.linguisticCues.absoluteInCorrect) confidence -= 0.1;
    if (linguistic.linguisticCues.lengthCue) confidence -= 0.05;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Categorize age into standard categories
   */
  private categorizeAge(value: number, unit: 'days' | 'months' | 'years'): PatientAgeCategory {
    let ageInYears = value;
    if (unit === 'days') ageInYears = value / 365;
    else if (unit === 'months') ageInYears = value / 12;

    if (unit === 'days' && value <= 28) return PatientAgeCategory.NEONATE;
    if (ageInYears < 2) return PatientAgeCategory.INFANT;
    if (ageInYears < 6) return PatientAgeCategory.PRESCHOOL;
    if (ageInYears < 12) return PatientAgeCategory.SCHOOL_AGE;
    if (ageInYears < 18) return PatientAgeCategory.ADOLESCENT;
    if (ageInYears < 40) return PatientAgeCategory.YOUNG_ADULT;
    if (ageInYears < 65) return PatientAgeCategory.MIDDLE_ADULT;
    return PatientAgeCategory.ELDERLY;
  }

  /**
   * Count medical concepts in text
   */
  private countMedicalConcepts(text: string): number {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const concepts of Object.values(MEDICAL_CONCEPT_MAP)) {
      for (const concept of concepts) {
        if (lowerText.includes(concept.toLowerCase())) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Estimate syllable count for a word
   */
  private countSyllables(word: string): number {
    const vowels = word.toLowerCase().match(/[aeiouáéíóúâêîôûãõ]/g);
    return vowels ? vowels.length : 1;
  }

  /**
   * Estimate average syllables per word
   */
  private estimateAvgSyllables(words: string[]): number {
    if (words.length === 0) return 0;
    const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    return totalSyllables / words.length;
  }

  /**
   * Extract medical terms from text
   */
  private extractMedicalTerms(text: string): string[] {
    const terms: string[] = [];
    const lowerText = text.toLowerCase();

    for (const concepts of Object.values(MEDICAL_CONCEPT_MAP)) {
      for (const concept of concepts) {
        if (lowerText.includes(concept.toLowerCase())) {
          terms.push(concept);
        }
      }
    }

    return [...new Set(terms)];
  }

  /**
   * Extract abbreviations from text
   */
  private extractAbbreviations(text: string): string[] {
    const abbrevPattern = /\b[A-Z]{2,5}\b/g;
    const matches = text.match(abbrevPattern);
    return matches ? [...new Set(matches)] : [];
  }
}
