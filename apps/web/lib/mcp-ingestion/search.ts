import { createClient } from '@supabase/supabase-js';
import { IngestionSource, McpSearchResult } from './types';
import { parseGabaritoPdf, processExtractedLinks } from './extractor';
import {
  evaluateSourceUrl,
  getDiscoverySeedsForDomains,
  isSourceAllowedForExtraction,
  normalizeDomain,
} from './sourcePolicy';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface LinkCandidate {
  url: string;
  text: string;
}

type RoutineSource = Pick<IngestionSource, 'name' | 'search_terms' | 'trusted_domains'> & {
  id: string | null;
};

const DISCOVERY_MAX_PAGES_PER_SEED = 5;
const DEFAULT_OFFICIAL_DOMAINS = [
  'gov.br',
  'mapa-vagas-enare-ebserh.conhecimento.fgv.br',
  'amrigs.org.br',
  'usmle.org',
  'gmc-uk.org',
  'mcc.ca',
];

function classifyLinkType(rawUrl: string, title: string): 'prova' | 'gabarito' | 'unknown' {
  const value = `${rawUrl} ${title}`.toLowerCase();
  if (value.includes('gabarito') || value.includes('answer-key') || value.includes('answers')) {
    return 'gabarito';
  }
  if (
    value.includes('prova') ||
    value.includes('caderno') ||
    value.includes('question') ||
    value.includes('exam') ||
    value.includes('teste')
  ) {
    return 'prova';
  }
  return 'unknown';
}

function inferTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const last = decodeURIComponent(parsed.pathname.split('/').pop() || '').trim();
    if (last) return last.replace(/\.pdf$/i, '');
    return parsed.hostname;
  } catch {
    return rawUrl;
  }
}

function extractAnchors(html: string, pageUrl: string): LinkCandidate[] {
  const matches = html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
  const anchors: LinkCandidate[] = [];

  for (const match of matches) {
    const href = match[1]?.trim();
    const anchorText = (match[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!href) continue;
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('#')) continue;

    try {
      const absolute = new URL(href, pageUrl).toString();
      anchors.push({ url: absolute, text: anchorText });
    } catch {
      // Ignore malformed URLs
    }
  }

  return anchors;
}

