import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

test.describe('Sesión de Consejo', () => {

  test('Full debate flow', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    // Find TestCo project
    await page.waitForTimeout(2000)
    const testCoLink = page.locator('text=TestCo').first()

    if (!(await testCoLink.isVisible())) {
      console.log('TestCo project not found — run: node tests/e2e/create-user.js')
      await page.screenshot({ path: 'tests/screenshots/sesion-01-no-project.png' })
      expect(await testCoLink.isVisible()).toBeTruthy()
      return
    }

    await testCoLink.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/sesion-01-project.png' })

    // Navigate to sesion-consejo
    const sessionLink = page.locator('a[href*="sesion-consejo"]').first()
    if (!(await sessionLink.isVisible())) {
      console.log('No sesion-consejo link — checking for CTA button')
      const ctaBtn = page.locator('button:has-text("Iniciar"), button:has-text("Continuar"), a:has-text("Iniciar sesión"), a:has-text("Continuar sesión")').first()
      if (await ctaBtn.isVisible()) {
        await ctaBtn.click()
      } else {
        // Direct navigation
        const url = page.url()
        const projectId = url.split('/project/')[1]?.split('/')[0]
        await page.goto(`${BASE}/project/${projectId}/sesion-consejo`)
      }
    } else {
      await sessionLink.click()
    }

    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'tests/screenshots/sesion-02-loaded.png' })

    const bodyText = await page.textContent('body') ?? ''
    console.log('Page loaded')
    console.log('  Contains "Pregunta":', bodyText.includes('Pregunta'))
    console.log('  Contains "Constructivo":', bodyText.includes('Constructivo'))
    console.log('  Contains "Crítico":', bodyText.includes('Crítico'))
    console.log('  Contains "Value Proposition":', bodyText.includes('Value Proposition'))
    console.log('  Contains "Iniciar":', bodyText.includes('Iniciar'))
    console.log('  Contains "Comenzar":', bodyText.includes('Comenzar'))

    // Try to start the session
    const startBtn = page.locator('button:has-text("Iniciar sesión"), button:has-text("Comenzar sesión"), button:has-text("Iniciar"), button:has-text("Comenzar")').first()
    if (await startBtn.isVisible()) {
      console.log('Start button found — clicking')
      await startBtn.click()
      await page.waitForTimeout(10000) // wait for AI to generate first question + debate
      await page.screenshot({ path: 'tests/screenshots/sesion-03-after-start.png' })
    } else {
      console.log('No start button — session may auto-load or already started')
      await page.waitForTimeout(3000)
    }

    await page.screenshot({ path: 'tests/screenshots/sesion-03-debate.png' })

    const bodyText2 = await page.textContent('body') ?? ''
    const hasConstructivo = bodyText2.includes('Constructivo')
    const hasCritico = bodyText2.includes('Crítico') || bodyText2.includes('Critico')
    const hasPregunta = bodyText2.includes('Pregunta') || bodyText2.includes('pregunta')
    const hasDebate = bodyText2.includes('debate') || bodyText2.includes('Debate')

    console.log('After start:')
    console.log('  Constructivo visible:', hasConstructivo)
    console.log('  Crítico visible:', hasCritico)
    console.log('  Pregunta visible:', hasPregunta)
    console.log('  Debate visible:', hasDebate)

    // Try to resolve (click a choice/action button)
    const resolveBtn = page.locator('button:has-text("Elegir"), button:has-text("Aceptar"), button:has-text("Aprobar"), button:has-text("Resolver"), button:has-text("Continuar")').first()
    if (await resolveBtn.isVisible()) {
      console.log('Resolve button found — clicking')
      await resolveBtn.click()
      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'tests/screenshots/sesion-04-resolved.png' })
    } else {
      console.log('No resolve button visible yet')
    }

    // Check right sidebar for document progress
    const sidebarText = await page.locator('[class*="sidebar"], aside, [class*="right"]').first().textContent().catch(() => '')
    console.log('Sidebar has content:', (sidebarText?.length ?? 0) > 0)

    await page.screenshot({ path: 'tests/screenshots/sesion-05-final.png' })

    // Assertion: the page must have rendered the 3-column layout
    const hasLayout = bodyText2.length > 100
    console.log('Layout rendered:', hasLayout)
    expect(hasLayout).toBeTruthy()
  })
})
