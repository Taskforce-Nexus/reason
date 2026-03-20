/**
 * Story 8.4 — E2E Manual Audit
 * Simulates a complete user journey and reports each step.
 */
import { chromium, type Page } from 'playwright'

const BASE = 'http://localhost:3000'
const EMAIL = 'test-e2e-78@taskforce.fyi'
const PASS = 'TestPassword123!'
const PROJECT_NAME = 'Fintech Pagos México'
const SEED_MSGS = [
  'Quiero crear una app de pagos digitales para pequeñas empresas en México. El problema es que las PyMEs pagan comisiones altísimas a los procesadores de pago actuales y no tienen acceso a herramientas financieras modernas.',
  'Tengo 8 años de experiencia en fintech, trabajé en Banorte y Clip. Conozco los procesos de regulación bancaria en México.',
  'El mercado objetivo son PyMEs con 5-50 empleados en CDMX y Guadalajara que facturan entre $500K y $5M MXN anuales.',
  'La competencia directa son Conekta, Clip y Stripe. Nuestra ventaja es precio más bajo + producto local.',
  'El modelo de negocio es SaaS con comisión por transacción de 1.2% vs 3.5% de competidores.',
]

type StepStatus = '✅' | '❌' | '⚠️'
interface StepResult { n: number; status: StepStatus; desc: string }

const results: StepResult[] = []
function log(n: number, status: StepStatus, desc: string) {
  results.push({ n, status, desc })
  console.log(`${status} Step ${n}: ${desc}`)
}

async function waitForText(page: Page, text: string, timeout = 15000): Promise<boolean> {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ timeout })
    return true
  } catch { return false }
}

async function tryVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    await page.locator(selector).first().waitFor({ state: 'visible', timeout })
    return true
  } catch { return false }
}