function shouldFollowLink(link: LinkCandidate, seedHost: string): boolean {
  const urlLower = link.url.toLowerCase();
  const textLower = link.text.toLowerCase();

  let linkHost = '';
  try {
    linkHost = normalizeDomain(new URL(link.url).hostname);
  } catch {
    return false;
  }

  const isSameHost = linkHost === seedHost;
  const isGovPortalCrossLink =
    seedHost.endsWith('gov.br') && (linkHost === 'gov.br' || linkHost.endsWith('.gov.br'));

  if (!isSameHost && !isGovPortalCrossLink) return false;
  if (urlLower.endsWith('.pdf')) return false;

  const relevanceKeywords = [
    'prova',
    'gabarito',
    'enamed',
    'enare',
    'revalida',
    'edicoes',
    'anteriores',
    'residencia',
    'sample',
    'question',
    'exam',
    'plab',
    'usmle',
  ];

  return relevanceKeywords.some(
    (keyword) => urlLower.includes(keyword) || textLower.includes(keyword)
  );
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.warn(`[MCP Search] HTTP ${response.status} while fetching ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) return null;
    return await response.text();
  } catch (error) {
    console.warn(`[MCP Search] Failed to fetch ${url}:`, error);
    return null;
  }
}

async function crawlSeedPageForPdfs(seedUrl: string): Promise<McpSearchResult[]> {
  const results = new Map<string, McpSearchResult>();
  const visited = new Set<string>();
  const queue: string[] = [seedUrl];

  let seedHost = '';
  try {
    seedHost = normalizeDomain(new URL(seedUrl).hostname);
  } catch {
    return [];
  }

  while (queue.length > 0 && visited.size < DISCOVERY_MAX_PAGES_PER_SEED) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const html = await fetchHtml(current);
    if (!html) continue;

    const anchors = extractAnchors(html, current);

    for (const anchor of anchors) {
      const hrefLower = anchor.url.toLowerCase();
      if (hrefLower.includes('.pdf')) {
        const title = inferTitleFromUrl(anchor.url);
        const policy = evaluateSourceUrl(anchor.url);
        const type = classifyLinkType(anchor.url, `${title} ${anchor.text}`);
        results.set(anchor.url, {
          title,
          url: anchor.url,
          snippet: `${type === 'gabarito' ? 'Gabarito' : 'Prova'} discovered from official seed`,
          type,
          discoveredFromUrl: current,
          discoveryMethod: current === seedUrl ? 'seed_page' : 'domain_crawl',
          sourcePolicy: policy,
        });
        continue;
      }

      if (shouldFollowLink(anchor, seedHost) && !visited.has(anchor.url)) {
        queue.push(anchor.url);
      }
    }
  }

  return Array.from(results.values());
}

export async function performMcpSearch(query: string, domains: string[]): Promise<McpSearchResult[]> {
  const normalizedDomains = domains.map(normalizeDomain).filter(Boolean);
  const seeds = getDiscoverySeedsForDomains(normalizedDomains);

  const seedUrls =
    seeds.length > 0
      ? seeds.map((seed) => seed.url)
      : normalizedDomains.map((domain) => `https://${domain}`);

  console.info(
    `[MCP Search] Searching with ${seedUrls.length} seed page(s) across domains: ${
      normalizedDomains.join(', ') || 'default official set'
    }`
  );

  const crawled = await Promise.all(seedUrls.map((seedUrl) => crawlSeedPageForPdfs(seedUrl)));
  const flattened = crawled.flat();
  const deduped = Array.from(new Map(flattened.map((item) => [item.url, item])).values());

  if (!query || !query.trim()) return deduped;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = deduped.filter((result) => {
    const haystack = `${result.title} ${result.snippet} ${result.url}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });

  return filtered.length > 0 ? filtered : deduped;
}

export async function triggerSearchRoutine() {
  console.info('[MCP Ingestion] Starting search routine...');

  const { data: sourcesData, error: sourceError } = await getSupabase()
    .from('ingestion_sources')
    .select('*')
    .eq('is_active', true);

  if (sourceError) {
    console.error('[MCP Ingestion] Failed to fetch ingestion sources:', sourceError);
    return;
  }

  const sources: RoutineSource[] =
    sourcesData && sourcesData.length > 0
      ? (sourcesData as IngestionSource[]).map((source) => ({ ...source, id: source.id }))
      : [
          {
            id: null,
            name: 'Official public medical exam seeds',
            search_terms: ['provas gabaritos medicina residencia enamed enare revalida'],
            trusted_domains: ['gov.br', 'mapa-vagas-enare-ebserh.conhecimento.fgv.br'],
          },
        ];

  for (const source of sources) {
    const runPayload: {
      source_id?: string;
      status: 'running';
      links_found: number;
      questions_extracted: number;
    } = {
      status: 'running',
      links_found: 0,
      questions_extracted: 0,
    };
    if (source.id) runPayload.source_id = source.id;

    const { data: run, error: runError } = await getSupabase()
      .from('ingestion_runs')
      .insert(runPayload)
      .select()
      .single();

    if (runError || !run) {
      console.error(`[MCP Ingestion] Failed to create run for source ${source.name}:`, runError);
      continue;
    }

    try {
      const terms =
        source.search_terms && source.search_terms.length > 0
          ? source.search_terms
          : ['provas gabaritos medicina residencia'];
      const trustedDomains = Array.from(
        new Set([...(source.trusted_domains || []), ...DEFAULT_OFFICIAL_DOMAINS])
      );

      let allLinks: McpSearchResult[] = [];
      for (const term of terms) {
        const found = await performMcpSearch(term, trustedDomains);
        allLinks = [...allLinks, ...found];
      }

      const uniqueLinks = Array.from(new Map(allLinks.map((item) => [item.url, item])).values());

      const decisionCounts = uniqueLinks.reduce(
        (acc, link) => {
          const decision = link.sourcePolicy?.decision || 'block';
          if (decision === 'allow') acc.allow += 1;
          else if (decision === 'review') acc.review += 1;
          else acc.block += 1;
          return acc;
        },
        { allow: 0, review: 0, block: 0 }
      );

      const allowedLinks = uniqueLinks.filter(
        (link) => link.sourcePolicy && isSourceAllowedForExtraction(link.sourcePolicy)
      );
      const blockedLinks = uniqueLinks.filter(
        (link) => !link.sourcePolicy || !isSourceAllowedForExtraction(link.sourcePolicy)
      );

      const examLinks = allowedLinks.filter((link) => link.type !== 'gabarito');
      const gabaritoLinks = allowedLinks.filter((link) => link.type === 'gabarito');

      console.info(
        `[MCP Ingestion] ${source.name}: ${allowedLinks.length} allowed links (${examLinks.length} provas, ${gabaritoLinks.length} gabaritos), ${blockedLinks.length} blocked`
      );

      await getSupabase()
        .from('ingestion_runs')
        .update({
          links_found: uniqueLinks.length,
          links_allowed: decisionCounts.allow,
          links_review: decisionCounts.review,
          links_blocked: decisionCounts.block,
          error_message:
            blockedLinks.length > 0
              ? `Source policy blocked ${blockedLinks.length} link(s).`
              : null,
        })
        .eq('id', run.id);

      const answerMap = new Map<number, number>();
      const sortedGabaritos = [...gabaritoLinks].sort((a, b) => {
        const aIsDefinitive = a.url.toLowerCase().includes('definitivo') ? 1 : 0;
        const bIsDefinitive = b.url.toLowerCase().includes('definitivo') ? 1 : 0;
        return aIsDefinitive - bIsDefinitive;
      });

      for (const gabarito of sortedGabaritos) {
        const answers = await parseGabaritoPdf(gabarito.url, gabarito);
        for (const [questionNumber, answerIndex] of answers) {
          answerMap.set(questionNumber, answerIndex);
        }
      }

      if (answerMap.size > 0) {
        console.info(`[MCP Ingestion] ${source.name}: ${answerMap.size} answer(s) parsed from keys`);
      }

      const totalExtracted = await processExtractedLinks(examLinks, run.id, answerMap);

      await getSupabase()
        .from('ingestion_runs')
        .update({
          status: 'completed',
          questions_extracted: totalExtracted,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      if (source.id) {
        await getSupabase()
          .from('ingestion_sources')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', source.id);
      }

      console.info(
        `[MCP Ingestion] Run completed for ${source.name}. ${totalExtracted} question(s) extracted.`
      );
    } catch (error) {
      console.error(`[MCP Ingestion] Run failed for ${source.name}:`, error);

      await getSupabase()
        .from('ingestion_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }
  }
}
