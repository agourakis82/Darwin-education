import { test, expect } from '@playwright/test'
import {
  AuditCollector,
  installRuntimeMonitors,
  waitForPageReady,
  waitVisible,
  auditPage,
} from './audit-helpers'

const STORAGE_STATE = 'e2e/.auth/user.json'

// ============================================================
// Content Audit — Click-by-click page verification
// ============================================================
test.describe('Content Audit', () => {
  test.skip(
    () => {
      try {
        require('fs').accessSync(STORAGE_STATE)
        return false
      } catch {
        return true
      }
    },
    'Requires storage state — run `npx playwright codegen --save-storage=e2e/.auth/user.json` first'
  )

  test.use({ storageState: STORAGE_STATE })

  // Use --workers=1 on CLI to avoid Supabase rate limits

  // ============================================================
  // TIER 1 — Main Pages
  // ============================================================
  test.describe('Tier 1 — Main Pages', () => {
    test('/ — Home page', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Hero heading present', async () => {
        const hero = page.getByRole('heading', { level: 1 })
        const visible = await waitVisible(hero)
        if (visible) {
          const text = await hero.innerText()
          expect.soft(text).toContain('Preparação ENAMED')
        } else {
          c.add({ page: '/', category: 'missing_data', selector: 'h1', detail: 'Hero h1 heading not visible' })
        }
      })

      await test.step('Stat pills render (4 expected)', async () => {
        for (const label of ['Questões', 'Doenças', 'Medicamentos', 'Pontuação']) {
          const visible = await waitVisible(page.getByText(label, { exact: true }))
          if (!visible) {
            c.add({ page: '/', category: 'missing_data', selector: `stat:${label}`, detail: `Stat pill "${label}" not visible` })
          }
          expect.soft(visible, `Stat pill "${label}" should be visible`).toBe(true)
        }
      })

      await test.step('Feature cards render with titles', async () => {
        const expectedTitles = [
          'Simulado ENAMED',
          'Flashcards',
          'Trilhas de Estudo',
          'Quebra-Cabeça Clínico',
          'Monte sua Prova',
          'Desempenho',
          'IA Orientação',
          'Conteúdo Médico',
          'Diagnóstico de Lacunas',
          'QGen DDL',
          'Raciocínio Clínico Fractal',
          'Psicometria Avançada',
          'Domínio de Conhecimento',
          'Métodos de Estudo',
        ]

        for (const title of expectedTitles) {
          const heading = page.getByRole('heading', { name: title })
          const visible = await waitVisible(heading)
          if (!visible) {
            c.add({
              page: '/',
              category: 'missing_data',
              selector: `feature-card:${title}`,
              detail: `Feature card title "${title}" not visible`,
            })
          }
          expect.soft(visible, `Feature card "${title}" should be visible`).toBe(true)
        }
      })

      await test.step('CTA buttons present', async () => {
        const ctaSimulado = await waitVisible(page.getByRole('link', { name: /Iniciar Simulado/i }))
        const ctaProva = await waitVisible(page.getByRole('link', { name: /Montar Prova/i }))
        if (!ctaSimulado) c.add({ page: '/', category: 'missing_data', selector: 'cta-simulado', detail: '"Iniciar Simulado" CTA not visible' })
        if (!ctaProva) c.add({ page: '/', category: 'missing_data', selector: 'cta-prova', detail: '"Montar Prova" CTA not visible' })
        expect.soft(ctaSimulado, 'CTA "Iniciar Simulado" visible').toBe(true)
        expect.soft(ctaProva, 'CTA "Montar Prova" visible').toBe(true)
      })

      await test.step('Hero image loads', async () => {
        const heroImg = page.locator('img[alt*="Estudantes de medicina"]')
        if ((await heroImg.count()) > 0) {
          const visible = await heroImg.isVisible().catch(() => false)
          if (!visible) c.add({ page: '/', category: 'broken_image', selector: 'hero-image', detail: 'Hero image not visible' })
        }
      })

      await test.step('Warning banners check', async () => {
        const schemaDrift = page.getByText('Wiring Supabase incompleto')
        if (await schemaDrift.isVisible().catch(() => false)) {
          c.add({
            page: '/',
            category: 'missing_data',
            selector: 'schema-drift-banner',
            detail: 'Schema drift warning is showing — migrations may be missing',
          })
        }

        const missingSeed = page.getByText('base Darwin-MFC está em sincronização')
        if (await missingSeed.isVisible().catch(() => false)) {
          c.add({
            page: '/',
            category: 'empty_state_showing',
            selector: 'missing-seed-banner',
            detail: 'Medical seed data warning showing — diseases/medications count is 0',
          })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/simulado — Exam listing', async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/simulado', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const h1 = page.locator('h1').first()
        const visible = await waitVisible(h1, 10_000)
        if (visible) {
          const text = await h1.innerText()
          if (!/Simulados/i.test(text)) {
            c.add({ page: '/simulado', category: 'missing_data', selector: 'page-heading', detail: `Expected "Simulados" in h1, got "${text}"` })
          }
        } else {
          c.add({ page: '/simulado', category: 'missing_data', selector: 'page-heading', detail: 'Simulado heading not visible' })
        }
        expect.soft(visible, 'Simulado heading should be visible').toBe(true)
      })

      await test.step('Quick action cards', async () => {
        for (const label of ['Simulado Rápido', 'Simulado Completo', 'Montar Prova', 'Adaptativo']) {
          const el = page.getByText(label, { exact: false })
          const visible = await waitVisible(el)
          if (!visible) {
            c.add({ page: '/simulado', category: 'missing_data', selector: `quick-action:${label}`, detail: `Quick action "${label}" not visible` })
          }
        }
      })

      await test.step('Available exams section', async () => {
        const heading = page.getByRole('heading', { name: /Disponíveis/i })
        const visible = await waitVisible(heading)
        if (!visible) {
          c.add({ page: '/simulado', category: 'missing_data', selector: 'available-exams-heading', detail: '"Simulados Disponíveis" heading not found' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/flashcards — Flashcard decks', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/flashcards', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const heading = page.getByRole('heading', { name: /Flashcards/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/flashcards', category: 'missing_data', selector: 'page-heading', detail: 'Flashcards heading not visible' })
        expect.soft(visible, 'Flashcards heading should be visible').toBe(true)
      })

      await test.step('Stats visible', async () => {
        for (const label of ['Decks', 'Total de Cards', 'Para Revisar']) {
          const visible = await waitVisible(page.getByText(label, { exact: false }))
          if (!visible) {
            c.add({ page: '/flashcards', category: 'missing_data', selector: `stat:${label}`, detail: `Stat "${label}" not visible` })
          }
        }
      })

      await test.step('Create deck link', async () => {
        const link = page.getByRole('link', { name: /Criar/i })
        const visible = await waitVisible(link)
        if (!visible) {
          c.add({ page: '/flashcards', category: 'missing_data', selector: 'create-deck-link', detail: '"Criar deck" link not visible' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/conteudo — Medical content hub', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/conteudo', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const heading = page.getByRole('heading', { name: /Conteúdo Médico/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/conteudo', category: 'missing_data', selector: 'page-heading', detail: 'Conteúdo Médico heading not visible' })
        expect.soft(visible, 'Conteúdo heading should be visible').toBe(true)
      })

      await test.step('Section cards', async () => {
        for (const section of ['Doenças', 'Medicamentos', 'Teoria']) {
          const heading = page.getByRole('heading', { name: new RegExp(section, 'i') })
          const visible = await waitVisible(heading)
          if (!visible) {
            c.add({ page: '/conteudo', category: 'missing_data', selector: `section:${section}`, detail: `Section "${section}" heading not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })

    test('/conteudo/doencas — Diseases list', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/conteudo/doencas', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Disease cards render', async () => {
        const cards = page.locator('a[href^="/conteudo/doencas/"]')
        const count = await cards.count()
        if (count === 0) {
          c.add({ page: '/conteudo/doencas', category: 'empty_state_showing', selector: 'disease-cards', detail: 'No disease cards rendered — table may be empty' })
        }
      })

      await test.step('Area filter tabs', async () => {
        const tabs = page.getByRole('link', { name: 'Todas' })
        const visible = await waitVisible(tabs)
        if (!visible) {
          c.add({ page: '/conteudo/doencas', category: 'missing_data', selector: 'area-filter', detail: 'Area filter tabs not visible' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/conteudo/medicamentos — Medications list', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/conteudo/medicamentos', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Medication cards render', async () => {
        const cards = page.locator('a[href^="/conteudo/medicamentos/"]')
        const count = await cards.count()
        if (count === 0) {
          c.add({ page: '/conteudo/medicamentos', category: 'empty_state_showing', selector: 'medication-cards', detail: 'No medication cards rendered — table may be empty' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/trilhas — Study paths', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/trilhas', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const heading = page.getByRole('heading', { name: /Trilhas/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/trilhas', category: 'missing_data', selector: 'page-heading', detail: 'Trilhas heading not visible' })
        expect.soft(visible, 'Trilhas heading should be visible').toBe(true)
      })

      await test.step('Stats cards', async () => {
        for (const label of ['disponíveis', 'andamento', 'Concluídas']) {
          const visible = await waitVisible(page.getByText(label, { exact: false }))
          if (!visible) {
            c.add({ page: '/trilhas', category: 'missing_data', selector: `stat:${label}`, detail: `Stat containing "${label}" not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })
  })

  // ============================================================
  // TIER 2 — Feature Pages
  // ============================================================
  test.describe('Tier 2 — Feature Pages', () => {
    test('/desempenho — Performance dashboard', async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/desempenho', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Heading visible', async () => {
        const h1 = page.locator('h1').first()
        const visible = await waitVisible(h1, 10_000)
        if (visible) {
          const text = await h1.innerText()
          if (!/Desempenho/i.test(text)) {
            c.add({ page: '/desempenho', category: 'missing_data', selector: 'page-heading', detail: `Expected "Desempenho" in h1, got "${text}"` })
          }
        } else {
          c.add({ page: '/desempenho', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Desempenho" not visible' })
        }
        expect.soft(visible, 'Desempenho heading should be visible').toBe(true)
      })

      await test.step('Stats or empty state', async () => {
        const hasStats = await waitVisible(page.getByText('Pontuação Média', { exact: false }))
        const hasEmpty = await waitVisible(page.getByText(/Complete pelo menos|Sem dados/i))

        if (!hasStats && !hasEmpty) {
          c.add({ page: '/desempenho', category: 'missing_data', selector: 'stats-or-empty', detail: 'Neither stats nor empty state visible' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/montar-prova — Custom exam builder', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/montar-prova', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page loads with content', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 100) {
          c.add({ page: '/montar-prova', category: 'missing_data', selector: 'body', detail: 'Page body has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/cip — Clinical puzzles hub', async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/cip', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const h1 = page.locator('h1').first()
        const visible = await waitVisible(h1, 10_000)
        if (visible) {
          const text = await h1.innerText()
          if (!/CIP|Quebra/i.test(text)) {
            c.add({ page: '/cip', category: 'missing_data', selector: 'page-heading', detail: `Expected "CIP" in h1, got "${text}"` })
          }
        } else {
          c.add({ page: '/cip', category: 'missing_data', selector: 'page-heading', detail: 'CIP heading not visible' })
        }
        expect.soft(visible, 'CIP heading should be visible').toBe(true)
      })

      await test.step('How it works section', async () => {
        const visible = await waitVisible(page.getByText('Como funciona', { exact: false }))
        if (!visible) c.add({ page: '/cip', category: 'missing_data', selector: 'how-it-works', detail: '"Como funciona" section not visible' })
      })

      await test.step('Quick action cards', async () => {
        for (const label of ['Interpretação', 'Rápido', 'Médio', 'Desafio']) {
          const visible = await waitVisible(page.getByText(label, { exact: false }))
          if (!visible) {
            c.add({ page: '/cip', category: 'missing_data', selector: `action:${label}`, detail: `Quick action "${label}" not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })

    test('/fcr — Clinical reasoning', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/fcr', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const heading = page.getByRole('heading', { name: /Raciocínio Clínico/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/fcr', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Raciocínio Clínico Fractal" not visible' })
        expect.soft(visible, 'FCR heading should be visible').toBe(true)
      })

      await c.attachReport(testInfo)
    })

    test('/ddl — Gap diagnostics', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/ddl', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page heading', async () => {
        const heading = page.getByRole('heading', { name: /Diagnóstico|Lacunas/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/ddl', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Diagnóstico Diferencial de Lacunas" not visible' })
        expect.soft(visible, 'DDL heading should be visible').toBe(true)
      })

      await test.step('Lacuna type descriptions', async () => {
        for (const type of ['Epistêmica', 'Emocional', 'Integração']) {
          const visible = await waitVisible(page.getByText(type, { exact: false }))
          if (!visible) {
            c.add({ page: '/ddl', category: 'missing_data', selector: `lacuna:${type}`, detail: `Lacuna type "${type}" not visible` })
          }
        }
      })

      await test.step('Start button', async () => {
        const btn = page.getByRole('button', { name: /Iniciar/i })
        const visible = await waitVisible(btn)
        if (!visible) c.add({ page: '/ddl', category: 'missing_data', selector: 'start-button', detail: '"Iniciar" button not visible' })
      })

      await c.attachReport(testInfo)
    })

    test('/qgen — Question generation', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      const loaded = await auditPage(page, '/qgen', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Tab navigation', async () => {
        for (const tab of ['Gerar Questão', 'Lote', 'Prova Completa', 'Estatísticas', 'Revisão']) {
          const btn = page.getByRole('button', { name: new RegExp(tab, 'i') })
          const visible = await waitVisible(btn)
          if (!visible) {
            c.add({ page: '/qgen', category: 'missing_data', selector: `tab:${tab}`, detail: `Tab "${tab}" button not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })
  })

  // ============================================================
  // TIER 3 — Sub-pages
  // ============================================================
  test.describe('Tier 3 — Sub-pages', () => {
    test('/cip/interpretacao — Image interpretation', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/cip/interpretacao', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Step explainer visible', async () => {
        for (const step of ['Modalidade', 'Achados', 'Diagnóstico', 'Conduta']) {
          const visible = await waitVisible(page.getByText(step, { exact: false }))
          if (!visible) {
            c.add({ page: '/cip/interpretacao', category: 'missing_data', selector: `step:${step}`, detail: `Step "${step}" not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })

    test('/cip/achievements — Achievements', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/cip/achievements', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page loads with content', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 100) {
          c.add({ page: '/cip/achievements', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/cip/leaderboard — Leaderboard', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/cip/leaderboard', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Heading visible', async () => {
        const heading = page.getByRole('heading', { name: /Ranking|Leaderboard|CIP/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/cip/leaderboard', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Ranking CIP" not visible' })
        expect.soft(visible, 'Leaderboard heading should be visible').toBe(true)
      })

      await c.attachReport(testInfo)
    })

    test('/simulado/adaptive — Adaptive exam', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/simulado/adaptive', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Content renders', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 100) {
          c.add({ page: '/simulado/adaptive', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/ia-orientacao — AI guidance', async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/ia-orientacao', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Heading visible', async () => {
        const h1 = page.locator('h1').first()
        const visible = await waitVisible(h1, 10_000)
        if (visible) {
          const text = await h1.innerText()
          if (!/IA|Orientação/i.test(text)) {
            c.add({ page: '/ia-orientacao', category: 'missing_data', selector: 'page-heading', detail: `Expected "IA Orientação" in h1, got "${text}"` })
          }
        } else {
          c.add({ page: '/ia-orientacao', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "IA Orientação de Estudos" not visible' })
        }
        expect.soft(visible, 'IA Orientação heading should be visible').toBe(true)
      })

      await test.step('Analyze button', async () => {
        const btn = page.getByRole('button', { name: /Analisar/i })
        const visible = await waitVisible(btn)
        if (!visible) c.add({ page: '/ia-orientacao', category: 'missing_data', selector: 'analyze-button', detail: '"Analisar" button not visible' })
      })

      await c.attachReport(testInfo)
    })

    test('/caso-clinico — Clinical cases', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/caso-clinico', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Heading visible', async () => {
        const heading = page.getByRole('heading', { name: /Caso Clínico/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/caso-clinico', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Caso Clínico Interativo" not visible' })
        expect.soft(visible, 'Caso Clínico heading should be visible').toBe(true)
      })

      await test.step('Generate button', async () => {
        const btn = page.getByRole('button', { name: /Gerar/i })
        const visible = await waitVisible(btn)
        if (!visible) c.add({ page: '/caso-clinico', category: 'missing_data', selector: 'generate-button', detail: '"Gerar Caso Clínico" button not visible' })
      })

      await c.attachReport(testInfo)
    })

    test('/pesquisa — Research hub', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/pesquisa', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Heading visible', async () => {
        const heading = page.getByRole('heading', { name: /Pesquisa/i })
        const visible = await waitVisible(heading)
        if (!visible) c.add({ page: '/pesquisa', category: 'missing_data', selector: 'page-heading', detail: 'Main heading "Pesquisa Psicométrica" not visible' })
        expect.soft(visible, 'Pesquisa heading should be visible').toBe(true)
      })

      await test.step('Section links', async () => {
        for (const link of ['Psicometria', 'Domínio']) {
          const visible = await waitVisible(page.getByText(link, { exact: false }))
          if (!visible) {
            c.add({ page: '/pesquisa', category: 'missing_data', selector: `link:${link}`, detail: `"${link}" section link not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })

    test('/pesquisa/psicometria — Psychometrics', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/pesquisa/psicometria', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Content renders', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 200) {
          c.add({ page: '/pesquisa/psicometria', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/pesquisa/dominio — Domain knowledge', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/pesquisa/dominio', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Content renders', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 200) {
          c.add({ page: '/pesquisa/dominio', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })

    test('/metodos-estudo — Study methods', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/metodos-estudo', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Method cards visible', async () => {
        for (const method of ['Pomodoro', 'Espaçada']) {
          const visible = await waitVisible(page.getByText(method, { exact: false }))
          if (!visible) {
            c.add({ page: '/metodos-estudo', category: 'missing_data', selector: `method:${method}`, detail: `Study method "${method}" not visible` })
          }
        }
      })

      await c.attachReport(testInfo)
    })

    test('/faculty/dashboard — Faculty EREM dashboard', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/faculty/dashboard', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Page loads', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 50) {
          c.add({ page: '/faculty/dashboard', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
      // Faculty page may have legitimate console errors if user lacks role
    })

    test('/conteudo/teoria — Theory listing', async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)
      const loaded = await auditPage(page, '/conteudo/teoria', c)
      if (!loaded) { await c.attachReport(testInfo); return }

      await test.step('Content renders', async () => {
        const content = await page.textContent('body')
        if ((content?.length ?? 0) < 200) {
          c.add({ page: '/conteudo/teoria', category: 'missing_data', selector: 'body', detail: 'Page has insufficient content' })
        }
      })

      await c.attachReport(testInfo)
    })
  })

  // ============================================================
  // Navigation & Click-through
  // ============================================================
  test.describe('Navigation & Click-through', () => {
    test('Primary nav links visible and functional', async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      // Set desktop viewport to ensure desktop nav (hidden md:flex) is visible
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await waitForPageReady(page)

      // Navigation uses role="menubar" > role="menuitem" (not <nav>/<a>)
      const menubar = page.locator('[role="menubar"]')

      // Check primary nav links are visible
      await test.step('Nav links visible', async () => {
        for (const label of ['Início', 'Simulado', 'Flashcards', 'Trilhas', 'Conteúdo']) {
          const item = menubar.getByRole('menuitem', { name: label })
          const visible = await item.isVisible().catch(() => false)
          if (!visible) {
            c.add({ page: '/', category: 'missing_data', selector: `nav:${label}`, detail: `Nav link "${label}" not visible` })
          }
          expect.soft(visible, `Nav "${label}" should be visible`).toBe(true)
        }
      })

      // Click each link and verify navigation
      const navTargets = [
        { label: 'Simulado', path: '/simulado' },
        { label: 'Flashcards', path: '/flashcards' },
        { label: 'Trilhas', path: '/trilhas' },
        { label: 'Conteúdo', path: '/conteudo' },
      ]

      for (const { label, path } of navTargets) {
        await test.step(`Nav "${label}" → ${path}`, async () => {
          await page.goto('/', { waitUntil: 'domcontentloaded' })
          await waitForPageReady(page)

          const item = menubar.getByRole('menuitem', { name: label })
          const itemVisible = await item.isVisible().catch(() => false)
          if (!itemVisible) {
            c.add({ page: '/', category: 'missing_data', selector: `nav:${label}`, detail: `Nav link "${label}" not clickable` })
            return
          }
          await item.click()
          await page.waitForURL(`**${path}**`, { timeout: 10_000 }).catch(() => {})
          const currentPath = new URL(page.url()).pathname

          // Handle auth consent redirect
          if (currentPath.startsWith('/legal/consent')) {
            c.add({ page: '/', category: 'missing_data', selector: `nav:${label}`, detail: `Nav "${label}" redirected to consent page instead of ${path}` })
          } else {
            expect.soft(currentPath, `Nav "${label}" should go to ${path}`).toBe(path)
          }
        })
      }

      await c.attachReport(testInfo)
    })

    test('Click-through flows: Home → feature pages', async ({ page }, testInfo) => {
      test.setTimeout(120_000)
      const c = new AuditCollector()
      installRuntimeMonitors(page, c)

      await test.step('Home → Iniciar Simulado', async () => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        await waitForPageReady(page)

        const cta = page.getByRole('link', { name: /Iniciar Simulado/i })
        const visible = await cta.isVisible().catch(() => false)
        if (!visible) {
          c.add({ page: '/', category: 'missing_data', selector: 'cta-simulado', detail: '"Iniciar Simulado" CTA not clickable' })
          return
        }
        await cta.click()
        await page.waitForURL('**/simulado**', { timeout: 10_000 }).catch(() => {})
        const path = new URL(page.url()).pathname
        if (path.startsWith('/legal/consent')) {
          c.add({ page: '/', category: 'missing_data', selector: 'cta-simulado', detail: 'CTA redirected to consent page' })
        } else {
          expect.soft(path, 'Should navigate to /simulado').toBe('/simulado')
        }
      })

      await test.step('Home → feature card "Flashcards"', async () => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        await waitForPageReady(page)

        const card = page.locator('a[href="/flashcards"]').first()
        const visible = await card.isVisible().catch(() => false)
        if (!visible) {
          c.add({ page: '/', category: 'missing_data', selector: 'card-flashcards', detail: 'Flashcards feature card not clickable' })
          return
        }
        await card.click()
        await page.waitForURL('**/flashcards**', { timeout: 10_000 }).catch(() => {})
        const path = new URL(page.url()).pathname
        if (path.startsWith('/legal/consent')) {
          c.add({ page: '/', category: 'missing_data', selector: 'card-flashcards', detail: 'Flashcards card redirected to consent page' })
        } else {
          expect.soft(path, 'Should navigate to /flashcards').toBe('/flashcards')
        }
      })

      await test.step('Diseases list → first disease detail', async () => {
        await page.goto('/conteudo/doencas', { waitUntil: 'domcontentloaded' })
        await waitForPageReady(page)

        const firstCard = page.locator('a[href^="/conteudo/doencas/"]').first()
        const hasCards = (await firstCard.count()) > 0
        if (hasCards) {
          await firstCard.click()
          await page.waitForURL('**/conteudo/doencas/**', { timeout: 10_000 }).catch(() => {})
          await waitForPageReady(page)

          const provVisible = await page.getByTestId('provenance-title').isVisible().catch(() => false)
          const refVisible = await page.getByTestId('references-title').isVisible().catch(() => false)

          if (!provVisible) c.add({ page: page.url(), category: 'missing_data', selector: 'provenance-title', detail: 'Disease detail: provenance section missing' })
          if (!refVisible) c.add({ page: page.url(), category: 'missing_data', selector: 'references-title', detail: 'Disease detail: references section missing' })
        } else {
          c.add({ page: '/conteudo/doencas', category: 'empty_state_showing', selector: 'no-disease-cards', detail: 'No disease cards to click through' })
        }
      })

      await test.step('Medications list → first medication detail', async () => {
        await page.goto('/conteudo/medicamentos', { waitUntil: 'domcontentloaded' })
        await waitForPageReady(page)

        const firstCard = page.locator('a[href^="/conteudo/medicamentos/"]').first()
        const hasCards = (await firstCard.count()) > 0
        if (hasCards) {
          await firstCard.click()
          await page.waitForURL('**/conteudo/medicamentos/**', { timeout: 10_000 }).catch(() => {})
          await waitForPageReady(page)

          const provVisible = await page.getByTestId('provenance-title').isVisible().catch(() => false)
          const refVisible = await page.getByTestId('references-title').isVisible().catch(() => false)

          if (!provVisible) c.add({ page: page.url(), category: 'missing_data', selector: 'provenance-title', detail: 'Medication detail: provenance section missing' })
          if (!refVisible) c.add({ page: page.url(), category: 'missing_data', selector: 'references-title', detail: 'Medication detail: references section missing' })
        } else {
          c.add({ page: '/conteudo/medicamentos', category: 'empty_state_showing', selector: 'no-medication-cards', detail: 'No medication cards to click through' })
        }
      })

      await c.attachReport(testInfo)
    })
  })
})
