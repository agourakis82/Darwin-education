/**
 * Database Audit Service
 *
 * Persists citation verification and hallucination detection results
 * to database for audit trails and compliance tracking
 */

import { createClient } from '@supabase/supabase-js';
import { CitationVerification, HallucinationCheck, AuditEntry } from './citation-verification-service';

export interface AuditSaveOptions {
  userId?: string;
  overwrite?: boolean;
}

export class DatabaseAuditService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  /**
   * Save citation verification results to audit trail
   * Automatically looks up or creates citation by URL
   */
  async saveCitationVerification(
    topicId: string,
    citationUrl: string,
    verification: CitationVerification,
    options?: AuditSaveOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Look up citation by URL or create if doesn't exist
      let citationId: string;

      const { data: existing } = await this.supabase
        .from('theory_citations')
        .select('id')
        .eq('url', citationUrl)
        .single();

      if (existing?.id) {
        citationId = existing.id;
      } else {
        // Create new citation
        const { data: created, error: createError } = await this.supabase
          .from('theory_citations')
          .insert({
            url: citationUrl,
            title: verification.title,
            source: verification.source,
            evidence_level: verification.evidenceLevel,
            is_accessible: verification.isAccessible,
            accessibility_checked_at: verification.lastVerifiedAt,
          })
          .select('id')
          .single();

        if (createError || !created?.id) {
          return { success: false, error: createError?.message || 'Could not create citation' };
        }

        citationId = created.id;
      }

      // Now save audit record
      const { error } = await this.supabase
        .from('citation_verification_audit')
        .insert({
          topic_id: topicId,
          citation_id: citationId,
          is_accessible: verification.isAccessible,
          http_status_code: verification.statusCode,
          title_match: verification.titleMatch,
          extracted_title: verification.extractedTitle,
          verification_score: verification.verificationScore,
          is_authoritative: verification.isAuthoritative,
          source_type: verification.source,
          warnings: verification.warnings,
          verified_at: verification.lastVerifiedAt,
          verification_method: this.inferVerificationMethod(verification),
          verified_by: options?.userId || 'ai-system',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save hallucination detection results
   */
  async saveHallucinationCheck(
    topicId: string,
    hallucination: HallucinationCheck,
    isDangerousClaim: boolean = false,
    options?: AuditSaveOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Create claim hash for deduplication
      const claimHash = this.hashClaim(hallucination.claim);

      // Determine risk level
      const riskLevel = this.assessRiskLevel(hallucination, isDangerousClaim);

      const { data, error } = await this.supabase
        .from('hallucination_audit')
        .insert({
          topic_id: topicId,
          section_name: hallucination.section,
          claim_text: hallucination.claim,
          claim_hash: claimHash,
          claim_supported: hallucination.claimSupported,
          confidence: hallucination.confidence,
          is_dangerous_claim: isDangerousClaim,
          risk_level: riskLevel,
          checked_at: new Date(),
          checked_by: options?.userId || 'ai-system',
          review_status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.id) {
        // Save provenance details if there are supporting citations
        if (hallucination.supportingCitations.length > 0) {
          await this.saveCitationProvenance(
            topicId,
            data.id,
            hallucination.supportingCitations,
            hallucination.confidence
          );
        }
      }

      return { success: true, id: data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save citation provenance relationships
   */
  private async saveCitationProvenance(
    topicId: string,
    hallucinationAuditId: string,
    citationUrls: string[],
    confidence: number
  ): Promise<void> {
    // For each citation URL, look up its ID and create provenance entry
    for (const url of citationUrls) {
      try {
        // Get citation ID by URL
        const { data: citation } = await this.supabase
          .from('theory_citations')
          .select('id')
          .eq('url', url)
          .single();

        if (citation?.id) {
          await this.supabase
            .from('citation_provenance_audit')
            .insert({
              topic_id: topicId,
              hallucination_audit_id: hallucinationAuditId,
              citation_id: citation.id,
              support_confidence: confidence,
              evidence_strength: this.assessEvidenceStrength(confidence),
              justification: `Automatically linked supporting citation`,
            });
        }
      } catch (error) {
        // Log but don't fail - provenance is nice to have but not critical
        console.error(`Error linking provenance for ${url}:`, error);
      }
    }
  }

  /**
   * Generate audit report for a topic
   */
  async generateAuditReport(topicId: string): Promise<{
    topic_id: string;
    total_claims_checked: number;
    unsupported_claims: number;
    critical_issues: number;
    verification_score: number;
    citations_verified: number;
    citations_accessible: number;
    citations_authoritative: number;
    timestamp: Date;
  }> {
    try {
      // Get hallucination audit data
      const { data: hallucinations } = await this.supabase
        .from('hallucination_audit')
        .select('*')
        .eq('topic_id', topicId);

      // Get citation verification data
      const { data: citations } = await this.supabase
        .from('citation_verification_audit')
        .select('*')
        .eq('topic_id', topicId);

      const totalClaims = hallucinations?.length || 0;
      const unsupportedClaims = hallucinations?.filter(h => !h.claim_supported).length || 0;
      const criticalIssues = hallucinations?.filter(h => h.risk_level === 'critical').length || 0;

      const totalCitations = citations?.length || 0;
      const accessibleCitations = citations?.filter(c => c.is_accessible).length || 0;
      const authoritativeCitations = citations?.filter(c => c.is_authoritative).length || 0;

      const verificationScore =
        totalCitations > 0
          ? (accessibleCitations / totalCitations + authoritativeCitations / totalCitations) / 2
          : 0;

      return {
        topic_id: topicId,
        total_claims_checked: totalClaims,
        unsupported_claims: unsupportedClaims,
        critical_issues: criticalIssues,
        verification_score: Math.round(verificationScore * 100) / 100,
        citations_verified: totalCitations,
        citations_accessible: accessibleCitations,
        citations_authoritative: authoritativeCitations,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate audit report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all unsupported claims for a topic
   */
  async getUnsupportedClaims(topicId: string): Promise<HallucinationCheck[]> {
    try {
      const { data, error } = await this.supabase
        .from('hallucination_audit')
        .select('*')
        .eq('topic_id', topicId)
        .eq('claim_supported', false)
        .order('risk_level', { ascending: false });

      if (error) throw error;

      return (
        data?.map(d => ({
          section: d.section_name,
          claim: d.claim_text,
          supportingCitations: d.supporting_citations || [],
          claimSupported: d.claim_supported,
          confidence: d.confidence,
          explanation: `Risk level: ${d.risk_level}. ${d.claim_text}`,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching unsupported claims:', error);
      return [];
    }
  }

  /**
   * Mark a hallucination claim as reviewed
   */
  async markClaimReviewed(
    hallucinationAuditId: string,
    status: 'approved' | 'disputed' | 'rejected',
    reviewedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('hallucination_audit')
        .update({
          review_status: status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date(),
        })
        .eq('id', hallucinationAuditId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get inaccessible citations for a topic
   */
  async getInaccessibleCitations(topicId: string): Promise<CitationVerification[]> {
    try {
      const { data, error } = await this.supabase
        .from('citation_verification_audit')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_accessible', false)
        .gt('http_status_code', 399);

      if (error) throw error;

      return (
        data?.map(d => ({
          url: d.url,
          title: d.extracted_title || 'Unknown',
          isAccessible: false,
          statusCode: d.http_status_code,
          titleMatch: d.title_match,
          evidenceLevel: 'unverified' as const,
          source: d.source_type,
          isAuthoritative: d.is_authoritative,
          verificationScore: d.verification_score,
          warnings: d.warnings || [],
          lastVerifiedAt: new Date(d.verified_at),
        })) || []
      );
    } catch (error) {
      console.error('Error fetching inaccessible citations:', error);
      return [];
    }
  }

  /**
   * Helper: Infer verification method based on what was checked
   */
  private inferVerificationMethod(
    verification: CitationVerification
  ): 'http_check' | 'title_extraction' | 'ai_review' {
    if (verification.extractedTitle) return 'title_extraction';
    if (verification.statusCode !== undefined) return 'http_check';
    return 'ai_review';
  }

  /**
   * Helper: Assess risk level based on hallucination check
   */
  private assessRiskLevel(
    hallucination: HallucinationCheck,
    isDangerousClaim: boolean
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (!hallucination.claimSupported) {
      if (isDangerousClaim) return 'critical';
      if (hallucination.confidence < 0.3) return 'high';
      return 'medium';
    }
    return 'low';
  }

  /**
   * Helper: Assess evidence strength based on confidence
   */
  private assessEvidenceStrength(confidence: number): 'direct' | 'indirect' | 'speculative' {
    if (confidence >= 0.8) return 'direct';
    if (confidence >= 0.5) return 'indirect';
    return 'speculative';
  }

  /**
   * Helper: Hash a claim for deduplication
   */
  private hashClaim(claim: string): string {
    // Simple hash: first 50 chars + claim length
    const normalized = claim.toLowerCase().trim();
    const hash = normalized.substring(0, 50) + normalized.length;
    return hash;
  }
}

export default DatabaseAuditService;
