import { test, expect } from '@playwright/test'

const STORAGE_STATE = 'e2e/.auth/user.json'

const ROUTES: Array<{ path: string; label: string }> = [
  { path: '/', label: 'Home' },
  { path: '/simulado', label: 'Simulado' },
  { path: '/flashcards', label: 'Flashcards' },
  { path: '/trilhas', label: 'Trilhas' },
  { path: '/cip', label: 'CIP' },
  { path: '/conteudo', label: 'Conteúdo' },
  { path: '/conteudo/doencas', label: 'Conteúdo — Doenças' },
  { path: '/conteudo/medicamentos', label: 'Conteúdo — Medicamentos' },
  { path: '/conteudo/teoria', label: 'Conteúdo — Teoria' },
  { path: '/pesquisa', label: 'Pesquisa' },
  { path: '/desempenho', label: 'Desempenho' },
  { path: '/caso-clinico', label: 'Caso clínico' },
  { path: '/ia-orientacao', label: 'IA orientação' },
  { path: '/montar-prova', label: 'Montar prova' },
  { path: '/gerar-questao', label: 'Gerar questão' },
  { path: '/qgen', label: 'QGen' },
  { path: '/ddl', label: 'DDL' },
  { path: '/fcr', label: 'Raciocínio (FCR)' },
]

test.describe('Route sanity (beta)', () => {
  test.skip(
    () => {
      try {
        require('fs').accessSync(STORAGE_STATE)
        return false
      } catch {
        return true
      }
    },
    'Requires storage state at e2e/.auth/user.json'
  )

  test.use({ storageState: STORAGE_STATE })

  test('core routes load without global error', async ({ page }) => {
    test.setTimeout(120_000)
    for (const route of ROUTES) {
      await test.step(route.label, async () => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 })
        await expect(page.locator('#main-content')).toBeVisible({ timeout: 15_000 })
        await expect(page.getByRole('heading', { name: /algo deu errado/i })).toHaveCount(0)
      })
    }
  })
})
