/**
 * Research Service for Theory Generation
 *
 * Orchestrates multi-source medical research:
 * - Darwin-MFC disease extraction
 * - Brazilian guideline search
 * - International guidelines (UpToDate, PubMed)
 * - Recent research and meta-analyses
 * - Citation extraction and validation
 */

import {
  ResearchResult,
  ResearchSource,
  Citation,
  EvidenceLevel,
  DarwinMFCDiseaseData,
} from '@darwin-education/shared';

export class ResearchService {
  private cacheService: any;  // Will inject cache service
  private medicalDataAdapter: any;  // Will inject Darwin-MFC adapter

  constructor(cacheService?: any, medicalDataAdapter?: any) {
    this.cacheService = cacheService;
    this.medicalDataAdapter = medicalDataAdapter;
  }

  /**
   * Research a medical topic from multiple sources
   * Combines Darwin-MFC data, Brazilian guidelines, international evidence, and web research
   */
  async researchTopic(
    topic: string,
    area: string
  ): Promise<ResearchResult> {
    // Check cache first
    const cached = await this.getCachedResearch(topic);
    if (cached) {
      return { ...cached, cacheHit: true };
    }

    try {
      // Run research tasks in parallel
      const [
        darwinMFCData,
        brazilianGuidelines,
        internationalGuidelines,
        recentResearch,
      ] = await Promise.allSettled([
        this.extractDarwinMFCData(topic, area),
        this.searchBrazilianGuidelines(topic),
        this.searchInternationalGuidelines(topic),
        this.searchRecentResearch(topic),
      ]);

      // Collect all sources
      const sources: ResearchSource[] = [];

      // Add Darwin-MFC data if available
      let darwinMFCDataResult: DarwinMFCDiseaseData | undefined;
      if (
        darwinMFCData.status === 'fulfilled' &&
        darwinMFCData.value
      ) {
        darwinMFCDataResult = darwinMFCData.value;
        sources.push({
          url: `darwin-mfc://disease/${darwinMFCData.value.id}`,
          title: darwinMFCData.value.title,
          snippet: darwinMFCData.value.definition?.substring(0, 200) || '',
          source: 'web',
          relevance_score: 1.0,  // Highest priority
        });
      }

      // Combine other sources
      if (brazilianGuidelines.status === 'fulfilled') {
        sources.push(...(brazilianGuidelines.value || []));
      }
      if (internationalGuidelines.status === 'fulfilled') {
        sources.push(...(internationalGuidelines.value || []));
      }
      if (recentResearch.status === 'fulfilled') {
        sources.push(...(recentResearch.value || []));
      }

      // Extract and validate citations
      const citations = await this.extractCitations(sources);

      const result: ResearchResult = {
        topic,
        sources,
        darwinMFCData: darwinMFCDataResult,
        citations,
        researchedAt: new Date(),
      };

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.saveResearch(topic, result);
      }

      return result;
    } catch (error) {
      console.error('Error researching topic:', error);
      // Return empty result on error
      return {
        topic,
        sources: [],
        citations: [],
        researchedAt: new Date(),
      };
    }
  }

  /**
   * Extract disease data from Darwin-MFC by title
   */
  private async extractDarwinMFCData(
    topic: string,
    area: string
  ): Promise<DarwinMFCDiseaseData | null> {
    if (!this.medicalDataAdapter) {
      return null;
    }

    try {
      const disease = await this.medicalDataAdapter.findDiseaseByTitle(topic);
      if (!disease) {
        return null;
      }

      return {
        id: disease.id,
        title: disease.title,
        definition: disease.definicao || disease.quickView?.definicao,
        epidemiology: disease.epidemiologia || disease.fullContent?.epidemiologia,
        pathophysiology: disease.fisiopatologia || disease.fullContent?.fisiopatologia,
        clinicalPresentation: disease.quadroClinico || disease.fullContent?.quadroClinico,
        diagnosis: disease.diagnostico || disease.fullContent?.diagnostico,
        treatment: disease.tratamento || disease.fullContent?.tratamento,
        complications: disease.redFlags || disease.quickView?.redFlags,
        prognosis: disease.acompanhamento || disease.fullContent?.acompanhamento,
        keyPoints: disease.pontos_chave || [],
        relatedDiseases: disease.doencas_relacionadas || [],
        relatedMedications: disease.medicamentos_relacionados || [],
      };
    } catch (error) {
      console.error('Error extracting Darwin-MFC data:', error);
      return null;
    }
  }

  /**
   * Search Brazilian medical guidelines (SBC, FEBRASGO, SBP, etc.)
   */
  private async searchBrazilianGuidelines(
    topic: string
  ): Promise<ResearchSource[]> {
    const brazilianDomains = [
      'sbcardiologia.org.br',
      'febrasgo.org.br',
      'sbp.com.br',
      'sbim.org.br',
      'asbai.org.br',
      'sbpt.org.br',
    ];

    try {
      // Use WebSearch with domain restrictions
      const query = `${topic} diretriz guideline 2024 2025`;

      // Note: WebSearch would be called here in production
      // This is a placeholder that returns the structure we expect
      // Actual implementation would use: await webSearch(query, { allowed_domains: brazilianDomains })

      return [];
    } catch (error) {
      console.error('Error searching Brazilian guidelines:', error);
      return [];
    }
  }

  /**
   * Search international guidelines (UpToDate, PubMed, NHS)
   */
  private async searchInternationalGuidelines(
    topic: string
  ): Promise<ResearchSource[]> {
    const queries = [
      `${topic} guideline recommendations 2024 2025`,
      `${topic} clinical practice evidence 2024`,
      `${topic} consensus statement 2024`,
    ];

    try {
      // In real implementation, this would call WebSearch with domain restrictions
      // For now, return empty array - will be implemented with actual WebSearch
      return [];
    } catch (error) {
      console.error('Error searching international guidelines:', error);
      return [];
    }
  }

  /**
   * Search for recent research (systematic reviews, meta-analyses)
   */
  private async searchRecentResearch(
    topic: string
  ): Promise<ResearchSource[]> {
    const queries = [
      `${topic} systematic review meta-analysis 2024 2025`,
      `${topic} randomized controlled trial 2023 2024 2025`,
      `${topic} evidence review 2024`,
    ];

    try {
      // In real implementation, this would call WebSearch
      // For now, return empty array - will be implemented with actual WebSearch
      return [];
    } catch (error) {
      console.error('Error searching recent research:', error);
      return [];
    }
  }

  /**
   * Extract and validate citations from research sources
   */
  private async extractCitations(sources: ResearchSource[]): Promise<Citation[]> {
    const citations: Citation[] = [];

    for (const source of sources.slice(0, 10)) {  // Limit to top 10 sources
      try {
        const citation: Citation = {
          url: source.url,
          title: source.title,
          source: this.getSourceName(source.source),
          evidenceLevel: await this.inferEvidenceLevel(source),
          publicationYear: source.publication_year || new Date().getFullYear(),
        };

        citations.push(citation);
      } catch (error) {
        console.error('Error extracting citation:', error);
      }
    }

    return citations;
  }

  /**
   * Get user-friendly source name
   */
  private getSourceName(source: string): string {
    const sourceMap: Record<string, string> = {
      'brazilian_guideline': 'Diretriz Brasileira',
      'pubmed': 'PubMed',
      'uptodate': 'UpToDate',
      'web': 'Pesquisa Web',
    };

    return sourceMap[source] || source;
  }

  /**
   * Infer evidence level from source and content
   */
  private async inferEvidenceLevel(source: ResearchSource): Promise<EvidenceLevel> {
    // Heuristic: systematic reviews and meta-analyses get A
    if (
      source.snippet.toLowerCase().includes('systematic review') ||
      source.snippet.toLowerCase().includes('meta-analysis')
    ) {
      return 'A';
    }

    // RCTs get B
    if (source.snippet.toLowerCase().includes('randomized controlled trial')) {
      return 'B';
    }

    // Guidelines get A
    if (source.snippet.toLowerCase().includes('guideline')) {
      return 'A';
    }

    // Default to C for web content
    return 'C';
  }

  /**
   * Get cached research if available and not expired
   */
  async getCachedResearch(topic: string): Promise<ResearchResult | null> {
    if (!this.cacheService) {
      return null;
    }

    try {
      return await this.cacheService.getResearch(topic);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate citation URL accessibility (optional, can be async background job)
   */
  async validateCitationAccessibility(url: string): Promise<boolean> {
    try {
      // In real implementation, would check HTTP status
      // For now, assume all are accessible
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default ResearchService;
