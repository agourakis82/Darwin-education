import { test, expect, type ConsoleMessage, type Page, type Response } from '@playwright/test'

const STORAGE_STATE = 'e2e/.auth/user.json'

const PUBLIC_ROUTES = ['/login', '/signup']

const AUTH_ROUTES = [
  '/',
  '/simulado',
  '/simulado/adaptive',
  '/flashcards',
  '/flashcards/create',
  '/flashcards/study',
  '/trilhas',
  '/conteudo',
  '/conteudo/doencas',
  '/conteudo/medicamentos',
  '/conteudo/teoria',
  '/montar-prova',
  '/qgen',
  '/gerar-questao',
  '/caso-clinico',
  '/fcr',
  '/fcr/calibracao',
  '/cip',
  '/cip/pratica',
  '/cip/interpretacao',
  '/cip/leaderboard',
  '/cip/achievements',
  '/desempenho',
  '/pesquisa',
  '/pesquisa/dominio',
  '/pesquisa/psicometria',
  '/ia-orientacao',
  '/metodos-estudo',
  '/ddl',
]

async function assertV6Signals(page: Page) {
  const themeMode = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(themeMode).toMatch(/^(light|dark|system)$/)

  const resolvedThemeClass = await page.evaluate(() =>
    document.documentElement.classList.contains('light') ||
    document.documentElement.classList.contains('dark')
  )
  expect(resolvedThemeClass).toBe(true)

  await expect(page.locator('[class*="darwin-"]').first()).toBeVisible()
}

test.describe('V6 wiring (public)', () => {
  test.describe.configure({ mode: 'serial' })
  for (const route of PUBLIC_ROUTES) {
    test(`public ${route} renders with v6`, async ({ page }) => {
      const runtime: string[] = []

      page.on('pageerror', (error: Error) => runtime.push(`pageerror:${error.message}`))
      page.on('console', (message: ConsoleMessage) => {
        if (message.type() !== 'error') return
        runtime.push(`console:${message.text()}`)
      })
      page.on('response', (response: Response) => {
        if (response.status() < 500) return
        runtime.push(`http${response.status()}:${new URL(response.url()).pathname}`)
      })

      await page.goto(route)
      await expect(page.locator('#main-content')).toBeVisible()
      await page.waitForTimeout(250)

      await assertV6Signals(page)
      await expect(page.locator('body')).not.toBeEmpty()
      expect(runtime).toEqual([])
    })
  }
})

test.describe('V6 wiring (authenticated)', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(
    () => {
      try {
        require('fs').accessSync(STORAGE_STATE)
        return false
      } catch {
        return true
      }
    },
    'Skipping authenticated wiring sweep — run `npx playwright codegen --save-storage=e2e/.auth/user.json` first'
  )

  test.use({ storageState: STORAGE_STATE })

  for (const route of AUTH_ROUTES) {
    test(`auth ${route} renders with v6`, async ({ page }) => {
      const runtime: string[] = []

      page.on('pageerror', (error: Error) => runtime.push(`pageerror:${error.message}`))
      page.on('console', (message: ConsoleMessage) => {
        if (message.type() !== 'error') return
        runtime.push(`console:${message.text()}`)
      })
      page.on('response', (response: Response) => {
        if (response.status() < 500) return
        runtime.push(`http${response.status()}:${new URL(response.url()).pathname}`)
      })

      await page.goto(route)

      await expect(page.locator('#main-content')).toBeVisible()
      await page.waitForTimeout(300)

      await assertV6Signals(page)
      await expect(page.locator('body')).not.toBeEmpty()

      // Make sure we didn't silently fall back to /login due to auth issues
      expect(new URL(page.url()).pathname).not.toBe('/login')

      expect(runtime).toEqual([])
    })
  }
})
