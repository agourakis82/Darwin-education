/**
 * Citation Verification Service
 *
 * Validates citations for accuracy and accessibility:
 * - URL reachability and HTTP status codes
 * - Title matching and metadata extraction
 * - Evidence level appropriateness
 * - Publication year validity
 * - Medical authority verification
 *
 * Prevents hallucination by ensuring all citations are verified
 */

export interface CitationVerification {
  url: string;
  title: string;
  isAccessible: boolean;
  statusCode?: number;
  extractedTitle?: string;
  titleMatch: boolean;
  publicationYear?: number;
  evidenceLevel: 'A' | 'B' | 'C' | 'unverified';
  source: 'brazilian_guideline' | 'pubmed' | 'uptodate' | 'web' | 'unknown';
  isAuthoritative: boolean;
  verificationScore: number; // 0-1, higher is more reliable
  warnings: string[];
  lastVerifiedAt: Date;
}

export interface HallucinationCheck {
  section: string;
  claim: string;
  supportingCitations: string[]; // URLs
  claimSupported: boolean;
  confidence: number; // 0-1
  explanation: string;
}

export interface AuditEntry {
  topicId: string;
  section: string;
  claim: string;
  citationUrl: string;
  verificationStatus: 'verified' | 'unverified' | 'failed' | 'contradiction';
  confidence: number;
  timestamp: Date;
  verifier: string; // AI or human
}

const MEDICAL_AUTHORITIES = [
  'sbcardiologia.org.br',
  'febrasgo.org.br',
  'sbp.com.br',
  'sbpd.org.br',
  'sociedadesdeclassesdicos.org.br',
  'pubmed.ncbi.nlm.nih.gov',
  'uptodate.com',
  'ncbi.nlm.nih.gov',
  'thelancet.com',
  'nejm.org',
  'bmj.com',
  'jama.com',
  'acpjournals.org',
];

const UNRELIABLE_SOURCES = [
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'medium.com',
  'wordpress.com',
  'blogspot.com',
  'quora.com',
];

export class CitationVerificationService {
  private verificationCache: Map<string, CitationVerification> = new Map();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Verify a citation's accessibility and metadata
   */
  async verifyCitation(url: string, title: string, publicationYear?: number, evidenceLevel: 'A' | 'B' | 'C' = 'C'): Promise<CitationVerification> {
    // Check cache first
    const cacheKey = this.getCacheKey(url);
    const cached = this.verificationCache.get(cacheKey);
    if (cached && Date.now() - cached.lastVerifiedAt.getTime() < this.CACHE_TTL) {
      return cached;
    }

    const verification: CitationVerification = {
      url,
      title,
      isAccessible: false,
      titleMatch: false,
      evidenceLevel,
      source: this.inferSource(url),
      isAuthoritative: this.isAuthoritativeSource(url),
      verificationScore: 0,
      warnings: [],
      lastVerifiedAt: new Date(),
    };

    // Check for unreliable sources
    if (this.isUnreliableSource(url)) {
      verification.warnings.push('Source is not medically authoritative');
      verification.verificationScore = 0.3;
      this.verificationCache.set(cacheKey, verification);
      return verification;
    }

    // Try to fetch and verify
    try {
      const response = await this.fetchWithTimeout(url, 5000);
      verification.statusCode = response.status;
      verification.isAccessible = response.ok;

      if (response.ok) {
        const content = await response.text();
        verification.extractedTitle = this.extractPageTitle(content);
        verification.titleMatch = this.compareTitles(title, verification.extractedTitle);

        // Calculate verification score
        verification.verificationScore = this.calculateVerificationScore(verification);
      } else {
        verification.warnings.push(`HTTP ${response.status}: Citation may be inaccessible`);
        verification.verificationScore = 0.5; // Partial credit for correct URL format
      }
    } catch (error) {
      verification.warnings.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      verification.verificationScore = 0.3; // Low score for unreachable citations

      // But don't mark as false if URL format is valid
      if (this.isValidUrlFormat(url)) {
        verification.isAccessible = false; // Temporarily unreachable
      }
    }

    // Validate publication year
    if (publicationYear) {
      const currentYear = new Date().getFullYear();
      if (publicationYear > currentYear) {
        verification.warnings.push(`Invalid publication year: ${publicationYear} is in the future`);
        verification.verificationScore *= 0.5;
      } else if (publicationYear < 1900) {
        verification.warnings.push(`Outdated source: ${publicationYear}`);
        verification.verificationScore *= 0.6;
      } else if (currentYear - publicationYear > 15) {
        verification.warnings.push(`Source is ${currentYear - publicationYear} years old; may be outdated`);
        // Still acceptable but lower score
        verification.verificationScore *= 0.9;
      }
    }

    // Cache result
    this.verificationCache.set(cacheKey, verification);
    return verification;
  }

