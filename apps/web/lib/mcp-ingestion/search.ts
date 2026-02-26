import { createClient } from '@supabase/supabase-js';
import { IngestionSource, McpSearchResult } from './types';
import { parseGabaritoPdf, processExtractedLinks } from './extractor';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ============================================================
// FGV Portal scraper
// ============================================================

const FGV_BASE_URL = 'https://mapa-vagas-enare-ebserh.conhecimento.fgv.br';
const FGV_INDEX_URL = `${FGV_BASE_URL}/provas-gabaritos-medica.html`;

/**
 * Scrapes the FGV ENARE portal index page for all PDF links.
 * Classifies each link as 'prova' or 'gabarito' based on URL content.
 */
async function scrapeFgvPortal(): Promise<McpSearchResult[]> {
  console.log(`[MCP Search] Scraping FGV portal: ${FGV_INDEX_URL}`);

  const response = await fetch(FGV_INDEX_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  if (!response.ok) {
    console.error(`[MCP Search] Failed to fetch FGV portal. Status: ${response.status}`);
    return [];
  }

  const html = await response.text();
  const regex = /href="([^"]+\.pdf)"/gi;
  const results: McpSearchResult[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    let link = match[1];

    if (!link.startsWith('http')) {
      const parts = link.split('/');
      link = `${FGV_BASE_URL}/${parts.map(p => encodeURIComponent(p)).join('/')}`;
    }

    const decoded = decodeURIComponent(link);
    const filename = decoded.split('/').pop() || '';
    // Check FILENAME only — the path contains "provas-gabaritos" for all PDFs
    const isGabarito = filename.toLowerCase().includes('gabarito');

    results.push({
      title: filename.replace('.pdf', ''),
      url: link,
      snippet: isGabarito ? 'Gabarito (answer key)' : 'Prova (exam)',
      type: isGabarito ? 'gabarito' : 'prova',
    });
  }

  console.log(`[MCP Search] Found ${results.length} PDFs (${results.filter(r => r.type === 'prova').length} provas, ${results.filter(r => r.type === 'gabarito').length} gabaritos)`);
  return results;
}

/**
 * Generic page scraper: fetches a URL and extracts all PDF links.
 * Used for trusted domains that aren't the FGV portal.
 */
