import type { SourcePolicySnapshot } from './types';

export const SOURCE_POLICY_VERSION = '2026-02-26-official-sources-v1';

export type SourceDecision = 'allow' | 'review' | 'block';

type SourceRightsClass =
  | 'official_public_exam_material'
  | 'official_exam_board_portal'
  | 'official_sample_questions'
  | 'commercial_prep_content'
  | 'unclassified';

interface SourceRule {
  id: string;
  label: string;
  domains: string[];
  pathIncludes?: string[];
  institution: string;
  examType: string | null;
  rightsClass: SourceRightsClass;
  decision: Exclude<SourceDecision, 'block'>;
  requiresHumanReview: boolean;
  reason: string;
  allowedActions: string[];
}

export interface OfficialDiscoverySeed {
  id: string;
  label: string;
  url: string;
  domain: string;
}

export interface InferredSourceMetadata {
  institution: string | null;
  examType: string | null;
  year: number | null;
}

const SOURCE_RULES: SourceRule[] = [
  {
    id: 'inep-official-exams',
    label: 'INEP official exam publication pages',
    domains: ['www.gov.br', 'gov.br'],
    pathIncludes: ['/inep/'],
    institution: 'INEP',
    examType: null,
    rightsClass: 'official_public_exam_material',
    decision: 'allow',
    requiresHumanReview: false,
    reason: 'Official INEP pages for exam publication and answer keys.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'store_provenance_and_audit_only',
    ],
  },
  {
    id: 'ebserh-enare-official',
    label: 'EBSERH ENARE official pages',
    domains: ['www.gov.br', 'gov.br'],
    pathIncludes: ['/ebserh/'],
    institution: 'EBSERH',
    examType: 'ENARE',
    rightsClass: 'official_public_exam_material',
    decision: 'allow',
    requiresHumanReview: false,
    reason: 'Official EBSERH portal for ENARE publication.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'store_provenance_and_audit_only',
    ],
  },
  {
    id: 'fgv-enare-portal',
    label: 'FGV ENARE hosting portal',
    domains: ['mapa-vagas-enare-ebserh.conhecimento.fgv.br'],
    institution: 'FGV/EBSERH',
    examType: 'ENARE',
    rightsClass: 'official_exam_board_portal',
    decision: 'review',
    requiresHumanReview: true,
    reason: 'Official contractor hosting. Keep human review before reuse/public delivery.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'require_manual_legal_review_before_publication',
    ],
  },
  {
    id: 'amrigs-official',
    label: 'AMRIGS official exam portal',
    domains: ['www.amrigs.org.br', 'amrigs.org.br'],
    pathIncludes: ['/prova'],
    institution: 'AMRIGS',
    examType: 'AMRIGS',
    rightsClass: 'official_exam_board_portal',
    decision: 'review',
    requiresHumanReview: true,
    reason: 'Official exam board portal, but reuse rights should be manually confirmed.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'require_manual_legal_review_before_publication',
    ],
  },
  {
    id: 'usmle-sample-questions',
    label: 'USMLE official sample questions',
    domains: ['www.usmle.org', 'usmle.org'],
    pathIncludes: ['/sample'],
    institution: 'USMLE',
    examType: 'USMLE',
    rightsClass: 'official_sample_questions',
    decision: 'review',
    requiresHumanReview: true,
    reason: 'Official sample material. Use for calibration/benchmark with legal review.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'require_manual_legal_review_before_publication',
    ],
  },
  {
    id: 'gmc-plab-sample-questions',
    label: 'GMC PLAB official sample questions',
    domains: ['www.gmc-uk.org', 'gmc-uk.org'],
    pathIncludes: ['/plab', '/sample'],
    institution: 'GMC',
    examType: 'PLAB',
    rightsClass: 'official_sample_questions',
    decision: 'review',
    requiresHumanReview: true,
    reason: 'Official sample material. Use for benchmark with legal review.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'require_manual_legal_review_before_publication',
    ],
  },
  {
    id: 'mcc-sample-questions',
    label: 'Medical Council of Canada sample questions',
    domains: ['www.mcc.ca', 'mcc.ca'],
    pathIncludes: ['/free-practice-questions'],
    institution: 'MCC',
    examType: 'MCCQE',
    rightsClass: 'official_sample_questions',
    decision: 'review',
    requiresHumanReview: true,
    reason: 'Official sample material. Use for benchmark with legal review.',
    allowedActions: [
      'discover_public_links',
      'ingest_for_internal_item_quality_analysis',
      'require_manual_legal_review_before_publication',
    ],
  },
];

