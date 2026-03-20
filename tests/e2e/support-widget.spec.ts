import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const TEST_EMAIL = 'test-e2e-78@taskforce.fyi';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Support Widget', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  });

  test('Widget button visible on dashboard', async ({ page }) => {
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    await expect(widgetBtn).toBeVisible({ timeout: 5000 });
  });

  test('Widget opens with Aria greeting', async ({ page }) => {
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    await widgetBtn.click();
    await page.waitForTimeout(500);
    // Aria greeting should be visible
    await expect(page.getByText(/Soy Aria/i)).toBeVisible({ timeout: 5000 });
  });

  test('Widget has chat input', async ({ page }) => {
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    await widgetBtn.click();
    await page.waitForTimeout(500);
    await expect(page.getByPlaceholder('Escribe tu mensaje...')).toBeVisible({ timeout: 5000 });
  });

  test('Can send a message to Aria', async ({ page }) => {
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    await widgetBtn.click();
    await page.waitForTimeout(500);

    const chatInput = page.getByPlaceholder('Escribe tu mensaje...');
    await chatInput.fill('¿Cómo funciona la Sesión de Consejo?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    // Should show loading indicator
    await expect(page.getByText(/Aria está escribiendo/i)).toBeVisible({ timeout: 3000 });

    // Should receive a response (wait up to 20s for Claude)
    await expect(page.getByText(/Aria está escribiendo/i)).not.toBeVisible({ timeout: 20000 });
    // At least 2 messages visible (greeting + response)
    const messages = page.locator('.max-w-\\[75\\%\\]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Widget not visible on public pages (pricing)', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(2000);
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    const visible = await widgetBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // Widget should NOT appear on public pages (not in dashboard layout)
    console.log('Widget on pricing page:', visible);
    expect(visible).toBeFalsy();
  });

  test('Widget can be closed', async ({ page }) => {
    const widgetBtn = page.locator('button[aria-label="Abrir soporte"]');
    await widgetBtn.click();
    await page.waitForTimeout(300);
    // Close button inside panel
    await page.getByText('✕').last().click();
    // Panel should be gone
    await expect(page.getByPlaceholder('Escribe tu mensaje...')).not.toBeVisible({ timeout: 3000 });
  });
});