async function scrapePageForPdfs(pageUrl: string, baseDomain: string): Promise<McpSearchResult[]> {
  try {
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const regex = /href="([^"]+\.pdf)"/gi;
    const results: McpSearchResult[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      let link = match[1];
      if (!link.startsWith('http')) {
        link = new URL(link, pageUrl).href;
      }

      const decoded = decodeURIComponent(link);
      const filename = decoded.split('/').pop() || '';
      const isGabarito = filename.toLowerCase().includes('gabarito');

      results.push({
        title: filename.replace('.pdf', ''),
        url: link,
        snippet: isGabarito ? 'Gabarito (answer key)' : 'Prova (exam)',
        type: isGabarito ? 'gabarito' : 'prova',
      });
    }

    return results;
  } catch (error) {
    console.error(`[MCP Search] Failed to scrape ${pageUrl}:`, error);
    return [];
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Executes a web search/scrape for medical exam PDFs on trusted domains.
 * Replaces the previous mock implementation with real portal scraping.
 */
export async function performMcpSearch(query: string, domains: string[]): Promise<McpSearchResult[]> {
  console.log(`[MCP Search] Searching for: "${query}" on domains: ${domains.join(', ')}`);
  const results: McpSearchResult[] = [];

  for (const domain of domains) {
    if (domain.includes('conhecimento.fgv.br') || domain.includes('mapa-vagas-enare')) {
      const fgvResults = await scrapeFgvPortal();
      results.push(...fgvResults);
    } else {
      // For other trusted domains, try to scrape their root for PDF links
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const pageResults = await scrapePageForPdfs(url, domain);
      results.push(...pageResults);
    }
  }

  // Filter by query terms if provided (basic keyword matching)
  if (query && query.trim()) {
    const terms = query.toLowerCase().split(/\s+/);
    const filtered = results.filter(r => {
      const text = `${r.title} ${r.snippet} ${r.url}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });
    // If filtering leaves results, use them; otherwise return all (avoid empty set from bad query)
    if (filtered.length > 0) return filtered;
  }

  return results;
}

/**
 * Triggers the search routine for all active ingestion sources.
 * Scrapes trusted domains, parses gabaritos first, then extracts questions from exams.
 */
export async function triggerSearchRoutine() {
  console.log('[MCP Ingestion] Starting search routine...');

  // 1. Fetch active sources
  const { data: sources, error: sourceError } = await getSupabase()
    .from('ingestion_sources')
    .select('*')
    .eq('is_active', true);

  if (sourceError || !sources || sources.length === 0) {
    console.error('[MCP Ingestion] Failed to fetch sources or none active:', sourceError);
    return;
  }

  for (const source of sources as IngestionSource[]) {
    // 2. Create a new run
    const { data: run, error: runError } = await getSupabase()
      .from('ingestion_runs')
      .insert({
        source_id: source.id,
        status: 'running',
        links_found: 0,
        questions_extracted: 0
      })
      .select()
      .single();

    if (runError || !run) {
      console.error(`[MCP Ingestion] Failed to create run for source ${source.name}:`, runError);
      continue;
    }

    try {
      // 3. Perform searches
      let allLinks: McpSearchResult[] = [];

      for (const term of source.search_terms) {
        const results = await performMcpSearch(term, source.trusted_domains);
        allLinks = [...allLinks, ...results];
      }

      // Deduplicate by URL
      const uniqueLinks = Array.from(new Map(allLinks.map(item => [item.url, item])).values());

      // 4. Split into exams and gabaritos
      const examLinks = uniqueLinks.filter(l => l.type !== 'gabarito');
      const gabaritoLinks = uniqueLinks.filter(l => l.type === 'gabarito');

      console.log(`[MCP Ingestion] ${examLinks.length} exam PDFs, ${gabaritoLinks.length} gabarito PDFs`);

      // 5. Parse gabaritos first → build combined answer map
      const answerMap = new Map<number, number>();
      // Process "definitivo" last so it overwrites "preliminar" answers
      const sortedGabaritos = gabaritoLinks.sort((a, b) => {
        const aIsDef = a.url.toLowerCase().includes('definitivo') ? 1 : 0;
        const bIsDef = b.url.toLowerCase().includes('definitivo') ? 1 : 0;
        return aIsDef - bIsDef;
      });

      for (const gab of sortedGabaritos) {
        const answers = await parseGabaritoPdf(gab.url);
        for (const [num, idx] of answers) {
          answerMap.set(num, idx);
        }
      }

      if (answerMap.size > 0) {
        console.log(`[MCP Ingestion] Answer key has ${answerMap.size} answers`);
      }

      // 6. Update run with link count
      await getSupabase()
        .from('ingestion_runs')
        .update({
          links_found: uniqueLinks.length,
        })
        .eq('id', run.id);

      // 7. Process exam PDFs with answer map
      const totalExtracted = await processExtractedLinks(examLinks, run.id, answerMap);

      // 8. Finalize run
      await getSupabase()
        .from('ingestion_runs')
        .update({
          status: 'completed',
          questions_extracted: totalExtracted,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      // 9. Update source last_run_at
      await getSupabase()
        .from('ingestion_sources')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', source.id);

      console.log(`[MCP Ingestion] Run completed for ${source.name}. ${totalExtracted} questions extracted.`);
    } catch (err: any) {
      console.error(`[MCP Ingestion] Run failed for ${source.name}:`, err);
      await getSupabase()
        .from('ingestion_runs')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);
    }
  }
}