const BLOCKED_DOMAIN_KEYWORDS = [
  'estrategiamed',
  'medcel',
  'sanar',
  'qconcursos',
  'medcof',
  'medway',
  'residenciamedica',
  'aprovatotal',
];

export const OFFICIAL_DISCOVERY_SEEDS: OfficialDiscoverySeed[] = [
  {
    id: 'inep-enamed-provas-gabaritos',
    label: 'INEP Enamed - provas e gabaritos',
    url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos',
    domain: 'www.gov.br',
  },
  {
    id: 'inep-revalida-provas-gabaritos',
    label: 'INEP Revalida - provas e gabaritos',
    url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos',
    domain: 'www.gov.br',
  },
  {
    id: 'ebserh-enare-area-candidato',
    label: 'EBSERH ENARE - area do candidato',
    url: 'https://www.gov.br/ebserh/pt-br/ensino-e-pesquisa/exame-nacional-de-residencia-enare/edicoes-anteriores/2024-2025/area-do-candidato',
    domain: 'www.gov.br',
  },
  {
    id: 'fgv-enare-portal',
    label: 'FGV ENARE portal',
    url: 'https://mapa-vagas-enare-ebserh.conhecimento.fgv.br/provas-gabaritos-medica.html',
    domain: 'mapa-vagas-enare-ebserh.conhecimento.fgv.br',
  },
  {
    id: 'amrigs-prova',
    label: 'AMRIGS prova portal',
    url: 'https://www.amrigs.org.br/prova/',
    domain: 'www.amrigs.org.br',
  },
  {
    id: 'usmle-step1-sample',
    label: 'USMLE Step 1 sample questions',
    url: 'https://www.usmle.org/exam-resources/step-1-materials/step-1-sample-test-questions',
    domain: 'www.usmle.org',
  },
  {
    id: 'usmle-step2-sample',
    label: 'USMLE Step 2 CK sample questions',
    url: 'https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-sample-test-questions',
    domain: 'www.usmle.org',
  },
  {
    id: 'gmc-plab-sample',
    label: 'GMC PLAB sample questions',
    url: 'https://www.gmc-uk.org/registration-and-licensing/join-our-registers/plab/plab-1-guide/sample-questions',
    domain: 'www.gmc-uk.org',
  },
  {
    id: 'mcc-free-practice',
    label: 'MCC free practice questions',
    url: 'https://mcc.ca/examinations-assessments/resources-to-help-with-exam-prep/free-practice-questions/',
    domain: 'mcc.ca',
  },
];

function toCanonicalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function normalizeDomain(domainOrUrl: string): string {
  if (!domainOrUrl) return '';

  let host = domainOrUrl.trim().toLowerCase();
  try {
    const parsed = new URL(host.startsWith('http') ? host : `https://${host}`);
    host = parsed.hostname.toLowerCase();
  } catch {
    host = host.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  }

  return host.replace(/^www\./, '');
}

function matchesRule(rule: SourceRule, urlObj: URL, normalizedDomain: string): boolean {
  const ruleMatchesDomain = rule.domains.some((ruleDomain) => {
    const normalizedRuleDomain = normalizeDomain(ruleDomain);
    return (
      normalizedDomain === normalizedRuleDomain ||
      normalizedDomain.endsWith(`.${normalizedRuleDomain}`)
    );
  });

  if (!ruleMatchesDomain) return false;
  if (!rule.pathIncludes || rule.pathIncludes.length === 0) return true;

  const path = `${urlObj.pathname}${urlObj.search}`.toLowerCase();
  return rule.pathIncludes.some((snippet) => path.includes(snippet.toLowerCase()));
}

function fallbackExamTypeFromUrl(rawUrl: string): string | null {
  const value = rawUrl.toLowerCase();
  if (value.includes('enamed')) return 'ENAMED';
  if (value.includes('revalida')) return 'REVALIDA';
  if (value.includes('enare')) return 'ENARE';
  if (value.includes('amrigs')) return 'AMRIGS';
  if (value.includes('usmle')) return 'USMLE';
  if (value.includes('plab')) return 'PLAB';
  if (value.includes('mcc')) return 'MCCQE';
  return null;
}

function fallbackInstitutionFromUrl(rawUrl: string): string | null {
  const value = rawUrl.toLowerCase();
  if (value.includes('/inep/') || value.includes('inep')) return 'INEP';
  if (value.includes('/ebserh/') || value.includes('enare')) return 'EBSERH';
  if (value.includes('fgv')) return 'FGV/EBSERH';
  if (value.includes('amrigs')) return 'AMRIGS';
  if (value.includes('usmle')) return 'USMLE';
  if (value.includes('gmc')) return 'GMC';
  if (value.includes('mcc')) return 'MCC';
  return null;
}