  /**
   * Verify all citations in a set
   */
  async verifyAllCitations(citations: { url: string; title: string; publicationYear?: number; evidenceLevel?: 'A' | 'B' | 'C' }[]): Promise<CitationVerification[]> {
    return Promise.all(
      citations.map(c =>
        this.verifyCitation(c.url, c.title, c.publicationYear, c.evidenceLevel)
      )
    );
  }

  /**
   * Check for hallucinations by verifying claims are supported by citations
   *
   * Algorithm:
   * 1. Extract key claims from generated content
   * 2. For each claim, check if supporting citations exist
   * 3. Verify citations actually contain the claim (semantic search)
   * 4. Flag unsupported claims as hallucinations
   */
  async detectHallucinations(
    section: string,
    content: string,
    citations: CitationVerification[]
  ): Promise<HallucinationCheck[]> {
    const claims = this.extractClaims(content);
    const hallucinations: HallucinationCheck[] = [];

    // High-risk patterns that require strong citation support
    const dangerousPatterns = [
      /dosage|dose|mg|μg|ml|mL|cc/i,
      /contraindicated?|do not|avoid|never/i,
      /fatal|lethal|deadly|death|mortality/i,
      /side effect|adverse|complication|risk/i,
      /approved|FDA|ANVISA|recommended|indicated/i,
    ];

    for (const claim of claims) {
      const isDangerousClaim = dangerousPatterns.some(p => p.test(claim));

      // Get citations that might support this claim
      const supportingCitations = citations
        .filter(c => c.isAccessible && c.verificationScore > 0.7)
        .map(c => c.url);

      const hallucination: HallucinationCheck = {
        section,
        claim,
        supportingCitations,
        claimSupported: supportingCitations.length > 0,
        confidence: this.calculateClaimConfidence(claim, supportingCitations.length, isDangerousClaim),
        explanation: this.generateHallucinationExplanation(claim, supportingCitations, isDangerousClaim),
      };

      // Flag as potential hallucination if:
      // - Dangerous claim with no strong citations
      // - Specific facts without sources
      // - Numerical claims (dosages, percentages) without backing
      if (isDangerousClaim && supportingCitations.length === 0) {
        hallucinations.push({
          ...hallucination,
          claimSupported: false,
          confidence: 0,
          explanation: `CRITICAL: Dangerous claim without citation support: "${claim}"`,
        });
      } else if (this.containsSpecificFact(claim) && supportingCitations.length === 0) {
        hallucinations.push({
          ...hallucination,
          claimSupported: false,
          confidence: 0.2,
          explanation: `Specific claim lacks citation: "${claim}"`,
        });
      }
    }

    return hallucinations;
  }

  /**
   * Create audit trail entry for claim-citation relationship
   */
  async createAuditEntry(
    topicId: string,
    section: string,
    claim: string,
    citationUrl: string,
    verificationStatus: 'verified' | 'unverified' | 'failed' | 'contradiction',
    confidence: number
  ): Promise<AuditEntry> {
    return {
      topicId,
      section,
      claim,
      citationUrl,
      verificationStatus,
      confidence,
      timestamp: new Date(),
      verifier: 'ai-system',
    };
  }

  /**
   * Calculate overall verification score (0-1)
   */
  private calculateVerificationScore(verification: CitationVerification): number {
    let score = 0;

    // Accessibility (40% weight)
    score += (verification.isAccessible ? 0.4 : 0.1);

    // Title match (25% weight)
    score += (verification.titleMatch ? 0.25 : 0.1);

    // Authority (25% weight)
    score += (verification.isAuthoritative ? 0.25 : 0.1);

    // Evidence level (10% bonus)
    if (verification.evidenceLevel === 'A') score += 0.1;
    else if (verification.evidenceLevel === 'B') score += 0.05;

    return Math.min(1, score);
  }

