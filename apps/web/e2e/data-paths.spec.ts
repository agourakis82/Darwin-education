import { test, expect } from '@playwright/test'

const STORAGE_STATE = 'e2e/.auth/user.json'

test.describe('Data paths (beta)', () => {
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

  test('platform stats reports medical corpus', async ({ page, request }) => {
    const resp = await request.get('/api/platform/stats')
    expect(resp.ok()).toBeTruthy()
    const json = await resp.json()
    expect(json.diseases).toBeGreaterThan(0)
    expect(json.medications).toBeGreaterThan(0)

    await page.goto('/')
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('content diseases list -> detail renders provenance + references', async ({ page }) => {
    await page.goto('/conteudo/doencas')
    await expect(page.locator('#main-content')).toBeVisible()

    const firstCard = page.locator('a[href^="/conteudo/doencas/"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()

    await expect(page.getByTestId('provenance-title')).toBeVisible()
    await expect(page.getByTestId('references-title')).toBeVisible()
  })

  test('content medications list -> detail renders provenance + references', async ({ page }) => {
    await page.goto('/conteudo/medicamentos')
    await expect(page.locator('#main-content')).toBeVisible()

    const firstCard = page.locator('a[href^="/conteudo/medicamentos/"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()

    await expect(page.getByTestId('provenance-title')).toBeVisible()
    await expect(page.getByTestId('references-title')).toBeVisible()
  })
})
