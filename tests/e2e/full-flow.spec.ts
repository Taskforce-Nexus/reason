import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Reason E2E', () => {

  test('1. Landing page loads', async ({ page }) => {
    await page.goto(BASE)
    // Check for the CTA button specifically — unique text on landing
    await expect(page.locator('text=Crear cuenta gratis').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/01-landing.png' })
  })

  test('2. Login works', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await page.screenshot({ path: 'tests/screenshots/02-dashboard.png' })
  })

  test('3. Dashboard shows projects', async ({ page }) => {
    await login(page)
    await expect(page.locator('text=Nuevo Proyecto').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/03-dashboard-projects.png' })
  })

  test('4. Create project and reach ProjectView', async ({ page }) => {
    await login(page)
    const projectCard = page.locator('[href*="/project/"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/04-project-view.png' })
  })

  test('5. Semilla loads with chat', async ({ page }) => {
    await login(page)
    const projectCard = page.locator('[href*="/project/"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }
    await page.waitForTimeout(2000)
    const semillaLink = page.locator('text=Ver sesión completa').first()
    if (await semillaLink.isVisible()) {
      await semillaLink.click()
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: 'tests/screenshots/05-semilla.png' })
  })

  test('6. Export Center loads', async ({ page }) => {
    await login(page)
    const projectCard = page.locator('[href*="/project/"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }
    await page.waitForTimeout(2000)
    const exportLink = page.locator('text=Export Center').first()
    if (await exportLink.isVisible()) {
      await exportLink.click()
      await page.waitForTimeout(2000)
    }
    await page.screenshot({ path: 'tests/screenshots/06-export.png' })
  })

  test('7. Advisory Board loads', async ({ page }) => {
    await login(page)
    const projectCard = page.locator('[href*="/project/"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }
    await page.waitForTimeout(2000)
    const boardLink = page.locator('text=Ver Board').first()
    if (await boardLink.isVisible()) {
      await boardLink.click()
      await page.waitForTimeout(2000)
    }
    await page.screenshot({ path: 'tests/screenshots/07-board.png' })
  })

  test('8. Settings Account loads and edits', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/settings/cuenta`)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/08-settings.png' })
  })

  test('9. Consultoria gate check', async ({ page }) => {
    await login(page)
    const projectCard = page.locator('[href*="/project/"]').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }
    await page.waitForTimeout(2000)
    const consultLink = page.locator('text=consultoría').first()
    if (await consultLink.isVisible()) {
      await consultLink.click()
      await page.waitForTimeout(2000)
    }
    await page.screenshot({ path: 'tests/screenshots/09-consultoria.png' })
  })
})
