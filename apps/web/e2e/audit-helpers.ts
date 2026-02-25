import type { Locator, Page, TestInfo } from '@playwright/test'

export interface AuditFinding {
  page: string
  category:
    | 'button_no_label'
    | 'link_no_text'
    | 'empty_heading'
    | 'empty_section'
    | 'broken_image'
    | 'empty_state_showing'
    | 'js_error'
    | 'http_error'
    | 'missing_data'
  selector: string
  detail: string
}

export class AuditCollector {
  findings: AuditFinding[] = []
  runtimeErrors: string[] = []

  add(finding: AuditFinding) {
    this.findings.push(finding)
  }

  async attachReport(testInfo: TestInfo) {
    if (this.findings.length > 0) {
      await testInfo.attach('audit-findings.json', {
        body: JSON.stringify(this.findings, null, 2),
        contentType: 'application/json',
      })

      const grouped = new Map<string, AuditFinding[]>()
      for (const f of this.findings) {
        const list = grouped.get(f.category) ?? []
        list.push(f)
        grouped.set(f.category, list)
      }

      const lines: string[] = [
        `=== Audit Report: ${this.findings.length} finding(s) ===`,
        '',
      ]
      for (const [cat, items] of grouped) {
        lines.push(`[${cat}] (${items.length})`)
        for (const item of items) {
          lines.push(`  - ${item.page}: ${item.detail}`)
        }
        lines.push('')
      }

      await testInfo.attach('audit-summary.txt', {
        body: lines.join('\n'),
        contentType: 'text/plain',
      })
    }

    if (this.runtimeErrors.length > 0) {
      await testInfo.attach('runtime-errors.json', {
        body: JSON.stringify(this.runtimeErrors, null, 2),
        contentType: 'application/json',
      })
    }
  }
}

/** Install pageerror, console.error, and HTTP 500 monitors (pattern from v6-wiring.spec.ts) */
export function installRuntimeMonitors(page: Page, collector: AuditCollector) {
  page.on('pageerror', (error) => {
    collector.runtimeErrors.push(`pageerror: ${error.message}`)
    collector.add({
      page: '',
      category: 'js_error',
      selector: 'pageerror',
      detail: error.message.slice(0, 200),
    })
  })

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // Ignore Next.js dev noise and known benign console errors
    if (text.includes('Download the React DevTools')) return
    if (text.includes('Warning:')) return
    collector.runtimeErrors.push(`console.error: ${text.slice(0, 200)}`)
  })

  page.on('response', (resp) => {
    if (resp.status() >= 500) {
      const pathname = new URL(resp.url()).pathname
      collector.runtimeErrors.push(`HTTP ${resp.status()}: ${pathname}`)
      collector.add({
        page: '',
        category: 'http_error',
        selector: pathname,
        detail: `HTTP ${resp.status()} on ${pathname}`,
      })
    }
  })
}

/** Check if a locator becomes visible within timeout (auto-retry, unlike isVisible()) */
export async function waitVisible(locator: Locator, timeout = 5_000): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

/** Wait for #main-content visible + spinners/loading to settle */
export async function waitForPageReady(page: Page, timeout = 15_000) {
  // Wait for the universal content wrapper (best-effort — some pages may not have it)
  await page
    .locator('#main-content')
    .waitFor({ state: 'visible', timeout })
    .catch(() => {
      /* fallback: wait for body to have meaningful content */
    })

  // Allow a brief settle for framer-motion animations, hydration, and data fetches
  await page.waitForTimeout(1500)

  // Wait for loading spinners to disappear (best-effort, don't fail if decorative)
  await page
    .waitForFunction(
      () => {
        const spinners = document.querySelectorAll('.animate-spin')
        // Only count spinners that are visible and large enough to be loading indicators
        let loadingSpinners = 0
        spinners.forEach((el) => {
          const rect = (el as HTMLElement).getBoundingClientRect()
          if (rect.width >= 16 && rect.height >= 16) loadingSpinners++
        })
        return loadingSpinners === 0
      },
      { timeout: 10_000 }
    )
    .catch(() => {
      /* some pages may have permanent decorative spinners */
    })
}

/** Check all visible h1/h2/h3 elements have non-empty text */
export async function auditHeadings(
  page: Page,
  collector: AuditCollector,
  pagePath: string
) {
  for (const tag of ['h1', 'h2', 'h3'] as const) {
    const headings = page.locator(tag)
    const count = await headings.count()
    for (let i = 0; i < count; i++) {
      const el = headings.nth(i)
      if (!(await el.isVisible().catch(() => false))) continue
      const text = (await el.innerText().catch(() => '')).trim()
      if (!text) {
        collector.add({
          page: pagePath,
          category: 'empty_heading',
          selector: `${tag}[${i}]`,
          detail: `Empty <${tag}> element visible`,
        })
      }
    }
  }
}

/** Check all visible buttons have text, aria-label, or title */
export async function auditButtons(
  page: Page,
  collector: AuditCollector,
  pagePath: string
) {
  const buttons = page.locator('button')
  const count = await buttons.count()

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    if (!(await btn.isVisible().catch(() => false))) continue

    const text = (await btn.innerText().catch(() => '')).trim()
    const ariaLabel = await btn.getAttribute('aria-label').catch(() => null)
    const title = await btn.getAttribute('title').catch(() => null)

    if (!text && !ariaLabel && !title) {
      const hasSvg = (await btn.locator('svg').count()) > 0
      const snippet = await btn
        .evaluate((el) => el.outerHTML.slice(0, 120))
        .catch(() => '<button?>')
      collector.add({
        page: pagePath,
        category: 'button_no_label',
        selector: snippet,
        detail: hasSvg
          ? 'Icon-only button without aria-label'
          : 'Button with no visible text or aria-label',
      })
    }
  }
}

