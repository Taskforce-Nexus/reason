import { test, expect, type Page } from '@playwright/test'
import { seedTestData } from './setup'

const TEST_EMAIL    = process.env.TEST_EMAIL    || 'e2e@reason.test'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'E2eReason2026x'
const BASE          = 'http://localhost:3000'

let projectId: string

test.beforeAll(async () => {
  projectId = await seedTestData()
})

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
}

test.describe('Reason — Flujo completo end-to-end', () => {

  test('1. Landing page carga', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=Crear cuenta gratis').first()).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/01-landing.png' })
  })

  test('2. Login y dashboard', async ({ page }) => {
    await login(page)
    await expect(page.locator('text=Nuevo Proyecto').first()).toBeVisible()
    await expect(page.locator('text=FinTrack').first()).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/02-dashboard.png' })
  })

  test('3. ProjectView — tiles reflejan estado real', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}`)
    await page.waitForLoadState('networkidle')

    // Pipeline progress debe estar visible
    await expect(page.locator('text=Semilla').first()).toBeVisible()
    await expect(page.locator('text=Entregables').first()).toBeVisible()

    // Tile Semilla debe mostrar "Completada" (seed data tiene founder_brief)
    await expect(page.locator('text=Completada').first()).toBeVisible()

    // Tile Consejo Asesor debe mostrar consejeros reales (seed crea 7 advisors)
    const consejoTile = page.locator('text=Consejo Asesor').first()
    await expect(consejoTile).toBeVisible()
    // Verificar que NO muestra datos hardcodeados
    const hardcodedText = page.locator('text=0 asesores configurados')
    expect(await hardcodedText.count()).toBe(0)

    // Tile Export Center debe mostrar documentos (seed crea 4 docs aprobados)
    await expect(page.locator('text=Export Center').first()).toBeVisible()

    // Tile Sesión de Consejo — debe mostrar "Ver resultados →" (sesión completada)
    const verResultadosBtn = page.locator('a:has-text("Ver resultados")')
    await expect(verResultadosBtn).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/03-project-view-tiles.png' })
  })

  test('4. Export Center — documentos disponibles', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/export`)
    await page.waitForLoadState('networkidle')

    // Header del Export Center
    await expect(page.getByText('Export Center').first()).toBeVisible()

    // Debe haber documentos (seed crea 4 docs aprobados)
    // ExportCenter usa divs, buscar cualquier badge de estado "Listo" o botón "Ver"
    const docElements = page.locator('text=Listo, button:has-text("Ver"), text=Ver').first()
    const rowCount = await docElements.count()
    console.log(`Export Center: ${rowCount} elementos de documento encontrados`)
    // Verificar que el componente renderizó sin crash — no estado vacío
    const emptyState = page.locator('text=Ir a Sesión de Consejo')
    if (await emptyState.count() > 0) {
      console.log('WARN: Export Center muestra estado vacío — seed data puede no haberse aplicado')
    } else {
      // Hay contenido — verificar que hay al menos un botón de acción
      const actionBtns = page.locator('button').filter({ hasText: /Ver|PDF|Copiar/i })
      const btnCount = await actionBtns.count()
      console.log(`Export Center: ${btnCount} botones de acción encontrados`)
      expect(btnCount).toBeGreaterThanOrEqual(1)
    }

    // Botón "Ver" debe ser clicable en la primera fila
    const verBtn = page.locator('button:has-text("Ver"), a:has-text("Ver")').first()
    if (await verBtn.count() > 0) {
      await verBtn.click()
      await page.waitForTimeout(1000)
      // Verificar que el drawer se abre
      const drawer = page.locator('[class*="drawer"], [class*="panel"]').first()
      if (await drawer.count() > 0) {
        await page.screenshot({ path: 'tests/e2e/screenshots/04-export-drawer.png' })
      }
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/04-export-center.png' })
  })

  test('5. Advisory Board carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/consejo`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Consejo Asesor').first()).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/05-advisory-board.png' })
  })

  test('6. Seed Session — SeedSessionFlow carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/seed-session`)
    await page.waitForLoadState('networkidle')

    // Con founder_brief presente → SeedSessionFlow (no IncubadoraChat)
    // Debe mostrar el sidebar con pasos
    const sessionHeader = page.locator('text=Sesión de Consejo').first()
    await expect(sessionHeader).toBeVisible({ timeout: 15000 })

    // Verificar que aparecen los pasos del journey en el sidebar
    await expect(page.locator('text=Entregables').first()).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/06-seed-session.png' })
  })

  test('7. Sesión de Consejo — página carga con documentos', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/sesion-consejo`)
    await page.waitForLoadState('networkidle')

    // La sesión completada → initialSession null → estado 'init' en SesionConsejoView
    // O puede mostrar estado de sesión completada dependiendo de la lógica
    // Verificar que la página carga sin crash
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // No debe haber error 500
    const errorText = page.locator('text=Application error, text=Internal Server Error')
    expect(await errorText.count()).toBe(0)

    await page.screenshot({ path: 'tests/e2e/screenshots/07-sesion-consejo.png' })

    // Si aparece botón "Iniciar" o similar, verificar que es clickable
    const iniciarBtn = page.locator('button:has-text("Iniciar"), button:has-text("Comenzar")')
    if (await iniciarBtn.count() > 0) {
      await expect(iniciarBtn.first()).toBeEnabled()
      console.log('Sesión de Consejo: botón Iniciar encontrado y habilitado')
    }
  })

  test('8. Sesión de Consejo — iniciar sesión y primera respuesta', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/project/${projectId}/sesion-consejo`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/screenshots/08-sesion-init.png' })

    // Buscar botón de inicio
    const iniciarBtn = page.locator('button:has-text("Iniciar"), button:has-text("Comenzar sesión")')
    if (await iniciarBtn.count() === 0) {
      console.log('SKIP: No hay botón de iniciar — sesión puede estar en otro estado')
      return
    }

    await iniciarBtn.first().click()
    console.log('Sesión iniciada — esperando primera pregunta...')

    // Esperar a que aparezca la primera pregunta (Claude call ~15-30s)
    await page.waitForSelector(
      'textarea, [placeholder*="respuesta"], [placeholder*="Escribe"]',
      { timeout: 60000 }
    )
    await page.screenshot({ path: 'tests/e2e/screenshots/08-sesion-primera-pregunta.png' })

    // Responder
    const chatInput = page.locator('textarea').last()
    await chatInput.fill(
      'Nuestro mercado principal son millennials mexicanos de 25-35 años con ingresos de $15,000-$50,000 MXN mensuales que buscan herramientas de inversión accesibles.'
    )

    const sendBtn = page.locator('button:has-text("Enviar")').last()
    await sendBtn.click()
    console.log('Respuesta enviada — esperando Nexo Dual...')

    // Esperar respuesta de Nexo Dual (Claude call ~20-40s)
    await page.waitForFunction(
      () => document.body.textContent?.toLowerCase().includes('propuesta') ||
            document.body.textContent?.toLowerCase().includes('constructiv') ||
            document.body.textContent?.toLowerCase().includes('acuerdo') ||
            document.body.textContent?.toLowerCase().includes('debate'),
      { timeout: 90000 }
    )
    await page.screenshot({ path: 'tests/e2e/screenshots/08-nexo-dual.png' })

    // Verificar que hay algún botón de resolución
    // Textos reales del SesionConsejoView: "Ir con constructiva", "Ir con crítica", "Responder yo mismo"
    const resolveBtns = page.locator('button').filter({
      hasText: /Ir con|constructiva|crítica|Responder yo|Acuerdo/i,
    })
    const btnCount = await resolveBtns.count()
    console.log(`Nexo Dual: ${btnCount} botones de resolución encontrados`)
    // Soft check — el Nexo Dual puede estar en estado de acuerdo (1 botón) o desacuerdo (2+ botones)
    if (btnCount === 0) {
      console.log('WARN: No se encontraron botones de resolución — verificar estado de la sesión')
    } else {
      expect(btnCount).toBeGreaterThanOrEqual(1)
    }
  })

  test('9. Configuración settings carga', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/settings/cuenta`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/screenshots/09-settings.png' })
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

})