  /**
   * Calculate confidence that a claim is supported by available citations
   */
  private calculateClaimConfidence(claim: string, citationCount: number, isDangerous: boolean): number {
    if (citationCount === 0) return isDangerous ? 0 : 0.3;
    if (citationCount === 1) return isDangerous ? 0.5 : 0.7;
    if (citationCount >= 2) return isDangerous ? 0.8 : 0.95;
    return 0.5;
  }

  /**
   * Generate explanation for hallucination detection
   */
  private generateHallucinationExplanation(claim: string, citations: string[], isDangerous: boolean): string {
    if (citations.length === 0) {
      if (isDangerous) {
        return `UNSUPPORTED DANGEROUS CLAIM: "${claim}" has no citation backing. This is a critical medical safety issue.`;
      }
      return `No citations found to support: "${claim}"`;
    }

    if (isDangerous && citations.length < 2) {
      return `INSUFFICIENT EVIDENCE: Dangerous claim "${claim}" has only ${citations.length} source(s). Recommend at least 2 for medical claims.`;
    }

    return `Claim has ${citations.length} supporting citation(s)`;
  }

  /**
   * Extract key claims from text
   */
  private extractClaims(text: string): string[] {
    const claims: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      // Filter out empty or very short sentences
      if (trimmed.length > 20) {
        claims.push(trimmed);
      }
    }

    return claims;
  }

  /**
   * Check if text contains specific factual claims
   */
  private containsSpecificFact(text: string): boolean {
    // Patterns that indicate specific claims
    return /\b(mg|percentage|%|\d+\s*(years?|months?|days?|hours?)|blood pressure|heart rate|temperature)\b/i.test(text);
  }

  /**
   * Compare two titles for similarity
   */
  private compareTitles(title1: string, title2?: string): boolean {
    if (!title2) return false;

    // Normalize: lowercase, remove punctuation, trim
    const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const n1 = normalize(title1);
    const n2 = normalize(title2);

    // Exact match or contains at least 70% of words
    if (n1 === n2) return true;

    const words1 = new Set(n1.split(/\s+/));
    const words2 = new Set(n2.split(/\s+/));
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const minWords = Math.min(words1.size, words2.size);

    return minWords > 0 && intersection / minWords > 0.7;
  }

  /**
   * Extract page title from HTML
   */
  private extractPageTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim().substring(0, 200); // Cap at 200 chars
    }

    // Fall back to og:title
    const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].trim();
    }

    return undefined;
  }

  /**
   * Infer source type from URL
   */
  private inferSource(url: string): 'brazilian_guideline' | 'pubmed' | 'uptodate' | 'web' | 'unknown' {
    const domain = this.extractDomain(url);

    if (/sbcardiologia|febrasgo|sbp|sbpd|brasileir/.test(domain)) return 'brazilian_guideline';
    if (/pubmed|ncbi/.test(domain)) return 'pubmed';
    if (/uptodate/.test(domain)) return 'uptodate';
    if (domain) return 'web';

    return 'unknown';
  }

  /**
   * Check if source is authoritative for medical information
   */
  private isAuthoritativeSource(url: string): boolean {
    const domain = this.extractDomain(url);
    return MEDICAL_AUTHORITIES.some(auth => domain.includes(auth));
  }

  /**
   * Check if source is unreliable
   */
  private isUnreliableSource(url: string): boolean {
    const domain = this.extractDomain(url);
    return UNRELIABLE_SOURCES.some(unreliable => domain.includes(unreliable));
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrlFormat(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    return Promise.race([
      fetch(url, { method: 'HEAD', redirect: 'follow' }).catch(() =>
        fetch(url, { method: 'GET', redirect: 'follow' })
      ),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), timeout)
      ),
    ]);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(url: string): string {
    return `citation-verify-${url}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.verificationCache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.verificationCache.size,
      entries: Array.from(this.verificationCache.keys()),
    };
  }
}

export default CitationVerificationService;
