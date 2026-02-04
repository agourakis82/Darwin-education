/**
 * Storage Service for Theory Generation
 *
 * Manages persistence of generated topics and related data to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import {
  GeneratedTheoryTopic,
  ValidationResult,
  Citation,
  TopicStatus,
} from '@darwin-education/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export class StorageService {
  /**
   * Save generated topic with validation results
   */
  async saveTopic(
    topic: GeneratedTheoryTopic,
    validation: ValidationResult,
    userId?: string
  ): Promise<string> {
    try {
      // Insert main topic
      const { data: topicData, error: topicError } = await supabase
        .from('theory_topics_generated')
        .insert({
          topic_id: topic.topicId,
          title: topic.title,
          description: topic.description,
          area: topic.area,
          difficulty: topic.difficulty,
          definition: topic.sections.definition,
          epidemiology: topic.sections.epidemiology,
          pathophysiology: topic.sections.pathophysiology,
          clinical_presentation: topic.sections.clinicalPresentation,
          diagnosis: topic.sections.diagnosis,
          treatment: topic.sections.treatment,
          complications: topic.sections.complications,
          prognosis: topic.sections.prognosis,
          key_points: topic.keyPoints,
          estimated_read_time: topic.estimatedReadTime,
          related_disease_ids: topic.relatedDiseaseIds || [],
          related_medication_ids: topic.relatedMedicationIds || [],
          source_disease_id: topic.generationMetadata.sourceDiseaseId,
          source_type: topic.generationMetadata.sourceType,
          generated_by: userId,
          validation_score: validation.score,
          status: topic.generationMetadata.status,
          published_at:
            topic.generationMetadata.status === 'published'
              ? new Date().toISOString()
              : null,
        })
        .select()
        .single();

      if (topicError) {
        throw new Error(`Failed to save topic: ${topicError.message}`);
      }

      const topicId = topicData.id;

      // Save citations
      for (const citation of topic.citations) {
        await this.saveCitation(citation, topicId, topic.citationProvenance);
      }

      // Save validation results
      await this.saveValidationResults(topicId, validation);

      return topicId;
    } catch (error) {
      console.error('Error saving topic:', error);
      throw error;
    }
  }

  /**
   * Save citation and link to topic
   */
  private async saveCitation(
    citation: Citation,
    topicId: string,
    citationProvenance: Record<string, string[]>
  ): Promise<void> {
    try {
      // Insert or get existing citation
      const { data: citationData, error: citationError } = await supabase
        .from('theory_citations')
        .upsert(
          {
            url: citation.url,
            title: citation.title,
            source: citation.source,
            evidence_level: citation.evidenceLevel,
            publication_year: citation.publicationYear,
            authors: citation.authors,
            journal: citation.journal,
            doi: citation.doi,
          },
          { onConflict: 'url' }
        )
        .select()
        .single();

      if (citationError) {
        console.error('Error saving citation:', citationError);
        return;
      }

      const citationId = citationData.id;

      // Find sections that use this citation
      for (const [section, urls] of Object.entries(citationProvenance)) {
        if (urls.includes(citation.url)) {
          await supabase.from('theory_topic_citations').insert({
            topic_id: topicId,
            citation_id: citationId,
            section_name: section,
          });
        }
      }
    } catch (error) {
      console.error('Error saving citation:', error);
    }
  }

  /**
   * Save validation results
   */
  private async saveValidationResults(
    topicId: string,
    validation: ValidationResult
  ): Promise<void> {
    try {
      const stages = [
        { stage: 'structural', result: validation.checks.structural },
        { stage: 'medical', result: validation.checks.medical },
        { stage: 'citations', result: validation.checks.citations },
        { stage: 'readability', result: validation.checks.readability },
        { stage: 'completeness', result: validation.checks.completeness },
      ];

      for (const { stage, result } of stages) {
        await supabase.from('theory_validation_results').insert({
          topic_id: topicId,
          validation_stage: stage,
          passed: result.passed,
          score: result.score,
          issues: result.issues.map((i) => i.message),
        });
      }
    } catch (error) {
      console.error('Error saving validation results:', error);
    }
  }

  /**
   * Get topic by ID
   */
  async getTopic(topicId: string): Promise<GeneratedTheoryTopic | null> {
    try {
      const { data, error } = await supabase
        .from('theory_topics_generated')
        .select('*')
        .eq('id', topicId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapRowToTopic(data);
    } catch (error) {
      console.error('Error getting topic:', error);
      return null;
    }
  }

  /**
   * Get topics pending review (0.70-0.89 validation score)
   */
  async getReviewQueue(limit = 10): Promise<GeneratedTheoryTopic[]> {
    try {
      const { data, error } = await supabase
        .from('theory_topics_generated')
        .select('*')
        .eq('status', 'review')
        .order('generated_at', { ascending: true })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map((row) => this.mapRowToTopic(row)).filter(Boolean) as GeneratedTheoryTopic[];
    } catch (error) {
      console.error('Error getting review queue:', error);
      return [];
    }
  }

  /**
   * Update topic status
   */
  async updateStatus(
    topicId: string,
    status: TopicStatus
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('theory_topics_generated')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', topicId);

      if (error) {
        throw new Error(`Failed to update status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating topic status:', error);
      throw error;
    }
  }

  /**
   * Get generation statistics
   */
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('theory_topics_generated')
        .select('status, difficulty, area, validation_score');

      if (error || !data) {
        return null;
      }

      const stats = {
        totalTopicsGenerated: data.length,
        topicsInStatus: {
          draft: data.filter((t) => t.status === 'draft').length,
          review: data.filter((t) => t.status === 'review').length,
          approved: data.filter((t) => t.status === 'approved').length,
          published: data.filter((t) => t.status === 'published').length,
        },
        topicsByDifficulty: {
          basico: data.filter((t) => t.difficulty === 'basico').length,
          intermediario: data.filter((t) => t.difficulty === 'intermediario').length,
          avancado: data.filter((t) => t.difficulty === 'avancado').length,
        },
        topicsByArea: {
          clinica_medica: data.filter((t) => t.area === 'clinica_medica').length,
          cirurgia: data.filter((t) => t.area === 'cirurgia').length,
          pediatria: data.filter((t) => t.area === 'pediatria').length,
          ginecologia_obstetricia: data.filter((t) => t.area === 'ginecologia_obstetricia').length,
          saude_coletiva: data.filter((t) => t.area === 'saude_coletiva').length,
        },
        averageValidationScore:
          data.reduce((sum, t) => sum + (t.validation_score || 0), 0) / data.length || 0,
        autoApprovalRate:
          data.filter((t) => t.validation_score >= 0.9).length / data.length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return null;
    }
  }

  /**
   * Map database row to GeneratedTheoryTopic
   */
  private mapRowToTopic(row: any): GeneratedTheoryTopic {
    return {
      topicId: row.topic_id,
      title: row.title,
      description: row.description,
      area: row.area,
      difficulty: row.difficulty,
      sections: {
        definition: row.definition,
        epidemiology: row.epidemiology,
        pathophysiology: row.pathophysiology,
        clinicalPresentation: row.clinical_presentation,
        diagnosis: row.diagnosis,
        treatment: row.treatment,
        complications: row.complications,
        prognosis: row.prognosis,
      },
      keyPoints: row.key_points || [],
      estimatedReadTime: row.estimated_read_time || 15,
      relatedDiseaseIds: row.related_disease_ids || [],
      relatedMedicationIds: row.related_medication_ids || [],
      citations: [],  // Would load from theory_citations table
      citationProvenance: {},  // Would load from theory_topic_citations table
      generationMetadata: {
        sourceDiseaseId: row.source_disease_id,
        sourceType: row.source_type,
        generatedAt: new Date(row.generated_at),
        validationScore: row.validation_score,
        status: row.status,
        publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      },
    };
  }
}

export const storageService = new StorageService();