function extractYear(rawUrl: string): number | null {
  const match = rawUrl.match(/(?:19|20)\d{2}/g);
  if (!match || match.length === 0) return null;

  const parsed = Number.parseInt(match[0], 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function buildBlockedAssessment(
  rawUrl: string,
  normalizedDomain: string,
  reason: string,
  rightsClass: SourceRightsClass
): SourcePolicySnapshot {
  return {
    policyVersion: SOURCE_POLICY_VERSION,
    ruleId: null,
    decision: 'block',
    domain: normalizedDomain,
    canonicalUrl: toCanonicalUrl(rawUrl),
    institution: null,
    examType: fallbackExamTypeFromUrl(rawUrl),
    rightsClass,
    requiresHumanReview: true,
    reason,
    allowedActions: [],
  };
}

export function evaluateSourceUrl(rawUrl: string): SourcePolicySnapshot {
  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    return buildBlockedAssessment(
      rawUrl,
      normalizeDomain(rawUrl),
      'Invalid URL format.',
      'unclassified'
    );
  }

  const normalizedDomain = normalizeDomain(urlObj.hostname);

  if (BLOCKED_DOMAIN_KEYWORDS.some((blocked) => normalizedDomain.includes(blocked))) {
    return buildBlockedAssessment(
      rawUrl,
      normalizedDomain,
      'Domain appears to be a commercial prep source and is blocked by policy.',
      'commercial_prep_content'
    );
  }

  const matchedRule = SOURCE_RULES.find((rule) => matchesRule(rule, urlObj, normalizedDomain));
  if (!matchedRule) {
    return buildBlockedAssessment(
      rawUrl,
      normalizedDomain,
      'Domain/path not covered by official-source policy allowlist.',
      'unclassified'
    );
  }

  return {
    policyVersion: SOURCE_POLICY_VERSION,
    ruleId: matchedRule.id,
    decision: matchedRule.decision,
    domain: normalizedDomain,
    canonicalUrl: toCanonicalUrl(rawUrl),
    institution: matchedRule.institution,
    examType: matchedRule.examType ?? fallbackExamTypeFromUrl(rawUrl),
    rightsClass: matchedRule.rightsClass,
    requiresHumanReview: matchedRule.requiresHumanReview,
    reason: matchedRule.reason,
    allowedActions: matchedRule.allowedActions,
  };
}

export function getDiscoverySeedsForDomains(domains: string[]): OfficialDiscoverySeed[] {
  const normalized = domains.map(normalizeDomain).filter(Boolean);
  if (normalized.length === 0) return OFFICIAL_DISCOVERY_SEEDS;

  return OFFICIAL_DISCOVERY_SEEDS.filter((seed) => {
    const seedDomain = normalizeDomain(seed.domain);
    return normalized.some(
      (domain) => seedDomain === domain || seedDomain.endsWith(`.${domain}`)
    );
  });
}

export function isSourceAllowedForExtraction(assessment: SourcePolicySnapshot): boolean {
  return assessment.decision !== 'block';
}

export function inferSourceMetadataFromUrl(
  rawUrl: string,
  policy?: SourcePolicySnapshot | null
): InferredSourceMetadata {
  return {
    institution: policy?.institution ?? fallbackInstitutionFromUrl(rawUrl),
    examType: policy?.examType ?? fallbackExamTypeFromUrl(rawUrl),
    year: extractYear(rawUrl),
  };
}

export function buildSourceEvidenceRecord(params: {
  policy: SourcePolicySnapshot;
  discoveredFromUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: string | null;
  extractionMethod: string;
  rawTextSha256: string;
  chunkCount: number;
  fetchedAtUtc: string;
}): Record<string, unknown> {
  return {
    source: {
      url: params.policy.canonicalUrl,
      domain: params.policy.domain,
      title: params.sourceTitle ?? null,
      type: params.sourceType ?? null,
      discovered_from_url: params.discoveredFromUrl ?? null,
      fetched_at_utc: params.fetchedAtUtc,
    },
    source_policy: {
      version: params.policy.policyVersion,
      rule_id: params.policy.ruleId,
      decision: params.policy.decision,
      rights_class: params.policy.rightsClass,
      requires_human_review: params.policy.requiresHumanReview,
      allowed_actions: params.policy.allowedActions,
      reason: params.policy.reason,
    },
    extraction_evidence: {
      method: params.extractionMethod,
      raw_text_sha256: params.rawTextSha256,
      chunk_count: params.chunkCount,
    },
  };
}
