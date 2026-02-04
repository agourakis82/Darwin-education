/**
 * Darwin-MFC Transformer
 *
 * Converts Darwin-MFC disease data structure to theory topic format
 * Maps disease fields to 8-section theory content structure
 */

import {
  GeneratedTheoryTopic,
  DarwinMFCDiseaseData,
  TheoryDifficultyLevel,
  ENAMEDArea,
} from '@darwin-education/shared';

export class DarwinMFCTransformer {
  /**
   * Transform Darwin-MFC disease data to theory topic format
   */
  transform(
    disease: DarwinMFCDiseaseData,
    area: ENAMEDArea
  ): Partial<GeneratedTheoryTopic> {
    return {
      topicId: this.generateTopicId(disease.title),
      title: disease.title,
      description: this.createDescription(disease),
      area,
      difficulty: this.inferDifficulty(disease),
      sections: {
        definition: disease.definition || '',
        epidemiology: disease.epidemiology,
        pathophysiology: disease.pathophysiology,
        clinicalPresentation: disease.clinicalPresentation,
        diagnosis: disease.diagnosis,
        treatment: disease.treatment,
        complications: disease.complications,
        prognosis: disease.prognosis,
      },
      keyPoints: this.extractKeyPoints(disease),
      estimatedReadTime: this.estimateReadTime(disease),
      relatedDiseaseIds: disease.relatedDiseases || [],
      relatedMedicationIds: disease.relatedMedications || [],
    };
  }

  /**
   * Generate kebab-case topic ID from title
   */
  private generateTopicId(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Remove accents
      .replace(/[^\w\s-]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')  // Replace spaces with hyphens
      .replace(/-+/g, '-')  // Replace multiple hyphens
      .trim();
  }

  /**
   * Create description from disease data
   */
  private createDescription(disease: DarwinMFCDiseaseData): string {
    if (disease.definition) {
      return disease.definition.substring(0, 300).trim() + '...';
    }

    // Create from multiple fields if definition not available
    const parts = [
      disease.epidemiology?.substring(0, 100),
      disease.clinicalPresentation?.substring(0, 100),
    ].filter(Boolean);

    return parts.join(' ').substring(0, 300) + '...';
  }

  /**
   * Infer difficulty level from disease complexity
   */
  private inferDifficulty(disease: DarwinMFCDiseaseData): TheoryDifficultyLevel {
    // Count filled sections
    const filledSections = [
      disease.definition,
      disease.epidemiology,
      disease.pathophysiology,
      disease.clinicalPresentation,
      disease.diagnosis,
      disease.treatment,
      disease.complications,
      disease.prognosis,
    ].filter(Boolean).length;

    // High complexity = advanced
    if (filledSections >= 7 && disease.treatment?.length! > 500) {
      return 'avancado';
    }

    // Medium complexity = intermediate
    if (filledSections >= 5) {
      return 'intermediario';
    }

    // Basic
    return 'basico';
  }

  /**
   * Extract key points from disease data
   */
  private extractKeyPoints(disease: DarwinMFCDiseaseData): string[] {
    // Use existing key points if available
    if (disease.keyPoints && disease.keyPoints.length > 0) {
      return disease.keyPoints.slice(0, 6);
    }

    // Generate key points from available sections
    const keyPoints: string[] = [];

    if (disease.definition) {
      const definitionSummary = this.summarizeSentence(disease.definition);
      if (definitionSummary) {
        keyPoints.push(`Definição: ${definitionSummary}`);
      }
    }

    if (disease.epidemiology) {
      const epidemiologySummary = this.extractMainConcept(disease.epidemiology);
      if (epidemiologySummary) {
        keyPoints.push(`Epidemiologia: ${epidemiologySummary}`);
      }
    }

    if (disease.clinicalPresentation) {
      const presentationSummary = this.extractMainConcept(disease.clinicalPresentation);
      if (presentationSummary) {
        keyPoints.push(`Apresentação clínica: ${presentationSummary}`);
      }
    }

    if (disease.diagnosis) {
      const diagnosisSummary = this.extractMainConcept(disease.diagnosis);
      if (diagnosisSummary) {
        keyPoints.push(`Diagnóstico: ${diagnosisSummary}`);
      }
    }

    if (disease.treatment) {
      const treatmentSummary = this.extractMainConcept(disease.treatment);
      if (treatmentSummary) {
        keyPoints.push(`Tratamento: ${treatmentSummary}`);
      }
    }

    if (disease.complications) {
      const complicationsSummary = this.extractMainConcept(disease.complications);
      if (complicationsSummary) {
        keyPoints.push(`Complicações: ${complicationsSummary}`);
      }
    }

    return keyPoints.slice(0, 6);
  }

  /**
   * Estimate reading time in minutes
   */
  private estimateReadTime(disease: DarwinMFCDiseaseData): number {
    const sections = [
      disease.definition,
      disease.epidemiology,
      disease.pathophysiology,
      disease.clinicalPresentation,
      disease.diagnosis,
      disease.treatment,
      disease.complications,
      disease.prognosis,
    ];

    const totalWords = sections
      .filter(Boolean)
      .reduce((sum, section) => sum + (section?.split(/\s+/).length || 0), 0);

    // Average reading speed: 200 words per minute
    const minutes = Math.max(5, Math.ceil(totalWords / 200));

    // Clamp between 5-30 minutes
    return Math.min(30, minutes);
  }

  /**
   * Summarize text to first sentence
   */
  private summarizeSentence(text: string): string {
    if (!text) return '';

    // Find first sentence (ends with . ? or !)
    const match = text.match(/^[^.!?]*[.!?]/);
    if (match) {
      return match[0].substring(0, 150);
    }

    return text.substring(0, 150);
  }

  /**
   * Extract main concept from text
   */
  private extractMainConcept(text: string): string {
    if (!text) return '';

    // Get first 100 characters of meaningful content
    const cleaned = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.substring(0, 100);
  }

  /**
   * Validate that disease has minimum required content
   */
  isValidForGeneration(disease: DarwinMFCDiseaseData): boolean {
    // Must have at least definition and one other section
    const hasSections = [
      disease.definition,
      disease.epidemiology,
      disease.pathophysiology,
      disease.clinicalPresentation,
      disease.diagnosis,
      disease.treatment,
    ];

    return disease.definition?.length! > 50 && hasSections.filter(Boolean).length >= 2;
  }
}

export default DarwinMFCTransformer;
