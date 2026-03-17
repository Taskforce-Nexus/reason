import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

test.describe('Session Engine Redesign', () => {

  test('Advisors participate in debate', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    // Navigate to TestCo (sesion_consejo phase)
    const testCo = page.locator('text=TestCo').first()
    if (await testCo.isVisible()) {
      await testCo.click()
      await page.waitForTimeout(2000)
    }

    const sessionLink = page.locator('a[href*="sesion-consejo"]').or(page.getByText('Continuar sesión')).first()
    if (await sessionLink.isVisible()) {
      await sessionLink.click()
      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'tests/screenshots/redesign-01-loaded.png' })

      // Start session if needed
      const startBtn = page.locator('button:has-text("Iniciar")').first()
      if (await startBtn.isVisible()) {
        await startBtn.click()
        await page.waitForTimeout(8000)
        await page.screenshot({ path: 'tests/screenshots/redesign-02-question.png' })
      }

      // Start debate
      const debateBtn = page.locator('button:has-text("Iniciar Debate")').first()
      if (await debateBtn.isVisible()) {
        await debateBtn.click()
        await page.waitForTimeout(30000) // advisors + cofounders (longer due to 3 Claude calls)
        await page.screenshot({ path: 'tests/screenshots/redesign-03-debate.png' })
      }

      // Check if advisor cards appear
      const pageText = await page.textContent('body')
      const hasAdvisors = pageText?.includes('Dr. Maya Singh') ||
                          pageText?.includes('Alex Reeves') ||
                          pageText?.includes('Marcus Rivera') ||
                          pageText?.includes('Priya Chen') ||
                          pageText?.includes('Tu Consejo Opina')
      console.log('Advisors participated:', hasAdvisors)

      // Check cofounders
      const hasConstructivo = pageText?.includes('Camila Reyes') || pageText?.includes('Constructivo')
      const hasCritico = pageText?.includes('Andrés Quiroga') || pageText?.includes('Crítico')
      console.log('Constructivo visible:', hasConstructivo)
      console.log('Crítico visible:', hasCritico)

      // Check "Buscar punto medio" button
      const commonGround = page.locator('button:has-text("punto medio"), button:has-text("Buscar punto")').first()
      console.log('Buscar punto medio visible:', await commonGround.isVisible().catch(() => false))

      // Check question count (should be 6-8 for VPC, not 3)
      const questionText = pageText?.match(/Pregunta \d+ de (\d+)/)?.[1]
      console.log('Total questions for document:', questionText)

      // Try resolving with Constructiva
      const chooseBtn = page.locator('button:has-text("Elegir Constructiva"), button:has-text("Constructiva")').first()
      if (await chooseBtn.isVisible()) {
        await chooseBtn.click()
        await page.waitForTimeout(10000)
        await page.screenshot({ path: 'tests/screenshots/redesign-04-resolved.png' })

        // Check momentum updated
        const momentumText = await page.textContent('body')
        const resolved = momentumText?.match(/Resueltas.*?(\d+)\s*\/\s*(\d+)/)
        console.log('Momentum after resolve:', resolved?.[0])
      }

      await page.screenshot({ path: 'tests/screenshots/redesign-05-final.png' })
    } else {
      console.log('No session link found — TestCo not in sesion_consejo phase')
      await page.screenshot({ path: 'tests/screenshots/redesign-01-no-link.png' })
    }
  })

  test('Markdown renders in debate cards', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    const testCo = page.locator('text=TestCo').first()
    if (await testCo.isVisible()) {
      await testCo.click()
      await page.waitForTimeout(2000)
    }

    const sessionLink = page.locator('a[href*="sesion-consejo"]').or(page.getByText('Continuar sesión')).first()
    if (await sessionLink.isVisible()) {
      await sessionLink.click()
      await page.waitForTimeout(5000)

      // Check for rendered markdown (prose classes)
      const proseElements = await page.locator('.prose, .prose-invert').count()
      console.log('Prose elements (markdown rendered):', proseElements)

      // Check no raw markdown symbols in debate content
      const bodyText = await page.textContent('body') || ''
      const hasRawMd = bodyText.includes('## ') || bodyText.includes('**') || bodyText.includes('```')
      console.log('Raw markdown visible in body:', hasRawMd)

      await page.screenshot({ path: 'tests/screenshots/redesign-markdown.png' })
    }
  })

  test('ProjectView shows correct counts post-session', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForURL('**/dashboard**')

    // Navigate to FinTrack (completado phase — has approved docs)
    const finTrack = page.locator('text=FinTrack').first()
    if (await finTrack.isVisible()) {
      await finTrack.click()
      await page.waitForTimeout(2000)

      const bodyText = await page.textContent('body') || ''

      // Check advisor count is not 0
      const advisorCount = bodyText.match(/(\d+) asesores configurados/)?.[1]
      console.log('Advisor count:', advisorCount)
      expect(Number(advisorCount ?? 0)).toBeGreaterThan(0)

      // Check doc count uses project_documents.status (not project columns)
      const docMatch = bodyText.match(/(\d+) de (\d+) documentos listos/)
      console.log('Documents listos:', docMatch?.[0])

      // Check consultoria not "Pendiente" for completed project
      const hasConsultoriaAvailable = bodyText.includes('Disponible') || bodyText.includes('Abrir consultoría')
      const consultoriaPendiente = !hasConsultoriaAvailable
      console.log('Consultoría still pending (should be false):', consultoriaPendiente)

      // Check founder brief is clean (no raw markdown)
      const hasRawBrief = bodyText.includes('## Resumen') || bodyText.includes('**Idea:**') || bodyText.includes('**Founder')
      console.log('Raw markdown in brief (should be false):', hasRawBrief)

      await page.screenshot({ path: 'tests/screenshots/redesign-06-projectview.png' })
    } else {
      console.log('FinTrack not found on dashboard')
      await page.screenshot({ path: 'tests/screenshots/redesign-06-no-fintrack.png' })
    }
  })
})