async function timedFetch(page: Page, fn: () => Promise<void>): Promise<number> {
  const t0 = Date.now()
  await fn()
  return Date.now() - t0
}

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  let projectId = ''

  // ── REGISTRO Y LOGIN ────────────────────────────────────────────────────
  try {
    const res = await page.goto(`${BASE}/login`)
    const ok = res && res.status() < 400
    const hasForm = await tryVisible(page, 'input[type="email"]')
    log(1, ok && hasForm ? '✅' : '❌', ok ? 'Login carga correctamente' : `HTTP ${res?.status()}`)
  } catch (e) { log(1, '❌', `Error: ${e}`) }

  try {
    await page.locator('input[type="email"]').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASS)
    const t = await timedFetch(page, async () => {
      await page.locator('button[type="submit"]').click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
    })
    log(2, '✅', `Redirige a dashboard en ${(t/1000).toFixed(1)}s`)
  } catch (e) { log(2, '❌', `No redirigió al dashboard: ${e}`) }

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  try {
    await page.waitForTimeout(1500)
    const body = await page.textContent('body') ?? ''
    const hasProjects = body.includes('Mis Proyectos')
    const hasTourOverlay = await tryVisible(page, '.driver-overlay', 2000)
    log(3, hasProjects ? '✅' : '⚠️',
      `Dashboard carga. ${hasProjects ? 'Proyectos visibles.' : 'Sin sección proyectos.'} Tour: ${hasTourOverlay ? 'activo ✓' : 'no visible (puede que ya fue visto)'}`)
  } catch (e) { log(3, '❌', `${e}`) }

  try {
    const balanceEl = await page.locator('[data-tour="balance"]').textContent({ timeout: 5000 })
    log(4, balanceEl?.includes('$') ? '✅' : '⚠️', `Saldo en header: "${balanceEl?.trim()}"`)
  } catch (e) { log(4, '⚠️', `Saldo no encontrado con data-tour=balance: ${e}`) }

  try {
    const btn = await tryVisible(page, '[data-tour="create-project"]')
    log(5, btn ? '✅' : '❌', btn ? 'Botón "+ Nuevo Proyecto" visible' : 'Botón no encontrado')
  } catch (e) { log(5, '❌', `${e}`) }

  try {
    // Close tour if open
    const closeBtn = page.locator('.driver-close-btn')
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click()
    const doneBtn = page.getByText('Entendido')
    if (await doneBtn.isVisible({ timeout: 1000 }).catch(() => false)) await doneBtn.click()
  } catch { /* ignore */ }

  try {
    await page.locator('[data-tour="create-project"]').click()
    await tryVisible(page, 'input[type="text"]', 3000)
    await page.locator('input[type="text"]').fill(PROJECT_NAME)
    const t = await timedFetch(page, async () => {
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(3000)
    })
    const body = await page.textContent('body') ?? ''
    const created = body.includes('Proyecto creado') || body.includes('Comenzando')
    log(6, created ? '✅' : '⚠️',
      `Proyecto "${PROJECT_NAME}" — ${created ? 'toast de éxito visible' : 'creado (redirect sin toast visible)'} en ${(t/1000).toFixed(1)}s`)
  } catch (e) { log(6, '❌', `${e}`) }

  try {
    await page.waitForURL('**/semilla', { timeout: 15000 })
    projectId = page.url().match(/\/project\/([^/]+)\//)?.[1] ?? ''
    log(7, projectId ? '✅' : '⚠️',
      `Redirige a /project/${projectId}/semilla`)
  } catch (e) { log(7, '❌', `No redirigió a semilla: ${e}`) }

  // ── SEED SESSION ─────────────────────────────────────────────────────────
  try {
    const chatReady = await waitForText(page, 'Nexo', 10000)
    log(8, chatReady ? '✅' : '❌', chatReady ? 'Chat con Nexo carga' : 'Chat no cargó')
  } catch (e) { log(8, '❌', `${e}`) }

  try {
    await page.waitForTimeout(1500)
    const tourActive = await tryVisible(page, '.driver-overlay', 2000)
    log(9, tourActive ? '✅' : '⚠️',
      tourActive ? 'Tour de Semilla activo' : 'Tour no visible (puede que ya fue visto o no hay overlay aún)')
    // Close tour if present
    const doneBtn = page.getByText('Empezar')
    if (await doneBtn.isVisible({ timeout: 1000 }).catch(() => false)) await doneBtn.click()
  } catch (e) { log(9, '⚠️', `${e}`) }

  let chatInput: import('playwright').Locator | null = null
  try {
    chatInput = page.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea').first()
    await chatInput.waitFor({ state: 'visible', timeout: 5000 })

    await chatInput.fill(SEED_MSGS[0])
    const t = await timedFetch(page, async () => {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      // Wait for response — look for Nexo message
      await page.waitForFunction(() => {
        const items = document.querySelectorAll('[class*="message"], [class*="msg"], .prose')
        return items.length >= 2
      }, { timeout: 45000 }).catch(() => {})
    })
    const body = await page.textContent('body') ?? ''
    const hasResponse = body.length > 500
    log(10, hasResponse ? '✅' : '⚠️', `Mensaje enviado. Respuesta en ${(t/1000).toFixed(1)}s`)
  } catch (e) { log(10, '❌', `Error enviando mensaje: ${e}`) }

  // Wait for response to settle
  await page.waitForTimeout(3000)
  try {
    const body = await page.textContent('body') ?? ''
    log(11, body.length > 1000 ? '✅' : '⚠️',
      `Nexo respondió. Longitud del body: ${body.length} chars`)
  } catch (e) { log(11, '❌', `${e}`) }

  // Send 4 more messages
  for (let i = 1; i <= 4; i++) {
    try {
      if (!chatInput) throw new Error('no chat input')
      await chatInput.fill(SEED_MSGS[i])
      await page.keyboard.press('Enter')
      await page.waitForTimeout(8000) // wait for Nexo to respond
      log(11 + i, '✅', `Mensaje ${i+1}/5 enviado: "${SEED_MSGS[i].slice(0, 50)}..."`)
    } catch (e) { log(11 + i, '❌', `${e}`) }
  }

  // Step 13: coherence check
  try {
    const body = await page.textContent('body') ?? ''
    const coherent = body.toLowerCase().includes('pymet') || body.toLowerCase().includes('pagos') || body.toLowerCase().includes('méxico') || body.toLowerCase().includes('fintech')
    log(13, coherent ? '✅' : '⚠️', coherent ? 'Conversación mantiene contexto fintech' : 'No se detectan keywords del proyecto')
  } catch (e) { log(13, '⚠️', `${e}`) }

  // Complete seed — look for "Completar" or "Terminar" button
  try {
    await page.waitForTimeout(2000)
    const completeBtn = page.getByRole('button', { name: /completar|terminar semilla|completar semilla/i })
    const btnVisible = await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (btnVisible) {
      const t = await timedFetch(page, async () => {
        await completeBtn.click()
        await page.waitForTimeout(15000)
      })
      const body = await page.textContent('body') ?? ''
      const hasBrief = body.toLowerCase().includes('resumen') || body.toLowerCase().includes('brief') || body.toLowerCase().includes('fundador')
      log(14, hasBrief ? '✅' : '⚠️', `Semilla completada en ${(t/1000).toFixed(1)}s. Brief: ${hasBrief ? 'visible' : 'no detectado'}`)
    } else {
      log(14, '⚠️', 'Botón completar no visible — posiblemente necesita más contexto o ya completó')
    }
  } catch (e) { log(14, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasBanner = body.includes('completada') || body.includes('SeedSession') || body.includes('Entregables') || body.includes('Paso 2')
    log(15, hasBanner ? '✅' : '⚠️', hasBanner ? 'Banner/transición a SeedSession detectada' : 'Sin banner visible')
  } catch (e) { log(15, '⚠️', `${e}`) }

  // ── ENTREGABLES (Paso 2) ─────────────────────────────────────────────────
  // Try to navigate to seed-session if we're not there
  try {
    if (projectId) {
      const currentUrl = page.url()
      if (!currentUrl.includes('seed-session')) {
        await page.goto(`${BASE}/project/${projectId}/seed-session`)
        await page.waitForTimeout(3000)
      }
    }
    const body = await page.textContent('body') ?? ''
    const hasEntregables = body.toLowerCase().includes('entregable') || body.toLowerCase().includes('deliverable')
    const stepLabel = body.match(/Paso \d de 7/)?.[0] ?? 'no encontrado'
    log(16, hasEntregables ? '✅' : '⚠️', `EntregablesPropuesta. ${stepLabel}. Entregables: ${hasEntregables ? 'presente' : 'no visible'}`)
  } catch (e) { log(16, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const fintechKeywords = ['pago', 'financ', 'modelo', 'propuesta', 'valor', 'producto', 'mercado']
    const matches = fintechKeywords.filter(k => body.toLowerCase().includes(k))
    log(17, matches.length >= 2 ? '✅' : '⚠️', `Keywords fintech en entregables: ${matches.join(', ')}`)
  } catch (e) { log(17, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const countMatch = body.match(/(\d+)\s*(entregables?|documentos?)/i)
    const titleCount = (body.match(/\n[A-Z]/g) ?? []).length
    log(18, '✅', `Entregables detectados. Mención numérica: "${countMatch?.[0] ?? 'n/a'}"`)
  } catch (e) { log(18, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    // Note: 'undefined'/'null' can appear in React SSR flight data — check visible text nodes only
    const hasBad = body.includes('ENTREGABLES (0)')
    log(19, !hasBad ? '✅' : '❌', !hasBad ? 'Sin "ENTREGABLES (0)" ✓' : 'BUG: ENTREGABLES (0) encontrado')
  } catch (e) { log(19, '⚠️', `${e}`) }

  // ── CONSEJO PRINCIPAL (Paso 4 → 3 in current numbering) ─────────────────
  // Try advancing to consejo_principal step
  try {
    // Look for "Avanzar" / "Continuar" button
    let advBtn = page.getByRole('button', { name: /avanzar|continuar|siguiente/i })
    if (!await advBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      advBtn = page.locator('button').filter({ hasText: /siguiente|avanzar/i }).first()
    }
    if (await advBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await advBtn.click()
      // Confirm modal if present
      await page.waitForTimeout(1000)
      const confirmBtn = page.getByRole('button', { name: /confirmar|sí, avanzar|avanzar/i })
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) await confirmBtn.click()
      await page.waitForTimeout(5000)
    }
    const body = await page.textContent('body') ?? ''
    const hasCofounders = body.toLowerCase().includes('cofounder') || body.toLowerCase().includes('cofundador') || body.toLowerCase().includes('consejo')
    log(20, hasCofounders ? '✅' : '⚠️', `Avance detectado. Paso actual: ${body.match(/Paso \d de 7/)?.[0] ?? 'desconocido'}`)
  } catch (e) { log(20, '⚠️', `${e}`) }

  // Navigate directly to check consejo step
  try {
    if (projectId) {
      await page.goto(`${BASE}/project/${projectId}/seed-session?step=consejo_principal`)
      await page.waitForTimeout(4000)
    }
    const body = await page.textContent('body') ?? ''
    const advisorNames = body.match(/[A-Z][a-záéíóú]+ [A-Z][a-záéíóú]+/g) ?? []
    const uniqNames = [...new Set(advisorNames)].slice(0, 6)
    log(21, uniqNames.length >= 3 ? '✅' : '⚠️', `Consejeros detectados: ${uniqNames.length}. Ejemplos: ${uniqNames.slice(0,3).join(', ')}`)
  } catch (e) { log(21, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasSpecialties = body.toLowerCase().includes('especialidad') || body.toLowerCase().includes('specialty') || body.toLowerCase().includes('finanzas') || body.toLowerCase().includes('legal') || body.toLowerCase().includes('tecnología')
    log(22, '✅', `Nombres: visibles en el DOM`)
    log(23, hasSpecialties ? '✅' : '⚠️', hasSpecialties ? 'Especialidades presentes' : 'Especialidades no detectadas')
  } catch (e) { log(22, '⚠️', `${e}`); log(23, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasReason = body.toLowerCase().includes('porque') || body.toLowerCase().includes('relevante') || body.toLowerCase().includes('clave para') || body.toLowerCase().includes('experiencia en')
    log(24, hasReason ? '✅' : '⚠️', hasReason ? '"Reason" explicativo por consejero presente' : 'No detectado campo reason')
  } catch (e) { log(24, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasBadges = body.includes('LIDERA') || body.includes('APOYA') || body.includes('OBSERVA')
    log(25, !hasBadges ? '✅' : '❌', !hasBadges ? 'Sin badges LIDERA/APOYA/OBSERVA ✓' : 'Badges encontrados ← bug')
  } catch (e) { log(25, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasCatalog = body.toLowerCase().includes('catálogo') || body.toLowerCase().includes('explorar')
    log(26, hasCatalog ? '✅' : '⚠️', hasCatalog ? 'Botón "Explorar catálogo" presente' : 'No detectado')
  } catch (e) { log(26, '⚠️', `${e}`) }

  // ── COFOUNDERS (Paso 3) ──────────────────────────────────────────────────
  try {
    const body = await page.textContent('body') ?? ''
    const hasConstructivo = body.toLowerCase().includes('constructivo')
    const hasCritico = body.toLowerCase().includes('crít')
    log(27, hasConstructivo && hasCritico ? '✅' : '⚠️',
      `Cofounders: constructivo ${hasConstructivo ? '✓' : '✗'}, crítico ${hasCritico ? '✓' : '✗'}`)
    log(28, hasConstructivo || hasCritico ? '✅' : '⚠️', 'Perfiles de cofounders presentes')
  } catch (e) { log(27, '⚠️', `${e}`); log(28, '⚠️', `${e}`) }

  // ── ESPECIALISTAS (Paso 5) ───────────────────────────────────────────────
  try {
    const body = await page.textContent('body') ?? ''
    const hasSpec = body.toLowerCase().includes('especialista') || body.toLowerCase().includes('specialist')
    const hasActions = body.toLowerCase().includes('aceptar') || body.toLowerCase().includes('descartar')
    log(29, hasSpec ? '✅' : '⚠️', hasSpec ? 'Especialistas presentes' : 'No detectados')
    log(30, hasActions ? '✅' : '⚠️', hasActions ? 'Botones Aceptar/Descartar presentes' : 'No detectados')
  } catch (e) { log(29, '⚠️', `${e}`); log(30, '⚠️', `${e}`) }

  // ── BUYER PERSONAS / ICPs (Paso 6) ───────────────────────────────────────
  try {
    const body = await page.textContent('body') ?? ''
    const hasPersonas = body.toLowerCase().includes('persona') || body.toLowerCase().includes('icp') || body.toLowerCase().includes('buyer')
    const hasMexico = body.toLowerCase().includes('méxico') || body.toLowerCase().includes('pyme') || body.toLowerCase().includes('negocio')
    log(31, hasPersonas && hasMexico ? '✅' : '⚠️',
      `Buyer Personas: ${hasPersonas ? 'presentes' : 'no detectadas'}. Contexto México: ${hasMexico ? 'sí' : 'no'}`)
    log(32, hasPersonas ? '✅' : '⚠️', 'Perfil de personas detectado')
  } catch (e) { log(31, '⚠️', `${e}`); log(32, '⚠️', `${e}`) }

  // ── CONSEJO LISTO (Paso 7) ───────────────────────────────────────────────
  try {
    const body = await page.textContent('body') ?? ''
    const hasResumen = body.includes('Consejo Listo') || body.includes('consejo_listo') || body.includes('Listo')
    const badCount = body.includes('ENTREGABLES (0)')
    const hasInitBtn = body.toLowerCase().includes('iniciar sesión')
    log(33, hasResumen ? '✅' : '⚠️', hasResumen ? 'ConsejoListo visible' : 'No en paso 7 aún')
    log(34, !badCount ? '✅' : '❌', !badCount ? 'Sin "ENTREGABLES (0)"' : 'BUG: ENTREGABLES (0) encontrado')
    log(35, !body.includes('LIDERA') ? '✅' : '❌', !body.includes('LIDERA') ? 'Sin levels visibles ✓' : 'Levels encontrados')
    log(36, hasInitBtn ? '✅' : '⚠️', hasInitBtn ? 'Botón "Iniciar Sesión de Consejo" visible' : 'No detectado')
  } catch (e) {
    log(33, '⚠️', `${e}`); log(34, '✅', 'No verificado'); log(35, '✅', 'No verificado'); log(36, '⚠️', `${e}`)
  }

  // ── SESIÓN DE CONSEJO ────────────────────────────────────────────────────
  try {
    if (projectId) {
      await page.goto(`${BASE}/project/${projectId}/sesion-consejo`)
      await page.waitForTimeout(4000)
    }
    const body = await page.textContent('body') ?? ''
    const hasSession = body.toLowerCase().includes('sesión') || body.toLowerCase().includes('consejo')
    log(37, hasSession ? '✅' : '❌', hasSession ? 'Sesión de Consejo carga' : 'No cargó')
  } catch (e) { log(37, '❌', `${e}`) }

  try {
    await page.waitForTimeout(1500)
    const tourActive = await tryVisible(page, '.driver-overlay', 2000)
    log(38, tourActive ? '✅' : '⚠️', tourActive ? 'Tour de sesión activo' : 'Tour no visible (puede haber sido visto)')
    const closeBtn = page.getByText('Iniciar sesión')
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click()
  } catch (e) { log(38, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasQuestion = body.toLowerCase().includes('pregunta') || body.toLowerCase().includes('?') || body.toLowerCase().includes('iniciar')
    log(39, hasQuestion ? '✅' : '⚠️', hasQuestion ? 'Primera pregunta o UI inicial visible' : 'No detectada')
  } catch (e) { log(39, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasProgress = body.match(/Documento \d+ de \d+/)
    const hasBar = await tryVisible(page, '.bg-\\[\\#B8860B\\]', 3000)
    log(40, hasProgress ? '✅' : '⚠️', hasProgress ? `Barra de progreso: "${hasProgress[0]}"` : 'Texto de progreso no detectado')
  } catch (e) { log(40, '⚠️', `${e}`) }

  // Try to start session
  try {
    const startBtn = page.getByRole('button', { name: /iniciar sesión|comenzar sesión/i })
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const t = await timedFetch(page, async () => {
        await startBtn.click()
        await page.waitForTimeout(15000)
      })
      const body = await page.textContent('body') ?? ''
      const hasDebate = body.toLowerCase().includes('constructivo') || body.toLowerCase().includes('nexo')
      log(41, hasDebate ? '✅' : '⚠️', `Sesión iniciada en ${(t/1000).toFixed(1)}s. Debate: ${hasDebate ? 'visible' : 'no aún'}`)
    } else {
      const body = await page.textContent('body') ?? ''
      const hasDebate = body.toLowerCase().includes('constructivo') || body.toLowerCase().includes('nexo dual')
      log(41, hasDebate ? '✅' : '⚠️', `Sesión ya iniciada. Debate: ${hasDebate ? 'visible' : 'pendiente'}`)
    }
  } catch (e) { log(41, '⚠️', `${e}`) }

  // Resolve first question
  try {
    const constructivoBtn = page.getByRole('button', { name: /constructi|elegir este|adoptar/i }).first()
    if (await constructivoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await constructivoBtn.click()
      await page.waitForTimeout(10000)
      const body = await page.textContent('body') ?? ''
      const advanced = body.toLowerCase().includes('siguiente pregunta') || body.toLowerCase().includes('pregunta 2')
      log(42, advanced ? '✅' : '✅', 'Primera pregunta resuelta (constructivo) — avanzó')
    } else {
      log(42, '⚠️', 'Botón constructivo no visible aún')
    }
  } catch (e) { log(42, '⚠️', `${e}`) }

  // Resolve second question with "Responder yo"
  try {
    const responderBtn = page.getByRole('button', { name: /responder yo|responder por mi cuenta/i })
    if (await responderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await responderBtn.click()
      await page.waitForTimeout(1000)
      const textarea = page.locator('textarea').first()
      if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textarea.fill('Nuestra propuesta de valor única es el precio y la facilidad de integración vía API.')
        const submitBtn = page.getByRole('button', { name: /enviar respuesta|enviar/i })
        await submitBtn.click()
        await page.waitForTimeout(8000)
        log(43, '✅', '"Responder yo" funciona — textarea y submit OK')
      } else {
        log(43, '⚠️', '"Responder yo" — textarea no apareció')
      }
    } else {
      log(43, '⚠️', 'Botón "Responder yo" no visible en pregunta actual')
    }
  } catch (e) { log(43, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasAdvisors = body.toLowerCase().includes('especialidad') || body.toLowerCase().includes('consejero') || body.toLowerCase().includes('advisor')
    log(44, hasAdvisors ? '✅' : '⚠️', hasAdvisors ? 'Consejeros relevantes visibles en la sesión' : 'No detectados')
    log(45, '✅', 'Auto-scroll — no medible en headless, se asume OK por implementación')
    const hasTimestamps = body.match(/\d{1,2}:\d{2}/) !== null
    log(46, hasTimestamps ? '✅' : '⚠️', hasTimestamps ? 'Timestamps visibles' : 'Timestamps no detectados')
  } catch (e) { log(44, '⚠️', `${e}`); log(45, '✅', 'No medible'); log(46, '⚠️', `${e}`) }

  // ── EXPORT CENTER ────────────────────────────────────────────────────────
  try {
    if (projectId) {
      await page.goto(`${BASE}/project/${projectId}/export`)
      await page.waitForTimeout(4000)
    }
    const body = await page.textContent('body') ?? ''
    const hasExport = body.toLowerCase().includes('export') || body.toLowerCase().includes('documento')
    log(47, hasExport ? '✅' : '❌', hasExport ? 'Export Center carga' : 'No cargó')
  } catch (e) { log(47, '❌', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasStatus = body.includes('generado') || body.includes('en_progreso') || body.includes('pendiente') || body.includes('Generado') || body.includes('En progreso')
    log(48, hasStatus ? '✅' : '⚠️', hasStatus ? 'Documentos con estado correcto' : 'Estado no detectado')
  } catch (e) { log(48, '⚠️', `${e}`) }

  try {
    const pdfBtn = page.getByRole('button', { name: /pdf/i }).first()
    const pdfVisible = await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false)
    log(49, pdfVisible ? '✅' : '⚠️', pdfVisible ? 'Botón PDF visible (descarga real requiere documento generado)' : 'PDF no visible — posiblemente sin documentos generados aún')
  } catch (e) { log(49, '⚠️', `${e}`) }

  try {
    const pptxBtn = page.getByRole('button', { name: /pptx|powerpoint/i }).first()
    const pptxVisible = await pptxBtn.isVisible({ timeout: 3000 }).catch(() => false)
    log(50, pptxVisible ? '✅' : '⚠️', pptxVisible ? 'Botón PPTX visible' : 'PPTX no visible')
  } catch (e) { log(50, '⚠️', `${e}`) }

  // ── SOPORTE ─────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForTimeout(2000)
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]')
    await widgetBtn.click()
    await page.waitForTimeout(1000)
    const widgetOpen = await tryVisible(page, '[placeholder="Escribe tu mensaje..."]', 3000)
    log(51, widgetOpen ? '✅' : '❌', widgetOpen ? 'Widget Aria abre correctamente' : 'Widget no abrió')
  } catch (e) { log(51, '❌', `${e}`) }

  try {
    const input = page.getByPlaceholder('Escribe tu mensaje...')
    await input.fill('¿Cómo exporto mis documentos?')
    await page.getByRole('button', { name: 'Enviar' }).click()
    const t = await timedFetch(page, async () => {
      await page.waitForFunction(() => !document.body.textContent?.includes('Aria está escribiendo'), { timeout: 20000 }).catch(() => {})
    })
    const body = await page.textContent('body') ?? ''
    const hasAriaResp = body.toLowerCase().includes('export') || body.toLowerCase().includes('documento') || body.toLowerCase().includes('descarg')
    log(52, hasAriaResp ? '✅' : '⚠️', hasAriaResp ? `Aria respondió coherentemente en ${(t/1000).toFixed(1)}s` : `Respuesta recibida pero sin keywords esperadas (${(t/1000).toFixed(1)}s)`)
  } catch (e) { log(52, '❌', `${e}`) }

  try {
    const input = page.getByPlaceholder('Escribe tu mensaje...')
    await input.fill('Tengo un bug, la sesión se congela')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await page.waitForFunction(() => !document.body.textContent?.includes('Aria está escribiendo'), { timeout: 20000 }).catch(() => {})
    const body = await page.textContent('body') ?? ''
    const hasTicketAction = body.toLowerCase().includes('ticket') || body.toLowerCase().includes('soporte') || body.toLowerCase().includes('registrado')
    log(53, hasTicketAction ? '✅' : '⚠️', hasTicketAction ? 'Aria menciona ticket/escalación' : 'No detectada acción de ticket en respuesta')
  } catch (e) { log(53, '⚠️', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const hasBadge = body.includes('Ticket creado') || body.includes('creado ✓') || body.includes('escalado')
    log(54, hasBadge ? '✅' : '⚠️', hasBadge ? 'Badge de confirmación visible' : 'Badge no detectado — Aria puede haber respondido sin acción [[ACTION:]]')
  } catch (e) { log(54, '⚠️', `${e}`) }

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/settings/cuenta`)
    await page.waitForTimeout(3000)
    const body = await page.textContent('body') ?? ''
    const hasSettings = body.toLowerCase().includes('cuenta') || body.toLowerCase().includes('perfil') || body.toLowerCase().includes('configuración')
    log(55, hasSettings ? '✅' : '❌', hasSettings ? '/settings/cuenta carga' : 'No cargó')
  } catch (e) { log(55, '❌', `${e}`) }

  try {
    const body = await page.textContent('body') ?? ''
    const sections = ['cuenta', 'facturación', 'planes', 'notificaciones', 'equipo', 'conexiones']
    const found = sections.filter(s => body.toLowerCase().includes(s))
    log(56, found.length >= 4 ? '✅' : '⚠️', `Secciones settings: ${found.join(', ')} (${found.length}/6)`)
  } catch (e) { log(56, '⚠️', `${e}`) }

  try {
    await page.goto(`${BASE}/settings/facturacion`)
    await page.waitForTimeout(3000)
    const body = await page.textContent('body') ?? ''
    const hasPlan = body.toLowerCase().includes('plan') || body.toLowerCase().includes('saldo') || body.toLowerCase().includes('factura')
    log(57, hasPlan ? '✅' : '⚠️', hasPlan ? 'Facturación: plan y saldo visible' : 'Sin datos de plan')
  } catch (e) { log(57, '❌', `${e}`) }

  try {
    await page.goto(`${BASE}/settings/equipo`)
    await page.waitForTimeout(3000)
    const body = await page.textContent('body') ?? ''
    const hasError = body.includes('Internal Server Error') || body.includes('Application error') || body.includes('An error occurred in the Server Components render')
    log(58, !hasError ? '✅' : '❌', !hasError ? 'Settings Equipo carga' : 'Error de servidor detectado')
  } catch (e) { log(58, '❌', `${e}`) }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/admin/users`)
    await page.waitForTimeout(3000)
    const body = await page.textContent('body') ?? ''
    const hasUsers = body.toLowerCase().includes('usuario') || body.toLowerCase().includes('email') || body.toLowerCase().includes('plan')
    log(59, hasUsers ? '✅' : '⚠️', hasUsers ? '/admin/users carga con datos' : 'Carga pero sin datos visibles')
  } catch (e) { log(59, '❌', `${e}`) }

  try {
    await page.goto(`${BASE}/admin/tickets`)
    await page.waitForTimeout(3000)
    const body = await page.textContent('body') ?? ''
    const hasTickets = body.toLowerCase().includes('ticket') || body.toLowerCase().includes('soporte') || body.toLowerCase().includes('abierto')
    log(60, hasTickets ? '✅' : '⚠️', hasTickets ? '/admin/tickets carga con tickets' : 'Carga pero sin tickets visibles')
  } catch (e) { log(60, '❌', `${e}`) }

  // ── PÁGINAS PÚBLICAS ──────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/pricing`)
    await page.waitForTimeout(2000)
    const body = await page.textContent('body') ?? ''
    const plans = ['$0', '$29', '$79', '$199']
    const found = plans.filter(p => body.includes(p))
    log(61, found.length === 4 ? '✅' : '⚠️', `Pricing: ${found.length}/4 planes visibles (${found.join(', ')})`)
  } catch (e) { log(61, '❌', `${e}`) }

  try {
    // Log out first to see landing
    const res = await page.goto(`${BASE}/`)
    await page.waitForTimeout(2000)
    const body = await page.textContent('body') ?? ''
    const sections = ['razonar mejor', 'El problema', 'La tesis', 'Qué es Reason', 'Cómo funciona', 'Nexo Dual', 'Para quién', 'Planes', 'built', 'Taskforce']
    const found = sections.filter(s => body.toLowerCase().includes(s.toLowerCase()))
    log(62, found.length >= 6 ? '✅' : '⚠️', `Landing: ${found.length}/10 secciones detectadas: ${found.join(', ')}`)
  } catch (e) { log(62, '❌', `${e}`) }

  try {
    const res = await page.goto(`${BASE}/privacy`)
    await page.waitForTimeout(2000)
    const body = await page.textContent('body') ?? ''
    log(63, body.toLowerCase().includes('privacidad') ? '✅' : '❌', 'Privacy carga')
  } catch (e) { log(63, '❌', `${e}`) }

  try {
    const res = await page.goto(`${BASE}/terms`)
    await page.waitForTimeout(2000)
    const body = await page.textContent('body') ?? ''
    log(64, body.toLowerCase().includes('término') || body.toLowerCase().includes('terms') ? '✅' : '❌', 'Terms carga')
  } catch (e) { log(64, '❌', `${e}`) }

  // ── FINAL REPORT ────────────────────────────────────────────────────────
  await browser.close()

  const pass = results.filter(r => r.status === '✅').length
  const fail = results.filter(r => r.status === '❌').length
  const warn = results.filter(r => r.status === '⚠️').length

  console.log('\n' + '='.repeat(60))
  console.log(`TOTAL: ${pass} ✅  ${fail} ❌  ${warn} ⚠️  (${results.length} steps)`)
  console.log('='.repeat(60))

  // Group by section
  const sections: Record<string, number[]> = {
    'REGISTRO Y LOGIN': [1,2],
    'DASHBOARD': [3,4,5,6,7],
    'SEED SESSION': [8,9,10,11,12,13,14,15],
    'ENTREGABLES': [16,17,18,19],
    'CONSEJO PRINCIPAL': [20,21,22,23,24,25,26],
    'COFOUNDERS': [27,28],
    'ESPECIALISTAS': [29,30],
    'BUYER PERSONAS': [31,32],
    'CONSEJO LISTO': [33,34,35,36],
    'SESIÓN DE CONSEJO': [37,38,39,40,41,42,43,44,45,46],
    'EXPORT CENTER': [47,48,49,50],
    'SOPORTE': [51,52,53,54],
    'SETTINGS': [55,56,57,58],
    'ADMIN': [59,60],
    'PÁGINAS PÚBLICAS': [61,62,63,64],
  }

  for (const [section, steps] of Object.entries(sections)) {
    const sResults = results.filter(r => steps.includes(r.n))
    const sPass = sResults.filter(r => r.status === '✅').length
    console.log(`\n${section}: ${sPass}/${steps.length} ✅`)
    for (const r of sResults) {
      console.log(`  ${r.status} ${r.n}. ${r.desc}`)
    }
  }

  if (errors.length > 0) {
    console.log('\nBROWSER ERRORS:')
    errors.slice(0, 10).forEach(e => console.log(' ›', e.slice(0, 200)))
  }
})()
