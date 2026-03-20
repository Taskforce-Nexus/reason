import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'test-e2e-78@taskforce.fyi';
const ADMIN_PASSWORD = 'TestPassword123!';

test.describe('Admin Panel', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  });

  test('Admin Users page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
    expect(page.url()).toContain('/admin');
  });

  test('Admin Revenue page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/revenue`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
    expect(page.url()).toContain('/admin');
  });

  test('Admin API Usage page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/api-usage`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('Admin Marketplace page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/marketplace`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('Admin Tickets page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/tickets`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('Admin Features page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/features`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('Non-admin cannot access admin without login', async ({ browser }) => {
    // Use a fresh browser context with no session cookies
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/users`);
    await page.waitForTimeout(3000);
    // Should redirect to login, not stay on /admin/users
    expect(page.url()).not.toContain('/admin/users');
    await ctx.close();
  });
});
