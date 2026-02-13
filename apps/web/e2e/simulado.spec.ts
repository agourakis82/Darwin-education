import { test, expect } from '@playwright/test'

// These tests require authentication. Use storageState for logged-in session.
// To generate auth state: npx playwright codegen --save-storage=e2e/.auth/user.json
const STORAGE_STATE = 'e2e/.auth/user.json'

test.describe('Simulado (unauthenticated)', () => {
  test('redirects to login', async ({ page }) => {
    await page.goto('/simulado')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })
})

test.describe('Simulado (authenticated)', () => {
  // Skip if no auth state file exists
  test.skip(
    () => {
      try {
        require('fs').accessSync(STORAGE_STATE)
        return false
      } catch {
        return true
      }
    },
    'Skipping authenticated tests — run `npx playwright codegen --save-storage=e2e/.auth/user.json` first'
  )

  test.use({ storageState: STORAGE_STATE })

  test('simulado listing page loads', async ({ page }) => {
    await page.goto('/simulado')
    await expect(page.getByRole('heading', { name: 'Simulados ENAMED' })).toBeVisible()
    // Should show quick action cards
    await expect(page.getByRole('link', { name: /Simulado Rápido/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Simulado Completo/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Montar Prova/i })).toBeVisible()
  })

  test('simulado rápido links to montar-prova with params', async ({ page }) => {
    await page.goto('/simulado')
    await page.getByRole('link', { name: /Simulado Rápido/i }).click()
    await page.waitForURL(/\/montar-prova/)
    const url = new URL(page.url())
    expect(url.searchParams.get('count')).toMatch(/^\d+$/)
    expect(url.searchParams.get('time')).toMatch(/^\d+$/)
  })

  test('simulado completo links to montar-prova with params', async ({ page }) => {
    await page.goto('/simulado')
    await page.getByRole('link', { name: /Simulado Completo/i }).click()
    await page.waitForURL(/\/montar-prova/)
    const url = new URL(page.url())
    expect(url.searchParams.get('count')).toMatch(/^\d+$/)
    expect(url.searchParams.get('time')).toMatch(/^\d+$/)
  })

  test('montar prova page loads', async ({ page }) => {
    await page.goto('/montar-prova')
    await expect(page.locator('body')).not.toBeEmpty()
    // Page should not crash (no white screen)
    const content = await page.textContent('body')
    expect(content?.length).toBeGreaterThan(0)
  })

  test('exam with empty questions shows error', async ({ page }) => {
    // Navigate to a non-existent exam
    await page.goto('/simulado/00000000-0000-0000-0000-000000000000')
    // Should show error or redirect, not white screen
    await page.waitForTimeout(3000)
    const content = await page.textContent('body')
    expect(content?.length).toBeGreaterThan(0)
  })
})
