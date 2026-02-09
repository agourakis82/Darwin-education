import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Darwin Education' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByText('Cadastre-se')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('invalid@test.com')
    await page.getByLabel('Senha').fill('wrongpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Should show error message
    await expect(page.getByText(/Invalid login|invalid/i)).toBeVisible({ timeout: 10_000 })
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/simulado')
    await page.waitForURL(/\/login\?redirectTo/)
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirectTo=%2Fsimulado')
  })

  test('flashcards route redirects to login', async ({ page }) => {
    await page.goto('/flashcards')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('/login')
  })

  test('home page loads without auth', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Darwin Education')).toBeVisible({ timeout: 10_000 })
  })

  test('signup link navigates to signup page', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Cadastre-se').click()
    await page.waitForURL(/\/signup/)
    expect(page.url()).toContain('/signup')
  })
})
