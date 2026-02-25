/**
 * Complete the legal consent flow for the existing auth storage state.
 * Run with: npx playwright test e2e/complete-consent.ts --project=chromium
 */
import { test, expect } from '@playwright/test'

const STORAGE_STATE = 'e2e/.auth/user.json'

test('Complete legal consent flow', async ({ browser }) => {
  test.setTimeout(30_000)

  const context = await browser.newContext({ storageState: STORAGE_STATE })
  const page = await context.newPage()

  await page.goto('/legal/consent', { waitUntil: 'domcontentloaded' })

  // Wait for the form to render (needs auth session to load)
  await page.waitForTimeout(2000)

  // Check the required EULA checkbox
  const eulaCheckbox = page.locator('#acceptedEula')
  await eulaCheckbox.waitFor({ state: 'visible', timeout: 10_000 })
  if (!(await eulaCheckbox.isChecked())) {
    await eulaCheckbox.check()
  }

  // Optionally check research consent
  const researchCheckbox = page.locator('#researchConsent')
  if (await researchCheckbox.isVisible().catch(() => false)) {
    if (!(await researchCheckbox.isChecked())) {
      await researchCheckbox.check()
    }
  }

  // Click the submit button
  const submitBtn = page.getByRole('button', { name: /Continuar/i })
  await expect(submitBtn).toBeEnabled()
  await submitBtn.click()

  // Wait for redirect (consent success redirects to / or the redirectTo param)
  await page.waitForURL('**', { timeout: 10_000 })
  // Give time for the session to refresh and cookies to update
  await page.waitForTimeout(2000)

  // Verify we're no longer on the consent page
  const currentPath = new URL(page.url()).pathname
  expect(currentPath).not.toBe('/legal/consent')

  // Save updated storage state
  await context.storageState({ path: STORAGE_STATE })
  await context.close()
})
