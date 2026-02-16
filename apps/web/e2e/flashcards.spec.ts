import { test, expect } from '@playwright/test'

const STORAGE_STATE = 'e2e/.auth/user.json'

test.describe('Flashcards (unauthenticated)', () => {
  test('redirects to login', async ({ page }) => {
    await page.goto('/flashcards')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })
})

test.describe('Flashcards (authenticated)', () => {
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

  test('flashcards listing page loads', async ({ page }) => {
    await page.goto('/flashcards')
    // Page should render without crash (column name bug was fixed)
    await expect(page.locator('body')).not.toBeEmpty()
    const content = await page.textContent('body')
    expect(content?.length).toBeGreaterThan(0)
    // Should show page title or deck list
    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible({ timeout: 10_000 })
  })

  test('create deck page loads', async ({ page }) => {
    await page.goto('/flashcards/create')
    await expect(page.getByRole('heading', { name: 'Criar Novo Deck' })).toBeVisible()
    await expect(page.getByText('Título')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible()
  })

  test('create deck validates required fields', async ({ page }) => {
    await page.goto('/flashcards/create')
    // Try to submit empty form
    await page.getByRole('button', { name: 'Criar Deck' }).click()
    await expect(page.getByText('Título é obrigatório')).toBeVisible()
  })

  test('create deck allows adding cards', async ({ page }) => {
    await page.goto('/flashcards/create')
    // Should start with 1 card
    await expect(page.getByText('Card 1')).toBeVisible()
    // Click "Adicionar Card"
    await page.getByText('Adicionar Card').click()
    await expect(page.getByText('Card 2')).toBeVisible()
  })

  test('non-existent deck redirects to listing', async ({ page }) => {
    await page.goto('/flashcards/00000000-0000-0000-0000-000000000000')
    // Should redirect back to /flashcards
    await page.waitForURL(/\/flashcards$/, { timeout: 10_000 })
  })
})
