import { test, expect, type Page } from '@playwright/test'

const ADMIN_EMAIL = 'admin@trexgym.local'
const ADMIN_PASSWORD = 'Admin123!'
const HUMAN_DELAY_MIN = 80
const HUMAN_DELAY_MAX = 180

async function humanPause(page: Page, min = HUMAN_DELAY_MIN, max = HUMAN_DELAY_MAX) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  await page.waitForTimeout(ms)
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await humanPause(page)
  await page.getByTestId('login-email').fill(ADMIN_EMAIL)
  await humanPause(page)
  await page.getByPlaceholder('Introduceți parola').fill(ADMIN_PASSWORD)
  await humanPause(page)
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(/\/clients$/)
  await expect(page.getByTestId('clients-list-page')).toBeVisible()
  await humanPause(page)
}

test.describe('Phase 2 - Dashboard Web E2E', () => {
  test.describe.configure({ timeout: 90_000 })

  test('redirects to login for protected routes when unauthenticated', async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('login-page')).toBeVisible()
    await humanPause(page)
  })

  test('shows error for invalid admin credentials', async ({ page }) => {
    await page.goto('/login')
    await humanPause(page)
    await page.getByTestId('login-email').fill('invalid@trexgym.local')
    await humanPause(page)
    await page.getByPlaceholder('Introduceți parola').fill('ParolaInvalida123')
    await humanPause(page)
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('login-page')).toBeVisible()
    await expect(page.getByTestId('clients-list-page')).toHaveCount(0)
    await humanPause(page)
  })

  test('creates, edits and suspends a client from the UI', async ({ page }) => {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const email = `phase2.e2e.${uid}@example.com`
    const firstName = 'Client'
    const lastName = `Test${uid}`
    const initialPhone = '+40740111222'
    const updatedPhone = '+40749999888'

    await loginAsAdmin(page)

    await humanPause(page)
    await page.getByTestId('clients-add-button').click()
    await expect(page.getByTestId('client-form-page')).toBeVisible()

    await page.getByTestId('client-first-name').fill(firstName)
    await humanPause(page)
    await page.getByTestId('client-last-name').fill(lastName)
    await humanPause(page)
    await page.getByTestId('client-email').fill(email)
    await humanPause(page)
    await page.getByTestId('client-phone').fill(initialPhone)
    await humanPause(page)
    await page.getByTestId('client-submit').click()

    await expect(page.getByText('Client creat')).toBeVisible()
    await expect(page.getByTestId('generated-pin')).toHaveText(/^\d{6}$/)
    await humanPause(page)
    await page.getByTestId('view-created-client').click()

    await expect(page.getByTestId('client-detail-page')).toBeVisible()
    await expect(page.getByTestId('detail-email')).toContainText(email)

    await humanPause(page)
    await page.getByTestId('client-detail-edit').click()
    await expect(page.getByTestId('client-form-page')).toBeVisible()
    await humanPause(page)
    await page.getByTestId('client-phone').fill(updatedPhone)
    await humanPause(page)
    await page.getByTestId('client-submit').click()

    await humanPause(page)
    await page.getByRole('button', { name: 'Înapoi la listă' }).click()
    await expect(page.getByTestId('clients-list-page')).toBeVisible()

    await humanPause(page)
    await page.getByTestId('clients-search-input').fill(email)
    await humanPause(page)
    await page.getByTestId('clients-search-button').click()

    const clientRow = page.locator('tr', { hasText: email }).first()
    await expect(clientRow).toBeVisible()
    await expect(clientRow).toContainText(updatedPhone)

    await humanPause(page)
    page.once('dialog', (dialog) => {
      dialog.accept()
    })
    await clientRow.getByRole('button', { name: 'Suspendă' }).click()

    const suspendedRow = page.locator('tr', { hasText: email }).first()
    await expect(suspendedRow).toContainText('Suspendat')
  })
})
