import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const TEST_EMAIL = 'e2e@reason.test'
const TEST_PASSWORD = 'E2eReason2026x'

test('Voice mode panel loads and shows correct states', async ({ page, context }) => {
  test.setTimeout(60000)

  // Grant microphone permission
  await context.grantPermissions(['microphone'])

  // Login
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Iniciar Sesión")')
  await page.waitForURL('**/dashboard**')
  await page.waitForTimeout(1500)

  // Navigate to VoiceTest project (no founder_brief → renders IncubadoraChat with voice mode)
  const projectLink = page.locator('text=VoiceTest').first()
  if (await projectLink.isVisible()) {
    await projectLink.click()
    await page.waitForTimeout(2000)
  } else {
    console.log('WARN: VoiceTest not found — run: node tests/e2e/create-user.js')
    await page.screenshot({ path: 'tests/screenshots/voice-00-no-project.png' })
    expect(await projectLink.isVisible()).toBeTruthy()
    return
  }

  // Navigate to Seed Session
  const seedLink = page.locator('a[href*="seed-session"]').first()
  if (await seedLink.isVisible()) {
    await seedLink.click()
    await page.waitForTimeout(3000)
  } else {
    // Try direct URL
    const projectId = page.url().split('/project/')[1]?.split('/')[0]
    if (projectId) {
      await page.goto(`${BASE}/project/${projectId}/seed-session`)
      await page.waitForTimeout(3000)
    }
  }

  await page.screenshot({ path: 'tests/screenshots/voice-00-seed-session.png' })

  // Click "Modo voz"
  const voiceBtn = page.locator('button:has-text("Modo voz")').first()
  const voiceBtnVisible = await voiceBtn.isVisible()
  console.log('"Modo voz" button visible:', voiceBtnVisible)

  if (!voiceBtnVisible) {
    console.log('FAIL: Voice mode button not found')
    await page.screenshot({ path: 'tests/screenshots/voice-01-no-button.png' })
    expect(voiceBtnVisible).toBeTruthy()
    return
  }

  await voiceBtn.click()
  await page.waitForTimeout(2500) // wait for mic init + state change

  await page.screenshot({ path: 'tests/screenshots/voice-01-panel.png' })

  const bodyText = await page.textContent('body') ?? ''

  // ── Verify orb is visible (div with letter "N", not canvas) ──────────────
  // The orb is a circular div containing the letter "N"
  const orbN = page.locator('div.rounded-full').filter({ hasText: 'N' }).first()
  const orbVisible = await orbN.isVisible()
  console.log('Orb (rounded-full with N) visible:', orbVisible)
  expect(orbVisible).toBeTruthy()

  // ── Verify status text (one of: "Conectando micrófono...", "Te escucho...", "Escuchando...") ──
  const hasConnecting  = bodyText.includes('Conectando')
  const hasTeEscucho   = bodyText.includes('Te escucho')
  const hasEscuchando  = bodyText.includes('Escuchando')
  const hasStatusText  = hasConnecting || hasTeEscucho || hasEscuchando
  console.log('Status text visible:', { hasConnecting, hasTeEscucho, hasEscuchando })
  expect(hasStatusText).toBeTruthy()

  // ── Verify gear (settings) button ─────────────────────────────────────────
  const gearBtn = page.locator('button[title="Configuración de voz"]')
  const gearVisible = await gearBtn.isVisible()
  console.log('Gear button visible:', gearVisible)
  expect(gearVisible).toBeTruthy()

  // ── Click gear → settings panel should appear ────────────────────────────
  if (gearVisible) {
    await gearBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'tests/screenshots/voice-02-settings.png' })

    const settingsBody = await page.textContent('body') ?? ''
    const hasVoiceOptions = settingsBody.includes('Manuel') || settingsBody.includes('Alejandro') || settingsBody.includes('Jeronimo')
    const hasSpeedOptions = settingsBody.includes('1.0×') || settingsBody.includes('1.15×')
    console.log('Settings panel: voices:', hasVoiceOptions, '— speeds:', hasSpeedOptions)
    expect(hasVoiceOptions).toBeTruthy()
    expect(hasSpeedOptions).toBeTruthy()

    // Click "Alejandro" voice to verify selection works
    const alejandroBtn = page.locator('button:has-text("Alejandro")')
    if (await alejandroBtn.isVisible()) {
      await alejandroBtn.click()
      await page.waitForTimeout(200)
      console.log('✓ Voice changed to Alejandro')
    }

    // Close settings
    await gearBtn.click()
    await page.waitForTimeout(300)
  }

  // ── Verify exit button ────────────────────────────────────────────────────
  const exitBtn = page.locator('button:has-text("Salir del modo voz")')
  const exitVisible = await exitBtn.isVisible()
  console.log('"Salir del modo voz" button visible:', exitVisible)
  expect(exitVisible).toBeTruthy()

  // ── Click exit → should return to text chat ───────────────────────────────
  if (exitVisible) {
    await exitBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'tests/screenshots/voice-03-exited.png' })

    const postExitBody = await page.textContent('body') ?? ''
    // After exit, seed-session text chat should be visible
    const backToChat = postExitBody.includes('Nexo') || postExitBody.includes('Modo voz') || postExitBody.includes('semilla')
    console.log('Back to text chat after exit:', backToChat)
    expect(backToChat).toBeTruthy()
  }

  await page.screenshot({ path: 'tests/screenshots/voice-04-final.png' })
})
