import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000, // 2 minutos por test — las llamadas a Claude son lentas
  expect: { timeout: 30000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: false, // queremos VER qué pasa
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  outputDir: 'test-results',
})
