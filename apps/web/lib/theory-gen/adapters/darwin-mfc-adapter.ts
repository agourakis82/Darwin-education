/**
 * Darwin-MFC Adapter
 *
 * Provides interface to Darwin-MFC medical data (runtime-enumerated; counts vary by release)
 * Supports disease lookup by ID, title, or ICD-10 code
 *
 * Falls back to empty data when package is unavailable (e.g., Vercel deployment)
 */

import type { Doenca, CategoriaDoenca } from '@darwin-mfc/medical-data';

// Dynamic import with fallback for when package is unavailable
let doencasData: Doenca[] = [];

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mfcData = require('@darwin-mfc/medical-data');
  doencasData = mfcData.doencasConsolidadas || [];
} catch {
  console.warn('[Darwin-MFC Adapter] @darwin-mfc/medical-data not available, using empty fallbacks');
}

export class DarwinMFCAdapter {
  private diseases: Doenca[];

  constructor() {
    this.diseases = doencasData;
  }

  /**
   * Find disease by exact title match
   */
  async findDiseaseByTitle(title: string): Promise<Doenca | null> {
    const normalized = this.normalizeString(title);

    const disease = this.diseases.find((d) => {
      const diseaseTitle = this.normalizeString(d.titulo || '');
      return diseaseTitle === normalized || diseaseTitle.includes(normalized);
    });

    return disease || null;
  }

  /**
   * Find disease by ID
   */
  async findDiseaseById(id: string): Promise<Doenca | null> {
    const disease = this.diseases.find((d) => d.id === id);
    return disease || null;
  }

  /**
   * Find disease by ICD-10 code
   */
  async findDiseaseByICD10(code: string): Promise<Doenca | null> {
    const disease = this.diseases.find((d) =>
      d.cid10?.includes(code)
    );
    return disease || null;
  }

  /**
   * Search diseases by keyword (fuzzy search)
   */
  async searchDiseases(keyword: string, limit: number = 10): Promise<Doenca[]> {
    const normalized = this.normalizeString(keyword);

    const matches = this.diseases.filter((d) => {
      const title = this.normalizeString(d.titulo || '');
      const quickView = this.normalizeString(d.quickView?.definicao || '');

      return title.includes(normalized) || quickView.includes(normalized);
    });

    return matches.slice(0, limit);
  }

  /**
   * Get diseases by ENAMED area
   */
  async getDiseasesByArea(area: string): Promise<Doenca[]> {
    // Map ENAMED areas to disease categories
    const areaMap: Record<string, CategoriaDoenca[]> = {
      clinica_medica: ['cardiovascular', 'respiratorio', 'metabolico', 'endocrino', 'neurologico', 'infecciosas'],
      cirurgia: ['gastrointestinal', 'urologico'],
      pediatria: ['pediatrico'],
      ginecologia_obstetricia: ['ginecologico'],
      saude_coletiva: ['outros'],
    };

    const categories = areaMap[area] || [];

    return this.diseases.filter((d) =>
      categories.includes(d.categoria)
    );
  }

  /**
   * Get total disease count
   */
  getTotalCount(): number {
    return this.diseases.length;
  }

  /**
   * Get all diseases
   */
  getAllDiseases(): Doenca[] {
    return this.diseases;
  }

  /**
   * Check if disease has sufficient content for theory generation
   */
  hasSufficientContent(disease: Doenca): boolean {
    const hasDefinition = (disease.quickView?.definicao?.length || 0) > 50;
    const hasFullContent = disease.fullContent !== undefined;
    const hasTreatment = disease.fullContent?.tratamento?.farmacologico !== undefined;

    return hasDefinition && (hasFullContent || hasTreatment);
  }

  /**
   * Get recommended diseases for theory generation
   * Prioritizes high-frequency ENAMED topics
   */
  async getRecommendedForGeneration(limit: number = 20): Promise<Doenca[]> {
    // Filter diseases with sufficient content
    const candidates = this.diseases.filter((d) => this.hasSufficientContent(d));

    // Sort by priority (could be based on ENAMED frequency)
    // For now, return first N with good content
    return candidates.slice(0, limit);
  }

  /**
   * Check if Darwin-MFC data is available
   */
  isAvailable(): boolean {
    return this.diseases.length > 0;
  }

  /**
   * Normalize string for comparison (remove accents, lowercase, trim)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Extract related content IDs
   */
  getRelatedDiseases(_disease: Doenca): string[] {
    // Related diseases not explicitly defined in Doenca type
    // Could be inferred from similar categories or subcategories
    return [];
  }

  getRelatedMedications(_disease: Doenca): string[] {
    // Related medications could be extracted from treatment sections
    // For now, return empty array
    return [];
  }
}

export default DarwinMFCAdapter;