/** Check all visible links have text, aria-label, or title */
export async function auditLinks(
  page: Page,
  collector: AuditCollector,
  pagePath: string
) {
  const links = page.locator('a')
  const count = await links.count()

  for (let i = 0; i < count; i++) {
    const link = links.nth(i)
    if (!(await link.isVisible().catch(() => false))) continue

    const text = (await link.innerText().catch(() => '')).trim()
    const ariaLabel = await link.getAttribute('aria-label').catch(() => null)
    const title = await link.getAttribute('title').catch(() => null)

    // Links with only images/icons are OK if they have alt text
    if (!text && !ariaLabel && !title) {
      const hasImg = (await link.locator('img').count()) > 0
      const hasSvg = (await link.locator('svg').count()) > 0
      if (hasImg) {
        const imgAlt = await link
          .locator('img')
          .first()
          .getAttribute('alt')
          .catch(() => null)
        if (imgAlt) continue
      }
      if (hasSvg) continue // SVG icon links are common for nav

      collector.add({
        page: pagePath,
        category: 'link_no_text',
        selector: (await link.getAttribute('href').catch(() => '')) ?? `a[${i}]`,
        detail: 'Link with no visible text or aria-label',
      })
    }
  }
}

/** Check visible images loaded successfully (naturalWidth > 0) */
export async function auditImages(
  page: Page,
  collector: AuditCollector,
  pagePath: string
) {
  const brokenImages = await page.evaluate(() => {
    const images = document.querySelectorAll('img')
    const broken: { src: string; alt: string }[] = []
    images.forEach((img) => {
      // Skip hidden images and placeholder/lazy images
      if (!img.offsetParent && !img.closest('[style*="display"]')) return
      if (img.naturalWidth === 0 && img.complete && img.src) {
        broken.push({ src: img.src, alt: img.alt || '' })
      }
    })
    return broken
  })

  for (const img of brokenImages) {
    collector.add({
      page: pagePath,
      category: 'broken_image',
      selector: img.src,
      detail: `Broken image: ${img.alt || img.src.slice(-60)}`,
    })
  }
}

/** Detect visible empty/fallback states that may indicate missing data */
export async function auditEmptyStates(
  page: Page,
  collector: AuditCollector,
  pagePath: string
) {
  const emptyPatterns = [
    'Nenhum simulado disponível',
    'Nenhuma tentativa ainda',
    'Nenhum puzzle disponível',
    'Nenhum deck criado',
    'Nenhuma trilha disponível',
    'Sem dados de desempenho',
    'Catálogo em atualização',
    'Nenhum caso disponível',
    'Nenhuma questão disponível',
    'Lista vazia',
    'Sem dados',
    'Nenhum resultado',
    'Complete pelo menos um simulado',
    'Wiring Supabase incompleto',
    'base Darwin-MFC está em sincronização',
    'Dados insuficientes',
  ]

  for (const pattern of emptyPatterns) {
    const found = page.getByText(pattern, { exact: false })
    const count = await found.count()
    if (count > 0) {
      const isVisible = await found.first().isVisible().catch(() => false)
      if (isVisible) {
        collector.add({
          page: pagePath,
          category: 'empty_state_showing',
          selector: pattern,
          detail: `Fallback/empty state visible: "${pattern}"`,
        })
      }
    }
  }
}

/** Run the full audit pipeline for a single page. Returns false if page redirected (e.g. consent). */
export async function auditPage(
  page: Page,
  pagePath: string,
  collector: AuditCollector,
  options?: { timeout?: number }
): Promise<boolean> {
  await page.goto(pagePath, {
    waitUntil: 'domcontentloaded',
    timeout: options?.timeout ?? 30_000,
  })

  // Check for auth consent redirect
  const currentPath = new URL(page.url()).pathname
  if (currentPath.startsWith('/legal/consent') || currentPath.startsWith('/auth')) {
    collector.add({
      page: pagePath,
      category: 'missing_data',
      selector: 'auth-consent-redirect',
      detail: `Page ${pagePath} redirected to ${currentPath} — auth state may be incomplete`,
    })
    return false
  }

  // Wait for client-side data fetches to complete (critical for client components
  // that render loading skeletons until useEffect data arrives).
  await page
    .waitForLoadState('networkidle', { timeout: 15_000 })
    .catch(() => {
      /* some pages may have long-polling or SSE connections */
    })

  await waitForPageReady(page, options?.timeout ?? 15_000)

  // Wait for page content to stream in (Next.js server components send content progressively).
  // Look for any h1 OR substantial visible content as a signal the page body is ready.
  await page
    .locator('h1')
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => {
      // Some pages may not have h1; fall through to audit
    })

  await auditHeadings(page, collector, pagePath)
  await auditButtons(page, collector, pagePath)
  await auditLinks(page, collector, pagePath)
  await auditImages(page, collector, pagePath)
  await auditEmptyStates(page, collector, pagePath)
  return true
}
